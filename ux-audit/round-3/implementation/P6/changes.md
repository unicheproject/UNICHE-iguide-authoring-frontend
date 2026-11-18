# P6 Maps and floor plans: changes

## C3 ids
- **Fixed:** C3-71, 72, 73, 74, 75, 76, 87 (Maps and Floor plans part), and the P6 part of C3-02 and C3-09.
- **C3-02:** the tab strip is `LinkTabs` from W0-A and `MapsTabs` already uses it. P6 changed nothing there and did not re-measure the ring.
- **Not changed:** C3-12 and C3-36. Only the P6 parts of C3-02, C3-09 and C3-12 were in scope.
- **Extra bug fixed in `basemap.ts`:** the code read the MapLibre map before it existed, threw, and fell back to raster tiles every time. The GL layer was still added as well. Listeners now attach on the layer's `add` event. The vector basemap now really loads, and its tile-failure and ready events now work.
- **Note for the orchestrator:** this is a behaviour change. Real map backgrounds now come from OpenFreeMap vector tiles, and the attribution text changed accordingly.

## Files changed
- Views in `src/views/workspace/maps/`: `FloorPlanEditorView.vue`, `MapEditorView.vue`, `NewMapDialog.vue`, `NewFloorPlanDialog.vue`, `MapsView.vue`, `FloorPlansView.vue`.
- Map components: `src/components/map/GeoMapCanvas.vue`, `basemap.ts`, `coordinates.ts`; `src/components/GeoPicker.vue`.
- Platform: `src/platform/maps.ts` (`resultKind`, aerodrome/airport labels).
- Docs: `DECISIONS.md` (D-114).
- Untouched: `MapsTabs.vue`, `floorPlans.ts`, `e2e/place-map-link.spec.ts` (no selector it uses changed).
- Probes and screenshots: `ux-audit/round-3/implementation/P6/{probes,after}/`.
- **Records:** nothing was saved or created. The plan placements and map edits were made in the browser only.

## Acceptance, measured (admin, `UX-R3-s12 Map` and `Plan`; before = round-3 audit)
| Item | Before | After |
|---|---|---|
| Armed prompt vs plan, 1024x768 mouse | sticky bar overlapped the plan by 116 px | bar y105–236, plan y248: no intersection (12 px gap) |
| Armed prompt vs plan, other states | overlapped | no intersection at 1024 touch, 768 touch, 1440 and zoom200, including after the taken-spot message |
| Tap or click on a taken spot | silent | the prompt shows "That spot is taken by <pin>. Click (Tap) an empty spot." and the same sentence is announced once; touch copy says "Tap" |
| Bounds handles at 1440 | north handles 12 px clipped, south 12 px clipped | 0 px clipped on all 5 handles at 1440, 1024, 768 touch and zoom200; none over the attribution strip |
| Tile failure card | below the fold (y=860 at 1440) | over the top of the map (y 12, 110 px high, inside the map box) |
| Focus after "Try again" | `body` | map region (`div role=region "Map"`) |
| New map dialog on 429 and "No areas found" | 803 to 863 px high, top 48 to 18 | top 88 and height 804 before and after, both errors. Same at 1024 (85/675) and zoom200 (24/328) |
| Result kind labels | "Suburb", "Aeroway" | "Archaeological site", "Airport", "Island" |
| Reset after invalid typed bounds | absent | shown; Reset restores 37.976 and hides itself |
| Coordinates on blur | "37,970000" and "0.0600" kept as typed | "37.97", "0.06", "23.708", "0.5" (also the map-editor start view, bounds, placements and plan x/y) |
| Floor-plan range copy | "X is between 0 and 1." | "Across (x) must be between 0 and 1." |
| Landmarks named Map | 2 | 1; the MapLibre canvas has `aria-hidden` and no role or label |
| Loading chip | no role | persistent `role=status` wrapper on `GeoMapCanvas` and `GeoPicker` |
| Zoom buttons or +/- keys | silent | "Zoom 17" announced once, and only when the zoom changed |
| Visibility card | bare counts, about 37 categories listed twice | "17 POIs" and "3 Routes"; lists over 6 collapse behind "By category (28)" (two lists, 28 and 13) |
| Map legend | named Routes and pins with 0 placed | names only what is drawn: with 0 placed it shows only the Routes sentence |
| Lists | "0 placed, N not placed" vs "0 placements" | the plans list now says "N placed" |
| Maps list with `/maps` returning 503 | the tab strip showed "0" next to the error | error card with the one 503 sentence and request id; no count on the Maps tab |
| New floor plan first focus | `Name` | `button#fp-asset` ("Plan image: Choose image") at 1440, 1024, 768 touch and zoom200 |
| Checkbox rows on touch (768) | 40 px | 44 px (visibility checkboxes and the visitor-filter radio rows) |

- **axe** (wcag2a/aa, 21a/aa): clean on the armed plan editor, the map editor in edit-bounds, and the New map and New floor plan dialogs, each run at 1440, 1024, 768 and zoom200. The armed plan editor was also run at 1024 touch.
- **Keyboard:**
  - Tab and Enter on "Try again" moved focus into the map.
  - The retry on the failed Maps list moved focus to a neighbouring link, "Maps 9" in the tab strip. I did not make it the h1.
  - Escape cancels placing.
- **Gates:**
  - `vue-tsc` passes.
  - `check-css-tokens` passes.
  - `impeccable detect` returns `[]`.
  - The literal grep over the owned files is clean.
  - e2e specs cannot run here.
- **Screenshots:** `after/` holds the armed, taken-spot, errors, map editor, edit-bounds, visibility, tile-failed, lists, New map and New floor plan states, and the armed plan in forced colours. I read the armed 1024, tile-failed, edit-bounds, maps-error and New map shots.

## Deviations and deferred
- **D-114 wording:** "sticky header zone" was not built, because a sticky bar overlaps the plan once the page scrolls. The prompt is in the flow directly above the plan, and arming scrolls it and the plan into view together. This is recorded in D-114.
- **Seam lines in raster tiles (C3-73):** not touched. The vector basemap now loads, which probably removes them. Not re-checked.
- **Bounds HelpHint:** added on the "Bounds" legend using `glossary.bounds` and `hints.bounds`. `visitorFilter` was not used.
- **RouteMap legend:** not touched (P5a owns `RouteMap.vue`).
- **New map reserved line:** the 64 px message line is always reserved, so a visible empty gap shows when nothing is displayed.

## System additions
- `coordinates.ts`: `formatCoordinate(value, digits)`, `tidyCoordinate(text, digits)`, `GEO_DIGITS` (6), `UNIT_DIGITS` (4).
- `maps.ts`: `resultKind(type, addresstype)`.
- `GeoMapCanvas`: persistent status region, overlay error card, zoom announcement.

## Notes for others
- **P5a:** `RouteMap.vue` has two near-duplicate legend sentences (C3-76).
- **P4:** `GeoPicker` now emits trimmed coordinates ("37.96884", not "37.968840").
