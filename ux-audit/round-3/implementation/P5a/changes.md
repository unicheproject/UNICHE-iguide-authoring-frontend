# P5a Route and Guide editors, StoryEditor, resource picker, RouteMap: changes

`vue-tsc` passes and `check-css-tokens` passes. `impeccable detect` on the changed files returns `[]`. The literal-gate grep over my files is empty. Nothing was committed. Test records are `UX-R3-P5a …` in the Populated project (5 POIs near the Acropolis, Route A with 5 stops, one empty Route, one Guide). Probes are in `ux-audit/round-3/implementation/P5a/probes/` and shots in `after/`.

## C3 ids
- **Fixed:**
  - C3-53 (picker fold).
  - C3-35 (pins and legend).
  - C3-12 for the Route and Guide add flows.
  - C3-36 (heading label, stop-row tooltip, repeated draft warning, link targets). The Undo-bar copy and dock and the slug are in W0-B's files (partly).
  - C3-48 (unplaced-stop links, Guide "Edit image" and reference link).
  - Route readiness: the live `routeGaps` is passed. Guide already passed `storyGaps`.
- **Partly:**
  - C3-36: the Undo-bar space is still missing, in `RemovedBar` (requests 1 and 3).
  - C3-12: the remove double message comes from `undoRemove` and `RemovedBar` (request 2).
  - C3-16: gaps are passed. The shell still re-adds the saved gap (request 4).

## Files changed
`components/ResourcePickerDialog.vue`, `components/resourcePicker.ts` (new `foldText`), `components/RouteMap.vue`, `views/workspace/routes/RouteEditorView.vue`, `views/workspace/guides/GuideEditorView.vue`, `components/editor/StoryEditor.vue`. `requests.md`: four items appended. No D, Q or G entries (none reserved). `guideElements.ts`, `StoryEditor.ts`, `platform/routes.ts`, `platform/guides.ts` and `e2e/guide-reference.spec.ts` needed no change; the spec's selectors still match.

## What changed
- **Picker search:** `foldText` (NFD, marks removed, `toLocaleLowerCase`) is applied to title, code and place. It is the same fold as `EntityCombobox`.
- **Picker announcements:**
  - A pick is announced once, by the picker ("X added. N added in total.").
  - The "N items match" line is the only live part of the count; ", N added" sits outside it.
  - The Route editor no longer adds its own "Added X as stop N".
  - A Guide text block that takes focus is not announced separately: the field label says "Paragraph (block 3)". Image and reference adds still announce.
- **RouteMap fan-out:**
  - Pins that would touch (centres under 30 px, including stops at one position) are spread on a circle, in stop order.
  - This is computed in screen pixels from the zoom the map reports (and an estimate of the fit before the first report). Pins return to their true spots when the map is zoomed in.
  - The route line follows the spread pins.
  - The Route view's degree-based fan now applies only to the indoor schematic.
- **RouteMap legend:** one line ("Numbered pins are the stops; the line joins them in stop order[; and returns to the first]"). The old "Stops are joined in order" note shows only when stops are not drawn. A single line says which stops were spread ("Stops 1, 3 and 4 are close together…"). The editor's duplicate "spread out slightly" sentence is gone for geographic Routes.
- **Guide and StoryEditor labels:** "Paragraph (block N)" and "Heading (block N)". The level stays in the H2/H3 buttons.
- **Stop rows:**
  - The chip no longer has the raw-enum title.
  - The draft and archived sentences appear once above the list ("Stops 1, 2, 3, 4 and 5 are draft points of interest: …").
  - The row keeps a warning only for a missing point of interest.
- **Link targets:** unplaced-stop links, "Edit image", the reference title link, "Edit asset" are now `min-h-control` inline-flex. The "Replace" link buttons have `hit-44`.

## Acceptance (admin; Route A has 5 stops, three within about 15 m)
| Item | Before | After |
|---|---|---|
| Pin overlap, 5 stops, max pair | audit: pins 1, 3, 4 within 24 px, pin 1 almost covered (about 90 %) | 1440: 0 %, 768: 0 % (26 px pins, `getBoundingClientRect`). Zoom +3: 0 %. Back to default: 0 %. |
| Legend lines | 2 near-duplicates plus the spread note | 1 legend line plus 1 spread sentence |
| Picker "παρθενωνας" | 0 matches | 3 rows (incl. "Παρθενώνας"); "ΠΑΡΘΕΝΩΝΑΣ" 3 rows |
| One Add stops pick, live messages | 3 sentences ("Added … as stop 1.", "… added. 1 added in total.", "N items match, 1 added") | 1 picker sentence. "Unsaved changes" and "3 warnings, nothing blocks." (the readiness count changed from 4) come from the shell. |
| Two more picks | 2 per pick | 1 per pick |
| Reorder | 1 message | 1 message ("Moved … to position 2 of 3."); readiness not repeated, since the count is unchanged |
| Guide add paragraph | 2 | "Unsaved changes" only; focus label "Paragraph (block 1)" |
| Guide heading label | "Heading 2, level 3" | "Heading (block 2)" (`label[for]` measured) |
| Reference pick | n/a | "Added reference … at position 3." plus the readiness count change |
| Stop rows with a draft POI (5 stops) | 5 repeated sentences, chip title "…is DRAFT" | 0 per row, 1 grouped sentence, no title attribute |
| Unplaced-stop link box | 18 px high | 40 px (1440), 44 px (768 touch) |
| Reference link row | n/a | 40 px high |
| axe (wcag2a/aa, 21a/aa) | n/a | 0 violations on Route 1440 and 768, Guide 1440 and zoom200 |

- **Keyboard:**
  - Enter on "Add stops" puts focus in the search field.
  - Typing, ArrowDown, Enter adds a stop (the row becomes `aria-disabled`).
  - Esc closes the dialog and focus returns to "Add stops".
- **Screens covered:** Route stops/map at 1440, 768, zoom200; forced colours (1440); Route with an unplaced stop (1440, 768 touch); Guide at 1440 and zoom200 (Greek heading text).

## Deviations and notes
- Undo bar: the dock position and the missing space belong to `RemovedBar`. I measured `textContent` "removed.1 more can be undone." with two removals. W0-B's report says it is fixed; it is not (request 1). The bar was at 742–796 of 900 px in an unscrolled page, which is in-flow, not the sticky dock.
- Position select 40 px comes from `ReorderControls` (W0-B). I did not touch it.
- The slug break is in the Status card and header, W0-B's files (request 3). My views only show the slug in an input.
- The spread moves a pin by at most about 20 px on screen. Titles and the "Show as list" coordinates keep real positions. The indoor schematic still uses the degree-based fan.
- e2e specs cannot run here. No selector changed. The labels the specs use ("Add reference", "Add a reference", "Points of interest") are intact.

## System additions
`foldText` in `resourcePicker.ts` is the sixth copy of the NFD fold. A shared one in `lib/utils.ts` is still requested (P5b request 3).

## Requests to others
`ux-audit/round-3/implementation/requests.md` has four items for W0-B's files: RemovedBar space, the remove double message, the slug break, and `withGaps`.
