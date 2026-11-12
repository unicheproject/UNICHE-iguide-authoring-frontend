# Wraps only verified commands (AGENTS.md §10). Missing targets are gaps in GAPS.md, not placeholders:
# lint (G-011), a11y and unit tests in CI (G-012, G-013, G-014), api-sync (G-002).

.PHONY: setup typecheck build dev e2e

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

## e2e: Playwright and axe tests against a running stack (e2e/README.md)
e2e:
	pnpm exec playwright test
