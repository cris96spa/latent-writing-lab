# Latent Writing Lab

This is an Astro + MDX writing workspace based on
[research-article-template](https://github.com/tfrere/research-article-template).
Read the documentation pages in `docs/pages/`, served by `make doc`, before editing content,
figures or the workspace.

## Working agreement

Ask before choosing between materially different architectures or changing a shared
contract. Explain concrete options and a recommendation. Execute decisions already
authorized in the conversation without asking again. Read-only checks and obvious
fixes can proceed directly.

## Ownership

- The upstream template owns `app/src/components`, `app/src/styles`,
  `app/src/scripts`, `app/plugins`, `app/scripts`, and the article page/configuration.
  Delegate rendering, citations, theming, downloads and publication exports to it.
- Authors own `app/src/content`: MDX chapters, BibTeX, data and HTML embeds.
- Local extensions live in `app/src/pages/figures` and `tools`. Keep them small;
  use upstream components rather than duplicating their rendering logic.
- `template-provenance.json` pins the upstream revision and implementation hashes.
  Changes to those files need explicit justification and an updated provenance record.
- Generated output belongs in `app/dist`; do not edit or commit generated artifacts.

## Authoring skills

Use the upstream skills and read their referenced guidance:

- `.ai/skills/create-html-embed/SKILL.md` for interactive figures.
- `.ai/skills/article-frontmatter/SKILL.md` for article metadata.
- `.ai/skills/deploy-to-hf-spaces/SKILL.md` for explicitly requested deployment.
- `.ai/skills/write-documentation/SKILL.md` for any prose meant for other readers: the
  README, the documentation pages, figure captions, pull requests and commit messages.

## Figures and content

HTML embeds are the visualization source of truth. Do not introduce a parallel React
figure implementation. Use native `HtmlEmbed`, theme variables and `ColorPalettes`.
Keep controls accessible, styles scoped, mounts instance-local, and layout responsive.
Separate the scientific model from rendering functions. State data sources and
simplifications; label synthetic data. Test mathematical invariants and meaningful
reader interactions. Keep a deterministic publication state for scientific figures.
Decorative upstream artwork is not experimental evidence.

MDX is trusted repository-authored executable content. Use native imports, components,
math and BibTeX citations. Never invent results, sources, author affiliations or DOIs.
Prose and labels follow the article's language; standalone pages declare their language
in `app/src/content/figures.json`.

## Verification and documentation

Run `npm run check`, `npm run docs:check`, and `npm run test:e2e` for implementation
changes. Exercise PDF export for publication changes. Report only checks actually run.
Build the native documentation with `make doc-check` before browser tests. `make doc`
serves the pages in `docs/pages/` with the same engine and shared figures in an ignored
working copy. Edit documentation in `docs/`, never generated `.cache/` or `docs-dist/` files.
Write documentation by the writing skill: lead with the reader's problem, give each
fact one home, and run every command you document. Use live examples and expandable
details in the documentation where they help the reader act.
Do not publish a site, package or container unless requested. CI never deploys the article;
on the default branch it publishes only the documentation, to GitHub Pages, once the repository's
Pages source is GitHub Actions.
Documentation describes present behavior, with no migration narrative. Use Conventional
Commits if asked to commit. Keep project rules consistent with the native template.
