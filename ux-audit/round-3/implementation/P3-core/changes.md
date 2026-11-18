# P3-core List core: changes

Typecheck (vue-tsc, tsconfig.app.json) passes. check-css-tokens passes (57 files). `impeccable detect --json` on the owned files returns `[]`. The literal gate grep over the owned files hits only `dropLineClass` in `useReorder.ts` (pre-existing, dead, CLN removes it). Nothing was committed or installed. e2e specs cannot run here (Keycloak): I added one spec and did not run it.

## C3 ids
- Fixed in core:
  - C3-08, 10, 13 (radio Home/End), 40, 41, 45, 46 (the Move dialog already had aria-invalid, aria-describedby and inputmode; unchanged), 50 (`<bdi>` in `ListRowTitle`), 99 (`FilterChip`, `ListSelect` on `Select`), 101 (dots 32 px).
- Fixed in core, but views must adopt the new pieces (see Notes):
  - C3-42 (Title never under 15 rem, by measuring), 43 (header, Order and tree step in core; slug and chips are view slots), 44 (Updated 150 px and NBSP are views/format), 47 (`ListEmpty` counts and `header-action`, `FilterField`), 48 (row titles, sort headers), 51 (`ListRowTitle` back and lang, one Language control, worklist chip, dots carry `back`), 87 (`ListLoadError` focus, `query.errors`, `ListSourceNotice`), 91 (skeleton row height, `ListFooter loading`, status counts `reserve`).
- C3-09 (lists): Undo bar, dismiss, Restore, kebab use `focusSuccessor` or the neighbour kebab.

## Files changed
- `components/list/`: `ListTable`, `ListToolbar`, `ListEmpty`, `ListLoadError`, `ListFooter`, `ListSelect`, `SortSelect`, `StatusSegments`, `useListQuery`. New: `FilterChip`, `FilterField`, `ListRowTitle`, `ListSourceNotice`.
- `TranslationDots.vue`, `TriggerChips.vue`, `views/workspace/useListLifecycle.ts`, `LifecycleDialogs.vue`, `workspace/useReorder.ts`, `workspace/useCategoryFilter.ts` (exposes `error`), `styles/list-table.css`, `e2e/content-lists.spec.ts` (new Filters popover test).
- `DECISIONS.md` D-110, D-111; `requests.md` (2 items).
- Not touched: `listRows.ts`, `listFilters.ts`, `RowMenu.vue`, `SetPositionDialog.vue`, `MatchHint.vue`, `useCreateParam.ts` (no change needed).
- Probes and shots: `ux-audit/round-3/implementation/P3-core/{probes,before,after}/`.

## Acceptance, measured (admin, populated project, own `UX-R3-P3core ...` POIs, one event, one guide)
"Before" for items 2 to 7 are the round-3 audit numbers: ListToolbar was already edited when I could first probe those. Layout "before" was measured by probe.
1. **Title cell at 1280 and 1024** (min over rows, before then after):
   - Routes 126 and 118, then card layout (922 and 914).
   - Events 174 and 166, then cards.
   - Guides 222 and 214, then cards.
   - Places 206 and 198, then cards.
   - Categories 238 and 230, then cards.
   - POIs 270 and 262, then table 270 and 262.
   - So every list is at least 262 px, in table or card mode. At 1440 every list keeps the table (286 to 430 px). Overlapping cell pairs: 0 before and after. Document overflow: none.
   - 60+ character Greek title at 1024 (POI, Event, Guide): 0 overlaps, 0 overflowing cells. Event went from 6 lines at 166 px to 1 line, Guide from 4 lines to 1 line, because the rows are cards.
   - POIs still show 8 cells whose content is wider than the cell at 1280 and 1024 (before 8 and 9). That is the view's slug-plus-chips row (P3a).
2. **Header and Order:** header height 35, 49 and 53 px before, 48 px in all six after. Order width 53 px (POI at 1440) before, 48 px after.
3. **Filters popover at zoom200 (640x360):**
   - Before: 418 px tall, top at -239.
   - After: top 8, bottom 158, innerHeight 360, internal scroll true, Done visible.
   - Dialog name "Filters and sort". Button name "Filters 1".
   - Focus returns to the button after Done.
   - axe (wcag2a/aa, 21a/aa) on `/pois?pending=1` at 1440: 0 violations, also with the popover open; `label-content-name-mismatch` is clean.
4. **Move:**
   - Move to position 60 of 122 from page 3, then to position 3 from page 2.
   - The bar reads "Moved ... to position 3 of 122. It is on page 1." with Show it and Undo.
   - Live region reads "Moved UX-R3-P3core Move A to position 3 of 122." (title cut to 40 characters when longer).
   - Focus after the move: the next row's kebab (never BODY).
   - Ctrl+Z restored the row to page 2, the bar went away, and focus is on the row's kebab.
   - Undo by keyboard (Enter) also lands on the kebab.
   - Reduced motion: the flash is a static 2 px inset rule, animation none.
   - Moving to the bottom works the same way. My POI ended at the end of the list.
5. **Paging:** page 2 focus is on the table (`tabindex=-1`, no ring). The head sits flush under the toolbar (head top 113 = toolbar bottom 113) and the first row is at 161. Before, the audit saw the pager focused 3,700 px down and the scroll 51 px low.
6. **Header sort:** first click `?sort=title`, second `&dir=desc`, third returns to the default order (URL clean) and says "Manual order".
7. **Radio Home/End:** End selects Archived, Home selects Not archived, scroll delta 0.
8. **Below 1180 px:** `?status=DRAFT&missing=it&lang=it` at 1024 and 768 shows chips "Remove filter Status: Draft" and "Remove filter Needs translation in Italiano" beside the button.
9. **List error (503 with a request id):**
   - At 1440, 1024, 768 and zoom200, focus is on the h1.
   - "Try again" leaves focus on the h1.
   - The card has one request-id row.
10. **CLS `/pois`, 3 loads:** 0.017, 0.062 and 0.017 (before 0.07 to 0.11), not at 0.02 or below on every load.
    - The constant 0.0167 is the body 8 px to 0 shift at about 200 ms, before the list exists (shell, P1).
    - The 0.06 is rows growing from the 72 px skeleton to 59 to 81 px when the trigger chips arrive. `PoisView` sets the rows first and awaits the triggers after (P3a). A footer that appears late also shifted 0.05 once. The core piece is `ListFooter loading` and the status `reserve`. I could not measure those fixes end to end until the views adopt them.
11. **Shots** (`after/`): populated, filtered-empty and error at 1440, 1024, 768 and zoom200; Filters popover at 1440, zoom200 and forced colours; move bar; page 2; chips at 1024 and 768; reduced-motion flash. Read and checked.

## Deferred
- D-111 says "toast". The toast store has no action button (W0-A file), so the move feedback is a sticky bar in `ListTable` (request 1 in `requests.md`). The table's live region is the one announcement.
- The filtered-empty "N matches in Archived" and the single New button appear only when the views pass `counts`, `status` and `header-action`.
- The popover's own view filters (Category, Featured) still use the old inline layout until the views use `FilterField`.
- C3-13's "3 link stops per row" for translation dots is not changed.

## System additions
- Components in `components/list/`:
  - `FilterChip` (prop `label`, `removable` default true, event `remove`).
  - `FilterField` (props `label`, `for`, `hint`).
  - `ListRowTitle` (props `to` as a route object, `muted`, `missing`).
  - `ListSourceNotice` (props `errors`, `labels`, event `retry(source)`).
- `ListQuery.errors` and `ListQuery.reportError(source, error)`, with `ListSource` = categories | places | triggers.
- `Reorder`: `lastMove`, `flashId`, `moves`, `undo()`, `clearLastMove()`, `highlight(id)`; exports `liveTitle` and `LIVE_TITLE_MAX`.
- `ListFooter` prop `loading`; `StatusSegments` prop `reserve`; `ListLoadError` takes `error`, `what`, emits `retry` (focuses the h1).
- `ListEmpty` props `counts`, `status`, `header-action`.
- `TriggerChips` prop `unavailable` and a cap of 2 plus "+N".
- `useCategoryFilter().error`.
- `useListLifecycle().dismissUndo(bar)`.
- CSS: `.list-flash`, `.list-th-order`, `.list-td-order`, `.list-row-skeleton`, `.list-card-skeleton`; `.list-scope` has scroll-margin-top -3rem.

## Notes for P3a/P3b
Row anatomy and contract:
- **Title column:** put the title in `<ListRowTitle :to="{ name, params }" :muted="row.status==='ARCHIVED'" :missing="query.missing.value">title</ListRowTitle>`. It adds `<bdi>`, `hit-44`, `back` (via `listBackQuery`) and `lang`. Drop your own `RouterLink` and any `!min-h`/`::after` tricks.
- **Column classes:** the table ignores `w-*` on the tree column and any `h-*` on all columns. Remove `h-12` from Categories.
- **Width budget:** if the other columns leave the Title under 240 px the rows become cards, so keep the other widths lean. Aim for Status 128, Updated 150, Translations 192 plus one domain column of 144 or less. Merge Routes' Category into "Setting and category" to stay in table mode at 1280.
- **Slug and chips:** the slug is on one line with a `title`. Put `TriggerChips` on its own line, and remove the `!mt-0 shrink-0` override. Pass `:unavailable="triggersByPoi === null"` instead of hiding it. Updated uses `NBSP` (`formatDateTime`/`withUnit` from `lib/format`).
- **Reorder:** `useReorder` is used as before. `ListTable` renders the move bar, the flash and the Ctrl+Z handling by itself.
- **Toolbar:**
  - The Filters button, popover name, Done and the Language/worklist control are in core.
  - Put view filters in slot `filters` as `<FilterField label="Category" :for="id"><ListSelect :id="id" v-model class="w-full">…</ListSelect></FilterField>` (full width, label above). Checkboxes go in slot `filters-extra`.
  - Pass `:loading` to `ListToolbar` so the status counts reserve their width.
- **Empty and footer:**
  - `<ListEmpty header-action :counts="counts" :status="query.status.value" …>` gives one New button and "1 match in Archived".
  - Render `<ListFooter :loading="loading" …>` also while loading, and keep the footer element always mounted.
- **CLS:** set `pois`/rows only after the triggers read settles (or while `loading` stays true), otherwise chips arriving grow the rows (0.06).
- **Optional reads:** call `query.reportError("categories"|"places"|"triggers", error|null)` and render `<ListSourceNotice :errors="query.errors" @retry="…" />` once; `useCategoryFilter().error` carries the Categories failure.
- **Errors:** `<ListLoadError :error what @retry>` focuses the h1 itself; delete any local focus code.
