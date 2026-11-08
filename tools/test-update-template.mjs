import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Exercises `make update-template` end to end on throwaway repositories: a template, and a
// project created from a snapshot of it, as GitHub's "Use this template" does. The fixtures
// bring their own content, so the test passes whatever state this checkout's article is in.
const root = fileURLToPath(new URL("../", import.meta.url));
const work = mkdtempSync(join(tmpdir(), "update-template-"));
const templateUrl = `file://${join(work, "template.git")}`;
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
const update = (cwd) =>
  spawnSync(process.execPath, ["tools/update-template.mjs", "-u", templateUrl], {
    cwd,
    env,
    encoding: "utf8",
  });
const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const replaceIn = (path, from, to) =>
  writeFileSync(path, readFileSync(path, "utf8").replace(from, to));
const record = (cwd, ref) => JSON.parse(git(cwd, "show", `${ref}:package.json`)).template;
const finishBranch = (project) => {
  git(project, "switch", "-q", "main");
  git(project, "merge", "-q", "update-template");
  git(project, "branch", "-q", "-D", "update-template");
  git(project, "push", "-q", "origin", "main", ":update-template");
};
const noLeftovers = (project) => {
  assert.equal(git(project, "replace", "--list"), "", "no graft left");
  assert.equal(git(project, "remote"), "origin\ntemplate", "only the project's own remotes");
};

try {
  // The template's first commit: this checkout's files, without a project's own record.
  const template = join(work, "template");
  const project = join(work, "project");
  const files = git(root, "ls-files", "--cached", "--others", "--exclude-standard").split("\n");
  for (const target of [template, project]) {
    for (const file of files.filter((name) => existsSync(join(root, name)))) {
      mkdirSync(join(target, dirname(file)), { recursive: true });
      cpSync(join(root, file), join(target, file));
    }
    const manifest = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
    delete manifest.template;
    writeFileSync(join(target, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    write(join(target, "app/src/content/chapters/fixture.mdx"), "## A template example\n");
  }
  git(template, "init", "-q", "-b", "development");
  git(template, "add", "-A");
  commit(template, "template v1", "2026-01-01T10:00:00");
  git(work, "clone", "-q", "--bare", template, "template.git");
  const publish = (message, date) => {
    git(template, "add", "-A");
    commit(template, message, date);
    git(template, "push", "-q", templateUrl, "development");
  };

  // A project created from that snapshot, with a history of its own and an unrelated remote
  // that happens to be called `template`.
  git(project, "init", "-q", "-b", "main");
  git(project, "add", "-A");
  commit(project, "Initial commit", "2026-01-02T10:00:00");
  git(work, "clone", "-q", "--bare", project, "project.git");
  git(project, "remote", "add", "origin", join(work, "project.git"));
  git(project, "remote", "add", "template", "https://example.com/unrelated.git");
  git(project, "fetch", "-q", "origin");
  git(project, "branch", "-q", "-u", "origin/main");
  git(project, "remote", "set-head", "origin", "main");
  // The author deletes the example and writes their own README.
  rmSync(join(project, "app/src/content/chapters/fixture.mdx"));
  appendFileSync(join(project, "README.md"), "\nMy own project.\n");
  git(project, "add", "-A");
  commit(project, "my article", "2026-01-03T10:00:00");
  git(project, "push", "-q", "origin", "main");

  // The template changes a tool, adds one, and edits its example and README.
  appendFileSync(join(template, "tools/rebase.mjs"), "// template v2\n");
  write(join(template, "tools/new-tool.mjs"), "// a new template tool\n");
  appendFileSync(join(template, "app/src/content/chapters/fixture.mdx"), "v2\n");
  appendFileSync(join(template, "README.md"), "\nv2\n");
  publish("template v2", "2026-01-04T10:00:00");

  // An untracked file in the way makes Git refuse the merge: the update stops, records nothing
  // and leaves nothing temporary behind.
  write(join(project, "tools/new-tool.mjs"), "// the author's own file\n");
  let result = update(project);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /Git could not merge the template/);
  assert.equal(record(project, "HEAD"), undefined, "nothing recorded");
  noLeftovers(project);
  assert.equal(git(project, "remote", "get-url", "template"), "https://example.com/unrelated.git");

  // With the file moved away, running again completes the first update. The tool change and
  // the new tool arrive; the project's own content and README stay as they are.
  rmSync(join(project, "tools/new-tool.mjs"));
  result = update(project);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(git(project, "show", "update-template:tools/rebase.mjs"), /template v2/);
  assert.match(git(project, "show", "update-template:tools/new-tool.mjs"), /new template tool/);
  assert.match(git(project, "show", "update-template:README.md"), /My own project/);
  assert.doesNotMatch(git(project, "show", "update-template:README.md"), /^v2$/m);
  assert.doesNotMatch(
    git(project, "ls-tree", "--name-only", "update-template", "app/src/content/chapters/"),
    /fixture\.mdx/,
  );
  assert.equal(record(project, "update-template").commit, git(template, "rev-parse", "HEAD"));
  noLeftovers(project);
  finishBranch(project);

  // Template and project then change the same lines of a tool and of package.json.
  appendFileSync(join(template, "tools/pages.mjs"), "// template v3\n");
  replaceIn(join(template, "package.json"), /"version": "[^"]*"/, '"version": "9.0.0"');
  publish("template v3");
  appendFileSync(join(project, "tools/pages.mjs"), "// project edit\n");
  replaceIn(join(project, "package.json"), /"version": "[^"]*"/, '"version": "1.2.3"');
  git(project, "add", "-A");
  commit(project, "project edits");
  git(project, "push", "-q", "origin", "main");

  // The conflicts stop the update and are listed; package.json is among them.
  result = update(project);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /tools\/pages\.mjs/);
  assert.match(result.stderr, /package\.json/);
  noLeftovers(project);

  // Resolved and committed (keeping the project's side of package.json), a second run records
  // the template commit and pushes, without merging again.
  const resolve = (path, keep) =>
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace(
        /^<<<<<<<[^\n]*\n([\s\S]*?)^=======\n([\s\S]*?)^>>>>>>>[^\n]*\n/gm,
        (_, ours, theirs) => (keep === "both" ? ours + theirs : ours),
      ),
    );
  resolve(join(project, "tools/pages.mjs"), "both");
  resolve(join(project, "package.json"), "ours");
  git(project, "add", "-A");
  commit(project, "Resolve the template update");
  result = update(project);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(record(project, "update-template").commit, git(template, "rev-parse", "HEAD"));
  assert.match(git(project, "show", "update-template:package.json"), /"version": "1\.2\.3"/);
  noLeftovers(project);
  finishBranch(project);

  // With every change in, a further run finds nothing and leaves no branch behind.
  result = update(project);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /already has every change/);
  assert.equal(git(project, "branch", "--list", "update-template"), "");
  console.log(
    "make update-template: blocked merge, first update, conflicts, resume and no-op all behave.",
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
