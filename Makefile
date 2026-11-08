.DEFAULT_GOAL := help
.PHONY: help doc doc-build doc-check demo-remove update-template

DOC_PORT ?= 8031

help:
	@printf '%s\n' 'make doc              Read the documentation locally' 'make doc-build        Build the documentation into docs-dist/' 'make doc-check        Check documentation links and build the documentation' 'make demo-remove      Replace the demo article with a one-chapter starter' 'make update-template  Bring in the template'"'"'s later changes on a branch' 'Choose a port with: make doc DOC_PORT=8032'

doc:
	npm run docs:dev -- --port $(DOC_PORT)

doc-build:
	npm run docs:build

doc-check:
	npm run docs:check
	npm run docs:build

demo-remove:
	node tools/demo-remove.mjs

# Pass options with ARGS, such as make update-template ARGS="--branch development".
update-template:
	node tools/update-template.mjs $(ARGS)
