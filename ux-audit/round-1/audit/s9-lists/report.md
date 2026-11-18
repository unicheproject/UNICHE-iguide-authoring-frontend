# s9-lists — Round 1
Screen group: Content lists (Places, POIs, Routes, Guides, Events, Categories) and their create dialogs. Mode: Operate. impeccable interview steps skipped (subagent; the brief answers them). Records I created: `UX-s9-lists <kind>` x6 in Populated (all later archived by me while testing row actions; they remain as ARCHIVED rows). Shots in `shots/` (about 50), scripts `a1..a12.mjs`.

## Verdict
The six lists share one competent but dense "card + table" component and are visually consistent in tone. As a daily tool for 40+ items it is not there yet: no sticky header or toolbar, no sort, no bulk actions, no set-position, 5 to 6 Tab stops per row, 70 to 150 px tall rows, everything lost on reload, and the table clips its Actions column at 768. Lifecycle actions fire in one click from the list with no readiness feedback. Per-kind anatomy drifts (meta lines, chips, search width, row actions). Recommended: ONE table pattern (below).

## Context check
- `12` §3 Content library: every list "shows per row: title, slug, updatedAt, status badge, pending badge, translation dots, trigger chips" and "sorts by sortOrder"; filters status/Category/featured/pending.
- `14` §4: "every reorder interaction ... has a keyboard alternative: move up, move down, and set position"; status by text and icon, never colour alone.
- `03` §1: lifecycle `DRAFT -> ACTIVE -> ARCHIVED`; `DRAFT -> ARCHIVED` archive; `ARCHIVED -> DRAFT` restore.
- DECISIONS.md D-017: lists reorder by drag + Move up/down; reordering is off while any filter or search is active. D-035: Featured and search-language filters filter in the browser.
- PRODUCT.md: "a daily editor who can maintain 40+ items per list quickly and confidently."

## Scores (0-100)
Caps applied: open P1 -> max 85. Scores below are what the evidence supports.

| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| Lists, 1440/1280 (populated, 6 kinds) | 14 | 13 | 9 | 10 | 9 | 6 | **61** |
| Lists 1024 | 14 | 12 | 9 | 10 | 9 | 6 | **60** |
| Lists 768 (Actions clipped) | 9 | 9 | 8 | 10 | 8 | 3 | **47** |
| Lists zoom200 | 11 | 9 | 8 | 10 | 9 | 4 | **51** |
| Empty (Empty B + mocked) | 17 | 14 | 10 | 12 | 11 | 6 | **70** |
| Filtered-empty | 14 | 13 | 10 | 9 | 11 | 6 | **63** |
| Error 5xx/403/404 | 17 | 13 | 12 | 12 | 11 | 6 | **71** |
| Filters popover + chips | 15 | 14 | 11 | 11 | 11 | 6 | **68** |
| Create dialogs (6) | 18 | 15 | 10 | 11 | 10 | 6 | **70** |
| Row actions + confirms | 13 | 12 | 10 | 8 | 9 | 5 | **57** |

Realistic range for the group: **57 to 71** today.

Nielsen (0-4): Visibility of status 3, Match with real world 3, User control and freedom 2, Consistency and standards 2, Error prevention 2, Recognition rather than recall 2, Flexibility and efficiency 1, Aesthetic and minimalist 2, Error recovery 3, Help 2. Total 22/40.

## Side-by-side matrix (1440, Populated; "code" = derived from the Vue source where data did not show it)

| Aspect | Places | POIs | Routes | Guides | Events | Categories |
|---|---|---|---|---|---|---|
| Rows in seed | 13 | 55 (65 after other agents) | 8 | 7 | 9 | 13 |
| Columns | Order, Title, Status, Translations, Actions | same | same | same | same | Order, **Name**, same |
| Title adornment | type chip (DESTINATION, BUILDING, FLOOR, ROOM, SITE, AREA) | exhibit-code chip | setting chip (OUTDOOR/INDOOR) | FEATURED pill on its own line | FEATURED pill inline | scope chip (POI / ROUTE) + icon tile |
| Meta line | slug, date | slug, "in Place", date | slug, mode, stops, min, km, loop?, date | slug, blocks, refs, min read, "featured" (duplicates pill), date | slug, "N dates", "next ...", date | slug, scope, "N points of interest", date |
| Trigger chips | none shown (code: only if triggers exist) | chips, or italic "No trigger, only reachable by browsing" on every row without one | only if triggers exist | only if triggers exist | only if triggers exist | none |
| Hierarchy | indented 18 px per level + "L" glyph; parent rows have no collapse | flat; Place named in meta | flat | flat | flat | 2 levels, indent + "L" |
| Status chip | yes (stacked with Pending chip when present) | same | same | same | same | same |
| Row actions | Activate/Deactivate, Archive | same | same | same | same | **+ SUB**, Activate/Deactivate, Archive (+SUB absent on child rows) |
| Filters in popover | Status(+Pending), Featured, Search in | Status, **Category**, Featured, Search in | Status, Category, Featured, Search in | Status, Featured, Search in | Status, Featured, Search in | Status, **Applies to**, Search in (no Featured) |
| Search placeholder | "Search titles" | "Search titles and exhibit codes" | "Search titles" | "Search titles" | "Search titles" | "Search names and codes" (input is wider; Filters button narrower) |
| Reorder hint text | "Sorted by order · drag or use the arrows" | same | same | same | same | "Tree · drag or use the arrows" |
| Sort / column sort | none | none | none | none | none | none |
| Bulk select/actions | none | none | none | none | none | none |
| Pagination/virtualization | none (all rows) | none; 55 rows = 5,800 px page | none | none | none | none |
| Sticky header/toolbar | no | no | no | no | no | no |
| Empty copy | one sentence + CTA (mocked) | one sentence + CTA (mocked) | sentence + CTA | sentence + CTA | sentence + CTA | sentence + CTA |
| Filtered-empty copy | "No place matches the search or the filters." | "No point of interest matches ..." | "No route ..." | "No guide ..." | "No event ..." | "No category matches the search or the **status filter**." (omits Applies to) |
| Create dialog | 2 numbered steps (Level cards, then Title+Slug) | Title, Place select, Exhibit code, Slug | Setting cards, Title, Slug | Title, Slug | Title, Slug | Name, Applies to, Level, Code (no slug) |
| After create | editor opens, toast | editor opens, toast | editor opens, toast | editor opens, toast | editor opens, toast | editor opens, toast |
| Activate failing readiness | n/a in test (activated) | activated | 422, navigates to editor | 422, navigates to editor | activated with 0 dates | activated |
| axe (wcag2a/aa/21/22aa) | clean | color-contrast x2, target-size x6 | target-size x7 | target-size x7 | target-size x7 | clean |

## Findings

**R1-s9-lists-01** Severity: P1
Lists, all kinds, 1440 · editor/translator, daily upkeep · Evidence: `shots/pois__scrolled-no-sticky-header__1440.png`; steps: open POIs, scroll main to 2500; `thead th` top = -2255 px, search top = -2311 px.
Observation: no sticky header or toolbar; no column sort; no pagination/virtualization; 55-65 rows of 70-150 px each make a 5,800 px page; rows are in `sortOrder` only. The "updated" date is buried in the meta line and cannot be sorted. No "recently edited" view.
Why it hurts: a daily editor who wants the 3 things edited today scrolls ~6 screens; column names and the search box vanish after one screen.
Recommendation: see "Recommended pattern" (sticky header and toolbar, sortable columns Title / Status / Updated / Translations, density that fits 12+ rows on 1440x900, "Recently edited" sort, keep drag/Move only in Manual order).
Files: `src/views/workspace/*/*sView.vue`, new shared `ContentList.vue`. Spec: `12` §3 says sort by sortOrder; extra sorts are additive. Effort: L.

**R1-s9-lists-02** Severity: P1
Lists, all kinds, keyboard · Evidence: `a2.mjs` output; `shots/places__keyboard-focus__1440.png`; Tab from the search: 5 stops per row (Move up, Move down, title link, Activate, Archive; Categories 6 with + SUB); ~330 Tab stops to traverse 55 POIs. Disabled Move buttons at ends are skipped so the sequence changes per row.
Why it hurts: keyboard-only and switch users cross every row's controls to reach row 40; Move up/down occupy stops that a reorder-only user needs, but everyone else must skip them.
Recommendation: one stop per row (the title link), row actions in a kebab/"Actions" menu opened with Enter/Space and reachable by arrow keys; Move up/down live in that menu and in a "Manual order" mode only.
Files: `ReorderControls.vue`, list views. Effort: M.

**R1-s9-lists-03** Severity: P1
Lists · reorder · Evidence: `shots/guides__reorder-after-move-down__1440.png` (PUT mocked via `page.route`, nothing saved); code `ReorderControls.vue`.
Observation: reorder offers drag and Move up/down only. `14` §4 requires "move up, move down, and set position" for every reorder interaction. To bring row 50 of 65 to the top is 49 button presses (each a PUT of every id) or a long drag across a 5,800 px page that cannot autoscroll reliably.
Recommendation: add "Move to position..." (number input or "Move to top / bottom") in the row menu; announce via the existing live region (verified: "Moved ... to position 2 of 9" works and focus returns to the button).
Files: `useReorder.ts`, `ReorderControls.vue`. Spec: `14` §4. Effort: M.

**R1-s9-lists-04** Severity: P1
Lists · bulk work · Evidence: all list shots; no checkbox column anywhere.
Observation: no selection and no bulk actions (activate, deactivate, archive, set Category). Preparing a launch means 40 single clicks, each with a toast.
Recommendation: checkbox column, a contextual bar "3 selected: Activate · Deactivate · Archive · Clear", with one summary result ("2 activated, 1 needs attention: Open") reusing readiness. Archive/deactivate keep the where-used guard per item.
Files: new `ContentList.vue`, `StatusChangeDialog.vue`. Effort: L.

**R1-s9-lists-05** Severity: P1
Lists · 768 · Evidence: `shots/pois__list-default__768.png`, a9 metrics: table 560 px in a 474 px wrapper, `tableScrollX: true` for all six kinds (Categories 620).
Observation: the 236 px left navigation stays permanent at 768, leaving 532 px; the Actions column (Activate/Archive) is clipped and reachable only by a horizontal scroll inside the card; translation dots wrap into three lines; rows grow to 147-207 px.
Why it hurts: tablet on site is a stated use (PRODUCT.md); the primary row action is off-screen without any scroll hint.
Recommendation: collapse the nav to the existing "Menu" button below 1024 (it already does at zoom200 640 px), and below 900 render rows as stacked cards: title + status on line one, translation summary, kebab at right.
Files: `ProjectLayout.vue`, `WorkspaceNav.vue`, list views. Effort: M.

**R1-s9-lists-06** Severity: P1
Row actions · Activate · Evidence: `shots/events__activate-result__1440.png` (event with "0 dates · no dates yet" shows ACTIVE, toast "complete and visible to visitors"); routes/guides: 422 toast then the CMS navigates to the editor (a8 output).
Observation: "Activate" in the list fires immediately with no confirmation and no readiness preview. The outcome differs per kind: Places/POIs/Events/Categories activate; Routes/Guides are refused and the user is yanked off the list, losing scroll, search and filters. An Event with no dates and only English partly filled was activated and the toast claims it is complete.
Why it hurts: the most consequential action (visitors see it) is the easiest to mis-click (100x30 px next to Archive) and gives the least feedback; when refused, the list context is lost.
Recommendation: Activate opens a small popover/dialog with that item's readiness result (blocking items as links, warnings) and "Activate" enabled only if none block; on refusal stay on the list and show items inline with "Open editor". Fix the Event rule (backend question: dates required?) via GAPS.md.
Files: list views `transition()`, `StatusChangeDialog.vue`, `activationHandoff.ts`. Spec: `12` §3 activation refusal; `03` §1. Effort: M.

**R1-s9-lists-07** Severity: P1
Lists · state retention · Evidence: a10 output: after reload filters/search are gone (65 rows); after opening an editor and Back, search value is "" and scrollTop 0; URL never changes (`/pois`).
Why it hurts: "find 20 untranslated POIs, open one, come back" is the core loop; every return resets to the top of 65 rows.
Recommendation: put `q`, `status`, `category`, `featured`, `lang`, `sort` in the query string, restore scroll on Back, remember the last filters per kind per Project (session). Saved filters ("Needs Greek", "Pending changes") as named chips are a cheap add-on.
Files: `workspace/listFilters.ts`, views. Effort: M.

**R1-s9-lists-08** Severity: P2
Row anatomy · misleading ▲▼ · Evidence: `shots/places__list-default__1440.png`: a "▼" sits directly in front of every title and looks like a tree expander; Move up is ▲ greyed at first row. Parent Places have no collapse although the tree is up to 4 levels deep.
Why it hurts: authors click "▼" expecting to collapse children; it reorders instead (Move down). No way to collapse a large tree.
Recommendation: real disclosure triangle for parents (Places, Categories); reorder moves to the menu / drag handle in Manual order; label the handle column "Order".
Files: `ReorderControls.vue`, `PlacesView.vue`, `CategoriesView.vue`. Effort: S-M.

**R1-s9-lists-09** Severity: P2
Status column · Evidence: `pois__list-default__1440.png`: Active + "Pending changes" chip stack in two lines; 3 chips (status, pending, FEATURED, type) compete with the title; rows jump between 65 and 108 px depending on chips and wrapped meta.
Recommendation: one status chip per row ("Active · pending changes" as a single compound chip or an icon-with-text badge after the status), move FEATURED to a star icon with text in the title cell and remove the duplicate lowercase "featured" from the Guides meta line. Fixed two-line row: title + one meta line, truncate with title attribute.
Files: `StatusChip.vue`, views. Effort: S.

**R1-s9-lists-10** Severity: P2
Per-kind drift (see matrix) · Evidence: matrix; `categories__list-default__1440.png` vs `routes__...`.
Observation: Name vs Title heading; search input width differs on Categories (Filters button 9 px wider/narrower); reorder hint says "Tree" on Categories; Categories row has "+ SUB" before the status buttons, shifting Deactivate/Archive horizontally so the buttons do not align between parents and children; filtered-empty copy omits "Applies to"; only the POI list prints "No trigger" per row; meta lines have 4 different grammars; Places has type chip but no environment (INDOOR/OUTDOOR) while Routes show setting.
Recommendation: one shared list component driven by a column config per kind (kind-specific cell slot for chips and meta), identical toolbar, identical empty and filtered-empty copy built from a noun.
Files: six views (about 2,100 duplicated lines). Effort: L (but removes code).

**R1-s9-lists-11** Severity: P2
Filtered-empty · Evidence: `shots/categories__filtered-empty__1440.png`.
Observation: "No category matches the search or the status filter." with no button; the reorder hint beside Filters turns into "Matches · clear the search and filters to reorder", which reads as a fragment; count "0 of 13 categories" is the only way back to the total.
Recommendation: "No results for "zzzqq" in Active Points of Interest. [Clear search] [Clear filters]"; hide the reorder hint when nothing is shown.
Files: list views. Effort: S.

**R1-s9-lists-12** Severity: P2
Empty state · Evidence: `shots/routes__empty-B__1440.png`, `places__empty-mocked__1440.png`.
Observation: empty list still renders search, Filters and "Sorted by order · drag or use the arrows to reorder" (nothing to sort); two identical "NEW ROUTE" buttons within 250 px; the footer says "0 routes". Routes/Guides empty copy does not say they need POIs first (a Route without POIs cannot be activated; see Routes 422 above). Empty B Places/POIs were already populated by another agent (`UX-s8-dashboard` rows), so I mocked the empty response for those two.
Recommendation: empty state hides toolbar/hint, one primary CTA, a second sentence with the prerequisite and a link ("Create points of interest first").
Files: views. Effort: S.

**R1-s9-lists-13** Severity: P2
Filters popover · Evidence: `shots/pois__filters-open__1440.png`.
Observation: status, the most used filter, is behind a button; the popover covers the table and the Actions column; Pending changes is a "status" radio so it cannot be combined with ACTIVE; "Search in language" sits in filters rather than next to the search box; Done and Clear filters duplicate the chips' Clear all.
Recommendation: status as a visible segmented control with counts under the toolbar (All 65 · Active 40 · Draft · Archived · Pending 9 · Needs translation), Category as a visible select for kinds that have it; the popover only for Featured and search language. Archived hidden from "All" by default (see 15).
Files: `ListFilterMenu.vue`, `FilterChoiceGroup.vue`, `listFilters.ts`. Spec: `12` §3 filters stay. Effort: M.

**R1-s9-lists-14** Severity: P2
Offline · Evidence: `shots/pois__offline__1440.png`.
Observation: with the banner "Saving and other changes are disabled", row Deactivate/Archive buttons and New POI stay enabled and open a confirm whose own message says it cannot check usage.
Recommendation: disable mutating controls (with `aria-disabled` and a tooltip "Offline") when `navigator.onLine` is false, as the banner promises.
Files: list views, `OfflineBanner`/network store. Effort: S.

**R1-s9-lists-15** Severity: P2
Archive copy and ARCHIVED visibility · Evidence: `shots/events__archived-row__1440.png`; a8 dialog text.
Observation: the confirm promises "An archived event leaves the visitor app and the default lists", but the archived row stays in the default (All) list, in place, dimmed; the same text is shown when archiving a DRAFT that visitors never saw; Restore is one click with no feedback beyond a toast. `03` §1 lets a DRAFT go to ARCHIVED.
Recommendation: hide ARCHIVED from "All" (an "Archived" segment shows them), and use draft-specific copy "Archive this draft? It stays available under Archived."
Files: views, `listFilters.ts`. Effort: S.

**R1-s9-lists-16** Severity: P2
Targets and contrast · Evidence: a11 axe (WCAG 2.2 AA tags): `target-size` on the Move-down button x6-7 per list (obscured to 20.7x24 px by the adjacent button), `color-contrast` 3.03:1 on the draft trigger chip text (#878d97 on #f4f4f5, 9 px bold); Archive text button measured 52x16, "+ SUB" 34x16, Move buttons 24x24, drag handle 19x15. Brief gates on 2.1 AA, so P2, but touch use at 768/1024 is a stated context.
Recommendation: 32 px minimum row-control height (44 px on touch), contrast token for draft chips, 11 px minimum chip text.
Files: `TriggerChips.vue`, `ReorderControls.vue`. Effort: S.

**R1-s9-lists-17** Severity: P2
Translation dots · Evidence: `pois__list-default__1440.png`.
Observation: "✓ en ✓ el ◐ it" at 10-11 px with no legend; the three states are glyph + lowercase code, but a translator cannot tell what "partly" means (which field) and cannot click to fix; at 768 they stack vertically one per line (row height +40 px).
Recommendation: a compact "2 of 3 languages" meter with per-language chips that are links to `editor?lang=it`, a legend in the table header tooltip, and a "Needs translation" filter. Keep text+glyph.
Files: `TranslationDots.vue`. Effort: S-M.

**R1-s9-lists-18** Severity: P2
Create dialogs · Evidence: `shots/places__create-empty-submit__1440.png`, `routes__create-empty-submit__1440.png`, `pois__create-empty-submit__1440.png`, `*__create-valid-filled__1440.png`, `*__after-create__1440.png`.
Observations: (a) Places is a numbered 2-step flow (card choice, then title/slug) and Routes a card choice first, while others are a plain form: choose one dialog shape; (b) empty submit shows a slug error ("Use lowercase Latin letters...") on a field the user never touched, because the slug derives from the title; (c) no summary at the top of the dialog for POIs/Routes/Guides/Events/Categories (`14` §4 asks for a summary with links; Places has a one-line banner without a link); (d) focus on open: first card button (Places, Routes) vs title input (others); (e) after create all six open the editor with a toast and focus lands on `body` (Skip link), not on the editor heading; the earlier-persona note that POIs differ was not reproduced; (f) POI dialog creates with no Category although Category is the main filter; the Place select lists 14 entries as indented plain text; (g) Categories dialog has Code but no slug, others have Slug; (h) Esc closes and returns focus to the "New ..." button (verified, good). Greek title "Ακρόπολη Ελληνικός τίτλος" derives slug `akropoli-ellinikos-titlos` (good) and a 110-char title is accepted with a 110-char slug.
Recommendation: one dialog: Title (+ the single kind-specific choice as a segmented control), slug under "Edit address" disclosure, error summary at top, "Create and open" / "Create and add another" buttons, focus the editor `h1` after create.
Files: six `Create*Dialog.vue`, `AppDialog.vue`. Effort: M.

**R1-s9-lists-19** Severity: P2
Zoom 200 % · Evidence: `shots/pois__list-default__zoom200.png`.
Observation: at 640x360 CSS the header, project switcher and "Menu" bar consume 313 px; page head and toolbar consume the rest; no row is visible without scrolling; the toolbar wraps the hint onto its own line.
Recommendation: make the app header non-sticky or collapse the project switcher into the Menu below 700 px; hide the reorder hint at that size.
Files: `AppHeader.vue`, `ProjectLayout.vue`. Effort: S-M.

**R1-s9-lists-20** Severity: P2
Categories at 1024 · Evidence: `shots/categories__list-default__1024.png`.
Observation: names truncate with an ellipsis ("Monuments and Tem...", "Pottery and Everyday...") while the slug line wraps freely; Archive wraps below Deactivate on parent rows only; the "L" connector glyph is drawn at a different offset from the indent of the icon tile.
Recommendation: wrap names (2 lines) rather than truncate; actions in a menu removes the wrap.
Files: `CategoriesView.vue`. Effort: S.

**R1-s9-lists-21** Severity: P3
Error state · Evidence: `shots/pois__error-503__1440.png`, a7: 503/504 "The UNICHE platform is not reachable", other codes "The {kind} could not be loaded", request id shown, `role=alert`, Try again works. 500 shows no detail line. "New POINT OF INTEREST" stays enabled over a dead list; focus is not moved to the alert; the card is 640 px wide while the list card is full width. Also 401 mid-session redirects through the IdP (fine).
Recommendation: disable New while the list failed, move focus to the alert heading, show the generic detail for 5xx.
Effort: S.

**R1-s9-lists-22** Severity: P3
Search · Evidence: a10: accent-insensitive Greek works (`ακροπολη` finds 3), code `103` matches, trigger code `FRIEZE-101` shown on the row does not match `101`; search is local and instantaneous; placeholder on Places/Routes/Guides/Events does not say slug is searched too (code searches slug).
Recommendation: search placeholder "Search title, slug or code"; include trigger codes.
Effort: S.

**R1-s9-lists-23** Severity: P3
Row click · Evidence: a11: clicking the status cell does not navigate; only the 20 px-high title link opens the editor; focus ring on the link is a tight purple box (visible, good).
Recommendation: whole row opens the editor (title link stays the keyboard anchor via a stretched link), hover and pressed states.
Effort: S.

**R1-s9-lists-24** Severity: P3
Toasts and hints · Evidence: `shots/events__activate-result__1440.png`: toast bottom-right sits over the list footer and, after create, over the editor's "Used in" card; "Sorted by order · drag or use the arrows to reorder" repeated 6 times is static text that never changes meaning; "Move X up" labels are good but the visible glyphs are text arrows.
Recommendation: toasts above content with an Undo for Archive/Deactivate.
Effort: S.

## Recommended list pattern (one, for all six kinds)

A single `ContentTable` driven by per-kind column config:
1. Page head with one primary "New {kind}" button; empty state replaces the whole card when the kind has no rows.
2. Sticky toolbar (search with a clear button, visible status segments with counts incl. Pending and Needs translation, Category select where it applies, "More filters" popover for Featured and search language, active filter chips, "Save this view"). Query string carries every filter; Back restores scroll.
3. Sticky column header, sortable: Title (A-Z), Status, Updated (default for "Recently edited" view), Translations, Manual order (the only sort that shows drag handle and Move controls). Columns: checkbox, Title (+slug and kind meta on one muted line), Status (single chip), Translations (meter + per-language links), Triggers (icon count with tooltip; "No trigger" only as an empty-state hint in the POI column header, not per row), Updated, row menu.
4. Selection bar for bulk Activate / Deactivate / Archive / Set Category with one result summary.
5. Row menu (kebab) with Activate/Deactivate, Archive/Restore, Move up, Move down, Move to position..., Open in new tab. Whole row opens the editor. One Tab stop per row.
6. Trees (Places, Categories): disclosure triangles, collapsed by default beyond 2 levels, indentation 24 px, and parents show "N inside".
7. Under 900 px the rows render as cards; the nav collapses to Menu under 1024.
8. Virtualize or paginate (50 per page, "Load more") above 50 rows; keep the footer count.

## What works (keep these)
- Status, pending and translation state are text plus glyph, never colour alone (`StatusChip`, `TranslationDots`); screen-reader labels per language.
- Reorder live region ("Moved ... to position 2 of 9") and focus return to the moved row's button work (a11 run, PUT mocked).
- Filter chips beside the Filters button show every active filter and the count badge; Esc closes the popover and returns focus (verified).
- Accent-insensitive search works for Greek; slug derives from Greek titles.
- Create dialogs: labelled fields, field-level `⚠` errors with `aria-invalid`, Esc closes and returns focus to the New button, drafts open straight in the editor with a clear next step in the toast and dialog copy.
- Error card shows platform wording and `requestId` with a Try again action; empty states explain the kind in one sentence.
- Confirm dialogs name the item and load where-used before Deactivate/Archive; row button label changes with state (Activate/Deactivate/Restore).

## Unverified / could not test
- Loading skeleton: my delayed-response route did not hold the request long enough to capture it (`a7.mjs`); judged from source only (4 grey bars, no toolbar skeleton).
- Trigger chips on Places/Routes/Guides/Events: no triggers exist on those seeded rows, so chip rendering there is from code and D-018 only.
- Drag-and-drop with a real pointer and persisted reorder: not exercised so as not to change pre-existing sortOrder; only the keyboard path with a mocked `PUT :order`.
- `RESOURCE_IN_USE` blocked Deactivate/Archive from the list (needs referenced ACTIVE items that I may not alter).
- Pagination is absent (no paging UI exists), so "pagination with 44+ rows" was only measured as scroll length; I did not time rendering.
- Windows-only forced-colors and touch were not run for lists.
- My six `UX-s9-lists ...` records were activated/archived by me in the row-action test; the Routes and Guides ones stayed DRAFT before being archived.
