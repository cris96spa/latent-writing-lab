# Your first article

Start with [Project and publishing workflow](workflow.md) to choose when to create
a project, how to use branches, and how to reuse figures across sites.

The page at `/` displays the upstream research article template's complete demonstration:
getting started, writing, Markdown, components, interactive charts, import tools and
writing tips. It is a working reference you can explore before writing your article.
The demo's metadata credits its upstream author; replace it when authoring your own work.

## Preview and edit

Use Node 22 or 24. Install dependencies once, then start the live preview:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4321/>. Save edits to see them in the browser.

| What to change                                     | Where                                                   |
| -------------------------------------------------- | ------------------------------------------------------- |
| Title, description, authors and layout             | [article.mdx](../app/src/content/article.mdx)           |
| Your own paragraphs, headings and figure placement | [starter.mdx](../app/src/content/chapters/starter.mdx)  |
| Reference metadata                                 | [bibliography.bib](../app/src/content/bibliography.bib) |
| Visualization source                               | [embeds](../app/src/content/embeds)                     |
| Optional standalone figure routes                  | [figures.json](../app/src/content/figures.json)         |

The repository publishes one article at `/`. Its entry point imports the full set of
upstream chapters from `chapters/demo/`. To start your own article, replace those imports
and rendered components with a chapter such as the included `starter.mdx`:

```mdx
import Starter from "./chapters/starter.mdx";

<Starter />
```

Keep the metadata block above the imports and replace its title, description, authors,
affiliations, publication date, sample DOI and licence as appropriate. Choose `article`
or `paper` for the layout. You can leave the demo chapters on disk as a reference;
only imported and rendered chapters appear in the article. Registered standalone
figures build independently. `/dataviz/` provides the upstream visual-asset gallery.

## Write a focused explanation

Start with one reader question and a concrete takeaway. Aim for roughly 400–600 words,
one figure, and a few verified primary references. A single web page is not necessarily
one printed PDF page.

1. Set the title and description in the metadata file. Keep `authors: []` until the
   intended author has reviewed the attribution. Use a publication date only when appropriate.
2. Write the explanation in the chapter. Inline math uses `$...$`; display math uses
   `$$...$$`. Add verified references to the bibliography and cite them with
   `[@your-reference-key]`.
3. Make each figure answer a question in the prose. Tell readers which control to
   use and what change to look for. Label invented data explicitly.
4. Keep `showPdf: false` until a reviewed PDF is included in the deployed output.
   A visible draft label can describe editorial status, but it does not exclude
   the article from builds or deployment.

## Add a figure

Author a native HTML embed following the [authoring guide](authoring.md). The
included routing example illustrates a pure calculation alongside a renderer:

```mdx
import HtmlEmbed from "../../components/HtmlEmbed.astro";

<HtmlEmbed
  src="d3-routing.html"
  title="A token chooses its experts"
  desc="Illustrative scores; not experimental measurements."
/>
```

The same source powers `/figures/routing/`. The [integration guide](integration.md)
explains how another site can reuse that page without duplicating its implementation.
The `/figures/matrix/` and `/figures/function-plotter/` pages offer upstream examples.
Remove unused registry entries and their associated tests when curating a publication.

Choose a deterministic initial state for the figure so a fresh-page export captures
its intended explanation. Provide accessible controls, a useful static fallback and
checks for meaningful scientific invariants. Update the article assertions in
[article.spec.ts](../e2e/article.spec.ts) when changing the title or visible content.

## Review and export

```sh
npm run check
npm run docs:check
npx playwright install chromium
npm run test:e2e
npm run preview
```

Review the article at desktop and phone widths, switch themes, and navigate figure
controls with a keyboard. Read the sources and check the numerical explanation.
The tests check implementation; editorial review remains necessary.

For a PDF:

```sh
npm run build
npm run export:pdf -- --filename=article --theme=light --wait=full
```

Inspect `app/dist/article.pdf`, especially equations, figure state and page breaks.
The upstream exporter reuses an existing build, so build after edits. Generated output
is ignored by Git. CI checks and uploads artifacts; it does not publish.

## Brief a coding assistant

```text
Read AGENTS.md, docs/authoring.md, and the native HTML embed skill.
Write a short article for [audience] answering [one question].
Reader takeaway: [one concrete claim].
Figure: [what readers manipulate and what changes].
Data: [source, or explicitly illustrative values].
References: [verified primary sources].
Use the native paper layout and one embed source. Keep the upstream engine intact.
Update article assertions and model invariants; check mobile, themes and PDF output.
```

See [Authoring](authoring.md) for general conventions and
[Verification](verification.md) for the CI and publication checks.
