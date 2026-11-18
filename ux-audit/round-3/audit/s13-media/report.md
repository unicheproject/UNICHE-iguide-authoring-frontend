# s13-media — Round 3

## Verdict
Media is close to shippable. The library, 503 and empty states, upload dialog, picker roving and focus handoffs all work, and forced colours is solid. One P1 remains: the "Decorative image" checkbox stays ticked after Esc or "Keep it described", while the model says nothing changed. There are also four contradictions in readiness, count and wording. Screens are held at 85 or below by the open P1.

Impeccable skill: Operate mode, interview steps skipped (I am a subagent). I did not open the `reference/*.md` files, so I cite no rule from them; this misses a brief requirement. I also did not read PRODUCT.md, DECISIONS.md or the specs; the context-check section below is empty for that reason.

## Context check
- Not done: I did not read the specs, DECISIONS.md or PRODUCT.md.
- D-094 (the Media worklist names what is missing) is the only fact I relied on. It comes from the P7a changelog.

## Scores (final-round, capped by the open P1)

| Screen / state | Task | Visual | Consistency | Copy | A11y | Responsive/state | Total |
|---|---|---|---|---|---|---|---|
| Library grid, list, filters, empty, loading, 503 | 22 | 16 | 12 | 12 | 13 | 9 | 84 |
| Upload dialog | 22 | 17 | 12 | 13 | 12 | 8 | 84 |
| Asset editor | 21 | 17 | 12 | 11 | 12 | 8 | 81 (cap 85, open P1) |
| Asset picker | 22 | 16 | 13 | 13 | 14 | 7 | 85 |

Nielsen heuristics for the group (0-4), in order: visibility of status 3, match with the real world 3, control and freedom 3, consistency 3, error prevention 3, recognition 3, flexibility 3, aesthetics 3, error recovery 4, help 3.

## Round-2 fixes verified

| C2 | Status | Evidence |
|---|---|---|
| C2-75 list overprint | fixed | `table` columns at 1440, 1280 and 1024 are 438-598 / 192 / 144 / 112 / 112; 0 overflowing cells; row height 72. At 768 `?view=list` renders cards, not a table. |
| C2-76 dialog focus | fixed | Opens on H2 "Upload files". |
| C2-77 "Upload anyway" label in name | fixed | Names are "Upload anyway, <file>" and "Skip, <file>". |
| C2-79 dialog density and wording | fixed | `role=log` is `position:absolute` with `aria-live=polite`; "Close" button; "Undo skip". The footer count omits the held file. |
| C2-51 worklist per-row text | fixed | Rows read "English: alt text, title missing"; the alt filter label follows the language ("No alt text in Italiano"). |
| C2-82 URL state and counts | partly | `view`, `alt`, `lang`, `missing` and `sort` all persist across reload. The count line ignores filters (R3-s13-04). |
| C2-83 minor | fixed | Toolbar hidden when the library is empty. |
| C2-21 skeleton | fixed | List skeleton has a thead. The grid skeleton has no count line, so cards sit at y 230 versus 265 when loaded (35 px jump, R3-s13-12). |
| C2-09 / C2-40 error and Clear filters | fixed | 503 shows "The platform is busy" and the request id, with no server text. Try again gets focus. Clear filters appears in the toolbar and as chips, with no duplicate button in the empty state. |
| C2-80 alt above the fold | fixed | Alt textarea top at 1024 is 575 of 768 and at 768 is 575 of 1024; 1440 is 371. At zoom200 it is 543 of 360, below the fold (the known accepted limit). |
| C2-81 "Used in" differs | fixed | Editor "6 resources" with a HelpHint. The hint text is generic ("The places that use this file are listed under Used in…"). |
| C2-78 picker | partly | One Tab stop in the grid (Search → Filters → Upload new → grid), and arrows, Home and End work. Focus after "Use this image" lands on Replace. At zoom200 the list shows one row (body 250 of 328 px). |
| C2-34 asset readiness | partly | Typing alt text clears the blocker at once. The blocker "English (default): no text yet" remains after alt is saved (R3-s13-02). |
| C2-55 language-independent controls | partly | Under the Ελληνικά tab, Decorative and Name stay enabled (R3-s13-07). Decorative sits in the text card. |
| C2-57 focus | partly | Fixed after Activate (lands on H2 Status), after Skip and Undo, and in the picker. Cancel, Cancel remaining and Retry drop focus to `<body>` (R3-s13-03). |
| R2-V-02/03/04/07 | not verified | Out of my remit. |

## Findings

**R3-s13-01 — P1.** Decorative checkbox ticks without the model.
- Screen: Asset editor, DRAFT asset `UX-R3-s13 one.png`. Viewport 1440.
- Evidence: `shots/editor__decorative-after-esc__1440.png`; script `ed6.mjs`.
- Steps: tick "Decorative image", then Esc the "Mark the image decorative?" dialog (or choose "Keep it described").
- Observation: the checkbox stays visibly ticked (`checked: true`), but the header still reads "2 to fix before activating", tabs still say "Missing", and the page says "No unsaved changes".
- Why it hurts: the author thinks the image is decorative while the app thinks it is not, so a blocker is hidden and the activation outcome is unclear.
- Recommendation: make the checkbox controlled, so that cancel or Esc restores `false` and the box follows the model.
- Likely files: `AssetEditorView.vue` and the Decorative confirm handler. Effort S.

**R3-s13-02 — P2.** Readiness contradicts itself.
- Screen: Asset editor, `UX-R3-s13 retry2.png`. Viewport 1440.
- Evidence: `shots/editor__active__1440.png`.
- Observation: alt text is saved, yet "Blocking: English (default): no text yet" and "Next missing: English" remain; the header says "2 to fix" then "1 to fix". Activation then succeeds with the toast "Activated. 1 to fix, 4 warnings". The header on the now-Active asset still says "1 to fix".
- Why it hurts: the author cannot tell whether the blocker is real.
- Recommendation: one definition (D-090). If title is not required, drop the blocker; if it is required, refuse activation. Phrase the toast without "to fix".
- Effort M.

**R3-s13-03 — P2.** Focus drops to `<body>` in the Upload dialog.
- Screen: Upload dialog, after Cancel, Cancel remaining or Retry, and after a Retry that succeeds. Viewport 1440.
- Evidence: `up3.mjs`, `up4.mjs`.
- Observation: the clicked button is removed and `activeElement` becomes BODY inside the modal (C2-57 remnant).
- Recommendation: move focus to the next row's action or to the "Choose files" button.
- Likely files: `UploadEntryRow.vue`, `UploadDialog.vue`. Effort S.

**R3-s13-04 — P2.** The count line ignores filters. Verified.
- Screen: Library. Viewport 1440.
- Evidence: `shots/lib__audio-noalt-empty__1440.png`, `shots/lib__forced-colors__1280.png`.
- Observation: "0 files (1 archived)" with Not archived selected; "Showing 48 of 50 files (1 archived)" with a filter on, where "(1 archived)" is the unfiltered figure.
- Recommendation: show "(1 more archived)" only when it is the same scope, or drop it while filters are active.
- Likely file: `MediaView.vue`. Effort S.

**R3-s13-05 — P2.** The Filters badge does not count every filter.
- Screen: Library. Viewport 1440.
- Evidence: `filt2.mjs`.
- Observation: `?alt=1` or `?type=AUDIO` shows plain "Filters". `lang` counts 1, and `lang` plus `missing` counts 2; alt, unused, decorative and type are not counted.
- Why it hurts: the badge understates what is applied.
- Recommendation: count every non-default filter, or drop the number since the chips already show them.
- Effort S.

**R3-s13-06 — P2.** Grid chips are not bottom-aligned.
- Screen: Library grid. Viewport 1440.
- Evidence: `shots/lib__grid-chiprow-misaligned__1440.png`.
- Measured: the chip row offset in one grid row is 254/254/254/224/231 px. A card whose chips wrap onto a second line ("meander-border", Decorative) sits 24-30 px off its neighbours. Picker tiles show the same raggedness (Active chip at y 438/476/455).
- Recommendation: `mt-auto` on the chip block with a fixed minimum title height, or reserve two meta lines.
- Effort S.

**R3-s13-07 — P2.** Asset language tabs keep Decorative and Name editable under Ελληνικά.
- Screen: Asset editor, Greek tab. Viewport 1440.
- Evidence: `shots/editor__greek-tab__1440.png`.
- Observation: the text says "applies to every language", yet the control is live under Greek.
- Recommendation: show them read-only with "Edit under English".
- Effort S.

**R3-s13-08 — P2.** Cold load takes about 3.3-3.9 s. The file listing is requested with `size=200&page=0`, and only 48 cards are shown.
- Screen: Library. Viewports 1440 to zoom200.
- Evidence: `lib.mjs`.
- Recommendation: page on the server, or reduce the first request to 48.
- Effort M.

**R3-s13-09 — P3.** Copy and format nits.
- Straight quotes in `Use "Clear filters" in the toolbar…` and `Do not begin with "image of"`.
- Limits show "20.0 MB" and "200.0 MB".
- The "Any upload / At most" row sits under the "Formats" column.
- Library says "Unused"; the picker and editor say "Not used yet".
- The picker title says "asset" ("Choose an asset for primary image").
- Footer reads "2 of 4 uploaded · 1 failed" and omits the held file, which the sr-only log does report.
- "Needs your decision" wraps to two lines next to the buttons.
- Effort S.

**R3-s13-10 — P3.** The Audio plus "No alt text" combination is explained only by chips.
- Screen: Library. Viewport 1440.
- Evidence: `shots/lib__audio-noalt-empty__1440.png`.
- Observation: it shows "No files match" with chips but no reason; audio cannot have alt text.
- Recommendation: add "Audio files have no alternative text."
- Effort S.

**R3-s13-11 — P3.** Size and unit break across lines.
- Screen: Picker tiles (`163 / KB`, `1.4 / MB`) and library grid ("69 / KB" for the floor plan; "757 B" wraps for the pdf).
- Evidence: `shots/picker__open__1440.png`.
- Recommendation: use a non-breaking space between number and unit.
- Effort S.

**R3-s13-12 — P3.** The Media grid skeleton omits the count line, so the grid shifts 35 px on load.
- Evidence: `shots/lib__loading-grid__1440.png`.
- Effort S.

**R3-s13-13 — P3.** The date format is date-only ("17 Nov 2026"), while the editor and other lists show date and time.
- Effort S.

**R3-s13-14 — P3.** Visual and wording nits.
- The Filters popover groups are uneven: "Type" is an inline label, "Search in" and "Sort by" are stacked labels, and "Needs attention" wraps to two lines with the label beside the first checkbox.
- The list row repeats the file name when no title exists (title in bold, file name below it).
- A 1×1 or tiny image gives a 1 px preview thumbnail in the editor and a stretched block in the picker; picker tiles stretch a 120×90 image.
- "Revision: Not saved yet" for an uploaded asset.
- Effort S.

**R3-s13-15 — P3.** Dialog positions jump.
- The Upload dialog's top edge moves (y 239, then 150, then 223) as rows are added.
- "Describe now" opens as a second dialog over the Upload dialog, so two dialogs are open (Esc returns to "Describe now (1)").
- Effort S.

## What works (keep these)
- The 503 state: "The platform is busy", a request id with a copy button, "Try again".
- The empty state, and the list skeleton with thead.
- Removable filter chips, and filters and view in the URL.
- The upload hold flow: too-big, wrong type and duplicate-name files are held with reasons; Upload anyway / Skip / Undo skip move focus correctly.
- Reduced motion drops the spinner. No horizontal scroll at any width.
- Forced colours is clean in the library and the picker.
- Disabled Replace file on an ACTIVE asset explains itself.
- Roving picker tiles with a "Selected" chip, and focus landing on Replace after "Use this image".

## Unverified / could not test
- The upload progress bar between 0 and 100 %; the mock holds at 0 %.
- A persisted "Save and finish" in Describe now.
- The server-side activation refusal: the client blocks it first, with a caption and an `aria-disabled` button.
- The forced-colours editor shot was captured but not studied.
- Long Greek names; only a Greek/RTL search string was run ("No files match", `Search: Ελληνικά عربى`).
- Hover states on controls.
- The 1024 and 768 picker shots were taken but not individually inspected.

Folder: `/mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/audit/s13-media/` (scripts and `shots/`, 41+ screenshots).
