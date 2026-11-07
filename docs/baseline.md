# Upstream and provenance

The article engine is Thibaud Frere's
[research-article-template](https://github.com/tfrere/research-article-template), also
published as a [Hugging Face Space](https://huggingface.co/spaces/tfrere/research-article-template).
The workspace uses it unmodified, so that each upstream update arrives as a reviewable
change. `template-provenance.json` records exactly which version is in use: the source commit
and a SHA-256 hash for every template file. `npm run content:check`, which `npm run check`
runs first, recomputes the hashes and fails on the first file that differs, naming it.

## What is upstream and what is local

The template's components, styles, plugins, scripts and three agent skills
(`article-frontmatter`, `create-html-embed` and `deploy-to-hf-spaces`) keep their source and
their CC BY 4.0 license, reproduced in `LICENSE`. The workspace adds the routing embed, the
standalone figure page, the `write-documentation` skill, `tools/`, `e2e/`, the documentation,
CI and the workspace configuration.

The application manifest, `app/package.json`, differs from upstream in two ways. It
sets `private: true`, which prevents accidental publication to npm, and it binds the
development and preview servers to localhost. The root workspace owns the shared lockfile, the
verification commands, CI and the container setup.

## Demonstration content

The landing page renders the upstream article with all of its demonstration chapters, embeds,
images, audio and datasets at the pinned revision. `demoContent` in the provenance file
records their source and checksums. They are ordinary files, so a fresh clone runs the
demonstration without a Git LFS download. `.prettierignore` keeps the demonstration chapters
in their upstream formatting.

The demonstration keeps the upstream author credit and example metadata, including a sample
DOI; replace both when you write your own article. PDF downloads stay hidden, through
`showPdf: false`, until a matching export is deployed.

The pinned snapshot has three known gaps, which the workspace preserves rather than patches:

- The demonstration references `d3-hf-citations.html` and `hf_citations.csv`, which upstream
  does not supply, so the page shows "Embed not found" there, as the live upstream page does.
  The workspace does not fabricate a replacement chart or data.
- Third-party iframe demonstrations and the libraries loaded from CDNs need network access.
- The PDF exporter can clip wide charts, including the Sankey example, so review figure widths
  and page breaks before publishing an export.

## Update the template

The template's sync command, which `npm run sync:template:dry` previews, covers root files as
well as the application. It preserves content but does not protect this workspace's rules and
configuration, so running it in the working project can overwrite them. Review an update in a
disposable copy instead:

1. Copy the repository to a scratch directory and run the sync there.
2. Compare the result against the pinned revision, and decide which upstream changes to
   accept.
3. Bring the accepted changes into the workspace, preserving the authored content, the
   standalone figure page, the tooling and the local instructions.
4. Record the new commit and hashes in `template-provenance.json`, and update the root
   `package-lock.json`.
5. Run the project checks and a PDF export.

Keep any local change to a template file small, and record it in the provenance file.
Contribute engine fixes upstream where possible, rather than maintaining a second
implementation here.

## Dependency baseline

The template's dependency ranges include Astro 4 and other packages with known security
advisories, and several of the fixes require coordinated major upgrades. The workspace stays
compatible with that baseline, so a passing build says nothing about how hardened the
dependency tree is. Run `npm audit` when reviewing an update.

How the site runs limits the exposure. The development and preview servers are local tools
bound to localhost, and the production container serves static files with nginx, without
Astro's server or server-side rendering. That does not make every advisory irrelevant,
because the build still processes content, expressions and images, which must therefore come
from trusted repository sources. Review the dependency baseline before a public deployment.
