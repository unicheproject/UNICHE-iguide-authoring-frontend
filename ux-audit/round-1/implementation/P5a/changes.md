# P5a: Route and Guide editors, StoryEditor, Resource picker

## Closed (s11 / consolidated)
Translation tabs (s11-01, C1-34 for Route and Guide): non-default tabs show only translatable fields with the default-language text read-only beside them and Copy source; no reorder, add, remove, replace, map, settings, media or triggers there (Route: 0 move/remove/add buttons in the Greek tab, Guide: 0). Stops right after Texts (s11-02). Remove with Undo, announcement and focus to the next row for stops, Guide elements and StoryEditor blocks (s11-04). Controls 32 px (44 coarse), labelled drag handle that also answers Up/Down (s11-06). Route stop picker: stays open, search (title, code, place), Status and Place filters, "Code 109" labels, Draft chips, used rows disabled, "Done (6 added)" (s11-14). Stale "different order" alert gone after Apply (s11-05, now computed from `editor.live`). Heading buttons "H2 (level 2)" contain visible text, axe clean (s11-16). Route 0-stop state shows one message instead of red plus amber (s11-19). Sticky map above stops on wide, tall (>=1000 px) screens only (s11-21 part). Distance/minutes labelled with units (s11-10 part). C1-24 for these editors: Texts, Stops, Route settings, Media, How visitors reach it (TriggersCard, not re-wrapped; `checkTriggers` in both `validate()`), Details collapsed with count.
Not closed: s11-07 (readiness per block per language) lives in W0 `ReadinessList`/backend readiness; s11-17, s11-18 (Q-012), s11-25.

## Files
Edited: `routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `components/editor/StoryEditor.vue`, `components/ResourcePickerDialog.vue` (new optional props `multiple`, `usedIds`, `usedLabel`; single mode unchanged, kind row hidden with one kind), `components/resourcePicker.ts` (`Pickable` gains optional `code`, `placeId`, `placeName`), `e2e/guide-reference.spec.ts` (button is now "Add reference"; not run).
New (shared, in `components/editor/`): `undoRemove.ts` (`useUndoRemove`), `RemovedBar.vue`, `ReorderControls.vue`, `SourcePairField.vue`. `platform/routes.ts`, `guides.ts`, `guideElements.ts`: unchanged. Scripts and records: `P5a/{make-records,flow-route,flow-guide,forced,stale}.mjs`, `records.json` (records "UX-P5a Route", "UX-P5a Guide", both DRAFT; the stale check activated and applied on the Route, so it is now ACTIVE).
Map: P6's `RouteMap` kept its props and the canvas defaults (single zoom set, tile error card, non-focusable context pins) apply, so nothing to wire. No D/Q entries (none reserved to P5a).

## Acceptance (Windows Node, 1440, 1024, 768, zoom200)
- Picker adds 6 stops in one open; Done label "Done (6 added)". Keyboard: Remove on stop 3 via Enter gives 5 stops and focus on the next row, Undo restores 6 with focus on it; Guide the same (focus on the next paragraph field). Handle ArrowDown keeps focus on the handle.
- Targets: handle, move, insert, remove 32x32, position 76x32. axe (wcag2a/aa/21): clean on Route empty, picker, 6 stops, Greek; Guide default and Greek at all four viewports. Forced colours checked (route, guide). Stale warning: 1 after reorder, 0 after Apply.
- Screenshots in `P5a/after/`. e2e not run. `impeccable detect`: [] ; vue-tsc clean.

## Notes
- Position select in rows is a native select (76 px). The Guide has no TriggersCard (Q-012). StoryEditor (used by TranslationsView) got the same row controls and Undo.
