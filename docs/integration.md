# Reuse a figure on another website

A figure registered in `app/src/content/figures.json` gets its own page at `/figures/<name>/`,
rendered from the same embed file as the figure in the article. Another website, whether it is
built with React, Astro or plain HTML, shows that page in an iframe. The iframe is a separate
document, so the host site needs none of the figure's dependencies, and neither site's styles
can affect the other's.

## Publish the figure page

1. Add an entry with `src`, `title`, `description` and `lang` to
   `app/src/content/figures.json`, as described in
   [Authoring conventions](authoring.md#standalone-figure-pages).
2. Run `npm run build`. The page is written to `app/dist/figures/<name>/index.html`.
3. Deploy the complete `app/dist` directory at the root of an origin. The pages load
   `_astro/`, `scripts/` and `data/` through root-relative URLs, so the directory must stay
   together, and serving it under a subpath requires adapting the engine's base path.

## Embed the page

In a React or Vite site, the iframe looks like this:

```jsx
<iframe
  src="https://YOUR-ARTICLE-HOST/figures/routing/"
  title="A token chooses its experts"
  loading="lazy"
  style={{ width: "100%", height: 680, border: 0 }}
/>
```

Replace `YOUR-ARTICLE-HOST` with the origin where `app/dist` is deployed. The iframe keeps the
height you give it, so choose one that fits the figure at desktop and phone widths, and test
both. The server hosting the figure must allow the host site to frame it.

## Limits of the iframe

The figure follows its own theme control and the reader's system preference rather than the
host page's theme, and it does not report its height to the parent. Both would need a
messaging protocol between the two documents, which the standalone page does not implement.

Copying the embed's HTML into a React component does not work, because the fragment depends
on the mounting, palettes and theme variables that the template's components provide. The
standalone page sets up that environment. To change the figure, edit
`app/src/content/embeds/<file>.html`, then rebuild and redeploy: the article and the
standalone page both update.
