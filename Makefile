# Wraps only verified commands (AGENTS.md §10). Missing targets are gaps in GAPS.md, not placeholders:
# lint (G-011), a11y and unit tests in CI (G-012, G-013, G-014), api-sync (G-002).

.PHONY: setup typecheck build check-css check-literals check dev e2e image

## setup: install dependencies from pnpm-lock.yaml (Node from .node-version, pnpm from packageManager)
setup:
	vp install --frozen-lockfile

## typecheck: type-check every .vue and .ts file
typecheck:
	vp exec vue-tsc -b

## build: type-check and build the production bundle into dist/
build:
	vp run build

## check-css: fail when a design-token class (size, z, shadow, radius, type, spacing, colour, custom screen) in any source file has no CSS rule (C2-01, C3-97)
check-css:
	node scripts/check-css-tokens.mjs --all

## check-literals: fail when CMS-chrome markup uses a px font size, arbitrary radius, shadow or z-index, uppercase or a hex colour (C3-98)
check-literals:
	node scripts/check-literals.mjs

## check: both gates above (not part of `build`; wiring them into the build or CI is the owner's choice)
check: check-css check-literals

## dev: serve the CMS on http://localhost:5173 (the iguide-web redirect origin)
dev:
	vp dev

## e2e: Playwright and axe tests against a running stack (e2e/README.md)
e2e:
	vp exec playwright test

## image: build the container image; config.js comes from the environment at start (D-068)
image:
	docker build -t uniche-iguide-cms:local .
