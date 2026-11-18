# p1-editor — Round 3

Persona: daily editor and power user, account `admin`, Project `UX Audit – Populated`. 1440 and 1280 primarily; 1024, 768 and zoom200 spot checks.

Own records:
- `UX-R3-p1-editor Alpha POI` (ACTIVE, applied)
- `… Beta POI` (ACTIVE)
- `… Γάμμα POI – … (עברית ערבית)` (ACTIVE, long Greek and RTL title)
- asset `UX-R3-p1-editor-tone.wav`

Nothing pre-existing was saved, applied, deleted or archived. Moves were on own records only, and Beta and Gamma are restored to the end of manual order. Impeccable interview steps were skipped (subagent).

## Verdict
The editor workflow is fast and honest.
- Create, save, activate, working copy, apply, URL-held filters and Back restoring row focus all pass.
- Save takes about 0.45 s plain and 1.5 s with QR and geo triggers.
- Three problems remain:
  - Moving rows is silent: no visible confirmation, no Undo, and focus falls to `<body>`.
  - Discard also drops focus to `<body>`.
  - "Next missing" lands on a filled field.
- Row anatomy still overprints with 3 or more trigger chips, and the Routes and Places title columns collapse at 1280 and 1024.
- Not shippable unchanged: 3 P1.

## Context check
- `12-cms-experience`: switching Project opens the Dashboard at once with an opaque loading skeleton. Confirmed: the Dashboard was ready in 2.5 s.
- `14` §4: every function is keyboard operable, and reorder has non-drag alternatives. The row menu has Move up/down/position/top/bottom. The drag handle is a non-focusable span.
- `03` §1: an ACTIVE Resource is edited through one working copy, and deactivate or archive discards it. The Apply/Discard flow matches.
- DECISIONS.md D-095: when dirty, Save draft is primary and "Save and apply" secondary. When clean, Apply is disabled with a reason. Verified below.
- PRODUCT.md: "a daily editor who can maintain 40+ items per list quickly and confidently".
- impeccable rules cited:
  - critique.md: Assessment B, browser evidence, is required. Everything was measured with DOM rects.
  - audit.md: "Keyboard navigation: missing focus indicators, illogical tab order" (findings 01, 03).
  - polish.md: classify each drift as missing token, one-off, conceptual mismatch or local defect (finding 06).
  - operate.md: "The tool should disappear into the task" (silent move and mis-targeted Next missing break that).

## Scores
Final-round scoring with caps applied (an open P1 caps at 85). Columns: Task 25 / Visual 20 / Consistency 15 / Copy 15 / A11y 15 / Responsive and states 10.

| Screen / state | Task | Visual | Cons. | Copy | A11y | Resp | Total | Note |
|---|---|---|---|---|---|---|---|---|
| POI list (paging, sort, URL, filters) | 22 | 15 | 11 | 13 | 11 | 8 | 80 | P1-01, P2-04, P2-06 |
| Other five lists (1440/1280/1024) | 21 | 14 | 10 | 13 | 12 | 7 | 77 | P2-05, P2-06 |
| POI editor DRAFT to ACTIVE, working copy | 21 | 16 | 12 | 13 | 11 | 8 | 81 | P1-02, P1-03 |
| Other five editors (opened and measured only) | 22 | 16 | 12 | 13 | 12 | 8 | 83 | not edited; header and side column alignment consistent |
| Media library, upload, picker from editor | 22 | 15 | 12 | 13 | 12 | 8 | 82 | no P1; P3 only; 4 s cold load |
| Activate / Apply / Discard dialogs | 22 | 16 | 12 | 12 | 11 | 8 | 81 | P1-03, P2-09 |

Range 77-84.

Nielsen heuristics (0-4):

| Heuristic | Score |
|---|---|
| Visibility of status | 3 (state line good, moves silent) |
| Match to real world | 4 |
| User control | 2 (no Undo on move) |
| Consistency | 3 |
| Error prevention | 3 |
| Recognition | 3 |
| Flexibility and efficiency | 4 (`/`, Ctrl+S, URL state) |
| Aesthetics | 3 |
| Error recovery | 3 |
| Help | 3 |

## Round-2 fixes verified
| ID | Result | Evidence |
|---|---|---|
| C2-05 editor sticky stack | partly | 1440 fine. zoom200: sticky chrome reaches y=173 of 360 (117 px below the app header, 33 %). `poi-editor__alpha-active__zoom200.png` |
| C2-06 list sticky toolbar | partly | toolbar plus thead stick to y=162 (18 %). `pois-list__after-back-pending__1440.png` |
| C2-27 "Waiting for you to apply" | fixed | 16 items, newest first, Alpha on top. `dashboard__waiting-to-apply__1440.png` |
| C2-36 sort direction | fixed | `sort=updated`, `aria-sort=descending`, announcement "Sorted by Updated, newest first" |
| C2-37 paging | fixed | 50 rows, "Showing 1–50 of 97", `page=2` in URL, page 2 in 318 ms (see 17) |
| C2-39 counts | fixed | segment counts follow search (5/3/2/0); footer "92 of 97 … hidden by filters" |
| C2-41 Back restores scroll and row focus | fixed | after Back the focus is on the row link, `?pending=1` kept, reload keeps URL and 13 rows |
| C2-42 translations column mid-word at 1024 | fixed | no mid-word break. `list-categories__default__1024.png` |
| C2-45 row-action feedback | not fixed | Move to top/bottom/position only announces to screen readers (01) |
| C2-50 Next missing | regressed | focuses the filled Title, not the missing text (02) |
| C2-51 Media worklist | fixed | per-row "English: alt text, title missing" |
| C2-54 long titles | partly | editor header wraps then ellipsis (`poi-editor__gamma-active__1440.png`); list row wraps to 4 lines with no clamp |
| C2-56 Apply not primary while dirty | fixed | dirty: Save draft primary, Save and apply secondary. Clean: Apply aria-disabled, opacity .6, reason "Nothing to apply: there are no pending changes". `poi-editor__active-dirty__1440.png` |
| C2-57 focus to body | partly | fixed after Activate (H2 "Status"), Apply (H2 "Status"), attach image or audio (button). Still BODY after Discard and after Move (01, 03) |
| C2-65 version display | partly | "Revision: Not saved yet" on a created record. Alpha shows 6 after 4 saves, Gamma 2 (08) |
| C2-66 audio narration one group | fixed | `poi-editor__triggers-added__1440.png` |
| C2-69 coordinate validation | fixed | "37,9715" accepted and normalised on blur |
| C2-73 slow save and loads | partly | save 0.45 s plain, 1.5 s with QR and Geo. Cold lists 1.6–2.6 s. Media 4.0 s. Create to editor 1.4–2.5 s |
| C2-74 keyboard between kinds | fixed | `/` focuses search on POI and Routes; 7 Tabs from search to first row control; 8 Tabs from top to Routes; focus lands on h1 |
| C2-75 media list overprint | fixed | `media__list-audio__1440.png` clean |
| C2-76 upload dialog focus | fixed | opens on H2 "Upload files" |
| C2-82 media URL state | fixed | `type=AUDIO&alt=1`, `view=list` |
| R2-V-02 HelpHint 32 px | not measured | out of time |
| R2-V-03 sticky chrome | not fixed | see C2-05 and 10 |
| R2-V-04 toast overlaps form | not fixed | toast covers Longitude, Radius and Instructions (07) |
| R2-V-05 row menu first focus | fixed | menu no longer opens on "Deactivate" (focus on the menu container) |
| R2-V-07 populated POI editor height | not fixed | scrollHeight 1,983 at 1440 (Place 1,781, Category 1,364) |
| C2-60, 61, 62, 63, 68, 77, 78 | unverified | not exercised (see the last section) |

## Job walk
| Job | Result | Time and hesitation |
|---|---|---|
| 1 Create 3 POIs with image, audio, Category, Place, map, QR and geo; activate through the confirm | pass | About 40 s per POI scripted. Alpha fully resolved: after 15 typed texts the confirm reads "Nothing is known to be missing". Hesitations: "English: 2 texts missing" does not name the texts (09); Next missing did not help (02). Beta and Gamma activated with 6 warnings. |
| 2 Pending changes: Save draft and Ctrl+S, leave, find, Apply; Discard on another | pass, partial on Discard | Ctrl+S gives "Saving…" then "Saved 11:12" in 0.45 s, no toast, and the live region says it. Found via `?pending=1` (13 rows) and Dashboard. Apply confirm names "Summary (English)". Discard works, but focus goes to BODY (03). Leave-unsaved dialog opens on its h2; Esc returns focus to h1. |
| 3 URL state, sort Updated, paging | pass | q, status, sort, page and pending all survive open editor, Back and reload. "Edited yesterday" is one click on Updated. |
| 4 Reorder: Move to position, top/bottom, drag, Undo | partial | All work. Invalid input shows "Enter a number from 1 to 97." and drag shows a drop line. No visible result, no Undo, focus lost (01). The drag handle is not keyboard focusable; the menu is the keyboard path. |
| 5 Media: find audio, Needs attention, per-row text, attach, upload | pass | Audio filter gives 11 files. Upload dialog opens on its heading; 31 KB wav uploaded in under 1 s. Hesitation: Audio plus "No alt text" gives "No files match" with no hint (16). |
| 6 Keyboard between kinds, slow interactions | pass | `/` works on the lists tried. Slowest: Media 4.0 s cold, Places 2.4–2.6 s. |

## Findings

**R3-p1-editor-01 · P1 · Moving a row gives no visible feedback, no Undo, and drops focus to body**
- Screen: POI list, 1440, job 4.
- Repro: `/pois` page 2, row menu on Beta, Move to position… 1. Also Move to top or bottom from page 1, and drag.
- Evidence: `shots/pois-list__after-move-to-1__1440.png`, `pois-list__after-move-to-bottom-300ms__1440.png`.
- Observation:
  - The row leaves the page.
  - The only message is an `sr-only` live string, "Moved … to position 97 of 97.", which repeats the full title.
  - `document.activeElement` is `BODY`.
  - There are 0 Undo buttons. Drag-drop has only the live text as well.
- Why it hurts: a power user who moves an item across pages sees it vanish, with no sighted confirmation and no way back. Keyboard users lose their place (14 §4, WCAG 2.4.3).
- Recommendation:
  - Show a visible toast "Moved to position N of 97" with Undo and Ctrl+Z.
  - Add a "Show it" action that jumps to the target page and focuses the row.
  - Focus the next row when the moved row leaves the page.
  - Shorten the announcement to the first 40 characters of the title.
- Likely files: list core, `RowMenu`, reorder composable under `src/views/workspace/`. Effort M.

**R3-p1-editor-02 · P1 · "Next missing: English" focuses the filled Title instead of the missing text**
- Screen: POI editor, 1440.
- Repro: open Alpha (English "3 of 5") and click "Next missing: English". 14 clicks all returned `TEXTAREA#f-title`. Evidence: `next-missing__english-click__1440.png`.
- Observation:
  - The live region says "English: moving to the first missing text", but focus goes to Title, which is already filled.
  - The two missing fields (Instructions, Accessibility information) are in the collapsed "Practical details" and are never opened.
  - Typing after the click overwrote my title.
- Why it hurts: this is the main completion shortcut, and it points at the wrong field and invites overwriting good text.
- Recommendation: expand the section and focus the first empty field, scrolled clear of the sticky stack. When none is empty in the language, go to the next language.
- Likely files: language tabs and "Next missing" in the editor shell. Effort S.

**R3-p1-editor-03 · P1 · Focus falls to `<body>` after Discard changes**
- Screen: ACTIVE POI editor with a saved draft, 1440.
- Repro: Save draft, Discard changes, confirm.
- Evidence: `poi-editor__beta-discarded__1440.png`.
- Observation:
  - `document.activeElement` is `BODY`.
  - The toast "Changes discarded" carries a warning triangle although the action succeeded.
  - The state line still says "Saved 11:13".
- Why it hurts: it repeats C2-57, a P1 root, on a destructive action. Keyboard and screen-reader users restart from the top.
- Recommendation: focus Title or the Working Copy banner. Show "Changes discarded" in the state line with a neutral or check icon.
- Likely files: `useResourceEditor`, discard handler in `EditorShell`, toast icon mapping. Effort S.

**R3-p1-editor-04 · P2 · Trigger chips overprint the Place column in the POI list**
- Screen: POI list, 1440 and 1280.
- Observation: the Alpha row has 4 chips (I created duplicate triggers while testing, but 3 chips is realistic). The chip row wraps below the slug and starts 8 px right of the title (x 335 vs 327). Its last chips run under "Sculptu…" in the next column.
- Evidence: `pois-list__search-ux-r3__1440.png`, `pois-list__after-back-pending__1440.png`.
- Recommendation: cap at 2 chips plus "+2" with a tooltip, or clip the chip row to the title column. Effort S.

**R3-p1-editor-05 · P2 · Title column collapses at 1280 and 1024 (Routes, Places)**
- Routes: Title is 126 px wide at 1280 and 118 px at 1024 (`measure-lists.json`). Titles wrap to 4 lines and slugs show as "acropolis-h…". Translations (192) and Actions (56) stay fixed with free space after them.
- Places, nested rows at 1280: title column 206 px. "Ground Floor – Slopes Level" takes 4 lines. "Excavation Hall of the Slopes" ends 3 px from the "Indoor" chip.
- Row heights reach 146–183 px.
- Evidence: `list-routes__default__1280.png`, `list-places__default__1280.png`.
- Recommendation: make Title the flexible column (min 240 px) and let Category and Setting shrink or stack under the title below 1280. Use a smaller indent step. Effort M.

**R3-p1-editor-06 · P2 · Row anatomy differs between lists**
- Places, POIs and Routes cut the slug to one line with an ellipsis. Guides, Events and Categories wrap it over 2–3 lines ("the-story-of-the-parthenon-from-temple-to- / monument").
- With trigger chips the slug shrinks to 6–8 characters (Beta "ux-r3-…", Gamma "ux-r3-p…").
- The code chip sits beside the title in some rows ("Temple of Hephaestus 136") and on its own line in others ("South Metope XXXI … / 103").
- The POI Title column starts at x=310; the other five lists start at x=305 (Order column 53 px vs 48 px).
- Evidence: `list-guides__default__1440.png`, `list-events__default__1440.png`, `pois-list__default__1440.png`.
- Recommendation: one row rule, with the slug on its own single line plus a `title` attribute, chips on their own line, and the same Order column width. Effort M.

**R3-p1-editor-07 · P2 · Toast covers form content (R2-V-04 still open)**
- Every save, activate or discard toast sits over the right half of the form column, about 350 px wide at x 612–995.
- It covers Longitude and Radius (`poi-editor__gamma-active__1440.png`) and Instructions (`poi-editor__alpha-active__1440.png`).
- Recommendation: dock toasts in the side-column gutter or above the sticky header, or drop toasts the state line already covers. Effort S.

**R3-p1-editor-08 · P2 · "Revision: Not saved yet" on a record just created, and revision numbers jump**
- The created POI shows "Not saved yet" (`poi-editor__new-draft__1440.png`) although it is saved.
- Alpha shows 6 after four saves plus one activate; Gamma shows 2.
- Recommendation: show the server revision, or "New" until the first save, and bump by one per user save. Effort S.

**R3-p1-editor-09 · P2 · Confirm shows counts but not which texts**
- The Activate confirm says "Warning: English: 2 texts missing". They are Instructions and Accessibility, in a collapsed section.
- The rows are not links, and "Review in editor" focuses the English tab, not the issue.
- Evidence: `poi-activate-confirm__alpha__1440.png`.
- Recommendation: name the fields and make each row open the section and focus the field. Effort M.

**R3-p1-editor-10 · P2 · Zoom 200 keeps 33 % sticky chrome (R2-V-03 still open)**
- At 640x360 CSS the sticky header plus banner reach y=173 (117 px below the app header). The header drops the "Pending changes" chip.
- Evidence: `poi-editor__alpha-active__zoom200.png`.
- Recommendation: make the banner non-sticky below about 700 px height. Effort S.

**R3-p1-editor-11 · P3 · Place select shows nested indentation when closed**
- The selected text is "      Parthenon Gallery" (leading spaces), so it reads about 36 px in while Category reads flush. Both have padding-left 12 px.
- Evidence: `poi-editor__alpha-saved__1440.png`.
- Recommendation: show the plain title when closed. Effort S.

**R3-p1-editor-12 · P3 · Two "Save draft" buttons at once, different heights**
- In a dirty ACTIVE editor the header button (primary, 40 px) and the banner button (secondary, 32 px) have the same name.
- Evidence: `poi-editor__active-dirty__1440.png`.
- Recommendation: hide the banner one while the header one shows. Effort S.

**R3-p1-editor-13 · P3 · No pressed state on primary buttons**
- Save draft: rest `rgb(76,29,139)`; hover and `:active` are both `rgb(58,20,105)`, with no transform or shadow.
- Recommendation: add a distinct active state. Effort S.

**R3-p1-editor-14 · P3 · Activate confirm repeats its readiness sentence**
- The body says "(3 warnings, nothing blocks)", and the heading below says it again. A hidden duplicate also exists in the DOM.
- When clean, "Nothing is known to be missing. The platform checks the point of interest when you confirm." is in the DOM twice.
- Recommendation: drop the parenthetical. Effort S.

**R3-p1-editor-15 · P3 · Filters popover: uneven control sizes and group layout**
- "Sort by" select is 144 px, while "Search in" and Category are 350 and 278 px.
- In Media, the "Needs attention" label sits beside the first checkbox and the other two wrap below at x=1032.
- Evidence: `pois-list__filters-popover__1440.png`, `media__filters-popover__1440.png`. Effort S.

**R3-p1-editor-16 · P3 · Media empty-state wording**
- "0 files (1 archived)" (the archived count ignores filters), straight quotes in `Use "Clear filters"…`.
- Audio plus "No alt text in English" gives "No files match" with no hint that alt text applies to images only.
- Evidence: `media__audio-noalt-empty__1440.png`. Effort S.

**R3-p1-editor-17 · P3 · Pager: focus stays on a Next button that becomes disabled; scroll lands 51 px down**
- After Next to the last page, the active element is the disabled "Next" and `main.scrollTop` is 51, so the page head is half clipped.
- Evidence: `pois-list__page2__1440.png`.
- Recommendation: focus the list heading or first row and scroll to the table top. Effort S.

**R3-p1-editor-18 · P3 · Units wrap away from their numbers**
- Examples: "1.6 / km", "700 / m", "next / of 8 dates", "14 min / read", picker tile "163 / KB".
- Evidence: `list-routes__default__1440.png`, `asset-picker__image__1440.png`.
- Recommendation: use non-breaking spaces between number and unit. Effort S.

**R3-p1-editor-19 · P3 · RTL fragment reorders punctuation in a list title**
- Gamma's title "… (עברית ערבית)" renders "(עברית" at the line end and "ערבית)" on the next line, with the closing parenthesis leading. The title has no `dir="auto"` or `<bdi>`.
- Evidence: `pois-list__dragging__1440.png`. Effort S.

**R3-p1-editor-20 · P3 · Media grid chip rows do not align across a grid row**
- Draft/Unused chips sit at y=531, 514, 501 and 531 in one row of cards.
- Evidence: `media__grid__1440.png`.
- Recommendation: bottom-align the chip and attention rows. Effort S.

**R3-p1-editor-21 · P3 · Categories: icon x differs by about 4 px between rows with and without a chevron**
- About 125 vs 129 px, read from `list-categories__default__1024.png`; no rect measurement was taken. Effort S.

**R3-p1-editor-22 · P3 · Updated column wraps date and time on every list at 1440**
- "12 Nov 2026, / 13:29" takes two lines at 128–143 px while Place/Category truncates ("Acropolis of Athe…").
- Recommendation: widen to about 150 px or place the time deliberately. Effort S.

## What works (keep these)
- State line: "Unsaved changes", "Saving…", "Saved 11:12", with no toast on draft save and a matching polite live region. Ctrl+S works from the title field.
- Button model: dirty gives Save draft primary and "Save and apply" secondary; clean gives Apply disabled with a spoken reason.
- Apply confirm names the change ("Changes: Summary (English)").
- Dashboard "Waiting for you to apply" is newest first with date and time. List `?pending=1` and Back restore the row focus.
- URL state for q, status, sort, page, pending, type, alt and view. `/` focuses search. Sort announces its direction.
- Move dialog opens on its input, states "Now at 95 of 97. Choose 1 to 97." and validates inline.
- Picker from the editor: attach returns focus to a button in the card, and audio is one group per language.
- Upload dialog: heading focus, "Uploaded" live text, under 1 s.
- Disabled Deactivate carries its reason ("Used by 2 floor plans and 1 route. Remove it from each of them first.").

## Unverified / could not test
- Forced 5xx, 409 and 422 on save: my `page.route` pattern missed the real save URL, so the save succeeded. There is no error evidence and no 409 dialog.
- Restore-draft row, Create dialogs for Sub-place and Subcategory, "Upload anyway" and Create Project were not exercised.
- HelpHint 32 px (R2-V-02) was not measured.
- Forced colours, slow network and reduced-motion behaviour were not run. `getAnimations()` is 0 at rest.
- The Place, Route, Guide, Event and Category editors were opened and measured but not edited, so their hover, active and disabled states were not exercised. Header x is 256 and the side column is at x 1012 (1440) or 908 (1280) for all of them.
- At 768 the list is a card layout without the drag handle (reorder by menu only), so no table measurement was possible there.
