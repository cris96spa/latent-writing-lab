import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const d3File = resolve(dirname(require.resolve("d3")), "../dist/d3.min.js");

// Serve the installed upstream D3 dependency at its CDN URL so tests do not rely
// on a third-party network. Production continues to use the native CDN loader.
test.beforeEach(async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: await readFile(d3File) });
  });
});

test("complete upstream demo renders its chapters and local assets", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bringing paper to life:");
  await expect(page.locator("html")).toHaveAttribute("data-template", "article");
  for (const name of [
    "Introduction",
    "Getting Started",
    "Writing your content",
    "Markdown",
    "Components",
    "Vibe coding charts",
    "Import from LaTeX",
    "Import from Notion",
    "Writing Tips",
    "Greetings",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeAttached();
  }
  await expect(page.locator(".d3-galaxy svg")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("article.png") });
  // This chart is also missing from the pinned upstream Space; other embeds must resolve.
  await expect(page.locator(".html-embed__error")).toHaveCount(1);
  await expect(page.locator(".html-embed__error")).toContainText("d3-hf-citations.html");
  const images = page.locator('img[src^="/_astro/"]');
  expect(await images.count()).toBeGreaterThan(0);
  await images.evaluateAll((nodes) => {
    for (const node of nodes) (node as HTMLImageElement).loading = "eager";
  });
  await expect
    .poll(() =>
      images.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  const fonts = await request.get("/data/typography_data.json");
  expect(fonts.ok()).toBe(true);
  expect((await fonts.json()).fonts.length).toBeGreaterThan(0);
  const loss = await request.get("/data/attention_loss.csv");
  expect(loss.ok()).toBe(true);
  expect(await loss.text()).toMatch(/^run_name,tokens,loss/);
  const plot = page.locator("path.function-curve");
  await plot.scrollIntoViewIfNeeded();
  await expect(plot).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("demo-charts.png") });
});

test("routing conserves weight and preserves ranking across temperature changes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/figures/routing/");
  await expect(page.getByRole("button", { name: "Reset figure" })).toBeVisible();
  for (const k of [1, 2, 3, 4]) {
    for (const temperature of [0.2, 1, 2]) {
      await page.getByRole("slider", { name: "Active experts (k)" }).fill(String(k));
      await page
        .getByRole("slider", { name: "Temperature", exact: true })
        .fill(String(temperature));
      const values = await page
        .locator(".routing-value")
        .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("data-weight"))));
      expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      expect(values.filter((value) => value > 0)).toHaveLength(k);
      expect(
        values
          .map((value, i) => ({ value, i }))
          .sort((a, b) => b.value - a.value)
          .slice(0, k)
          .map(({ i }) => i),
      ).toEqual([0, 3, 1, 2].slice(0, k));
    }
  }
  await page.getByRole("button", { name: "Reset figure" }).click();
  await expect(page.locator(".routing-value").first()).toHaveText("59.9%");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".routing-steps")).toContainText("Keep the top-k");
  expect(errors).toEqual([]);
});

test("standalone embed is responsive and follows upstream dark mode", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/figures/routing/");
  await expect(page.locator(".d3-routing svg")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("slider", { name: "Temperature", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("slider", { name: "Temperature", exact: true })).toHaveValue("1.1");
  await page.screenshot({ path: testInfo.outputPath("routing-mobile-dark.png"), fullPage: true });
});

test("native function plotter changes its expression", async ({ page }) => {
  await page.goto("/figures/function-plotter/");
  const input = page.getByRole("textbox");
  await expect(input).toBeVisible();
  const curve = page.locator("path.function-curve");
  const originalCurve = await curve.getAttribute("d");
  await input.fill("sin(x)");
  await expect(input).toHaveValue("sin(x)");
  await expect(curve).toBeVisible();
  await expect(curve).not.toHaveAttribute("d", originalCurve!);
});

test("a host page can embed the same figure without a framework adapter", async ({ page }) => {
  await page.setContent(
    '<iframe title="Routing example" src="http://127.0.0.1:8080/figures/routing/" style="width: 100%; height: 700px"></iframe>',
  );
  const figure = page.frameLocator('iframe[title="Routing example"]');
  await figure.getByRole("slider", { name: "Active experts (k)" }).fill("1");
  await expect(figure.locator(".routing-value").first()).toHaveText("100.0%");
});

test("routing retains a publication summary without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8080/figures/routing/");
  await expect(page.getByText(/Expert 1 receives 59.9%/)).toBeVisible();
  await context.close();
});
