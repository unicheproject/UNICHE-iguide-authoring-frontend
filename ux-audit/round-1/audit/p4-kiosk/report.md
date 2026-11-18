# p4-kiosk — Round 1
Persona: Kiosk operator / on-site tablet author (`curator`), Project `UX Audit – Populated`. Mode: Operate. Impeccable interview steps skipped (subagent; the brief answers them); `impeccable context` loader not run, PRODUCT.md read directly. Own record created: `UX-p4-kiosk POI one` (DRAFT POI, coordinates tapped/dragged on it but never saved). Pre-existing records were only opened; floor-plan drag/Place were discarded by reload. Shots: `shots/` (61 files).

## Verdict
The Preview itself is a good, honest stand-in: surface, language and content-mode chips work and fire-trigger works for QR, geo and beacon. But it is built for a 1440 desktop: on tablets the sidebar never collapses, the kiosk frame renders at ~500 px (text 8-9 px, buttons 9 px tall), every control is 30 px tall, and the "Preview in app" popover covers the whole editor and ignores Esc. The QR card shows no image, link, copy or download for any seeded POI (no public address set), so the kiosk operator's core "print the QR" job is not doable here. Map and floor-plan placement by touch do work (tap, drag, pinch, coordinate fields), though with tiny pins and layout shifts.
Open P1s present: score range **58-66** (open P1 caps at 85; P0 count 0 but a11y gate misses listed as P1/P2; realistic scores below).

## Context check
- `12` §3 Preview: "Open in new tab ... carries no link token and cannot be shared"; fire-trigger lists QR, GEO and BEACON triggers and "tests what the Application does when the trigger fires".
- `14` §4: "the preview frame is labelled with the surface and language it renders, and the CMS chrome remains operable while the frame has focus".
- `03` §1: an `ACTIVE` Resource is edited through a Working Copy; visitors see nothing until Apply.
- DECISIONS.md D-015: the Preview is a CMS-drawn stand-in app, "Fire trigger" and "Open in new tab" (`/projects/{id}/app-preview`, no CMS chrome).
- PRODUCT.md: "Desktop is primary (1440 and 1280 wide); tablets (1024, 768) must remain fully usable, on site, by touch."

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total (capped) |
|---|---|---|---|---|---|---|---|
| Preview page, 1440 | 17 | 14 | 11 | 10 | 11 | 7 | 70 (cap 85) |
| Preview page, 1024/768 touch | 13 | 11 | 9 | 10 | 8 | 3 | 54 -> 58 |
| App-preview new tab (bare, `?t=`) | 18 | 16 | 12 | 11 | 11 | 7 | 75 |
| POI editor "How visitors reach it" (QR/geo/beacon) | 12 | 12 | 10 | 8 | 9 | 5 | 56 |
| "Preview in app" popover in editor | 12 | 10 | 8 | 10 | 5 | 3 | 48 |
| POI list at 1024/768 touch | 15 | 12 | 10 | 11 | 9 | 4 | 61 |
| POI editor + map placement by touch | 15 | 12 | 11 | 11 | 9 | 5 | 63 |
| Map editor at 1024 touch | 13 | 12 | 10 | 11 | 9 | 5 | 60 |
| Floor-plan editor at 1024/768 touch | 14 | 13 | 11 | 11 | 9 | 5 | 63 |
| Dialog "New POI" at 1024 | 19 | 15 | 13 | 13 | 12 | 8 | 80 |

Nielsen (group, 0-4): visibility of status 3, match with real world 2 (device vs scaled frame), user control 2 (popover Esc, no sticky Apply), consistency 3, error prevention 3, recognition 3, flexibility/efficiency 2 (tablet), aesthetic/minimal 3, error recovery 3, help/documentation 2.

## Findings

### R1-p4-kiosk-01 — P1 — QR card shows no QR image, link, copy or download
Screen: POI editor (Parthenon Frieze), "How visitors reach it", 1440 and 1024. Persona: Kiosk operator printing QR codes. Evidence: `shots/poi-frieze__reach__1440.png`; `poi-editor__placement-touch__1024.png`. Steps: open `/pois/546c5177-...` and scroll to the card.
Observation: the QR trigger row shows only the code field, "Runs on" checkboxes and an amber "No QR image: the visitor app has no public web address ... Set it in App settings → Surfaces". `QrCodePreview` (image, Copy link, Download PNG, Open) is not rendered at all. The seeded Project has the address unset, so the jobs "check the QR image/link, copy, download" cannot be done for any POI. The `?t=` link is therefore not offered anywhere; I could only reach it by typing `/app-preview?...&t=frieze-101` (works, shot `apppreview__qr-t__768.png`).
Why it hurts: the card advertises a QR but gives nothing to print; the fix lives in an out-of-scope screen two clicks away and the user loses the form position. Even without the address the CMS could still show the code and the in-CMS test link.
Recommendation: always render the QR block; without an address show a disabled placeholder frame with the same footprint, the reason, and a primary "Set the web address" link that opens in a new tab; always offer "Test in preview" (opens `app-preview?t=code` in a new tab) so the operator can test the QR without the address; when the address exists show image, "Copy link", "Download PNG" as 44 px buttons.
Files: `src/components/editor/QrCodePreview.vue`, the triggers card component. Spec: `11` §9, D-039. Effort M.

### R1-p4-kiosk-02 — P1 — Tablet layout: sidebar never collapses, content squeezed, header wraps
Screen: every screen at 768 (and 1024). Evidence: `preview__KIOSK-touch__768.png`, `list-pois__touch__768.png`, `floorplan-editor__top__768.png`.
Observation: the 235 px left nav stays permanently open, leaving ~500 px of content at 768 and ~790 at 1024; the header wraps into two rows (117 px) at 768. At 768x600 the visible work area is ~480 px high (`preview__kbd-height__768x600.png`).
Why it hurts: tablet is a stated primary use ("on site, by touch"); at 768 lists overflow (see -03), frames shrink (see -04) and the first screenful is mostly chrome.
Recommendation: below 1100 px collapse the nav to an icon rail or an off-canvas drawer opened by a 48 px menu button; below 900 put Manage members/Help into the user menu so the header stays one row.
Files: `ProjectLayout.vue`, `src/workspace/*` nav and header components. Effort M.

### R1-p4-kiosk-03 — P1 — POI/Place list overflows horizontally at 768; row actions are cut off
Evidence: `shots/list-pois__touch__768.png` (Deactivate/Archive shown as "DEA", right edge clipped), `list-places__touch__768.png`. Observation: the table is wider than the card; the Actions column is cut off with no scroll hint. Row reorder arrows are 24x24, drag handle ~12 px, Archive 52x16, Deactivate 100x30, title links 21 px high.
Why it hurts: the main row actions can only be reached by an unannounced sideways swipe; reorder arrows are far below 44 px.
Recommendation: under 900 px switch rows to a card layout (title, status, translations, one overflow menu "Actions" with 48 px items); give reorder a "Reorder" mode with 44 px up/down buttons.
Files: `src/views/workspace/pois/*`, shared list/table component. Spec: `14` §4 reorder alternatives exist but must be touch-sized. Effort M.

### R1-p4-kiosk-04 — P1 — Kiosk/Mobile frame is scaled, not shown at its real size; unreadable at tablet widths and caption lies
Screen: Preview, KIOSK, 1024 and 768. Evidence: `preview__KIOSK__1440.png`, `preview__KIOSK-touch__768.png`. Measured at 768: Home/Places/Search/See all buttons inside the frame are 15x9, 27x14, 17x9 px; at 1024 "Search" 42x14.
Observation: the caption reads "KIOSK SCREEN, 1080 WIDE" but the frame is 640 px max (scaled ~0.59, ~0.45 on 768); MOBILE says "390 wide" and is drawn 400 px. Text inside is 8-9 px. The authors' real question "is this readable and touchable on the kiosk?" is not answered: the frame shows layout only. Tiles, search and menus cannot be tapped accurately.
Recommendation: show the true pixel size with a zoom control ("Fit / 50 % / 100 %", pan by scroll) and state the scale in the caption ("1080 wide, shown at 59 %"); for KIOSK offer "Rotate" (portrait/landscape, 1080x1920 is the usual kiosk); at tablet widths make "Open in new tab" the prominent action since the bare route renders at true size (`apppreview__newtab__768.png`). Keep Fire trigger usable in the bare route.
Files: `PreviewView.vue`, `DeviceFrame.vue`, `surfaces.ts`. Spec: `12` §3 Preview. Effort M.

### R1-p4-kiosk-05 — P1 — Touch targets: Preview controls and most CMS controls under 44 px
Evidence (measured bounding boxes at 1024 and 768 with touch emulation; scripts `s2.mjs`, `s4.mjs`, `s7.mjs`):
- Preview page: surface chips 62x30, 82x30, 72x30; language chips 78-84x30; Working/Live 130x30 and 104x30; Fire trigger select 300x31; Open in new tab 174x40; header "Manage members" 125x16, "Help" 29x16, user menu 112x38; nav items 235x35; project switcher ok.
- Lists: Move up/down 24x24; Archive 52x16; Activate 84x30; Deactivate 100x30; Restore 81x30; title links 21 px high; Filters 105x38; search 41.
- POI editor: Apply changes 160x38; Save draft 80x18; Discard changes 123x18; "Choose" 43x16; "Choose asset"/"Add image" 32 high; "Remove QR code" 22x18; Runs-on checkboxes 13x13; Leaflet zoom 30x30; attribution links 14 px; "Preview in app" 157x36; Deactivate/Archive 38-40; warning rows 19 high.
- Map editor: Zoom -/+ 29x28; Edit bounds 92x28; filter chips 26 high; "Remove from map" 97x16; lat/lng 34 high; map pin badges 26x26.
- Floor plan editor: pins 26x26 or 37x37, "Place" 38x16, "Remove from plan" 97x16, Replace image 112x28, coordinate inputs 34 high.
- Dialog New POI: Cancel 93x40, Create 90x40, Place select 42.
- Bare app-preview: Search 110x36, See all 60x31 at 1024/768.
Recommendation: a global `@media (pointer: coarse)` rule setting min 44x44 (padding, not just font size) for buttons, chips, checkboxes (use 24 px visual box inside a 44 px label), nav items 44, table-row actions; larger Leaflet controls (44) and pin hit areas (44 transparent ring); attribution can stay.
Files: `src/components/ui/button`, chips, global CSS `style.css`. Spec: WCAG 2.2 2.5.8 is AA; project target is 2.1 AA, so this is P1 by the brief's own persona rule. Effort M.

### R1-p4-kiosk-06 — P1 — "Preview in app" popover covers the editor, ignores Esc, and is unusable in low viewports
Screen: any Resource editor, 1440, 1024x400, 768x600. Evidence: `poi-frieze__preview-in-app__1440.png`, `poi-editor__preview-open__768x600.png`, `poi-own__preview-in-app__1024x400.png`. Steps: tap "Preview in app", press Esc: popover stays (`role=dialog`, test log "after esc, popover visible: true"); focus lands on the MOBILE tab.
Observation: spec `12` §3 says the panel opens "below the action"; the build floats an overlay over the form. At 1440 it hides the title field being edited and the right column; at 768x600 it spans the full width and hides the whole editor including Save/Apply; at 1024x400 only the app header and the title are visible. It is not modal (background still scrolls), not closable by Esc, and defaults to MOBILE regardless of which surface the operator cares about.
Why it hurts: you cannot compare the form with the preview; editing while previewing (live render of unsaved changes) is the feature's point.
Recommendation: dock the preview as a side pane on >=1100 px (right column replaces the status column while open) and as a bottom sheet on tablets (60 % height, drag handle, Esc and "Close" 44 px, focus returns to the button); remember the last surface per Project and offer the Preview page's surface order (KIOSK first for kiosk Projects).
Files: `src/components/editor/ResourcePreview.vue`. Spec: `12` §3 Common to every kind; `14` §4. Effort M.

### R1-p4-kiosk-07 — P2 — Fire trigger: beacon on KIOSK/WEB, stale state, no live-mode explanation
Screen: Preview, 1440. Evidence: `preview__fire-Beacon-KIOSK__1440.png`, `preview__KIOSK-live__1440.png`.
Observations: (a) the beacon trigger is MOBILE-only ("Runs on Mobile app only" in the editor) yet can be fired while KIOSK or WEB is selected and the app shows a "Nearby" bar; the control gives no hint that it will not happen on that device. Geo fires also show. (b) The previous fire's note "Opened by QR code frieze-101" stays above the "Nearby" bar so two contradictory banners stack; the result is not announced (no live region seen) and the select resets to "Choose a trigger…" so the author cannot see which trigger caused what. (c) In "Live content" the select says "No triggers" (all seeded triggers are DRAFT, the list labels them "QR · FRIEZE-101 (DRAFT)") with no explanation why and no way to know a draft trigger exists. (d) Options are 60+ char strings mixing code and a localized target title ("Bluetooth beacon e2c56db5-... / 116 / 16 → Excavated Athenian Neighbourhood").
Recommendation: group options by type, disable (with reason) those whose type is not valid on the selected surface ("Beacon: mobile app only"); show the last fired trigger as a removable chip next to the control; clear previous notes on each fire; in Live mode show "3 triggers are DRAFT and not live"; shorten labels to "Target title - QR frieze-101".
Files: `PreviewView.vue` (`firable`, `triggerLabel`, `fire`), `PreviewApp.vue`. Spec: `12` §3 Preview, `03` §14. Effort S/M.

### R1-p4-kiosk-08 — P2 — Preview page does not say which device/state the author is looking at; surface order and default
Evidence: `preview__default__1440.png`. Default surface is WEB while the persona works on KIOSK; chips order Web/Mobile/Kiosk; the statuses "Showing drafts and active content" sit at the far right in 12 px grey, header text claims "The runtime rendered with your unpublished content" (a) although it is a stand-in (D-015, disclaimer is at the bottom below the fold), (b) the word "unpublished" is close to the banned "published" vocabulary. The Kiosk frame sits in a browser-chrome with three grey dots (a kiosk has no browser).
Recommendation: persist the last surface per Project (default = first enabled surface that is not WEB for kiosk Projects); subtitle "A stand-in for the visitor app, drawn from your Project's content"; move the disclaimer into an inline "Approximation" chip next to the controls; drop browser chrome for KIOSK and MOBILE (device bezel instead); make the language/content summary a labelled status ("Language: English - Working content: drafts and active - 0 titles missing").
Files: `PreviewView.vue`, `DeviceFrame.vue`. Effort S.

### R1-p4-kiosk-09 — P2 — Controls bar wraps awkwardly at tablet widths; chip groups have no visible labels
Evidence: `preview__KIOSK-touch__768.png`. Surface, language and content groups are visually unlabeled (only aria-labels); Fire trigger label is the only visible label; status text wraps to a right-aligned third row. Language chips use native names (Ελληνικά, Italiano) with no language code, ok, but "Working content / Live content" is jargon.
Recommendation: label each group ("Device", "Language", "Content") and use segmented controls of 44 px; "Working content (drafts + active)" / "Live content (active only)" as two-line options.
Files: `PreviewView.vue`. Effort S.

### R1-p4-kiosk-10 — P2 — Beacon fields: UUID input overlaps the "major" label; labels are inline text, not associated
Evidence: `shots/poi-neigh-beacon__reach__1440.png`: the UUID field runs under the label "major" ("ʰajor"). UUID is truncated in a ~240 px input, so a 36-char UUID cannot be verified. Labels "major", "minor", "suggests it within [3] m then waits [600] s before suggesting again" read as a sentence but the numeric fields have no visible `label` (13 inputs at 13x13 are checkboxes; "Runs on" row fine). Geo-proximity fields were not separately captured (`poi-lions-geo__reach__1440.png` exists).
Recommendation: stack UUID on its own full-width row; add real labels "Major", "Minor", "Radius (m)", "Wait before suggesting again (s)"; show a "Test in preview" button on each trigger row that opens the app preview with the trigger fired.
Files: triggers card (`TriggersCard` equivalent in `src/components/editor/`). Spec: `14` §4 visible labels. Effort S.

### R1-p4-kiosk-11 — P2 — Map placement by touch works but copy, size and pin size say "mouse"
Evidence: `touch-map__tap-placed__1024.png`, `touch-map__pin-dragged__1024.png`, `touch-map__pinched__1024.png`. Result: tap sets lat/lng (37.97162, 23.72486), dragging the 18x18 pin with a finger moved it (37.97003, 23.72790), one-finger pan and two-finger pinch work, the page did not scroll while panning; typing coordinates works. Problems: copy says "No coordinates yet. Click the map to place it" / "Click the map or drag the pin" (should adapt to touch); the pin is 18x18 so grabbing it needs precision; the map is only 310x260 inside a 350 px column with the right half of the page empty below the status card; the map attracts page scroll gestures (a swipe starting on it pans instead of scrolling, leaving a narrow scroll gutter); basemap tiles were blank at first view (`poi-own__map__1024.png`) until the map was moved, with no loading indicator; zoom buttons 30x30.
Recommendation: make the Placement card full-width at <=1100 px with a 360 px high map; larger pin (44 px hit area, with a visible crosshair + "Set here" button under the map for precision); copy "Tap the map or drag the pin"; "Use my location" for on-site authors; an edge gutter or two-finger-pan hint.
Files: POI editor placement card, map picker component. Effort M.

### R1-p4-kiosk-12 — P2 — Map editor: the map starts below the fold; duplicate zoom controls
Evidence: `shots/map-editor__top__1024.png`. At 1024 the toolbar, a 14-chip visitor filter and a status line push the map to y>600 of 768. Custom "- + zoom 16" and the Leaflet +/- controls both show; their relation (saved visitor zoom vs. current view) is explained only in tiny text "Visitor view - visitors open the map where you pan and zoom it". Chips are 26 high.
Recommendation: map first, filter as a collapsible "Visitor filter" panel (summary "14 filters, 9 of 9 shown"); one set of zoom controls plus a explicit "Set as visitor start view" button.
Files: map editor view. Effort M.

### R1-p4-kiosk-13 — P2 — Floor-plan placement: layout shift mid-drag, cryptic pin glyphs, "Place" gives no feedback
Evidence: `touch-floorplan__pin-dragged__1024.png`, `floorplan-editor__top__768.png`, `touch-floorplan__after-place-tap__1024.png`. (a) The first edit of an ACTIVE plan inserts the 80 px "You are editing a working copy" banner above the plan; the plan jumped ~85 px down during my touch drag and the pin ended clipped at the plan's top edge (pin 2 moved to y~0); the pin's drag coordinate is thus unreliable on first edit. (b) The pins show glyphs (pencil, wave, pound sign) instead of the list numbers 1-4 so the operator cannot map pin to row; pins are 26 or 37 px (inconsistent sizes). (c) "Place" buttons (38x16) for 50+ unplaced Resources: tapping the first changed nothing visible (count stayed "Placed (4)"); the next step ("now tap the plan") is not stated. (d) A one-finger swipe starting on the plan scrolled the page (good), but means placement is only via pin drag.
Recommendation: reserve space for the working-copy banner (or overlay it as a sticky bar) so layout never shifts; number the pins; "Place" -> a visible armed state "Tap the plan to place 'X'" with Cancel; 44 px buttons; coordinate fields stay.
Files: floor-plan editor, working copy banner. Effort M.

### R1-p4-kiosk-14 — P2 — Apply changes / Save are not sticky; no on-screen-keyboard resilience
Evidence: `poi-editor__scrolled-touch__1024.png` (header actions scrolled away), 768x600 shots. Observation: Apply changes, Save draft and Discard sit in the page head or banner and scroll away on a long editor; in the 768x600 viewport the fixed header plus tablet-sized columns leave ~480 px; unsaved-state indicator "Unsaved changes" is only at the head. No sticky bar covers content (good), but nothing is reachable when the keyboard is up.
Recommendation: a compact sticky action bar (status + Save draft / Apply changes, 48 px) at the bottom on tablets that hides when a text field has focus.
Files: editor header component. Effort S/M.

### R1-p4-kiosk-15 — P2 — Error state for Preview drops the requestId and echoes only the title
Evidence: `shots/preview__error-503__768x600.png` (forced 503 on `/pois`, problem body with `code` and `requestId`): card shows "The UNICHE platform is not reachable" with raw title "x" and no request id or code-specific guidance. BRIEF §2: errors "shown with their requestId". Recommendation: show `requestId` in small monospace with a copy button; map `code`. Effort S. (Could be a test-fixture shape; flagged as unverified for real 5xx bodies.)

### R1-p4-kiosk-16 — P3 — Details
- Tab order on the Preview page passes 18 nav links before the first control; "Skip to content" exists (good) but the preview frame has no focus entry point announced (shots n/a, keys tested via `s9.mjs`).
- Leaflet attribution links are 14 px tall; fine to keep but they sit under the pin controls on a 310 px map.
- The in-editor preview note repeats "an approximation in the Project's theme" in two places.
- Page-level "Open in new tab" popup opens with `noopener`, so the author cannot reuse the same tab; second click opens another each time. Evidence: popup url `/app-preview?surface=KIOSK&lang=en&mode=WORKING`. Unknown trigger code `t=nope-999`: shot `apppreview__qr-unknown__*.png` (see Unverified).
- New-POI dialog (works well at 1024: 520x443, centered, errors inline with icon, Create/Cancel 40 high) - make buttons 44 high.

## What works (keep these)
- Preview chips use `aria-pressed`, each group has an aria-label; the frame tabs are `role=tab` in the editor popover; Skip link present.
- Fire-trigger for QR opens the target with "Opened by QR code ..." note, geo/beacon only suggest "Nearby" as `03` §14 requires (`preview__fire-QR-MOBILE__1440.png`).
- The bare app-preview route renders at true size with no CMS chrome and honours `surface`, `lang`, `mode`, `t` (`apppreview__qr-t__768.png`, `apppreview__mobile-el-live__*.png`).
- Greek and Italian switch live; missing titles counted per language ("41 missing titles in Italiano").
- Map: tap-to-place, finger drag of the pin, pinch zoom, arrow-key nudging and coordinate fields all work on touch; floor-plan pins draggable and keyboard-movable ("arrow keys move it").
- New POI dialog fits 1024x768, validates empty submit with linked inline errors.
- Working-copy banner and "Unsaved changes" appear immediately.

## Unverified / could not test
- QR image, Copy link, Download PNG, the `?t=` link in the card: not rendered because no public web address is set for the Project (Surfaces is out of scope and read-only for me). Download/clipboard paths untested.
- Floor-plan "Place" -> tap-plan flow and saving any placement: not completed (would edit a pre-existing ACTIVE floor plan); only drag and discard on reload were exercised. Map editor drag by touch not exercised (same Leaflet picker as the POI editor).
- Geo-proximity trigger card visual (`poi-lions-geo__reach__1440.png` captured, not reviewed in detail).
- Unknown-code `?t=` behaviour, text zoom 200 %, hover/focus rings in the preview, forced 401/403/404/409/422, offline: not exercised (time). Only 503 on `/pois` was forced.
- A real on-screen keyboard (only reduced viewport heights emulated).
- Light/real device touch features such as long-press and momentum scrolling.
