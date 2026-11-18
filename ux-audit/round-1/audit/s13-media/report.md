# s13-media — Round 1

Screens: Media library (grid, list, search, filters, paging, empty/error/loading), Upload dialog, Asset editor (image, audio, video, PDF, archived, decorative), Asset picker (opened from a POI editor). Project `UX Audit – Populated` (37 assets at start); `UX Audit – Empty B` for first-run. Viewports 1440, 1280, 1024, 768, zoom200. Browser: Windows Node + Playwright, scripts `b1..b16.mjs` in this folder, shots in `shots/` (about 70). Created only `UX-s13-media …` assets (several duplicates from re-running upload tests; one image activated, one webm replaced). Impeccable interview steps skipped (subagent; the brief answers them). Mode: Operate.

## Verdict
The Media group is functional and tidy: axe reports zero violations on library, list and editor, the 409 conflict dialog, leave-without-saving guard, 422 link-to-field and the upload size/limit/retry flow are all good. But it is a "file cabinet", not a content-quality tool: the job that matters (give every image a text alternative in every language) is buried. The alt-text field sits at or below the fold on every viewport, the preview scrolls away while writing, there is no default text beside the target language, no translation state anywhere in Media, and no filter or sort for "missing alt text / untranslated / unused". Uploading ten images creates ten DRAFT "no alt text" assets with no way to describe them in a batch.
Score range: 70 to 78 (open P1s cap everything at 85).

## Context check
- `12-cms-experience.md` (Media library): the library shows `internalName`, type, dimensions or duration, size, status and a "used in" count; the editor carries translations of title, caption, `alternativeText`, credits, `transcript`.
- `14` §4: long operations (upload, package generation) announce progress and completion through a live region.
- `03` §1: deactivating or archiving a Resource that another references is rejected with `409 RESOURCE_IN_USE` (where-used first).
- DECISIONS.md D-032: "Replace file" only for a DRAFT Asset, through the upload queue with limit check, Retry and announcement (confirmed in UI: disabled with reason for ACTIVE).
- PRODUCT.md: the Translator needs to find untranslated work and see the default-language text beside the target.
- Impeccable rules cited: operate.md "Every interactive component has: default, hover, focus, active, disabled, loading, error"; audit.md Accessibility "Keyboard navigation: missing focus indicators, illogical tab order, keyboard traps" (focus loss in R1-s13-09 and 21); critique.md Hard Invariants "Viewable targets require browser inspection" (done) and the 0-4 heuristics guide.
- `impeccable detect --json` on `src/views/workspace/media/*.vue` and `src/components/media/*.vue`: no findings.

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| Library grid | 15 | 14 | 12 | 11 | 12 | 6 | 70 |
| Library list | 16 | 14 | 12 | 11 | 12 | 6 | 71 |
| Library empty (Empty B) / filtered-empty / error | 18 | 14 | 12 | 11 | 12 | 7 | 74 |
| Upload dialog | 18 | 15 | 12 | 11 | 11 | 7 | 74 |
| Asset editor (image) | 16 | 14 | 12 | 12 | 12 | 5 | 71 |
| Asset editor (audio/video/PDF/archived) | 17 | 14 | 12 | 12 | 12 | 6 | 73 |
| Asset picker | 18 | 14 | 12 | 12 | 11 | 5 | 72 |
Group range 70 to 74 as audited; ceiling 78 if the P1s are fixed and P2 half-fixed. Open P1s cap at 85.

Nielsen (0 to 4): 1 Visibility of status 3 (upload progress, status chips good; no translation state); 2 Match with real world 3; 3 User control 3 (cancel, retry, guard); 4 Consistency 3; 5 Error prevention 2 (no duplicate or type check); 6 Recognition over recall 2 (alt/translation state hidden, count mismatch); 7 Flexibility/efficiency 1 (no batch, no sort, no bulk alt text); 8 Aesthetic/minimal 3; 9 Error recovery 3 (409, 422 link, retry); 10 Help 3. Total 26/40.

## Findings

### R1-s13-01 — P1 — Alt text field is below the fold; the image scrolls away while writing it
Screen: Asset editor (image), all viewports. Persona: Content editor, Translator. Evidence: `shots/editor__image-draft-top__1440.png`, `editor__alt-focused-image-gone__1440.png`, `editor__image-draft__zoom200.png`. Measured top of the alt textarea: 841 px of 900 (1440), 909 of 720 (1280), 1152 of 768 (1024), 1032 of 1024 (768), 993 of 360 (zoom200).
Observation: preview card, facts grid and Replace/Download row (about 500 px) precede the Translations card. After the 422 the page jumps to the field and the image leaves the view; at 1280 the field is not visible on load.
Why it hurts: alt text describes the image; the author cannot see it while typing (the earlier-persona report is confirmed). Core job of this screen is reached last.
Recommendation: two-column editor: left sticky column (preview max 40vh, name, status, Activate/Archive), right column scrolling Translations first. Collapse facts into a one-line meta strip with "Details" disclosure; move Replace/Download into a toolbar over the preview.
Files: `AssetEditorView.vue`, `EditorShell.vue`. Spec: `14` §2 alternative text. Effort M.

### R1-s13-02 — P1 — No default-language text beside the target language; no per-language completeness
Screen: Asset editor, Greek tab. Evidence: `shots/editor__greek-tab__1440.png`, `editor__greek-typed__1440.png`. Tabs are English/Ελληνικά/Italiano; only an error triangle appears on a tab (English with error). No "complete / partial / missing" marker per language, no English reference text shown while writing Greek, no "copy default" aid.
Why it hurts: translators write blind; no way to see which languages of an asset are done (no Translations card in the sense of spec 12; earlier persona finding confirmed). Violates the PRODUCT.md Translator need and the "default text beside" expectation.
Recommendation: in non-default tabs render a read-only "English (default)" block above each field; put a completeness chip (text + icon) on each tab ("Ελληνικά - 1 of 3 filled"); an "Untranslated" summary in the Status card.
Files: `TranslationsPanel.vue`, `AssetEditorView.vue`. Spec: `12` Translation workspace; `14` §4 (state by text and icon). Effort M.

### R1-s13-03 — P1 — Library cannot find the work: no sort, no "missing alt text", "untranslated", "unused" filters
Screen: Library, 1440. Evidence: `shots/library__filters-open__1440.png`. The popover has Type and Status only; no sort control; order is newest-first with no label. The only alt-text signal is a pink chip per card. 37 assets, 2 pages.
Why it hurts: "which images still need alt text" is the readiness blocker (`14` §2) yet it needs scanning 2 pages. No way to clean up unused files or archived ones. The no-translation-state report is confirmed (no dot, no filter).
Recommendation: add filter groups "Needs attention" (no alt text in default language / missing translation in language X / unused / decorative) and a Sort select (Newest, Name, Size, Used in, Status). Show counts on the options ("No alt text 6"). Keep chips for active filters (already good).
Files: `MediaView.vue`, `FilterChoiceGroup.vue`, `platform/assets.ts` (`missingAlternativeText`). Effort M.

### R1-s13-04 — P1 — "Used in" count in the library disagrees with the editor
Screen: Library grid vs editor. Evidence: `shots/library__grid-bottom__1440.png` (acropolis-panorama: "USED IN 3") versus `shots/editor__image-used3__1440.png` ("USED IN 4 resources", four listed: two POIs, a Route, a Guide). Repro: open Media, compare card with its editor.
Why it hurts: trust in where-used before archiving; the user may believe an asset is used less than it is.
Recommendation: one source (the references endpoint count, or fix `usageCount` to include inline Guide bindings); show a hover/disclosure list of the first three users in the library row.
Files: `platform/assets.ts` (`usageCount`), backend if the count is server side (GAPS.md). Spec: `03` §1 `RESOURCE_IN_USE`. Effort S to M.

### R1-s13-05 — P1 — After uploading, every new image is DRAFT with no alt text and there is no way to describe them in one pass
Screen: Upload dialog and library. Evidence: `shots/upload__mixed-results__1440.png`, `library__after-upload__1440.png` (every new image has "NO ALT TEXT (EN)"). Result rows are plain text: no link to open the asset, no "Describe now" action, dialog has no close X (only Done).
Why it hurts: ten uploads mean ten round trips (library, open, scroll to field, type, save, back). The content editor does this daily.
Recommendation: after the queue finishes show "6 images need a text alternative: Describe them" which opens a stepper (preview large + alt/title/caption for the default language, Save and next with Ctrl+Enter); make each finished row a link to the asset.
Files: `UploadDialog.vue`, `UploadEntryRow.vue`, new batch view. Effort L.

### R1-s13-06 — P2 — Thumbnails crop with fixed 120 px height and `object-cover`
Evidence: `shots/library__grid-bottom__1440.png` (panorama 4200×1000, meander 1200×120, floor plans clipped at the top and sides, portrait 900×1600 cut), list thumb 36 px. Aspect is not visible, so wrong-shape images (a 120×90 "tiny-thumbnail", 10×10 file) are indistinguishable from good ones; floor plan labels are cut.
Recommendation: `object-contain` on a neutral checker background, or an aspect-ratio thumbnail (4:3) with a corner chip showing orientation/dimension warning. Thumbnails are the original files (presigned `/original`, up to 1.5 MB) in the grid: request a rendition if the API offers one (GAPS.md).
Files: `AssetThumb.vue`. Effort S.

### R1-s13-07 — P2 — Non-image types are identified by a 9 px text label only; list label clips
Evidence: `shots/library__grid__1440.png` (grey box "DOCUMENT/VIDEO/AUDIO"), `library__list__1440.png` ("OCUMEN" clipped in the 48 px thumb). Colour is not the only carrier (passes the gate) but there is no icon, no duration/waveform, no first-page preview, and 9 px type size.
Recommendation: type icon (image, speaker, film, file) plus label at 12 px; for audio show duration chip, for video poster frame (browser can derive), for PDF page 1 if cheap; stop clipping in list (use icon only with sr label).
Files: `AssetThumb.vue`. Effort S.

### R1-s13-08 — P2 — Ragged grid and 9 px chips
Evidence: `shots/library__after-upload__1440.png` (Greek 5-line name makes a card 330 px tall; row heights differ). Chips "USED IN n", "NO ALT TEXT (EN)", "UNUSED" are 9 px uppercase; at 100 % they are hard to read and the pink-on-pink chip is the one that matters most.
Recommendation: clamp names to two lines with full name in `title` and in the link's accessible name; fix card height; move "no alt text" to a 12 px warning line with icon; 11 px minimum for chips.
Files: `MediaView.vue`. Effort S.

### R1-s13-09 — P2 — Paging loses focus; count only at the bottom
Evidence: repro: library, Tab to bottom nav, activate "Next" on page 1 of 2; on page 2 Next becomes disabled and `document.activeElement` is the body. Range text "25 to 37 of 37" exists only below the list (`shots/library__page2__1440.png`). 24 per page although all 200 are already client-side.
Recommendation: show "37 files" under the toolbar always; on page change move focus to the results heading; or drop paging for infinite "Show more" or virtualised list. Keep Previous/Next as links with `aria-current`.
Files: `MediaView.vue`. Effort S.

### R1-s13-10 — P2 — Upload states limits per type but not accepted formats; any file is accepted
Evidence: `shots/upload__open__1440.png` (limits Image 20 MB … "Other 20 MB", no list of formats); `.exe` and `.txt` uploaded as OTHER/DOCUMENT (library shows `UX-s13-media tool.exe` OTHER). No "wrong type" refusal exists, so the brief's "wrong type" case cannot be reached for the library (only for Replace: refused with a clear message, `editor__replace-wrongtype__1440.png`).
Why it hurts: an author can put an executable into a visitor-facing library; limits are stated but not what is welcome.
Recommendation: show "Images (JPEG, PNG, WebP, SVG), audio (MP3, WAV, OGG), video (MP4, WebM), PDF, 3D (GLB)" as text above the limits and warn (not block) on OTHER; confirm if the product wants OTHER at all (QUESTIONS.md).
Files: `UploadDialog.vue`, `UploadLimits.vue`. Effort S.

### R1-s13-11 — P2 — Upload failure message hides the real reason and request id
Evidence: forced 503 `SERVICE_UNAVAILABLE` "Storage is unavailable." on the POST shows "The UNICHE platform is not reachable." (`shots/upload__mixed-results__1440.png`). No request id. Same on the library: forced 403 shows "You may not view media." without request id (`library__error-403__1440.png`); 502/503 shows the platform title with raw detail.
Why it hurts: brief rule "errors shown with their requestId"; wrong diagnosis (a 503 from the authoring API is not the platform being unreachable).
Recommendation: map by `code` and status; render `detail` plus "Request id …" in the row and error card, copy button.
Files: `useAssetUpload.ts`, `MediaView.vue`, shared error component. Effort S.

### R1-s13-12 — P2 — Live region is one overwritten string
Evidence: `useAssetUpload.ts` sets a single `announcement`; in the 10-file run only the last message was present (`~UX-s13-media Ένα … uploaded.`), earlier results (6 uploads, the failure) are replaced within milliseconds; two identical consecutive messages are not re-announced; no completion summary ("7 of 10 uploaded, 2 failed") is announced; start of upload and queue position are silent; progress 0 to 100 is only in the visual bar.
Recommendation: keep the polite region but queue messages (append into a log, `role="log"`), announce a single summary on finish and each failure (assertive for failures), announce "Uploading 3 files". 
Files: `useAssetUpload.ts`, `UploadDialog.vue`. Spec: `14` §4. Effort S.

### R1-s13-13 — P2 — No duplicate detection
Evidence: repeat uploads of the same file give identically named assets (`shots/library__after-upload__1440.png`, two "square.png", two Greek-named files); in the picker the names are truncated so the copies cannot be told apart (`picker__after-upload__1440.png`). A checksum is stored.
Recommendation: on upload compare filename+size (or checksum from the result) and offer "Already in the library: open it / upload anyway"; picker tiles show a second line with dimensions and upload date.
Files: `useAssetUpload.ts`, `AssetPickerDialog.vue`. Effort M.

### R1-s13-14 — P2 — Offline: Upload stays available and fails with an unrelated message
Evidence: `shots/upload__offline__1440.png`: offline banner is good, but the dialog opens and the row says "The size limits could not be loaded, so nothing was sent."
Recommendation: when `navigator.onLine` is false, disable Upload and Replace with "You are offline", or phrase the row "You are offline; nothing was sent. Retry when connected".
Files: `useAssetUpload.ts`, `MediaView.vue`. Effort S.

### R1-s13-15 — P2 — Validation feedback in the editor
Evidence: (a) after the 422 the alt textarea keeps the red error and "Is required …" while the author types a valid text (`shots/editor__alt-typed__1440.png`); (b) saving an empty Name shows the top summary but focus does not move to the field (`document.activeElement` had no id); (c) the activation 422 explanation is good and linked (`editor__activate-422-scrolltop__1440.png`) but uses the field message, not the "The image needs a text alternative" explanation.
Recommendation: clear a field error on input; focus the first invalid control after Save; lead the top summary with the plain-language sentence, then the links.
Files: `useResourceEditor.ts`, `EditorShell.vue`. Effort S.

### R1-s13-16 — P2 — Decorative flag: hidden at the bottom, no visible effect, no library marker
Evidence: `shots/editor__image-decorative__1440.png` (meander-border decorative asset still shows the full "Alternative text" field with the usual helper); flag is in "Details" below Translations; library card for meander-border shows no "decorative" text; Activation hint mentions it but the control is far away.
Recommendation: put the checkbox directly above the Alternative text field; when ticked, collapse/disable the field with "Decorative image: screen readers skip it"; add a "Decorative" chip in the library and filter.
Files: `AssetEditorView.vue`. Effort S.

### R1-s13-17 — P2 — Audio, video and PDF previews do not identify or describe the file
Evidence: `shots/editor__audio-draft__1440.png` (native player only: no waveform, title, transcript prompt; transcript sits two scrolls down in "More texts"), `editor__video-draft__1440.png` (no Duration fact for the webm; no captions/poster controls), `editor__pdf-draft__1440.png` ("Open the file ↗" link with no filename, size or page count; opens a new tab). Native players have focus rings and controls (good).
Recommendation: PDF: embedded first page or an icon card with filename, size, pages; audio/video: show transcript status ("Transcript missing") next to the player, since transcripts are an a11y requirement; read duration from the player when the API returns none.
Files: `AssetEditorView.vue`. Effort M.

### R1-s13-18 — P2 — Archived assets appear in the default library list although the editor says they are hidden from "default lists"
Evidence: `shots/library__grid__1440.png` (press-kit-2026.pdf ARCHIVED shown with "Any status"); editor text "Archived: hidden from visitors and from the default lists." (`editor__pdf-archived__1440.png`).
Recommendation: default Status filter to "Not archived" with a chip "Archived (1)", or reword.
Files: `MediaView.vue`, `EditorShell.vue`. Effort S.

### R1-s13-19 — P2 — Picker: focus, identification and a11y cues
Evidence: `shots/picker__open__1440.png`, `picker__after-upload__1440.png`. (a) Initial focus lands on the status chip "Any", not Search; (b) tile titles are truncated ("UX-s13-media portrai…") and meta "900 × 1600 …" too; (c) tiles do not show "no alt text" until selected (bottom bar then says "✓ Alt text (en): present"); DRAFT assets without alt can be picked; (d) scroll area shows about 2.5 rows at 1440×900; (e) after uploading from the picker the new asset is not selected, though it is what the author wanted. Good: Esc closes and returns focus to "Add image"; Space/Enter selects with `aria-pressed`; Tab stays in the dialog; a "Used in this resource" filter exists.
Recommendation: focus Search; two-line titles; chip "No alt text" on tiles with a link "Add alt text" (opens editor in new tab); auto-select the single uploaded file; make the dialog taller (90vh).
Files: `AssetPickerDialog.vue`. Effort S to M.

### R1-s13-20 — P2 — Picker and library at zoom200 and 768
Evidence: `shots/picker__open__zoom200.png` (dialog 295 px high in a 360 px viewport: only the filter rail is visible, the grid is out of sight below the first screen); `library__list__zoom200.png` (table min-width 720 forces horizontal scroll, so Name and Status are never visible together) and shared chrome (header, project switcher, Menu take about 310 of 360 px). Grid and editor reflow without horizontal page scroll at all five viewports (checked scrollWidth).
Recommendation: picker: stack filters above the grid in a horizontal strip at narrow/zoom widths; list: switch to card rows under 900 px; the chrome is the s7 remit (flag: collapse header into one 56 px bar when zoomed).
Files: `AssetPickerDialog.vue`, `MediaView.vue`, `styles/list-table.css`. Effort M.

### R1-s13-21 — P2 — Cold load and loading state
Evidence: first navigation to `/media`: 3.97 s to the first card on the dev server (asset list 0.9 s, languages 0.9 s; the rest is module compile and workspace boot, so a production build will be faster; unverified). The loading state seen is the whole-workspace skeleton (`shots/library__loading__1440.png`, header says "Select a project, Loading projects…"), not the library's own 8-tile skeleton (code has `aria-busy` "Loading media"). All 37 originals are requested as thumbnails.
Recommendation: render the library skeleton as soon as the project id is known; thumbnails from a small rendition.
Files: `MediaView.vue`, workspace shell. Effort M.

### R1-s13-22 — P3 — Small items
- Editor subtitle repeats the file name and shows "version 0" (`editor__image-draft-top__1440.png`): internal jargon; the title already equals the file name for uploads. Use "Image · 900 × 1600 · 1.4 MB".
- Checksum is truncated ("68d19a2e8e92…") with no copy button.
- Filtered-empty message ("No file matches the search or the filters.") does not name the filters or offer "Clear filters" (`library__filtered-empty__1440.png`; chip row has "Clear all").
- Grid cards: each link's accessible name is the concatenation of type label, name, meta and chips (long to listen to); give the link only the name and put chips outside or `aria-describedby`.
- Replace with a wrong-type file labels the failed row with the replaced type ("Video · 401 KB" for a PNG) (`editor__replace-wrongtype__1440.png`).
- Greek filename wraps fine in the card but is truncated mid-word in the upload row (`upload__mixed-results__1440.png`).
- Editor "Save" is visible and disabled until dirty (good), but "Unsaved changes" indicator appears only on edit; fine.

## What works (keep these)
- axe-core (wcag2a/aa/21aa): zero violations on library grid, list and image editor.
- Upload dialog: limits shown before any file (Image 20 MB … Any 200 MB), drag-drop and chooser, multiple files, two at a time with per-row progress bar (`role=progressbar`), queued state, per-file Cancel and "Cancel remaining", too-big file refused before sending with disabled Retry ("Exceeds the 20.0 MB limit for image files"), forced failure then Retry succeeded, Esc returns focus to Upload, focus stays trapped (Tab: Done, choose files, checkbox).
- Status by text and icon (check, circle, square), "unused" explicit; where-used list with links in the editor; Replace blocked on ACTIVE with the reason and a path (upload a new file); wrong-type replacement rejected clearly.
- 422 on Activate: summary with link to the field, request id, focus moved to the textarea; 409: per-field "Mine / Current" dialog; leave-with-unsaved guard; 404 asset page; offline banner; error cards with Try again for 403/404/502/503; empty library (Empty B) has a teaching message and an Upload button (`library__empty-B__1440.png`).
- Picker: only accepted types, no archived, Esc and focus return, `aria-pressed` selection, alt-text readout when chosen.

## Unverified / could not test
- Real OS drag-and-drop of files onto the page and the dialog (Playwright can only set input files); the "Drop to upload" overlay was not captured.
- Reduced-motion, forced-colors and touch variants; screen reader output (live-region findings are from code and DOM text).
- Production-build load time (dev server only). Upload of a file near 200 MB and the real progress percentages (local upload finished in under a second; delay was injected before sending, so only 0 % was observed).
- 3D model assets and the "Floor plan" upload flag (no such assets created); Translations of an asset for Italian were not saved.
- The Media library skeleton itself (the workspace skeleton shows first).
- Records created: `UX-s13-media` portrait (ACTIVE, with alt EN and EL), square (several), panorama, tone.wav, clip.webm (replaced once), leaflet.pdf, notes.txt, tool.exe, Greek-named png (several duplicates). Pre-existing records only opened; the POI used for the picker was left unsaved.
