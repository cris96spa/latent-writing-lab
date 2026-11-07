# Latent Writing Lab

This is an Astro + MDX writing workspace based on
[research-article-template](https://github.com/tfrere/research-article-template).
Read `docs/authoring.md` before editing content or figures.

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
Do not publish a site, package or container unless requested. CI builds artifacts only.
Documentation describes present behavior, with no migration narrative. Use Conventional
Commits if asked to commit. Keep project rules consistent with the native template.
