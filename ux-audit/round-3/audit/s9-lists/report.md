# s9-lists — Round 3

## Verdict
- The lists are far better than in round 2, but not shippable yet.
- One P1 remains: at 200 % zoom the Filters popover opens above the viewport, so Status, Search in and Sort cannot be reached.
- The rest is P2/P3 drift between the six lists plus a few focus and feedback gaps.
- Score range: 75–83 per screen, capped at 85 by the open P1.
- Counts: P0 0, P1 1, P2 12, P3 12.
- The impeccable skill was run in Operate mode; interview steps were skipped because I am a subagent.
- Rules cited:
  - critique: "Viewable targets require browser inspection".
  - audit: "Keyboard navigation: missing focus indicators".
  - polish: classify each cause as missing token / one-off / conceptual mismatch / local defect.
  - operate: "an aligned grid, consistent spacing… tables with sortable headers".

## Context check
- `12` §3: lists reorder by sortOrder.
- `14` §4: every reorder has a keyboard alternative. This holds for all six lists: Move up/down/top/bottom and "Move to position…".
- `03` §1: DRAFT → ACTIVE → ARCHIVED. Every confirm and toast I saw uses that vocabulary.
- DECISIONS D-091: list paging, sort direction and honest counts. Verified, see below.
- PRODUCT: the content editor needs "keyboard flow, clear save feedback". The gaps against that are in the findings.

## Scores
| Screen | Task | Visual | Consist. | Copy | A11y | Resp. | Total |
|---|---|---|---|---|---|---|---|
| POIs list | 22 | 15 | 11 | 13 | 11 | 7 | 79 |
| Places list | 22 | 14 | 11 | 13 | 11 | 7 | 78 |
| Routes list | 21 | 13 | 11 | 13 | 11 | 6 | 75 |
| Guides list | 22 | 15 | 11 | 13 | 11 | 7 | 79 |
| Events list | 22 | 15 | 11 | 13 | 11 | 7 | 79 |
| Categories list | 22 | 15 | 11 | 13 | 11 | 7 | 79 |
| Create dialogs (6) | 22 | 16 | 12 | 14 | 12 | 7 | 83 |

- **Nielsen (0–4):**
  - visibility of status 3
  - match with real world 4
  - user control 2 (no Undo for a move)
  - consistency 2
  - error prevention 3
  - recognition 3
  - flexibility 3
  - minimalism 3
  - error recovery 3
  - help 3

## Measured matrix (admin, Populated, 1440 / 1280 / 1024)

**Columns**
- Drift between lists at 1440:
  - POIs: Order 53.4, Status 178, Updated 142.5, Translations 214, Actions 62.
  - Other lists: 48 / 160 / 128 / 192 / 56. The columns jump when you move between lists.
- Title column by width (1440 / 1280 / 1024):
  - Places 366 / 206 / 198
  - POIs 348 / 270 / 262
  - Routes 286 / 126 / 118
  - Guides 382 / 222 / 214
  - Events 334 / 174 / 166
  - Categories 394 / 238 / 230
- Header row height: Places 35, POIs 49 (53 at 1280 and 1024), Routes/Guides/Events 49, Categories 48.

**Sorting and filters**
- Sortable headers:
  - POIs, Routes, Guides: Title, Status, Updated, Translations. Events adds Next date.
  - Places and Categories have none (a note says "Ordered by hierarchy and manual order").
  - A header only cycles asc/desc, so it never returns to Manual order. That needs the Filters popover.
  - Updated starts newest first.
  - Each sort announces itself, e.g. "Sorted by Updated, newest first".
- Segments and counts:
  - Radio group "Not archived / Active / Draft / Archived", with counts that follow the other filters.
  - Below 900 px the segments move into the Filters popover.
- Filters popover:
  - Contents: Search in, Sort by (not on Places and Categories), Pending changes, Needs translation, plus Category (POIs, Routes), Featured only, or Applies to (Categories).
  - It has role=dialog but no accessible name and no Close button.
  - First focus lands on the "Search in" select; Esc returns focus to the Filters button.
  - Layout drift: "Search in" and "Sort by" are stacked labels, but Category is an inline label. The Sort select is 144 px wide against 350 px for Search in.
  - The button is named "Filters and sort" even on Places and Categories, which have no sort.

**Rows**
- Row heights at 1440 (median / max):
  - Places 73 / 99
  - POIs 73 / 146
  - Routes 73 / 141
  - Guides 73 / 127
  - Events 73 / 99
  - Categories 83 / 83
- At 1280 (median / max):
  - Places 83 / 162
  - POIs 73 / 167
  - Routes 83 / 146
  - Guides 73 / 168
  - Events 99 / 180
  - Categories 83 / 99
- At 1024 (median / max):
  - Places 83 / 183
  - POIs 73 / 168
  - Routes 99 / 146
  - Guides 79 / 168
  - Events 99 / 180
  - Categories 83 / 99
- Slug truncates (`truncate`, with a title attribute) in Places, POIs and Routes. It wraps in Guides, Events and Categories.
  - Wrapped rows at 1280: Guides 7 of 20, Events 10 of 20, Categories 14 of 34.
- Updated:
  - Date and time wrap to two lines in every row of all six lists at 1440 (column 128–142 px).
  - Categories sets it in `text-ink-2`; the other lists use `text-muted-foreground`.
- Cards: below 900 px every list becomes a card list.
  - There is no horizontal scroll, and the toolbar is static there.
  - At 900 px and above the toolbar is sticky at 57 px, and the header row sticks below it.

**Tree and menu**
- Tree indent step is 24 px per level.
  - The first step is visually 41 px (guide-line element).
  - A leaf title sits 4 px right of a sibling that has a chevron (394 vs 398, 418 vs 422).
- Row menu:
  - Kebab is 40×40 (was 18).
  - Items: [Add sub-place / Add subcategory], Deactivate/Activate, Archive, Move up, Move down, Move to position…, Move to top, Move to bottom.
  - It opens on the first enabled Move item.
  - Esc returns focus to the kebab.
  - On a single child all Move items are disabled and the menu opens with no highlighted item.

## Findings

**R3-s9-lists-01** · P1 · Filters popover is unreachable at 200 % zoom
- Where: any list, zoom200 (640×360).
- Evidence: `shots/guides__filters-open__zoom200.png`.
- Observation: the popover is 418 px tall in a 360 px viewport, flipped upward, with its top at y = −239. Status, Search in and Sort by are clipped off-screen, with no max-height or scroll. At 768 px the segments exist only inside this popover.
- Impact: fails WCAG 1.4.4/1.4.10. The status filter, language search and sort cannot be used.
- Fix: give the popover `max-height: var(--radix-popper-available-height)` with `overflow-y: auto`, or show it as a bottom sheet below 900 px.
- Files: `ListToolbar.vue`, popover wrapper. Effort S.

**R3-s9-lists-02** · P2 · A long unbroken Greek word overprints the next columns
- Where: Routes at 1280, `UX-R3-p3 Route Περίπατος…Αποκαταστατικοσυντηρητικοεπιστημονικότατος` (another agent's record).
- Evidence: `shots/routes__long-greek-word__1280.png`. The link is 330 px wide in a 126 px cell, 220 px over.
- Impact: it prints on top of Category and Setting.
- Fix: `overflow-wrap:anywhere` on the title link in the shared list core. Effort S.

**R3-s9-lists-03** · P2 · Title column collapses and nested rows grow tall
- Routes Title is 126 / 118 px at 1280 / 1024, with 3-line titles and slugs like "ux-r2-w0b-d…".
- Events Title is 174 px, with a median row of 99 px and a max of 180.
- Places nested rows reach 162 / 183 px.
- Fix: narrow or stack Setting/Category/Next date, and give Title a `min-w`.
- Evidence: `m1.json`, `shots/routes__default__1280.png`.

**R3-s9-lists-04** · P2 · Paging leaves focus on the off-screen pager
- Evidence: `shots/pois__after-next-page__1440.png`.
- Repro: POIs, focus Next, press Enter.
- Observation: focus stays on Next at top ≈ 4067 px while the page scrolls to the top (scrollTop 51). The live region does announce "Page 2 of 3, showing 51 to 100 of 109".
- Impact: reaching the new rows needs about 50 Shift+Tabs, and paging on again needs a 4,000 px scroll.
- Fix: after a page change, focus the table or the first row link. Optionally repeat the pager above the table. Effort S.

**R3-s9-lists-05** · P2 · Moving a row has no visible feedback or Undo
- Evidence: `mv.mjs`, `shots/guides__move-up-after__1440.png`.
- Observation:
  - After Move up/top/bottom or Move to position there is no highlight (0 animations, transparent background), no toast and no Undo. Only a polite live message is announced.
  - Menu moves keep focus on the kebab and the scroll follows the row, so "focus drops to body" is not reproduced for the menu.
  - Drag-drop does lose focus: it lands on `<main>` (`shots/guides__drag-in-flight__1280.png` shows the drag in flight).
- Fix: flash the moved row for about 1.5 s (with a reduced-motion alternative), return focus to its kebab after a drop, and consider Undo.

**R3-s9-lists-06** · P2 · Undo and Restore drop focus to body
- Evidence: `shots/events__after-undo__1440.png`.
- Observation:
  - Undo on the Archive bar: focus becomes BODY, although the row returns.
  - Restore from the Archived segment: BODY.
  - Archiving the only row focuses `<main>`.
- Fix: focus the restored row's kebab. Where no row is left, focus the list heading. Effort S.

**R3-s9-lists-07** · P2 · Status segments hide inside Filters below 900 px
- Observation: at 768 and zoom200 there is no visible status control or current-status cue. The button shows only a count.
- Fix: keep the segments as a scrollable row, or show the active status as a chip beside Filters.

**R3-s9-lists-08** · P2 · Filters popover name and button label
- Observation:
  - The popover has role=dialog with no name and no Close.
  - With one filter on, the button reads "Filters and sort, 1 on" while its visible text is "Filters 1". That fails label-in-name (WCAG 2.5.3).
- Fix: put an `aria-label` on the popover (for example "Filter and sort points of interest"). Name the button "Filters 1", or add the extra words via `aria-describedby`.

**R3-s9-lists-09** · P2 · Row-menu focus indicator
- Observation: the highlighted item uses `outline:none` with background rgb(238,240,243) on a white menu, which is 1.14:1.
- Forced colours: the focused item reads as the odd one out among heavily bordered items (`shots/pois__forced-colors-rowmenu__1440.png`).
- Fix: add a 2 px outline or an inset marker.

**R3-s9-lists-10** · P2 · Activation warnings ignore structural gaps
- Observation: my new Route (0 stops), Event (no dates) and Guide (empty story) all activate with only "3 warnings: English partly translated, Ελληνικά, Italiano not translated". The dialog never mentions the missing stops, dates or story.
- Evidence: `shots/events__activate-dialog__1440.png`. This follows from C2-34, which is only partly fixed.

**R3-s9-lists-11** · P2 · Route create dialog differs from Place and Category
- Observation:
  - Route "Setting" is a select with the hint above it. Place Level and Category "Applies to"/Level are radio cards with the hint below.
  - The Route hint repeats the option text.
- Evidence: `shots/routes__create-dialog-empty-submit__1440.png`, `shots/categories__create-dialog__1440.png`. This is the open C2-44 item.

**R3-s9-lists-12** · P2 · Move-to-position error is not linked to the field
- Observation:
  - The alert says "Enter a number from 1 to 22." (role=alert), but the input has no `aria-invalid` and no `aria-describedby`.
  - The field is `type=text`, with no `inputmode`.
- Fix: `aria-invalid`, `aria-describedby`, and `inputmode=numeric`.

**R3-s9-lists-13** · P2 · Header sort cannot return to manual order
- Observation: a header only cycles asc/desc. Manual ordering again needs Filters → "Manual order".
- Fix: a third click clears the sort, or show a visible "Manual order" reset chip.

**R3-s9-lists-14** · P3 · Archive gives duplicate feedback
- Evidence: `shots/pois__archive-undo-bar__1440.png`.
- Observation:
  - After Archive, a toast "Archived" and the Undo bar ("archived. It is under Archived now.") say the same thing.
  - Earlier toasts ("Deactivated") stack up with an info icon.
  - The Undo bar was still there after 9 s, with no expiry cue.

**R3-s9-lists-15** · P3 · Layout shift and chip overrun
- Observation:
  - The toolbar shifts when "Clear filters" appears: the search field shrinks about 118 px and the segments move about 110 px.
  - The "Pending changes" chip is 150 px in a 160 px cell and overruns its padding by 6 px (POIs, Routes, Guides).

**R3-s9-lists-16** · P3 · Wrapping inside cells
- Observation:
  - "1.6 / km" and "700 / m" break across lines (Routes, `shots/routes__default__1440.png`).
  - Translation dots wrap to two lines in 192 px.
  - "Used by 21 points of interest" wraps in Categories.

**R3-s9-lists-17** · P3 · Slug truncates in three lists and wraps in three
- Observation: see the matrix. In POIs the trigger chip beside the slug cuts the slug to about 100 px.

**R3-s9-lists-18** · P3 · Header, Order and Updated drift
- Observation: header row 35 / 49 / 53 / 48 px; Order 53.4 vs 48 px; Categories Updated colour differs from the others.

**R3-s9-lists-19** · P3 · Tree leaf titles sit 4 px right of siblings that have a chevron
- Observation: the first indent step is 41 px, the others 24.

**R3-s9-lists-20** · P3 · RTL text in a Latin-led title
- Evidence: `shots/guides__rtl-title-crop__1440.png`.
- Observation: `dir="auto"` on the row resolves LTR for "UX-R3-s9 מוזיאון (חדש)! – Guide RTL". The Hebrew run then displays in the wrong order. There is no `<bdi>` on the title.
- Fix: wrap the title in `<bdi>`.

**R3-s9-lists-21** · P3 · Create dialog frame nits
- Observation:
  - The summary and the inline error are both `role=alert`, so the message is announced twice.
  - The Category scope radio group is `aria-invalid` with no `aria-describedby`.
  - With "Edit slug" open, or the "Review in editor" button showing, the dialog body has only about 8 px bottom padding.
  - Close X centre is at y 194 against the title centre at 189 (5 px lower).
- Evidence: `shots/guides__create-slug-open__1440.png`.

**R3-s9-lists-22** · P3 · Error and empty state alignment
- Observation:
  - The `ListLoadError` card is inset 16 px each side (x 273–1399) against the 256–1415 grid.
  - Every empty state has two identical "New …" buttons.

**R3-s9-lists-23** · P3 · Search placeholder wording
- Observation: placeholders are inconsistent:
  - lists: "Search title, slug or trigger"
  - POIs: "Search title, slug, code or trigger"
  - Categories: "Search name or code"
  - Maps: "Search map names"
  - Media: "Name, file name or title" (no verb)

**R3-s9-lists-24** · P3 · Filtered-empty copy does not point to other statuses
- Evidence: `shots/pois__archive-undo-bar__1440.png`.
- Observation: it says "No points of interest match" while "Archived 1" holds the match. A line such as "1 match in Archived" would help.

**R3-s9-lists-25** · P3 · Row hover reuses one grey
- Observation: row hover, kebab hover and menu highlight all use rgb(238,240,243). The kebab active state is rgb(233,235,239), a 1-point difference. The sort header hover is only an underline, with no active state.

## Round-2 fixes verified
| ID | Result | Evidence |
|---|---|---|
| C2-36 sort direction | fixed (Places and Categories still unsortable by design, note shown) | `?sort=updated` newest first, `dir=asc` toggles, direction announced |
| C2-37 paging | fixed, but see -04 | "Showing 1–50 of 109", `?page=2` works, median row 73 px |
| C2-38 required Parent | fixed | Sub-place → "Parent place: Choose the place it sits inside.", nothing created |
| C2-39 honest counts | fixed | segment counts follow search, "0 of 104 points of interest" and sort announced |
| C2-40 one Clear filters | fixed | one button; the empty text only mentions it |
| C2-41 back scroll and focus | not tested | |
| C2-42 translations column | fixed | 192 px, whole-language wrapping |
| C2-43 residual drift | partly | -14, -17, -18, -23 |
| C2-44 create dialogs | partly | one-pass summary, Esc "Discard what you typed?" and slug maxlength 100 fixed; control types and hints still differ (-11) |
| C2-45 row-action feedback | partly | focus returns to the kebab and the Undo bar exists; -05, -06, -14 |
| C2-46 degraded POI list | fixed | "Places could not be loaded… Try again" with rows kept |
| C2-47 Add sub-place and move error | partly | "Add sub-place" present, alert present, field link missing (-12) |
| C2-48 MatchHint | not verified | my search term matched in the default language |
| C2-50 dots link `?lang=` | fixed | href `?lang=en` |
| C2-53 RTL | partly | `dir=auto` present; Latin-led titles still reorder (-20) |
| C2-94 ListLoadError | fixed | no server `detail` shown; request id, Copy and Try again present |
| C2-21 loading | fixed | mirrored skeleton, "Loading guides" status |
| C2-74 `/` focuses search | fixed | |
| C2-01 hit area | fixed | kebab 40×40 (fine pointer) |
| C2-06 sticky stack | fixed | toolbar 57 px, about 104 px of 720 with the head |
| C2-26 `?create=1` | fixed | dialog opens on Title, param stripped |
| C2-35 activation confirm | partly | warnings and "Review in editor" present, but -10 |

- Totals: fixed 13, partly 6, not fixed 0, regressed 0, not tested or not verified 2.

## What works
- Create dialogs:
  - One-pass validation with a summary in form order; focus goes to the summary.
  - Esc with typed text asks "Discard what you typed?".
  - The slug preview transliterates Greek and Hebrew correctly.
  - After Create, the editor opens with focus on its h1, plus a "created" toast whose copy fits each kind.
- Lifecycle: the Activate, Deactivate and Archive dialogs keep the vocabulary. Archive Undo works. Focus returns correctly after Activate and Deactivate.
- Filtered-empty and error states: one Clear filters, and the 500 error shows the request id without echoing `detail`.
- Pager: aria-disabled Previous with a reason; announces "Page 2 of 3…".
- Keyboard: `/` focuses search; 9 Tabs reach the first row from the heading.
- Tree: the collapse button keeps focus.
- Forced colours are largely intact: sort buttons, kebabs and chips gain borders.

## Unverified / could not test
- C2-41 back-scroll restore, the MatchHint display, and the 401/403/404/409/422 and offline states (only 500 and a slow load were run).
- Zoom200 row menu and dialogs were not individually measured.
- Maps and Floor plans: only table geometry was measured (Maps has no Order column; header 49 px).
- Records created in Populated, all `UX-R3-s9 …`:
  - Place, POI, Route, Event, Category and Guide.
  - A Guide RTL record.
  - The POI and the Event were activated, archived and restored and are now DRAFT.
  - The Guide was moved and returned to the bottom of its list.

Report path: `ux-audit/round-3/audit/s9-lists/` (not written; text above).
