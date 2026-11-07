# Authoring

The native research article template is the publishing engine. Use its components,
frontmatter and export scripts directly. The upstream
[documentation](https://tfrere-research-article-template-site.hf.space/docs) and
[agent skills](../.ai/skills/create-html-embed/SKILL.md) describe the available capabilities.

## Articles

Put metadata and chapter imports in `app/src/content/article.mdx`. Write chapters
in `app/src/content/chapters/`. Use native MDX imports, components, Markdown,
LaTeX math, and citations such as `[@hf-moe]`. References belong in
`app/src/content/bibliography.bib`.

This is one article per project, with `article` and `paper` layouts. The complete
article is served at `/`. There is no draft flag or automatic translation layer:
everything imported by the article is built. Keep unfinished chapters unimported.
MDX is executable repository source; review it as code.

Do not invent authors, affiliations, sources, DOIs or empirical measurements. Set
the article's language consistently in prose and labels. The upstream article shell
uses English; additional shell localization is an explicit extension.

## Native figures

Read the upstream [embed skill](../.ai/skills/create-html-embed/SKILL.md) and its
[full directives](../.ai/skills/create-html-embed/directives.md). Each visualization
lives in one HTML file under `app/src/content/embeds/`. Use a root element, scoped
styles, and an IIFE script. Native `HtmlEmbed` handles the wrapper and script mounting.

Use theme variables and `window.ColorPalettes`, accessible HTML controls, SVG or
Canvas graphics, instance-local state, and responsive layout. Data belongs in
`app/src/content/assets/data/`, exposed by the native `/data/` symlink. `HtmlEmbed`
accepts `data` and `config` props when a visualization needs configuration.

The routing example separates its pure calculation from the render function. Its
publication state is top-k two, temperature one, with normalized weights displayed.
Reset restores that state. Its static HTML summary remains available without JavaScript.
The matrix, function plotter and decorative banner are attributed upstream examples.
They illustrate capabilities, not experiments.

For a new figure, provide this brief:

```text
Read AGENTS.md and the upstream HTML embed skill and directives.
Teaching claim and audience: ...
Data, source and simplifying assumptions: ...
Controls, ranges and defaults: ...
Static publication state: ...
Use native HtmlEmbed, theme variables and palettes.
Keep the model separate from rendering and test its invariants.
Use one embed source for the article and any standalone figure page.
```

Standalone routes are optional. Register their source, title, description and language
in `app/src/content/figures.json`. New article-only embeds need no registry entry.

## Latent Space homepage example

Open `/figures/forward-pass/` for the detailed homepage hero. Its single source is
`app/src/content/embeds/d3-forward-pass.html`; use
`<HtmlEmbed src="d3-forward-pass.html" frameless wide />` in an MDX chapter.
The registry's optional `frameless` property lets a figure supply its own heading
and card. Another website can reuse the standalone URL in an iframe.

The embed includes the original deterministic storyboard, desktop and compact SVG
layouts, playback, token IDs, output highlighting and theme-aware colors. Its scoped
palette and bundled Inter/JetBrains Mono fonts preserve Latent Space's design.
The fixed tokenizer snapshot and source attribution live in
`app/src/content/assets/data/forward-pass/`. Editing the prompt or biography requires
recapturing its tokenization; this example does not provide live inference.

The article uses `config={{ autoplay: false }}` to start at the completed biography,
so the native exporter can capture a deterministic frame before printing. The standalone
page autoplays when visible. Reduced motion starts at the completed biography. Readers can still scrub manually.
Printing selects the completed text state and restores the interactive state afterward.
`npm run test:models` checks the shipped storyboard's scientific invariants.

## Checks and exports

Run `npm run check` and `npm run test:e2e` after figure or integration changes.
Run `npm run docs:check` for documentation. Build, export PDF, and inspect it when
publication output changes. Upstream PDF/LaTeX/image exporters own conversion;
avoid introducing another article renderer or export pipeline.
