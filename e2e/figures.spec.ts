import { expect, test } from "@playwright/test";
import { collectErrors, serveLocalD3 } from "./support";

serveLocalD3();

test("routing conserves weight and preserves ranking across temperature changes", async ({
  page,
}) => {
  const errors = collectErrors(page);
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
  const previous = page.getByRole("button", { name: "Previous", exact: true });
  await previous.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(previous).toBeDisabled();
  // Focus moves to Next instead of falling back to the page.
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
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
