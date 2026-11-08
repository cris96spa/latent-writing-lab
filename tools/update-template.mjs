import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, rmdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// Brings a project created from the template up to date with the template's later changes.
//
// A project made with "Use this template" starts from a single commit with no history in common
// with the template, so Git cannot tell which template changes the project already has. This
// command grafts the project's first commit onto the template commit it was created from (or
// last synced to), so the template's newer commits become an ordinary merge. It squash-merges
// them into an `update-template` branch, records the new reference in package.json, and pushes
// the branch for review. The graft and the temporary remote are always removed.
const DEFAULT_TEMPLATE_URL = "https://github.com/cris96spa/latent-writing-lab.git";
const UPDATE_BRANCH = "update-template";
// A temporary remote, named so it cannot clash with one the project already uses.
const REMOTE = "update-template-source";
// The article belongs to the project: template changes to these paths are never applied.
const PROJECT_PATHS = ["app/src/content", "e2e/article.spec.ts", "README.md"];

const root = fileURLToPath(new URL("../", import.meta.url));
const packagePath = join(root, "package.json");

const git = (...args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const gitStatus = (...args) => spawnSync("git", args, { cwd: root, stdio: "inherit" }).status;
const succeeds = (...args) => spawnSync("git", args, { cwd: root, stdio: "ignore" }).status === 0;
// The project's own article, test and README stay exactly as the last commit has them, even
// where the template changed or deleted them: restore what the commit holds, and delete only
// the files the merge itself added there, never untracked files of the author's.
function keepProjectPaths() {
  const merged = new Set(
    git("ls-files", "--", ...PROJECT_PATHS)
      .split("\n")
      .filter(Boolean),
  );
  const committed = new Set(
    git("ls-tree", "-r", "--name-only", "HEAD", "--", ...PROJECT_PATHS)
      .split("\n")
      .filter(Boolean),
  );
  git("rm", "-r", "-q", "--cached", "--force", "--ignore-unmatch", "--", ...PROJECT_PATHS);
  const present = PROJECT_PATHS.filter((path) => succeeds("cat-file", "-e", `HEAD:${path}`));
  if (present.length) git("checkout", "HEAD", "--", ...present);
  for (const path of merged) {
    if (committed.has(path)) continue;
    rmSync(join(root, path), { force: true });
    // Remove the folders the deletion emptied, up to the project path itself.
    for (let folder = dirname(path); folder !== "."; folder = dirname(folder)) {
      const full = join(root, folder);
      try {
        if (PROJECT_PATHS.includes(folder) || readdirSync(full).length) break;
        rmdirSync(full);
      } catch {
        break;
      }
    }
  }
}

const unmerged = () => git("diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);

// Record the template commit the project now matches, so the next update starts from it.
async function record(template) {
  const manifest = JSON.parse(await readFile(packagePath, "utf8"));
  manifest.template = template;
  await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
  git("add", "package.json");
}

function push(base) {
  if (gitStatus("push", "--set-upstream", "origin", UPDATE_BRANCH) !== 0) {
    stop(`The update is committed on '${UPDATE_BRANCH}', but pushing it failed; push it by hand.`);
  }
  console.log(
    `Pushed '${UPDATE_BRANCH}'. Open a pull request into '${base}', and review it like any change.`,
  );
}

// Failures throw rather than exit, so the `finally` blocks always remove the graft and remote.
class Stop extends Error {}
const stop = (message) => {
  throw new Stop(message);
};

try {
  await update();
} catch (error) {
  console.error(error instanceof Stop ? error.message : error);
  process.exitCode = 1;
}

async function update() {
  const pkg = JSON.parse(await readFile(packagePath, "utf8"));
  const recorded = pkg.template ?? {};
  const { values } = parseArgs({
    options: {
      "template-url": {
        type: "string",
        short: "u",
        default: recorded.repository ?? DEFAULT_TEMPLATE_URL,
      },
      branch: { type: "string", short: "b", default: recorded.branch },
      commit: { type: "string", short: "c", default: recorded.commit },
    },
  });
  const templateUrl = values["template-url"];

  // --- Preconditions -------------------------------------------------------------------------

  const sameRepository = (a, b) =>
    a
      .replace(/^git@([^:]+):/, "https://$1/")
      .replace(/\.git$/, "")
      .toLowerCase() ===
    b
      .replace(/^git@([^:]+):/, "https://$1/")
      .replace(/\.git$/, "")
      .toLowerCase();
  const originUrl = succeeds("remote", "get-url", "origin")
    ? git("remote", "get-url", "origin")
    : "";
  if (!originUrl)
    stop("The project needs an `origin` remote, to which the update branch is pushed.");
  if (sameRepository(originUrl, templateUrl)) {
    stop("This is the template itself; run make update-template in a project created from it.");
  }
  if (git("replace", "--list")) {
    stop(
      "Leftover graft commits would distort the update. List them with `git replace --list`, " +
        "remove them with `git replace -d <commit>`, then try again.",
    );
  }

  let branch = values.branch;
  if (!branch) {
    // The template's default branch, as its HEAD names it.
    const head = git("ls-remote", "--symref", templateUrl, "HEAD");
    branch = head.match(/^ref: refs\/heads\/(\S+)\s+HEAD/m)?.[1];
    if (!branch) stop(`Could not read the default branch of ${templateUrl}.`);
  }
  const branches = git("ls-remote", "--heads", templateUrl)
    .split("\n")
    .map((line) => line.replace(/^.*refs\/heads\//, ""));
  if (!branches.includes(branch)) {
    stop(`The template has no branch '${branch}'. Its branches are: ${branches.join(", ")}.`);
  }

  const base = succeeds("symbolic-ref", "refs/remotes/origin/HEAD")
    ? git("symbolic-ref", "refs/remotes/origin/HEAD").replace(/^refs\/remotes\/origin\//, "")
    : git("rev-parse", "--abbrev-ref", "HEAD");
  const firstCommit = git("rev-list", "--max-parents=0", "--first-parent", `origin/${base}`)
    .split("\n")
    .pop();
  if (!firstCommit)
    stop(`Could not find the first commit of origin/${base}; push the branch first.`);

  if (git("status", "--porcelain", "--untracked-files=no")) {
    stop("Commit or stash your changes first; the update starts from a clean working tree.");
  }
  // Kept inside .git, so it is never committed.
  const statePath = join(git("rev-parse", "--absolute-git-dir"), "update-template.json");
  const current = git("rev-parse", "--abbrev-ref", "HEAD");
  const resuming = current === UPDATE_BRANCH;
  if (resuming) {
    // Re-running after resolving conflicts: continue on the same branch.
    console.log(`Continuing on '${UPDATE_BRANCH}'.`);
  } else {
    if (current !== base) stop(`Switch to '${base}' first; the update starts from it.`);
    if (gitStatus("pull", "--ff-only") !== 0) stop(`Could not update '${base}' with git pull.`);
    if (gitStatus("switch", "-c", UPDATE_BRANCH) !== 0) {
      stop(`Could not create '${UPDATE_BRANCH}'; delete the existing branch of that name first.`);
    }
  }

  // A run that stopped on conflicts saved the template commit it reached. Once the conflicts are
  // resolved and committed, the update is complete: record that commit and push, without
  // merging again.
  if (resuming && existsSync(statePath)) {
    const state = JSON.parse(await readFile(statePath, "utf8"));
    await record(state);
    if (git("diff", "--staged", "--name-only")) {
      git("commit", "-m", `chore: update from template ${state.commit.slice(0, 7)}`);
    }
    rmSync(statePath);
    return push(base);
  }
  rmSync(statePath, { force: true });

  // --- Merge the template's changes ------------------------------------------------------------

  let conflicts = [];
  let reference = values.commit;
  let latest;
  if (succeeds("remote", "get-url", REMOTE)) {
    stop(`A remote named '${REMOTE}' already exists; remove or rename it, then try again.`);
  }
  git("remote", "add", REMOTE, templateUrl);
  try {
    git("remote", "set-url", "--push", REMOTE, "DISABLE");
    if (gitStatus("fetch", "--no-tags", REMOTE, branch) !== 0)
      stop("Fetching the template failed.");
    if (!reference) {
      // First update: the template commit current when the project was created.
      const created = git("log", "--reverse", "--format=%cI", `origin/${base}`).split("\n")[0];
      reference = git("rev-list", "-n", "1", `--before=${created}`, `${REMOTE}/${branch}`);
      if (!reference) stop("Could not estimate the template commit; pass it with --commit.");
      console.log(`Estimated the template commit the project started from: ${reference}`);
    }
    git("replace", "--graft", firstCommit, reference);
    try {
      const merge = spawnSync("git", ["merge", "--squash", "--no-commit", `${REMOTE}/${branch}`], {
        cwd: root,
        encoding: "utf8",
      });
      const report = merge.stdout + merge.stderr;
      // A failed merge with nothing left unmerged never started, for example because an
      // untracked file is in the way. Stop before recording a template commit never applied.
      if (merge.status !== 0 && !unmerged().length)
        stop(`Git could not merge the template:\n${report}`);
      // Git reports conflicts in the project's own paths too; those are resolved next, so show
      // its report only if real conflicts remain.
      keepProjectPaths();
      conflicts = unmerged();
      if (conflicts.length) process.stderr.write(report);
      latest = git("rev-parse", `${REMOTE}/${branch}`);
    } finally {
      if (!succeeds("replace", "-d", firstCommit)) {
        console.error(
          `Could not remove the temporary graft of ${firstCommit}; remove it with ` +
            "`git replace -d` before pushing.",
        );
      }
    }
  } finally {
    if (!succeeds("remote", "remove", REMOTE)) {
      console.error(`Could not remove the temporary '${REMOTE}' remote; remove it by hand.`);
    }
  }

  if (conflicts.length) {
    // package.json may be among the conflicts, so record the template commit once they are
    // resolved, on the next run.
    await writeFile(statePath, JSON.stringify({ repository: templateUrl, branch, commit: latest }));
    stop(
      `The template's changes conflict with the project in:\n  ${conflicts.join("\n  ")}\n` +
        "Resolve them, stage and commit the result, then run make update-template again.",
    );
  }
  await record({ repository: templateUrl, branch, commit: latest });
  if (git("diff", "--staged", "--name-only")) {
    git("commit", "-m", `chore: update from template ${latest.slice(0, 7)}`);
  } else if (!resuming) {
    // Nothing new: leave no empty branch behind.
    git("switch", "-q", base);
    git("branch", "-D", UPDATE_BRANCH);
    console.log("The project already has every change from the template.");
    return;
  }
  push(base);
}
