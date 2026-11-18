# P3a: Places, POIs, Routes lists and create dialogs

## Closed
C2-38 (Place: Sub-place needs a Parent, validated in the same pass, no preselection, empty option "Choose a parent"), C2-43 (columns and labels), C2-44 (`validate`/`dirty` on all three dialogs), C2-46 (POI list survives failed Categories and Places incl. 403), C2-47 ("Add sub-place" in the Places row menu), C2-50 (dots link `?lang=`), C2-26 (`?create=1` on all three), C2-48 (Matches hint), C2-21/C2-94 (ListLoadError for rows and languages), C2-37 (compact POI row).

## Files
`views/workspace/pois/PoisView.vue`, `CreatePoiDialog.vue`; `places/PlacesView.vue`, `CreatePlaceDialog.vue`; `routes/RoutesView.vue`, `CreateRouteDialog.vue`. `placeTree.ts` unchanged. No D/Q entries (none reserved). e2e: no selector affected (no spec touches these lists' changed text); no new spec added. Requests in `requests.md` ("From P3a").

## Row anatomy (P3b: please match)
Columns: Title | the kind's own column(s) | Status | Updated | Translations (+ Order handle, Actions menu).
- Title cell: line 1 title link + code/Featured chips; line 2 slug (mono, truncates) with trigger chips beside it (`TriggerChips class="!mt-0 shrink-0"`); optional `MatchHint` line.
- Updated: its own column, `formatDateTime`, `<time datetime>`, sortable where the kind sorts (`sortKey: "updated"`), `w-32`; Status `w-40`.
- POI: "Place and category" (two single lines, truncated). Places: "Setting and map" (chip + type, then "Map/Floor plan linked"). Routes: Category, "Setting and stops".
- Toolbar `:counts` = status counts of rows passing every other filter, `:loading`; footer `:total="segmentTotal(...)" paged`; no `@clear`; `useResultAnnouncer(..., noun, { query, options: SORTS })`; `useScrollRestore` -> `rowKeyFocus`.

## Acceptance (admin, Populated)
- POI page of 50 rows at 1440: median row 73 px (was 112), table 4,039 px incl. head and pager (core had 5,868). At 1024: median 73, 4,379 px.
- Places 1440 median 73; 1024 median 83. Routes 1440 median 73; 1024 median 99 (narrow Title column, see requests).
- `/pois?create=1`: dialog open, focus on Title, param removed from the URL. Same wired for Places and Routes.
- Sub-place without Parent: summary "1 thing to fix: Parent place: Choose the place it sits inside.", nothing created. Row menu "Add sub-place" opens with the row's Place as Parent.
- POI list with `categories` aborted and `places` answering 403: 50 rows, one warning notice with Try again, Place/Category cells say "Not loaded" (no false "No category"), the create dialog's Place field is disabled with a hint. Rows read failure: "The server hit a problem" + request id + Try again (ProblemAlert); languages read failure: same, and never "Add a language first".
- Translation dot href `.../pois/<id>?lang=en`. axe (wcag2a/aa/21): 0 violations on POI create, Place create with error, Places list, degraded POI list.
- vue-tsc passes; `impeccable detect`: no findings.
- Screenshots in `P3a/after/` (pois/places/routes at 1440, 1024, 768, zoom200; create dialogs; degraded; error; languages error; forced colours for Places; row menu). Probes: `shots.mjs`, `states.mjs`, `degraded.mjs`.

## Deferred / notes
- Mid widths (900-1100): Routes Title column still narrow and breaks words (core table; request filed).
- Places sort control cannot be hidden (core; request filed); a note line stands in.
- Not run: keyboard-only pass beyond dialog focus and `?create=1`; 768/zoom200 shots of Routes/POIs were taken but only Places 768 was read closely (cards, no horizontal scroll: scrollWidth equals viewport everywhere).
- Records created: none (the Sub-place check was cancelled before submit).
