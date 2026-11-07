import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const d3File = resolve(dirname(require.resolve("d3")), "../dist/d3.min.js");
test.use({ baseURL: "http://127.0.0.1:8033" });

test.beforeEach(async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: await readFile(d3File) });
  });
});

test("guide renders native examples and exposes the project walkthrough", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Write an interactive article");
  await expect(page.locator(".html-embed__error")).toHaveCount(0);
  const plot = page.locator("figure#guide-function");
  const curve = plot.locator("path.function-curve");
  await expect(curve).toBeVisible();
  const before = await curve.getAttribute("d");
  await plot.getByRole("textbox").fill("sin(2*x)");
  await expect(curve).not.toHaveAttribute("d", before!);
  await expect(page.locator(".katex").first()).toBeVisible();
  const tutorial = page
    .locator("details")
    .filter({ has: page.getByText("Make a first article you can run", { exact: true }) });
  await expect(tutorial).not.toHaveAttribute("open");
  await tutorial.locator("summary").click();
  await expect(tutorial.locator("pre").first()).toBeVisible();
  await expect(tutorial).toContainText('import MyArticle from "./chapters/my-article.mdx"');
  const routing = page.locator("figure#guide-routing");
  await routing.getByRole("slider", { name: "Active experts (k)" }).fill("1");
  await expect(routing.locator(".routing-value").first()).toHaveText("100.0%");
  await plot.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("guide-figure.png") });
  expect(errors).toEqual([]);
});

test("guide rules figure highlights where each rule applies", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const figure = page.locator("figure#guide-rules");
  await figure.scrollIntoViewIfNeeded();
  const root = figure.locator(".guide-three-rules");
  await expect(root).toHaveAttribute("data-rule", "all");
  await expect(root).toHaveAttribute("data-layout", "wide");
  await expect(figure.locator("[data-node]")).toHaveCount(9);
  const importRule = figure.getByRole("button", { name: "What you import is what you publish" });
  await importRule.click();
  await expect(importRule).toHaveAttribute("aria-pressed", "true");
  await expect(figure.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(figure.locator(".guide-three-rules__caption")).toContainText("draft.mdx");
  // The unimported chapter is highlighted but never connected to the entry file.
  await expect(figure.locator('[data-node="draft"]')).toHaveClass(/is-on/);
  await expect(figure.locator('[data-edge^="draft-"]')).toHaveCount(0);
  await figure.getByRole("button", { name: "Readers get the build" }).click();
  await expect(figure.locator('[data-node="preview"]')).toHaveClass(/is-on/);
  await expect(figure.locator('[data-edge="entry-preview"]')).not.toHaveClass(/is-on/);
  await page.screenshot({ path: testInfo.outputPath("guide-rules.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(root).toHaveAttribute("data-layout", "narrow");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await figure.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("guide-rules-mobile.png") });
  expect(errors).toEqual([]);
});

test("guide supports mobile reading and native theme controls", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open table of contents" }).click();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Close table of contents" }).click();
  await page.getByText("Make a first article you can run", { exact: true }).click();
  const tutorial = page.locator("details[open]");
  await expect(tutorial.locator("pre").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("guide-mobile.png") });
});

test("guide reuses standalone figures and exports its own text", async ({ page, request }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Open the same routing figure on its own" }).click();
  await expect(page).toHaveURL(/:8033\/figures\/routing\//);
  await expect(page.getByRole("slider", { name: "Active experts (k)" })).toBeVisible();
  const text = await request.get("/llms.txt");
  expect(await text.text()).toContain("Write an interactive article");
  const gallery = await request.get("/dataviz/");
  expect(gallery.ok()).toBe(true);
  expect(await gallery.text()).toContain("d3-equation-editor");
});
