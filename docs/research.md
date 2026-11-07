# What powers the Hugging Face MoE figures?

Inspected 7 November 2026. Findings below come from cloned public repositories,
including actual figure bundles, not just the article's dependency manifest.

## Source provenance

- Hugging Face Space: `https://huggingface.co/spaces/huggingface/moe-blogpost`
  at commit `ef70726e6f8b99d74298a16a4894340f288a58c2`.
- Personal site: `https://github.com/cris96spa/latent-space`
  at commit `db0d2bc83743748efe220886b3fbd603541a9f74`.

## Verified layers

| Layer                 | Observed implementation                                                                                      | Evidence in the HF repository                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Article               | Astro 4 + MDX, KaTeX, citation plugins                                                                       | `app/package.json`, `app/astro.config.mjs`                          |
| Template ancestry     | Manifest identifies Thibaud Frere's research-article-template                                                | `app/package.json` homepage/repository/author fields                |
| Figure embedding      | Lazy-mounted iframes addressing `?c=figure-name`, reserved dimensions, offscreen unmounting, poster fallback | `app/src/components/Viz.astro`                                      |
| Figure gallery        | Vite-built JavaScript with dynamically imported figure modules                                               | `app/public/viz/index.html`, `assets/index-CvLXxQTw.js`             |
| Diagram rendering     | Custom SVG markup and DOM updates in inspected modules                                                       | `hero-dense-to-moe-DHSLOS2p.js`, `router-temperature-CDVOhRT4.js`   |
| Shared visual system  | Typography/color tokens and shared helpers for steps, probabilities, scores, traces and run plots            | `theme-CNAocXW-.js`, `steps-CAunjaDy.js` and sibling bundles        |
| Animation contract    | Figure exports include `render`, `params`, and on animated figures `duration`, `steps`, `timeline`           | `hero-dense-to-moe-DHSLOS2p.js` and gallery runtime                 |
| Large headline scenes | Custom Canvas 2D and JavaScript                                                                              | `app/public/headline-iso/index.html`, `headline-overlap/index.html` |

The manifest also lists Svelte and D3. **That does not establish that the admired
figures are Svelte or D3 components.** There are no `.svelte` source files in the
checked-out snapshot. The inspected gallery modules directly construct SVG strings,
and the main bundle includes custom DOM reconciliation. It would be misleading to
identify a single installed plotting library as the source of the entire visual style.
There are 55 JS modules exporting a `render` function in this snapshot's gallery assets.

The public Space contains compiled gallery assets. `Viz.astro` mentions
`scripts/sync_gallery.sh`, but that file and the gallery's original TypeScript source
tree are absent from this snapshot. I cannot identify the unpublished authoring source
or claim that the gallery was originally written with a particular source framework.
The Vite bundling evidence and browser rendering behavior are directly observable.

Useful source links:

- [Article manifest](https://huggingface.co/spaces/huggingface/moe-blogpost/blob/ef70726e6f8b99d74298a16a4894340f288a58c2/app/package.json)
- [Figure embed wrapper](https://huggingface.co/spaces/huggingface/moe-blogpost/blob/ef70726e6f8b99d74298a16a4894340f288a58c2/app/src/components/Viz.astro)
- [Compiled gallery assets](https://huggingface.co/spaces/huggingface/moe-blogpost/tree/ef70726e6f8b99d74298a16a4894340f288a58c2/app/public/viz/assets)
- [Canvas headline](https://huggingface.co/spaces/huggingface/moe-blogpost/blob/ef70726e6f8b99d74298a16a4894340f288a58c2/app/public/headline-iso/index.html)
- [Research article template](https://huggingface.co/spaces/tfrere/research-article-template)

The article manifest declares CC-BY-4.0. The gallery source/provenance boundary is
not fully established by that manifest alone. This workspace copies no MoE gallery bundles or article text. Its research-template
demonstrations are separately attributed in the article and baseline guide.

## What latent-space already has

The site is React 19 + TypeScript + Vite. Its forward-pass hero already separates
frames, numerical/sampling logic, layout and React/SVG panels. This is a useful starting
pattern, not a system that needs replacement. `PlaybookBanner.tsx` is custom SVG;
`PolarityRadar.tsx` uses Plotly. The visual code is currently organized around site
features rather than a portable visualization package.

- [Frontend dependencies](https://github.com/cris96spa/latent-space/blob/db0d2bc83743748efe220886b3fbd603541a9f74/frontend/package.json)
- [Forward-pass diagram](https://github.com/cris96spa/latent-space/blob/db0d2bc83743748efe220886b3fbd603541a9f74/frontend/src/features/forward-pass-hero/PipelineDiagram.tsx)
- [Diagram layout](https://github.com/cris96spa/latent-space/blob/db0d2bc83743748efe220886b3fbd603541a9f74/frontend/src/features/forward-pass-hero/diagram/layout.ts)
- [Writing index](https://github.com/cris96spa/latent-space/blob/db0d2bc83743748efe220886b3fbd603541a9f74/frontend/src/pages/WritingPage.tsx)

## Authoring foundation

The research article template supplies the Astro article engine, HTML embed wrapper,
shared palettes, citation tooling and publication exporters. This workspace uses that
implementation directly. Custom diagrams are authored as native HTML/JavaScript embeds;
standalone pages reuse the same files through the same upstream component.

The template's examples and authoring skills provide reusable patterns. They do not
supply the unpublished MoE gallery source. Each subject-specific model still needs
explicit assumptions, provenance and scientific validation.
