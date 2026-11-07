# Upstream and provenance

This workspace uses Thibaud Frere's
[research-article-template](https://github.com/tfrere/research-article-template),
also hosted on [Hugging Face](https://huggingface.co/spaces/tfrere/research-article-template).
`template-provenance.json` records the exact source revision and SHA-256 hashes for
the delegated implementation. `npm run content:check` detects unexpected edits to it.

Upstream components, styles, plugins, scripts and authoring skills retain their
source and license. `LICENSE` contains the upstream CC BY 4.0 terms. The decorative banner,
matrix and function plotter are upstream demonstration embeds. Visible captions
and this document credit Thibaud Frere. The local routing embed and standalone page
are project extensions.

The application manifest adds `private: true` to prevent accidental npm publication
and binds the preview server to localhost. Development also binds to localhost.
The root workspace owns the shared lockfile, verification commands, CI and the
static container setup.

## Demonstration content

The landing page includes the upstream article and all of its demonstration chapters,
embeds, images, audio and datasets at the pinned revision. `demoContent` in the provenance
file records the source and checksums of the materialized assets. These are ordinary
repository files, so a fresh checkout needs no Git LFS download to run the demo.
The upstream demo chapter formatting is preserved by `.prettierignore`.

The article retains the upstream author credit and example metadata, including its
sample DOI. Replace that metadata when writing your own article. PDF downloads are
hidden until a matching export is provided. Local optional examples and bibliography
entries coexist with the upstream demo; the engine files retain their pinned hashes.

The upstream snapshot references `d3-hf-citations.html` and `hf_citations.csv` but does
not supply them. Its live page also displays an “Embed not found” message for that
example. This workspace preserves that source rather than fabricating a chart or data.
Third-party iframe demonstrations and CDN dependencies require network access.
The native PDF export can clip wide demo charts, including the Sankey example.
Review figure widths and page breaks before using an export for publication.

## Reviewing upstream updates

The native `npm run sync:template:dry` previews upstream synchronization. Its
scope includes root files as well as application files. Content is preserved,
but project rules and configuration are not all protected. Do not run an actual
sync blindly in the working project.

Use the native sync in a disposable copy, inspect the result against the pinned
revision, and bring reviewed changes into this workspace. Preserve authored
content, standalone routes, workspace tooling and local instructions. Record the
accepted commit and implementation checksums in `template-provenance.json`, update
the root npm lockfile, and run the project checks and publication export.

Keep upstream fixes small and documented. Prefer contributing shared engine fixes
upstream over maintaining a second implementation here.

## Dependency limitations

The upstream dependency ranges include Astro 4 and other packages with known security
advisories. This workspace preserves compatibility with that baseline; a successful
build does not establish that its dependency tree is hardened. Run `npm audit` when
reviewing an update. Several fixes require coordinated major framework upgrades.

Development and preview servers are local tools. The supplied production container
serves static output with nginx and does not run Astro's development server or SSR.
Content, expressions and image inputs must be trusted repository sources. Static
hosting reduces server-side exposure but does not make all dependency advisories
irrelevant. Review the dependency baseline before public deployment.
