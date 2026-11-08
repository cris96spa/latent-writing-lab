import { execFileSync } from "node:child_process";
import { access, cp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Replaces the template's demonstration article with a one-chapter starter. Only the paths and
// bibliography records listed in tools/demo.json are removed; the files and references the
// documentation pages use are not listed, so `make doc` keeps working.
const root = fileURLToPath(new URL("../", import.meta.url));
const at = (path) => join(root, path);
const exists = (path) =>
  access(at(path)).then(
    () => true,
    () => false,
  );
const stop = (message) => {
  console.error(message);
  process.exit(1);
};

if (!(await exists("app/src/content/chapters/demo"))) {
  console.log("The demo is already removed.");
  process.exit(0);
}
// The entry file is still the template's only while it imports demo chapters and nothing else.
// A commented-out import does not count: MDX imports start a line, comments do not.
const entry = await readFile(at("app/src/content/article.mdx"), "utf8");
const chapters = [...entry.matchAll(/^import\s+\w+\s+from\s+["']\.\/chapters\/([^"']+)["']/gm)].map(
  (match) => match[1],
);
const own = chapters.filter((chapter) => !chapter.startsWith("demo/"));
if (own.length || !chapters.length) {
  stop(
    `article.mdx ${own.length ? `imports your own chapters (${own.join(", ")})` : "no longer imports the demo"}, so it holds your own article. Remove the demo files listed in tools/demo.json by hand.`,
  );
}
if (await exists("app/src/content/chapters/intro.mdx")) {
  stop(
    "app/src/content/chapters/intro.mdx already exists, and the starter chapter would replace it.",
  );
}
const paths = ["app/src/content", "e2e"];
let changes;
try {
  changes = execFileSync("git", ["status", "--porcelain", "--", ...paths], {
    cwd: root,
    encoding: "utf8",
  });
} catch {
  stop("make demo-remove needs Git, so that the removal can be reviewed and undone.");
}
if (changes.trim()) {
  stop(
    "Commit or stash your changes in app/src/content and e2e first, so the removal can be reviewed and undone with Git.",
  );
}

const demo = JSON.parse(await readFile(at("tools/demo.json"), "utf8"));
let removed = 0;
for (const path of demo.remove) {
  if (!(await exists(path))) continue;
  await rm(at(path), { recursive: true, force: true });
  removed += 1;
}

await cp(at("tools/starter/article.mdx"), at("app/src/content/article.mdx"));
await cp(at("tools/starter/chapters/intro.mdx"), at("app/src/content/chapters/intro.mdx"));
await cp(at("tools/starter/article.spec.ts"), at("e2e/article.spec.ts"));

// Drop the demonstration's records and keep everything else: your own records, and comment
// lines such as `% Datasets` section headers, which never belong to the record above them.
const references = new Set(demo.references);
const bibliography = await readFile(at("app/src/content/bibliography.bib"), "utf8");
const lines = [];
let dropping = false;
let dropped = 0;
for (const line of bibliography.split(/\r?\n/)) {
  if (line.startsWith("@")) {
    dropping = references.has(line.match(/^@\w+\{([^,\s]+)/)?.[1]);
    if (dropping) dropped += 1;
  } else if (line.startsWith("%")) dropping = false;
  if (!dropping) lines.push(line);
}
await writeFile(
  at("app/src/content/bibliography.bib"),
  lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n",
);

console.log(`Removed ${removed} demo paths and ${dropped} references.

Your article is app/src/content/article.mdx with one chapter, chapters/intro.mdx, and its test
is e2e/article.spec.ts. Run npm run dev to see it. Nothing is committed: review the change with
git status, or undo it with:

  git restore --source=HEAD --staged --worktree -- ${paths.join(" ")}
  git clean -fd -- ${paths.join(" ")}`);
