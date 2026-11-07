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

Latent Writing Lab is a workspace for writing a research article or technical explainer in
Markdown, with equations, citations and interactive figures, and publishing it as a static
website or a PDF. It runs on Thibaud Frere's
[research-article-template](https://github.com/tfrere/research-article-template), which
supplies the layout, theming, citations and exporters, and it keeps that engine unmodified so
upstream updates stay reviewable. On top of the engine, the workspace adds standalone figure
pages that other websites can embed, an interactive guide built with the same engine, and
checks that run locally and in CI.

## Quick start

You need Git, Node.js 22.12 or later, and npm; CI tests Node 22 and 24. Run every command
from the repository root. Install the dependencies and start the article preview:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4321/>. You should see the template's demonstration article, which
shows every component the engine provides. If port 4321 is taken, Astro prints the port it
chose instead. The page reloads whenever you save a file.

The interactive guide shows how to replace the demonstration with your own article. Start it
in a second terminal:

```sh
make doc
```

Open <http://127.0.0.1:8031/>. The guide walks through creating a project, writing a first
article, adding figures and data, and publishing, with live examples beside the instructions.
Without Make, run `npm run docs:dev`.

## Where things live

You write in `app/src/content/`. The rest of `app/` is the template's engine, which the
workspace uses as it is.

| Path                                                  | Contents                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `app/src/content/article.mdx`                         | Article metadata and the list of chapters, in order        |
| `app/src/content/chapters/`                           | Chapters in MDX: prose, math and component imports         |
| `app/src/content/bibliography.bib`                    | BibTeX references cited from chapters                      |
| `app/src/content/embeds/`                             | Figures, one HTML file each                                |
| `app/src/content/assets/data/`                        | Datasets and their source notes, served at `/data/`        |
| `app/src/content/figures.json`                        | Figures published as standalone pages                      |
| `app/src/components/`, `app/plugins/`, `app/scripts/` | The template's rendering, citation and export engine       |
| `app/src/pages/figures/`                              | The standalone figure page, built on the template's embeds |
| `docs/`                                               | The interactive guide and the maintainer documentation     |
| `tools/`, `e2e/`                                      | Project checks and browser tests                           |
| `.ai/skills/`                                         | Instructions for coding agents                             |
| `app/dist/`                                           | The generated website and exports; never edit it           |

## Documentation

| To                                                       | Read                                                                    |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Write a first article, add figures and publish           | The interactive guide (`make doc`), with its source in `docs/chapters/` |
| Follow the conventions for chapters, sources and figures | [Authoring conventions](docs/authoring.md)                              |
| Organize repositories, drafts and releases               | [Project and publishing workflow](docs/workflow.md)                     |
| Embed a figure in another website                        | [Reuse a figure on another website](docs/integration.md)                |
| Understand how the workspace fits together               | [Architecture](docs/architecture.md)                                    |
| Know what each check covers                              | [Verification](docs/verification.md)                                    |
| Update the template or check its provenance              | [Upstream and provenance](docs/baseline.md)                             |
| Edit the guide or these pages                            | [Documentation](docs/documentation.md)                                  |
| See why figures are native HTML embeds                   | [Research note](docs/research.md)                                       |

Coding agents follow [AGENTS.md](AGENTS.md), which `CLAUDE.md` links to, and the skills in
[.ai/skills](.ai/skills/), including the [writing skill](.ai/skills/write-documentation/SKILL.md)
for documentation.

## Check a change

The browser tests run against production builds of both the article and the guide, so build
both before testing. Install Chromium once with `npx playwright install chromium`, then run:

```sh
npm run check
make doc-check
npm run test:e2e
```

`npm run check` confirms that the template files match their pinned versions, that project
files are formatted, and that the article builds. `make doc-check` checks documentation links
and builds the guide. `npm run test:e2e` tests both sites in Chromium. CI runs the same steps
on Node 22 and 24 and keeps the builds as artifacts; it never deploys. The
[verification page](docs/verification.md) lists what each check proves, and the guide's
**Review and publish** section covers exports and hosting.

## License

The template's code and demonstration content keep their CC BY 4.0 license, reproduced in
[LICENSE](LICENSE), and their attribution. `template-provenance.json` pins the template
revision this workspace uses; [Upstream and provenance](docs/baseline.md) explains what is
upstream and what is local.
