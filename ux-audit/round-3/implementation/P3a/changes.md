# P3a Places, POIs, Routes lists and create dialogs: changes

Typecheck (vue-tsc, tsconfig.app.json) passes. check-css-tokens passes (57 files). `impeccable detect --json` on the 7 touched files returns `[]`. The gate grep over them returns nothing. Nothing committed or installed. No e2e spec selector is affected by my markup (checked `content-lists`, `screens`, `zoom-and-structure`), so no spec changed; the specs cannot run here (Keycloak). Probes and shots are in `ux-audit/round-3/implementation/P3a/{probes,before,after}/`.

## C3 ids
- Fixed: C3-42, 43, 44 (view parts: column budget, slug line, chips line, "Updated" 152 px and NBSP, "1.6 km", "7 stops"), C3-48 (title links via `ListRowTitle`), C3-85 (one 503 sentence, no "things to fix" over a server fault in the three dialogs), C3-87 (Routes and POI Categories failure, Places failure, Triggers failure: one notice with Try again), C3-88 (unmapped path: FormDialog line without link; the generic `createFailure` for a 400/422 with no field), C3-89 (offline says "Nothing was created"; "Creating..." is `FormDialog`'s, W0-A), C3-93 (Route Setting is radio cards like Place Level and Category scope; one alert, equal frames), C3-27 (`CreatePoiDialog`: "Category not set" toast now persists and carries the request id).
- Partly: C3-91 for the three lists (see CLS). C3-50 in the three lists (`<bdi>` via `ListRowTitle`).

## Files changed
`places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, `places/CreatePlaceDialog.vue`, `pois/CreatePoiDialog.vue`, `routes/CreateRouteDialog.vue`. New: `views/workspace/createFailure.ts` (shared by all create dialogs; P3b should import it). `places/placeTree.ts` needed no change. No D, Q or G entries (none reserved to P3a).

## What changed in the views
- Rows use `ListRowTitle` (with `missing`), a one-line slug with `title`, and `TriggerChips` on its own line with `:unavailable="triggers === null"` ("Triggers not loaded") and no `!mt-0 shrink-0`.
- `load()` sets rows only after the triggers read settles (Promise.all), and `query` is created above `load`.
- Optional reads call `query.reportError("categories"|"places"|"triggers", ...)`. `<ListSourceNotice :errors="query.errors" @retry>` renders once above the card. Retry calls `focusHeading()` first (focus is on the h1, the notice goes away; measured).
- Filters: Category in `FilterField` + `ListSelect class="w-full"` (slot `filters`), Featured in slot `filters-extra`. Popover labels measured: Language, Sort by, Pending changes, Needs translation, Category, Featured only.
- `ListEmpty` gets `counts`, `status` and `header-action` (the second New button is gone, which also removes a duplicate "New ..." match for specs). `ListFooter` is always mounted while loading or when rows exist, and takes `:loading`.
- Columns: Status w-32 (128), Updated w-[9.5rem] (152, NBSP, `whitespace-nowrap`), Translations 192 (core), one domain column of 144 (POI "Place and category") or 176 (Places "Setting and map", Routes "Setting and stops"). Routes' Category moved onto the slug line ("slug · Category", the category truncates at 50 %). The Pending changes chip wraps to two lines inside the 128 px Status cell (`max-w-full !whitespace-normal`).
- Routes facts use `withUnit`/`formatDistance` ("1.6 km", "90 min", "7 stops" with NBSP).
- Dialogs: Route "Setting" is a fieldset of radio cards (legend "Setting (required)", error line `text-xs text-destructive`, `aria-invalid`, id for the summary link), the same markup as Category scope. Place Level gets an id on its fieldset. Failures use `createFailure(e, noun)`.

## Acceptance, measured (admin, populated project; before from my baseline run, `before/layout.json`)
1. **Mode and Title cell** (table or cards, Title min px; before then after; Order 48, header 48 in all tables):

| List | 1440 | 1280 | 1024 | 768 |
|---|---|---|---|---|
| Places | table 366 then 406 | cards then **table 246** | cards 834 then cards | cards |
| POIs | table 430 then 438 | table 270 then 278 | table 262 then 270 | cards |
| Routes | table 286 then 406 | cards then **table 246** | cards 914 then cards | cards |

   All three are tables at 1440 and 1280 (plan section 9 item 7 met). At 1024 Places and Routes are cards (acceptable: the table cannot fit at 1024). Cards below 900 px. Overlapping cell pairs 0, document overflow none, everywhere. Overflowing cells: POIs 8 before and after, Routes 1; the cause was the Pending changes chip, which I let wrap in Status (re-probed: the overflow was only that chip; the final shots show the chip wrapped). Places 0.
2. **Row heights** (median/max, px, after): 1440 Places 81/83, POIs 81/144, Routes 81/141; 1280 Places 81/120, POIs 87/186, Routes 81/204. Tall rows are the 60 to 70 character titles wrapping at 246 to 278 px (and Translations wraps to three lines at 192 px). Cards: 1024 Places 118/121, POIs 87/186 (table), Routes 120/141; 768 Places 118/139, POIs 143/184, Routes 120/162.
3. **CLS `/pois`, 3 cold loads at 1440:** total 0.0167, 0, 0.0167. The 0.0167 is the body 8 px to 0 shift at about 400 ms before the list exists (shell, P1). The list part is 0 (before: 0.017, 0.062, 0.017 in the P3-core report). Places 0.0001, 0.0168, 0.0001; Routes 0.0002, 0.0002, 0.0169 (same body shift). Target 0.02 met.
4. **Greek and RTL title:** 71-character Greek POI title at 1280: 3 lines, 0 overlaps, `<bdi>` present. A Hebrew+Latin title with punctuation (own record `UX-R3-P3a ... (new)! – 2026?`) renders in an isolated bdi (`unicode-bidi: isolate`), not reordered with neighbours (shot `pois-rtl-title__1280`). Inside a mixed-script string the "!" and "–" follow the Latin base direction; that is the data, not the markup.
5. **Categories aborted:** POI list 50 rows, Routes list 26 rows, each with one notice "Categories could not be loaded", Try again. After Try again focus is on the h1 and the notice is gone. axe 0 violations. Triggers aborted: 50 rows, each line "Triggers not loaded", one notice.
6. **Create dialogs, six kinds (script):** identical width 576, body padding 8/24/8/24, Close offset top 21 right 17, heading top 21, and exactly one `role=alert` after an empty submit, on all six (Guides, Events, Categories only measured, not edited).
7. **503 on create** (Route, Place, POI): summary "The route was not created | The platform is busy or down for maintenance. Nothing was created. Try again in a few minutes. | Request id req-p3a-503 | Copy request id"; no "things to fix"; focus on the summary; one alert. Offline: "You are offline. Nothing was created. What you typed is still here; reconnect and try again."
8. **Keyboard:** in the Route dialog Tab from Title reaches the radio group, ArrowRight changes the choice (`[false,true]`), Enter submits. List focus after a failed read and after Try again is the h1.
9. **axe** (wcag2a/aa, 21a/aa): 0 violations on Places, POIs, Routes, POIs with Filters open, the Route dialog with errors, and the Categories-aborted views.
10. **Shots** (`after/`): populated at 1440, 1280, 1024, 768, zoom200; filtered-empty at the same five widths; 503 error at 1440, 1024, zoom200 (focus on the h1 in all, one request-id row); Categories and Triggers failure; Filters popover; forced colours for the three lists at 1440; create dialogs (open, empty submit, 503, offline). All read and checked.

## Deferred
- Places and Routes are cards at 1024 (table needs about 1 100 px with these columns); plan allows it.
- The Pending changes chip wraps to two lines at 128 px. A shorter visible label ("Pending") would need P3-core and a decision on the chip text.
- Translations (192 px) wraps three languages to two lines, so row height is 81 even for one-line titles; wider Translations would break the 240 px Title budget.
- Guides, Events, Categories dialogs still use their own failure text (P3b).

## Notes for P3b
- Same budget works: Status w-32, Updated w-[9.5rem] with `formatDateTime(...).replaceAll(" ", NBSP)` plus `whitespace-nowrap`, one domain column at most 176. At 1280 the container is about 998 px wide: Title = 998 - 48 (Order) - 56 (menu) - 192 - 128 - 152 - domain.
- Wrap the Pending changes `StatusChip` with `class="max-w-full !whitespace-normal text-left"`.
- Import `createFailure(error, noun)` from `views/workspace/createFailure.ts` in the three P3b dialogs (503 sentence, "Nothing was created", offline).
- View convention: create `query = useListQuery()` before `load()` (load reports sources), set rows after optional reads settle, call `focusHeading()` in the notice's retry, and render `<template v-else>` around notice and card so the notice is hidden while the load error card shows.
- Put the footer under `v-if="loading || rows.length"` with `:loading="loading"`, and the filters in `filters` (FilterField) and `filters-extra`.

## System additions
- `views/workspace/createFailure.ts`: `createFailure(error: ApiError, noun: string): string`.
