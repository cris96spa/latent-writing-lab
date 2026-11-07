import { execFileSync } from "node:child_process";
import { access, cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Replaces the template's demonstration article with a one-chapter starter. Only the paths in
// tools/demo.json are removed; the figures, images, data and references the documentation
// pages use stay, so `make doc` keeps working.
const root = fileURLToPath(new URL("../", import.meta.url));
const at = (path) => join(root, path);
const exists = (path) =>
  access(at(path)).then(
    () => true,
    () => false,
  );

if (!(await exists("app/src/content/chapters/demo"))) {
  console.log("The demo is already removed.");
  process.exit(0);
}
const entry = await readFile(at("app/src/content/article.mdx"), "utf8");
if (!entry.includes("./chapters/demo/")) {
  console.error(
    "article.mdx no longer imports the demo, so it holds your own article. Remove the demo files listed in tools/demo.json by hand.",
  );
  process.exit(1);
}
const changes = execFileSync("git", ["status", "--porcelain", "--", "app/src/content", "e2e"], {
  cwd: root,
  encoding: "utf8",
});
if (changes.trim()) {
  console.error(
    "Commit or stash your changes in app/src/content and e2e first, so the removal can be reviewed and undone with Git.",
  );
  process.exit(1);
}

const { remove } = JSON.parse(await readFile(at("tools/demo.json"), "utf8"));
let removed = 0;
for (const path of remove) {
  if (!(await exists(path))) continue;
  await rm(at(path), { recursive: true, force: true });
  removed += 1;
}

await cp(at("tools/starter/article.mdx"), at("app/src/content/article.mdx"));
await cp(at("tools/starter/chapters/intro.mdx"), at("app/src/content/chapters/intro.mdx"));
await cp(at("tools/starter/article.spec.ts"), at("e2e/article.spec.ts"));

// Keep the references the documentation pages cite; the demo's own go with it.
const pages = await readdir(at("docs/pages"));
const cited = new Set();
for (const page of pages.filter((name) => name.endsWith(".mdx"))) {
  const source = await readFile(at(`docs/pages/${page}`), "utf8");
  for (const [, key] of source.matchAll(/\[@([^\]\s;,]+)\]/g)) cited.add(key);
}
const bibliography = await readFile(at("app/src/content/bibliography.bib"), "utf8");
const records = bibliography.split(/^(?=@)/m).filter((record) => record.startsWith("@"));
const kept = records.filter((record) => cited.has(record.match(/^@\w+\{([^,]+),/)?.[1]));
await writeFile(
  at("app/src/content/bibliography.bib"),
  kept.map((r) => r.trim()).join("\n\n") + "\n",
);

console.log(`Removed ${removed} demo paths and ${records.length - kept.length} references.

Your article is app/src/content/article.mdx with one chapter, chapters/intro.mdx, and its test
is e2e/article.spec.ts. Run npm run dev to see it. Nothing is committed: review the change
with git status, or undo it with git restore . && git clean -fd app/src/content/chapters.`);
