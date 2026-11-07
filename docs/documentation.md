# Documentation

The documentation has two parts, each for a different reader. The interactive guide, in
`docs/article.mdx` and `docs/chapters/`, is for authors writing an article: it runs on the
article engine, so it shows live figures beside the instructions that use them. The Markdown
pages in `docs/` are for people maintaining the workspace and for anyone browsing the
repository on GitHub, who can read them without installing anything. `README.md` introduces
both. This page explains how to edit and check them; the
[writing skill](../.ai/skills/write-documentation/SKILL.md) sets how to write them.

## Decide where a fact goes

Put a fact where its reader looks, and in one place only. Writing, figures and publishing for
an author belong in the guide. How the workspace works, its conventions, checks, provenance and
contracts belong in the Markdown pages. When both need the same fact, give it one home and link
to it from the other, since two copies drift apart. The writing skill's table of text kinds
helps choose between a tutorial, a how-to guide, a reference and an explanation.

## Preview the guide

Install the dependencies with `npm ci`, then start the guide's development server:

```sh
make doc
```

Open <http://127.0.0.1:8031/>. To use another port, run `make doc DOC_PORT=8032`; if the port
is taken, Astro prints the one it chose. Without Make, run `npm run docs:dev`. The server picks
up edits to guide chapters, embeds and assets. Restart it after changing engine files, the
bibliography or `figures.json`, because the guide's working copy is made at startup, as
[Architecture](architecture.md#the-guide-runs-on-a-working-copy) explains. The guide server
can run next to the article's `npm run dev`.

Guide chapters use the same components as article chapters, and their import paths are
resolved from the working copy's `src/content/chapters/`. That is why a guide chapter imports
`../../components/HtmlEmbed.astro` and `../assets/image/...` even though those paths do not
exist next to `docs/chapters/`.

Diagrams in the guide are HTML embeds, like any other figure, because Mermaid in MDX cannot
follow the theme, adapt to a phone or highlight what the prose discusses. Mermaid fences
belong only in these Markdown pages, which GitHub renders. Put a figure that only the guide
uses in `docs/embeds/` and place it with `HtmlEmbed` by its file name, as the introduction
does with `guide-three-rules.html`. Give it a name that no article embed uses, because the
guide refuses to start on a collision.

## Text the tests depend on

`e2e/docs.spec.ts` checks specific guide text, so a change to any of it needs a matching change
to the test in the same commit:

- the guide title "Write an interactive article", set in `docs/article.mdx` and expected in
  the generated `/llms.txt`;
- the accordion "Make a first article you can run", which starts closed and contains the line
  `import MyArticle from "./chapters/my-article.mdx"`;
- the figure ids `guide-function`, `guide-rules` and `guide-routing`, and the rule button
  labels in `docs/embeds/guide-three-rules.html`;
- the link text "Open the same routing figure on its own".

## Check a change

Run every command and snippet you changed in a disposable copy of the repository before
publishing it: follow the instructions as written, then build. For the first-article
walkthrough, that means creating the two files it describes and confirming that `npm run build`
and the replacement test in the **Review and publish** section pass. Then check the
documentation itself:

```sh
make doc-check
npm run build
npm run test:e2e
```

`make doc-check` checks the links in the README, `AGENTS.md`, the writing skill and `docs/`,
then builds the guide. The browser tests need both the article build and the guide build.

## Host the guide

`make doc-build` writes the guide to `docs-dist/`, separately from the article's `app/dist/`.
To host it, deploy the complete contents of `docs-dist/` at the root of a dedicated origin.
`npm run docs:preview` serves the built guide at <http://127.0.0.1:8033/>. CI builds and stores
the guide but does not deploy it.
