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
