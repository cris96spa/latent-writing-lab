---
name: write-article
description: Write or revise the article itself, in app/src/content: chapters, equations, figure titles and captions, citations and the bibliography. Use when asked to draft, edit, restructure or review article prose, explain a figure, add references or audit citations. For the README, the documentation pages, pull requests and commits, use write-documentation instead.
---

# Write the article

An article built with this template is a scientific blog post: a reader who knows the field
comes to understand one idea, and checks it with figures they can operate. These guidelines
cover the article in `app/src/content`. They are adapted from the
[FinePhrase writing guidelines](https://huggingface.co/spaces/HuggingFaceFW/finephrase/blob/main/AGENTS.md)
by Hugging Face, which run on the same engine.

## Style references

Read a few sections of these before writing, for their voice and pacing:

- [The Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
- [The Ultra-Scale Playbook](https://huggingface.co/spaces/nanotron/ultrascale-playbook)
- [FineWeb: decanting the web for the finest text data at scale](https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1)
- [FineVision: Open Data is All You Need](https://huggingface.co/spaces/HuggingFaceM4/FineVision)
- [Transformers Tenets](https://huggingface.co/spaces/transformers-community/Transformers-tenets)

## Voice and tone

- **Conversational but precise.** Write as if explaining to a curious colleague over coffee.
- **Address the reader.** Use "you" for the reader and "we" for the authors, freely.
- **Active voice.** "The model learns", not "learning is performed by the model".
- **Short sentences.** Break a complex idea into steps the reader can hold.
- **No hedging.** "X improves Y", not "X tends to potentially improve Y". When a result is
  uncertain, say what the uncertainty is instead.

## Punctuation

- **No em-dashes (—).** Use commas, parentheses or a second sentence.
- **En-dashes (–) for ranges only**, such as "2020–2024" or "pages 10–15".
- **Few semicolons.** Prefer two sentences.
- **Escape `<` and `>` in prose.** MDX reads a `<` followed by a letter as the start of a
  component, so write `{'<'}` and `{'>'}`, or use words such as "less than".
- **No bare `{` or `}` in prose.** MDX reads them as JavaScript expressions. Rephrase, use
  parentheses, or write `{'{'}` and `{'}'}`. Code spans and code blocks need no escaping.

## Formatting

- **Bold a key term** where it is first introduced, and nowhere else.
- **Inline code for identifiers:** model names as written in code, hyperparameters, file
  paths, commands.
- Lists for steps, features and comparisons; paragraphs for reasoning.
- Paragraphs of three to five sentences at most.
- **No horizontal scrolling in tables.** When a row holds long prose, turn the table into a
  list. Tables are for short, comparable values.

## Structure

- **One article, one entry file.** `app/src/content/article.mdx` holds the metadata and imports
  the chapters from `app/src/content/chapters/`, in reading order.
- **Short sections.** Each section answers one question or supports one idea.
- **Headings the table of contents can use:** `##` to `####`, short and descriptive. The article
  title is the only top-level heading.
- **Lead with the conclusion.** Open each section with its key insight, then support it.
- **Progressive disclosure.** Give the overview first, and put details in an `Accordion` or a
  `Sidenote` for the readers who want them.
- **Every claim has an artifact nearby:** a figure, a table, a code excerpt or a demo the reader
  can check.

## Technical writing

- Define jargon at first use, inline or with `Glossary`.
- Prefer a concrete example to an abstract explanation.
- Show, don't tell: an interactive figure beats a paragraph describing one.
- Link to sources rather than only naming them.
- **Never use a bare URL as link text.** Write `[DataTrove's inference benchmark](https://…)`,
  not `[github.com/huggingface/datatrove/…](https://…)`.

## Figures

Figures are first-class content, not decoration. Build them with the
[`create-html-embed`](../create-html-embed/SKILL.md) skill and place them with `HtmlEmbed`,
`Image` or `Reference`.

- **Numbering is automatic.** The engine prefixes every `HtmlEmbed` description, `Image` caption
  and `Reference` caption with "Figure N ·". Never write "Figure 3:" in a caption.
- **Give every figure an `id`, and refer to it in the text** with a link such as
  `[the throughput comparison](#throughput)`. Numbers change as figures are added, so link
  rather than writing "Figure 3".
- **Discuss every figure.** One to three paragraphs around it say what it shows, what to try,
  the key takeaway and what follows from it.
- **Reveal, don't decorate.** An interaction must expose an insight, such as a parameter whose
  effect the reader can see.
- **Tooltips everywhere useful:** exact values, names and metadata on hover, so the chart itself
  stays uncluttered.
- **Readable text:** axis labels, ticks, legends and annotations close to body text size.
- **Little padding:** most of the figure's area goes to data.
- **Dark mode and phones are mandatory.** Check both before you call a figure done.

Match the chart to the question:

| To show           | Use                         |
| ----------------- | --------------------------- |
| Compare values    | Bar chart, dot plot         |
| A distribution    | Histogram, box plot, violin |
| Part to whole     | Stacked bar, treemap, pie   |
| A trend           | Line chart                  |
| A relationship    | Scatter plot, bubble chart  |
| A flow or process | Sankey diagram, flowchart   |

Prefer D3 to Plotly for custom, web-native figures.

## Math

- Introduce every symbol the first time it appears.
- Prefer well-known notation to custom shorthand.
- Follow every significant formula with its meaning in plain words.
- Inline math between `$…$`, display math between `$$…$$`.
- Make an equation linkable with `\htmlId{name}{…}` inside the math, then link to `#name`.

## Citations

Cite from `app/src/content/bibliography.bib` with `[@key]`, or `@key` when the author's name is
part of the sentence. Footnotes are `[^id]` with a definition `[^id]: …`.

- **Papers: cite at every mention.** A reader may want to look a paper up from any paragraph.
- **Models, datasets, benchmarks and tools: cite at first mention** across the whole article.
  "First" follows the chapter order in `article.mdx`, not the order within one chapter file.
- **Everything citable gets cited:** models, datasets, benchmarks, architectural components,
  optimizers, schedules, inference engines, tools, and claims about prior work.
- **A hyperlink is not a citation.** A linked tool still needs its `[@key]`.
- **`@software`** for code without a paper, pointing to the repository; **`@misc` with
  `note = {Blog post}`** for references that exist only as blog posts.
- **Group the bibliography by topic,** with a `% Section` comment before each group, such as
  `% Datasets`, `% Models`, `% Methods`, `% Benchmarks` and `% Tools`. Add each new entry to its
  section, never at the end of the file.

Every record must be real: copy its metadata from the source, never reconstruct a DOI, author
list or venue from memory.

## Before you finish

After any edit to the article, audit its references:

1. Look for uncited claims about methods, benchmarks, results or prior work, and for models,
   datasets and tools mentioned without a citation.
2. Find each missing reference's BibTeX record at its source: the publisher, arXiv, Semantic
   Scholar or the project's repository.
3. Add it to `bibliography.bib`, in its section.
4. Cite it at the right place: every mention for a paper, the first mention in reading order
   for anything else.
5. When several papers could match, or the authorship is unclear, ask instead of guessing.

Then check the rendering: run `npm run dev` and look at every figure you touched, in both
themes and at phone width, and run `npm run check` before you hand the work over.
