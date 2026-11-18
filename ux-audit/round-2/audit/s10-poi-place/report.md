# s10-poi-place — Round 2

Records created/mutated (Populated Project, all `UX-R2-s10 …`): Place `7cfe29cf-9226-45ba-af13-4957e69f13d1` (INDOOR building, plus `UX-R2-s10 floor plan` linking it), POI A `513ac2fc-68df-47dd-b5a3-f72468513482` (DRAFT -> ACTIVE -> pending Working Copy -> applied, 1 QR trigger), POI B `ea3d2152-5567-4019-94b6-ce239b24ee5c` (long English and Greek title, archived, restored, error-state tests). Pre-existing `UX-P4 …` Place/POI records were only opened. Scripts `mk.mjs`, `a*.mjs`…`j1.mjs`, helper `h.mjs`, screenshots in `shots/`. Impeccable run in Operate mode; its interview steps skipped (subagent).

## Verdict
The editor frame is a real step up (sticky header + Working Copy banner, section order, "On this page", per-field 409 dialog, field-level 422, Save and activate, 1024 status strip). It is not yet shippable: keyboard users meet ~40 unnamed map tab stops in every POI editor, focus is dropped to `<body>` after Activate / attach / Restore / Archive, the readiness count is quoted four ways, and a POI's own QR code blocks Deactivate with garbled copy. Editor height target (1,450) is still missed (1,854 DRAFT, 2,205 with a trigger and Working Copy).

## Context check
- `12` §5/§3: conflict (409) is resolved per field and an ACTIVE resource is edited through a Working Copy; section order common to all kinds, triggers inside the editor (checked against the 409 dialog and the "How visitors reach it" card).
- `14` §4: errors linked to controls and summarized; focus management and 200 % text scaling (checked: 422 summary links work; focus drops; zoom200 chrome 56 %).
- `03` §1: DRAFT -> ACTIVE -> ARCHIVED, Working Copy is the only way to edit ACTIVE (checked through Save draft / Apply / Discard).
- DECISIONS D-074 (editor frame: sticky header, banner, side column) and D-075 (inline "Preview in app" below its button) verified in behaviour.
- PRODUCT.md: authors are content editors who work in one record at a time; "never say published" holds (grep of every dialog/toast I saw: none).
- Impeccable rules cited: critique.md "Viewable targets require browser inspection" (every state shot and viewed); audit.md "Don't fix issues; document them"; operate.md "Familiarity is often a feature… strangeness without purpose is the failure mode" (applied to the Restore notice and the single-item More menu).

## Editor height at 1440 (main scroll height, px; round-1 target ~1,450, P4 reported 1,910)
| State | Height |
|---|---|
| POI DRAFT, no triggers | 1,854 (1,910 page incl. header) |
| POI ACTIVE, Working Copy, 1 QR trigger | 2,205 |
| POI ARCHIVED | 1,896 |
| Place INDOOR (with floor plan) | 1,935 |
| Place OUTDOOR (map) | 2,245 |
| Sub-place | 1,952 |

What still makes the DRAFT POI long: Texts card ~720 px (Title, then Summary and Description as 80 px boxes each with a label and hint, the Practical details bar, and two audio rows); Placement ~405 px (260 px map plus two stacked selects, fields and hint); Media ~185 px of dashed buttons for an empty slot set; triggers ~165 px empty (+~420 px per QR row with image); Details bar 48. The Place adds four more 80 px text boxes (Visitor information, Accessibility information) and the 320 px map. At 1024 the side-column cards drop below, adding ~300 px (2,540). To reach ~1,450: two-column Summary/Description (or 56 px rows that grow), move the audio rows into Media, put Placement map at 200 px or behind "Edit position", fold empty Media/Triggers into one "Add…" row.

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| POI DRAFT | 19 | 15 | 11 | 11 | 9 | 7 | 72 |
| POI ACTIVE / pending | 18 | 15 | 11 | 10 | 9 | 7 | 70 |
| POI ARCHIVED | 20 | 15 | 11 | 12 | 11 | 7 | 76 |
| Place INDOOR / OUTDOOR / sub | 20 | 16 | 12 | 12 | 11 | 7 | 78 |
| Greek tab / long title | 19 | 15 | 12 | 11 | 10 | 7 | 74 |
| Group, capped (open P1) | | | | | | | 70-76 (max 85) |

Nielsen (0-4): visibility of status 3, match with real world 3, user control 3, consistency 2, error prevention 2, recognition 3, flexibility 3, aesthetic/minimal 3, error recovery 3, help 2 = 27/40.

## Findings

### R2-s10-01 — P1 — ~40 unnamed Tab stops inside the Placement map
POI editor (DRAFT and ACTIVE) · 1440 · content editor, keyboard. Steps: focus `#f-lat`, press Tab repeatedly (`c3.mjs`): Longitude, "Site map: pin position" group, then 40+ `<path>` stops with no name (other POIs' context markers), 41 Tabs before "How visitors reach it" (`c2.mjs`). axe is clean because the paths carry no role.
Why it hurts: Save is already 70 Shift+Tabs away; a keyboard user cannot pass Placement. Recommendation: context markers `keyboard:false`/`interactive:false` (or one list), keep only the pin; offer "Skip map". Files: `components/map/GeoMapCanvas.vue`. Spec: `14` §4 keyboard. Effort S.

### R2-s10-02 — P1 — A POI's own trigger blocks Deactivate; copy is garbled
POI A ACTIVE with a QR code, 1440. Status card: Deactivate disabled, "Used by 1 item. Remove it from it first." (the sentence is shown, and repeated for assistive tech, with a missing noun; once "Remove it from first."). "Used in (1)" lists "QR code c53qrb9c · Trigger" (`shots/poi-editor__qr-saved__1440.png`).
Why: the trigger belongs to the POI; to hide a point you must destroy its QR code, which is already printed. Recommendation: do not count the resource's own triggers as users (deactivate them with it), or say "Deactivate the QR code first" with a link; fix the sentence. Files: `EditorStatusCard.vue`, usage logic in `useResourceEditor`. Spec `12` where-used. Effort S/M.

### R2-s10-03 — P1 — Focus falls to `<body>` after Activate, attach image, Restore, Restore as draft, Archive
Verified: Activate confirm -> body; "Use this image" in the picker -> body (toast "klepsydra attached." only); restore notice "Restore" -> body; archived "Restore as draft" -> body; Archive confirm -> body. Contrast: Apply keeps focus on its (now disabled) button, Discard-cancel returns focus, Esc after Expand returns to "Preview in app" (those are right). Evidence `a4.mjs`, `a9.mjs`, `j1.mjs`, `e1.mjs`, `g1.mjs`. C1-77 not fixed for these. Recommendation: after each, focus the heading of the new state / the control that opened the dialog / the attached row's Replace button. Files: `EditorShell.vue`, `ActivateDialog.vue`, `MediaSlots.vue`. Effort S.

### R2-s10-04 — P1 — Readiness is counted four ways and DRAFT/ACTIVE disagree
POI A: Activate confirm "3 things need attention", toast "Activated with 7 warnings", header "5 warnings", side card "5 things need attention" (groups Other (3) + Texts (2)). Before activation English "3 texts missing", Ελληνικά "5 texts missing"; after activation Ελληνικά "2 texts missing" + 3 "Accessibility information … is empty". "On this page" says "No position yet" and "Primary image missing" but neither is a warning anywhere. Evidence `a3.mjs`, `a4.mjs`, `shots/poi-editor__active-after-activate__1440.png`. Why: the author cannot tell what is left or whether activating is safe. Recommendation: one function (`countIssues`) used by header, card, confirm and toast, same grouping before and after activation; show the same list on DRAFT; fold "No position"/"Primary image" into it as warnings. Files: `ReadinessList.vue`, `ActivateDialog.vue`, `EditorShell.vue`. Effort M.

### R2-s10-05 — P1 — Sticky chrome is 56 % of the viewport at 200 % zoom (and 20 % at 1440)
Scrolled POI A: zoom200 (640x360) app header 56 + sticky header/banner 145 = 201 of 360 px; content area 159 px. At 1440x900 the stack is 177 px, and 2 lines when the saved-copy banner text wraps (banner grows 56 -> 63 px, jumping the form). `c2.mjs`, `shots/poi-editor__scrolled__zoom200.png`. Recommendation: below ~700 px height make the banner non-sticky or merge it into the header (Q-008 idea), shorten the banner text to one line ("Working Copy · saved 16:11 · Visitors see the live version"), move the "?" help into the tooltip. Files: `EditorShell.vue`, `WorkingCopyBanner.vue`. `14` §4 200 % scaling. Effort M.

### R2-s10-06 — P1 — Trigger validation: empty beacon/geo rows fail only at the server with three identical, field-less links
POI A: add Bluetooth beacon + Geo-proximity + QR, press Ctrl+S. The server returns 422 and the summary reads "How visitors reach it: Is required." three times with the same link text (`shots/poi-editor__trigger-errors__1440.png`). Only the UUID row shows an inline "Is required"; after Major/Minor/Lat/Lng were filled the same alert stays until the UUID is typed. The UUID input is pre-drawn with a realistic UUID that is only a placeholder (looks like a value). Recommendation: client-side `checkTriggers` must flag empty required fields before the request; summary entries name the field ("Beacon 1, UUID"); placeholder visibly lighter or an example "e.g.". Files: `platform/triggers.ts`, `TriggersCard.vue`. `14` §4 errors linked. Effort S.

### R2-s10-07 — P2 — Editor still 1,854-2,245 px tall (target 1,450)
See table above. Not met in round 1 (1,910) and not met now. Effort M/L (layout of Texts and Placement).

### R2-s10-08 — P2 — Apply changes stays the single primary while edits are unsaved
ACTIVE, type in Summary: header shows "Unsaved changes" but "Apply changes" is the filled purple button and "Save draft" the outline one; the Status card meanwhile shows "Save and activate" on a DRAFT (good) (`shots/poi-editor__active-dirty__1440.png`). Same sentence twice: "Unsaved changes" in the header and "Working Copy. Unsaved changes" in the banner, plus a "Pending changes" chip. I did not test what Apply does with unsaved edits (not safe to guess). Recommendation: while dirty make Save draft primary and Apply secondary; one message. Files: `EditorShell.vue`. Effort S.

### R2-s10-09 — P2 — Apply and Activate confirms say nothing about what changes
Apply confirm: "Visitors see the changed point of interest on their next refresh." No list of changed fields, no remaining-warnings line; the post-apply toast also omits it ("Changes applied"). `b3.mjs`. C1-12 "confirm lists nothing" not fixed. Recommendation: list changed fields ("Summary (English), 1 new QR code") and "5 warnings remain". Effort M.

### R2-s10-10 — P2 — Time and date formats mix
Header chip "Saved 04:10 PM" (12 h), banner "Pending changes saved 13 Nov 2026, 16:11 by you", card "Updated 13 Nov 2026, 16:10" (24 h). Restore notice "Unsaved changes from 13 Nov 2026, 16:12". Use one formatter (24 h, locale of the CMS). Files: `EditorShell.vue`. Effort S.

### R2-s10-11 — P2 — One Save produces four confirmations; toasts cover the side cards
Save draft: header "Saved 04:11 PM", banner text change, a "Saved / Draft saved…" toast over the "Before you activate" card (`poi-editor__draft-saved__1440.png`), and the polite live region. Toast also lingers over "What needs attention". Recommendation: header state + live-region only; toast only for errors. Effort S.

### R2-s10-12 — P2 — Restore-draft notice is oversized, shifts the form, and outlives the save
`poi-editor__restore-notice__1440.png`: full-width blue block (wider than the form column, pushing the whole page ~110 px down, side column starts lower), no hint of what is kept ("Unsaved changes from … are kept"), focus goes to body after Restore, and in `a9.mjs` the notice stayed in the DOM after I pressed Save draft instead of being dismissed. Recommendation: compact inline row inside the banner area with "Restore (2 fields)", dismiss it on save, focus the first restored field. Files: `EditorShell.vue`. Effort S/M.

### R2-s10-13 — P2 — Archived editor: two "Restore as draft" buttons, stale hints
`poi-editor__archived-tall__1440.png`: banner button and Status-card button; Title hint still says "Required in the default language before it can be activated" (also on ACTIVE); the info banner is full-width over the side column (same grid problem as R2-s10-12); archive toast uses a warning triangle for a success. C1-27 not fixed. Recommendation: one Restore (card), banner text only; drop the hint when not DRAFT. Effort S.

### R2-s10-14 — P2 — 409 dialog lists unchanged fields and does not say what "Reload" discards
Real 409 (colleague changed Summary and Description via API while I edited Summary): dialog lists Summary (true conflict) and Description with "Mine: (empty)" vs "Current: Colleague description." although I never touched Description (`poi-editor__409-save__1440.png`). Nothing preselected (good) but 2 radios x N fields is heavy; "Reload their version" gives no warning that my edits are lost. The brief's note ("only Reload their version") is not accurate for Save; per-field choice exists. Recommendation: three-way merge (only fields I changed conflict), "Reload their version (discards your 1 change)". Files: `ConflictDialog.vue`, `useResourceEditor.ts`. Effort M.

### R2-s10-15 — P2 — 403/404 and refused-activation wording
Save with 403 or 404: "The point of interest was not saved" + the server's own `title` ("x" in my fake body) + request id, no cause and no action (`g1.mjs`). Activation refused (409 with detail): shown as a toast "The change was not saved" (wrong verb for activation; the record was saved) while the dialog stays open with no message (`poi-editor__activate-refused__1440.png`); D-074 says the refusal appears inside the dialog. 503 reads "The UNICHE platform is not reachable" (acceptable, request id shown). C1-65 not fixed. Effort S/M.

### R2-s10-16 — P2 — Offline handling leaves stale alerts; Ctrl+S ignores the disabled state
Offline: banner + inline alert + toast + status text (four). After going back online "Back online" shows but the "not saved" alert remains. Ctrl+S still fires a request while Apply/Save is disabled. `poi-editor__offline__1440.png`. Effort S.

### R2-s10-17 — P2 — Forced colours: primary lost; disclosure boxed
`poi-editor__forced-colors-dirty__1440.png`: "Apply changes" and "Save draft" look identical (both outlined, no fill); the "Practical details" toggle becomes a zero-padding box with "Show" touching the border. Selected tab and current nav are distinguishable (good). C1-08 partly fixed. Add `forced-colors` rule: primary = `ButtonText` border 2 px/`Highlight`; padding on the disclosure. Effort S.

### R2-s10-18 — P2 — Audio narration sits under the "Practical details" bar but outside its disclosure
DRAFT: the bar says "Practical details 0 of 2 filled · Show" and the English / All-languages "Choose audio narration" rows follow directly below, so they read as the hidden content, while the Media card says "Choose it in each language's tab, under the texts". The rows are visible (not hidden, contrary to the brief's report), but mis-grouped; the Greek tab shows only a Greek row. Recommendation: put audio rows in Media (one "Audio narration" row with per-language chips) or under their own "Audio" heading. Effort S.

### R2-s10-19 — P2 — Lat/Long placeholders look like values
POI with no position: fields show "37.97150 / 23.72570" (the map centre as placeholder, same dark monospace as typed values) while the caption says "No coordinates yet" (`poi-editor__draft-new-tall__1440.png`, placeholder confirmed via `getAttribute("placeholder")`, value ""). Authors will think a position exists. Same trap in the beacon UUID. Use a pale example ("e.g. 37.9715") or no placeholder. Effort S.

### R2-s10-20 — P2 — "Version 0" and jumping versions in the Status card
New DRAFT shows "Version 0" (C1-26 not fixed); after one Save 1, Activate 2, Save draft/Apply 3 with no explanation. Show "Not saved yet / Revision 3", or hide for authors. Effort S.

### R2-s10-21 — P2 — "Test in preview" opens Preview but nothing is fired or selected
Link goes to `/preview?trigger=<id>`; the Preview page shows "Choose a trigger…" and no "Fired:" chip, although the trigger is in the list (`shots/preview__from-test-in-preview__1440.png`, `b2.mjs`). P4's deferred request (handle `?trigger=` in P8) is still open. Effort S/M.

### R2-s10-22 — P2 — Long titles: single-line inputs clip; header truncates and wraps the chip
English 160-character title: Title is a one-line input that scrolls inside itself (`poi-editor__long-title-en__1440.png`); header truncates at ~65 characters with an ellipsis and the status chip wraps to its own line (head 63 -> 79 px, form shifts), breadcrumb truncates too; no full title anywhere. Greek tab: source title wraps in a read-only block but the Greek target is a one-line input in a half-width column that clips "…«Η" (`greek-tab-long-title__1440.png`). Make Title an auto-grow textarea (1 row default) and let the header show two lines. Effort S/M.

### R2-s10-23 — P3 — "Preview in app" in the side column: Web drawn at 24 % at 1440
Unreadable (`preview-in-app__open__1440.png`); Expand works (full-width, Collapse and Esc). Offer "Expand" first or hide the thumbnail for Web/Kiosk. 73 % at 1024. Effort S.

### R2-s10-24 — P3 — More ⋮ holds a single item ("Archive")
On DRAFT the menu has one entry, so an extra click and a menu for one action; Archive confirm repeats the whole 160-character title in its heading. Effort S.

### R2-s10-25 — P3 — Place editor: four 80 px text boxes before "Place setup"
Place INDOOR 1,935 px; "Place setup" has no readiness hint though "Level/Type/Map or Floor plan" are required choices; outdoor map shows a grey strip at the right where tiles stop. Header "App:" chip rendered as a blank pill during load on the outdoor Place. Effort S.

## Round-1 fixes verified
| C1 | Result | Evidence |
|---|---|---|
| C1-22 sticky bar, accelerator | fixed | Header and banner stay; Ctrl+S saved (`a3.mjs`). Cost: R2-s10-05 |
| C1-23 save speed, progress | not verified | not re-timed; no spinner observed within the 2.5 s waits |
| C1-24 section order/height | partly | order + "On this page" fixed; height 1,854-2,245 (R2-s10-07) |
| C1-25 banner shifts form | partly | banner always present on ACTIVE; 56->63 px jump when text wraps; restore notice shifts ~110 px |
| C1-26 header meta clutter | partly | chip beside title fixed; "Version 0" remains (R2-s10-20), long title wraps chip |
| C1-27 archived editor | not fixed | two Restore buttons (R2-s10-13); pencil icon gone |
| C1-28 INDOOR placement, children | fixed | indoor shows floor plan, "Open floor plan", "Inside this place" (`place-editor__mine-indoor-tall__1440.png`) |
| C1-29 Activate confirm, counts | partly | confirm exists; counts 3/7/5 (R2-s10-04); focus to body |
| C1-30 Save and activate | fixed | button label changes when dirty (`b4.mjs`, `h1.mjs`) |
| C1-31 readiness on DRAFT | partly | "Before you activate" shown; Placement/image not flagged |
| C1-32 readiness grouping/helper | partly | grouped by kind; Title helper stale on ACTIVE/ARCHIVED |
| C1-33 draft asset warning | not verified | attached an ACTIVE image only |
| C1-34 translating shows source | fixed | `greek-tab-long-title__1440.png` source beside target, Copy source |
| C1-36 Translations card names what is missing | partly | "Next missing" link present; list still counts "x of 5" without names |
| C1-38 language tabs | fixed | arrows move focus with roving tabindex, completeness marks, audio row inside the language panel (`b5.mjs`) |
| C1-40 Greek labels/lang | fixed | `lang="el"` on inputs, `<bdi>`, no upper-casing |
| C1-65 403/404 on save | not fixed | R2-s10-15 |
| C1-71 422 handling | partly | field errors, aria-describedby, links work for texts and coordinates; trigger summary unusable (R2-s10-06) |
| C1-72 coordinate range | not re-tested | hint text present |
| C1-73 409 | partly | per-field mine/current, nothing preselected; R2-s10-14 |
| C1-74 leave guard, restore | partly | copy now says changes are kept in the browser (fixed); notice oversized/persistent (R2-s10-12) |
| C1-77 focus after actions | not fixed | R2-s10-03 |
| C1-80 map tab stops, audio names | not fixed (names fixed) | R2-s10-01; audio buttons now say "in All languages"/per tab |
| C1-86 Preview in app | fixed | inline panel, focus moves to panel, Expand/Collapse/Esc return focus; thumbnails small |
| C1-91/92 QR and beacon | fixed | QR image, link, Copy link, Download PNG, Open link; beacon labelled, "Mobile app only"; one remaining: R2-s10-06 |
| C1-11 lifecycle weight | partly | Deactivate is outline; own-trigger blocker (R2-s10-02) |
| C1-12 Save/Apply/Discard | partly | R2-s10-08, -09 |
| C1-08 forced colours | partly | R2-s10-17 |
| C1-121 side column at 1024/768 | partly | Status/needs-attention collapse into a strip at the top; Translations/Used in at ~2,170 px |
| C1-122 chrome at zoom200 | not fixed | 56 % (R2-s10-05) |
Totals: fixed 8, partly 13, not fixed 6, regressed 0, not verified 3 (some rows counted once).

## What works (verified)
- Section order and "On this page" with live per-section status; header "N warnings" moves focus to "Before you activate".
- Per-field 409 dialog, nothing preselected; field-level 422 summary with working links and `aria-describedby`.
- "Save and activate" on a dirty draft; Esc on Discard returns focus; Apply keeps focus on the editor.
- Language tabs: roving tabindex, source beside target, `lang="el"`.
- QR block (image, link, copy, download, remove with confirm), 1024 status strip, 768 layout, `axe` wcag2a/aa/21 clean on POI draft, POI pending, POI archived, Place indoor/outdoor/sub (no page or console errors).

## Unverified / could not test
Save timing (not instrumented); Apply with unsaved edits; Place pending-changes state and Place Archived; the draft-asset warning (C1-33); coordinate range errors; touch; real screen reader; Place at zoom200 and 768 (POI A and B covered); the Used-in/Deactivate rule against the backend (only the UI refusal observed). Greek/long-title states were exercised on POI B at 1440 only.
