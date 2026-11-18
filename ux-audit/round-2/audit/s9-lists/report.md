# s9-lists — Round 2
(Saved by the orchestrator from the agent's returned report, condensed: its Write call was refused. Scripts a1–a30.mjs and shots/ in this folder.)

Scope: six Content lists, their create dialogs, shared scaffold (Maps, Floor plans, Media lists not walked). Interview skipped.

## Verdict
Lists are one recognisable system (2 tab stops per row, ⋮ with Move to position, URL filters, cards below 900 px, axe clean on all six at 1440). Remaining: density, sort, paging, target size; icon buttons 18×18 px; two create dialogs silently create the wrong record. P0 0, P1 6, P2 13, P3 7. Range 70–78. C1 (17 IDs): fixed 5, partly 9, not fixed 3, regressed 0. Nielsen ≈ 27.5/40.

## Context check
12 §3 lists sort by sortOrder and filter status/Category/featured/pending (Places and Categories offer only manual order; filter set differs); 14 §4 reorder gate met; 03 §1 no "published", lifecycle actions confirm; D-076 verified but denominators count archived; PRODUCT.md speed: only ~4 POI rows fit under the sticky bar at 1280×720. Impeccable: critique.md browser inspection; audit.md form issues (-11, -12); operate.md trust (-19).

## Matrix (1440, Populated)
| | Places | POIs | Routes | Guides | Events | Categories |
|---|---|---|---|---|---|---|
| Sortable headers | none | Title, Status, Translations | same | same | Title, Dates, Status, Translations | none |
| Sort select | Manual (tree) | Manual, Title, Status, Updated, Translations | same | same | + Next date | Manual (tree) |
| Direction | none | header click toggles; Updated has no header/toggle | same | same | same | none |
| Toggles/filters | Pending, Needs translation, Featured | + Category | + Category | Featured | Featured | Applies to, no Featured |
| Row height min/median/max | 77/81/144 | 83/101/211 | 81/87/128 | 77/77/130 | 77/77/102 | 77/87/88 |
| Sticky stack at 1440 | 28 % | 35 % | 35 % | 30 % | 30 % | 28 % |
| At 1280×720 | 35 % | 43 % | 43 % | 37 % | 37 % | 41 % |
| ⋮ extras | — | — | — | — | — | Add subcategory |
| Tree | disclosure, no "Add sub-place" | — | — | — | — | disclosure |
| Footer | "18 of 19" (incl. archived) | "78 of 85" | "12 of 14" | "11 of 13" | "14 of 16" | "19 of 20" |
| Tab title on direct load | no Project | no Project | ok | no Project | no Project | ok |
Identical in all six: segments with counts, kebab label "Actions for <title>", focus return, whole-row open, activation confirm, referenced-item block with where-used; empty, filtered-empty, 5-row skeleton, 503 with request id and Try again.

## Create dialogs
Heights 333–636 px. Place: Level radio cards, Parent when Sub-place. POI: Place, Category, Exhibit code. Route: Setting as a select, no default. Guide/Event: Title only. Category: Applies to radio cards (red "*"), Level, Parent. All: slug behind "Edit slug" (Category "Code"); empty submit summary takes focus; after create the editor opens with h1 focus and toast; Esc closes and loses typed text. Duplicate-slug 422 mapped with request id.

## Scores (C25/H20/Co15/Cp15/A15/R10)
Places 72 · POI 70 · Routes 72 · Guides 74 · Events 74 · Categories 73 · Create dialogs 73 · List states 76 · Row lifecycle 78.

## Findings
- **R2-s9-01 P1 Every icon button is 18×18 px (⋮, grip included).** `Button size="icon"` uses `size-control`, but `tailwind.config.js` defines `control` only under height/minHeight/width, so no `size-control` class is generated. 174–179 of 185 POI-list controls under 44 px on touch. a11.mjs, a12.mjs, shots/categories-list__touch__touch768.png. Fix: `spacing.control` or `h-control w-control`. Files: tailwind.config.js 130–140, ui/button/index.ts 48, ReorderControls.vue. S. App-wide.
- **R2-s9-02 P1 New place: Sub-place with empty required Parent creates a top-level place** (reproduced twice; shots/place-created-subplace-noparent__editor__1440.png). Fix: validate Parent. CreatePlaceDialog.vue. S.
- **R2-s9-03 P1 New category: Subcategory silently preselects the first parent** (a23, a24.mjs; shots/create-categories__subcategory-parent__1440.png). Fix: empty "Choose a parent" option, required. CreateCategoryDialog.vue. S.
- **R2-s9-04 P1 Sticky toolbar + thead take 28–43 % of the viewport;** toolbar sticks at top 80, leaving a 24 px sliver of the previous row (shots/pois-list__scrolled__1280.png). Fix: stick only title row + thead (~100 px), filters in one row or popover, stick at top 56. ListToolbar.vue, list-table.css. M.
- **R2-s9-05 P1 "Updated" oldest-first, not reversible in the UI; Places and Categories cannot sort; rows show date without time.** Fix: Updated newest first, direction toggle, Title/Status sorts on tree lists. useListQuery.ts, SortSelect.vue. S–M.
- **R2-s9-06 P1 No paging: 84 POIs = 9,158 px; request capped at `size=200`** (silent loss above 200, unverified). Fix: paginate/window, notice, compact POI row ~64 px. PoisView.vue, ListTable.vue. M.
- **R2-s9-07 P2 Counts disagree:** footer/live-region denominator includes archived; live region "2 of 18 shown" has no noun; segment counts ignore search. ListFooter.vue, useResultAnnouncer. S.
- **R2-s9-08 P2 "Clear filters" three times** (toolbar, empty state, footer). S.
- **R2-s9-09 P2 Loading: false zeros in segments, live toolbar, no thead, nothing announced** (a5.mjs, shots/pois-list__loading__1440.png). S.
- **R2-s9-10 P2 At 1024 Translations column breaks words mid-letter** ("Englis/h"); head clipped; rows ~140 px. list-table.css, TranslationDots.vue. S.
- **R2-s9-11 P2 Create dialogs validate in two passes** (Route Setting / Category Applies to only after Title passes). FormDialog.vue onSubmit. S.
- **R2-s9-12 P2 Required markers and control types differ** (red "*" vs "(required)"; Route Setting select vs radio cards elsewhere). S.
- **R2-s9-13 P2 Back from an editor does not restore scroll** (3000 → 512; 2500 → 1416); focus on h1 not the row. useListQuery.ts. S.
- **R2-s9-14 P2 Row matched through another language shows nothing** (C1-21 not fixed). S.
- **R2-s9-15 P2 POI list hides a failed Categories call** (every row "No category", filter gone); Places 403 fails the whole POI list. S.
- **R2-s9-16 P2 Thin feedback after row actions:** archiving the last match leaves a bare "0 of 92 shown" with focus on main; 409 on Deactivate toast ~1.2 s, focus lost; toasts stack. Fix: warning toasts persist, focus neighbour kebab, Undo for Archive. useListLifecycle.ts. S.
- **R2-s9-17 P2 At 200 % the create dialog body shows ~2 lines.** S.
- **R2-s9-18 P2 Row activation refusal lists blocking after warnings, no "Open the editor", shows enum "ACTIVE".** S.
- **R2-s9-19 P2 Per-kind drift:** thead 35 vs 49 px; "Dates" vs "Next date"; Categories "Name", "Applies to" filter, no Featured; Category text vs column; Places "No map linked" text vs chip; blank Order header; "trigger" in placeholders of lists without triggers. S.
- **P3:** -20 Esc/backdrop loses typed text; -21 no slug length cap (328 chars); -22 no "Add sub-place" in Places ⋮; -23 blocked Archive dialog titled "Archive Sculpture?" with only Close; -24 tab title omits the Project on direct load (Places, POIs, Guides, Events); -25 forced-colours sort-header box touches text; -26 Move to position error has no role=alert / aria-describedby.

## Round-1 fixes verified
C1-13 partly · C1-14 fixed · C1-15 fixed · C1-16 not fixed (deferred) · C1-17 partly (scroll) · C1-18 partly · C1-19 partly · C1-20 partly · C1-21 not fixed · C1-28 partly · C1-37 partly · C1-69 fixed · C1-70 partly · C1-71 fixed · C1-78 partly · C1-120 fixed · C1-123 not fixed.

## What works
2 tab stops per row, focus returns to kebab; where-used blocks; 503/403/offline states with request id and Try again; create dialogs focus Title, Greek transliterated slugs, summary with links; no horizontal scroll; axe clean; forced colours keep chip icon+word and segment check.

## Unverified
Pointer drag reorder; >200 rows; Maps/Floor plans/Media lists; reduced-motion skeleton; real screen readers. Records: `UX-R2-s9` Place, POI (archived), Route, Guide, Event, Category, Greek title guide, temp, temp2, Subcat.
