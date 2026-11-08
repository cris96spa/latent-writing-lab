import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Exercises `make update-template` end to end on throwaway repositories: a template, and a
// project created from a snapshot of it, as GitHub's "Use this template" does.
const root = fileURLToPath(new URL("../", import.meta.url));
const work = mkdtempSync(join(tmpdir(), "update-template-"));
const env = {
  ...process.env,
  GIT_AUTHOR_NAME: "Test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.com",
};
const git = (cwd, ...args) => execFileSync("git", args, { cwd, env, encoding: "utf8" }).trim();
const commit = (cwd, message, date) =>
  execFileSync("git", ["commit", "-qm", message, ...(date ? ["--date", date] : [])], {
    cwd,
    env: { ...env, ...(date ? { GIT_COMMITTER_DATE: date } : {}) },
  });
const run = (cwd, script) =>
  spawnSync(
    process.execPath,
    [join("tools", script), "-u", `file://${join(work, "template.git")}`],
    {
      cwd,
      env,
      encoding: "utf8",
    },
  );

try {
  // The template's current files, as its first commit.
  const template = join(work, "template");
  const project = join(work, "project");
  const files = git(root, "ls-files", "--cached", "--others", "--exclude-standard").split("\n");
  for (const target of [template, project]) {
    for (const file of files) {
      try {
        mkdirSync(join(target, file, ".."), { recursive: true });
        cpSync(join(root, file), join(target, file));
      } catch {
        // Deleted in the working tree but still in the index.
      }
    }
  }
  git(template, "init", "-q", "-b", "development");
  git(template, "add", "-A");
  commit(template, "template v1", "2026-01-01T10:00:00");
  git(work, "clone", "-q", "--bare", template, "template.git");

  // A project created from that snapshot: one commit, a history of its own.
  git(project, "init", "-q", "-b", "main");
  git(project, "add", "-A");
  commit(project, "Initial commit", "2026-01-02T10:00:00");
  git(work, "clone", "-q", "--bare", project, "project.git");
  git(project, "remote", "add", "origin", join(work, "project.git"));
  git(project, "fetch", "-q", "origin");
  git(project, "branch", "-q", "-u", "origin/main");
  git(project, "remote", "set-head", "origin", "main");
  assert.equal(run(project, "demo-remove.mjs").status, 0, "demo-remove");
  appendFileSync(join(project, "README.md"), "\nMy own project.\n");
  git(project, "add", "-A");
  commit(project, "my article", "2026-01-03T10:00:00");
  git(project, "push", "-q", "origin", "main");

  // The template changes a tool, the demo it ships and its README.
  appendFileSync(join(template, "tools/rebase.mjs"), "// template v2\n");
  appendFileSync(join(template, "app/src/content/chapters/demo/markdown.mdx"), "\nv2\n");
  appendFileSync(join(template, "README.md"), "\nv2\n");
  git(template, "add", "-A");
  commit(template, "template v2", "2026-01-04T10:00:00");
  git(template, "push", "-q", join(work, "template.git"), "development");

  // First update: applies the tool change, keeps the project's article and README.
  let result = run(project, "update-template.mjs");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(git(project, "show", "update-template:tools/rebase.mjs"), /template v2/);
  assert.match(git(project, "show", "update-template:README.md"), /My own project/);
  assert.doesNotMatch(git(project, "show", "update-template:README.md"), /^v2$/m);
  assert.equal(git(project, "ls-tree", "update-template", "app/src/content/chapters/demo"), "");
  const recorded = JSON.parse(git(project, "show", "update-template:package.json")).template;
  assert.equal(recorded.commit, git(template, "rev-parse", "HEAD"));
  assert.equal(git(project, "replace", "--list"), "", "no graft left");
  assert.equal(git(project, "remote"), "origin", "no template remote left");

  // The update is merged; then template and project change the same line of a tool.
  git(project, "switch", "-q", "main");
  git(project, "merge", "-q", "update-template");
  git(project, "branch", "-q", "-D", "update-template");
  git(project, "push", "-q", "origin", "main", ":update-template");
  appendFileSync(join(template, "tools/pages.mjs"), "// template v3\n");
  git(template, "add", "-A");
  commit(template, "template v3");
  git(template, "push", "-q", join(work, "template.git"), "development");
  appendFileSync(join(project, "tools/pages.mjs"), "// project edit\n");
  git(project, "add", "-A");
  commit(project, "project edit");
  git(project, "push", "-q", "origin", "main");

  // A real conflict stops the update, names the file and leaves nothing temporary behind.
  result = run(project, "update-template.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /conflict with the project in:\n {2}tools\/pages\.mjs/);
  assert.equal(git(project, "replace", "--list"), "");
  assert.equal(git(project, "remote"), "origin");

  // Resolving and committing, then running again, completes the update.
  const pages = readFileSync(join(project, "tools/pages.mjs"), "utf8");
  const resolved = pages.replace(/^(<<<<<<<|=======|>>>>>>>).*\n/gm, "");
  rmSync(join(project, "tools/pages.mjs"));
  appendFileSync(join(project, "tools/pages.mjs"), resolved);
  git(project, "add", "-A");
  commit(project, "Resolve the template update");
  result = run(project, "update-template.mjs");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(
    JSON.parse(git(project, "show", "update-template:package.json")).template.commit,
    git(template, "rev-parse", "HEAD"),
  );

  // Once merged, a further run finds nothing and leaves no branch behind.
  git(project, "switch", "-q", "main");
  git(project, "merge", "-q", "update-template");
  git(project, "branch", "-q", "-D", "update-template");
  git(project, "push", "-q", "origin", "main", ":update-template");
  result = run(project, "update-template.mjs");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /already has every change/);
  assert.equal(git(project, "branch", "--list", "update-template"), "");
  console.log("make update-template: first update, conflict, resume and no-op all behave.");
} finally {
  rmSync(work, { recursive: true, force: true });
}
