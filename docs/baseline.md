# Upstream and provenance

This workspace uses Thibaud Frere's
[research-article-template](https://github.com/tfrere/research-article-template),
also hosted on [Hugging Face](https://huggingface.co/spaces/tfrere/research-article-template).
`template-provenance.json` records the exact source revision and SHA-256 hashes for
the delegated implementation. `npm run content:check` detects unexpected edits to it.

Upstream components, styles, plugins, scripts and authoring skills retain their
source and license. `LICENSE` contains the upstream CC BY 4.0 terms. The banner,
matrix and function plotter are upstream demonstration embeds. Visible captions
and this document credit Thibaud Frere. The local routing embed and standalone page
are project extensions.

The application manifest adds `private: true` to prevent accidental npm publication
and binds the preview server to localhost. Development also binds to localhost.
The root workspace owns the shared lockfile, verification commands, CI and the
static container setup. Demo datasets and binary LFS assets are not required by
the included article. Obtain their actual data and provenance before using an
upstream example that depends on them.

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
