# Project and publishing workflow

This workspace builds one article from `app/src/content/article.mdx`, with optional
standalone figure pages. Use one repository per independently published article
project. An article can contain several chapters and figures without needing more
repositories.

## Start a project from the template

Keep a reusable starter containing the upstream demonstration, authoring guides, verification tools
and CI. Create a separate repository from that starter for each independent article.

When the starter is enabled as a GitHub template repository, use **Use this template →
Create a new repository**. Select its default branch. GitHub creates an independent
project with the starter's files and a fresh history. A fork retains the upstream
history and connection; it is useful when contributing changes back to the starter.
See GitHub's [template guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
and [fork reference](https://docs.github.com/en/pull-requests/reference/forks).

The GitHub template setting is repository configuration, not a file in this workspace.
If the button is absent, an owner must enable that setting, or create a new repository
and copy the versioned starter files into it. Do not copy local dependencies, build
output, credentials or the starter's `.git` directory into a fresh-history project.

A GitHub-generated project uses the files on GitHub. Commit, review and push starter
changes to its default branch before expecting new projects to include them. Local
uncommitted changes and changes on other branches are not part of that snapshot.
Record the starter revision used in the new project's README; the existing
`template-provenance.json` identifies the upstream research-template engine separately.

## Choose the right unit of work

| You are working on                                   | Use                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| A separately published article or research explainer | A new repository from the starter                               |
| Another section or figure in that article            | Another chapter or embed in the same repository                 |
| A draft, revision or experiment for that article     | A branch in that article's repository                           |
| A reusable tooling or CI improvement                 | A change to the starter, reviewed separately from article prose |
| An archive of many posts on your personal site       | Your site's content index, linking to article projects          |

Branches organize revisions of one project. The supplied build does not create one
article URL per branch, nor does CI deploy branch previews. Supporting many articles
under one site's `/articles/<slug>/` routes would require a separate routing and content
extension; adding chapter files alone does not provide it.

## Author, review, publish

1. **Initialize.** Create the article repository, clone it, run `npm ci`, and start
   `npm run dev`. Update the project name, README metadata and article metadata.
2. **Draft.** Work on a branch. Replace the demo chapter imports with your article's
   chapters. Keep a visible draft label while reviewing. Imported content is built;
   there is no private-draft filtering mechanism.
3. **Curate examples.** Remove unused standalone entries from `figures.json` when
   they should not be published. Update or remove their corresponding browser tests.
   Unimported chapters are absent from the article, but registered figures still build.
4. **Review.** Run `npm run check`, `npm run docs:check`, and `npm run test:e2e`.
   Use a pull request to review prose, sources, scientific assumptions and screenshots.
   CI checks both supported Node versions and stores build/test artifacts.
5. **Export.** Build the reviewed revision, run the native exporters you need, and
   inspect their output. Review the article on mobile and in both themes as well.
6. **Publish.** Merge the reviewed article and deploy its static output or container
   to its chosen host. Deployment is an explicit step; this repository's CI does not
   publish automatically. Link the resulting article from your personal site.

See [Your first article](first-article.md) for the concrete files, commands and examples.

## Keep shared figures in one place

Give a reusable figure one owning project. That project maintains its HTML source,
data and tests, and serves its standalone `/figures/<name>/` page. Other sites can
embed that page using the [iframe integration](integration.md).

For example, an article can own its interactive chart while your personal
site embeds that figure's published URL. A deployed update at that URL then appears
wherever it is embedded. If a publication needs an immutable figure, use a versioned
deployment URL and keep that deployment available.

Copying a figure into another project creates another maintained copy. Template
generation alone does not provide a shared figure library or synchronization between
repositories. Hosting a canonical figure is the supported way to reuse it without
duplicating its implementation; the host's framing policy must permit embedding.

## Maintain the starter and article projects

Creating a project from a template is a snapshot, not a live dependency. CI fixes and
other starter improvements do not automatically arrive in existing article projects.
Bring applicable fixes across as reviewed patches or commits, then run the article's
checks. Do not replace an article's content directory with the starter's placeholder content.

For changes to the delegated HF engine, follow the [upstream update procedure](baseline.md).
The supplied native sync command targets the research article template, not this
starter's custom CI or guides. It is not an automatic update channel for all article
repositories. Prefer engine fixes upstream and keep project-specific code small.
