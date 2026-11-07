import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { normalizeBase, rebase } from "./rebase.mjs";

// Builds the site GitHub Pages publishes, for the subpath Pages serves it under. A project
// created from the template publishes its article; the starter itself publishes its docs.
const root = fileURLToPath(new URL("../", import.meta.url));
const [site, baseValue] = process.argv.slice(2);
if (!["article", "docs"].includes(site) || !baseValue) {
  throw new Error("Usage: npm run pages:build -- article|docs /<repository>/");
}
const base = normalizeBase(baseValue);
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (site === "docs") {
  run(process.execPath, ["tools/docs.mjs", "build", "--base", base]);
} else {
  run("npm", ["run", "build", "--workspace", "research-article-template", "--", "--base", base]);
  if (base !== "/") await rebase(`${root}app/dist`, base);
}
