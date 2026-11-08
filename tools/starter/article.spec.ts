import { expect, test } from "@playwright/test";
// make demo-remove copies this file to e2e/article.spec.ts, next to e2e/support.ts.
import { collectErrors, serveLocalD3 } from "./support";

serveLocalD3();

// Replace these checks as your article grows: test its title, its math, and what each of its
// figures must do when a reader operates it.
test("the article renders its title, math and figure", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("My first article");
  await expect(page.locator(".katex").first()).toBeVisible();
  await expect(page.locator(".html-embed__error")).toHaveCount(0);
  const curve = page.locator("path.function-curve");
  await expect(curve).toBeVisible();
  const before = await curve.getAttribute("d");
  await page.getByRole("textbox").fill("sin(2*x)");
  await expect(curve).not.toHaveAttribute("d", before!);
  expect(errors).toEqual([]);
});
