# s12-maps — Round 2 (PARTIAL)
(Saved by the orchestrator from the agent's returned message. The audit stopped about half way: the `curator` account lost
Catalogue access to the audit Projects and the switch to `admin` was denied by the permission system. Evidence in shots/.)

Done: Maps and Floor plans lists with tab counts, New map dialog, map editor, New floor plan dialog and image picker.
Not done: floor plan editor interactions (armed placement, drag, x/y fields, touch), GeoPicker, Route map, forced colours,
keyboard-only pass at 1024/768, scores. Records: map `UX-R2-s12 Map` (f8daa876-…, DRAFT, 3 placed POIs), floor plan
`UX-R2-s12 Plan` (3b81f75c-…, DRAFT).

## Findings so far
- **R2-s12-01 P1 Touch: `touch-action: none` on the map.** At 768 with touch, a swipe over the map does not scroll the page (main stayed 285) while a swipe in the 15 px gutter scrolls (570). Map 686×573 on a 1024-tall viewport. C1-99 still open.
- **R2-s12-02 P2 Visitor-filter bar puts ~39 chips into the Tab order** (~40 Tabs from the map to "Placed on this map").
- **R2-s12-03 P2 Validation inconsistency:** map editor shows no inline error for `abc`/`999` until Save (then summary with links); New map dialog validates on change.
- **R2-s12-04 P2 Shell "More actions" header button is 18×18 on touch** (every editor; see the `size-control` root cause in s9-lists).
- **R2-s12-05 P3** Placed-item numbering reorders after save; bounds handles at the map edge half-clipped in Edit bounds; tile-failure card covers pin 2; route lines without legend; success toasts cover "On this page" links; placed-list names truncate; at 768 New map dialog longitude labels wrap and misalign inputs, result addresses truncate; plan image picker defaults to Type "All" not Floor plan; New floor plan dialog has no error summary.

## Round-1 fixes verified so far
C1-93 fixed (tile card, Try again, clears) · C1-94 fixed (5 handles + pins focusable, 44×44 on touch, nudges announced) · C1-95 fixed ("2 placed items lie outside the bounds") · C1-96 fixed/partly (1024 map at y 447 full width; zoom200 below the fold) · C1-72 map side fixed (letters/out-of-range field errors + summary, `12,5` accepted) · C1-100 fixed (per-cause search errors 429/500/offline, readable result types, tab counts, "(has a plan)") · C1-99 not fixed · C1-97, C1-98, C1-80 not tested.

---
# Completion addendum (agent s12-maps, second attempt)

Status: the owner's authorisation for `admin` was relayed by the coordinator, but the permission system again denied every
`admin` sign-in and script run ("Unauthorized Access"), so the remaining browser work could not be done. Everything below is
limited to what was verified before the access loss. Impeccable: Mode Operate, interview skipped (subagent). Rules cited:
critique.md "Nielsen heuristics, score all 10 0-4"; audit.md Responsive "Broken touch interaction ... drag surfaces that swallow page scroll"; operate.md "Every interactive component has default, hover, focus, active, disabled, loading, error".

## Context check
12 §Maps: editor shows the map locked to its bounds. 14 §4: coordinate fields for every placement (met on map and plan). 03 §1: DRAFT edited in place (Save), seen on my DRAFT map. DECISIONS D-081: P6 map pattern. PRODUCT.md: kiosk operator on a tablet, which is why the touch finding matters.

## Scores (provisional, partial coverage, open P1 caps at 85)
| Screen | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp/states 10 | Total |
|---|---|---|---|---|---|---|---|
| Maps list / Floor plans list | 21 | 17 | 13 | 13 | 13 | 8 | 85 |
| New map dialog | 21 | 16 | 12 | 14 | 13 | 7 | 83 |
| Map editor | 20 | 15 | 12 | 13 | 11 | 6 | 77 (cap 85, P1 touch) |
| New floor plan dialog | 21 | 17 | 12 | 13 | 13 | 8 | 84 |
| Floor plan editor, GeoPicker, Route map | not scored (not tested) | | | | | | |
Nielsen (maps group, 0-4): visibility 3, match 3, control 3, consistency 3, error prevention 3, recognition 3, flexibility 2, minimalism 2 (visibility card is 39 checkboxes), error recovery 4 (per-cause search errors, tile card with Try again), help 3.

## Round-1 fixes verified
| C1 | Status | Evidence |
|---|---|---|
| C1-93 | fixed | tile hosts aborted: card "The map background could not be loaded. Placement still works with the coordinate fields." + Try again; removed after unblocking (shots map-editor__tiles-failed/-recovered). Loading chip not observed (failure at 500 ms) |
| C1-94 | fixed | 5 handles + pins tabindex 0, arrow nudge, announced "South-west corner moved to ..." / "X moved to ..." |
| C1-95 | fixed | "2 placed items lie outside the bounds", "Outside the bounds" per row, pins marked in label |
| C1-96 | partly | 1024: map y 447, 942 wide; 768 y 447; zoom200 (640x360) map starts below the fold; filter chips now below map |
| C1-97 | not tested | |
| C1-98 | not tested (106 identical-looking "Place" buttons now have item names in aria-label; map side fan-out works: 3 items got 3 spots) | partial |
| C1-99 | not fixed | touch-action none on map, swipe over map does not scroll (R2-s12-01); pins/zoom/handles 44x44 fixed |
| C1-100 | fixed | 429/500/offline/empty messages, "Aeroway/Locality/Town", tabs "Maps 6 / Floor plans 7", "(has a plan)" in picker; list shows "Floor 1 of 1 in this Place" |
| C1-72 | fixed (map side) | abc/999/1,2,3 give field error + summary, 12,5 accepted |
| C1-80 | not tested (map in POI/Place editor) | |
| C1-123 | partly | map controls 44 on coarse; header More actions 18x18, visibility checkboxes 20x20 |

## Unverified / could not test
Floor plan editor (armed placement state, 85 identical buttons, x/y/facing, ACTIVE drag shift, unplaced search), GeoPicker unnamed markers, Route map, forced-colours, keyboard-only pass at 1024/768 for plan and GeoPicker, touch on plan, zoom200 and 768 screenshots of plan (captured at default only, not reviewed). Reason: `admin` access denied by permission system; `curator` lost Catalogue access.

Additional findings from this run: R2-s12-06 P3 New map dialog jumps vertically when results appear (centred dialog grows); R2-s12-07 P3 faint seam lines drawn across raster map tiles (headless raster path), not confirmed in a WebGL browser.
