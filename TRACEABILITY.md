# TRACEABILITY

Status comes only from runs that passed. Values: `not started`; `in progress` (code exists, not proven
against the real backend); `done` (the screens of `12` for the step work against the real backend and pass
the checks of `14`, `08` §Companion repositories). Backend status is referenced, never copied: read
`../uniche_iguide_backend/TRACEABILITY.md`.

## Evidence runs

| Id | Date | Command | Result |
|---|---|---|---|
| F1 | 2026-10-02 | `npm ci` | failed: `package-lock.json` out of sync (G-010) |
| F2 | 2026-10-02 | `pnpm install --frozen-lockfile` | passed, 2 s |
| F3 | 2026-10-02 | `pnpm exec vue-tsc -b` | passed, 6 s |
| F4 | 2026-10-02 | `pnpm run build` | passed, 10 s |
| F5 | 2026-10-02 | `pnpm dev`, `GET http://localhost:5173/` | `200` |
| F6 | 2026-10-02 | PKCE login with `iguide-web` against the live realm (script, from the backend session) | redirect `http://localhost:5173/` accepted, token `aud` includes `uniche-platform`, CORS origin `http://localhost:5173` allowed; other redirects rejected |

No automated test exists, so no screen is proven.

## CMS steps

| Step | Outcome | Key specs | Backend dependency | Status | Evidence |
|---|---|---|---|---|---|
| C0 | sign-in, picker, creation step 1 with resume, Dashboard shell, error and conflict envelopes, WCAG baseline | `12` §3 Project picker, Dashboard; §4 Create a Project; §5; §6 | Milestone 1 (backend TRACEABILITY.md) | in progress | F3–F6; sign-in code in `src/platform/auth.ts`; G-004, G-006, G-008 |
| C1 | Template selection, languages and surfaces, theme editor with contrast, first-run checklist | `12` §3 App settings; §4 Create a Project steps 2–3, Add or remove a language, Change surfaces | Milestone 2 | in progress (Languages screen only, unproven) | `LanguagesView.vue` |
| C2 | asset library, upload with progress and limits, alternative text and decorative flag, translation workspace | `12` §3 Media library, Translation workspace; §5 | Milestone 3 | in progress (media library on the backend's Assets since 2026-10-16, `pnpm run build` green; no tests) | `MediaView.vue`, `UploadDialog.vue`, `assets.ts` `syncMedia`; G-005 |
| C3 | content libraries, ordering, where-used and archive, place hierarchy, route editor, map and floor plan editors, triggers and QR | `12` §3 Content library, Resource editors, Maps & Floor Plans; §4 Archive or deactivate, Generate a QR code | Milestones 4 and 5 | in progress (editors exist with Working Copy since 2026-10-21, unproven) | `views/workspace/*`; G-005, G-007 |
| C4 | page builder, navigation editor, capability warnings | `12` §3 Page builder, Navigation editor | Milestone 6 | not started | G-009 |
| C5 | preview iframe and fire-trigger control, working copy apply and discard, readiness, Application activation | `12` §3 Preview, Launch, Visitor app overview; §4 Edit an ACTIVE Resource, Activate or suspend | Milestone 8 | in progress (working copy save, apply, discard only, D-016, unproven) | G-007, G-009 |
| C6 | audit log, events calendar, package request, polling, download, stale | `12` §3 Audit log, Launch; §4 Request and download a Deployment Package | Milestones 7, 9, 11 | in progress (Events editor only, unproven) | `EventsView.vue`; G-009 |

## Screens and states (`12` §3, §6)

States: L loading, E empty, O offline CMS, C Catalogue unavailable, D Project soft-deleted, A access
denied, S session expired, P stale preview.

| Screen (`12` §3) | Status | States handled in code (unproven) | Tests |
|---|---|---|---|
| Project picker | in progress (page, not popover) | L, C, A partly | none |
| Create a Project (`12` §4) | in progress (step 1 only) | C, field errors | none |
| Project workspace navigation | in progress | capability "OFF" chips | none |
| Dashboard | in progress (readiness status card since 2026-10-23, D-022; Catalogue details; no tests) | — | none |
| Content library: Places | in progress (drag-and-drop and keyboard reordering since 2026-10-21, D-017; trigger chips since 2026-10-22, D-018; build green, no tests) | L, E | none |
| Content library: Points of Interest | in progress (drag-and-drop and keyboard reordering since 2026-10-21, D-017; trigger chips since 2026-10-22; build green, no tests) | L, E | none |
| Content library: Routes | in progress (drag-and-drop and keyboard reordering since 2026-10-21, D-017; trigger chips since 2026-10-22, D-018; build green, no tests) | L, E | none |
| Content library: Guides | in progress (drag-and-drop and keyboard reordering since 2026-10-21, D-017; trigger chips since 2026-10-22, D-018; build green, no tests) | L, E | none |
| Content library: Events | in progress (drag-and-drop and keyboard reordering since 2026-10-21, D-017; trigger chips since 2026-10-22, D-018; build green, no tests) | L, E | none |
| Content library: Categories | in progress (drag-and-drop and keyboard reordering since 2026-10-21, D-017; build green, no tests) | L, E | none |
| Resource editors (Place, POI, Route, Category, Guide, Event) | in progress (Working Copy save, apply, discard, apply-conflict choice since 2026-10-21, D-016; "What needs attention" from readiness and focus on the first invalid field since 2026-10-23, D-022; prototype arrangement with Used in, D-023; `vue-tsc` and build green, no tests) | L | none |
| Triggers ("How visitors reach it") on Places, POIs, Routes, Guides, Events | in progress (QR, beacon, geo-proximity; other kinds than POIs since 2026-10-22, D-018, backend D-028; stand-in QR image and link since 2026-10-22, D-019, G-021; the backend's QR image and runtime URL once the Project has a public address, D-020; `vue-tsc` and build green, no tests) | — | none |
| Preview screen (Visitor app → Preview) | in progress (navigable stand-in, D-015, G-020; `pnpm run build` and a rendered harness check, no tests) | — | none |
| Preview in app (resource editors) | in progress (CMS-drawn stand-in, D-014, G-020; `pnpm run build` green, no tests) | — | none |
| Media library and Asset picker | in progress | L, E | none |
| Translation workspace | in progress (matrix, side-by-side editor with story and stops, next missing, working copies since 2026-10-23, D-021; AI parts wait for the gateway; build green, no tests) | L, E | none |
| Maps & Floor Plans | in progress (floor plans reorder per Place since 2026-10-21, D-017; build green, no tests) | L | none |
| Visitor app overview | in progress (content counts and languages live, other panels wait for the backend; `pnpm run build` green, no tests) | — | none |
| Page builder | not started | — | none |
| Navigation editor | not started | — | none |
| App settings: Appearance, Features | not started | — | none |
| App settings: Surfaces | in progress (enable switches and the Web public address since 2026-10-22, D-020, backend D-029; `vue-tsc` and build green, no tests) | L | none |
| App settings: Languages | in progress | L | none |
| Preview | not started | — | none |
| Launch | not started | — | none |
| Audit log | not started | — | none |
| Session expired (S) | in progress | refresh and retry once, then login | none |
