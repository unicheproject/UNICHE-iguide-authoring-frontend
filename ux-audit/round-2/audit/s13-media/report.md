# s13-media — Round 2

Impeccable loaded, Operate mode, interview skipped (subagent). Rules cited: critique.md "Hard Invariants" (browser evidence required for viewable targets), audit.md "Keyboard navigation / Missing ARIA", operate.md "Every interactive component has default, hover, focus, active, disabled, loading, error".

## Verdict
Media is clearly better than round 1 (sort with direction, Needs-attention filters, counts, formats/limits table, held rows, duplicate detection, log, Describe now, Translations tabs, sticky preview at >=1280), but two reported defects are still there (list-view overprint, upload initial focus on the hidden input) and the redesign added a new WCAG 2.5.3 label mismatch and several focus-drop paths. Score range 64-72 (open P1s cap at 85; sum of states lower). Coverage: first pass with `curator` was cut short when that account lost Catalogue access (Projects were never deleted); re-run with `admin` completed library at 1280/1024/768/zoom200, Empty D, 503, forced-colors, picker from the POI editor (1440/768/zoom200), Replace, activation refusal, Show more, upload cancel. Guide-editor picker and a true slow-network loading skeleton were not captured.

## Context check
12 §3 lists Media as a top-level item with library and picker endpoints; 14 §4: uploads announce progress and completion through a live region; 03 §1: ACTIVE edited via Working Copy; DECISIONS D-080 (library pattern, held uploads, Describe now); PRODUCT.md: translator needs to find untranslated work and see default text beside the target.

## Scores
| State | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp/state 10 | Total |
|---|---|---|---|---|---|---|---|
| Library grid 1440 | 20 | 16 | 11 | 11 | 12 | 6 | 76 |
| Library list 1440 | 15 | 10 | 10 | 10 | 11 | 5 | 61 |
| Filters / empty-filtered | 17 | 13 | 9 | 11 | 10 | 6 | 66 |
| Upload dialog | 18 | 13 | 11 | 12 | 8 | 7 | 69 |
| Describe now | 21 | 15 | 12 | 13 | 12 | 6 | 79 |
| Asset editor 1440/1280 | 20 | 16 | 12 | 11 | 12 | 6 | 77 |
| Asset editor 1024/768/zoom200 | 16 | 12 | 11 | 11 | 11 | 6 | 67 |
Picker 68 (focus loss, no roving, zoom200). Empty D 84. 503 error 78. Editor activation 66 (R2-s13-16).
Nielsen (0-4): visibility 3, match 3, control 2, consistency 2, error prevention 3, recognition 3, flexibility 2, minimalism 2, error recovery 3, help 3 (26/40).

## Findings
**R2-s13-01 P1 — List view: "No alt text" chip overprints "Used in"; the "Needs attention" column is 0 px wide at 1280 and 1024.** At 1280 the cell collapses to a vertical "N/o/n/e" and chips run over "Unused" (`library__list-forced-colors__1280.png`, also normal colours); at 1440 it is 76 px (`library__list-default__1440.png`). At 768 and zoom200 the list becomes stacked rows and is fine (`library__list-default__768.png`). Library, list, 1440x900 (`shots/library__list-default__1440.png`). "Needs attention" column is 76 px wide (header wraps to two lines), chip text runs under "Unused". Same for every row. Task: find what needs describing. Rec: give the column a min width (about 9rem) or merge chips into the Status cell and wrap; drop `w-` fixed widths on Name. Files: `MediaView.vue` (columns ~l.234-240, cells ~l.353). C1 reported; not fixed.

**R2-s13-02 P1 — Upload dialog opens with focus on the hidden file input** (`input "Files to upload"`, sr-only, tabindex -1). No visible focus; screen reader announces an unnamed-looking file chooser. Steps: Media > Upload files; `document.activeElement`. Rec: focus the dialog heading or "Choose files". Files: `UploadDialog.vue` (the input has `aria-label`, AppDialog autofocuses first focusable). Spec 14 §4 (focus management).

**R2-s13-03 P1 — "Upload anyway" buttons fail WCAG 2.5.3 (label in name).** axe serious `label-content-name-mismatch` x4 in upload dialog with held rows. Visible "Upload anyway", accessible name "Upload UX-R2-s13 tool.exe anyway". Voice-control users cannot say what they see. Rec: aria-label "Upload anyway, tool.exe" (visible text first) or `aria-describedby` with the file name. Files: `UploadEntryRow.vue`. Skip is fine ("Skip UX-... " begins with the visible word).

**R2-s13-04 P2 — Focus drops to body** after: Skip, Upload anyway (row buttons vanish), "Clear filters" (all three), and after Describe now closes it returns to "Describe now (1)" (fine). Steps: hold a .txt, press Skip with Enter, `activeElement` = body. Rec: move focus to the next row's first button or the row itself, and to the search field after Clear filters.

**R2-s13-05 P2 — "Clear filters" three times and chips twice** in a filtered-empty library (toolbar, empty-state panel, footer; chips in empty state and footer) (`library__filtered-empty__1440.png`). Rec: empty state keeps only the message plus one button; footer chips hidden when empty.

**R2-s13-06 P2 — "Needs translation" defaults to the default language** ("Needs translation in English", `?missing=en`, 46 files) — the source language can never need translating in the translator's sense; label of the language select is just "in" (accessible name "in"). The row never says which language is missing (per-row translation state still absent in grid and list). Rec: default to the first non-default language, label "Needs translation in", add a tiny language-dot cluster per tile/row.

**R2-s13-07 P2 — Library vs editor "Used in" still disagree** (library 8, editor 7 for frieze-detail and erechtheion-caryatids; 9 vs 9 for peplos-kore). The editor now explains it ("the library counts 8; it leaves out images inside Guide text") but the library number is the one used for sort and chip. Backend G-030. Rec: label the tile "Used in 8" with tooltip, or sort by the references count when known.

**R2-s13-08 P2 — Asset editor at 1024 and below: alt field below the fold.** 1024x768: alt top y=770 (viewport 768), order is readiness accordion (labelled just "Active"), preview (215 px), Decorative, tabs, then the field. 768 y=842, zoom200 y=673 of 304 px. Preview does stay sticky at 144 px but at zoom200 it covers about 45 % of the viewport and hides the label/hint of "Alternative text" while scrolled (`asset-editor__scrolled__zoom200.png`). Rec: below 1100 px put the preview beside nothing but cap it at 25 vh (or collapse to a thumbnail row), and move Decorative into the alt-text card.

**R2-s13-09 P2 — Upload dialog density.** Formats/limits table plus notes plus row list plus a duplicate "Activity" log repeating each row's message gives three scroll areas in a 1440x900 dialog (`upload__mixed-batch__1440.png`); log text clipped at its bottom edge. Empty-state primary button is "Done" (nothing done yet); "Skipped" rows show "Retry". Rec: collapse the table behind "Accepted formats" once files are added; make the log sr-only (it already is in the picker); rename Done to Close, Skipped row to "Undo skip".

**R2-s13-10 P2 — 503 on upload reads "The UNICHE platform is not reachable"** (C1-66 diagnosis problem remains); request id is shown (good). Rec: "The server is busy (503). Try again."; keep "not reachable" for network failures.

**R2-s13-11 P3 — Editor: "More texts: All filled" while Caption is empty** (frieze-detail; Credits is the only field in the group). Tab says "3 of 4". Duplicate visible lines "Used by 7 items..." and "Nothing: visitors see a complete asset." appear twice in innerText (visible plus tooltip/sr?). Rec: rename group summary "Credits: filled".

**R2-s13-12 P3 — Grid/List not in the URL** (remembered per browser: reload keeps List, `?view=` absent), and `?dir=desc` is appended to a default load. Count line "Showing 48 of 78 files (79 in the library)" is accurate but the 78/79 gap (one archived) is unexplained. Rec: `view=list` in URL; "(1 archived)" wording.

**R2-s13-13 P3 — Layout jump:** ticking "Needs translation" inserts "in [language]" and moves the Grid/List buttons and "Clear filters" (`library__filtered-empty__1440.png`). Rec: reserve the space.

**R2-s13-14 P3 — Header chip of the Project switcher renders empty** (grey pill, no text) on the library at first paint while the editor shows "App: Draft" (`library__grid-default__1440.png`). Shell, out of my remit, noted.

**R2-s13-15 P3 — axe moderate in dialogs:** `landmark-no-duplicate-banner`, `landmark-unique` while an upload/Describe dialog is open (header landmark duplicated by the dialog layer).

## Round-1 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C1-107 alt field above the fold + sticky preview | partly | 1440/1280 yes (alt y 447-464, aside sticky); 1024/768/zoom200 alt at y 770/842/673, R2-s13-08 |
| C1-108 sort + Needs attention filters | fixed | sort 5 keys with direction, 3 filters + Needs translation; chip counts equal tile counts (27 of 27) |
| C1-109 Used in disagrees | partly | still 8 vs 7; editor now states why |
| C1-110 Describe now, close X | fixed | 3-step walk incl. decorative path, Save disabled with reason, X present |
| C1-111 thumbnails/type chips | fixed | uncropped thumbs, readable type text (list and grid shots) |
| C1-112 paging focus | fixed | "Show 37 more" moves focus to first new tile, range announced |
| C1-113 formats, held types, Retry only if useful | fixed | table of formats, .txt/.exe held, huge.png "Retrying cannot help", 503 offers Retry, requestId shown |
| C1-114 log | fixed | role=log kept 7 ordered messages with summary |
| C1-115 duplicates | fixed | "looks like a copy of ... Open it" held row |
| C1-116 editor details | partly | decorative moved above tabs, checksum disclosure, filename/size shown; wrong-type Replace not tested |
| C1-117 picker | partly | Search focus, Active default, list mode, two-line names, attach announced: fixed; tile roving absent, focus after Use drops to body, zoom200 cramped (R2-s13-17/18/19) |
| C1-118 list min-width | partly | 768/zoom200 stack cleanly; picker 328 px at zoom200 still cramped; 1280/1024 list columns collide (R2-s13-01) |
| C1-34/35 (Asset) Translations card | fixed | tabs English default / Ελληνικά 3 of 4 / Italiano Missing; per-row state still missing (R2-s13-06) |
Counts: fixed 8, partly 5 (C1-107, 109, 116, 117, 118), not fixed 0, regressed 0, not verified 0.


## Addendum findings (admin re-run)

**R2-s13-16 P1 — "Before you activate" contradicts the library for a DRAFT image without alt text.** zeta (DRAFT, no alt): library tile says "No alt text", editor side card says "Nothing is known to be missing. The platform checks everything when you activate", the confirm dialog repeats it, and only after pressing Activate does the platform refusal appear ("Alternative text (English): Is required ..." with request id, shown in the dialog and as a banner behind it). The CMS already knows alt text is missing (it draws the chip). Rec: compute the alt-text blocker client-side in "Before you activate", link it to the field, and disable Activate with the reason; keep the platform message as backstop. Files: `AssetEditorView.vue`, `StatusChangeDialog.vue`. (Filter vs editor disagree: still true.)

**R2-s13-17 P1 — Picker: focus drops to body after "Use this image"** (1440, keyboard Enter on Use this image; dialog closes, `activeElement` is body; "X attached." is announced, good). The opener button has been replaced by the image, so focus has nowhere to return. Rec: focus the new image's Replace/Change button. Same pattern as R2-s13-04.

**R2-s13-18 P2 — Picker tiles: no arrow-key roving.** Each of up to 48 tiles is its own Tab stop, 9 Tabs to reach the first (search, Tiles, List, Filters, Active, Draft, Any status, hidden file input, Upload new); Arrow keys do nothing. Rec: one Tab stop for the grid with arrow/Home/End roving (APG listbox grid); remove the unnamed focusable `input` before "Upload new".

**R2-s13-19 P2 — Picker at zoom200 is mostly chrome:** dialog 328 of 360 px, header + search + Tiles/List + Filters disclosure + footer leave about 100 px for one row of tiles (`picker__open__zoom200.png`). Search focus on open is right (all viewports). Tiles show no "No alt text" cue (only List mode does, and the status line after selecting). Rec: sticky footer only on short viewports, move view toggle into the Filters disclosure, add the chip to tiles.

**R2-s13-20 P2 — Sticky editor header + Working Copy banner cover the controls at zoom200** (POI editor): "Add primary image" could not be clicked by a real pointer after scroll-into-view because the sticky bars cover it (Playwright reported the h1 and banner intercepting). Shell, but it blocks the picker task at 200 %. Rec: collapse banner to one line below 700 px height or make it non-sticky.

**R2-s13-21 P3 — Empty library keeps the whole toolbar** (search, status counts all 0, Needs attention, Grid/List) above "No files yet" (`library__empty-D__1440.png`); the empty state itself is good (explains, one primary Upload). Rec: hide the toolbar when the library has zero files.

**R2-s13-22 P3 — 503 on library shows the server `detail` verbatim** ("Server detail text.") under "The UNICHE platform is not reachable" with Try again and request id (`library__error-503__1440.png`); title mis-diagnoses a 503. Upload stays enabled during the error.

**R2-s13-23 P3 — Decorative confirm and Skip/Retry:** ticking Decorative opens a confirm dialog ("a primary image of an exhibit is never decorative", good copy, focus on dialog); but the editor's Decorative effect on the alt field is only visible after the dialog. Skipped upload rows offer "Retry" (should be "Undo skip").

## Addendum: verified OK (keep)
Show more: "Show 37 more" focuses the first new tile and announces "Showing 49 to 85 of 85 files". Replace on DRAFT works with toast "File replaced ... texts unchanged" and explains the same-type rule; on ACTIVE it is disabled with the reason. Italian tab says "Translating from English into Italiano. The source text is beside each field" with Copy source. Per-file Cancel in upload ("Cancel <file>") and the picker's in-flight 0 % row work. Picker defaults to Active ("41 draft hidden", Show any status), opens with focus on Search at 1440/768/zoom200, Esc closes and returns to the opener (1440/768), list mode shows "No alt text" per row, draft images selectable with the alt cue in the status line. Empty D: clear "No files yet" state, axe clean. axe clean on 503 and empty.

## What works
Formats and limits stated up front; duplicate and odd-type holds with "Open it"; failed-too-big row says retry cannot help; Describe now keeps keyboard flow (focus into textarea, Save and next keeps focus); sort changes reset natural direction; filter chips count equals the line; sticky preview at 1280/1440; axe clean on library grid/list, filters, asset editor.

## Unverified / could not test
Guide-editor picker (POI editor used; same dialog); loading skeleton (route delay did not show one, data came from cache); real screen reader; touch. Created records: UX-R2-s13 alpha/beta/gamma/delta/epsilon/zeta(theta.jpg)/tool.exe in Populated (zeta replaced, left DRAFT; a Working Copy of the POI was opened and never saved). Scripts a1-a11, b1, c1-c7 in this folder; shots in `shots/`.
