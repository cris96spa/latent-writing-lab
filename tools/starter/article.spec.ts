import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const d3File = resolve(dirname(require.resolve("d3")), "../dist/d3.min.js");

// Serve the installed D3 at its CDN address, so results never depend on the network.
test.beforeEach(async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: await readFile(d3File) });
  });
});

// Replace these checks as your article grows: test its title, its math, and what each of its
// figures must do when a reader operates it.
test("the article renders its title, math and figure", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
