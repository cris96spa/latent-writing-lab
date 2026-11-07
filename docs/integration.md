# Reuse on another website

The same HTML visualization can be published inside the article and at
`/figures/<name>/`. Add a standalone entry to `app/src/content/figures.json`, build,
then host the complete `app/dist` directory at an origin root. Keep `_astro`, scripts,
data and other assets together; generated pages use root-relative asset URLs.

A React/Vite site can embed the hosted page directly:

```jsx
<iframe
  src="https://YOUR-ARTICLE-HOST/figures/routing/"
  title="A token chooses its experts"
  loading="lazy"
  style={{ width: "100%", height: 680, border: 0 }}
/>
```

Replace the placeholder origin with the deployed article origin. Choose and test a
height that fits the figure on desktop and mobile. The iframe is an independent
document: styles do not leak, and the parent does not need Astro, D3 or React figure
components. It follows its own upstream theme control and system preference; parent
theme synchronization and automatic height messaging are not implemented.

Host the output on an origin whose framing policy allows the parent website.
Static HTML export and figure code reuse do not require Hugging Face hosting.
Copying an HTML fragment directly into a React component is insufficient because
the native mounting, palette and theme dependencies also need initialization.
The standalone page provides that environment through upstream components.

Both views read `app/src/content/embeds/<file>.html`. Edit that source once, then
rebuild and publish the output. No parallel visualization implementation is needed.
