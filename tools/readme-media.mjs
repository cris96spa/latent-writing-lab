// Records the README's animations from the built article and documentation, in light and dark themes.
// Build both first (`npm run build` and `make doc-build`), then run `npm run readme:media`.
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const SITES = {
  article: { origin: "http://127.0.0.1:8080", script: "preview" },
  docs: { origin: "http://127.0.0.1:8033", script: "docs:preview" },
};
const OUTPUT = new URL("../docs/images/", import.meta.url);
const STAGE = { width: 960, height: 540 };

// Actions a scene can take on its figure. Each returns after the figure has the new state.
const slider = (name, value) => (figure) =>
  figure.getByRole("slider", { name, exact: true }).fill(String(value));
const press = (name) => (figure) => figure.getByRole("button", { name, exact: true }).click();
const choose = (text) => async (figure) => {
  const select = figure.locator("select").first();
  const value = await select.evaluate(
    (element, wanted) => [...element.options].find((option) => option.text.includes(wanted))?.value,
    text,
  );
  await select.selectOption(value);
};
// Draws a stroke through points given as fractions of the canvas, in several moves.
const stroke =
  (points, { lift = false } = {}) =>
  async (figure) => {
    const box = await figure.locator("canvas").first().boundingBox();
    const page = figure.page();
    const at = ([x, y]) => [box.x + x * box.width, box.y + y * box.height];
    const [first, ...rest] = points.map(at);
    await page.mouse.move(...first);
    await page.mouse.down();
    for (const point of rest) await page.mouse.move(...point, { steps: 12 });
    if (lift) await page.mouse.up();
  };

// Each scene shows one figure. `steps` pairs an action with how long its result stays on screen.
const REEL = [
  {
    site: "article",
    path: "/dataviz/",
    figure: "figure#arxiv",
    label: "Embedding maps",
    steps: [[null, 2200]],
  },
  {
    site: "article",
    path: "/dataviz/",
    figure: "figure#attention-mechanisms",
    label: "Architecture diagrams",
    steps: [[null, 2200]],
  },
  {
    site: "article",
    path: "/dataviz/",
    figure: "figure#d3-neural-network",
    label: "Models readers draw into",
    steps: [
      [
        stroke([
          [0.28, 0.24],
          [0.72, 0.24],
        ]),
        500,
      ],
      [
        stroke([
          [0.72, 0.24],
          [0.56, 0.52],
        ]),
        500,
      ],
      [
        stroke(
          [
            [0.56, 0.52],
            [0.44, 0.8],
          ],
          { lift: true },
        ),
        2200,
      ],
    ],
  },
  {
    site: "article",
    path: "/dataviz/",
    figure: "figure#sankey",
    label: "Data flows",
    steps: [[null, 2200]],
  },
  {
    site: "article",
    path: "/dataviz/",
    figure: "figure#aws-bandwidth-bottleneck",
    label: "Hardware explorers",
    steps: [
      [choose("CPU ⟷ GPU"), 1400],
      [choose("via NVSwitch"), 1400],
      [choose("GPU ⟷ Storage"), 1800],
    ],
  },
  {
    site: "article",
    path: "/dataviz/",
    figure: "figure#gds-interactive-heatmaps",
    label: "Benchmark heatmaps",
    steps: [[null, 2200]],
  },
  {
    site: "docs",
    path: "/interactive-figures/",
    figure: "figure#docs-routing",
    label: "Mechanisms with knobs",
    steps: [
      [null, 900],
      [slider("Active experts (k)", 1), 900],
      [slider("Active experts (k)", 4), 900],
      [slider("Active experts (k)", 2), 500],
      [slider("Temperature", 2), 900],
      [slider("Temperature", 0.2), 1200],
    ],
  },
];
const RULES = [
  {
    site: "docs",
    path: "/",
    figure: "figure#docs-rules",
    label: "How a build works",
    steps: [
      [press("The whole flow"), 2600],
      [press("What you import is what you publish"), 3200],
      [press("Each figure has one source"), 3200],
      [press("Readers get the build"), 3200],
    ],
  },
];

// The stage frames every capture the same way: a soft backdrop, a card and a label.
function stageHtml(image, label, theme) {
  const dark = theme === "dark";
  const backdrop = dark
    ? "radial-gradient(120% 90% at 15% 0%, #2a1d17 0%, #0d1117 55%)"
    : "radial-gradient(120% 90% at 15% 0%, #fde7da 0%, #f6f4fb 55%, #ffffff 100%)";
  return `<!doctype html><html><head><style>
    * { box-sizing: border-box; margin: 0; }
    body { width: ${STAGE.width}px; height: ${STAGE.height}px; overflow: hidden;
      font-family: -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif;
      background: ${backdrop}; display: flex; flex-direction: column;
      padding: 26px 34px 30px; gap: 16px; }
    .label { display: inline-flex; align-items: center; gap: 10px; align-self: flex-start;
      font-size: 15px; font-weight: 650; color: ${dark ? "#f0f3f6" : "#1f2328"}; }
    .label i { width: 10px; height: 10px; border-radius: 50%; background: #e07a47;
      box-shadow: 0 0 0 4px ${dark ? "rgba(224,122,71,.25)" : "rgba(224,122,71,.18)"}; }
    .card { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center;
      background: ${dark ? "#161b22" : "#ffffff"}; border-radius: 18px; padding: 18px;
      border: 1px solid ${dark ? "#30363d" : "#ece8f2"};
      box-shadow: 0 18px 50px ${dark ? "rgba(0,0,0,.45)" : "rgba(63,42,88,.12)"}; }
    .card img { max-width: 100%; max-height: 100%; object-fit: contain; }
  </style></head><body>
    <div class="label"><i></i>${label}</div>
    <div class="card"><img src="data:image/png;base64,${image.toString("base64")}"></div>
  </body></html>`;
}

async function capture(browser, scenes, theme) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  const stageContext = await browser.newContext({ viewport: STAGE, colorScheme: theme });
  const stage = await stageContext.newPage();
  const page = await context.newPage();
  const frames = [];
  let loaded = "";
  for (const scene of scenes) {
    const url = `${SITES[scene.site].origin}${scene.path}`;
    if (url !== loaded) {
      await page.goto(url, { waitUntil: "networkidle" });
      loaded = url;
    }
    const figure = page.locator(scene.figure);
    await figure.scrollIntoViewIfNeeded();
    // Embeds start when they scroll into view; give their scripts and data time to finish.
    await page.waitForTimeout(2500);
    for (const [action, hold] of scene.steps) {
      if (action) await action(figure);
      await page.mouse.move(0, 0);
      // A control keeps its focus ring after it is set; readers would not see one there.
      await page.evaluate(() => document.activeElement?.blur?.());
      await page.waitForTimeout(450);
      const shot = await figure.locator(".html-embed__card").screenshot();
      await stage.setContent(stageHtml(shot, scene.label, theme));
      frames.push({ png: await stage.screenshot(), hold });
    }
  }
  await context.close();
  await stageContext.close();
  return frames;
}

// Encodes each frame as a one-frame GIF with its own palette, then joins the frames into an
// animated GIF: each frame's global colour table becomes a local one, preceded by a delay.
async function animate(frames) {
  const parts = [];
  let size;
  for (const { png, hold } of frames) {
    const gif = await sharp(png).gif({ colours: 256, effort: 10, dither: 0.6 }).toBuffer();
    const frame = readGif(gif);
    size ??= frame.size;
    if (!frame.size.equals(size)) throw new Error("Every frame must have the same size.");
    const delay = Math.round(hold / 10);
    parts.push(
      Buffer.from([0x21, 0xf9, 0x04, 0x04, delay & 0xff, delay >> 8, 0x00, 0x00]),
      frame.descriptor,
      frame.colourTable,
      frame.data,
    );
  }
  const screen = Buffer.alloc(7);
  size.copy(screen, 0);
  const loop = Buffer.from([0x21, 0xff, 0x0b, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0]);
  return Buffer.concat([Buffer.from("GIF89a"), screen, loop, ...parts, Buffer.from([0x3b])]);
}

// Splits a one-frame GIF into the pieces an animated GIF needs.
function readGif(gif) {
  const packed = gif[10];
  const tableSize = packed & 0x80 ? 3 * 2 ** ((packed & 0x07) + 1) : 0;
  const colourTable = gif.subarray(13, 13 + tableSize);
  let at = 13 + tableSize;
  while (gif[at] === 0x21) {
    at += 2;
    while (gif[at] !== 0) at += gif[at] + 1;
    at += 1;
  }
  if (gif[at] !== 0x2c) throw new Error("Expected an image descriptor in the encoded frame.");
  const descriptor = Buffer.from(gif.subarray(at, at + 10));
  if (descriptor[9] & 0x80) throw new Error("Expected the frame's colours in its global table.");
  descriptor[9] = 0x80 | (descriptor[9] & 0x40) | (packed & 0x07);
  let end = at + 11;
  while (gif[end] !== 0) end += gif[end] + 1;
  return {
    size: gif.subarray(6, 10),
    colourTable,
    descriptor,
    data: gif.subarray(at + 10, end + 1),
  };
}

const servers = Object.values(SITES).map(({ script }) =>
  spawn("npm", ["run", script], { stdio: "ignore", detached: true }),
);
// A server that exits at once usually found its port taken. Another site answering on that
// port would then be recorded instead, so stop rather than wait for it.
let exited = null;
for (const [i, server] of servers.entries()) {
  server.once("exit", () => (exited ??= Object.values(SITES)[i].origin));
}
try {
  for (const { origin } of Object.values(SITES)) {
    for (let attempt = 0; ; attempt += 1) {
      if (exited) throw new Error(`The server for ${exited} stopped; is its port already in use?`);
      if (
        await fetch(origin).then(
          (response) => response.ok,
          () => false,
        )
      )
        break;
      if (attempt > 60)
        throw new Error(`${origin} did not start; build the article and documentation.`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  const browser = await chromium.launch();
  for (const [name, scenes] of [
    ["hero", REEL],
    ["rules", RULES],
  ]) {
    for (const theme of ["light", "dark"]) {
      const frames = await capture(browser, scenes, theme);
      const gif = await animate(frames);
      await writeFile(new URL(`${name}-${theme}.gif`, OUTPUT), gif);
      console.log(`docs/images/${name}-${theme}.gif: ${frames.length} frames, ${gif.length} bytes`);
    }
  }
  await browser.close();
} finally {
  for (const server of servers) {
    try {
      process.kill(-server.pid);
    } catch {
      // Already stopped.
    }
  }
}
