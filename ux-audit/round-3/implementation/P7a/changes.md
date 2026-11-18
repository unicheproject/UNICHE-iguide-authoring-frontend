# P7a Media library and upload: changes

Status: all priorities are done except the Filters badge count, which needs a prop in P3-core's `ListToolbar` (request filed). `vue-tsc -p tsconfig.app.json` passes. `check-css-tokens` passed earlier in the session and was not re-run after the last two edits. `impeccable detect` returned `[]` on the six owned `.vue` files. The literal-gate grep returns nothing. Nothing was committed or installed. No D, Q or G entries were needed.

## C3 ids
- Fixed:
  - C3-09 (upload Cancel, Cancel remaining, Retry)
  - C3-47 (filter chips are `FilterChip`)
  - C3-78 (count line and "(N archived)")
  - C3-79 (grid card chips)
  - C3-80 (cold load)
  - C3-81 (NBSP in sizes, thumbnail minimum size)
  - C3-82 (Audio + "No alt text")
  - C3-88 (Describe now 422, "Needs your decision", limits)
  - C3-91 (grid skeleton)
  - C3-51 (date and time in the Updated column)
- Partly fixed:
  - C3-78: the Filters badge (R3-s13-05) is not fixed; it is in `ListToolbar`, so I filed request 1 in `requests.md`.
  - C3-99: the MediaView chips are now `FilterChip`. I left the Grid/List toggle on its current button variants.
- Not changed: "Describe now" still opens as a second dialog over the Upload dialog. I did not attempt to merge them.

## Files changed
- `src/views/workspace/media/MediaView.vue`
- `src/components/media/UploadDialog.vue`
- `src/components/media/UploadEntryRow.vue`
- `src/components/media/UploadLimits.vue`
- `src/components/media/DescribeNowDialog.vue`
- `src/components/media/AssetThumb.vue`
- `useAssetUpload.ts` and `e2e/media.spec.ts` are unchanged. No selector changed, so I did not edit the e2e spec.
- `ux-audit/round-3/implementation/requests.md` (section "From P7a", 4 items)
- Probes and screenshots are in `ux-audit/round-3/implementation/P7a/{probes,before,after}`.
- Test assets, all named `UX-R3-P7a ...` in the Populated project:
  - `tiny.png`
  - `narration.wav`
  - `hold 1.png`, `hold 2.png` and `hold 3.png`. I mocked 503 and aborted responses for the upload probe, so these assets were not all created. `hold 3.png` was created for real on its retry.
  - The `tool.exe` row was skipped, so it was never uploaded.

## What changed
- **Count line:** the "(N archived)" figure now counts files that pass every other filter. It is shown only while the status hides archived files and only when N is above 0.
- **Cold load:** the first request is `size=48`. It also supplies `totalElements`. The rest loads in the background with `listAssets`, merging in any file uploaded meanwhile. While it loads, the count line reads "48 of 118 files loaded". A failure of the background load shows a `ProblemAlert` with "Try again" and keeps the 48 files.
- **Grid card:** the title has a 2-line minimum height and the missing-text line sits above the chip row. The chip row is the last block (`mt-auto`), so chip bottoms align within a row.
- **Skeleton:** the count line has a same-height placeholder while loading, in grid and list views.
- **Wording and formatting:**
  - "Not used yet" in the library chip, filter label and cell (one constant).
  - Typographic quotes in "Use “Clear filters”..." and in the Describe now hint.
  - Sizes use the NBSP `formatBytes` from `lib/format` through a local `metaText`.
  - "Updated" shows date and time, like Places.
  - Limits read "20 MB", and the last limits row reads "Any upload / Every type above / 200 MB".
- **Empty state:** it shows "Audio files have no alternative text." when a non-image type is combined with the No alt text filter.
- **Thumbnails:** an image under 64 px on a side is drawn crisp, between 32 and 96 px, instead of stretched over the box. The Describe now preview has a 64 px minimum.
- **Focus (`focusSuccessor`, D-103):**
  - `UploadEntryRow` watches its state before the DOM changes. Cancel becomes Retry and Retry becomes Cancel, and focus stays on the row's new button. A finished row with no button hands focus to `focusSuccessor`, with `data-upload-choose` ("Choose files") as the fallback.
  - "Cancel remaining" moves focus to the first cancelled row's Retry, else "Choose files". This also covers the button vanishing when the last file finishes.
  - Removing a filter chip moves focus to the next chip. If the chip row moves, focus goes to the search field.
- **Describe now:** a 422 shows the platform's message at the Alternative text field, with `aria-invalid` and no "Try again". Other errors keep `ProblemAlert` and its retry.
- **"Needs your decision":** the status cell is `whitespace-nowrap`, so it stays on one line.

## Acceptance, measured (admin, Populated project, 1440; dev server)
| Item | Before | After |
|---|---|---|
| First `/assets` request | `size=200`, 134 KB, 2123 ms | `size=48`, 50 KB, 1533 ms |
| First tile visible | 2226 ms | 1711 ms |
| Chip bottoms in a grid row (spread) | 16 px in row 2 | 0 px in all 4 rows checked |
| Skeleton first card y, versus loaded y | 229 vs 265 (36 px jump) | 265 vs 265 (0 px) |
| Count with Audio + No alt text | "0 files (1 archived)" | "0 files" |
| Count with `type=DOCUMENT` | "9 files (1 archived)" | "9 files (1 archived)" (the archived file is a Document) |
| Count with `alt=1` | "Showing 48 of 55 files (1 archived)" | "Showing 48 of 55 files" |
| Count with `decorative=1` | "3 files (1 archived)" | "3 files" |
| Audio + No alt text, explanation present | no | yes |
| Limits text | "20.0 MB" | "20 MB" |
| "Needs your decision" height | wrapped to 2 lines (audit) | 17 px, 1 line |
| Dialog top (empty, with rows, with a held row) | 239, 150, 223 (audit) | 88, 88, 88 |
| Focus after Cancel on a queued row | `<body>` (audit) | row's Retry, in dialog |
| Focus after Cancel remaining | `<body>` (audit) | Retry, in dialog; next Tab reaches Close |
| Focus after a Retry that succeeds | `<body>` (audit) | previous row's Retry, in dialog |
| Focus after removing the first chip | not measured | search field (first run: `<body>`, fixed) |
| Describe now with a mocked 422 | alert with retry | message at the field, `aria-invalid=true`, "Try again" count 0 |
| List view date cell | date only | "18 Nov 2026, 10:15"; 0 overflowing cells at 1024 and 1440; row height 72 |
| Horizontal scroll | none | none at 768, 1024, 1440 and zoom200 |

## Not done or not measured
- Axe was not run.
- At 768 and zoom200, `?view=list` renders cards, not a table, so the list date check applies to 1024 and 1440 only.
- The forced-colours screenshots (`grid-forced`, `empty-forced`) are captured but I did not review them.
- The tiny-image behaviour was only looked at in the 1440 grid. I did not view it in the picker, which is P7b's.
- I did not re-run `check-css-tokens` after the last edits.
- e2e specs cannot run here.
- Progressive loading is a client-side workaround; real server paging is G-041.

## Requests to others (`requests.md`, "From P7a")
1. P3-core: `ListToolbar` needs a prop, for example `extraActive?: number`, added to `activeInside`. MediaView would then pass `:extra-active="extraFilters.length"`. Until then `?alt=1` and `?type=AUDIO` still show plain "Filters".
2. W0-A or CLN: `formatBytes` should drop ".0" for whole MB, so the `assets.ts` size-limit messages also read "20 MB".
3. W0-B or CLN: `assetMeta` and the local `formatBytes` in `platform/assets.ts` should re-export the NBSP `formatBytes`. I did not edit that file; P7b's note asking for it is the same request. After it lands, MediaView's local `metaText` can be removed.
4. `listAssets` has no small-first-page mode (G-041). MediaView does its own first request with `apiRequest` and calls `listAssets` afterwards.

## Notes for P7b
- The library says "Not used yet" in the chip, the filter and the cell.
- MediaView's "complete" and missing-text line still use `missingTextNames` from `assets.ts`, which I did not change.
