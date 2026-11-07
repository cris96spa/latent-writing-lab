.DEFAULT_GOAL := help
.PHONY: help doc doc-build doc-check

DOC_PORT ?= 8031

help:
	@printf '%s\n' 'make doc        Read the interactive guide locally' 'make doc-build  Build the guide into docs-dist/' 'make doc-check  Check documentation links and build the guide' 'Choose a port with: make doc DOC_PORT=8032'

doc:
	npm run docs:dev -- --port $(DOC_PORT)

doc-build:
	npm run docs:build

doc-check:
	npm run docs:check
	npm run docs:build
