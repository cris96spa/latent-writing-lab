# Architecture

The Astro application in `app/` is the research article template. It reads one MDX
entry point and composes imported chapters. The upstream plugins handle math,
citations, table formatting and the text export. Upstream components handle the
article shell, theme, figures and download controls. The result is a static site.

HTML embeds are the single visualization source of truth. Article chapters import
the upstream `HtmlEmbed` component. The small route in `app/src/pages/figures/`
uses that same component with entries from `app/src/content/figures.json`.
It adds a standalone HTML document and uses the upstream stylesheet, palettes
and theme control. It does not implement a second visualization runtime.

The root npm workspace delegates application commands to `app/package.json`.
Its local tools verify upstream implementation hashes and standalone figure metadata.
Astro owns MDX compilation. Playwright tests article rendering, native embeds,
scientific invariants, keyboard input, dark mode and narrow layouts.

The native export scripts produce publication artifacts. GitHub CI checks the
workspace and stores the static site and browser reports without deploying them.
The container builds the same workspace and serves its static output with nginx.

Project code is concentrated in content, the standalone page, tooling, tests and
workspace configuration. Upstream components, styles, plugins and export scripts
remain byte-for-byte identifiable through `template-provenance.json`.
