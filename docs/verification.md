# Verification

`npm run check` verifies pinned upstream implementation files and standalone figure
metadata, checks formatting of project-owned files, and builds with the native Astro
pipeline. `npm run docs:check` checks local documentation links.

`npm run test:e2e` runs Playwright against the production preview. Coverage includes
the full upstream demo, its local image/data assets, native embeds, standalone figures, normalization
and temperature invariants, accessible controls, narrow viewports and theme changes.
Browser tests serve the installed D3 package at the CDN URL for deterministic testing.
Production uses the template's CDN dependencies; those require a separate online check.

The upstream exporters have their own runtime requirements. PDF export needs Chromium;
LaTeX export needs Pandoc. Run `npm run build` before exports so existing output reflects
the current source. Review page breaks, formulas, captions and meaningful figure states
in each publication format. A successful web build alone does not verify publication
quality or scientific claims.

GitHub CI runs the reusable `.github/actions/validation` action on Node.js 22 and 24
for pushes, pull requests and manual runs. It follows the validation-action and runtime-matrix
structure of [python-repo-template](https://github.com/cris96spa/python-repo-template/tree/bb9485eaefb7c264e265ace293024547a3404695/.github).
The action performs a clean npm install, project checks, documentation checks and browser tests.
Actions are pinned to commit revisions, runs have read-only repository permissions, and
superseded runs on the same ref are cancelled. Each matrix job uploads its own static
build and browser reports for 14 days. It does not deploy, publish a
package or push a container. Local execution results are reported with each task;
this document describes the checks rather than claiming they have all passed.
