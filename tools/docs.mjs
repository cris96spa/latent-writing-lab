import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const app = join(root, "app");
const docs = join(root, "docs");
const [command = "dev", ...args] = process.argv.slice(2);
if (!["dev", "build", "preview"].includes(command)) {
  throw new Error("Usage: node tools/docs.mjs dev|build|preview [Astro options]");
}

// The native engine reads content through both module imports and filesystem paths.
// An ignored working copy preserves those assumptions without swapping the author's files.
const stage = join(
  root,
  ".cache",
  `docs-${command}${command === "build" ? "" : `-${process.pid}`}`,
);
const content = join(stage, "src/content");
const output = join(root, "docs-dist");
if (command === "preview") {
  await access(join(output, "index.html")).catch(() => {
    throw new Error("Build the documentation first with npm run docs:build.");
  });
}
await rm(stage, { recursive: true, force: true });
await cp(app, stage, {
  recursive: true,
  verbatimSymlinks: true,
  filter: (source) => {
    const path = relative(app, source).split(sep);
    return !path.some(
      (part) =>
        ["node_modules", ".astro", "dist", "screenshots", "output"].includes(part) ||
        part.startsWith(".env") ||
        part.startsWith("thumb.auto.") ||
        part.endsWith(".pdf"),
    );
  },
});
// Packages resolve from the root npm workspace; Vite caches stay local to this copy.
await mkdir(join(stage, "node_modules"));
// The documentation is a set of pages, not chapters of one article. Each page in docs/pages is
// copied into chapters/: article.mdx imports index.mdx at /, and every other page is served at
// /<name>/ by a copy of the template's own article page that imports it instead.
await rm(join(content, "chapters"), { recursive: true, force: true });
await mkdir(join(content, "chapters"));
const pagesDir = join(docs, "pages");
const pages = JSON.parse(await readFile(join(pagesDir, "pages.json"), "utf8")).map((page) => ({
  ...page,
  slug: page.file === "index.mdx" ? "" : page.file.replace(/\.mdx$/, ""),
}));
const articlePage = await readFile(join(app, "src/pages/index.astro"), "utf8");
for (const needle of ['"../content/article.mdx"', '"src/content/article.mdx"']) {
  if (!articlePage.includes(needle)) {
    throw new Error(
      `The template's article page no longer reads ${needle}; update tools/docs.mjs.`,
    );
  }
}
for (const { slug } of pages.filter((page) => page.slug)) {
  const taken = await access(join(app, "src/pages", slug)).then(
    () => true,
    () =>
      access(join(app, "src/pages", `${slug}.astro`)).then(
        () => true,
        () => false,
      ),
  );
  if (taken) throw new Error(`docs/pages/${slug}.mdx would replace the site's /${slug}/ page.`);
  await writeFile(
    join(stage, "src/pages", `${slug}.astro`),
    articlePage
      .replace('"../content/article.mdx"', `"../content/chapters/${slug}.mdx"`)
      .replace('"src/content/article.mdx"', `"src/content/chapters/${slug}.mdx"`),
  );
}
// Every page gets the same navigation, so pages never link to each other by hand.
await mkdir(join(stage, "src/components/docs"), { recursive: true });
await cp(join(docs, "components"), join(stage, "src/components/docs"), { recursive: true });
await writeFile(join(stage, "src/components/docs/pages.json"), JSON.stringify(pages, null, 2));
async function writePage(file) {
  const page = pages.find((entry) => entry.file === file);
  if (!page) return;
  const source = await readFile(join(pagesDir, file), "utf8");
  const frontmatter = source.match(/^---\n[\s\S]*?\n---\n/)?.[0] ?? "";
  const nav = 'import DocsNav from "../../components/docs/DocsNav.astro";\n\n<DocsNav />\n';
  const body = `${frontmatter}\n${nav}${source.slice(frontmatter.length)}\n\n<DocsNav position="bottom" />\n`;
  await writeFile(join(content, "chapters", file), body);
  if (!page.slug) {
    const entry = `${frontmatter}\nimport Page from "./chapters/index.mdx";\n\n<Page />\n`;
    await writeFile(join(content, "article.mdx"), entry);
  }
}
for (const { file } of pages) await writePage(file);
// Figures used only by the documentation live in docs/embeds and join the article's embeds.
// A shared name would silently replace an article figure, so it stops the build instead.
const docsEmbeds = join(docs, "embeds");
for (const entry of await readdir(docsEmbeds, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const name = relative(docsEmbeds, join(entry.parentPath ?? entry.path, entry.name));
  if (
    await access(join(app, "src/content/embeds", name)).then(
      () => true,
      () => false,
    )
  ) {
    throw new Error(`docs/embeds/${name} has the same name as an article embed; rename it.`);
  }
}
await cp(docsEmbeds, join(content, "embeds"), { recursive: true });

const watchers = [];
let pending = Promise.resolve();
function mirror(sourceRoot, targetRoot, accept = () => true) {
  const watcher = watch(sourceRoot, { recursive: true }, (_event, filename) => {
    if (!filename || !accept(filename)) return;
    pending = pending
      .then(async () => {
        const source = join(sourceRoot, filename);
        const target = join(targetRoot, filename);
        const info = await stat(source).catch((error) => {
          if (error.code !== "ENOENT") throw error;
          return null;
        });
        if (!info) await rm(target, { recursive: true, force: true });
        else {
          await mkdir(dirname(target), { recursive: true });
          await cp(source, target, { recursive: info.isDirectory() });
        }
      })
      .catch((error) => console.error("Documentation source update failed:", error));
  });
  watchers.push(watcher);
}

if (command === "dev") {
  mirror(join(docs, "embeds"), join(content, "embeds"));
  mirror(join(docs, "components"), join(stage, "src/components/docs"));
  const pageWatcher = watch(pagesDir, (_event, filename) => {
    if (!filename?.endsWith(".mdx")) return;
    pending = pending
      .then(() => writePage(filename))
      .catch((error) => console.error("Documentation page update failed:", error));
  });
  watchers.push(pageWatcher);
  for (const folder of ["embeds", "assets"]) {
    mirror(join(app, "src/content", folder), join(content, folder));
  }
}

const baseArg = args.findIndex((arg) => arg === "--base" || arg.startsWith("--base="));
const baseValue =
  baseArg < 0 ? "/" : args[baseArg].includes("=") ? args[baseArg].split("=")[1] : args[baseArg + 1];
const base = `/${(baseValue || "").replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");

const astro = resolve(root, "node_modules/astro/astro.js");
const flags = command === "dev" ? [] : ["--outDir", output];
if (command !== "build") {
  flags.push("--host", "127.0.0.1");
  if (!args.some((arg) => arg === "--port" || arg.startsWith("--port="))) {
    flags.push("--port", command === "dev" ? "8031" : "8033");
  }
}
const child = spawn(process.execPath, [astro, command, ...flags, ...args], {
  cwd: stage,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error);
  for (const watcher of watchers) watcher.close();
  process.exitCode = 1;
});
child.on("exit", async (code, signal) => {
  for (const watcher of watchers) watcher.close();
  process.exitCode = code ?? (signal === "SIGINT" || signal === "SIGTERM" ? 0 : 1);
  if (command === "build" && code === 0 && base !== "/") await rebase(base);
});

// Astro prefixes its own assets with --base, but the template also writes root-relative
// links such as /scripts/color-palettes.js. Hosting under a subpath, as GitHub Pages does for
// a project site, needs those prefixed too; the engine's files stay untouched.
async function rebase(prefix) {
  let count = 0;
  const files = (await readdir(output, { recursive: true })).filter((file) =>
    file.endsWith(".html"),
  );
  for (const file of files) {
    const path = join(output, file);
    const html = await readFile(path, "utf8");
    const next = html.replace(/\b(src|href)="(\/(?!\/)[^"]*)"/g, (match, attribute, url) => {
      if (url.startsWith(prefix) || url === prefix.slice(0, -1)) return match;
      count += 1;
      return `${attribute}="${prefix}${url.slice(1)}"`;
    });
    if (next !== html) await writeFile(path, next);
  }
  console.log(`Prefixed ${count} root-relative links in ${files.length} pages with ${prefix}.`);
}
