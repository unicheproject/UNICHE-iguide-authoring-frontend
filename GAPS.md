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

### G-004 — Paths and fields differ from the backend contract

- Found: the CMS calls `/organisations/...` and `GET /organisations/{orgId}`; the backend exposes
  `/organizations/...` and has no single-organization read; the CMS reads `orgId` and `toolSlug`, the
  backend returns `organizationId` and no tool. Organization names need `GET /api/v1/organizations`
  (backend G-021, M1c).
- Consequence: the picker and creation fail against the real backend.
- Interim 2026-10-14 (owner request): `src/platform/catalogue.ts` calls `/organizations/...` and maps
  `ProjectResponse` onto `Project`; the picker shows `Organisation <id prefix>` instead of names and no
  dates, and lists Projects of every tool until backend M1c. The mapping is hand-written and goes with C0c.
- Interim 2026-10-14 (owner request): `src/platform/places.ts` reads the backend's paged Place list,
  maps `environment` to `setting`, and emulates `spatial-link` over the map and floor plan `placeId`
  (backend D-018), which works only while that map or plan is DRAFT. `maps.ts` and `floorPlans.ts` read paged
  lists, translate `visibility`/`visitorFilterEnabled`, and sync placements and positions through their
  child endpoints; floor plan connections are always empty. Assets, POIs, Routes, and Categories lists
  read as empty on the map and place screens until the backend serves them (`emptyIfMissing`).
- Interim 2026-10-14: `src/platform/pois.ts` reads the paged POI list and fills `categoryId`, `media`,
  `seoTitle`, `seoDescription` with empty values; a save carrying any of them is refused at that field,
  since the backend has no Categories or media yet and does not store SEO texts (backend D-020, Q-012).
- Interim 2026-10-15: `src/platform/routes.ts` reads the paged Route list, maps `travelMode`/`mode` and
  `HARD`/`DEMANDING`, and saves stops through the backend's `.../stops` child endpoints after the Route
  `PUT`; a save carrying a Category, media, SEO text, or an optional stop is refused at that field
  (backend D-021).
- Interim 2026-10-15: `src/platform/guides.ts` bridges the guide editor onto the backend's block model
  (backend D-022): each language's story is one TEXT block placed first, related items are REFERENCE
  blocks after it. The editor cannot yet interleave references inside the story (`12` §3); story
  images, media, SEO texts, and Page items are refused at their field (Event items allowed since the
  backend has Events, D-023).
- Interim 2026-10-15: `src/platform/events.ts` reads the paged Event list and saves occurrences through
  the backend's `.../occurrences` child endpoints after the Event `PUT`; a save with media is refused at
  its field (backend D-023). Times stay in the browser's timezone until the Project has one.
- Interim 2026-10-15: Categories are live (backend D-024). `categories.ts` reads the paged list and
  `setResourceCategory` saves a POI's or Route's Category through `.../{kind}/{id}/categories` after its
  `PUT`; `pois.ts` and `routes.ts` read it from `categoryIds`; `maps.ts` splits hidden Categories into
  `visibility.POI` and `visibility.ROUTE` by each Category's scope.
- Interim 2026-10-16: Assets and media are live (backend D-025). `assets.ts` pages the Asset list, reads
  limits from `GET /upload-limits`, and `syncMedia` saves a POI's, Route's, Guide's, or Event's media
  through `.../{kind}/{id}/resource-assets` (and `:order`) after its `PUT`, reporting a refused binding
  at `media[i]`; the four adapters read `media` from the response and no longer refuse it. `guides.ts`
  maps story `image` blocks onto the backend's `asset` nodes, whose INLINE bindings the backend derives.
  `emptyIfMissing` is gone: every collection the CMS reads now exists.
- Interim 2026-10-19: the POI editor's "How visitors reach it" card reads `.../triggers` by target and
  `syncPoiTriggers` (`platform/triggers.ts`) saves it before the POI: new rows are created and
  activated, changed rows updated, removed rows archived (backend D-026). The QR image is not offered
  (backend G-033); the list rows do not yet show trigger chips (`12` §3).
- Closed by: C0c on the generated client.

### G-005 — Calls to endpoints outside `07` §14

- Found: `assets/limits` (spec: `GET /api/v1/upload-limits`), `places/{id}/spatial-link`,
  `assets/{id}/usages` (spec: `references`), `assets/{id}/file`, `assets/{id}/download`.
- Interim 2026-10-16: limits come from `GET /upload-limits`; the backend serves `usages`, `file`, and
  `download` as recorded deviations (backend D-025, spec-change-request Q-014).
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
- Interim 2026-10-19: Preview has its own screen, a stand-in app (D-015, G-020).
- Interim 2026-10-16 (owner request): the Overview has its own screen (`OverviewView.vue`) with live
  content counts (active and draft per kind, from `?size=1&status=` on each list, `platform/overview.ts`)
  and the Project languages; its Pages, Navigation, Theme, Preview, and Launch parts show their place with
  "Not available yet", since the backend has none of them (backend M2, M6, M8).
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

### G-019 — README is the Vite template

- Found: `README.md` describes the Vue + Vite template only.
- Closed by: the status pointer (bootstrap) and a project README with C0a.

### G-020 — The editors' preview is a stand-in

- Found 2026-10-19: the "Preview" panel of the resource editors is drawn by the CMS (DECISIONS.md D-014),
  not the web runtime; it has no Project theme, no enabled-surface list, no Navigation or shell from the
  Template, and no fire-trigger control; it renders the editor's form, not `manifest?preview=true`.
- Spec: `12` §3 Resource editors, Preview; `11` §2.
- Also 2026-10-19: Visitor app → Preview is the same kind of stand-in, navigable (DECISIONS.md D-015):
  a default menu instead of the Navigation, no Pages, no theme or surfaces, data from the authoring
  endpoints instead of `manifest?preview=true`, no `contentRevision` line.
- Closed by: C5, embedding the runtime build once it and the backend preview API (backend M8) exist.

## Closed

### G-003 — Configuration points at the MuseotekBox backend

- Found: `.env.example` `VITE_API_BASE_URL=http://localhost:8080/museotekbox/api/v1`;
  `dev/docker-compose.yml` `TOOL_SLUG: museotekbox`.
- Consequence: a fresh setup calls a path the iGuide backend does not serve (`/iguide` context path).
- Closed 2026-10-08 (C0a, configuration part): `.env.example` points at
  `http://localhost:8080/iguide/api/v1`, matching backend `server.servlet.context-path=/iguide`.

### G-018 — `dev/` stand-ins out of date

- Found: `dev/README.md` asks the backend for `ASSETS_S3_*` settings it does not read yet; the mock
  Catalogue uses tool slug `museotekbox`.
- Closed 2026-10-08 (C0a, configuration part): the mock and `dev/docker-compose.yml` use tool slug
  `iguide` (backend `uniche.tool.slug` default); `dev/README.md` lists only the backend settings in its
  current `application.properties`.
