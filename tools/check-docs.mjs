import { access, readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await markdownFiles(path)));
    else if (/\.mdx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

const files = [
  "README.md",
  "AGENTS.md",
  ".ai/skills/write-documentation/SKILL.md",
  ...(await markdownFiles("docs")),
];
for (const file of files) {
  // Code blocks and spans can contain example links; check the prose around them.
  const source = (await readFile(file, "utf8"))
    .replace(/^(`{3,}|~{3,}).*\n[\s\S]*?^\1\s*$/gm, "")
    .replace(/`[^`\n]+`/g, "");
  for (const match of source.matchAll(/\]\(([^\s)]+)\)/g)) {
    const href = match[1].split("#")[0];
    if (!href || /^(?:https?:|mailto:|\/)/.test(href)) continue;
    await access(resolve(dirname(file), href));
  }
}
// The overview's quick start shows the starter that `make demo-remove` writes; keep them equal.
const overview = await readFile("docs/pages/index.mdx", "utf8");
const examples = [...overview.matchAll(/^```mdx\n([\s\S]*?)^```/gm)].map((match) => match[1]);
const starter = ["tools/starter/article.mdx", "tools/starter/chapters/intro.mdx"];
for (const [i, file] of starter.entries()) {
  if (examples[i] !== (await readFile(file, "utf8"))) {
    throw new Error(`The quick start in docs/pages/index.mdx no longer matches ${file}.`);
  }
}
console.log(`Checked local links in ${files.length} documentation files and the quick start.`);
