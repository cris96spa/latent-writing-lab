# Authoring

For an end-to-end example, follow [Your first article](first-article.md).
For repository creation, drafts, publishing and shared figures, see
[Project and publishing workflow](workflow.md).

The native research article template is the publishing engine. Use its components,
frontmatter and export scripts directly. The upstream
[documentation](https://tfrere-research-article-template-site.hf.space/docs) and
[agent skills](../.ai/skills/create-html-embed/SKILL.md) describe the available capabilities.

## Articles

Put metadata and chapter imports in `app/src/content/article.mdx`. Write chapters
in `app/src/content/chapters/`. Use native MDX imports, components, Markdown,
LaTeX math, and citations such as `[@hf-moe]`. References belong in
`app/src/content/bibliography.bib`.

The default entry point renders the upstream demo chapters in `chapters/demo/`.
Use them as reference examples; replace the imports with your own chapters to write.

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
The optional `frameless` property lets a standalone figure supply its own heading
and card through the native component.

## Checks and exports

Run `npm run check` and `npm run test:e2e` after figure or integration changes.
Run `npm run docs:check` for documentation. Build, export PDF, and inspect it when
publication output changes. Upstream PDF/LaTeX/image exporters own conversion;
avoid introducing another article renderer or export pipeline.
