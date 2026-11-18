# s12-maps — Round 1

(Saved by the orchestrator from the agent's returned report: the agent's Write call to this file was refused.
Evidence: `shots/` (72) and scripts `a1.mjs`–`d1.mjs` in this folder.)

## Verdict
Not shippable unchanged. Every placement has a coordinate-field alternative (the spec gate), and the lists,
dialogs and 422/503/404 states are sound. The map editor is the weak screen.

## Scores
| Screen | Score |
|---|---|
| Maps list | 76 |
| Floor plans list | 74 |
| New map dialog | 69 |
| Map editor | 57 |
| New floor plan dialog | 78 |
| Floor plan editor | 64 |
| Tabs model (Maps / Floor plans) | 72 |

Nielsen heuristics 23/40; impeccable audit health 12/20.
Findings: P0 0 · P1 6 · P2 9 · P3 2 (R1-s12-maps-01 … -18; P3 = -17, -18).

## Findings (P1)
- **R1-s12-maps-01 (P1)** Map editor placement coordinates: typing a non-number or a decimal comma throws
  `Invalid LatLng (NaN…)` then `__vnode of null` from the route polyline; the Save error then says
  "between -90 and 90" for `abc`. Evidence: `a6.mjs`.
- **R1-s12-maps-02 (P1)** Tile hosts blocked: the map is a blank grey box, no message, no retry, no raster
  fallback. Evidence: `shots/mapeditor__tiles-blocked__1440.png`.
- **R1-s12-maps-03 (P1)** Bounds corner handles (14 px) and centre handle are not focusable; map markers do not
  move with the keyboard.
- **R1-s12-maps-04 (P1)** Placed POIs outside the bounds are clipped with no warning; the Bounds fields sit
  about 1.5 screens below the map.
- **R1-s12-maps-05 (P1)** At 1024 the map is ~326 px wide and starts below the fold; at 768 it sits under five
  rows of filter chips.
- **R1-s12-maps-06 (P1)** ACTIVE floor plan: the Working Copy banner appears on the first pointer move of a drag
  and shifts the image down 93 px (266 → 359). Evidence: `b4.mjs`.

## Findings (P2/P3 themes)
- Floor plan "Place" stacks every item at 0.5/0.5, so one marker is unreachable by pointer.
- Rotation turns the digit and is unexplained.
- Unplaced lists of 71–74 items have no search or filter.
- Text is 9–11 px and targets 26–29 px (spec asks 44 px); axe `target-size` flags 8 nodes. Contrast passes
  (muted 6.03:1, destructive 5.99:1).
- Purple route lines have no legend.
- Map editor page order is wrong (name last, filter chips above the map, lists below).
- New map dialog: 429 and other failures show "check the connection"; raw OSM types such as "HEATH" shown as labels.
- Floor plan list order is not shown per Place.
- Floor plan picker defaults to "All" and silently omits Places that already have a plan.
- Tabs have no counts.

## What works (keep)
Coordinate fields with per-item accessible names; floor plan arrow-key nudge; touch drag on floor plan markers;
map touch pan and pinch; the 422 error summary with request id; ⊘ plus text for hidden items; no horizontal
scroll at any viewport; the tab-link model itself.

## Unverified
Reordering floor plans (would mutate seed records), touch drag of map markers and bounds handles, raster
fallback without WebGL, screen readers, impeccable detector (not run). Chromium only.

Records created: map `UX-s12-maps Map` (4bbe38bb-…, DRAFT, 3 placements), floor plan `UX-s12-maps Plan`
(8c1031b6-…, ACTIVE, 3 placements).
