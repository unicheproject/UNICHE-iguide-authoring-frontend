# Wraps only commands verified on 2026-10-02 (AGENTS.md §10). Missing targets are gaps in GAPS.md, not
# placeholders: lint (G-011), a11y (G-012), test (G-013), api-sync (G-002).

.PHONY: setup typecheck build dev

## setup: install dependencies from pnpm-lock.yaml
setup:
	pnpm install --frozen-lockfile

## typecheck: type-check every .vue and .ts file
typecheck:
	pnpm exec vue-tsc -b

## build: type-check and build the production bundle into dist/
build:
	pnpm run build

## dev: serve the CMS on http://localhost:5173 (the iguide-web redirect origin)
dev:
	pnpm dev
