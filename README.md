<div align="center">

# Latent Writing Lab

### Research articles your readers can play with.

Write in Markdown. Add figures readers can operate.<br/>
Open a pull request to check it, merge to publish it.

[![Checks](https://img.shields.io/github/actions/workflow/status/cris96spa/latent-writing-lab/check.yml?branch=development&style=flat-square&label=checks)](https://github.com/cris96spa/latent-writing-lab/actions/workflows/check.yml)
[![Docs](https://img.shields.io/badge/docs-read%20online-E07A47?style=flat-square)](https://cris96spa.github.io/latent-writing-lab/)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.12-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-4-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build/)
[![Engine](https://img.shields.io/badge/engine-research--article--template-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://github.com/tfrere/research-article-template)

[**Read the docs →**](https://cris96spa.github.io/latent-writing-lab/) &nbsp;·&nbsp; [Quick start](#quick-start) &nbsp;·&nbsp; [How it works](#how-it-works) &nbsp;·&nbsp; [Your own article](#write-your-own-article)

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/hero-dark.gif">
  <img src="docs/images/hero-light.gif" width="820" alt="A reel of interactive figures rendered by the engine: an embedding map of research papers, attention architecture diagrams, a neural network classifying a hand-drawn digit, a data-flow Sankey, a GPU bandwidth explorer, benchmark heatmaps and a mixture-of-experts router with sliders">
</picture>

<sub>Every figure above is live in the demo article and the docs. Readers hover, draw, drag and switch, right in the page.</sub>

</div>

<br/>

## Why

A paper states its result and asks you to believe it. An interactive article hands you the knob.

Hugging Face's long-form research posts, like the
[Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook),
the [LLM Evaluation Guidebook](https://huggingface.co/spaces/OpenEvals/evaluation-guidebook)
and the [MoE Training Handbook](https://huggingface.co/spaces/huggingface/moe-blogpost), read
like books and behave like notebooks: prose, equations and citations next to figures you can
operate. All three run on Thibaud Frere's
[research-article-template](https://github.com/tfrere/research-article-template).

**Latent Writing Lab is that engine with a publishing pipeline already wired in.** Create a
repository from the template and write: every pull request builds your article and tests its
figures, and every merge goes live on GitHub Pages.

|                                                   | research-article-template | Latent Writing Lab |
| ------------------------------------------------- | :-----------------------: | :----------------: |
| Interactive articles with math, citations and PDF |            ✅             |         ✅         |
| A broken figure blocks the release                |             —             |         ✅         |
| Live on GitHub Pages with every merge             |             —             |         ✅         |
| Share any figure on another website               |             —             |         ✅         |

Publishing one article on a Hugging Face Space? The template's `npx create-research-article`
is the faster start.

## Features

<table>
<tr>
<td width="33%" valign="top">

**✍️ Write in Markdown**<br/>
Chapters in MDX with LaTeX math, BibTeX citations, footnotes, notes and sidenotes.

</td>
<td width="33%" valign="top">

**🎛️ Figures readers operate**<br/>
Each figure is one HTML file with D3, SVG, sliders and buttons. Start from working examples.

</td>
<td width="33%" valign="top">

**🔗 Embed anywhere**<br/>
Any figure can get its own page, ready to drop into another site with an iframe.

</td>
</tr>
<tr>
<td width="33%" valign="top">

**📄 Website and PDF**<br/>
One build gives a static site in light and dark, a PDF and LaTeX, with figures captured for print.

</td>
<td width="33%" valign="top">

**🚀 Ships like software**<br/>
Pull requests are built and tested, merges go live. A broken figure never reaches readers.

</td>
<td width="33%" valign="top">

**🤖 Agent-ready**<br/>
`AGENTS.md` and skills teach coding agents the conventions, from figure code to prose style.

</td>
</tr>
</table>

## Quick start

You need [Node.js](https://nodejs.org/) 22.12 or later.

```sh
git clone https://github.com/cris96spa/latent-writing-lab.git && cd latent-writing-lab
npm ci
npm run dev
```

Open <http://127.0.0.1:4321> for the demo article, which shows every component the engine
offers. To read the docs next to it, run `make doc` in a second terminal and open
<http://127.0.0.1:8031>.

## How it works

You write chapters and figures. One entry file, `article.mdx`, decides what goes into the
article, and the build turns it into everything your readers get.

<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/rules-dark.gif">
  <img src="docs/images/rules-light.gif" width="620" alt="A diagram of chapters and a figure flowing into article.mdx, then into a build that produces a website, a PDF and a figure page, highlighting each of three rules in turn">
</picture>
</div>

Three rules keep it predictable:

- **What you import is what you publish.** A chapter ships only when `article.mdx` imports it.
- **Each figure has one source.** The same HTML file feeds the article and the figure's own
  page, so one fix reaches both.
- **Readers get the build.** Checks and exports run on the static site, not your local preview.

## Write your own article

1. Click **Use this template** to create a repository for your article.
2. Clone it, then run `npm ci` and `npm run dev`.
3. Run `make demo-remove`. The demo article goes, and a one-chapter starter with a passing
   test takes its place; the docs' [quick start](https://cris96spa.github.io/latent-writing-lab/#quick-start)
   shows what it writes.
4. In **Settings → Pages**, set **Source** to **GitHub Actions**. From then on, every merge that
   passes the checks is live at `https://OWNER.github.io/REPOSITORY/`. Any static host, a
   Hugging Face Space or the included Docker image work too.

<details>
<summary><b>Where things live</b></summary>
<br/>

| Path                                          | What it holds                                       |
| --------------------------------------------- | --------------------------------------------------- |
| `app/src/content/article.mdx`                 | Article metadata and the chapters, in reading order |
| `app/src/content/chapters/`                   | Your chapters                                       |
| `app/src/content/embeds/`                     | Your figures, one HTML file each                    |
| `app/src/content/bibliography.bib`            | Your references                                     |
| `app/src/content/assets/`                     | Images, audio and datasets                          |
| `app/src/content/figures.json`                | Figures that get their own embeddable page          |
| `app/src/components/`, `plugins/`, `scripts/` | The template's engine; no need to touch it          |
| `docs/`                                       | The documentation site and the README animations    |
| `tools/`, `e2e/`                              | Checks and browser tests                            |

</details>

## Documentation

The documentation is a site built by the same engine, so every example in it is live. Read it
[online](https://cris96spa.github.io/latent-writing-lab/) or run `make doc`.

- **[Overview](https://cris96spa.github.io/latent-writing-lab/)**: what you can build, a quick start and how the pieces fit.
- **[Writing](https://cris96spa.github.io/latent-writing-lab/writing/)**: Markdown, math, citations, layouts and imports.
- **[Components](https://cris96spa.github.io/latent-writing-lab/components/)**: every component, live, with its source.
- **[Interactive figures](https://cris96spa.github.io/latent-writing-lab/interactive-figures/)**: use, configure, write, test and embed
  figures.
- **[Publishing](https://cris96spa.github.io/latent-writing-lab/publishing/)**: checks, PDF and LaTeX exports, and hosting.
- **[Workspace](https://cris96spa.github.io/latent-writing-lab/workspace/)**: project layout, engine updates, coding agents and
  commands.

## Credits

The article engine, its components and the demo content are Thibaud Frere's
[research-article-template](https://github.com/tfrere/research-article-template), licensed under
[CC BY 4.0](LICENSE). Demo figures keep their attribution in their captions.
