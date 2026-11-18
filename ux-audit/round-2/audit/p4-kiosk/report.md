# p4-kiosk — Round 2

Persona: kiosk operator / on-site tablet author (`curator`, UX Audit – Populated). Mode: Operate; impeccable's interview steps skipped (subagent). Records created: POI `UX-R2-p4 Tablet POI` (DRAFT, one QR, one beacon, one geo trigger, pin placed). Scripts `a*.mjs`/`b*.mjs`, logs `*.log`, shots in `shots/`.

## Verdict
The preview rebuild is largely sound: labelled region, inert until "Interact", honest scale captions, surface-aware firing with a "Fired:" chip and Reset, a real new-tab bar. The tablet shell works: drawer, cards below 900 px, 44 px dialogs, 44 px map pins and Leaflet zoom, a good floor-plan placement flow. Three things hold it back: "Test in preview" does nothing, the most common touch targets (row ⋮, editor ⋮, title links) are still 18-21 px, and Web/Kiosk previews in the editor stay unreadable on tablets with no Expand there.
Score range 72-84 per screen (P1 open, cap 85). Findings: P0 0, P1 2, P2 7, P3 5.

## Context check
- `12` (line 323): Preview picks among WEB/MOBILE/KIOSK with a language selector and a live-versus-preview toggle; kiosk operator "checks that the kiosk still reaches the backend".
- `14` line 119: touch targets at least 44 by 44 CSS px on every surface (scope note at line 19 says the deferred part is target size for the CMS; PRODUCT.md still requires tablets "fully usable by touch"); line 187: preview frame labelled with surface and language, chrome stays operable.
- `03` §1: an ACTIVE Resource is edited through one working copy (observed: Working copy banner and "Pending changes").
- DECISIONS D-082: one `PreviewPane`, true device sizes with Fit/100 %/50 %, surface-aware fire control, new tab with a slim bar.
- PRODUCT.md: tablets (1024, 768) "must remain fully usable, on site, by touch".
- impeccable: critique.md "Hard Invariants" (browser inspection required for viewable targets, which is why every claim here has a shot); audit.md "Keyboard navigation / Missing focus indicators"; operate.md "Every interactive component has: default, hover, focus, active, disabled, loading, error."

## Scores
Rubric: Task clarity 25 · Hierarchy 20 · Consistency 15 · Copy 15 · A11y 15 · Responsiveness/states 10.

| Screen / state | Task | Hier | Cons | Copy | A11y | Resp | Total |
|---|---|---|---|---|---|---|---|
| Preview page, 1440 (Web/Mobile/Kiosk, language, mode, fire) | 21 | 17 | 13 | 13 | 12 | 8 | 84 |
| Preview page, tablet 1024/768 | 20 | 16 | 13 | 13 | 12 | 7 | 81 |
| New tab (`?surface&lang&mode&real&orientation`) | 21 | 16 | 13 | 13 | 13 | 8 | 84 |
| Preview in app panel (editor) | 16 | 14 | 12 | 12 | 12 | 5 | 71 |
| Triggers card ("How visitors reach it") | 19 | 16 | 13 | 13 | 12 | 8 | 81 (cap 85 and R2-p4-01 pulls it down) |
| Lists on tablet (cards, row menu, drawer) | 19 | 15 | 12 | 13 | 9 | 7 | 75 |
| Editor on tablet (sticky stack, short screen) | 19 | 16 | 13 | 13 | 11 | 7 | 79 |
| Map pin placement (POI) by touch | 21 | 16 | 13 | 13 | 12 | 7 | 82 |
| Floor-plan placement by touch | 21 | 16 | 13 | 13 | 12 | 7 | 82 |

Nielsen (group, 0-4): visibility 3, match 3, control 3, consistency 3, error prevention 3, recognition 3, flexibility 2, minimalism 3, error recovery 3, help 3. A dead "Test in preview" and an invisible selected state in forced colours cost heuristics 1 and 4.

## Findings

### R2-p4-01 · P1 · "Test in preview" opens Preview but nothing is selected or fired
Screen: Triggers card → Test in preview (QR, geo, beacon), saved rows. 1024 touch. Job 2.
Evidence: `shots/preview__from-test-in-preview-qr__1024.png`, `…-beacon__1024.png`, `b4.log`. Steps: POI `UX-R2-p4 Tablet POI` → add QR + beacon, Save, tap "Test in preview" → URL `/preview?trigger=<id>`, Web surface, "Choose a trigger…", no "Fired:" chip. `PreviewView.vue` never reads `trigger` (TriggersCard.vue line 182 builds it; P4's own changes.md listed this as deferred).
Observation: the link only navigates. For a beacon it lands on Web, where beacons are "not offered", with no explanation of why.
Why it hurts: every trigger row advertises a test, the operator's main check ("does my QR do the right thing?") is silently dead, and the author must re-find the trigger in a 60-option select.
Recommendation: read `?trigger=`; pick the right surface (beacon → Mobile, QR/geo → the trigger's "Runs on" surface), select and fire it, show the chip, and if impossible say why in the notes line.
Files: `PreviewView.vue`, `FireTrigger.vue`, `TriggersCard.vue`. Constraint: D-082 and `12` §3 (Test in preview). Effort S.

### R2-p4-02 · P1 · Most touch targets on tablet are still 18-21 px
Screens: all six content lists, editor headers, Dashboard; 1024 and 768 with `pointer: coarse` (button sizes do grow to 44 elsewhere). Job 3.
Evidence: `a9.log` (sweep), `a7.log`, `a8.log`; `shots/pois-list__top__768.png`, `pois-list__row-menu__768.png`.
Measured (interactive elements under 44 px, of total): Dashboard 158/194 (item links 18 px tall); Places 35/57; POIs 138/158 (69 row ⋮ buttons 18×18, title links 21 px tall, sort buttons 32 px); Routes 23/38; Guides 23/37; Events 28/42; Categories 34/50; Maps 15/28; Media 3/70 (best screen); Preview 8/25 (Fit tab 43×44, tab-group containers); POI editor 10/60; Map editor 3/184 and floor-plan editor 1/121 (only the header ⋮ is small).
Specific: the row "Actions for …" button is 18×18 and `elementFromPoint` 9 px from its centre already hits the row (no extended hit area), at 768 cards too, where it is the only way to reach Archive/Move; the editors' sticky-header "More actions" ⋮ is 18×18; the logo link 123×26; Leaflet attribution links 14 px.
Why it hurts: the ⋮ is the sole route to Activate/Archive/Move on tablets, tapped with a thumb in a gallery; misses open the row instead. Round 1 claimed "44 px on touch" (D-083).
Recommendation: make the ⋮ a 44×44 hit area (padding or `::after` inset -13 px), row title links `min-h-11` as padding in coarse mode, Dashboard list links 44 px rows, editor "More actions" `size="icon"`.
Files: list row menu component(s), `EditorShell.vue`, Dashboard list, `src/style.css` coarse block (line 126), `ui/button`. Constraint: `14` line 119, PRODUCT.md tablets. Effort M.

### R2-p4-03 · P2 · Web and Kiosk in "Preview in app" remain unreadable on tablets; Expand exists only at desktop widths
Screen: POI editor → Preview in app. Job 2.
Evidence: `shots/poi-preview-panel__web__1440.png` (Web 24 %), kiosk 29 %; `poi-preview-panel__kiosk__1024.png` (26 %); `a4.log`, `a5.log`, `a6.log`. At 1440 the panel offers Close, **Expand** (frame 880 %-scale 0.88 Web, Mobile 1.0, Kiosk 0.33) and "Open at real size" (new tab, `real=1`). At 1024 and 768 there is no Expand (panel already full width): Web 73 %/53 %, Kiosk 26 %/40 %. At 1024 the frame is also 510 px tall for a 1920 px screen.
Why it hurts: the kiosk operator on a tablet can read the kiosk only by leaving the editor; the 1440 side panel still draws Web at 24 %.
Recommendation: show the same Expand/Collapse control at every width (full-bleed sheet), default Kiosk to "fit width" with an inner scroll, and keep the Size choice (100 %/50 %) from the Preview page in the panel.
Files: `ResourcePreview.vue`, `PreviewPane.vue`, `PreviewPanel.vue`. Constraint: D-075/D-082. Effort M.

### R2-p4-04 · P2 · Expanded preview's sticky tab bar hides the editor's sticky header
Evidence: `shots/poi-preview-expanded-kiosk__1440.png` and `-web__1440.png`: after Expand and scrolling, "In the app · Web Mobile Kiosk" sits where the title/Apply changes header was; only the Working Copy banner remains below it.
Why: Apply changes, readiness and Save disappear while previewing; stacking two sticky bars.
Recommendation: make the tab bar sticky below the header stack or non-sticky. Files: `PreviewPanel.vue`. Effort S.

### R2-p4-05 · P2 · Sticky header plus Working Copy banner take half of a short screen
Screen: POI editor ACTIVE with pending changes, 768×400 (keyboard-up approximation), also 768×600. Job 3.
Evidence: `shots/poi-editor__active-pending-typing__768x400.png`, `b7.log`: header 56 + sticky block 159 px = 215 of 400 px; the focused Summary field lands at y 222, visible band 185 px. A DRAFT POI is better (56 + 69 = 125; `poi-editor__summary-focus__768x400.png`). At 1024×768 the stack is 207 px (27 %).
Round-1 C1-22 is fixed (bar stays; typing does not shift the form), but the Working Copy banner with long copy wraps to three lines at 768.
Recommendation: below 700 px height (or when an input is focused on a coarse pointer) collapse the banner to one line ("Working Copy · pending · Save draft · Discard") and drop the saved-at sentence into the help popover; hide the secondary line of the header on scroll.
Files: `EditorShell.vue`, `WorkingCopyBanner.vue`. Effort S-M.

### R2-p4-06 · P2 · Swiping over the map does not scroll the page (scroll trap)
Evidence: `b8.log`: vertical touch swipe starting on the POI editor map (1024, 463×260) scrolled the page 0 px; the map panned. Same map is full-width at 768 and in the Map editor (942×430 / 686×573), so a thumb on the map blocks scrolling past it.
Recommendation: Leaflet gesture handling ("use two fingers to move the map", `dragging` off for single touch on coarse pointers inside scrolling pages) or a "Move map" toggle; keep pin drag.
Files: `GeoPicker`/map components. Constraint: C1-99 remnant. Effort S-M.

### R2-p4-07 · P2 · Forced colours: selected state of Surface, Language, Content and Size is invisible
Evidence: `shots/preview__forced-colors__1024.png`: every tab is an equal black box; Web vs Mobile cannot be told apart. The page's "labelled region" also names the choice, but the controls themselves do not.
Recommendation: forced-colors rule giving `[aria-selected=true]` `border-bottom: 3px solid Highlight` or `background: Highlight; color: HighlightText`. Files: `ui/tabs`, `style.css`. Constraint: `14` §4 (state not by colour alone). Effort S.

### R2-p4-08 · P2 · Kiosk "Fit" fits the height and wastes the width
Evidence: `shots/preview__kiosk-Fit__1440.png` (360 px of 1160 available, 33 %, 5 px text), `preview__kiosk-portrait-Fit__768.png` 40 %, landscape 38 %. The caption admits "text is small". 100 % needs an inner horizontal scroller at 768 (1080/736 portrait, 1920/736 landscape; `b8.log`).
Why: the kiosk operator's default view is the one where nothing can be read; 100 % scrolls in two axes.
Recommendation: add "Fit width" (kiosk portrait would be about 100 % of the 1160 px area at 1440, 68 % at 768) and make it the kiosk default; a stated ratio caption already exists. Files: `DeviceFrame.vue`, `PreviewControls.vue`. Effort S.

### R2-p4-09 · P2 · Floor plan: 85 identical "Place" buttons and the armed bar covers the top of the plan
Evidence: `b6.log` (85 buttons named Place; hint says the item), `shots/floorplan-editor__armed__1024.png`: after tapping Place the sticky blue bar sits over the upper part of the plan (about 140 px) so pins there need a scroll.
What works: arm → tap plan → "placed at x 0.6996, y 0.5001" live message; pins 44 px (28 px dot). Recommendation: put the item name in each Place button's accessible name ("Place The Horsemen…", visible text stays "Place"), anchor the armed bar below the sticky header at the plan's bottom edge on short screens. Files: `FloorPlanEditorView.vue`. Effort S.

### R2-p4-10 · P3 · Switcher status chip is a blank grey pill on list pages for several seconds
Evidence: `shots/pois-list__top__768.png`, `__1024.png`, drawer shot: chip empty until about 3-5 s (`b7.log` shows "App: Draft" at 6 s). Editors show it at once. Recommendation: skeleton with accessible "Loading app status" or reuse a cached value. Files: header switcher. Effort S.

### R2-p4-11 · P3 · Time formats disagree
Evidence: save toast "Saved 03:43 PM" (`b4.log`) beside Working Copy banner "13:29" and list dates "12 Nov 2026". Known native-date item from the review pack, but this one is CMS-formatted. Recommendation: one `formatTime` (24 h unless the language demands otherwise). Files: `lib/format.ts`, `AppToast`. Effort S.

### R2-p4-12 · P3 · 503 on Preview mixes "still loading", "platform is not reachable" and "Service unavailable"
Evidence: `shots/preview__503__768.png`, `b7.log`: the page announces "The preview is still loading." and shows "The UNICHE platform is not reachable / Service unavailable / Request id … / Try again". A 503 means reachable but unavailable; the problem `title` is echoed as the cause. Recommendation: map 503 to "The platform is busy or down for maintenance", drop the stale loading announcement. Files: `PreviewView.vue`, shared problem card. Effort S.

### R2-p4-13 · P3 · Preview intro is still two paragraphs of disclaimers above the controls
Evidence: `preview__kiosk-default__1440.png`: two paragraphs plus "Drafts and 14 pending changes…" and "No missing titles in English." push the frame below the fold at 1440×900 (the frame starts at y 585) and at 768 landscape kiosk fit starts at y 685. Recommendation: one line, move "Dashed red outlines mark missing texts" into a legend beside the caption. Files: `PreviewView.vue`. Effort S.

### R2-p4-14 · P3 · QR is drawn at 128 px with a 12 px monospace link
Evidence: `shots/poi-triggers__card__1440.png`. Download PNG exists (blob link, 44 px high). Fine to scan on screen, but nothing tells an operator the printed size or error-correction level. Recommendation: caption "Download PNG for printing, 1024 px" if true (not verified). Effort S. (Unverified: PNG resolution.)

## Round-1 fixes verified

| C1 | Status | Evidence |
|---|---|---|
| C1-81 frame unlabelled | fixed | region `Preview: Kiosk, Ελληνικά, working content` (a2.log); inert until "Interact"; "Skip preview" link; axe clean at 768 (kiosk, POI+panel) |
| C1-82 Working ignores Working Copies | fixed | "Drafts and 14 pending changes of active items shown"; Live note "17 draft triggers are hidden in Live"; editor panel shows "(revised wording)" |
| C1-83 scaled, not real | partly | Fit/100 %/50 % with stated scale and 100 % real size work; Kiosk Fit 33-40 %, editor panel 24-29 % (R2-p4-03, -08) |
| C1-84 new tab | fixed | title "Kiosk, Ελληνικά, Live content · Preview · …", bar with Surface/Language/Content, "Open at real size", invalid params named, case-insensitive (`a3.log`) |
| C1-85 fire trigger | fixed | grouped by type, beacons only on Mobile ("4 beacon triggers not offered"), "Fired:" chip on QR, geo, beacon, cleared by surface change and Reset; notes cleared. (`?t=` auto-fire exists in source, not exercised.) |
| C1-86 Preview in app covers form | partly | opens below the button, not modal, Esc closes and returns focus to "Preview in app" (touch run too); Web/Kiosk still tiny, Expand only at desktop width (R2-p4-03, -04) |
| C1-87 copy | fixed | intro rewritten, no "unpublished", no browser dots on Kiosk |
| C1-88 control bar | fixed | labelled groups, tabs with arrow/End keys (`b8.log`); forced-colours selected state missing (R2-p4-07) |
| C1-89 stand-in English under `lang=el` | fixed | frame text in Greek: "ΑΝΑΖΗΤΗΣΗ", "Τόποι", "Σημεία"… |
| C1-90 preview nits | partly | skip link and one h1 present; still 21 tab stops (nav) before the first control; caption now 12 px+. `noopener` not examined |
| C1-91 QR without public address | partly | address present → QR, link, Copy link, Download PNG, Open link and Test in preview all render and measure 44 px; the no-address state was not re-run; Test in preview does nothing (R2-p4-01) |
| C1-92 beacon fields | fixed | UUID own row, Major/Minor/Suggest within/Wait labelled, "Mobile app only" chip, named Remove buttons, one note (`shots/poi-triggers__three-added__768x600.png`) |
| C1-22 sticky bar, keyboard-up | partly | header + banner stay, typing does not move the form; 54 % of a 400 px screen (R2-p4-05) |
| C1-96 map editor layout (tablet) | partly | name and Edit bounds above map, one zoom set; at 1024×768 the map starts at y 535, below the fold |
| C1-97 floor-plan placement | fixed | numbered 44 px pins, armed "Tap the plan to place X" with Cancel and live announcement (`shots/floorplan-editor__armed__1024.png`) |
| C1-98 floor-plan misc | partly | identical "Place" buttons remain (R2-p4-09) |
| C1-99 touch placement | partly | copy says "Tap", pin and Leaflet zoom 44 px, tap sets lat/lon (37.97194, 23.72504); swipes still pan the map (R2-p4-06) |
| C1-119 nav never collapses | fixed | drawer below 1100 px, focus lands inside, Esc and backdrop tap close, link tap closes (`nav-drawer__open__768.png`); at 768×600 the drawer scrolls (1008/600) |
| C1-120 lists at 768 | partly | cards, no clipping, no horizontal scroll; ⋮ 18 px, rows 120-130 px; menu items 44 px high (R2-p4-02) |
| C1-121 editors at tablet | fixed | single column, readiness/status as a compact bar ("Active · 2 warnings") with Preview in app, no side column 3,000 px down |
| C1-122 header at 768/zoom | fixed | one 56 px row at 1024 and 768 (zoom200 not re-run) |
| C1-123 target sizes | partly | Media, dialogs, preview tabs, triggers card links and buttons, map and floor-plan controls meet 44; lists, Dashboard links and editor ⋮ do not (R2-p4-02) |

Counts: fixed 11, partly 10, not fixed 0, regressed 0.

## What works (verified)
- Preview: region name and skip link, "Interact"/"Stop interacting", one status line per change ("Preview: Mobile, English, working content").
- Kiosk orientation toggle (portrait 33 %, landscape 59 % at 1440) and a stated scale on every size.
- Fire control: groups by type, honest "N triggers are not offered on Kiosk", chip plus Reset on every type.
- New tab: slim bar, per-state title, invalid parameters reported ("Surface "BOGUS" is not known…. Showing Web.").
- Triggers card: QR block with image, link, Copy link, Download PNG, Open link; beacon "Mobile app only".
- Drawer, create dialog (error summary with a link, 44 px controls, fits 1024×768), Move-to-position dialog fits 768×600.
- POI pin by touch (tap sets coordinates, hint says Tap, controls 44 px). Floor plan placement flow.
- Media library on touch: 3 small targets out of 70.
- axe (wcag2a/aa/21a/aa) clean on preview kiosk 768, POI editor 768, POI editor with panel open 768.
- No page or console errors in any run.

## Unverified / could not test
- Real on-screen keyboard (emulated by shrinking the viewport to 768×400/600).
- Floor-plan drag by touch (taps only; no save), ACTIVE floor-plan Working Copy banner shift.
- `?t=` code firing in the new tab, QR PNG resolution, no-public-address QR state (would need changing Project data), Esc on a real touch device.
- zoom200 and reduced-motion for these screens; slow network; 401/403/409/422 on Preview (only 503 and offline probed; offline shows the banner "You are offline. Saving is disabled.").
- Beacon "Test in preview" on Mobile surface (it lands on Web, see R2-p4-01).
