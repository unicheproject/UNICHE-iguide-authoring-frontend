# P6 Maps and floor plans — changes

Fixed: C2-84 (touch), C2-85 (filter), C2-86 (Place names, armed bar), C2-69 (map editor and floor plan blur validation), C2-87 (numbering, tile card, route legend, New map jump, New floor plan summary; image picker default pending request), C2-58 follow-up (kept). Partly: C2-01 (checkbox box stays 20 px, label hit area 44 px), C2-23 (placeholder is in PoiEditorView, requested to P4).

Files: new `components/map/mapGestures.ts`, `MapMoveButton.vue`; changed `GeoMapCanvas.vue`, `GeoPicker.vue`, `RouteMap.vue` (legend line, overlapping-pins note), `maps/MapEditorView.vue`, `FloorPlanEditorView.vue`, `NewMapDialog.vue`, `NewFloorPlanDialog.vue`. D-096 appended; requests appended (AssetPickerDialog `defaultType`, POI placeholders, Checkbox).

Results (admin, Populated, DRAFT map/plan UX-R2-s12; nothing saved): 768 touch, swipe over the map: page scrolls 235 px at rest, 0 px with Move map on; `touch-action` auto at rest; Move map 125x44. Tab stops between map and "Placed on this map": 9 (filter 1 + the 8 real fields/buttons; chips were about 32 of the former ~40), map region 6. Floor plan: 111 Place buttons, 111 distinct names ("Place Parthenon Frieze - North Side"). Armed bar sits under the plan; static (not sticky) below 600 px height; at 1440 it no longer overlaps the plan. New map dialog height 803 before and after results. New floor plan summary takes focus (1440, 768). Blur validation: aria-invalid true, error sentence and polite announcement. axe serious/critical: none (map 1024, armed plan 1024, New map, picker).

Screenshots in `after/` (1440, 1024 map, 768 touch, zoom200 plan, forced-colours map). Not all four widths for every state; 1024/768 plan not reviewed beyond axe/names. e2e: no selector in `place-map-link.spec.ts` touched; cannot run here.

Deferred: image-picker default Type "Floor plan" (needs `defaultType` prop in P7b's AssetPickerDialog, already passed); half-clipped bounds handles at the map edge; seam lines (unconfirmed); success toasts over "On this page" (toast owner). Choice: the filter uses radio groups (single choice) instead of checkboxes; "Move map" toggle instead of two-finger gestures.
