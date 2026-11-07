# Authoring conventions

These conventions cover what you write in `app/src/content`: chapters, references, data and
figures. They exist because the engine compiles all of it into a public site, and because
figures make claims that readers rely on. For a walkthrough with live examples, run
`make doc`. The components and frontmatter fields the engine accepts are documented in the
[upstream documentation](https://tfrere-research-article-template-site.hf.space/docs) and in
the [frontmatter skill](../.ai/skills/article-frontmatter/SKILL.md).

## Articles

An article is defined by `app/src/content/article.mdx`: its frontmatter holds the metadata and
its body imports the chapters from `app/src/content/chapters/`. Only imported chapters become
part of the article, and everything imported is published, because the engine has no draft
flag. Keep an unfinished chapter out of the imports until it is ready to be seen.

The entry point starts out rendering the upstream demonstration chapters in `chapters/demo/`.
They are a reference for the components. When you start writing, replace their imports with
your own chapters, and replace the demonstration metadata too: its author, affiliation and
sample DOI are not yours.

Write chapters in Markdown, import components where Markdown is not enough, put LaTeX math
between dollar signs, and cite with keys such as `[@hf-moe]`, which resolve against
`app/src/content/bibliography.bib`. Start headings at `##`, because the template renders the
article title as the page's top-level heading. A project builds one article, served at `/`,
in either the `article` or the `paper` layout.

MDX is executable: an import or an expression in a chapter runs when the site builds. Review
chapter changes as you would review code.

## Accuracy and language

Every author, affiliation, source, DOI and measurement in an article must be real and checked.
When a value is invented to illustrate a mechanism, say so in the figure's caption. Keep prose
and figure labels in the article's language. The template's own interface, such as its
buttons and table of contents, is in English, and translating it means extending the engine.

## Figures

Each figure is one HTML file in `app/src/content/embeds/`, placed in a chapter with the
template's `HtmlEmbed` component. The [embed skill](../.ai/skills/create-html-embed/SKILL.md)
and its [directives](../.ai/skills/create-html-embed/directives.md) are the complete rules;
the essentials follow.

An embed is a root element, CSS scoped to that root's class, and a script wrapped in an
immediately invoked function. `HtmlEmbed` mounts the script, and a page can contain several
instances of the same figure, so keep state inside the instance and guard against mounting
twice. Take colors from the template's CSS variables and `window.ColorPalettes`, so the figure
follows the theme, and recompute colors calculated in JavaScript when the theme changes. Build
controls from labelled HTML elements, so they work with a keyboard and a screen reader, and
size the figure from its container so it fits on a phone.

Keep the scientific model apart from the code that draws it. The routing example,
`d3-routing.html`, computes its weights in one pure function and renders them in another, so
tests can check that the weights sum to one and that temperature preserves their ranking
without reading the SVG.

Give every scientific figure a deterministic publication state: the state it opens in, the
one that PDF and image exports capture, and the one a reset restores. The routing example
opens with two active experts at temperature one, and a static HTML summary of that state
keeps the result readable without JavaScript.

Data lives in `app/src/content/assets/data/` and is served at `/data/` through the
`app/public/data` symbolic link. `HtmlEmbed` passes `data` and `config` props to the embed;
what they mean depends on the embed's script.

The banner, matrix and function plotter are upstream demonstrations by Thibaud Frere. They
show what the engine can do and are not experimental evidence.

## Commissioning a figure

When you ask a person or an agent for a new figure, the brief decides the result more than the
code does. State the claim the figure should make and for whom, the data with its source and
simplifications, the controls with their ranges and defaults, and the publication state:

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

## Standalone figure pages

Register a figure in `app/src/content/figures.json` only when another website will embed it.
Each entry needs `src`, `title`, `description` and `lang`, and becomes the page
`/figures/<name>/`. The optional `frameless: true` lets the figure supply its own heading and
card. Figures used only in the article need no entry. The embedding contract is described in
[Reuse a figure on another website](integration.md).

## Checks

After changing content or figures, run `npm run check` and `npm run test:e2e`. When the
published output changes, build, export the PDF and inspect it. [Verification](verification.md)
says what each check covers. The upstream exporters own the PDF, LaTeX and image conversion,
so fix an export problem there rather than adding a second export pipeline.
