# s12-maps — Round 3

## Verdict
Maps & Floor Plans is close to shippable. The round-2 P1 and P2 problems are fixed: touch swipe, visitor-filter Tab stops, "Place <name>" buttons, blur validation. Four P2s remain: half-clipped bounds handles on desktop, an armed placement bar that still covers the lower 18 % of the plan at 1024x768, no feedback when an existing pin is tapped while placing, and focus lost after "Try again". The rest is P3 polish. Coverage is partial at some widths (see Unverified).

Method: impeccable in Operate mode (interview steps skipped, I am a subagent). Rules cited: critique "Viewable targets require browser inspection"; audit "Keyboard navigation: missing focus indicators, illogical tab order"; polish "Inspect the rendered experience and real interaction path"; operate "The tool should disappear into the task".

## Context check
- 12 Maps & Floor Plans: "Edit bounds" unlocks the map, corners and centre handle move the area; the editor lists unplaced Resources for placement.
- 14 §4: coordinate fields for every placement; errors announced and linked.
- 03 §1: DRAFT -> ACTIVE via Working Copy.
- DECISIONS D-096: Move map toggle and filter as radio groups.
- PRODUCT.md: the content editor needs keyboard flow and clear save feedback.

## Scores
| Screen / state | Task 25 | Visual 20 | Consistency 15 | Copy 15 | A11y 15 | Resp/state 10 | Total |
|---|---|---|---|---|---|---|---|
| Maps / Floor plans lists (1440 only) | 22 | 17 | 13 | 13 | 13 | 7 | 85 |
| New map dialog | 21 | 17 | 13 | 13 | 13 | 8 | 85 |
| Map editor | 21 | 16 | 13 | 13 | 13 | 8 | 84 |
| New floor plan dialog | 22 | 17 | 14 | 14 | 13 | 8 | 88 |
| Floor plan editor | 20 | 16 | 13 | 13 | 13 | 8 | 83 |
| GeoPicker and Route map (map behaviour only) | 22 | 17 | 13 | 13 | 14 | 7 | 86 |

Score range 83-88. No open P1; open P2s cap the editors at 85. Nielsen heuristics: 3 of 4 on all ten.

## Findings

**R3-s12-maps-01 · P2 · Map editor, Edit bounds, 1440 desktop**
- Evidence: shots/map-editor__edit-bounds__1440.png, shots/map-editor__handle-focus__1440.png; HANDLES line in out.log.
- Observation: corner handles are 26x26. The two north handles sit at y=-12 (12 px clipped), the two south handles are 12 px clipped at the bottom. After focus scrolls, the SW handle sits under the attribution strip. On touch (768) the hit area is 44 px with a 16 px dot and 0 px clipping.
- Impact: corners are hard to see and grab on desktop. Deferred in round 2, still open.
- Recommendation: pad the fit by 14-16 px or clamp handle anchors inside the map; offset the attribution while editing bounds.
- Files: GeoMapCanvas.vue. Effort S.

**R3-s12-maps-02 · P2 · Floor plan editor, armed placement, 1024x768 and 1440**
- Evidence: shots/plan-editor__armed__1024.png, shots/plan-editor__armed__zoom200.png.
- Observation: the bar is 942x131, 16 % of the viewport (reported 19 %). It is sticky and overlaps the bottom 116 px (18 %) of the 648 px plan. The plan top sits under the sticky header (plan y=-3), so only about 64 % of the plan is visible. A click in the covered band needs a scroll. At zoom200 the bar is static and 131 px of a 360 px viewport. At 768 touch it is 143 px and does not overlap the plan.
- Recommendation: put the bar below the plan (non-sticky) up to about 800 px height, or reduce it to one line with the explanation only in the live announcement.
- Files: FloorPlanEditorView.vue. Effort S.

**R3-s12-maps-03 · P2 · Floor plan editor, tap or click on an existing pin while armed (1024 mouse, 768 touch)**
- Evidence: "tap on existing pin" lines in out.log, shots/plan-editor__armed-tap-pin__*.png.
- Observation: the bar stays armed with unchanged text and nothing is announced. onPlaneClick returns silently when the target is [data-pin].
- Impact: the author thinks the tap failed.
- Recommendation: announce and show "That spot is taken by <pin>. Tap an empty spot", or place the item beside the pin.
- Files: FloorPlanEditorView.vue. Effort S.

**R3-s12-maps-04 · P2 · Map editor, tile-failure card, keyboard**
- Evidence: shots/map-editor__tiles-failed__1440.png; "after retry" lines.
- Observation: after Enter on "Try again" the card is removed and focus drops to body ("Skip to content"). The button is 92x32.
- Recommendation: move focus to the map region on retry or keep the card until tiles load; make the button 44 px on touch.
- Files: GeoMapCanvas.vue. Effort S.

**R3-s12-maps-05 · P3 · New map dialog, error states, 1440**
- Evidence: shots/new-map__search-429__1440.png.
- Observation: results do not move the dialog (803 px before and after), but the danger alert does: height 803 to 863, y 48 to 18 (30 px jump). "No areas found" also moves it (836).
- Recommendation: reserve one line for the message.
- Files: NewMapDialog.vue. Effort S.

**R3-s12-maps-06 · P3 · New map dialog, result kind labels**
- Evidence: shots/new-map__bounds-invalid__1440.png.
- Observation: kind prefers addresstype over type, so an archaeological site shows "Suburb" and Heathrow Airport shows "Aeroway".
- Recommendation: use type first and add aerodrome to Airport.
- Files: platform/maps.ts. Effort S.
- Per-cause errors verified and correct: 429 busy/about one search a second, 403 refused, 500/503 problem on its side, 404 "answered with an error (404)", offline "could not be reached", empty "No areas found. Try a broader name."

**R3-s12-maps-07 · P3 · New map dialog, typed bounds**
- Observation: "Reset to search result" appears only when the map bounds differ from the result. After invalid typed text the bounds are unchanged, so there is no reset and a typed "abc" stays in the field.
- Recommendation: show Reset whenever any field differs from the current bounds.
- Files: NewMapDialog.vue. Effort S.

**R3-s12-maps-08 · P3 · Number formatting, both editors**
- Evidence: BOUNDS and pl0 lines in out.log.
- Observation: precision is mixed. Bounds show 37.9738, then 37.97387 after a nudge. Start view shows 37.976833 or 37.9768. Placements show 37.968840 with a trailing zero. The plan shows 0.2994 or 0.0600. A typed comma stays as typed ("38,5") beside point values.
- Recommendation: one formatter on blur (trim zeros, decimal point).
- Files: components/map/coordinates.ts. Effort S.

**R3-s12-maps-09 · P3 · Floor plan editor, error copy**
- Observation: "X is between 0 and 1." and "Y is between 0 and 1." are terse and inconsistent with the map's "A latitude is between -90 and 90."
- Recommendation: "Across (x) must be between 0 and 1."
- Files: FloorPlanEditorView.vue. Effort S.

**R3-s12-maps-10 · P3 · Map editor, accessibility tree**
- Observation: with WebGL the MapLibre canvas adds a second role=region aria-label="Map" (tabindex -1) inside the Leaflet region, a duplicate landmark. The loading chip has no role or aria-live, so "Loading the map background" is not announced. Zoom +/- gives no announcement (known).
- Recommendation: aria-hidden on the canvas; role=status on the chip.
- Files: basemap.ts, GeoMapCanvas.vue. Effort S.

**R3-s12-maps-11 · P3 · Map editor, visuals**
- Evidence: shots/map-editor__touch-move-on__768.png, shots/map-editor__after-create__1440.png.
- Observation: grey gutters of about 33 px when the bounds aspect differs from the map box; they look like unloaded tiles. A thin seam line is visible in the raster tiles at 768. The tile-failure card sits below the map (no longer over pins) but at 1440x900 starts at y=860, cut by the fold.
- Recommendation: fit the box to the bounds aspect or tint the gutter; show the card as an overlay inside or above the map.
- Files: GeoMapCanvas.vue. Effort S-M.

**R3-s12-maps-12 · P3 · Map editor, Visibility card**
- Evidence: shots/map-editor__visibility__1440.png.
- Observation: about 37 categories are listed twice. Counts are bare numbers ("17") and are pushed far right when a long name wraps. Checkboxes are 20 px (24 px touch, known). The filter's scroll list ends mid-row with no scroll cue.
- Recommendation: label the counts ("17 POIs"), align them in a column, and collapse the lists behind "By category (37)".
- Files: MapEditorView.vue. Effort S.

**R3-s12-maps-13 · P3 · Map editor legend, Route map**
- Observation: the Map editor shows "The purple lines are Routes… Numbered pins are the placed items" with 0 placed and no visible line. The Route map has two near-duplicate sentences: "The line is the route, joining its stops in stop order…" and "Stops are joined in order."
- Recommendation: show the legend only when something is drawn; drop the duplicate.
- Files: MapEditorView.vue, RouteMap.vue. Effort S.

**R3-s12-maps-14 · P3 · Lists and dialog**
- Evidence: shots/maps-list__default__1440.png, shots/plans-list__default__1440.png.
- Observation: maps say "0 placed, 129 not placed" while plans say "0 placements". New floor plan opens with focus on Name although Plan image is the first field.
- Recommendation: use the same wording; focus the first field.
- Files: FloorPlansView.vue, NewFloorPlanDialog.vue. Effort S.

Counts: P0 0, P1 0, P2 4, P3 10.

## Round-2 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C2-84 touch swipe | fixed | 768 touch: Move map 126x44; at rest the swipe scrolls the page (touch-action auto); with Move on, touch-action none and the swipe pans; zoom buttons 44x44 |
| C2-85 filter | fixed | One disclosure, 2 radio groups, 6 Tab stops from Edit bounds to the first bounds field; radio rows 40 px (44 px touch); visibility checkboxes 20 px (24 px touch), partly C2-01 |
| C2-86 Place names / armed bar | partly | 136 distinct "Place <name>" names; bar 16 % of viewport and overlaps the plan by 116 px (R3-02); Place buttons 65x32 (65x44 touch) |
| C2-69 blur validation | fixed | Map bounds, start view, placements, plan x/y/facing: aria-invalid, sentence, polite announcement; save summary lists 4 links |
| C2-87 placed numbering after save | not verified | nothing saved |
| C2-87 half-clipped handles | not fixed | R3-01 |
| C2-87 tile card | fixed | card below the map; chip and card shown; retry works (focus lost, R3-04) |
| C2-87 route legend | partly | present, with duplicated or unconditional wording (R3-13) |
| C2-87 New map jump | partly | results do not shift it; errors do (R3-05) |
| C2-87 New plan summary | fixed | focus goes to the summary ("2 things to fix") |
| C2-87 picker default type | fixed | Floor plan preselected, 58 drafts hidden note |
| C2-87 seam lines | seen | raster fallback at 768 (R3-11) |
| C2-58 map Tab stops | fixed | "Skip map" exists; from the map one "Nearby points of interest (61)" button, then past the map |
| C2-01 checkbox size | partly | 20 px (24 touch), radios 16 px, label rows 40/44 px |

## What works (keep these)
- Move map toggle with caption and hint text.
- 44 px handle hit areas and zoom buttons on touch.
- One-disclosure visitor filter.
- Per-cause geocoder errors with correct sentences.
- Stable New map dialog height when results appear.
- Fixed-name Place buttons.
- No layout shift while dragging a plan pin (scrollHeight and plane height constant).
- Forced colours: handles have a 3 px black border and pins a 2 px border.
- The out-of-bounds warning names the items and says what to do.
- Pin arrow keys clamp values into range.

## Unverified / could not test
- Lists captured only at 1440. New map dialog, New floor plan dialog and Map editor at 1280/1024 were not repeated at every width; the New map dialog was run at 1440 only. Floor plan editor was run at 1024 (mouse), 768 (touch), 1440 and zoom200.
- No touch run for New map or the Floor plan editor at 1024.
- Fan-out was tested only with POIs that already have coordinates.
- Not exercised: Floor plans list drag reorder, real WebGL vector basemap (headless used the OSM raster fallback), Nearby POIs list contents, Greek/RTL in the editors (only a Greek search result), axe for the plan editor at 1024 (run cut off).
- Records created (own, DRAFT): map UX-R3-s12 Map (b2ab454f-2c60-44b2-888c-979ec19e0393) and floor plan UX-R3-s12 Plan (375edf44-fff5-4ad8-9660-76913a5f74b1). Extra placements and edits were not saved. Another agent briefly linked and unlinked a Place on my map (per coordinator).
- Evidence folder: /mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/audit/s12-maps/ (shots/, scripts a1-g2.mjs, lib.mjs, out.log, ids.json).
