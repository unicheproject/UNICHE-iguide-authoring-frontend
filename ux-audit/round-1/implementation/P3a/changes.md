# P3a: Places, Points of Interest, Routes lists and create dialogs

## Closed
C1-13 to C1-21 for the three kinds (scaffold lists: sticky toolbar and head, status segments with counts, URL state, sort, kebab row menu, Move to position, 768 card rows, filtered-empty chips and Clear), C1-28 (create-dialog part), C1-69 to C1-71 (dialogs: shared summary with focus, sticky footer, "Create and open"), C1-120, C1-123 rows. Activation from a row goes through the shared `ActivateDialog` (stage 0.2 had published it); refusal (422 MISSING_REQUIRED_FIELDS) stays in the dialog and each field links to the editor with the handoff.

## Files
Owned: `places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, the three `Create*Dialog.vue`. `placeTree.ts` unchanged (flattenPlaceTree reused on the filtered list).
Extra ownership: new `src/components/ui/dialog/FormDialog.vue`; `ui/{field,input,select,checkbox}/index.ts`; `ui/select/Select.vue` now puts `id` and attrs on the native `<select>` (style stays on the wrapper).
New shared helpers (P3b should reuse): `src/views/workspace/useListLifecycle.ts` (kebab actions, activation confirm state, Deactivate/Archive confirm, toasts, VERSION_CONFLICT, focus back to the row's kebab), `LifecycleDialogs.vue` (renders them), `listRows.ts` (`normalizeText`, `searchTitles`, `translationScore`, `sortByQuery`). `system.md` has a "FormDialog" section.
e2e (not run, no Keycloak): `place-editor.spec.ts` (Level radio, "Create and open"); `content-lists.spec.ts` (old Filters-menu test now excludes the three lists; new scaffold test per list creates a row via API, drives the Draft segment from the keyboard, checks `status=DRAFT` in the URL, Clear filters, axe).

## Behaviour notes
- Places: Manual order only (tree), one-option sort select; columns Title (indent, disclosure), Setting (Indoor/Outdoor chip plus type), Map or floor plan (linked state), Status, Translations. Link state comes from `listMaps` + `listFloorPlans` loaded after the rows; "Not checked" while unknown or unreadable.
- POIs: Category and Featured filters in the toolbar slot (Category state in `cat`, Featured in `featured`); search covers title, slug, code and trigger text; "No trigger, only reachable by browsing" kept.
- Routes: Setting chip with mode and difficulty, Stops column (count, minutes, distance, loop).
- Create dialogs: Title first and focused; slug behind "Edit slug" (label "Slug"); Place: Level radios, Sub-place greyed with visible reason when the Project has no place; POI: Place, Category (applied after creation through `setResourceCategory`, a failure is a warning toast), optional Exhibit code; Route: Setting select (required, no default).

## Checks
- `vue-tsc`: clean for my files. Remaining errors are elsewhere (MediaView.vue `Orderable` generics, UploadEntryRow unused import, earlier ProjectList/StepLanguages/MapEditor).
- impeccable detect on all changed files: `[]`.
- Screenshots `P3a/after/`: `{places,pois,routes}__{1440,1024,768,zoom200}.png`, `create-*__{1440,768,zoom200}.png`, `create-*-errors__*`, `activate-refusal__1440.png`, `pois-forced-colors__1440.png`. At zoom200 Cancel and "Create and open" stay visible.
- Keyboard run (`keys.mjs`, `keys2.mjs`, 62 POIs): 2 tab stops per row (title link, kebab); search "zzzz" writes `q=zzzz` and shows "No points of interest match" with Clear; create dialog focus lands on Title, slug derived, "Create and open" opens the editor; Deactivate confirm returns focus to the row's kebab; mocked 422 refusal shows "Title (el): is required" in the dialog and the field link opens the editor; Move to position 3 on my own POI announces "Moved UX-P3a Test Marble Head to position 3 of 62." and Move to bottom restores; sort=title lands in the URL and survives Back.
- axe (wcag2a/aa, 21a/aa): every P3a screen, filtered-empty, create dialog and activate dialog show one serious `label-content-name-mismatch`, both nodes in the shell header (Project switcher button and the account menu button, `aria-label` does not contain the visible text). Not mine (header owner); no serious/critical in P3a markup.
- Record created: POI "UX-P3a Test Marble Head" (DRAFT, last in order) in UX Audit – Populated.
- Not run: e2e specs, 1280 width, reduced-motion capture, scroll restore on Back (scaffold code path), loading skeleton capture.

## Deferred / notes
- DECISIONS.md: plan section 3 reserves no D-id for P3a; none added (FormDialog is documented in `system.md`, rules D-076 and D-078 cover the rest).
- Request to the header owner: fix `label-content-name-mismatch` on the Project switcher and account menu buttons.
- Request: the place list's "linked map or floor plan" costs N+1 requests (each map/plan fetches its placements). A `placeId`/link summary on the Place list response would remove it (backend gap).
- Places search "Search in" and Needs translation work on the tree; a filtered subtree lifts orphans to the top level.

## Verification fixes
- R1-V-06 (POI and Route filter bar): Category (label beside its select, no longer stacked above) and "Featured only" now sit in one wrapping group in the toolbar's `filters` slot, so they wrap as a unit on one shared row instead of Category on row 2 and Featured alone on row 3. Toolbar height 205 px to 182 px at 1440, 1280 and 1024. Done in `PoisView.vue` and `RoutesView.vue` only; `CategoryFilterSelect` is no longer used there. Places (Featured only) and Guides/Events/Categories (138 px at 1440 and 1280, 138/182 at 1024) unchanged. Shots: `P3a/after/bar-{pois,routes}__{1440,1280,1024}.png`. `vue-tsc`: 0 errors.
- Possible W0 follow-up: `ListToolbar` could give the `filters` slot its own row container so every list's extra filters align the same way (not required now).
