# P5a changes (Route and Guide editors, StoryEditor, resource picker)

## Closed
C2-70 (focus goes to Undo, one Tab; bar sticky at viewport bottom; Ctrl/Cmd+Z), C2-71 (map card text matches stop count, fan-out, links for unplaced, "Show as list"), C2-72 picker (ArrowDown/Enter), C2-34 route/guide inputs (live `completeness` prop), C2-53 (alt-text lang/dir in StoryEditor), C2-43 editor parts (shadow tokens, `scroll-mt-4`, `z-raised`, one "Texts" heading via TranslationsPanel). Partly: C2-57 (`data-focus-fallback` on StoryEditor Replace; picker unmount handled by AppDialog).

## Files
`routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `components/editor/StoryEditor.vue`, `components/ResourcePickerDialog.vue`. D-098 in DECISIONS.md; requests.md appended. `guideElements.ts`, `platform/routes.ts`, `guides.ts`, `e2e/guide-reference.spec.ts`, `resourcePicker.ts` untouched (no selector changed; e2e cannot run here). No Q entries.

## Measured (admin, Populated, `UX-R2-P5a Route`/`Guide`; scripts r1.mjs, g1.mjs, shots in after/)
- Route remove stop: focus on "Undo removing Stop 2 ..."; bar fully in viewport at 1440; Ctrl+Z restored (3 stops again).
- Picker: ArrowDown from search lands on first row, ArrowDown/Up move, ArrowUp from first returns to search; Enter adds first choosable row (2 Enters = 2 added).
- Route live completeness: header "3 warnings, nothing blocks"; card lists "English: 12 texts missing" (stop texts counted from the unsaved form; drops to 9 after removing a stop).
- Guide: empty story "English 1 of 2", 1 warning; five empty blocks still "1 of 2" (not Complete); Undo focus works.
- Stop card: one field (Description) instead of walking instructions + link; rest behind "More stop texts".
- axe serious/critical: none on Route and Guide at 1440, 768, zoom200. `impeccable detect`: []. Typecheck clean.

## Deferred / notes
- Route-line legend stays in `RouteMap.vue` (P6's file); unchanged.
- Fan-out verified by code and a 5-stop map; no seed POIs with identical coordinates were attached, so the "spread out" note was not seen on screen.
- Forced-colors screenshot and Greek long-name run not done. Guide empty-story blocker waits for G-039.
- Records `UX-R2-P5a Route` and `UX-R2-P5a Guide` (Populated) remain.
