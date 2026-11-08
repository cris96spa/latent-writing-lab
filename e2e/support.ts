import { test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const d3File = resolve(dirname(require.resolve("d3")), "../dist/d3.min.js");

// Serve the installed D3 at its CDN address, so results never depend on the network. The
// deployed site still loads D3 from the CDN.
export function serveLocalD3() {
  test.beforeEach(async ({ page }) => {
    await page.route("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", async (route) => {
      await route.fulfill({ contentType: "application/javascript", body: await readFile(d3File) });
    });
  });
}

// HtmlEmbed catches an exception in a figure's script and only logs it, so a broken figure
// raises no page error. Collect both kinds, and assert the list is empty.
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().startsWith("HtmlEmbed")) {
      errors.push(message.text());
    }
  });
  return errors;
}
