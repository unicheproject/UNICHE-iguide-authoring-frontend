# P7 Media (D-080)

Fixed: C1-107 (alt field at y 478-559 at 1280x720 with the preview beside it), C1-108, C1-110 (Describe now, close X), C1-111, C1-112 (Show more with focus and range), C1-113, C1-114, C1-115 (copy warning, two-line names), C1-116 (decorative above alt text with its effect; filename, size, duration under audio, video and PDF; checksum behind a disclosure with Copy; no "version 0" from this file), C1-117, C1-118 (list on ListTable, no 720 px minimum). C1-109 partly: the editor's Used in comes from the references list and states when the library count differs (G-030 is the backend fix). C1-34/C1-35 (Asset): shared TranslationsPanel, default-language text beside the target (D-079), structural controls n/a for assets.
Partly / not: preview does not stick at zoom200 (shell scroll container, see requests.md); "Needs translation" counts missing title or alt text; wrong-type Replace label reworded only.

## Files
Changed: `src/views/workspace/media/MediaView.vue`, `AssetEditorView.vue`; `src/components/media/AssetThumb.vue`, `UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `AssetPickerDialog.vue`; `src/workspace/useAssetUpload.ts`; `src/platform/assets.ts` (allow-list, duplicate check, `missingTextIn`, `assetMatches` language); `e2e/media.spec.ts` (button name "Upload files", "Duration:"; not run: needs Keycloak).
New: `src/components/media/AssetPreview.vue`, `DescribeNowDialog.vue`. Scratch: `P7/capture.mjs`, `keys.mjs`, `sticky.mjs`, `fixtures/`.
Not touched: `MediaSlots.vue` (still old markup; uses the new `AssetThumb` and picker props unchanged). D-080 appended; no Q entries (Q-015 covers the type policy).

## Behaviour
Library: toolbar from the scaffold (Pending hidden), status default "Not archived", sort with natural direction per key, URL keys `type alt unused decorative` beside the scaffold's. Upload: held rows (type, copy) need "Upload anyway" or Skip; Retry only for 5xx, 429, 408, platform down, limits not loaded; messages go to `role="log"` (also in picker and replace). `useAssetUpload` gains `log`, `confirmHeld`, `skipHeld`, option `existing`.

## Acceptance (1440/1280)
- "No alt text" filter: 11 tiles, 11 carry the chip ("Showing 11 of 11 files (56 in the library)").
- Upload of 2 PNG + .txt + .wav: log read "Uploading 4 files." / .txt held / three uploaded / "3 uploaded, 1 waiting for your decision."; duplicate PNG held as "looks like a copy"; Describe now saved alt text and the decorative path.
- Picker: initial focus Search (all viewports); keyboard run: type, Tab to tile, Space selects, status line "Selected: klepsydra. Alt text (en) present", Esc closes, focus back on "Add image". Dialog 868 px high at 1440x900, 328 px at zoom200 (tiles start below the folded filters; scroll inside).
- Editor 1280x720: alt field top 478, image box top 227 and stays (sticky checked after scroll at 1280 and 768).
- axe (serious/critical): only the header account and Project switcher buttons (P1's, requests.md); none from P7 markup after the log fix (the log re-checked on library only; upload and describe dialogs fixed from the first run's findings, not re-run).
- Typecheck: clean for P7 files (one error in another package's file). Detector and gate grep empty.
## Not verified
Forced-colours shot of library and editor taken only; no zoom200 upload-queue shots re-read; e2e not run; touch not tried; audio Play not exercised. Test records: `UX-P7` landscape/portrait/tone assets in Populated (alt text set on the landscape and portrait ones).
