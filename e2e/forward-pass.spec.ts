import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const d3File = resolve(dirname(require.resolve("d3")), "../dist/d3.min.js");

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: await readFile(d3File) });
  });
});

test("homepage composition supports replay, real token IDs and output highlighting", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto("/figures/forward-pass/");
  const hero = page.locator(".d3-forward-pass");
  await expect(hero).toHaveAttribute("data-mounted", "true");
  await expect(hero).toHaveAttribute("data-frame", "138");
  await expect(page.getByRole("heading", { name: "Who is Cristian?" })).toBeVisible();
  await expect(hero.locator(".fp-bio-tokens")).toContainText("Hi, I'm Cristian");
  await expect(hero.locator(".fp-output-counts")).toContainText("128 tokens");
  await expect(hero.locator("svg")).toHaveAttribute("data-layout", "full");
  await page.evaluate(() => document.fonts.ready);
  await hero.screenshot({ path: info.outputPath("forward-pass-light.png") });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await hero.screenshot({ path: info.outputPath("forward-pass-dark.png") });
  await page.getByRole("radio", { name: "ids", exact: true }).check();
  await expect(hero.locator(".fp-prompt-tokens")).toContainText("8241");
  await page.getByRole("radio", { name: "text", exact: true }).check();
  await page.getByRole("button", { name: "Highlight output tokens" }).click();
  await expect(hero).toHaveAttribute("data-highlight", "false");
  await page.getByRole("slider").fill("7");
  await expect(hero).toHaveAttribute("data-phase", "prefill");
  await expect(hero.locator("[data-head]")).toHaveCount(20);
  await page.getByRole("button", { name: "Next frame" }).click();
  await expect(hero).toHaveAttribute("data-frame", "8");
  await page.getByRole("button", { name: "Previous frame" }).click();
  await expect(hero).toHaveAttribute("data-frame", "7");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(hero).toHaveAttribute("data-playing", "true");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(hero).toHaveAttribute("data-playing", "false");
  await page.getByRole("button", { name: "Skip to end" }).click();
  await expect(hero).toHaveAttribute("data-frame", "138");
  expect(errors).toEqual([]);
});

test("compact layout remains usable at phone widths and prints completed output", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/figures/forward-pass/");
  const hero = page.locator(".d3-forward-pass");
  await expect(hero).toHaveAttribute("data-mounted", "true");
  await expect(hero.locator("svg")).toHaveAttribute("data-layout", "compact");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await hero.screenshot({ path: info.outputPath("forward-pass-mobile.png") });
  await page.getByRole("slider").fill("0");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(hero).toHaveAttribute("data-frame", "138");
  await expect(hero.locator(".fp-bio-tokens")).toContainText("training loss go down");
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(hero).toHaveAttribute("data-frame", "0");
});
