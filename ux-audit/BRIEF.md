# iGuide CMS — UI/UX overhaul brief (owner's instructions, 2026-11-12)

This is the owner's brief, copied for agents. It is authoritative for the overhaul. Credentials are not
reproduced here: they are in `ux-audit/tools/accounts.local` and used only through `tools/session.mjs`.

## 0. Goal

Make the iGuide CMS the most usable authoring tool it can be for the people in §2. The owner explicitly
allows **drastic changes**: layouts, page structure, navigation affordances, component patterns, copy,
visual language, and interaction models may be replaced wherever that makes the tool easier to use. Be
exhaustive and nit-picky: every screen, every state, every control, every string.

3 rounds, each: **Audit** → **Implementation** → **owner review gate**. Round 1 broad and structural;
Round 2 verifies round 1 and goes after the details; Round 3 nit-and-grit plus full regression walk.
Target: every in-scope screen **≥ 90** on the rubric by the end of round 3 (mean ≥ 93). Scores are capped
while problems are open (see Scoring).

## 1. Scope

**In scope** (everything an author sees from sign-in onward):

| Area | Screens and states |
|---|---|
| Sign-in and session | Sign-in view, silent SSO landing, session-expired, configuration error, access denied (`403`), not found / soft-deleted Project (`404`), platform unreachable (`502/503/504`), offline banner |
| Project picker and creation | Header project switcher popover (organizations, Projects, status, "resume initialization"), Create Project page (3 steps: name; Template and style preset; languages and surfaces; summary and Initialize) |
| Workspace chrome | Header, left navigation (groups, counts, "OFF" chips, greyed capabilities with reason), page heads, section tabs, toasts, dialogs, confirm dialogs, loading skeletons, Project switch |
| Dashboard | Status card (blocking / warnings / ready), five-step first-run guide for an empty Project, pending changes, latest packages, content counts, translation bars |
| Content — all kinds | Places, Points of Interest, Routes, Guides, Events, Categories: list (search, search-language, status / Category / Featured / pending filters, reorder by drag and by Move up/down, trigger chips, translation dots, indentation of sub-places and subcategories, empty and filtered-empty states), create dialog, editor |
| Maps & Floor Plans | Maps list, New map dialog (geocoding search), map editor (bounds editing, placement, visibility card, visitor filter, linked Place, pan/zoom), Floor plans list, New floor plan dialog, Floor plan editor (placement, unplaced Resources, coordinates) |
| Media | Library (grid and list, search, filters, "used in"), upload dialog (limits, progress, retry, cancel), Asset detail editor (translations, decorative flag, where-used, Replace), Asset picker dialog opened from editors |
| Preview (only this part of "Visitor app") | Visitor app → **Preview** (`PreviewView.vue`): device frames for `WEB` / `MOBILE` / `KIOSK`, language selector, live vs preview toggle, fire-trigger control, "Open in new tab" (`AppPreviewView.vue`, bare route), plus the **"Preview in app" panel inside each Resource editor** (`ResourcePreview.vue`) |

**Out of scope — do not audit, restyle, or edit**: Visitor app → Overview, App settings (Appearance,
Languages, Surfaces, Features), Pages, Navigation, Translations, Launch; Project → Audit log; placeholder
"Not available yet" pages. Exception: shared components these screens use (header, nav, `PageHead`,
`SectionTabs`, `StatusChip`, dialogs, buttons) may and should change; verify out-of-scope screens still
render afterwards with one screenshot each, but do not score them.

The preview content is the stand-in app in `src/components/preview/*` (DECISIONS.md D-014, D-015), not the
real runtime. Audit the CMS around it (frame, controls, labels, states), and the stand-in itself only as the
author-facing result.

## 2. Context every agent must know

Read first, in this order (cite one fact from each in your report):

1. `../uniche_iguide_specs/12-cms-experience.md` (what each screen is for and does),
   `../uniche_iguide_specs/14-accessibility-and-content-guidelines.md` §4 (CMS accessibility requirements),
   `../uniche_iguide_specs/03-core-entities.md` §1 (lifecycle, Working Copy).
2. `DECISIONS.md` entries relevant to the screen you touch (grep it; it is long).
3. **Do not open or read `iGuide CMS.html`** (the prototype, in the specs folder or the workspace root) in
   any form, as text or in a browser: the running app is the only visual reference.
4. `PRODUCT.md` (and `DESIGN.md` once it exists) at the repo root.

### Domain in one page

- A **Project** is one visitor-facing iGuide (a museum, a trail, a town). Authors work *inside* a Project.
  Creation is in the Platform Catalogue; initialization (Template, style preset, languages, surfaces) is local.
- **Content kinds**: **Place** (INDOOR/OUTDOOR, top-level or sub-place; linked to a map or floor plan),
  **Point of Interest (POI)** (Place, Category, lat/long on a map, image/audio/video/3D media, collapsed
  "Practical details"), **Route** (ordered **Stops** bound to POIs, travel mode, difficulty, map with
  numbered stops), **Guide** (story of ordered paragraph and reference blocks, inline images), **Event**,
  **Category** (applies to POIs or Routes; subcategories; icon grid), **Map** (bounds, visibility,
  visitor filter), **Floor plan** (image with normalized coordinates, ordered per Place), **Asset** (media).
- **Lifecycle**: `DRAFT` → `ACTIVE` → `ARCHIVED`. **Never say "published".** An `ACTIVE` Resource is edited
  through a **Working Copy** (Save draft / Apply changes / Discard) — visitors see nothing until Apply.
  Archive/deactivate first shows where-used; blocked if referenced.
- **Triggers** (QR code, geo-proximity, beacon) live inside each Resource editor's "How visitors reach it"
  card, never on their own screen. **Translations**: every text field per language; completeness dots.
- **Readiness** (blocking issues and warnings) is the single source of "what is missing": Dashboard status
  card, activation refusal, and the editor's "What needs attention".
- **Saving is explicit** with a `version`; `409` conflict → per-field "mine / current"; `422` → errors at
  the field and summarized at the top; unsaved form state kept in browser storage with Restore / Discard.
- **Surfaces**: `WEB`, `MOBILE`, `KIOSK`. The Preview renders the visitor app per surface and language.

### Personas of the product (`12` §2)

Content editor, Translator, Project manager, Kiosk operator. Every Project member has full rights.

### Hard constraints (a change that breaks one is rejected, however nicer it looks)

- Authentication and data: auth tokens stay in memory, never in browser storage; the CMS talks only to the
  authoring API and the identity provider; the API client layer is not changed except for a thin wrapper a
  UI change genuinely needs; errors are RFC 7807 problem details matched on `code`, shown with their
  `requestId`, the rejected value never echoed; no production default values in runtime configuration; no
  visitor analytics; the preview sends no analytics event.
- Lifecycle vocabulary: `DRAFT`, `ACTIVE`, `ARCHIVED`. `ACTIVE` is never called "published".
- **WCAG 2.1 AA is a gate** (`14` §4): visible labels (placeholder never the only label); errors linked to
  controls, announced, summarized with links; every reorder has keyboard alternatives (move up/down, set
  position); status/pending/translation state by **text and icon, never colour alone**; coordinate fields for
  every map/floor-plan placement; labelled preview frame; CMS chrome operable while the frame has focus;
  live-region announcements for uploads and long operations; 200 % text scaling; contrast 4.5:1 text / 3:1 UI.
- Spec behaviour in `12` and `14` stays. Spec vocabulary (actions, codes, enums) is canonical. If an idea
  needs a spec change, it is **not** implemented: record it as a `spec-change-request` in `QUESTIONS.md`.
- The specs folder is read-only. The backend is read-only. No edits outside `uniche_iguide_frontend/`.
- Visual design: the look of the running app (Montserrat, UNICHE purple, pill buttons, grey canvas…) is the
  *incumbent*. The owner has authorized departing from it (this supersedes AGENTS.md's "prototype governs
  visual design", D-004, for this overhaul). Every departure that changes the design direction (palette,
  type system, layout paradigm, navigation model) gets a `DECISIONS.md` entry (`D-NNN`, append-only, next
  free number) naming what changed and why. Behaviour the specs fix is never "design".
- Code rules: TypeScript strict, **never `any`**, fail early on invalid conditions, JSDoc on exported
  functions/components/composables, Vue 3 `<script setup>`, Tailwind + shadcn-vue conventions already in the
  repo, no new heavy dependencies without a one-line justification in `DECISIONS.md`.
- **Never commit.** Leave all version-control state to the owner. Never run package installs from WSL
  (`node_modules` must stay Windows-compatible).
- Do not weaken or delete existing tests. Keep the project's typecheck and build passing.

## Tools and environment

- Browser automation runs with **Windows Node** (the CMS dev server listens on Windows `[::1]:5173`, which
  WSL cannot reach): `cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node <script>"`.
  Put your own scripts in your agent folder (`ux-audit/round-N/audit/<agent>/` etc.) and import
  `../../../tools/session.mjs` (adjust the relative path).
- `ux-audit/tools/session.mjs`: `open(account, {viewport, touch, reducedMotion, forcedColors})` → signed-in
  `{browser, context, page}` (Playwright, `@playwright/test` API); `go(page, path)`; `bearer(page)`;
  `VIEWPORTS` = `1440`, `1280`, `1024`, `768`, `zoom200` (200 % zoom at 1280×720). `CMS`, `API` constants.
  Accounts: `curator` (all authoring), `admin` (Project creation, manager flows). If the saved session is
  stale, run `node ux-audit\tools\session.mjs curator` (and `admin`).
- `ux-audit/tools/shot.mjs <account> <path> <outPrefix> [viewport...]` — quick full-page screenshots.
- axe-core: `const { AxeBuilder } = require("@axe-core/playwright")` resolved via `createRequire` from the
  repo's `package.json` (default export; see `e2e/*.spec.ts` for usage).
- Request interception (`page.route`) to force `401/403/404/409/422/502/503/504`, offline
  (`context.setOffline(true)`), slow network.
- Test data ids: `ux-audit/tools/seed.json` (Projects `UX Audit – Populated` and `UX Audit – Empty`).
  Records you create yourself are named `UX-<agent-id> …`. Never delete, apply, archive or edit
  pre-existing records; never run destructive Project operations.
- WSL is fine for reading files, grep, `vue-tsc`/`vite build` checks (`make typecheck`, `make build`, or
  `cmd.exe` equivalents if they fail under WSL).

## Scoring rubric (0–100 per screen/state)

Weights: Task clarity & flow 25 · Visual hierarchy & craft 20 · Consistency 15 · Copy & feedback 15 ·
Accessibility 15 · Responsiveness & state coverage 10. Plus impeccable's 10 Nielsen heuristics 0–4 each.
Calibration: 90+ means a design director would ship it unchanged; a screen with an open **P1 cannot exceed
85**, with an open **P0, 60**; 90+ needs screenshots of every state and a clean keyboard run as evidence.

Severities: **P0** blocks a task / fails an a11y gate · **P1** major friction · **P2** notable · **P3** nit.
