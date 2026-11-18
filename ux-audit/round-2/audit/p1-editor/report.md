# p1-editor — Round 2
(Saved by the orchestrator from the agent's returned report, lightly condensed: its Write call was refused. ~100 shots and scripts a1–a37.mjs in this folder.)

Persona: daily editor / power user (`curator`, Populated). Remit: six lists and editors, Media library and picker, keyboard flow. 1440/1280 primary; 1024, 768, zoom200 spot-checked. Interview steps skipped (subagent).

## Verdict
Large step up. Lists: 2 tab stops per row, Move to position/top/bottom, drag, URL-held filters surviving Back and reload. Editor keeps Save/Apply/Discard on screen, Ctrl+S works in fields, activation confirm lists what is left. The "find it again" jobs still fail: Dashboard "Waiting for you to apply" omits the item just saved; "Sort by Updated" is oldest first with no flip; a POI cannot be deactivated because its own triggers count as "used by". Media list view overprints columns. 409 dialog offers only "Reload". P0 0, P1 6, P2 11, P3 2. C1 verified (40 rows): fixed 17, partly 17, not fixed 3, regressed 1.

## Context check
12 §2 content editor; 14 §4 reorder alternatives (lists now meet it); 03 §1 deactivate/archive discards the working copy (observed); D-076 verified as built; D-074/D-075 built (see -06); PRODUCT.md 40+ items per list. Impeccable: critique.md browser inspection; audit.md keyboard; operate.md inconsistent component vocabulary (-11, -14).

## Jobs walked
1. Created 3 POIs (`UX-R2-p1-editor Amphora Room`, `… Kore Corridor`, `… Στοά Θέατρο Long Greek Title Αρχαίο`) with image, audio, Category, Place, map, QR, Geo. Create dialog invalid submit: summary link, field error, focus. Create→editor 5.0 s. Picker opens on Search, Active only, "5 draft hidden", announces attach. Activation confirms worked from editor and list row.
2. Pending changes: Ctrl+S in textarea and Save draft keep focus; leave guard; found via list `?pending=1`, not on Dashboard (-02); Apply 98 ms; Discard confirm "cannot be undone", no "discarded" message.
3. URL state: status, category, sort, language, query in URL; Back and reload restore controls, rows and scroll.
4. Reorder own rows: top, position 60, bottom, drag (announced); focus returns to ⋮; filtered users told "Clear filters to reorder".
5. Media: Audio filter, search, No alt text / Unused / Decorative, filtered-empty; upload 418 ms with per-file status and Activity log.
6. Keyboard: 8 Tabs to Routes; Enter lands on h1, title updates; 12 stops to first row; no shortcuts.

## Scores (T25/H20/C15/Co15/A15/R10)
| Screen | Total |
|---|---|
| Lists, six kinds (1440/1280) | 77 |
| Lists at 1024/768 (cards) | 74 |
| Editors, six kinds (1440/1280) | 73 |
| Editors at 1024 / zoom200 | 62 |
| Media library (grid) | 77 |
| Media library (list view) | 64 |
| Asset picker | 83 |
| Activation / Apply / Discard dialogs | 71 |
| Keyboard flow between kinds | 69 |
Nielsen 27/40 (3,3,3,2,3,3,2,3,2,3). axe clean on POI list, POI editor, POI create, Media grid, Media list.

## Findings
- **R2-p1-editor-01 P1 "Sort by Updated" oldest first, no flip, in five of six lists.** shots/pois-list__sort-updated__1440.png; only hand-typed `&dir=desc` reverses; Places/Categories offer only "Manual order (tree)"; Media has a direction toggle. Fix: shared sort control with direction; Updated newest first; sort options on Places/Categories. Files: SortSelect.vue, useListQuery.ts. S.
- **R2-p1-editor-02 P1 Dashboard "Waiting for you to apply" omits the item just saved.** shots/dashboard__waiting-to-apply__1440.png: "15 items…" lists 10 (first 13 Nov 10:02), "Show 3 more", "2 more not listed"; the just-saved item unlisted. Cause: `GET …?pending=true&size=10` per kind in manual order, merged client-side. Heading says "most recently saved first". Fix: fetch sorted by save time or all pages; "View all". 12 §3. M.
- **R2-p1-editor-03 P1 Own triggers make a POI "used", so it cannot be deactivated.** shots/poi-editor__activated__1440.png: "Used by 2 items. Remove it from them first." with "Used in (2): QR code … · Trigger, Geo-proximity 30 m · Trigger"; sentence printed twice. C1-11 unchanged. Fix: exclude own triggers; link real blockers. Files: useResourceEditor.ts where-used. 03 §1. S–M (possibly backend).
- **R2-p1-editor-04 P1 Media list view: "Needs attention" column 0 px wide, overprints "Used in"** at 1440/1280/1024 (shots/media__list-view__*.png). Fix: min width or merge cells. S.
- **R2-p1-editor-05 P1 409 dialog offers one button, promises two, no request id.** shots/poi-editor__save-409__1440.png: "…or keep your changes and save them over theirs." but only "Reload their version"; stray space "editing ."; no request id. Fix: "Keep my changes", per-field mine/current, request id. M. (Mock had no "current" payload.)
- **R2-p1-editor-06 P1 At 200 % zoom sticky editor chrome takes 60 % of the viewport** (shots/poi-editor__active-dirty__zoom200.png: 215 of 360 px; 177 of 720 at 1280×720). Fix: un-stick banner at small heights/zoom. 14 §4. S–M.
- **R2-p1-editor-07 P2 One readiness state, four numbers, two wordings** (confirm "3 things", toast "7 warnings", header "5 warnings", card "5 things"; list-row confirm "partly translated" vs editor "3 texts missing"). Fix: one readiness object, one sentence template. M.
- **R2-p1-editor-08 P2 List-row activation confirm shows warnings but no way to fix them** (shots/pois-list__row-activate-confirm__1440.png). Fix: "Review in editor". S.
- **R2-p1-editor-09 P2 Contradictory stacked toasts and odd announcements** ("Saved — Draft saved. Visitors do not see it…" above "Activated", covering readiness; "Saved 03:41 PM" 12 h; live region "Nothing: visitors see a complete point of interest."; Discard not announced; row activation toast lacks warning count). S.
- **R2-p1-editor-10 P2 Focus drops to body after attaching a file and after Activate.** Fix: focus new file row's Clear button; Status heading after activation. 14 §4. S.
- **R2-p1-editor-11 P2 Apply primary while edits are unsaved; confirm says nothing about what changes; cancel wording differs** (shots/poi-editor__apply-while-dirty__1440.png). Fix: list changed fields; "Save and apply" when dirty; one cancel wording. S–M.
- **R2-p1-editor-12 P2 Audio narration hard to find** — "Choose audio narration" rows sit under the collapsed "Practical details" header (shots/poi-editor__audio-attached__1440.png). Fix: visible "Audio narration" block or buttons in the Media card. M.
- **R2-p1-editor-13 P2 Slow interactions (dev server):** new POI save = 8 sequential requests, 1.58–1.71 s (was 2.5–3.1 s); create→editor 4.99 s; Save and activate 2.06 s; POI list cold 4.7 s. Fix: parallelise trigger and asset writes. M.
- **R2-p1-editor-14 P2 Residual drift across lists and editors:** Places no sortable headers, others 2–3; sort options differ; row heights 77–130 px (82 POIs ≈ 8,600 px, no paging); Category "Applies to *" vs "(required)"; "Texts" heading only on POI/Place; Category side column (2,307 px) taller than form ("Used in (16)" flat); Guide form 9,784 px. Fix: one sort component, collapse "Used in" after 5, one required marker. M.
- **R2-p1-editor-15 P2 Sticky list toolbar tall** (260 of 900 px; 283 of 720) with a 25 px sliver of the row above (shots/pois-list__after-back-scrolled__1440.png). Fix: stick only header and a one-line toolbar; fix offset. S.
- **R2-p1-editor-16 P2 Moving between kinds is Tab-only** (8 Tabs to Routes, 12 to first row; no `/` for search, no jump keys). M.
- **R2-p1-editor-17 P2 Media details:** upload dialog focuses the hidden file input; Grid/List not in URL; "Showing 48 of 61 files (62 in the library)"; "Clear filters" ×3 on filtered-empty POI list, ×2 on Media. S.
- **R2-p1-editor-18 P3 Forced 422 with `summary.en` gives no field link** (mock; re-test with a real 422).
- **R2-p1-editor-19 P3** Switcher chip empty grey pill for seconds after reorders/uploads/loads; "Version 0" on unsaved POI, version jumps 1→3; Latitude/Longitude placeholders look like values; Place and Category native selects with 25+ options; at 1024 readiness/Translations/Used in ~2,550 px down.

## Round-1 fixes verified
fixed: C1-15, 17, 18, 19, 22, 25, 30, 31, 33, 34, 35, 36, 37, 38, 76, 80 (limited), 108, 113, 114, 117, 119, 120 · partly: C1-10, 12, 13, 14, 20, 21, 23, 24, 26, 29, 32, 39, 77, 110, 112, 121, 125 · not fixed: C1-11, 16 (deferred), 122 · regressed: C1-111 (list view overprints). Counts as reported: fixed 17, partly 17, not fixed 3, regressed 1.

## What works
Reorder in every form with announcements; URL list state; confirms name consequences; "Save and activate"; 422/503 show request id and keep the form; "Still saving…"; offline disables Save with reason; restore after reload; picker; upload dialog; language tabs with completeness and source beside target.

## Unverified
Real 409/422 bodies, real expired session; archived-record editor, INDOOR placement, Guide heading buttons, Route/Event/Category specifics, asset editor, picker at 768/zoom200, target sizes, filter-result announcements, forced colours, reduced motion, touch. Records left: three ACTIVE `UX-R2-p1-editor …` POIs (two cannot be deactivated), Media `UX-R2-p1-editor tone.wav`.
