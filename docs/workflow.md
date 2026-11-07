# Project and publishing workflow

The workspace builds exactly one article, and the rest of the workflow follows from that. An
article you publish separately needs its own repository, a new section of it is a chapter, and
a revision is a branch. This page explains how to start an article project from this starter,
take it from draft to publication, share figures between websites, and keep projects up to
date. The interactive guide (`make doc`) has the hands-on version of the first steps.

## Choose the unit of work

| You are working on                                   | Use                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| A separately published article or research explainer | A new repository from the starter                               |
| Another section or figure in that article            | Another chapter or embed in the same repository                 |
| A draft, revision or experiment for that article     | A branch in that article's repository                           |
| A reusable tooling or CI improvement                 | A change to the starter, reviewed separately from article prose |
| An archive of many posts on your personal site       | Your site's content index, linking to article projects          |

Branches organize revisions of one article. The build does not create a URL per branch, and
CI does not deploy previews. Serving many articles under one site's `/articles/<slug>/` routes
would need a routing and content extension that the workspace does not include.

## Start an article project

This repository is the starter: it carries the upstream demonstration, the guide, the checks
and CI. Create each article project from it as a GitHub template repository, which gives the
project the starter's files with a history of its own.

1. On the starter's GitHub page, choose **Use this template → Create a new repository** and
   keep the default branch selected.
2. Clone the new repository, then run `npm ci` and `npm run dev`. The demonstration article
   appears at <http://127.0.0.1:4321/>.
3. Record the starter commit you started from in the project's README, so you can tell later
   which starter fixes the project lacks.
4. Rename the project in `README.md` and `package.json`, and replace the article metadata.

GitHub copies the starter's default branch as it is on GitHub. Push starter changes to that
branch before creating a project that should include them; uncommitted work and other branches
are not copied.

If **Use this template** is missing, an owner enables **Template repository** in the
repository settings. Alternatively, create an empty repository and copy the starter's tracked
files into it, leaving out `.git`, `node_modules`, build output and any credentials. Fork the
starter instead only when you intend to contribute changes back to it, since a fork keeps the
starter's history and its connection to it. GitHub's
[template guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
and [fork reference](https://docs.github.com/en/pull-requests/reference/forks) describe both.

## From draft to publication

1. Work on a branch, and replace the demonstration chapter imports with your own chapters.
   Keep a visible draft label in the article while it is under review: everything imported is
   built, and no setting hides a draft.
2. Remove the entries in `app/src/content/figures.json` that you do not want published, along
   with their browser tests. Unimported chapters disappear from the article, but every
   registered figure still gets its own page.
3. Run `npm run check`, `npm run docs:check` and `npm run test:e2e`, then open a pull request.
   Review the prose, sources, scientific assumptions and screenshots there, while CI repeats
   the checks on Node 22 and 24.
4. Build the reviewed revision, run the exporters you need and inspect their output. Read the
   article on a phone and in both themes.
5. Merge, then deploy `app/dist` or the container to your host. Deployment is a deliberate
   step, because CI builds artifacts but never publishes them. Link the article from your
   personal site.

The guide's **Review and publish** section has the commands for exporting and hosting.

## Share a figure between websites

Copying a figure into a second project creates a second implementation, and the two drift
apart. Instead, give a reusable figure one owning project. That project keeps the figure's HTML
source, data and tests, and serves its standalone page at `/figures/<name>/`. Other websites
embed that page as described in [Reuse a figure on another website](integration.md), so each
deployment of the owner updates every site that shows the figure.

When a publication needs a figure that never changes, embed a versioned deployment URL and
keep that deployment online. In both cases, the hosting policy of the owning project must
allow other sites to frame its pages.

## Keep projects up to date

A project created from the template is a snapshot, so improvements to the starter, such as CI
fixes, do not reach existing projects. Bring each applicable fix across as a reviewed patch and
run the project's checks. Never copy the starter's content directory over an article's,
because that replaces the article with the demonstration.

The upstream engine is updated separately, following the procedure in
[Upstream and provenance](baseline.md). The template's sync command covers the research
article template only, not this starter's CI or guide, so it cannot update article projects
either. Prefer fixing engine bugs upstream over patching them in each project.
