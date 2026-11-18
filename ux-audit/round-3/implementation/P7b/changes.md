# P7b Asset editor and Asset picker: changes

## C3 ids
- Fixed: C3-77 (P1, Decorative checkbox), C3-14 (asset blocker UI), C3-37 (readiness contradiction, "Complete" definition), C3-52 (Asset: language-independent controls folded), C3-79 (picker), C3-81 (tiny-image preview, picker thumbnails), C3-44 (picker sizes use NBSP).
- "Revision: Not saved yet": already gone (W0-B shows "Revision N" from creation; fresh upload reads "Revision 1").
- Partly: "Not used yet" wording. Editor and picker already use it; library "Unused" is P7a's.

## Files changed
- src/views/workspace/media/AssetEditorView.vue
- src/components/media/AssetPickerDialog.vue
- src/components/media/AssetPreview.vue
No D/Q/G entries added (G-043 answered, see notes).

## What changed
Asset editor
- Decorative is controlled: stays unticked while the confirm is open; Esc and "Keep it described" leave it unticked with the model unchanged (native box synced to form.decorative through a ref, since the Checkbox primitive is not controlled).
- Decorative ("Image settings") and Name ("Details") now sit in OtherSettings: folded under non-default languages as "Other settings (all languages)", plain cards in the default language (below the texts card; Decorative no longer sits inside the text card).
- One readiness definition: baseBlocks:false (W0-B request); "Complete" = title plus alt text for images (library row's definition), caption optional and no longer counted; only alt or decorative blocks activation; missing title is a warning.
- formatBytes from @/lib/format (NBSP).
Preview
- A file under 64 px either way is shown at min 96 px, pixelated, with "A very small file (W x H px), shown enlarged." (compact row gets the 96 px minimum, not the line).
Picker
- Chip rows bottom-align (chips + "Used in" in an mt-auto block; title min-h-10).
- Small images keep natural size capped to the box, min 2 rem, never stretched (class applied on AssetThumb, which I do not own).
- Zoom200/short screens: Search label sr-only, "Upload new" moves into the search row, Upload row dropped from the list, Filters disclosure loses vertical padding.
- Meta line keeps the NBSP (local metaOf).

## Acceptance (admin, UX-R3-P7b assets, dev server)
- Tick Decorative then Esc: checked true (audit) -> false, header "No unsaved changes", focus back on checkbox. Same with "Keep it described": true -> false. Confirm "Mark decorative": true, "Unsaved changes"; untick gives false.
- Picker tile chip-row bottoms (4 tiles, 1440): 589/551/551/568 (spread 38 px) -> 611/611/611/611 (0 px).
- ?lang=el at 1440, 1024, 768, zoom200: editable controls outside the fold/side column are only alt, title, caption, credits; Decorative and Name are in the fold (toggle "Other settings (all languages) Decorative image, Details"). Before: both live.
- Readiness after saving alt: blocker "English (default): no text yet" with header "2 to fix" then "1 to fix" -> "5 warnings, nothing blocks" in card, confirm and toast ("Activated. 5 warnings, nothing blocks"). Tab mark with alt only: "1 of 2" (title missing), same as library row.
- Picker zoom200: about 65 px of list, 1 partial row -> 1 full row plus a second two-thirds visible; list top y 278 -> 200.
- 1x1 preview in editor: 1 px -> 96x96 pixelated with the explanatory line. Picker thumbnails: 120x90 upscaled to 162x121 and 1x1 stretched to a block -> 120x90 natural, 1x1 at 32x32.
- axe (wcag2a/aa, 21a/aa): 0 violations on editor, editor with Decorative confirm open, and picker. Detector: []. Gate grep over the 3 files: nothing. check-css-tokens passes. vue-tsc: no errors in my files; remaining errors are in MapEditorView.vue and MediaView.vue (unused imports, missing formatDate), not my files, P6/P7a mid-edit.
- Keyboard run: Tab to Decorative, Space opens confirm, Esc returns focus to the checkbox. Forced colours: checked at 1440, focused Decorative box has a visible ring.
- Shots in ux-audit/round-3/implementation/P7b/after/: editor at 1440, 1024, 768, zoom200 (default, Greek, Greek-open), plus saved, activate-confirm, activated, tiny-image, forced-colours; picker at 1440, 1024, 768, zoom200 (before and after for 1440 and zoom200). I read only the 1440 and zoom200 shots (default, Greek-open, forced colours, picker zoom200). Probes in .../P7b/probes/ (mk.mjs uploads the four assets, ed.mjs, rd.mjs, pk.mjs, tiny.mjs, ids.json).
- e2e: no spec references my selectors, none edited; they cannot run here.

## Deferred or not covered
- Zoom200 picker: second row still partly clipped (dialog is 328 px tall there).
- Picker title wording "Choose an asset for primary image" comes from the callers' title prop (P4/P5).
- Picker in forced colours at 1024 and 768 not shot.
- AssetThumb.vue is P7a's and unchanged; the natural-size rule is applied from the picker by class.

## Notes for other packages
- G-043 answered by measurement: an asset with no title and alt text saved activated on the server without error. The backend does not block on title, so the client title blocker stays dropped.
- P7a: library row says "Unused" while editor and picker say "Not used yet"; use "Not used yet".
- platform/assets.ts: its formatBytes has no NBSP, so assetMeta is still affected. The picker uses its own metaOf. CLN or P7a can make assetMeta use @/lib/format.
- Test assets: "UX-R3-P7b one" is now ACTIVE with alt text; tiny, small and long are DRAFT.
