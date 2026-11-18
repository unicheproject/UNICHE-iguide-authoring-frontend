# Round 2 review pack — iGuide CMS UX overhaul

Date: 2026-11-17 (implementation and verification finished 2026-11-16). Paths are relative to
`uniche_iguide_frontend/`. Nothing is committed. App: http://localhost:5173, Project `UX Audit – Populated`
unless stated. `IMPL` = `ux-audit/round-2/implementation`.

Round 2 refined the round-1 direction. It did not change the visual direction. The audit found 94 unique findings
(0 P0, 31 P1). Implementation ran as Wave 0 (two root-cause packages), 13 screen packages, one fix-up pass for
shared files, then verification.

## 0. Your round-1 comments and how they were handled

| Comment | Handling |
|---|---|
| "go for round 2" | Taken as approval of the round-1 direction and of the round-1 pack's "Deferred to round 2" list. Of that list, these were done: POI editor height, date formats, Web/Kiosk preview size in editors, one reorder control, the "three meanings of ACTIVE" on the Dashboard, and the switcher chip. These stay deferred: bulk selection (Q-016), nav counts (G-023), and "Use my location". |

## 1. What changed, by theme

**Foundations (W0-A, D-086 to D-088).** Icon buttons are 40 px (44 on touch), and text links have a 44 px hit area. A
build check (`scripts/check-css-tokens.mjs`) fails when a size, z or shadow class has no rule. In forced colours,
dialogs, menus and toasts have borders, and selection uses Highlight. **Errors are fixed sentences chosen by
code, plus the request id.** Server text never reaches the screen; a canary string put in forced 403/404/409/503
responses never appeared. One `ProblemAlert` shows errors in cards, dialogs and toasts. **Dates are written one way:**
24-hour, "16 Nov 2026, 14:05", in the Project's time zone. Typed date fields replace the native pickers that
followed the browser locale. A new "Page not found" page, and focus never falls to `<body>` after dialogs or
removals.

**Sticky chrome and one readiness model (W0-B, D-089, D-090).** The sticky stack is measured: the POI list went from
35 % to 15 % of a 1280x720 screen. At 1280x720 and 1024 the editor keeps only its header sticky. **One completeness
model** supplies the count for tab marks, the side card, the header badge, Activate/Apply confirms, toasts, list
dots and the Dashboard. They all read the same sentence, for example "3 warnings, nothing blocks" or "1 to fix
before activating". A Guide with an empty story is no longer "Complete". An item's own triggers no longer block
Deactivate. POI map Tab stops went from 62 to 7. When the side column has more content below, it fades at the
bottom.

**Session, picker, Create Project (P1, D-097).** The session-ended dialog can be dismissed. The skeleton matches the
page and announces "Loading Points of Interest", and the nav is inert until the Project loads. The switcher is
named "Switch project". The authorization code is removed from the address bar. The offline notice no longer
shifts the page. Create Project has no silent defaults.

**Dashboard (P2, D-092).** The h1 is plain "Dashboard". One status line in the heading reads "Visitor app: Draft ·
Content revision N". The status card ends with how to go live. Launch is still a placeholder, so it says so
plainly and offers "Preview the app" and "About Launch". Warnings are one row per item (100 rows, was 396+).
"Waiting for you to apply" is sorted newest first. The first-run guide stays until step 5 or until dismissed, and
steps 3-5 tick.

**Lists, all six kinds (P3-core, P3a, P3b, D-091).**
- **Paging:** 50 rows per page with a pager ("Showing 1–50 of 85"); the page number is in the URL.
- **Sort:** sorts have a direction, and Updated sorts newest first with date and time in its own column.
- **Row height:** POI rows went from 112 px to 73 px, so a 50-row page is about 4,040 px.
- **Counts:** segment counts match the filters.
- **Keyboard:** `/` focuses search.
- **Create link:** `?create=1` opens the create dialog.
- **Parent:** creating a Sub-place or Subcategory without a parent is blocked in the same validation pass.
- **Row menu:** "Add sub-place" is in it. The menu opens on a Move item, not on Deactivate.
- **Failures:** a failed Categories, Places or languages read shows a load error with Try again. It never shows
  "Add a language first".
- **Translation dots:** they open the editor on that language (`?lang=`).

**Editor shell (P4s, D-095).**
- **Buttons:** when the form is dirty, Save draft is primary and "Save and apply" secondary. "Apply changes" is
  disabled with a reason when nothing is pending.
- **409 conflict:** shows only the fields both people changed, with "Reload their version (discards your 2
  changes)" and the request id.
- **Restore draft:** one compact row.
- **Saving:** no success toast; the state line announces the save. A failed save keeps the form still and focuses
  the summary.
- **Header:** "Revision N" replaces "Version 0", and the title wraps to two lines in the header.
- **Translation:** "Next missing: Italiano" sits beside the language tabs.

**Place and POI editors (P4, D-099).** Empty beacon/geo trigger rows are flagged before any request. Coordinates are
checked when you leave the field ("37,9715" is accepted). Trigger rows save in parallel; if one fails, a sentence
names it. Audio narration is one group in the Media card. Settings that apply to every language fold under
non-default tabs. Long pickers get a filter, and the QR caption states the PNG size. Summary and Description sit
side by side. An empty POI editor is 1,408 px tall at 1440 (was 1,911; target 1,450).

**Route, Guide, Event, Category editors (P5a, P5b, D-098).**
- **Route and Guide:** removing a stop or block shows an Undo bar that takes focus, and Ctrl/Cmd+Z undoes. Route
  completeness counts unsaved stop texts. The stop picker works with arrow keys and Enter. Overlapping map pins fan
  out.
- **Event dates:** typed 24-hour fields; under the Greek tab, dates read in Greek. "Repeat weekly" clamps to 52
  and says so.
- **Category:** "Used in" and "Used by" are one card, and the blocking sentence names what to change.

**Maps & Floor plans (P6, D-096).** On touch, a swipe scrolls the page, and a "Move map" toggle pans the map. The
visitor filter is one grouped disclosure. Floor-plan "Place" buttons carry the item name. Coordinates are
validated when you leave the field. The route map has a legend line.

**Media (P7a, P7b, D-094).**
- **Library rows:** each row says what is missing in the chosen language ("Italiano: alt text, title missing").
  The list view no longer overprints, the view is kept in the URL, and the count line shows archived files.
- **Upload dialog:** opens on its heading, and the held-file flow is fully keyboard operable.
- **Asset editor:** the alt-text field is above the fold at 1024, and typing alt text clears the blocker at once.
  "Used in" is explained.
- **Picker:** tiles are one Tab stop with arrow keys, and short screens get a list.

**Preview (P8, D-093).**
- **Panel:** "Preview in app" is a full-width panel below its button, with Expand. Kiosk and Web default to Fit
  width (Kiosk 100 % at 1440, was 33 %).
- **Test in preview:** opens `/preview?trigger=<id>`, which picks the right surface and fires the trigger.
- **Stand-in:** inert until you choose Interact. The first Esc stops interacting, the second closes the panel.

**Shared fix-up (R2-fixup).** Field errors are announced. The Activate dialog has "Review in editor". Dialogs on
short screens scroll their footer. The Asset picker shows 4 rows at 200 % zoom. Toasts stay clear of "On this
page". "Used in" collapses after 5. Title columns no longer break mid-word, and checkboxes are 24 px on touch.

## 2. Before / after

| Screen | Before (round 1) | After (round 2) | Open in the app |
|---|---|---|---|
| Dashboard, populated | `ux-audit/round-1/review/dashboard__1440.png` | `ux-audit/round-2/review/dashboard__1440.png` | Populated → Dashboard |
| Dashboard, drafts only / first run | `ux-audit/round-1/review/firstrun__1440.png` | `IMPL/P2/after/drafts-1440.png`, `IMPL/P2/after/pristine-1440.png` | Empty D → Dashboard |
| POI list | `ux-audit/round-1/review/pois__1440.png` | `ux-audit/round-2/review/pois__1440.png` | Points of Interest |
| POI editor, pending changes | `ux-audit/round-1/review/poi-editor__1440.png` | `ux-audit/round-2/review/poi-editor__1440.png` | "Parthenon Frieze – North Side" |
| POI / Place editor, empty | `IMPL/P4/after/before-poi-1440.png`, `before-place-1440.png` | `IMPL/P4/after/after-poi-1440.png`, `after-place-1440.png` | POIs → "UX-R2-P4 Empty POI" |
| Editor dirty / 409 / failed activate | — | `IMPL/P4s/after/active-1440.png`, `activate-fail-1440.png` | any ACTIVE POI, edit a field |
| Route editor (Undo, fan-out) | `ux-audit/round-1/implementation/P5a/after/route-6-stops__1440.png` | `IMPL/P5a/after/route-removed-1440.png`, `route-map-fan-1440.png` | Routes → "UX-R2-P5a Route" |
| Event dates | `ux-audit/round-1/implementation/P5b/after/event-dates-view__1440.png` | `IMPL/P5b/after/event-dates-1440.png` | Events → any |
| Places list | `ux-audit/round-0/shots/places-list__populated__1440.png` | `IMPL/P3a/after/places-1440.png`, `places-menu-1440.png` | Places |
| Guides / Events / Categories lists | `ux-audit/round-1/implementation/P3b/after/events__1440.png` | `IMPL/P3b/after/{guides,events,categories}-1440.png` | each list |
| Media library, list view | `IMPL/P7a/after/before-1440.png` | `IMPL/P7a/after/list-1440.png`, `ux-audit/round-2/review/media__1440.png` | Media → List |
| Asset editor / picker | `ux-audit/round-1/implementation/P7/after/picker-list__1440.png` | `IMPL/P7b/after/editor-1440.png`, `picker-1440.png` | Media → any image |
| Preview in app (editor) | `ux-audit/round-0/shots/poi-editor__preview-in-app-panel__1440.png` | `IMPL/P8/after/editor-kiosk-1440.png`, `editor-expanded-1440.png` | POI editor → Preview in app |
| Preview page | `ux-audit/round-1/implementation/P8/after/preview-kiosk__1440.png` | `IMPL/P8/after/preview-kiosk-1440.png`, `ux-audit/round-2/review/preview__1440.png` | Visitor app → Preview |
| Map editor | `ux-audit/round-1/implementation/P6/after/map-full__1440.png` | `IMPL/P6/after/map-1440.png`, `map-filter-open-1440.png` | Maps & Floor Plans → a map |
| Session / skeleton / Home | — | `IMPL/P1/after/session-ended__1440.png`, `skeleton-list__1440.png`, `home__1440.png` | sign out elsewhere; reload a list |

Every package also has 1024 / 768 / zoom200 / forced-colours shots in `IMPL/<package>/after/`. The verifier's 123
state shots are in `IMPL/verify/shots/`.

## 3. Scoreboard so far

Same rule as round 1: the round-2 build is scored by the round-3 audit (fresh agents). Full tables:
`ux-audit/scoreboard.md`.

| | Round 0 | Round 1 (measured in round 2) | Round 2 |
|---|---|---|---|
| Mean of 41 in-scope screens | 59.6 | **74.4** | measured in round 3 |
| Screens ≥ 90 / ≤ 60 | 0 / 32 | 0 / 0 | — |
| Open P0 / P1 (consolidated) | 5 / 54 | **0 / 30** (31 incl. one added late) | 0 P0 / 0 P1 found by verification; P1 closure confirmed in round 3 |
| axe serious/critical, in-scope | several | 0 (81 states) | **0 (111 states)** |

Round-1 lowest screens and what round 2 did for them:
- **Media library (61):** fixed the list-view overprint and added per-row missing text.
- **Toasts, dialogs and skeletons (62):** layout-shaped skeletons, ProblemAlert, short-screen dialogs, toast inset.
- **Dashboard, populated (64):** one row per item, a "how to go live" ending, newest-first pending list.
- **Asset editor (66):** live readiness, alt-text field above the fold.
- **Dashboard, first run (67):** the guide persists and steps 3-5 tick.

Per persona, round 1 (measured in round 2): editor 72, manager 80.5, translator 73.5, kiosk 79.9, keyboard/SR 84.9,
edge 74-80. Jobs that failed in round 1 and were targeted:
- **Editor:** Sort by Updated, newest first. Deactivate a POI that has a trigger (partly, see G-037).
- **Manager:** "How do I go live". ACTIVE vs App: Draft.
- **Translator:** Trust the completeness marks. Media worklist. Dates read consistently.
- **Kiosk:** "Test in preview". Kiosk in the editor panel. Scroll past a map by touch.
- **Edge:** 403/404/500 on save. Lists after a failed `/languages` read. Stale Apply.

## 4. Decisions taken on your behalf

DECISIONS.md D-086 to D-099 (14 entries):
- **D-086:** hit areas and forced colours.
- **D-087:** errors are sentences chosen by code, never server text.
- **D-088:** one date and time formatter.
- **D-089:** sticky stacks are measured and short (replaces the fixed 96 px of D-074).
- **D-090:** one readiness and completeness model.
- **D-091:** list paging is done in the client over the complete set (search, counts, trees and manual order need
  every row).
- **D-092:** the Dashboard says how the visitor app goes live.
- **D-093:** "Preview in app" is a full-width panel with fit-width.
- **D-094:** the Media worklist names what is missing.
- **D-095:** the save, conflict and restore model.
- **D-096:** Maps keyboard and touch model ("Move map" toggle instead of two-finger gestures).
- **D-097:** session, picker and loading states.
- **D-098:** undoable removal.
- **D-099:** Place/POI editors (one Media card, folded settings, partial trigger saves).

Orchestrator rulings:
- **Launch on the Dashboard:** Launch is still the "Not available yet" placeholder, so the Dashboard never sends
  you there as the primary action. It switches back to "Go to Launch" by itself once Launch has a real route.
- **HelpHint "?" buttons:** they stay 32 px at fine pointer because they sit in running text. They are 44 px on
  touch.

## 5. Deferred, rejected, spec and backend requests

New spec-change requests (QUESTIONS.md, not built):
- **Q-017:** first-run guide persistence and a sixth step.
- **Q-018:** sort on tree lists.
- **Q-019:** whether an empty Guide story blocks activation.
- **Q-020:** slug length and "Revision".

Q-008 to Q-016 from round 1 are still open.

New backend gaps (GAPS.md):
- **G-037:** the platform refuses to deactivate a Resource that only its own triggers use (409 `RESOURCE_IN_USE`).
  The CMS now explains it and links the trigger.
- **G-038:** pending Working Copies across kinds, newest first.
- **G-039:** a readiness code for an empty Guide story.
- **G-040:** a language-aware missing-text filter for assets.
- **G-041:** server-side counts and filters for paged lists.
- **G-042:** two silent limits to verify.

Open after verification (all P2/P3, carried to round 3):
- **R2-V-02:** HelpHint 32 px (see above).
- **R2-V-03:** at 200 % zoom, the sticky chrome including the 56 px app header is 33 % of the POI editor. Below the
  app header it is within the 15 % rule.
- **R2-V-04:** in wide editors, toasts can cover the right edge of the form.
- **R2-V-07:** populated POI editors are still about 1,970 px at 1440. The empty one meets the target.
- **Shared toolbar:** the Media "Search in" and "Needs translation in" are not yet one Language control, and
  editors do not read `?lang=` everywhere.
- **Small items:** the QR print size, and a few legacy `shadow-[…]` classes in `useReorder`.
- **Sign-in:** the IdP-down splash length needs a Keycloak timeout option.

Fixed after verification: R2-V-01 (Route blocker vs "nothing blocks": now one blocker everywhere, matching the
platform's `ROUTE_WITHOUT_ACTIVE_STOP`), R2-V-05 (row menu focus), R2-V-06 (side column fade).

Still deferred: bulk selection (Q-016), nav counts (G-023), translation bars and packages (G-023/G-024), and "Use my
location" on maps.

## 6. What could not be verified

- **e2e specs:** selectors were updated and new tests added, none weakened. They need the local Keycloak, which is
  not available here.
- **Untested states:** session-expired, config-error and the offline banner were not part of the verifier's axe
  run. Neither were Create Project steps 2-3 or the Greek tab of the Asset and Map editors.
- **Untested environments:** real screen readers, real IdP outage, touch drag on a real tablet, WebGL map style,
  production load times.
- **Unseen behaviour:** pin fan-out was checked in code and on a 5-stop map, but no seed data overlaps.

## 7. Environment and housekeeping

- **Dev server:** the laptop update on 17 Nov stopped it. It was restarted on :5173 with the same plain Vite
  fallback (`node node_modules\vite\bin\vite.js --config .tmp-dev.config.mjs`). Typecheck and `check-css` were
  re-run after the restart and pass.
- **Git index:** still as in round 1. The IDE auto-staged `ux-audit/`, including `ux-audit/tools/.auth/*.json`
  (saved test sign-in cookies). Please unstage them (`git restore --staged ux-audit/tools/.auth`). Version control
  was not touched.
- **New test records:** all prefixed `UX-R2-…` in `UX Audit – Populated` (each package lists them in
  `IMPL/<package>/records.json`). Round 1's leftovers are listed in the round-1 pack.

## 8. Your comments

Please review the running app and leave comments, free-form, per screen or general. They take priority over
everything else in round 3, which is the nit-and-grit round. It ends with `DESIGN.md` and a cleanup pass.
