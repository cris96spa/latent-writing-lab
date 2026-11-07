import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const d3File = resolve(dirname(require.resolve("d3")), "../dist/d3.min.js");
const pages: { file: string; label: string }[] = JSON.parse(
  readFileSync(new URL("../docs/pages/pages.json", import.meta.url), "utf8"),
);
test.use({ baseURL: "http://127.0.0.1:8033" });

test.beforeEach(async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: await readFile(d3File) });
  });
});

test("every documentation page renders and the navigation reaches all of them", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Latent Writing Lab");
  for (const [i, { label }] of pages.entries()) {
    await page
      .getByRole("navigation", { name: "Documentation" })
      .getByRole("link", { name: label })
      .click();
    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link")).toHaveCount(pages.length);
    const pager = page.getByRole("navigation", { name: "Previous and next page" });
    if (i + 1 < pages.length) {
      await expect(pager.getByRole("link", { name: new RegExp(pages[i + 1].label) })).toBeVisible();
    }
    // Scroll through the page so every lazily mounted figure starts.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 800) await page.evaluate((top) => scrollTo(0, top), y);
    await expect(page.locator(".html-embed__error")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("the overview shows a live figure and the quick start", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const showcase = page.locator("figure#docs-showcase");
  await showcase.scrollIntoViewIfNeeded();
  await expect(showcase.locator("canvas").first()).toBeVisible();
  const project = page
    .locator("details")
    .filter({ has: page.getByText("Start your own article project", { exact: true }) });
  await expect(project).not.toHaveAttribute("open");
  await expect(
    page.locator("pre", { hasText: 'import Intro from "./chapters/intro.mdx"' }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("docs-overview.png") });
});

test("the rules figure highlights where each rule applies", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const figure = page.locator("figure#docs-rules");
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
  await page.screenshot({ path: testInfo.outputPath("docs-rules.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(root).toHaveAttribute("data-layout", "narrow");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("writing examples render math and citations", async ({ page }) => {
  await page.goto("/writing/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".katex").first()).toBeVisible();
  await expect(page.locator("body")).toContainText("Attention Is All You Need");
});

test("interactive figures respond, load data and embed in a frame", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/interactive-figures/", { waitUntil: "domcontentloaded" });
  const plotter = page.locator("figure#docs-plotter");
  const curve = plotter.locator("path.function-curve");
  await expect(curve).toBeVisible();
  const before = await curve.getAttribute("d");
  await plotter.getByRole("textbox").fill("sin(2*x)");
  await expect(curve).not.toHaveAttribute("d", before!);
  const routing = page.locator("figure#docs-routing");
  await routing.scrollIntoViewIfNeeded();
  await routing.getByRole("slider", { name: "Active experts (k)" }).fill("1");
  await expect(routing.locator(".routing-value").first()).toHaveText("100.0%");
  // The chart reads its CSV from a path relative to the page.
  const chart = page.locator("figure#docs-line-chart");
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator("path.main-line").first()).toBeVisible();
  expect(await chart.locator("path.main-line").count()).toBeGreaterThan(1);
  const framed = page.frameLocator('iframe[title^="The function plotter"]');
  await page.locator('iframe[title^="The function plotter"]').scrollIntoViewIfNeeded();
  await expect(framed.locator("path.function-curve")).toBeVisible();
  await expect(framed.getByRole("textbox")).toBeVisible();
  expect(errors).toEqual([]);
});

test("documentation supports mobile reading and native theme controls", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open table of contents" }).click();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Close table of contents" }).click();
  await page.getByText("Start your own article project", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText("Use this template");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("docs-mobile.png") });
});

test("documentation reuses standalone figures and exports its own text", async ({
  page,
  request,
}) => {
  await page.goto("/interactive-figures/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Open the function plotter on its own" }).click();
  await expect(page).toHaveURL(/:8033\/figures\/function-plotter\//);
  await expect(page.getByRole("textbox")).toBeVisible();
  const text = await request.get("/llms.txt");
  expect(await text.text()).toContain("Latent Writing Lab");
  const gallery = await request.get("/dataviz/");
  expect(gallery.ok()).toBe(true);
  expect(await gallery.text()).toContain("d3-neural-network");
});
