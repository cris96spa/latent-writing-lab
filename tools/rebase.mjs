import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The engine writes root-relative addresses, such as /scripts/color-palettes.js, and figures
// fetch data from /data/. A site served under a subpath, as GitHub Pages serves a project
// site under /<repository>/, needs both prefixed. Astro's --base prefixes its own assets;
// this prefixes the rest in the built HTML and scripts, so the engine's files stay untouched.
// The runtime rewrite runs first: the attribute rewrite then skips what is already prefixed.
export async function rebase(directory, prefix) {
  let count = 0;
  const files = (await readdir(directory, { recursive: true })).filter((file) =>
    /\.(html|js)$/.test(file),
  );
  // Public folders that figures and bundled scripts load from at run time.
  const runtime = /(["'`]|&#34;|&#39;|&quot;)\/(data|scripts)\//g;
  for (const file of files) {
    const path = join(directory, file);
    const source = await readFile(path, "utf8");
    let next = source.replace(runtime, (_match, quote, folder) => {
      count += 1;
      return `${quote}${prefix}${folder}/`;
    });
    if (file.endsWith(".html")) {
      next = next.replace(/\b(src|href)="(\/(?!\/)[^"]*)"/g, (match, attribute, url) => {
        if (url.startsWith(prefix) || url === prefix.slice(0, -1)) return match;
        count += 1;
        return `${attribute}="${prefix}${url.slice(1)}"`;
      });
    }
    if (next !== source) await writeFile(path, next);
  }
  const pages = files.filter((file) => file.endsWith(".html")).length;
  console.log(`Prefixed ${count} root-relative addresses in ${pages} pages with ${prefix}.`);
}

export function normalizeBase(value) {
  return `/${(value || "").replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [directory, base] = process.argv.slice(2);
  if (!directory || !base) throw new Error("Usage: node tools/rebase.mjs <directory> <base>");
  await rebase(directory, normalizeBase(base));
}
