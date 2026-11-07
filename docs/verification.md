# Verification

Each check answers a different question, and none of them answers all of them. A build proves
the article compiles, not that its figures respond; a browser test proves the figures respond,
not that the exported PDF reads well. The table lists what each command verifies and when to
run it.

| Command              | Verifies                                                                                                           | Run it                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `npm run check`      | Template files match their pinned hashes, `figures.json` is valid, project files are formatted, the article builds | after any change                             |
| `npm run docs:check` | Relative links resolve in the README, `AGENTS.md`, the writing skill and `docs/`                                   | after documentation changes                  |
| `make doc-check`     | `docs:check`, then a build of the guide into `docs-dist/`                                                          | after documentation or figure changes        |
| `npm run test:e2e`   | The behavior of the built article and guide in Chromium                                                            | after content, figure or integration changes |

## Browser tests

`npm run test:e2e` serves the production builds of the article, on port 8080, and the guide,
on port 8033, and tests them in Chromium. It does not build them, so run `npm run build` and
`make doc-check` first, and install Chromium once with `npx playwright install chromium`.
Outside CI, the tests reuse a preview server that is already running, which means a build
older than your last edit gets tested unless you rebuild.

`e2e/article.spec.ts` covers the full upstream demonstration with its local images and data,
the routing figure's invariants (the weights sum to one, and temperature preserves their
ranking), keyboard control, the standalone figure pages in dark mode and at phone width, a host
page embedding a figure, and the routing summary without JavaScript. `e2e/docs.spec.ts` covers
the guide's live figures, its first-article walkthrough, the theme toggle at phone width and
the link to a standalone figure.

The tests serve the installed D3 package in place of the CDN copy, so their results do not
depend on the network. The deployed site loads D3 and other libraries from CDNs, which needs a
separate check against the live page.

## CI

GitHub CI runs the reusable `.github/actions/validation` action on Node 22 and 24 for pushes,
pull requests and manual runs. The action performs a clean install, `npm run check`,
`npm run docs:check`, a guide build and the browser tests. Actions are pinned to commits, jobs
have read-only access to the repository, and a new run cancels superseded runs on the same
branch. Each job uploads the article build, the guide build and the Playwright report, which
are kept for 14 days. CI never deploys a site, publishes a package or pushes a container. Its
layout follows
[python-repo-template](https://github.com/cris96spa/python-repo-template/tree/bb9485eaefb7c264e265ace293024547a3404695/.github).

## What stays manual

A passing build and passing tests say nothing about publication quality or scientific claims.
Before publishing, build the article, then run the exports you need: PDF export needs
Chromium and LaTeX export needs Pandoc. Inspect page breaks, formulas, captions and the
publication state of each figure, since exports have no controls. Review sources and
assumptions in the pull request.
