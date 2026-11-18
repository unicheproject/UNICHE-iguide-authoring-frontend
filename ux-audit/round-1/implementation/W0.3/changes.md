# W0 stage 0.3: list scaffold, Greek companion font

## Closed
C1-13 to C1-21, C1-35 (shell part), C1-14, C1-37, C1-78 and C1-120 (list side: announcements, titles), D-085 (Greek). Components only: the six views still use the old markup until P3a/P3b.

## Files
New `src/components/list/`: `ListToolbar, StatusSegments, SortSelect, ListSelect, RowMenu, SetPositionDialog, ListTable, ListFooter, ListEmpty, useListQuery.ts` (also `useScrollRestore`, `useResultAnnouncer`, `statusCounts`, `matchesStatus`).
Rewritten (props kept, additive only): `ReorderControls` (+`extended` prop for the position button), `ListFilterMenu`, `FilterChoiceGroup`, `SearchLanguageSelect`, `FeaturedFilterChip`, `CategoryFilterSelect`, `TranslationDots` (+`to`, `names`), `TriggerChips`; `src/styles/list-table.css` (appended tokenised `.list-*` classes; `.th/.td` untouched because CategoriesView/MediaView import them).
Also edited (plan-owned by W0, not in the scope list): `src/workspace/useReorder.ts` additive: `position()`, `moveToPosition()`, option `visible`. Greek: `public/fonts/manrope-greek-var.woff2`, `public/fonts/OFL-Manrope.txt`, one appended `@font-face` in `src/style.css`. Not built: `FormDialog` (needs `ui/dialog`, out of scope), `useCategoryFilter`/`listFilters.ts` unchanged.
Docs: `system.md` "List scaffold" (append), DECISIONS D-076 and D-085. Scratch (outside `src/`): `W0.3/scratch/{ListDemo.vue,mount.ts,tsconfig.demo.json}`, `W0.3/capture.mjs`.

## Checks
- `vue-tsc --noEmit -p tsconfig.app.json`: clean. Demo type-checked with its own tsconfig. Detector and gate grep (px sizes, hex, uppercase, rounded/shadow/z arbitrary) over owned files: empty.
- Six old lists at 1440: `after/list-*__1440.png`, all render (reorder, chips, triggers, status as before; translation cells show codes with icons, wrap in the narrow column; row heights a little taller from chip/icon sizes).
- Demo mounted over the running app from `scratch/` (nothing in `src/` uses it) with real POI data and a no-op save, so no records were created or moved: `after/demo__{1440,1024,768,zoom200}.png`, `demo-menu`, `demo-position-error`, `demo-filtered-empty`. Keyboard run (Windows Node, `capture.mjs keys`): kebab opens on Enter with Deactivate / Move up / Move down / Move to position... / top / bottom; Esc returns focus to the kebab; Move down announces "Moved East Pediment Fragments to position 3 of 60."; Move to position... opens the dialog with focus in the field; "99" gives "Enter a number from 1 to 60." and stays open; "1" confirms, dialog closes, focus back on the kebab, announced "position 1 of 60"; URL becomes `?q=zzzz` and "0 of 65 shown" is announced after the debounce. Filtered-empty shows the filter chip and Clear filters.
- Greek: font face "Montserrat Variable" for U+0370.. reports `loaded` (POI editor, Greek tab, `after/greek-poi-editor__1440.png`; list rows in `demo__1440.png` show the Greek language name). Greek Extended stays on the system sans (Manrope lacks it).
- Not run: e2e specs, axe on the demo, forced-colours and reduced-motion captures, real reorder writes, scroll restore and Back-restore of URL state (code paths only), tree disclosure (no tree in the demo), loading skeleton.

## Deferred / notes
- `ui/field`, `ui/input`, `ui/select`, `ui/checkbox` have no `index.ts` (system.md says they do); I import the `.vue` files directly. `ui/select` puts `id` on its wrapper, hence `list/ListSelect`.
- Sticky: toolbar sticks from 900 px only (so 200 % zoom has no sticky bar); thead sits under it via `--list-toolbar-h` that the toolbar writes on its parent; keep the table's ancestors free of `overflow` or the head stops sticking.
- A move steps over hidden ARCHIVED rows only when the view passes `visible` to `useReorder` (shown in the example).
- Needs `FormDialog` later (ui scope). `TriggerChips`/`TranslationDots` old callers unchanged.

## Adoption notes
- P3a/P3b: copy the system.md example; keep the editor route and create dialog; map `categoryFilterChip` into `query.chips([...])`; Places/Categories pass `depth` and `hasChildren` and sort Manual only. Remove old `<main>`, `PageFrame` instead; the `ReorderControls` import goes away (ListTable has the handle, RowMenu the keyboard path).
- P6/P7: Maps, Floor plans, Media may use `ListTable` columns and `ListToolbar` with `showPending=false showMissing=false`; Media keeps the `list-table.css` import until it migrates.
