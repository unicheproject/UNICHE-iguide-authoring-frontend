# P3b: Guides, Events, Categories lists and create dialogs

## Closed
C1-13 to C1-21 for these kinds (scaffold lists, sticky toolbar/head, URL filters, kebab, set position, card rows below 900 px), C1-20 (Categories rows no longer truncate or wrap actions: one kebab), C1-28 (create-dialog part), C1-69, C1-70 (Category/Slug-Code, selected state, no silent default), C1-71 (dialog summaries), C1-123 rows, C1-120.
Partial: Category dialog still reads "Title" and "Slug" (frame hard-codes them), see requests.md 1.

## Files
Rewritten: `views/workspace/guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue`. New: `events/eventDates.ts`. Reused read-only: `FormDialog`, `useListLifecycle`, `LifecycleDialogs` (W0 `ActivateDialog` with 422 refusal inside), `listRows`.
- Guides: Title, Story (text blocks, references, minutes read), Status, Translations; Featured filter; sorts Manual/Title/Status/Updated/Translations.
- Events: Title, Dates (next occurrence day + time span, "next of N dates", cancelled as Chip with Ban icon and text, "All dates cancelled", "No upcoming date"), Status, Translations; "Next date" sort. One en-GB formatter in the Project timezone.
- Categories: tree (POI tree then Routes tree) with disclosure, icon tile, code, "Applies to" column (chip with icon plus "Used by N ..."), scope filter in the URL (`cat=POI|ROUTE`), "Add subcategory" in the kebab. `list-table.css` import dropped. Manual order only.
- Dialogs on `FormDialog`: Category has radio-card choices with a check icon on the selected card; "Applies to" has no preselection (required, error shown), Level defaults Top-level (stated), parent select only for Subcategory; "+ Add subcategory" opens it with the parent preselected.

## Checks
- vue-tsc clean. Gate grep and impeccable detect on the 7 files: empty.
- Screenshots `P3b/after/`: lists and create dialogs (empty-submit errors) at 1440, 1024, 768, zoom200; forced-colours for Events and Categories. Footer of dialogs reachable at zoom200. Not captured: Greek, loading/error/long-text states, keyboard-focus shots.
- Keyboard (checks.mjs): Categories disclosure button "Sub-items of Visitor Services" toggles with Enter and Space, rows 15 -> 13 -> 15, `aria-expanded` flips.
- axe (1440): only `label-content-name-mismatch` (serious) on the header project switcher, already in requests.md from P8; nothing from these views.
- e2e: selectors in `content-lists.spec.ts` and `zoom-and-structure.spec.ts` (create buttons, headings) unchanged; specs not run (need local Keycloak).
- Not exercised: creating records, activation refusal from these rows (same shared code path P3a verified).

## Deferred / notes
- Events: no special activation handling (G-033). Category usage count is shown from `resourceCount` (the plan said omit; the list payload carries it).
- No D/Q entries reserved for P3b; none added.
