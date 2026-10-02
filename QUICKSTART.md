# QUICKSTART

Every command here ran on 2026-10-02. AGENTS.md §10 is the command table.

## Prerequisites

- Node 22 (22.12 verified) and pnpm 9 (9.15.9 verified); do not use `npm ci` (GAPS.md G-010);
- for the full dev box: the backend running as in `../uniche_iguide_backend/QUICKSTART.md`
  (`make infra-up` there), network access to `https://idp.uniche-eccch.eu`, and a test user of the live
  realm (credentials from the project owner, never committed).

## First run

```bash
make setup        # pnpm install --frozen-lockfile
cp .env.example .env.local
```

In `.env.local` set the backend API to the iGuide context path (`.env.example` still names MuseotekBox,
GAPS.md G-003, fixed by PLAN.md C0a):

```text
VITE_IDP_URL=https://idp.uniche-eccch.eu
VITE_REALM=uniche
VITE_CLIENT_ID=iguide-web
VITE_AUDIENCE=uniche-platform
VITE_API_BASE_URL=http://localhost:8080/iguide/api/v1
```

```bash
make dev          # http://localhost:5173, the only origin iguide-web accepts
```

The browser goes through the live Keycloak login and returns to the CMS. Screens beyond sign-in depend on
the backend milestones (PLAN.md).

## Daily work

```bash
make typecheck    # vue-tsc -b
make build        # vue-tsc -b && vite build, output in dist/
make dev
```

## Stopping

Stop `make dev` with Ctrl-C; stop the backend with `make infra-down` in its repository.

## Not available yet

Lint, tests, accessibility checks, `api-sync`, and a container image (GAPS.md G-002, G-011 to G-015). The
`dev/` stand-ins (local Keycloak, Catalogue mock, S3 mock) are optional and were not run in the bootstrap
(DECISIONS.md D-010).
