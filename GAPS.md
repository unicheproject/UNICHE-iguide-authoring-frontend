# GAPS

Deliberate or found incompleteness, measured against the specs baseline (AGENTS.md §3). Ids are never
reused. A closed gap keeps its entry with the closing evidence and date.

Found 2026-10-02 by the bootstrap session (install, typecheck, build, dev server, code inspection,
prototype inventory).

## Open

### G-001 — Hand-written API types and resource clients

- Found: every module in `src/platform/` except `auth.ts` and `config.ts` declares its own request and
  response types and paths (`catalogue.ts`, `authorization.ts`, `assets.ts`, `places.ts`, `pois.ts`,
  `routes.ts`, `guides.ts`, `events.ts`, `categories.ts`, `maps.ts`, `floorPlans.ts`, `languages.ts`,
  `references.ts`).
- Spec: AGENTS.md §7.
- Consequence: drift from the backend goes unnoticed until runtime.
- Closed by: C0b for the C0 endpoints, then each C-step slice for its modules.

### G-002 — No contract copy, generator, or drift check

- Found: no `api/`, no generator, no `api-sync`. The backend has no committed contract yet (backend G-004).
- Closed by: C0b after backend M0a.

### G-003 — Configuration points at the MuseotekBox backend

- Found: `.env.example` `VITE_API_BASE_URL=http://localhost:8080/museotekbox/api/v1`;
  `dev/docker-compose.yml` `TOOL_SLUG: museotekbox`.
- Consequence: a fresh setup calls a path the iGuide backend does not serve (`/iguide` context path).
- Closed by: C0a.

### G-004 — Paths and fields differ from the backend contract

- Found: the CMS calls `/organisations/...` and `GET /organisations/{orgId}`; the backend exposes
  `/organizations/...` and has no single-organization read; the CMS reads `orgId` and `toolSlug`, the
  backend returns `organizationId` and no tool. Organization names need `GET /api/v1/organizations`
  (backend G-021, M1c).
- Consequence: the picker and creation fail against the real backend.
- Closed by: C0c on the generated client.

### G-005 — Calls to endpoints outside `07` §14

- Found: `assets/limits` (spec: `GET /api/v1/upload-limits`), `places/{id}/spatial-link`,
  `assets/{id}/usages` (spec: `references`), `assets/{id}/file`, `assets/{id}/download`.
- Consequence: C2 and C3 editors cannot work against a spec-conformant backend.
- Closed by: the C2 and C3 slices aligning on the generated client, or backend spec-change-requests where a
  path is genuinely needed.

### G-006 — Error parsing does not follow RFC 7807 as specified

- Found: `src/platform/api.ts` reads `details: string[]` ("path: message"); the spec envelope carries
  `errors: [{path, code, message}]` (`07` §15). `requestId` falls back to the header correctly.
- Closed by: C0c, with a test per error shape.

### G-007 — No Working Copy flow

- Found: no editor calls `working-copy`, `working-copy:apply`, or shows the pending banner's actions
  against the API; saves of `ACTIVE` Resources would go to the live row.
- Spec: `03` §1, `12` §3 Resource editors, §4 Edit an ACTIVE Resource, specs `CLAUDE.md` inv. 9.
- Closed by: the C5 working-copy slice after backend M8, with Playwright tests per `12` §4.

### G-008 — C0 and C1 screens differ from `12`

- Found: the picker is a page (`HomeView.vue`), not a header popover; Project creation stops after step 1
  (no Template, style, languages, surfaces, `POST /initialize`, or resume); the Dashboard shows only
  Catalogue details.
- Spec: `12` §3 Project picker and Dashboard, §4 Create a Project.
- Closed by: C0c (picker, step 1), C0e (Dashboard shell), C1a (steps 2–3, resume).

### G-009 — Stub screens

- Found: `SectionView.vue` renders "Not available yet" for Overview, App settings (Appearance,
  Surfaces, Features), Pages, Navigation, Translations, Preview, Launch, and Audit log. The Navigation
  subtitle in `src/workspace/sections.ts` copies the prototype's per-surface menus (DECISIONS.md D-004 P1)
  and the Preview subtitle says "unpublished".
- Closed by: C1 (App settings), C4 (Pages, Navigation), C5 (Overview, Translations, Preview, Launch), C6
  (Audit log).

### G-010 — Two lockfiles, npm one out of sync

- Found 2026-10-02: `npm ci` fails ("Missing: leaflet@1.9.4 … from lock file").
- Closed by: C0d removing `package-lock.json` (DECISIONS.md D-007).

### G-011 — No lint or format tooling

- Closed by: C0d (`make lint` green in CI).

### G-012 — No accessibility check

- Spec: `14` §1, §4; AGENTS.md §8.
- Closed by: C0c (first axe tests) and C0d (`make a11y` in CI).

### G-013 — No tests

- Found: no Vitest or Playwright configuration, no test files.
- Closed by: C0a (first Playwright sign-in test), C0d (`make test` in CI).

### G-014 — No CI

- Closed by: C0b (contract drift job) and C0d (full pipeline).

### G-015 — No container image

- Found: no Dockerfile or nginx configuration; `10` §6 lists a `cms` nginx service, which the backend
  compose adds as a profile once this repository ships an image (backend D-010).
- Closed by: a Dockerfile serving `dist/` with `config.js` injected per environment.

### G-016 — Public OpenStreetMap tiles and Nominatim

- Found: `GeoMapCanvas.vue` and `src/platform/maps.ts` use the public services, which forbid production
  use.
- Spec: `09` §22 (open).
- Closed by: the production tile and geocoding decision, moved behind configuration.

### G-017 — Authorization view field names depend on the backend

- Found: the CMS reads `managedOrganisations` (Catalogue spelling); the backend currently renames it to
  `managedOrganizations` (backend G-007), so "Create Project" stays hidden.
- Closed by: backend M1a passthrough, then C0c on the generated type.

### G-018 — `dev/` stand-ins out of date

- Found: `dev/README.md` asks the backend for `ASSETS_S3_*` settings it does not read yet; the mock
  Catalogue uses tool slug `museotekbox`.
- Closed by: C0a.

### G-019 — README is the Vite template

- Found: `README.md` describes the Vue + Vite template only.
- Closed by: the status pointer (bootstrap) and a project README with C0a.
