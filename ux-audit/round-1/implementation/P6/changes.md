# P6 Maps, Floor plans and the map engine: changes

D-081 appended to DECISIONS.md. No Q entries. Engine contract appended to `implementation/system.md` before implementation.

## Consolidated IDs
Fixed: C1-93 (tile failure card with Try again, loading chip), C1-94 (focusable handles and pins, arrow nudge, Shift 10x,
announced), C1-95 (Bounds fields under the map, outside-bounds warning plus dashed marker), C1-96 (page order, one zoom set,
map 360+ px full width at 1024 and 768), C1-97 (plan banner no longer shifts the plan: measured 0 px; numbered pins at one
size; armed "Place"), C1-98 (item names in buttons, search above Not placed, fan-out, x/y range checks, facing explained,
nudge announced), C1-99 (Tap/Click copy by pointer, 44 px pins and zoom; "Use my location" not built), C1-100 (geocoder error
per cause, kind names in words, route line legend, per-Place order shown, "(has a plan)" kept in picker, tab counts; two P3
items without text not identifiable), C1-72 map side (no `Invalid LatLng`, decimal comma, range), C1-80 engine side (context
markers not focusable by default, nudge announced), C1-123 map controls (44 px coarse).

## Files
Engine: `src/components/map/GeoMapCanvas.vue`, `basemap.ts`, new `coordinates.ts`; `GeoPicker.vue`, `RouteMap.vue` (props
unchanged; tile card, tokens, legend). Views in `src/views/workspace/maps/`: `MapEditorView`, `FloorPlanEditorView`,
`MapsView`, `FloorPlansView`, `NewMapDialog`, `NewFloorPlanDialog`, new `MapsTabs.vue`. Platform: `maps.ts` (`countMaps`,
`AreaSearchError`, `areaKindLabel`), `floorPlans.ts` (`countFloorPlans`). Capture and checks: `P6/capture.mjs`, `P6/after/`.

## Acceptance (Windows Chromium, my records `UX-P6 Map`, `UX-P6 Plan`, plus UX-s12-maps ones)
- Tiles blocked by route abort: error card visible, Try again removes it once unblocked, no blank box. No pageerror.
- Tab reaches each bounds handle (5 handles, tabindex 0); ArrowRight x3 + Shift+ArrowUp moved min lat/lng fields
  (37.966/23.720056 to 37.96667/23.7203), focus kept, announced "South-west corner moved to ...".
- Map editor at 1024: map starts at y 447 of 768 (about 320 px visible, full width 940), Bounds fields directly below it.
- "abc", "999", "1,2,3": field errors with summary links, no exception; "12,5" accepted (valid, flagged outside bounds).
- Floor plan: Place arms "Click the plan to place X" (Tap on coarse), Escape cancels (announced), click places at the
  click spot, "Place near the centre" x3 gave 4 distinct spots. ACTIVE plan pointer drag: image box shift 0 px.
- Coarse emulation (820 wide, isMobile): zoom button, pin, bounds handle and plan pin all 44 x 44.
- axe (wcag2a/aa/21): none in my markup; remaining serious `label-content-name-mismatch` are the shell's Project switcher and
  account menu (not mine). `impeccable detect`: []. typecheck: no errors in my files (others' errors in ProjectList,
  FormDialog, LifecycleDialogs, useListLifecycle pre-exist).
- Screenshots in `P6/after/` (1440, 1024, 768, zoom200 for map, plan, lists; forced-colours map and plan; dialogs; touch).

## Deferred / notes
- Raster fallback only in my headless runs (no WebGL): the MapLibre vector path and its `idle`/`error` events were not
  observed in a WebGL browser; the 15 s load timeout and error handler cover it. Touch drag of handles untested.
- "Use my location" not built (needs a permission flow, no spec text). Floor plan list counts tabs read the full lists
  once via two extra paged reads (`countMaps`, `countFloorPlans`).
- e2e specs: markup selectors they use ("New map" button, headings) unchanged; specs cannot run here and were not run.
- For P4/P5: pass nothing new; `GeoMapCanvas` defaults changed only in that non-draggable markers lost their Tab stop and the
  canvas now shows its own tile card and Leaflet zoom. `SectionTabs` is no longer used by maps views (MapsTabs adds counts).
- Pre-existing: "Version 0" on a new record is the shell's (W0.2).

## Verification fixes
- R1-V-04: `NewMapDialog` grid is one column until there are results or a pick, so the map is full width first, then splits (`after/vfix-new-map__1440.png`).
- R1-V-05: maps have no stored order (`sortOrder` is a constant 0, no order endpoint for maps), so `MapsView` no longer offers Manual order; default sort is Updated (`after/vfix-maps__1440.png`). No handle needed.
- R1-V-11: `FloorPlanEditorView` hint is two lines, the image name is a non-wrapping, truncating span, and Replace image sits beside it (`after/vfix-plan__1440.png`).
- vue-tsc: 0 errors. Before shots: the earlier `map`, `new-map-picked`, `plan` images in `after/`.
