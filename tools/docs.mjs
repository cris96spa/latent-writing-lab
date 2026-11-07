import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { access, cp, mkdir, readdir, rm, stat } from "node:fs/promises";
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
  `guide-${command}${command === "build" ? "" : `-${process.pid}`}`,
);
const content = join(stage, "src/content");
const output = join(root, "docs-dist");
if (command === "preview") {
  await access(join(output, "index.html")).catch(() => {
    throw new Error("Build the guide first with npm run docs:build.");
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
await rm(join(content, "chapters"), { recursive: true, force: true });
await cp(join(docs, "chapters"), join(content, "chapters"), { recursive: true });
await cp(join(docs, "article.mdx"), join(content, "article.mdx"));
// Figures used only by the guide live in docs/embeds and join the article's embeds in the copy.
// A shared name would silently replace an article figure, so it stops the guide instead.
const guideEmbeds = join(docs, "embeds");
for (const entry of await readdir(guideEmbeds, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const name = relative(guideEmbeds, join(entry.parentPath ?? entry.path, entry.name));
  if (
    await access(join(app, "src/content/embeds", name)).then(
      () => true,
      () => false,
    )
  ) {
    throw new Error(`docs/embeds/${name} has the same name as an article embed; rename it.`);
  }
}
await cp(guideEmbeds, join(content, "embeds"), { recursive: true });

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
      .catch((error) => console.error("Guide source update failed:", error));
  });
  watchers.push(watcher);
}

if (command === "dev") {
  mirror(
    docs,
    content,
    (name) =>
      name === "article.mdx" ||
      name === "chapters" ||
      name.startsWith(`chapters${sep}`) ||
      name.startsWith(`embeds${sep}`),
  );
  for (const folder of ["embeds", "assets"]) {
    mirror(join(app, "src/content", folder), join(content, folder));
  }
}

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
child.on("exit", (code, signal) => {
  for (const watcher of watchers) watcher.close();
  process.exitCode = code ?? (signal === "SIGINT" || signal === "SIGTERM" ? 0 : 1);
});
