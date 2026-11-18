# P3-core: shared list core and create-dialog frame

## Closed
C2-36 (sort direction, Updated newest first), C2-37 (paging; page height see below), C2-39, C2-40, C2-41, C2-42, C2-44 (FormDialog), C2-45 (warning toasts persist, neighbour kebab focus, Undo bar, blocked-Archive retitle, short titles), C2-47 (move error `role=alert`), C2-48 (hint component + helper), C2-49 (default language), C2-53 (`dir="auto"` on search and row titles), C2-74 (`/` focuses search), C2-01 (row title links get a 44 px target), C2-21 (head stays while loading, no false zeros), C2-94 (`ListLoadError`).
Partly (needs P3a/P3b adoption, see checklist): C2-35 (list rows: blocked activation shows "Can't activate X yet" + Review in editor; warnings link needs P4s `ActivateDialog`), C2-37 (compact POI row), C2-39 (views must pass segment totals), C2-43, C2-46, C2-48, C2-50 (editors must honour `?lang=`).

## Files
`components/list/`: `useListQuery.ts`, `ListTable.vue`, `ListToolbar.vue`, `ListFooter.vue`, `ListEmpty.vue`, `SortSelect.vue`, `StatusSegments.vue`, `SetPositionDialog.vue`, new `ListLoadError.vue`, `MatchHint.vue`, `useCreateParam.ts`. `TranslationDots.vue`, `TriggerChips.vue`, `views/workspace/useListLifecycle.ts`, `LifecycleDialogs.vue`, `listRows.ts`, `workspace/useCategoryFilter.ts`, `useReorder.ts` (persistent warning toast), `ui/dialog/FormDialog.vue`, `StatusChangeDialog.vue` (`blockedHeading`), `styles/list-table.css`, `e2e/content-lists.spec.ts` (3 tests added; none weakened; cannot run here). `RowMenu.vue` and `ListSelect.vue` unchanged.
D-091 appended to DECISIONS.md. No Q entries. Requests in `requests.md`.

## Acceptance (admin, Populated, 85 not archived POIs)
- Rows rendered: 50 on page 1, 35 on page 2; pager "Showing 1–50 of 85"; `page=2` in the URL; loader asked for `page=0` and `page=1` when `totalPages` was forced to 2 (`paging.mjs`).
- Page height: 5,868 px for 50 rows (was ~9,158 for 84). **Not yet <= 4,000**: the POI row is still ~112 px because `PoisView` (P3a) puts slug, place, date and trigger chips on 3-4 lines; compaction is P3a's (see checklist). Core change: cell padding 10 -> 8 px.
- `sort=updated`: first rows 16 Nov, 13 Nov, 13 Nov, 13 Nov 2026 (newest first); the control says "Newest first", toggling writes `dir=asc`.
- Back from an editor at scrollTop 3000: returns to 3000 exactly and focus is on the row link that was opened.
- 1024: Translations column 192 px, each language one unit ("English", "Ελληνικά", "Italiano" never split); no horizontal scroll at 1024/768/zoom200.
- Create dialog at zoom200 (640x360 CSS): body 221 px (was 185), Title, Place and the start of Category visible; Esc with typed text opens "Discard what you typed?", Keep editing keeps the text.
- axe (wcag2a/aa, 2.1): 0 violations on the list, the no-match list, the filter popover and the create dialog. Forced-colours shot taken.
- Keyboard: `/` focuses search (and typing `/` inside it types); Next stays focusable on the last page (aria-disabled with a reason); "Needs translation" ticked with no Search-in selected `missing=el` (first non-default).
Screenshots: `after/` (pois at 1440/1024/768/zoom200, loading, no-match, forced colours, sort popover, create dialog, discard confirm, validation summary). Probes: `probe*.mjs`, `shots.mjs`, `states.mjs`, `keys.mjs`, `paging.mjs`.

## Adoption checklist for P3a / P3b (batch B)
1. `ListToolbar`: pass `:counts` = `statusCounts(rows that pass every filter except status)` and `:loading`; pass `show-missing`/`show-pending` as today.
2. `ListFooter`: `:total="segmentTotal(items, query.status.value)"`, `paged`, drop `@clear`. `ListEmpty`: unchanged props; no clear button any more.
3. `useResultAnnouncer(shown, segmentTotal, ready, "points of interest", { query, options: SORTS })`; `const { rowKeyFocus } = useScrollRestore(ready)` and `:row-key-focus="rowKeyFocus"` on `ListTable`.
4. Sort options: Updated cell shows date and time (`formatDateTime`); trees (Places, Categories) show "Ordered by hierarchy and manual order" instead of the sort (Q-018).
5. Row: `TranslationDots :route="editorRoute(row)"`; `MatchHint` from `matchedInOtherLanguage(row.translations, query.q.value, defaultCode, [title, slug, code])`; compact POI row: move "Updated" to its own column, put trigger chips beside the slug line, no 3-line cells (target about 64 px, 50 rows <= 4,000 px).
6. Errors: `ListLoadError` for rows and for languages (never "Add a language first" from a failed read); `useCreateParam(creating, ready)` for `?create=1`; `useCategoryFilter().failed` for the POI notice.
7. Create dialogs: pass `:validate` (the kind's own checks, same pass), `:dirty`, mark every required field `FormField required`; unmapped 422 keys need no special code.
8. e2e selectors that reach Category/Featured/Search-in must open "Filters" first (W0-B).

## Notes
- `useReorder.dropLineClass` still holds legacy `shadow-[..]` classes (not touched, outside the package's scope of change).
- The route announcer (W0-A) scrolls `main` to top and focuses the h1 once per route; a probe that scrolls within about 2 s of a cold load sees it reset. Back navigation is not affected.
- Undo for Archive is a bar in `LifecycleDialogs`, not a toast (the toast has no action slot; see requests).

## Verification fixes
- R2-V-05: `RowMenu.vue` opens on its first enabled Move item (`data-open-focus`; "Move down" on the first row), not on Deactivate/Activate. Radix refocuses the first item whenever the menu itself is focused, so focusing the menu was not possible. Checked by keyboard (`menu.mjs`): open -> Move down, ArrowDown -> Move to position..., Esc -> kebab focused; vue-tsc passes. A row menu with no Move items (reorder off or blocked) still opens on its first action.
