import { access, readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const files = [
  "README.md",
  "AGENTS.md",
  ...(await readdir("docs")).filter((file) => file.endsWith(".md")).map((file) => `docs/${file}`),
];
for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/\]\(([^\s)]+)\)/g)) {
    const href = match[1].split("#")[0];
    if (!href || /^(?:https?:|mailto:|\/)/.test(href)) continue;
    await access(resolve(dirname(file), href));
  }
}
console.log(`Checked local links in ${files.length} documentation files.`);
