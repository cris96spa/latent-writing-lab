import { access, readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import GithubSlugger from "github-slugger";

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await markdownFiles(path)));
    else if (/\.mdx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

// Code blocks and spans can contain example links; check the prose around them.
const prose = (source) =>
  source.replace(/^(`{3,}|~{3,}).*\n[\s\S]*?^\1\s*$/gm, "").replace(/`[^`\n]+`/g, "");

// The documentation site's pages, and the anchors each one offers: heading slugs, made the way
// the engine's rehype-slug makes them, and explicit ids such as figure ids.
const pages = JSON.parse(await readFile("docs/pages/pages.json", "utf8"));
const anchors = new Map();
for (const { file } of pages) {
  const source = await readFile(`docs/pages/${file}`, "utf8");
  const slugger = new GithubSlugger();
  const ids = new Set();
  for (const [, heading] of prose(source).matchAll(/^#{2,6}\s+(.+)$/gm)) {
    ids.add(slugger.slug(heading.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[`*_]/g, "")));
  }
  for (const [, id] of source.matchAll(/\bid="([^"]+)"/g)) ids.add(id);
  anchors.set(file === "index.mdx" ? "" : file.replace(/\.mdx$/, ""), ids);
}
const figures = Object.keys(JSON.parse(await readFile("app/src/content/figures.json", "utf8")));

const files = [
  "README.md",
  "AGENTS.md",
  ".ai/skills/write-documentation/SKILL.md",
  ".ai/skills/write-article/SKILL.md",
  ".ai/skills/review-code/SKILL.md",
  ...(await markdownFiles("docs")),
];
const broken = [];
for (const file of files) {
  const page = file.match(/^docs\/pages\/(.+)\.mdx$/)?.[1];
  const source = prose(await readFile(file, "utf8"));
  // Markdown links, and the HTML links the README-style pages use.
  for (const match of source.matchAll(/\]\(([^\s)]+)\)|\bhref="([^"]+)"/g)) {
    const link = match[1] ?? match[2];
    const [path, anchor] = link.split("#");
    if (/^(?:[a-z]+:|\/\/)/.test(path)) continue;
    if (page !== undefined && (path.startsWith("/") || !path)) {
      // A link between pages of the documentation site, which the site serves at /<page>/.
      const target = path ? path.replace(/^\/|\/$/g, "") : page === "index" ? "" : page;
      const known =
        anchors.has(target) ||
        target === "dataviz" ||
        figures.some((name) => target === `figures/${name}`);
      if (!known) broken.push(`${file}: ${link} names no page of the site`);
      else if (anchor && anchors.has(target) && !anchors.get(target).has(anchor)) {
        broken.push(`${file}: ${link} names no heading or id on that page`);
      }
      continue;
    }
    if (!path || path.startsWith("/")) continue;
    await access(resolve(dirname(file), path)).catch(() =>
      broken.push(`${file}: ${link} does not exist`),
    );
  }
}
if (broken.length) throw new Error(`Broken documentation links:\n${broken.join("\n")}`);

// The overview's quick start shows the starter that `make demo-remove` writes; keep them equal.
const overview = await readFile("docs/pages/index.mdx", "utf8");
const examples = [...overview.matchAll(/^```mdx\n([\s\S]*?)^```/gm)].map((match) => match[1]);
const starter = ["tools/starter/article.mdx", "tools/starter/chapters/intro.mdx"];
for (const [i, file] of starter.entries()) {
  if (examples[i] !== (await readFile(file, "utf8"))) {
    throw new Error(`The quick start in docs/pages/index.mdx no longer matches ${file}.`);
  }
}
console.log(`Checked links in ${files.length} documentation files and the quick start.`);
