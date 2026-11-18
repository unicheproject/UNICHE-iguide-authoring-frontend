# p4-kiosk — Round 3 (kiosk operator and on-site tablet author)

Account `admin`, Project `UX Audit – Populated`. Chromium via `ux-audit/tools/session.mjs`; coarse pointer through CDP (`Emulation.setEmulatedMedia pointer:coarse`) plus `hasTouch`; swipes through CDP `Input.dispatchTouchEvent`. Scripts `a1…a11, t0…t8, k1` and 60+ shots are in this folder. No records were created or saved; every edit (a floor-plan pin) stayed unsaved on a pre-existing plan.

## Verdict
The Preview page and the trigger card are close to shippable: the scale label matches the measured frame to the pixel, "Test in preview" now selects the surface and fires, Esc/Interact/Skip work, the toolbar aligns to the pixel, and the tablet basics (drawer, ⋮ menu, dialogs, map swipe, floor-plan placement by touch) all work. What keeps it under 90 is on the tablet: the editor loses "Save draft" on a landscape iPad, the list/dashboard text links are still 18-21 px under a finger, the 1440 "Preview in app" panel has its Expand/Close buttons a screen and a half away, and the armed floor-plan prompt covers the plan. No P0/P1.

Impeccable: mode Operate; interview steps skipped (subagent). Rules cited: critique.md "Assessment A and B are both required" (I used measurement for B); audit.md "Check what's measurable and verifiable" (all values below are measured); polish.md "A detector result is defect evidence, not proof of quality. Inspect the rendered experience" (every shot was viewed); operate.md "strangeness without purpose" (the toolbar and controls pass: familiar tab groups, no oddities).

## Context check
- `12` §3: "Preview in app" is a panel below the action; Preview page has surface, language, trigger fire. 
- `14` §4: 44×44 touch targets (line ~119), labelled preview frame, chrome operable while the frame has focus.
- `03` §1: ACTIVE items are edited through a Working Copy (Save draft / Apply / Discard); the banner shows it.
- DECISIONS: D-093 (Preview toolbar, Kiosk Fit width), D-095 (Expand = as tall as the window allows).
- PRODUCT.md: tablets are first-class authoring devices.

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| Preview page 1440 (Kiosk/Mobile/Web, fire, Reset, Interact, Skip) | 23 | 18 | 13 | 13 | 13 | 8 | 88 |
| Preview page 1024/768/zoom200 | 22 | 17 | 13 | 13 | 13 | 8 | 86 |
| Open in new tab (`?surface/lang/mode/t/trigger`) | 23 | 17 | 13 | 14 | 13 | 8 | 88 |
| POI editor "How visitors reach it" (QR, Copy, Download, Test, beacon) | 22 | 17 | 13 | 13 | 13 | 8 | 86 |
| "Preview in app" panel 1440 | 19 | 16 | 12 | 13 | 13 | 7 | 80 |
| "Preview in app" panel 1024/768 | 22 | 17 | 13 | 13 | 13 | 8 | 86 |
| Tablet: nav drawer, list cards, ⋮ menu, create dialog | 23 | 18 | 14 | 14 | 12 | 9 | 90* |
| Tablet: editor on short screen | 19 | 17 | 13 | 13 | 13 | 7 | 82 |
| Tablet: map editor (swipe, Move map) | 22 | 17 | 13 | 14 | 12 | 8 | 86 |
| Tablet: floor-plan placement by touch | 20 | 16 | 13 | 12 | 13 | 8 | 82 |
*Not 90+ in final: touch targets on the list titles (R3-p4-kiosk-02) are open, and not every state of the drawer/dialogs has a keyboard run; counted 88.

Nielsen (0-4): visibility 3.5, match 3.5, control/freedom 3.5, consistency 3.5, error prevention 3, recognition 3.5, flexibility 3, aesthetic 3.5, error recovery 3, help 3.5.

## Round-2 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C2-61 Test in preview fires | fixed | QR link → `/preview?trigger=<id>`: Web selected, select = "QR code, UX-p1-editor Alpha Kouros", chip "Fired: …", focus on h1. Geo → Web, beacon → Mobile. Unknown id → "The trigger from the link was not found. It may have been archived or deleted." (`preview__trigger-bad__1440`). |
| C2-88 expanded panel covers Apply changes | fixed | `elementFromPoint` on Apply = Apply at 1440/1024/768, open and expanded. |
| C2-89 Preview in app 24-29 % / no Expand on tablet | fixed | Web 88 % at 1440, 75 % at 1024, 55 % at 768; Expand exists at every width. |
| C2-90 Kiosk Fit / duplicates | fixed | Kiosk Fit width 1440 = 100 % (frame 1080 in 1160), 1024 = 92 %, 768 = 68 %, zoom200 = 56 %; "100 %" hidden when equal to Fit. Caption vs measured `data-scale`: all 12 cases agree (0.906 → 91 %, 0.919 → 92 %, 0.775 → 78 %, 0.575 → 57 %, 0.475 → 48 %). |
| C2-91 Esc / inert | fixed | Interact → Tab enters frame → Esc: focus on "Interact with the preview". |
| C2-92 picture below the fold, 3 rows at 768 | fixed | Picture at y 354 (Web/Kiosk) / 337 (Mobile) at 1440; toolbar 2 rows at 1440 and 768; subtitle one sentence. |
| C2-93 QR 128 px, print size | partly | QR drawn 118 px; caption "Download PNG (512 × 512 px)" states pixels, not a print size; link still 12 px mono and breaks mid-word (R3-p4-kiosk-13). |
| C2-57 focus after Reset | fixed | After Reset focus is on the trigger select. |
| C2-84 / C1-99 swipe over map | fixed | Default `touch-action: auto`: a CDP swipe over the map scrolled `main` 0 → 185. "Move map" sets `touch-action: none`, swipe pans (markers moved 105 px for a 120 px drag), page does not scroll. |
| C2-01 touch targets | partly | Icon-only ⋮, HelpHint, Copy/Download, map buttons are ≥ 44 under coarse. Row title links 21 px, Dashboard links 18 px, logo link 26 px, sort headers 32 px, Leaflet attribution 15 px, visibility checkboxes 24 px (34 on one map), "Runs on" checkboxes 16 px remain. |
| C2-05 sticky stack | partly | Short screens now keep only the 56 px header sticky (768×600, 1024×768, 1024×480); tall 768×1024 keeps header + 42 px banner. Side effect in R3-p4-kiosk-01. |
| C2-12 toasts | partly | One announcement and no duplicates, but see R3-p4-kiosk-06. |
| C2-50 missing-title links | not tested | Preview showed "No missing titles in English." only. |
| R2-V-02 HelpHint 32 px (fine pointer) | not fixed | "What is a Working Copy?" 32×32 at 1440; coarse = 44. |
| R2-V-03 sticky 23 % | not fixed (as accepted) | POI editor 1440: header 56 + header 56 + banner 42 = 154 px. |
| R2-V-04 toast overlaps form column | not fixed | Toast right edge x 996 vs form column 992 at 1440. |
| R2-V-07 editor height | not measured | |

## Job walk
| Job | Result | Time / hesitation |
|---|---|---|
| Preview Kiosk first, then Mobile, Web; size and scale | pass | ~1 min; none (scale label accurate). Picture jumps 17-68 px between surfaces (-07). |
| Language, Working vs Live | pass | Live hides 18 draft triggers and says so. |
| Fire QR / geo / beacon, chip, Reset | pass | Beacon only offered on Mobile ("6 beacon triggers not offered: beacons only work on Mobile."). Stale "Opened by QR…" under a Geo fire (-11); chip shrinks the select (-09). |
| Interact / Esc / Skip preview | pass | Skip link lands on "End of preview". |
| Open in new tab with `?surface/lang/mode/t/trigger` | pass | `?lang=EL` case-insensitive, `?t=` fires and says so in Greek, bad params explained in a notice. The button on the CMS page does not carry a fired trigger (by design). |
| QR print, copy, download, test | partial | Copy, Download (`qr-av54v8fy.png`, 512 px) work; no print size (-13); toast covers neighbours (-06). |
| Preview in app panel at 1440/1024/768 | partial | 1440: Expand/Close 1050 px below the panel (-03). |
| Tablet: drawer, cards, ⋮, dialogs | pass | Drawer 320 px, all 18 items 44 px, Esc/tap-away/link-tap close it; ⋮ 44×44, menu items 44 px; create dialog footer sticky at 768×600 and inline at 768×360. |
| Tablet: editor on short screen | partial | Save draft scrolls away (-01). |
| Tablet: map swipe and Move map | pass | |
| Tablet: floor-plan placement by touch | partial | Works on empty area; prompt covers plan (-05). |

## Findings

### R3-p4-kiosk-01 · P2 · Save draft and Discard leave the screen on a landscape tablet
Screen: POI/Floor-plan editor (ACTIVE) · 1024×768, 768×600, 1024×480, touch · Evidence: `shots/poi-editor__scrolled-touch__1024x768.png`, `t3.mjs`. At 1024×768 after scrolling 700 px the only sticky element is the 56 px header (Apply changes + ⋮); the Working Copy banner (Save draft, Discard) is `position: static` and sits at y −516. It is sticky only at 768×1024.
Why: the iPad's normal landscape size loses Save draft after the first scroll, and with the on-screen keyboard (about 768×400) the author must scroll to the top to save.
Fix: when the banner is released, add a compact Save draft icon+label button to the sticky header (or keep the banner sticky at ≥ 700 px height and release it only below 500 px). Files: `EditorShell.vue`. Spec: `14` §4 chrome operable; D-089. Effort S.

### R3-p4-kiosk-02 · P2 · Text links under a finger are 18-21 px (C2-01 residual)
Screens, coarse pointer, 1024 and 768: Dashboard 49 of 77 controls < 44 px (item links 18-21 px); POI list rows 51 of 263 (title links 21/42 px high, tight 8 px gaps), Places 17/24, Routes 13/19, Maps 8-10 (title links 18 px), Floor plans 9-11; header logo link 123×26 on every screen; sort header buttons 32 px; Map editor 34 visibility checkboxes 24×24 and Leaflet links 15 px; POI editor "Runs on" checkboxes 16×16 (label text widens the hit area but the box itself does not), QR/Geo summary links 18 px; new-tab "Open at real size" checkbox 24 px. Measured by `t1.mjs`. ⋮, HelpHint, tabs, buttons and drawer items all pass.
Why: the main route into a record on a tablet is a 21 px line of text. Fix: `min-h-control` hit area (padding or `::after`) on `ListTable` title links, Dashboard item links, logo link, sort buttons; 44 px label row around checkboxes (`pointer: coarse`). Files: `ListTable`, `listRows.ts`, Dashboard components, `ui/checkbox`, `AppHeader`. Spec: `14` line 119. Effort S-M.

### R3-p4-kiosk-03 · P2 · 1440 "Preview in app": Expand and Close preview are 1050 px below the panel
POI editor ACTIVE (Excavated Athenian Neighbourhood) · 1440×900. The panel opens at y 231, but "Close preview" / "Expand" stay in the side column at y 1281. Clicking Expand scrolls `main` by 978 px and the panel ends at y −747 (collapsed again: −591). `a9.mjs`, `shots/poi-preview-panel__after-expand-click__1440.png`.
Why: the author clicks Expand and the picture vanishes; Close is only reachable by scrolling or Esc. Fix: put Expand and Close in the panel's sticky "In the app" bar (next to the surface tabs), or scroll the panel into view after the toggle. Files: `EditorShell.vue` L626-631, `PreviewPanel.vue`. Effort S.

### R3-p4-kiosk-04 · P3 · Expand does nothing when the content already fits
768×1024: panel 671 px before and after Expand (max-h 70dvh = 716). Also at 1440 with short content. Hide or disable Expand when `scrollHeight <= clientHeight`.

### R3-p4-kiosk-05 · P2 · Armed floor-plan prompt covers the plan; tapping a pin while armed is a silent no-op
Floor-plan editor ACTIVE · 1024×768 touch. After tapping "Place …" the blue card ("Tap the plan to place …", Place near the centre, Cancel) sticks over the lower plan: y 517-660 of 768 (19 %), so those plan pixels cannot be tapped while armed. A tap that lands on pin 1 (0.29, 0.43) does not place the armed item: the live region says "Parthenon Frieze – North Side moved to x 0.29, y 0.43" and the armed state stays. Tapping an empty area works ("placed at x 0.6200, y 0.2009", Unsaved changes). Copy "Without a pointer, place it near the centre" is wrong on touch (a finger is the pointer). `t6.mjs`, `t7.mjs`, `shots/fp-editor__armed__1024-touch.png`.
Fix: dock the prompt in the sticky header or top of the plan card, not over it; while armed ignore taps on pins (place at the tap point) or say so; copy "Prefer buttons? Place near the centre, then move it with the arrow keys or the x and y fields." Files: floor-plan editor placement component. Effort S-M.

### R3-p4-kiosk-06 · P3 · "Link copied" toast is 110 px tall (full URL) and covers neighbours; 4 px overlap at 1440 remains
Measured toast 384×110: 1440 covers the "Runs on … Kiosk" checkbox (`poi-triggers__copied-toast__1440.png`), right edge 996 vs form column 992 (R2-V-04); 1024 covers "Open link (new tab)"; 768 covers "Test in preview / Remove" of the next trigger. Fix: toast text "Link copied" only (the URL is already on the page), inset to clear the column. Files: `TriggersCard.vue`, `AppToast.vue`, `toastOffset.ts`.

### R3-p4-kiosk-07 · P3 · Picture jumps when the surface changes
Picture top (y) by surface, Kiosk/Mobile/Web: 1440 354/337/354; 1024 366/349/366; 768 417/349/372; zoom200 395/337/381 (`t8.mjs`). The Surface tab does not move, the frame shifts 17-68 px (the "N triggers are not offered" line and the Size row come and go). Reserve a fixed status row.

### R3-p4-kiosk-08 · P3 · Toolbar card is 4 px wider each side than the content
Card x 252-1420, h1 / frame / Interact x 256-1416 at 1440 (`a10.mjs`, `preview__default__1440.png`). Align the card edge to the 256/1416 column. Labels and tabs themselves are centred to the sub-pixel (label cy 202.5 = tab cy 202.5; Fire label 246 = field 246).

### R3-p4-kiosk-09 · P3 · The trigger select shrinks and the Fire button moves after firing
Idle: select x 505-889 (384 wide); after a beacon fire it is about 300 wide and shows "Bluetooth beacon, Excavated Athen", Fire moves 897 → 814 as the chip and Reset appear. Fix: give the chip its own row, or keep the select width fixed.

### R3-p4-kiosk-10 · P3 · Size caption names controls that are not there
At 50 %: "Choose Fit or 100 % for a closer look." The tab is called "Fit width", and Kiosk at 1440 has no "100 %" tab. Say "Choose Fit width for a closer look."

### R3-p4-kiosk-11 · P3 · Mixed state after a Geo fire
Fire QR on Web, then Geo: chip "Fired: Geo-proximity, Hekatompedon Pediment Lions", the banner "Nearby: Hekatompedon …", but the screen below still says "Opened by QR code frieze-101" with the QR's page (`preview__web-fired-geo__1440.png`). Clear the previous "Opened by" line when another trigger fires.

### R3-p4-kiosk-12 · P3 · No pressed feedback on tabs; primary active equals hover
`ui/button`: primary `active:bg-primary-hover` equals hover; `TabsTrigger` has no `active:` class (Surface, Language, Content, Size, Orientation). On touch, a tap on a tab shows nothing until the state changes. Add `active:bg-muted` / a 1 px darker underline.

### R3-p4-kiosk-13 · P3 · QR card: no print size, mid-word wrap
Image 118 px (box 128); file 512×512 px, 746 bytes; link in 12 px mono breaks "…alpha-kou / ros?t=av54v8fy". Caption "Prints sharp up to N cm" (compute from module count), `break-all` only at `/` or `?`, 13 px. Files: `QrCodePreview.vue`/`TriggersCard.vue`.

### R3-p4-kiosk-14 · P3 · Below 860 px the Surface / Language / Content groups have no visible labels
At 768 (`preview__kiosk__768.png`): "Web Mobile Kiosk English Ελληνικά Italiano Working Live" run together; selection is only an underline. The accessible names remain (`sr-only`). Keep short labels visible or separate groups with a divider; the same for the Orientation/Size pair at all widths (Portrait and Fit width are both underlined and unlabelled).

### R3-p4-kiosk-15 · P3 · 32 px controls at fine pointer
HelpHint "?" 32×32, Save draft / Discard in the banner 32 px high at 1440 (R2-V-02). Coarse is 44. Raise to 40.

## What works (keep)
- Scale label always equals the measured scale; "Fits at real size" for Mobile; "100 %" hidden when same as Fit.
- Esc order: Interact → Esc stops → focus back to Interact; Skip preview → "End of preview".
- `?trigger=` / `?t=` handling including bad values, case-insensitive language, Greek "Άνοιξε με κωδικό QR".
- Drawer at 768: 320 px, 44 px items, focus in, Esc/tap-away/link close it. ⋮ menu items 44 px.
- Create dialog: sticky footer at 768×600, inline at 768×360, no clipping, Cancel/Create 44 px.
- Map: page scrolls under a swipe; "Move map" pans, shows "One finger moves the map".
- Floor-plan touch placement on empty area, with a live-region sentence and "Unsaved changes".
- Focus ring: 2 px `rgb(76,29,139)` with 4 px white halo everywhere in the tab walk.

## Unverified / could not test
- Forced colours, reduced motion and RTL on these screens (not run in this pass; the preview shell has an RTL path only for RTL languages, none in this Project).
- C2-50 "missing titles" links; R2-V-07 editor heights.
- On-screen keyboard: simulated only by 768×600 viewport; `visualViewport` behaviour not testable.
- A very fast short flick (10 steps, 160 ms) in Move map mode did not pan once, while a slower 20-step drag did; likely a synthetic-touch artefact, not logged as a finding.
- Floor-plan placement and pin moves were left unsaved on a pre-existing plan; the Save path was not exercised.
