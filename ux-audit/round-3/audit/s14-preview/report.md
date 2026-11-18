# s14-preview, Round 3

Scripts, JSON dumps and shots are in `ux-audit/round-3/audit/s14-preview/` (`a1`..`a11.mjs`, `a*.json`, `shots/`). The Write tool refused `report.md`, so the report is returned inline.

## Verdict
The Preview page itself is close to shippable. Round-2 fixes hold, and measurements agree with the stated scales. Two P1 defects remain, both outside the main page:
- The new-tab route silently drops `orientation` and `real`, so "Open at real size" does nothing.
- The editor panel at 1280 and 1440 puts Close and Expand about 1,000 px below the picture, and Expand makes the picture vanish.

Skipped: interview steps (subagent), per the brief's Operate note.

## Context check
- `12-cms-experience`: the Preview is a labelled region with an inert stand-in. Verified: the tab order has no stand-in stops until Interact.
- `14` §4: labelled preview frame, chrome operable. Verified for the toolbar. Not met for editor-panel Close/Expand at 1280+ (R3-s14-preview-02).
- `03` §1: not used beyond the surface and trigger names.
- DECISIONS D-093: Fit width default, options hidden when equal. Verified at every width.
- PRODUCT.md: the author must see what visitors will see. Weakened by R3-s14-preview-01.

impeccable rules cited:
- `audit.md` accessibility: reduced motion needs an intentional alternative, and a global 0.001 s kill is flagged. The CMS uses 0.001 s transitions under `reduce`. State change is carried by colour, so this is acceptable.
- `critique.md` assessment A (design specificity and hierarchy): applied to the empty and error states.
- `polish.md` section 1 (classify the defect: token, one-off, mismatch, local): used below as "likely files".
- `operate.md` (product UI is tight and consistent): used for the toolbar alignment checks.

## Scores
Final-round caps apply (open P1 caps at 85).

| Screen | Task 25 | Visual 20 | Consistency 15 | Copy 15 | A11y 15 | States 10 | Total |
|---|---|---|---|---|---|---|---|
| Preview page | 22 | 16 | 12 | 12 | 11 | 8 | 81-85 |
| New tab (`app-preview`) | 17 | 15 | 11 | 12 | 11 | 8 | 72-78 (P1) |
| Editor "Preview in app" | 15 | 14 | 12 | 13 | 12 | 6 | 68-75 (P1) |

Nielsen heuristics (0-4): visibility of status 3, match with real world 3, user control 3, consistency 3, error prevention 2, recognition 3, flexibility 3, aesthetic and minimal 3, error recovery 3, help 2.

## Round-2 fixes verified

| ID | Status | Evidence |
|---|---|---|
| C2-09 | fixed | 503, 403 and 500 mocks on the Preview page show a sanitised sentence plus "Request id req-r3-s14-503 / Copy request id / Try again". The mock's raw `detail` never shows. `shots/preview__503__1440.png`. |
| C2-13 | unverified | The "Page not found" sub-path was not run. The new-tab missing Project shows a StateCard, focus on the h1 and title "Project not found · iGuide CMS". |
| C2-31 | partly | Toolbar jargon is gone, but 0 help buttons exist in the toolbar. "Working / Live" and "Fire a trigger" have no HelpHint (R3-s14-preview-07). |
| C2-50 | partly | The per-kind links `?missing=it` exist and navigate. The headline count is a `<summary>` and the links sit inside it (R3-s14-preview-12). |
| C2-57 | fixed | Reset moves focus to `#fire-trigger`. Retry focus still drops to body (R3-s14-preview-09). |
| C2-61 | fixed | `?trigger=<beacon>` selects Mobile and shows the chip. A draft QR and an active QR go to Web with the chip. Geo goes to Web. The unknown id and a non-UUID id both give the message. |
| C2-88 | fixed | The expanded bar no longer covers Apply changes. A new problem replaces it (R3-s14-preview-02). |
| C2-89 | partly | Fit width is the default: 1440 Web 88 %, 1024 Web 75 %, Kiosk 89 %. Expand exists at every width, but at 1280+ it is far below the picture (-02) and at 1024 and below it does nothing (-03). |
| C2-90 | fixed | Kiosk Fit at 1440 is 100 %, at 1280 93 %, at 768 68 %. "100 %" is hidden when equal to Fit (1440 Kiosk portrait). Mobile says "Fits at real size". |
| C2-91 | fixed | Idle Tab order is Open in new tab, tablists, Filter, select, Fire, Skip, Size, Interact. No stand-in stops. The first Esc returns focus to Interact (`aria-pressed` false). In the editor panel the second Esc closes it and focus goes to "Preview in app" (1024 and 1440). CDP AX tree not re-run. |
| C2-92 | fixed | Picture starts at y 354 (Web/Kiosk) and 337 (Mobile). The toolbar is 117.8 px, two rows, at every width. Interact is 40 px, or at least 44 px on touch. The Filter field appears above 8 triggers. |
| C2-93 | n/a | QR is not in this remit. |

## Findings

### R3-s14-preview-01 · P1 · New tab ignores `orientation` and `real`; "Open at real size" does nothing
Screens: `/app-preview`, and the Preview page's "Open in new tab". Viewport 1024 and 1440.
Evidence: `shots/newtab__real-size-click__1024.png`, `shots/newtab__from-preview-kiosk-landscape__1024.png`, `a8.json`.

**Observation**
- The router `props` function (`router.ts` lines 21-28) passes only surface, lang, mode and t.
- Ticking "Open at real size" sets `?real=1` and the box shows checked. The frame stays at scale 0.775 (992 px), where real size is 1280.
- The Preview page opens the new tab with `orientation=landscape` for Kiosk. The popup frame is portrait (992 × 1766, scale 0.919).
- `?surface=KIOSK&orientation=landscape&real=1` renders 1080 × 1922, portrait.

**Why it hurts:** a control that claims an effect and does nothing, and a link that opens a different picture than the one the author was looking at.

**Recommendation:** pass `orientation: route.query.orientation` and `real: route.query.real` in the route's props. Add an e2e check for the checkbox.
Likely files: `src/router.ts`, `src/views/AppPreviewView.vue`. Effort S. Spec: `12` §3.

### R3-s14-preview-02 · P1 · Editor panel at 1280 and 1440 sits above its buttons; Expand makes the picture vanish
Screen: POI editor → "Preview in app".

| Viewport | Panel top | Close / Expand y | After Expand |
|---|---|---|---|
| 1440 | 309 | 1305 | panel region y -686, off screen |
| 1280 | 309 | 1179 | panel region y -659, off screen |

- Expand scrolls the editor body down, and focus lands on "Collapse" at y 598 / 556 with no picture in view. The page scroll in the measurement stayed at 0 because the editor body scrolls inside its own container.
- At 1024 and below the panel is correctly under its buttons (y 240).
- At 1280+ the panel opens at the top of the content, not "below its button".
- Evidence: `shots/editor-panel__open__1440.png`, `shots/editor-panel__expanded__1440.png`, `a6-1440.json`, `a6-1280.json`.

**Why it hurts:** the author cannot reach Close or Expand without scrolling past the picture, and Expand discards the view.

**Recommendation:** put Close and Expand in the panel's own header, next to the Surface tabs. Do not scroll on Expand; keep the panel top in view with `scroll-margin-top`.
Likely files: `ResourcePreview.vue`, the editor shell (`PreviewPanel.vue`). Effort S-M.

### R3-s14-preview-03 · P2 · Expand is a no-op at 1024 and below
At 1024, 768 and zoom200 the region and frame rectangles are identical before and after (958 × 680 and 702 × 520, same scale). Only the label flips to "Collapse" and focus moves there.
Evidence: `a6-1024.json`, `a6-768.json`.
**Recommendation:** hide Expand when the panel is already full width, or make it increase the picture height.

### R3-s14-preview-04 · P2 · The picture jumps when the view changes
Measured on the Preview page:
- Web and Kiosk picture at y 354. Mobile at y 337: -17 px, because the Size tabs become 12 px "Fits at real size" text. The toolbar also shrinks 306 → 289 once the beacon note is gone.
- An unknown-trigger note pushes the picture to y 387 (+33).
- At 768 the picture is at y 364, 401 or 412 depending on the Kiosk orientation and size, because the caption wraps to 1-3 lines.
- Evidence: `a2.json`, `shots/preview__deeplink-unknown__1440.png`.

**Recommendation:** reserve a fixed-height caption row (`min-h` for 3 lines at 768, 1 line otherwise). Keep the Size row's height when it holds text. Put the note inside the toolbar's note row.
Likely files: `PreviewPane.vue`, `PreviewSize.vue`, `PreviewView.vue`. Effort S.

### R3-s14-preview-05 · P2 · Tab-strip focus ring is clipped
`TabsList` has `overflow:auto` with clientHeight 39 against scrollHeight 40. The 2 px / 2 px offset ring shows only as left and right bars. Measured gaps for the focused Mobile tab: top 0, bottom -1.
Evidence: `shots/preview__tab-focus__1440.png`.
**Recommendation:** `overflow: visible`, or a ring drawn inset (`outline-offset: -2px`), or padding inside the list. Likely file: the shared `ui/tabs` component. Effort S.

### R3-s14-preview-06 · P2 · The purple focus ring is invisible on the stand-in's navy header
Computed `outline: 2px solid rgb(76,29,139)` on `rgb(16,36,63)` is 1.38:1. A keyboard author who clicked Interact cannot see where focus is on the header controls.
Evidence: `shots/preview__interacting-focus-ring__1440.png`.
**Recommendation:** inside the frame use an outline from the theme `on-primary` colour, or a two-tone ring. Effort S.

### R3-s14-preview-07 · P2 · No HelpHint on "Working / Live" or "Fire a trigger"
The toolbar has no help control. "Working" versus "Live", and what firing a trigger does, are explained only by the status line under the picture. Effort S.
Likely files: `PreviewControls.vue`, `FireTrigger.vue`, `lib/glossary.ts`.

### R3-s14-preview-08 · P2 · Empty Project: a dead end with jargon
On a pristine Project (mocked empty lists), the stand-in says "Nothing to show yet in this mode." with no action and no mention of how to add content. Live mode says the same, and so does the new tab.
Evidence: `shots/preview__empty-project__1440.png`, `shots/preview__empty-live__1440.png`, `shots/newtab__empty-project__1440.png`.
**Recommendation:** outside the frame, add "Nothing is published yet" with links to Places and Launch. Say "No active content yet; switch to Working to see drafts" in Live. Effort S.

### R3-s14-preview-09 · P2 · Retry loses focus; the Preview title is not state-aware
After 503 → "Try again" succeeds, `document.activeElement` is `BODY`. The error card never takes focus either.
The Preview page's `document.title` stays "Preview · …" on 503, while the new tab titles each state.
Evidence: `a9.json`.
**Recommendation:** after retry, focus the h1 or the toolbar. Mirror the new tab's titles. Effort S.

### R3-s14-preview-10 · P3 · The toolbar card is 4 px wider each side than the content column
Toolbar x 252 to 1420 against the heading and region at 256 to 1416 (`-mx-1`). The card edge does not align with the picture below.
Evidence: `a10.json` "columns". Effort S.

### R3-s14-preview-11 · P3 · Caption nits
- "Shown at 48 %" breaks between the number and "%" at zoom200 (`shots/preview__default__zoom200.png`). Use U+00A0 in the scale text, "100 %", "50 %" and the tab labels.
- The caption source has a double space after "800." (invisible, but `{{ " " }}` plus markup doubles it).

### R3-s14-preview-12 · P3 · Missing-titles disclosure
- "163 missing titles in Italiano" is a 14 px bold `<summary>`; the per-kind links appear only after opening it.
- The sr-only link text reads "list of point of interests".
- The list mixes 14 px rows under a 12 px block.
- The count is not a link, though each kind has one.

**Recommendation:** make "Show them in the list" per kind the visible row. Fix the plural: `kind.toLowerCase()` plus "s" gives "point of interests".
Evidence: `shots/preview__missing-titles-open__1440.png`, `a5.json`.

### R3-s14-preview-13 · P3 · "Skip preview" skips nothing while the picture is idle
It is an extra Tab stop (6th) that jumps focus to the "End of preview" marker. Nothing focusable follows when there are no missing titles, so the next Tab leaves the page. Show it only while interacting. Effort S.

### R3-s14-preview-14 · P3 · The unknown-trigger note
- It is a 14 px brown (`rgb(122,75,0)`) sentence between the toolbar and the caption, with no icon and no dismiss.
- `?trigger=` stays in the URL after Reset, so a reload fires again. Replace the query once handled.
- The text reads well: "The trigger from the link was not found. It may have been archived or deleted."

### R3-s14-preview-15 · P3 · New-tab chrome
- The scale is not stated anywhere. "Fit" gives 0.475 at zoom200, but the author is never told.
- The control bar wraps to 124 px at 768 and 143 px at zoom200 (40 % of the 360 px window).
- The invalid-parameter messages echo the rejected `lang`, `surface` and `t` values as text (Vue-escaped; `<script>` shows literally). BRIEF says rejected values are never echoed in errors; here they are echoed in warnings.
- `<html lang>` stays "en" under Greek and Italian content (the frame itself carries `lang`).
- Positives: Back leaves the page (the app uses `router.replace`), and the titles are per state.

### R3-s14-preview-16 · P3 · The trigger select truncates while the chip does not
The select shows "Bluetooth beacon, Excavated Athen" at 384 px while the "Fired:" chip beside it shows the full name. Allow the select to grow, or keep the chip as the full name. Effort S.

## What works (verified)
- Scale labels match the measured frame. Frame width over real width: 1160/1280 = 0.906 is "91 %", 736/1280 = 0.575 is "57 %", 608/1280 = 0.475 is "48 %".
- `scrollWidth` equals `clientWidth` on the page at all five viewports. Scrolling sideways happens only inside the frame, with `role=group` and a label.
- Mobile "Fits at real size". "100 %" hidden when equal to Fit.
- `?trigger=` for a beacon selects Mobile and fires. Draft items force Working.
- Reset returns focus to the select. The chip is not truncated.
- Region label announces "Preview: Web, English, working content". The Greek and Italian stand-ins render with dashed outlines for missing texts.
- Forced colours: selected tabs are Highlight (rgb 55,0,110 / white), and the chip and Reset keep borders. `shots/preview__forced-colors-fired__1280.png`.
- Reduced motion: transitions are 0.001 s, with no running animations. Normal motion shows only 120 ms colour fades on tabs, and no frame transition.
- Touch at 1024: the CMS controls reach 44 px. Only stand-in controls are smaller, which is expected.
- New tab: per-state titles. A missing Project gets a StateCard with focus on the h1. The 503 is sanitised, with a Copy request id button.
- Editor panel: Fit width default, Kiosk 89 % at 1024. The Esc order is correct (Interact, then close).

## Unverified / could not test
- The C2-13 sub-path "Page not found".
- The CDP AX tree (the Tab order was used instead).
- The label/control baseline delta (the 12 px labels sit centred with the 16 px tab text; measured centres 202.5 against 203).
- Offline mode.
- RTL (the Project has no RTL language).
- Hover and active states beyond the disabled Fire hover (`shots/preview__fire-disabled-hover__1440.png`).
- Editors other than the POI.

## Counts
P0 0 · P1 2 · P2 7 · P3 7.
C2 fixes: fixed 7 (C2-09, 57, 61, 88, 90, 91, 92), partly 3 (C2-31, 50, 89), not fixed 0, regressed 0, unverified 1 (C2-13), n/a 1 (C2-93).
