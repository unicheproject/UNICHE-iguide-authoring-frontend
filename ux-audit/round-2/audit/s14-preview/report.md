# s14-preview — Round 2
Interview steps of impeccable skipped (subagent). Mode: Operate. Rules cited: critique.md "Cognitive Load Assessment" (decision points above 4 visible options: the Preview page shows 5 chip groups plus a 30-option select before any picture); audit.md "Responsive Design" (the same frame at 1440 vs 768); operate.md "Product constraints" (product UI must favour the task surface, here the frame).
Tested as `curator` first, then `admin` after the data re-grant. Projects: Populated. Viewports 1440, 1280, 1024, 768, zoom200, forced-colors; touch at 1024 NOT run (see Unverified). Scripts a1..h1.mjs and shots/ in this folder.

## Verdict
Round 1 closed the P0: the Preview page is a labelled region, the stand-in is truly inert (accessibility tree 5 buttons idle vs 50 interacting), Working mode shows pending changes, firing is surface-aware with chip and Reset, the new tab has real-size frames, a per-state title and visible invalid-param messages. What is left is the editor "Preview in app": at 1440 and 1280 it is drawn at 24 % in the side column, and Expand makes a sticky bar that covers the editor header including "Apply changes". "Test in preview" still selects and fires nothing. Esc does not stop interacting. Four P1/P2-level gaps keep every group under 86.

## Context check
- `12` §3 Preview: "Open in new tab ... carries no link token and cannot be shared"; Resource editors: "Preview in app" opens "below the action, a panel".
- `14` §4: "the preview frame is labelled with the surface and language it renders, and the CMS chrome remains operable while the frame has focus".
- `03` §1: an ACTIVE Resource is edited through a Working Copy; visitors see nothing until Apply (the banner text in the editor says so).
- DECISIONS.md: D-082 (P8: labelled region, inert until Interact, Fit/100/50 with stated scale); D-014 (stand-in drawn by the CMS).
- PRODUCT.md: Kiosk operator "checks how the guide looks on KIOSK, MOBILE and WEB; often on a tablet on site".

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| Preview page (Web, Mobile, Kiosk, modes, fire) | 20 | 15 | 12 | 13 | 12 | 7 | 79 |
| Open in new tab (`/app-preview`) | 21 | 16 | 13 | 13 | 13 | 8 | 84 |
| "Preview in app" in editors (inline, expanded) | 16 | 12 | 11 | 12 | 11 | 6 | 68 |
Caps applied: open P1 on all three, so each is at most 85; the editor panel is lower on its own merits.

Nielsen (group): 1 visibility 3, 2 match 3, 3 control 2 (no Esc exit, Expand traps the header), 4 consistency 3, 5 error prevention 3, 6 recognition 3, 7 flexibility 2 (Test in preview dead link), 8 minimalism 2 (text and controls before picture), 9 error recovery 3, 10 help 3. Total 27/40.

## Findings

### R2-s14-01 — Expanded preview's sticky bar covers the editor header and Apply changes (P1)
Screen: POI editor with Working Copy → Preview in app → Expand · 1440 · Content editor.
Evidence: `shots/editor-preview__expanded__1440.png`; run h1.mjs: `elementFromPoint` at the centre of "Apply changes" returns the `Mobile` tab; the title, status chips and "2 warnings" are hidden. Esc does close it and returns focus to the opener.
Observation: the panel header ("In the app | Web Mobile Kiosk") is sticky at the same offset as the editor header, so at scroll 0 it overlays the title row. The Working Copy banner stays visible below it.
Why it hurts: the author cannot see or press Apply while reviewing the expanded preview, and `14` §4 requires the chrome to stay operable. It was reported in round 1 and is not fixed.
Recommendation: stick the panel bar below the editor header and banner (offset by their heights), or drop sticky and put the surface switch in the panel's top line.
Likely files: `src/components/editor/PreviewPanel.vue`, editor shell header. Spec: `14` §4. Effort S.

### R2-s14-02 — "Test in preview" navigates to `/preview?trigger=<id>` but selects and fires nothing (P1)
Screen: POI → "How visitors reach it" → Test in preview · 1280.
Evidence: `shots/preview__from-test-in-preview__1280.png`; h1.mjs: URL `/preview?trigger=0e570ab5-…`, select value empty, text "Choose a trigger first.", no "Fired:" chip. Back returns to the POI correctly.
Why it hurts: the control promises a test and delivers a page where the author must find the same trigger among ~30 options.
Recommendation: read `?trigger`, preselect it, fire it on load (or at least preselect and focus Fire); pick the surface the trigger reaches (MOBILE for beacon). If it is not offered in the mode, say why in the chip area.
Likely files: `src/views/workspace/PreviewView.vue`, `FireTrigger.vue`, `TriggersCard.vue`. Spec: `12` §3 fire-trigger. Effort S.

### R2-s14-03 — In the editor, Web and Kiosk previews are drawn at 24–29 % at desktop widths; the panel sits below Status in the side column (P1)
Screen: Preview in app · 1440 and 1280 (and Kiosk at 1024 is 26 %).
Evidence: `shots/editor-preview__open__1440.png`, h1/g1 logs: 1440 Web 0.242 / Kiosk 0.287; 1280 Web 0.242 / Kiosk 0.240; 1024 Web 0.734, 768 Web 0.534. The caption states the scale (good) but 24 % text is unreadable. Expand reaches 88 % only on desktop; below 1025 px there is no Expand (not needed for Web but Kiosk is still 26–40 %).
Also: the opener (Close/Open "Preview in app") is in the side column, so "below the action" puts the panel under the Status card and the picture is 227 px tall, with "Open at real size" and "Interact" stacked above it.
Recommendation: see "Preview model for round 2" below. Spec: `12` §3. Effort M.

### R2-s14-04 — Esc does not stop interacting (P2)
Screen: Preview page · 1280 · keyboard user.
Evidence: c2.mjs: focus on "Stop interacting" or inside the stand-in, Esc → "Stop interacting" still present (twice). Only Tab to the button works. Esc does close the editor panel and returns focus.
Why: after Interact the focus is in a 45-control stand-in with no keyboard exit shortcut; "Skip preview" is gone. Reported as missing in round 1; not added.
Recommendation: Esc inside the frame stops interacting and returns focus to the Interact button; say so in the button's description ("Press Esc to stop").
Likely files: `PreviewPane.vue`. Spec: `14` §4. Effort S.

### R2-s14-05 — Kiosk "Fit" is 33 % at 1440 with 800 px of unused width (P2)
Evidence: b1.mjs: 1440 Kiosk Fit 0.333 in a 1160 px host (drawn 360 px wide); `shots/preview__kiosk-Fit__1440.png`. 1024: 26 %. The hint says "Choose 100 %", which is 1,922 px tall with page scroll.
Why: Fit fits by height only (window height − 260) so the Kiosk operator never gets a readable view without a 1,900 px scroll. Reported in round 1; unchanged.
Recommendation: for Kiosk make Fit = fit to width (up to ~55–60 %) inside an inner scroll area, or add landscape as default for a Kiosk preview in wide hosts; or add a "Fit width" size. Effort S–M.

### R2-s14-06 — The picture starts below the fold; the page spends the first 470 px on text and controls (P2)
Evidence: `shots/preview__default__1280.png`, `…__1440.png`: frame top at y=585 (1440) and 661 (768); two subtitle paragraphs, a five-group control card, two status lines ("Drafts and 15 pending changes…", "No missing titles in English.") before the frame. At 1280×720 only 135 px of the picture shows; after firing a trigger the result opens below the controls and the author must scroll to see what happened.
Recommendation: one-line subtitle, a single compact toolbar (Surface | Language | Content | Size | Fire as a popover), status lines merged into the frame caption, and the toolbar sticky. Effort M.

### R2-s14-07 — Web "100 %" needs sideways scroll even at 1440; scroll area announced only when overflowing (P2)
Evidence: b1.mjs: Web 100 % host 1160 vs 1280 at 1440, 992 at 1024, 736 at 768 → `role=group` "Preview at real size, scrolls sideways" (the label is good). Mobile Fit and 100 % are identical (duplicate choices; 50 % of a phone is 195 px).
Recommendation: hide or disable Size options that give the same result and say "Fits at real size". Effort S.

### R2-s14-08 — Forced-colors selected state of the four tab groups is a 2 px vs 1 px bottom border (P2)
Evidence: e1.mjs computed styles in forced-colors: all tabs boxed, same colour and weight; selected `border-bottom 2px`, others `1px`. `shots/preview__forced-colors__1280.png`, `shots/preview__forced-colors-tabs-zoom__1280.png`. Selected state is distinguishable only by thickness, no indicator or system highlight. Reported lost in round 1; improved (boxes present) but weak.
Recommendation: `forced-color-adjust` with `Highlight` background / `HighlightText` for `[aria-selected=true]`, or a leading check mark. Effort S.

### R2-s14-09 — Focus is dropped to the document after "Reset" (P2)
Evidence: d1.mjs: after Reset focus is `body`. Fire itself announces ("Fired QR code, …", polite) but there is no focus move or scroll to the result.
Recommendation: focus the select after Reset. Effort S.

### R2-s14-10 — Greek: missing titles are counted, not listed (P3)
Evidence: d1.mjs: "71 missing titles in Ελληνικά" (27 in Live). The count is the only information; the translator cannot find them from here. Link to Translations filtered by language or list the first few. Effort S.

### R2-s14-11 — Unknown sub-path of `/app-preview` shows the Dashboard (P3)
Evidence: f1.mjs `/app-preview/nothing` → title "Dashboard". Missing Project id correctly gives the "This Project is not available" StateCard, title "Project not found · iGuide CMS". Effort S.

### R2-s14-12 — Small things (P3)
- "Interact with the preview" is 32 px high; sibling controls 40 px (e1.mjs).
- Fire select lists ~30 options with 40-character names including test records; native select with groups works but is long: add search or a combobox. Option labels end in "…" (shortened, fine).
- Control card wraps "Size" to its own row at 768 (`shots/preview__default__768.png`).
- Caption starts "Desktop browser, 1280 × 800." — good, but "Shown at 24 %." stays 10–11 px.

## Preview model for round 2 (within `12` §3 "opens, below the action, a panel")
Keep the inline panel and the standalone Preview page, but change what the panel is:
1. The panel opens below the header action, full width of the editor content area (spanning main and side column), not inside the side column. Full width gives Web ~73 % at 1280 and Kiosk a usable width. This is still "below the action, a panel" and keeps the form reachable.
2. Default surface: the Project's first enabled one; Kiosk panel renders in landscape if the host is wider than 900 px, so Fit is ~50 %.
3. Panel header is not sticky over the editor header: if sticky, offset by header + banner height (R2-s14-01). Remove "Expand" as a separate mode; keep "Open at real size" (new tab) for 100 %.
4. Surface tabs, scale caption, Interact and Esc exit in one line; keyboard: Esc stops interacting, then Esc closes.
5. On the Preview page, one sticky toolbar and the picture first; "Test in preview" and `?trigger` preselect and fire.
This needs no spec change (`12` §3 does not say the panel is narrow); a docked split pane remains a spec-change-request only if the owner wants it.

## Round-1 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C1-81 | fixed | Region "Preview: Web, English, working content"; AX tree buttons 5 idle vs 50 interacting; one h1; Skip preview lands on "End of preview"; axe clean. Esc exit still missing (R2-s14-04, P2) |
| C1-82 | fixed | Working shows "(revised wording)", 7 min, "Pending edit"; Live does not; status line "Drafts and 15 pending changes…" |
| C1-83 | partly | True sizes, Fit/100/50, scale stated; Kiosk Fit 33 % at 1440, 100 % scrolls at 768 (R2-s14-05, -07) |
| C1-84 | fixed | New tab: real size frames, per-state title "Kiosk, Ελληνικά, Live content · Preview · …", invalid params listed ("Surface "TABLET" is not known…"), lower-case params accepted, `?surface/lang/mode` carried from the button; opener null |
| C1-85 | fixed | Beacon only on MOBILE ("5 beacon triggers not offered…"), "Fired:" chip + Reset, notes cleared on surface/language/mode change, Live note "17 draft triggers are hidden in Live". Focus after Reset lost (R2-s14-09) |
| C1-86 | partly | Inline panel pushes content, not modal, Esc and Close return focus, opens on first enabled surface, 1024/768 full width; but 24–29 % at 1440/1280, Expand desktop only and covers header (R2-s14-01, -03) |
| C1-87 | fixed | Subtitle reworded, disclaimer above the controls, no browser dots on Kiosk |
| C1-88 | partly | Labelled tab groups, one pattern (role=tab) in page and card, announced via polite status; still wraps to 3 rows at 768, native select |
| C1-89 | fixed | Greek stand-in chrome (ΑΝΑΖΗΤΗΣΗ, Τόποι, Σημεία, ΞΕΧΩΡΙΣΤΑ); missing titles counted but not listed (R2-s14-10) |
| C1-90 | partly | noopener kept, bare new-tab 404 now a StateCard; caption still small; sub-path 404 missing (R2-s14-11); disabled "Open in new tab" tooltip not tested |
| C1-91 | not in remit (QR block); "Test in preview" link exists but is a dead end (R2-s14-02) |

Counts: fixed 6, partly 4, not fixed 0 (C1-91 skipped), regressed 0.

## What works (keep these)
- Region label naming surface, language and content state; Skip preview works; the inert default removes ~45 tab stops (verified in the AX tree).
- Single roving tab stop per tab group; arrow keys / End work; each group labelled; 40 px targets; axe clean.
- Caption states the scale and size ("Desktop browser, 1280 × 800. Shown at 78 %.").
- Fire trigger copy ("5 beacon triggers not offered: beacons only work on Mobile", "17 draft triggers are hidden in Live"); chip names the fired trigger and the stand-in states "Opened by QR code frieze-101".
- New-tab titles per state, invalid params shown, missing Project StateCard.
- Esc and Close return focus to "Preview in app" at all four viewports.

## Unverified / could not test
- Touch at 1024 and zoom200 interaction (zoom200 only screenshot of the page: scale 0.475, no horizontal page scroll).
- Slow network / 5xx / offline states of the preview data (not run; time spent on a Catalogue access outage mid-run).
- QR auto-fire `?t=` in the new tab and its Esc/timing; reduced motion; other Resource kinds' panels (only the POI editor); the disabled "Open in new tab" tooltip; Live-mode firing of an ACTIVE trigger.
