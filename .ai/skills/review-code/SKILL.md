---
name: review-code
description: Review a change or the repository's own code for correctness, design, tests and code health, and triage automated review comments such as Copilot's. Use when asked to review a pull request, a diff, a file or the codebase, to audit code quality, or to decide which review comments to address.
---

# Review code

A review exists to keep the code healthy over time. Approve a change once it clearly improves
the code, even if it is not perfect, and never accept one that makes the code worse. There is no
perfect code, only better code. These guidelines adapt Google's
[code review developer guide](https://google.github.io/eng-practices/review/) to this repository
and add what its own history shows goes wrong.

## Navigate the change

1. **Take the broad view first.** Read the description and decide whether the change should
   exist at all. If not, say so at once, with the reason and an alternative.
2. **Review the main part next.** Find the file with the most significant logic and review it
   first. Raise design problems immediately, before reviewing the rest, because they are the
   most expensive to fix later and can make the rest of the review moot.
3. **Then read every remaining line,** tests first when they show what the change is meant to
   do. Review every line of human-written code; generated files and data can be scanned.
4. **Look beyond the diff.** Open the whole file and the code that calls it. Ask what the change
   does to the system: does it add complexity, weaken a test, or break a caller you cannot see?

## What to look for

- **Design.** Do the pieces interact sensibly, and does the code belong here? In this
  repository, rendering, citations, theming and exports belong to the upstream engine. A local
  reimplementation of any of them is a design problem, however clean the code.
- **Functionality.** Does it do what the author intended, and is that good for its users:
  readers, authors and future maintainers? Think through edge cases and inputs the author did not
  try. For anything a reader sees, run it and look.
- **Complexity.** Can a reader understand each line, function and file quickly? Watch for
  over-engineering: generality nobody needs yet. Solve today's problem.
- **Tests.** Is the change tested in the same commit? Would each test fail if the code broke? A
  test must assert on the specific output it is about, not on the page as a whole, where an
  unrelated element can satisfy it. Test code is code: keep it simple and correct.
- **Naming.** Long enough to say what something is or does, short enough to read.
- **Comments.** Explain _why_, not _what_. Code that needs a _what_ comment usually needs to be
  simpler. Remove comments and TODOs the change makes obsolete.
- **Style and consistency.** Prettier settles formatting. Beyond that, follow the surrounding
  code; don't block on personal preference.
- **Documentation.** If the change alters how people build, test, use or publish the project,
  the README, `docs/pages/` and `AGENTS.md` change in the same commit. Removed features take
  their documentation with them.
- **Good things.** Say what is done well, and why, so it keeps being done.

## Risks specific to this repository

Check these on every review; each has caused a real defect here.

- **Ownership.** Files listed in `template-provenance.json` are upstream's and must stay
  byte-identical; `npm run check` enforces it. Local code lives in `tools/`, `e2e/`,
  `app/src/pages/figures/`, `docs/` and `.github/`.
- **Destructive commands.** Anything that deletes or overwrites files (`make demo-remove`,
  `rm` in a script) must check its preconditions on parsed structure, not substrings: a
  commented-out import still contains the text it imports. Its undo instructions must touch only
  the paths it changed, and must still work after the change is staged.
- **Text rewriting.** A regular expression over HTML matches everything that looks alike,
  including code examples a reader will copy, already-rewritten URLs, and paths that coincide
  with the prefix being added. Name what must not match, and test it.
- **Subpath hosting.** GitHub Pages serves a project under `/REPOSITORY/`. Root-relative
  addresses, absolute metadata such as canonical and social URLs, and paths a figure builds at
  run time all behave differently there. Build with `npm run pages:build` and load the result
  under a subpath before approving a change that touches addresses.
- **Figures.** Scoped styles, one mount per instance, theme colours from variables and
  palettes, labelled controls, responsive sizing, and the model kept apart from the drawing; see
  the `create-html-embed` skill. A figure's script errors are caught by the engine and only
  logged, so a test that looks for page errors does not see them.
- **Claims.** Captions and prose must describe what a figure really does: a heuristic is not a
  trained model, and illustrative values are labelled as such. Sources, authors and DOIs must be
  real.
- **CI and security.** Actions pinned to a commit, the narrowest permissions per job, no secrets
  in logs or URLs, and no new network dependency in tests. Inserting untrusted text into HTML is
  an injection risk.

## Write the review

Direct every comment at the code, not the author, and explain why it matters: the defect it
causes, the rule it breaks or the health it improves. Point out the problem and let the author
choose the fix, unless a concrete suggestion is clearly faster. Label each comment so the author
can tell what blocks the change:

| Label         | Means                                     |
| ------------- | ----------------------------------------- |
| _(no label)_  | Must be fixed before the change is merged |
| **Nit:**      | Minor; worth fixing, but does not block   |
| **Optional:** | A reasonable idea the author may decline  |
| **FYI:**      | Not for this change; useful to know later |

For a finding, give the file and line, the concrete failure (the input or state, and what goes
wrong), and the severity. When asked to explain unclear code, ask for clearer code or a comment
in the code, not an explanation in the review: future readers never see the review.

## Triage automated review comments

Tools such as Copilot find real defects, and also make confident claims that are wrong or out of
scope. Treat every comment as a hypothesis:

1. **Verify it** against the current code, by reading the lines it names and, where possible,
   reproducing the failure. A comment on an earlier revision may already be fixed.
2. **Decide**, and record the decision: fix it, decline it with the reason, or hand it to its
   owner. A defect in upstream's files or demonstration content belongs upstream; this
   repository does not patch it.
3. **Fix the class, not the instance.** If one regular expression missed a case, look for the
   other places that make the same assumption.

## Sources

- Google, [The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html),
  [What to look for](https://google.github.io/eng-practices/review/reviewer/looking-for.html),
  [Navigating a CL](https://google.github.io/eng-practices/review/reviewer/navigate.html) and
  [How to write comments](https://google.github.io/eng-practices/review/reviewer/comments.html).
