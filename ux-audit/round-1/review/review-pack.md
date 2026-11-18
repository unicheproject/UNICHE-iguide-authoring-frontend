# Round 1 review pack — iGuide CMS UX overhaul

Date: 2026-11-13. Paths are relative to `uniche_iguide_frontend/`. Nothing is committed.
App: http://localhost:5173 (see "Environment" at the end). Projects: `UX Audit – Populated` (full content),
`UX Audit – Empty C` (first run), `UX Audit – Empty B` (drafts only).

## 1. What changed, by theme

**Visual system (new direction, D-069…D-073, D-083, D-085).** Grey canvas, white surfaces, UNICHE purple only for
the primary action, selection, links and focus. Type in rem (12 px minimum, so browser text scaling works), sentence
case instead of tracked capitals, Montserrat self-hosted (Google Fonts removed) plus Manrope for Greek. One Button
(8 px radius, no gradient), one Chip, one StatusChip (icon + word: Draft dashed, Active, Archived outline, Pending
changes violet), lucide icons instead of unicode glyphs. Field borders 4.26:1 (was 1.24:1). Forced-colours and
reduced-motion rules in the base layer. 40 px controls, 44 px on touch.

**Shell and navigation (D-073).** Single-row 56 px header; Project switcher shows name + "App: Draft/Live"; nav
with icons; Media is a top-level item (as spec `12` §3 lists it); below 1100 px the nav is a drawer. Every route
sets the tab title ("Points of Interest · UX Audit – Populated · iGuide CMS"), moves focus to the h1 and announces
the page. "Help" removed (it did nothing); "Manage members" links to the Portal only when configured.

**Sign-in, session, picker, Create Project (P1, D-084).** Session expiry shows a "Your session ended" dialog (edits
kept) instead of a redirect loop. 403/404/503/500 pages: heading, cause, request id, one next step. Home and the
switcher share one searchable Project list (Recent first, "Needs setup" collapsed). Create Project is a 4-step
wizard with a stepper; errors at the field + one focused, announced summary (closes a P0).

**Dashboard (P2, D-077).** Empty Project → five-step first-run guide (steps 1–2 tick from real counts). Otherwise a
status card with exactly one answer — "N things block going live" / "Nothing is live yet" / "Ready with N warnings"
/ "Ready" — and one action; "Ready" is never shown without ACTIVE content (closes two P0s). "Waiting for you to
apply" list, warnings grouped and collapsed, content counts per kind. No translation bars or packages (no API yet).

**Content lists, all six kinds (P3a, P3b, D-076).** One pattern: search + "Search in" language, status segments with
counts (Not archived · Active · Draft · Archived), "Pending changes" and "Needs translation" toggles, sort, all kept
in the URL (Back restores them). One row = title link + one ⋮ menu (Activate/Deactivate, Archive, Move up/down/to
top/bottom, **Move to position…**). Activation from a row always confirms. Translations shown as language names
with icons. Places/Categories are disclosure trees. Cards below 900 px. ARCHIVED hidden from the default view.

**Editors, all kinds (W0.2, P4, P5a, P5b, D-074, D-075, D-079).** Sticky header (title, status, readiness count,
Apply changes / Save, More) and sticky Working Copy banner (Save draft, Discard) — both stay on screen; typing never
shifts the form. Side column: Status (Activate/Deactivate with reasons), "What needs attention" / "Before you
activate", section links, Translations, Used in. Section order: Texts → kind setup → Media → How visitors reach it →
Details. Activate always confirms, shows the platform's refusal inside the dialog, and says "Activated with N
warnings". Ctrl/Cmd+S saves. Non-default language tabs show the default text beside each field (Copy source) and
hide reorder/add/remove. Removing a stop, block or date offers Undo. Route stop picker adds several stops at once;
Event dates are cards with inline end-before-start validation and "Repeat weekly" with count/end date; Category icon
grid is one radio group with arrow keys. Triggers card always shows the QR block, "Test in preview" per trigger,
beacon marked "Mobile app only".

**Maps & Floor plans (P6, D-081).** Coordinates validated (no crash on commas/letters; "12,5" accepted), tile-failure
card with Try again, bounds handles and pins focusable and nudged with arrows (announced), out-of-bounds warning,
map above the fold at 1024, floor-plan drag no longer shifts, placement fans out instead of stacking.

**Media (P7, D-080).** Library sort and "Needs attention" filters (no alt text, missing translation, unused,
decorative); upload states formats and limits, holds duplicates/odd types for a decision, announces every file;
"Describe now" step for alt text after upload; picker opens on Search, defaults to Active; Asset editor keeps the
image beside the alt-text field.

**Preview (P8, D-082).** Preview frame is a labelled region; the stand-in is inert until "Interact", with "Skip
preview" (closes a P0). True device sizes with Fit / 100 % / 50 % and the scale stated. Working mode shows pending
changes. Fire trigger is surface-aware with a "Fired:" chip and Reset. New tab has a slim control bar. In editors,
"Preview in app" opens below its button and pushes the form down (never covers it).

## 2. Before / after (open the "after" file next to its "before")

| Screen | Before (round 0) | After | Open in the app |
|---|---|---|---|
| Dashboard, populated | `ux-audit/round-0/shots/dashboard__populated__1440.png` | `ux-audit/round-1/review/dashboard__1440.png` | Populated → Dashboard |
| Dashboard, first run | `ux-audit/round-0/shots/dashboard__empty-project__1440.png` | `ux-audit/round-1/review/firstrun__1440.png`, `…/implementation/P2/after/empty-c__1440.png` | Empty C → Dashboard |
| POI list | `ux-audit/round-0/shots/pois-list__populated__1440.png` | `ux-audit/round-1/review/pois__1440.png` | Points of Interest |
| POI editor, pending changes | `ux-audit/round-0/shots/poi-editor__pending-working-copy__1440.png` | `ux-audit/round-1/review/poi-editor__1440.png` | "Parthenon Frieze – North Side" |
| Place editor | `ux-audit/round-0/shots/place-editor__active__1440.png` | `…/implementation/P4/after/place-outdoor__1440.png` | Places → any outdoor Place |
| Route editor | `ux-audit/round-0/shots/route-editor__active__1440.png` | `…/implementation/P5a/after/route-6-stops__1440.png` | Routes → "UX-P5a Route" |
| Guide, Greek tab | `ux-audit/round-1/audit/p3-translator/shots/guide-editor__greek-tab__1440.png` | `…/implementation/P5a/after/guide-greek__1440.png` | Guides → any → Ελληνικά tab |
| Event editor | `ux-audit/round-0/shots/event-editor__active__1440.png` | `…/implementation/P5b/after/event-dates-view__1440.png` | Events → "UX-P5b event" |
| Events list | `ux-audit/round-0/shots/events-list__populated__1440.png` | `…/implementation/P3b/after/events__1440.png` | Events |
| Create Project | `ux-audit/round-0/shots/create-project__step1-empty__1440.png` | `…/implementation/P1/after/create-step1-empty__1440.png` | Switcher → Create Project (admin) |
| Home / picker | `ux-audit/round-1/audit/p2-manager/shots/home__full__1440.png` | `…/implementation/P1/after/home-search__1440.png` | Logo → Home |
| Map editor | `ux-audit/round-0/shots/map-editor__populated__1440.png` | `…/implementation/P6/after/map-full__1440.png` | Maps & Floor Plans → a map |
| Media library | `ux-audit/round-0/shots/media-library__grid__1440.png` | `…/implementation/P7/after/library-grid__1440.png` | Media |
| Asset picker | `ux-audit/round-0/shots/asset-picker__open-from-poi-editor__1440.png` | `…/implementation/P7/after/picker-list__1440.png` | POI editor → Media → Add image |
| Preview, Kiosk | `ux-audit/round-0/shots/preview__kiosk__1440.png` | `…/implementation/P8/after/preview-kiosk__1440.png` | Visitor app → Preview → Kiosk |
| Nav at 768 | (no drawer) `ux-audit/round-0/shots/pois-list__populated__768.png` | `…/implementation/W0.1/after/drawer__768.png` | narrow the window, Menu |

Every package also has 1024 / 768 / 200 % zoom / forced-colours shots in `ux-audit/round-1/implementation/<package>/after/`.

## 3. Scoreboard so far

Round 1 scores are measured by the round-2 audit (fresh agents scoring the new app); here is the baseline.

| | Round 0 (baseline) | Round 1 |
|---|---|---|
| Mean of in-scope screens | 59.6 (26 of 41 capped at 60 by an open P0) | measured in round 2 |
| Screens ≥ 90 | 0 of 41 | — |
| Open P0 / P1 (consolidated) | 5 / 54 | all 5 P0 addressed; P1s: see below |
| axe serious/critical on in-scope routes | several (contrast, preview frame, labels) | **0** (81 states scanned after fixes) |

Lowest baselines: session expired 35, Dashboard first run 40, Dashboard populated 47, Preview in app 48, Create
Project 51. Per-screen and per-persona tables: `ux-audit/scoreboard.md`.

The five P0s — field-border contrast (C1-06), Dashboard false "Ready" and missing first-run guide (C1-41, C1-42),
Create Project errors not announced (C1-59), unlabelled preview frame (C1-81) — are fixed and verified. Most P1s of
the 125 consolidated findings were addressed; the ones knowingly left are in §5.

Verification (`ux-audit/round-1/implementation/verify.md`): typecheck 0 errors, production build passes, 0 page or
console errors on any route, all 10 out-of-scope screens render, no tokens in browser storage, no new network
destinations, no `any`, no "published". 12 small regressions found and fixed (one deferred, see §5).

## 4. Decisions taken on your behalf

DECISIONS.md D-069 to D-085 (17 entries): D-069 visual authority passes from the prototype to your brief (supersedes
D-004 for visual language only); D-070 colour/status/focus tokens; D-071 type and self-hosted fonts; D-072 one
Button/Chip, lucide, no gradient CTA (supersedes D-053); D-073 shell and navigation; D-074 editor frame; D-075
inline "Preview in app" (supersedes D-056/D-059/D-066); D-076 list pattern; D-077 Dashboard; D-078 feedback,
dialogs, validation, offline; D-079 translation work in editors; D-080 Media; D-081 Maps & Floor plans; D-082
Preview; D-083 hit areas; D-084 picker, Create Project, session states; D-085 Greek companion font.

Orchestrator rulings: map tiles (OpenFreeMap "OSM Bright") and the Nominatim geocoder stay as recorded exceptions to
"only the authoring API and the identity provider"; Template preview fonts still load from Google Fonts (D-045). The
field label stays "Slug" (spec vocabulary); "pending changes" is used as author wording for a Working Copy.

## 5. Deferred, rejected, and spec/backend requests

Spec-change requests (QUESTIONS.md Q-008…Q-016, not built): one merged action bar for header + Working Copy banner;
"Preview in app" as a docked side pane; ARCHIVED rows in default lists; Place creation order (INDOOR/OUTDOOR first);
triggers card on Guides and preview on Categories; Guide paragraphs as rich text with inline images; what "Ready"
means; `OTHER` asset types; bulk actions, Help destination, quick switcher.

Backend gaps (GAPS.md G-023…G-036): statistics endpoint (translation bars, nav counts), Deployment Package list,
last editor of a Working Copy, readiness for empty Projects and for DRAFT Resources, `pending` on assets,
`initialized` on the Project list, asset/category usage counts that disagree with where-used lists (assets 3 vs 4;
category 17 vs 11), thumbnails, upload type policy, Event activation without dates, conflict bodies, durations.

Deferred to round 2: bulk selection; nav counts; POI editor height (1,910 px, target ~1,450); native date/time inputs
still follow the browser's locale (en-US browsers show US format beside UK-format text); Web/Kiosk in the editor's
"Preview in app" are drawn at 24–29 % in the side column (needs the full-width "Expand"); two reorder-control styles
(lists vs Guide story; duplicate `ReorderControls.vue`); the Dashboard heading shows "Active" (Project) beside "App:
Draft" in the header — still three meanings of ACTIVE; the switcher status chip stays a placeholder on `Empty C`;
"Use my location" on maps (needs a permission flow, no spec text).

Not built because out of scope: Navigation editor's preview frame (same fix as the Preview page; it is a Visitor app
screen you excluded).

## 6. What could not be verified

e2e specs (selectors updated, none weakened) — they need the local Keycloak, not available here. Real screen readers
(judged from the accessibility tree and live regions). WebGL vector map style (headless browser used the raster
fallback). Real 409/5xx bodies and a real expired Keycloak session (forced with request interception). Touch drag of
map handles. Production load times (dev server only).

## 7. Environment and housekeeping — please read

- **Dev server:** your `vp dev` had stopped; an agent started plain Vite on :5173 with
  `uniche_iguide_frontend/.tmp-dev.config.mjs` (same plugins, alias and port) and it is still running (Windows PID
  34912, `node node_modules\vite\bin\vite.js --config .tmp-dev.config.mjs`). `vite-plus` is not installed in
  `node_modules`, so `make typecheck`/`make build` could not run here; equivalent `vue-tsc` and Vite builds passed.
  Before round 2 I need it (or your own server) running.
- **Git index:** your IDE appears to have auto-staged new files at 16:01 on 12 Nov (`PRODUCT.md`, part of
  `ux-audit/`). This includes `ux-audit/tools/.auth/curator.json` and `admin.json` (saved sign-in cookies for the
  test accounts). Please unstage them (`git restore --staged ux-audit/tools/.auth`) and consider ignoring
  `ux-audit/tools/.auth/`. I did not touch version control. `ux-audit/tools/accounts.local` is ignored by `*.local`.
- **Leftovers to remove later:** test Projects created in
  the Catalogue: `UX-s7-chrome Project`, `UX-p2-manager Trail`, `"UX-P1` (stray quote), `UX-verify do not submit`,
  `UX Audit – Empty B`, `UX Audit – Empty C`; many `UX-<agent> …` records in the audit Projects.

## 8. Your comments

Please review the running app and leave comments, free-form, per screen or general. They take priority over
everything else in round 2.
