# Research note: how the Hugging Face MoE article builds its figures

This note answers whether the figures of the Hugging Face mixture-of-experts article come from
a toolchain this workspace could adopt. They do not: the article runs on
the same research article template, but its figures come from a custom gallery whose source
is not public, and no single library explains their style. Native HTML embeds rendered
through the template's embed component are the closest supported equivalent, which is why the
workspace writes figures that way.

The findings below come from the public Space,
`https://huggingface.co/spaces/huggingface/moe-blogpost`, at commit
`ef70726e6f8b99d74298a16a4894340f288a58c2`, inspected on 7 November 2026. They are based on
the compiled figure bundles as well as the article's dependency manifest.

## Findings

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

The manifest lists Svelte and D3, but that does not make the figures Svelte or D3 components.
The snapshot contains no `.svelte` files, the 55 gallery modules that export a `render`
function build SVG strings directly, and the main bundle includes its own DOM reconciliation.
Attributing the visual style to one installed plotting library would be misleading.

The gallery's original source is not in the snapshot. `Viz.astro` mentions
`scripts/sync_gallery.sh`, but that script and the gallery's TypeScript source tree are absent,
so the framework the gallery was written in cannot be established. Only the Vite bundling and
the behavior in the browser can be observed.

The article manifest declares CC-BY-4.0, but the manifest alone does not establish the license
of the gallery bundles. The workspace copies no MoE gallery bundles or article text; its
template demonstrations are attributed separately, in the article and in
[Upstream and provenance](baseline.md).

## What this means for the workspace

The template supplies the article engine, the embed component, shared palettes, citation
tooling and exporters, and the workspace uses them directly. Custom diagrams are native HTML
and JavaScript embeds, and standalone pages reuse those files through the same component. The
template's examples and skills provide reusable patterns but not the MoE gallery, so each
subject-specific figure still needs its own assumptions, provenance and scientific validation.

## Sources

- [Article manifest](https://huggingface.co/spaces/huggingface/moe-blogpost/blob/ef70726e6f8b99d74298a16a4894340f288a58c2/app/package.json)
- [Figure embed wrapper](https://huggingface.co/spaces/huggingface/moe-blogpost/blob/ef70726e6f8b99d74298a16a4894340f288a58c2/app/src/components/Viz.astro)
- [Compiled gallery assets](https://huggingface.co/spaces/huggingface/moe-blogpost/tree/ef70726e6f8b99d74298a16a4894340f288a58c2/app/public/viz/assets)
- [Canvas headline](https://huggingface.co/spaces/huggingface/moe-blogpost/blob/ef70726e6f8b99d74298a16a4894340f288a58c2/app/public/headline-iso/index.html)
- [Research article template](https://huggingface.co/spaces/tfrere/research-article-template)
