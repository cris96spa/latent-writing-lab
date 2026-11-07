---
title: Latent Writing Lab
emoji: 📝
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 8080
tags:
  - research-article-template
  - scientific-writing
---

# Latent Writing Lab

A writing workspace built on Thibaud Frere's
[research-article-template](https://github.com/tfrere/research-article-template).
Astro, MDX, BibTeX, native HTML/D3 embeds, shared themes, and the upstream export
tools provide the publishing foundation. Figures have one HTML source that can
appear in an article or a standalone page for another website.

## Start writing

Use Node 22.12+ (Node 22 LTS recommended) and npm:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4321>. Edit `app/src/content/article.mdx` for metadata and
chapter imports, and `app/src/content/chapters/` for prose. The native template
publishes one article per project. A chapter is part of that article; it is not a
separate routed post. All imported content is included in production builds.

| Path                                                  | Responsibility                                    |
| ----------------------------------------------------- | ------------------------------------------------- |
| `app/src/content/article.mdx`                         | Article metadata and chapter composition          |
| `app/src/content/chapters/`                           | MDX prose, math and component imports             |
| `app/src/content/bibliography.bib`                    | Native BibTeX references                          |
| `app/src/content/embeds/`                             | Visualization source of truth                     |
| `app/src/content/assets/data/`                        | Datasets and source notes, served at `/data/`     |
| `app/src/content/figures.json`                        | Optional standalone figure pages                  |
| `app/src/components/`, `app/plugins/`, `app/scripts/` | Upstream rendering and publication engine         |
| `.ai/skills/`                                         | Upstream authoring instructions for coding agents |
| `app/src/pages/figures/`                              | Small standalone adapter using native `HtmlEmbed` |
| `app/dist/`                                           | Generated static site and publication artifacts   |

## Write a visualization

Use the native embed component in a chapter:

```mdx
import HtmlEmbed from "../../components/HtmlEmbed.astro";

<HtmlEmbed
  src="d3-routing.html"
  title="A token chooses its experts"
  desc="Illustrative scores; not experimental measurements."
/>
```

Each embed contains scoped HTML/CSS and JavaScript. D3, SVG, Canvas and other native
browser techniques can support custom diagrams and interactions. The template supplies
the surrounding presentation and theme; there is no separate React figure library.
Read [authoring](docs/authoring.md) and the upstream
[embed skill](.ai/skills/create-html-embed/SKILL.md).

## Reuse on another website

Add an entry to `app/src/content/figures.json` to generate `/figures/<name>/`.
The article and standalone page use the same embed file and upstream component.
For example, publish `app/dist` and embed `/figures/routing/` in a React, Astro,
or ordinary HTML site. See [integration](docs/integration.md) for the iframe contract.

## Verify and publish artifacts

```sh
npm run check
npm run docs:check
npx playwright install chromium
npm run test:e2e
npm run preview
```

`npm run build` produces the static site in `app/dist`. The root commands delegate to
the upstream tools:

```sh
npm run export:pdf -- --theme=light --wait=full
npm run export:latex
npm run export:images
```

PDF export requires Playwright Chromium. LaTeX export requires Pandoc; check the upstream
script help for additional conversion requirements. Build before exporting after edits:
the PDF script reuses an existing `app/dist`. Inspect exported figures and page breaks.
Set `showPdf: true` in article metadata only when the matching PDF is included in the
deployed output. Generated downloads belong in `app/dist`.

The supplied container serves the static build on port 8080. GitHub CI validates,
builds, tests and uploads artifacts; it does not deploy automatically. Hosting on
Hugging Face is optional. The article and embeds use upstream CDN dependencies, so
interactive figures require network access to those dependencies.

## Upstream and local extensions

The exact upstream revision and implementation checksums are in
`template-provenance.json`. Upstream code and selected demonstration embeds retain
their CC BY 4.0 license and attribution; see [baseline](docs/baseline.md).
The local additions are the routing example, standalone figure adapter, verification
and workspace commands. See [architecture](docs/architecture.md) and
[verification](docs/verification.md).
