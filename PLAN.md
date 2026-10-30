# PLAN

Specs baseline: see AGENTS.md §3. Acceptance for every step is `08` §Companion repositories: the screens
of `12` for that step exist against the real backend and pass the checks of `14`. Every item also keeps
`make typecheck` and `make build` green.

Goal (DECISIONS.md D-009, backend D-015): sign-in, picker, and Project creation work end to end on a dev
box against the live Keycloak and Catalogue through the backend. Backend counterpart:
`../uniche_iguide_backend/PLAN.md` M0a, M1a, M1c.

## Now

### C0a — Dev-box platform wiring and sign-in against the live realm

- Outcome: a fresh clone signs in to the live realm with `iguide-web` and reaches the backend on the dev
  box with the documented configuration.
- Spec refs: `02` §1, `07` §15, `12` §6 (session expired), specs `CLAUDE.md` inv. 3, 17.
- Closes: G-019 (README pointer only); G-003 and G-018 are closed by the configuration below.
- Depends on: nothing; the backend runs as in its QUICKSTART.md.
- Non-goals: the picker data and the generated client (C0b, C0c).
- Acceptance:
  - `.env.example` points at `http://localhost:8080/iguide/api/v1`; the dev stand-ins use tool slug
    `iguide`; `dev/README.md` matches the backend's current properties (done);
  - a Playwright test signs in through the live realm with a test user, lands authenticated, and the
    token carries `aud` `uniche-platform` and `azp` `iguide-web`;
  - a reload keeps the session through `check-sso` without a login page;
  - with a value missing from the configuration the CMS shows the configuration error, not a blank page;
  - a forced `401` from the API triggers one refresh and one retry, then the login redirect.

### C0b — API contract sync and generated client

- Outcome: `make api-sync` copies the backend contract, records its commit, and regenerates the client;
  CI fails on drift.
- Spec refs: AGENTS.md §7; DECISIONS.md D-005; backend D-004.
- Closes: G-002, part of G-001, G-014.
- Depends on: backend M0a (committed `openapi/openapi.yaml`).
- Non-goals: rewriting the content editors (C2, C3 slices).
- Acceptance:
  - `api/openapi.yaml` and `api/SOURCE` exist; `make api-sync` reproduces them from the backend;
  - `src/api/generated/` is produced by openapi-typescript and used through openapi-fetch with the auth
    and problem-details middleware;
  - a CI job regenerates and fails on a diff; `make typecheck` and `make build` stay green.

### C0c — C0 screens against the real backend

- Outcome: picker popover, Project creation step 1, Project open, and the error states work against the
  backend and the live Catalogue.
- Spec refs: `12` §3 (Project picker, Dashboard shell), §4 (Create a Project step 1, Manage members),
  §5, §6, §7; `14` §4; `02` §10, §11.
- Closes: G-004, G-006, G-008 (picker and create step 1), G-017.
- Depends on: C0b; backend M0a, M1a, M1c.
- Non-goals: initialization steps 2–3 and resume (C1a, needs backend M2); deleted Projects and restore
  (backend D-011).
- Acceptance, each with a Playwright test against the dev box:
  - the picker lists the caller's organizations by name and only `iguide` Projects; creation is offered
    only for a managed organization;
  - creation step 1 creates the Project in the Catalogue; a duplicate slug shows the field error from the
    problem details; the slug follows the name until edited;
  - opening a Project of another tool or without access shows the not-found state; `502`, `503`, `504`
    show "the UNICHE platform is not reachable" with the `requestId`; `403` shows access denied;
  - "Manage members" links to the Catalogue interface;
  - axe reports no WCAG 2.1 AA violation on the picker, the creation page, and each error state.

### Owner-instructed interim screens (outside the C order)

- 2026-10-16: Visitor app Overview with live content counts and languages; its Pages, Navigation, Theme,
  Preview, and Launch panels wait for backend M2, M6, M8 (GAPS.md G-009, `OverviewView.vue`).
- 2026-10-19: "Preview" beside Save in the Place, POI, Route, Guide, and Event editors, a CMS-drawn
  stand-in from the live form until the runtime can be embedded (DECISIONS.md D-014, GAPS.md G-020).
- 2026-10-19: Visitor app → Preview as a navigable stand-in app with surfaces, languages, working or
  live content, fire trigger, and open in new tab (DECISIONS.md D-015, GAPS.md G-020).
- 2026-10-19: "Translations" panel under Status in the Place, POI, Route, Guide, Event, and Category editors:
  per language Complete, Partial (n of m fields), or Missing, from the live form, counting the fields the
  lists count; a row opens that language's tab.
- 2026-10-27: uploads alike everywhere (limits checked first incl. the global one, progress rows, Retry, Cancel,
  announcements), multi-file picker with drop, Replace only for DRAFT Assets, one "Used in" card, floor-plan alt
  text, decorative confirmed; Category "Applies to" lock shown (DECISIONS.md D-032).
- 2026-10-27: Guide story as ordered blocks: text and references interleaved, captions, drag / position
  reordering, insert after any block or text node, alt text shown under story images; the Translation workspace
  shows every block (DECISIONS.md D-031).
- 2026-10-29: "Featured" chip and a search-language choice in the Content lists (DECISIONS.md D-035).
- 2026-10-29: activation refused from a Content list opens the editor at the first missing field (DECISIONS.md D-036).
- 2026-10-29: where-used entries link to where they are edited, triggers included; a failed check keeps archive and deactivate off (DECISIONS.md D-037).
- 2026-10-30: an image-only story block counts as written, as the backend counts it (backend D-038).
- 2026-10-27: pan and zoom in the map editor set the map's initial view (DECISIONS.md D-034).
- 2026-10-27: POI "3D model" with its required poster, and an "All languages" row in per-language media such as
  the audio narration (DECISIONS.md D-033).
- 2026-10-27: Place setup editable (setting, level with parent, map or floor plan) and "Open map" for outdoor
  Places (DECISIONS.md D-030).
- 2026-10-27: Route stops reorder by drag and drop, Move up / down, or a position list; per-stop warning when
  its point of interest is not ACTIVE; warning that stop links change on an ACTIVE Route; walking instructions
  labelled (DECISIONS.md D-029).
- 2026-10-27: Content quick fixes: no "Optional" on Route stops, no SEO fields in the POI, Route, and Guide
  editors, no floor-plan "Connections"; POI "Practical details" collapsed; a warning for Routes with fewer than
  two stops; the Route map lists the stops it can't draw; the Place creation hint fixed (DECISIONS.md D-028).
- 2026-10-26: Translation workspace → "Translate with MuseMind" for the open Resource and language (a "mock"
  badge on the dev box's mock gateway), AI markers ("AI · unreviewed" / "AI · reviewed", pending) in the matrix
  and the editor with service, time, and citations, "Mark reviewed", and a working "Unreviewed AI output" filter
  (DECISIONS.md D-026, backend D-035).
- 2026-10-26: "Translate with MuseMind" covers the whole open item: own texts, each stop, the Guide story (rich
  text), and media items, with a marker and "Mark reviewed" per part (DECISIONS.md D-027, backend D-036).
- 2026-10-26: problem details read as specified (code, URN type, structured field errors, X-UNICHE-Request-Id)
  and a field-by-field choice on a DRAFT save conflict (DECISIONS.md D-025, backend D-034).
- 2026-10-26: unsaved form state kept in browser storage per author and editor, offered back with Restore or
  Discard (DECISIONS.md D-024).
- 2026-10-26: a collapsed field group opens by itself when one of its fields has an error or is the target of
  "What needs attention", so focus reaches the field (completes DECISIONS.md D-022).
- 2026-10-23: Resource editors arranged as the prototype: form and side column together, pending chip in the head,
  Preview in app, Status and visibility, Used in (DECISIONS.md D-023).
- 2026-10-23: readiness on the Dashboard (status card) and the Resource form ("What needs attention", focus on the
  first invalid field), on backend D-033 (DECISIONS.md D-022).
- 2026-10-23: Visitor app → Translations, the Translation workspace: matrix by language, side-by-side editor with
  the Guide story and Route stops, next missing, ACTIVE through working copies (DECISIONS.md D-021).
- 2026-10-22: App settings → Surfaces (enable switches, Web public address) and the backend's QR image with its
  runtime URL in the trigger card; the stand-in stays only without an address (DECISIONS.md D-020, backend D-029).
- 2026-10-22: QR image, link, copy, download, and open in the trigger card, a stand-in opening the CMS preview of
  the visitor app with `?t=` until the app has its public web address (DECISIONS.md D-019, GAPS.md G-021).
- 2026-10-22: triggers on Places, Routes, Guides, and Events: the "How visitors reach it" card in their editors and
  chips in their lists (DECISIONS.md D-018, backend D-028).
- 2026-10-22: trigger chips under each POI row, or "No trigger, only reachable by browsing" (`12` §3).
- 2026-10-21: drag-and-drop reordering, with Move up / Move down buttons, in the Places, POIs, Routes, Guides,
  Events, Categories, and Floor plans lists (DECISIONS.md D-017).
- 2026-10-21: ACTIVE Resources edited through their working copy in the eight content editors, with
  "Pending changes" in the lists (DECISIONS.md D-016, GAPS.md G-007, backend M8w).
- 2026-10-19: "How visitors reach it" card in the POI editor (Bluetooth beacon, geo-proximity, QR code;
  AR scan target greyed as deferred), on backend D-026.

## Next

### C0d — Quality gates

- ESLint and Prettier, Vitest, Playwright with axe as `make test` and `make a11y`, CI running all of them;
  `package-lock.json` removed. Closes G-010, G-011, G-012, G-013, G-014. Placed after C0c by owner
  priority; C0c already brings the first Playwright and axe tests.

### C0e — Dashboard shell

- `12` §3 Dashboard as far as backend data exists (status card, empty five-step guide). Depends on backend
  M8 for readiness and statistics; until then the shell and the empty state only. Part of G-008.

### C1a — Initialization steps 2–3 and resume

- `12` §4 Create a Project steps 2–3, "resume initialization" in the picker. Depends on backend M2a and the
  `POST /initialize` slice. Closes the rest of G-008.
