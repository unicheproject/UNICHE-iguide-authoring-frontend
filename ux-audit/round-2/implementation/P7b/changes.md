# P7b changes (Asset editor and Asset picker)

## Closed
C2-80 (alt field above the fold at <= 1024, no sticky preview), C2-81 (editor "Used in" explained), C2-83 (editor: Translations/Next missing from live model), C2-34 (asset: tab marks, card, "Before you activate" names "Alternative text is missing in English"), C2-51 (Translations card + Next missing on the Asset editor), C2-55 (Decorative inside the text card, same for every language tab), C2-78 (roving tiles, hidden input out of Tab order, view toggle inside Filters, short-viewport footer).
Partly: C2-57 (picker side done; the focus target is the caller's, see requests.md), zoom200 picker rows (see deferred).

## Files
`src/views/workspace/media/AssetEditorView.vue`, `src/components/media/AssetPickerDialog.vue`, `src/components/media/AssetPreview.vue`. Scripts and screenshots in this folder (`editor.mjs`, `picker.mjs`, `probe.mjs`, `after/`).

## What changed
- Editor: passes `translations` and a live `completeness` (`completenessOf` + `assetAltSlots` from the form) to `EditorShell`, so typing alt text clears the blocker at once. Decorative moved into the TranslationsPanel default slot (bottom of the card, "applies to every language"). Below 1180 px the preview is one thumbnail row (<= 6 rem, 4 rem on short screens), not sticky. "Used in" fact shows "N resources" (references) with a HelpHint that explains why the library may show another number (G-030).
- Picker: tiles and list rows are one roving Tab stop (arrows, Home/End, Up/Down by row geometry; Enter on a selected one attaches); Play buttons follow the same stop; file input is `hidden` (no unnamed Tab stop); view switch inside "Filters and view", collapsed by default (summary names status, type and view); short viewport (max-height 599) defaults to the list and renders Cancel/Use inline at the end of the body. "No alt text" chip was already on tiles and rows.

## Acceptance (admin, Populated, `UX-R2-s13 zeta.png` DRAFT, no alt)
- 1024x768: alt textarea top 553 px (< 768); 768x1024: 553; 1440x900: 349. zoom200 (640x360): alt is below the fold (page chrome alone is about 345 px; W0-B's accepted limit); the thumbnail is 64 px there.
- Readiness for that DRAFT: "2 to fix before activating, 4 warnings", "Blocking: Alternative text is missing in English"; Translations card and Next missing present at 1440.
- Picker: 15 tiles, 1 tab stop (`tabIndex 0` count 1); Search -> grid in 3 Tabs (Filters, Upload new, grid); ArrowRight/ArrowDown/End/Home moved to the right tiles; one Tab leaves the grid. axe serious/critical: none at 1440, 1024, zoom200 (editor 1024, zoom200 too). `vue-tsc`: no errors in my files (others from P2/P3-core files).
- Not met: zoom200 picker shows 1 row (body 242 px of 328 after the dialog title and the inline footer); needs AppDialog work (requests.md).

## Deferred / notes
- Focus after "Use this image" lands on the new Replace/Clear: needs `data-focus-fallback` in MediaSlots (P4), StoryEditor (P5a), FloorPlan views (P6); requests.md.
- Compact-row Activate ignores `activateBlockedReason` (EditorShell): request.
- No D-entry reserved for P7b in plan section 1; none added. No QUESTIONS.
- Not done: forced-colors screenshot, Greek long-name run, e2e (cannot run here; `e2e/media.spec.ts` selectors for the picker view toggle ("Tiles"/"List" now inside the Filters disclosure) may need `Filters and view` opened first).

## Follow-up
`AssetPickerDialog` has an optional `defaultType` prop (initial Type filter; used only when it is one of `accept`, otherwise "All" as before). Typecheck run after the change; see reply for the result.
