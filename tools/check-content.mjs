import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const provenance = JSON.parse(await readFile(new URL("template-provenance.json", root), "utf8"));
for (const [file, expected] of Object.entries(provenance.upstreamFiles)) {
  const actual = createHash("sha256")
    .update(await readFile(new URL(file, root)))
    .digest("hex");
  assert.equal(
    actual,
    expected,
    `Upstream implementation changed: ${file}. Review and record the change.`,
  );
}

const figures = JSON.parse(await readFile(new URL("app/src/content/figures.json", root), "utf8"));
for (const [name, figure] of Object.entries(figures)) {
  assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const field of ["src", "title", "description", "lang"]) {
    assert.equal(typeof figure[field], "string", `${name}.${field} must be text`);
    assert.ok(figure[field].trim(), `${name}.${field} must not be empty`);
  }
  assert.ok(figure.src.endsWith(".html"), `${name}.src must identify an HTML embed`);
  const embedRoot = new URL("app/src/content/embeds/", root);
  const embed = new URL(figure.src, embedRoot);
  assert.ok(
    embed.href.startsWith(embedRoot.href),
    `${name}.src must stay inside the embeds directory`,
  );
  assert.ok((await readFile(embed, "utf8")).trim(), `Empty embed: ${fileURLToPath(embed)}`);
}
console.log(
  `Verified ${Object.keys(provenance.upstreamFiles).length} upstream files and ${Object.keys(figures).length} standalone figures. Astro validates and compiles MDX during build.`,
);
