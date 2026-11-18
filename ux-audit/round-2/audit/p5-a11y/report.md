# p5-a11y — Round 2
(Saved by the orchestrator from the agent's returned report, condensed: its Write call was refused. 132 shots, scripts t*.mjs and logs/ in this folder.)

Keyboard-only and screen-reader persona (`curator`, Populated). `page.keyboard` only, `ariaSnapshot()`, axe. Records: POI `UX-R2-p5 Keyboard POI`, Route `UX-R2-p5 Route` (4 stops), Category, Event, Assets `UX-R2-p5 upload a.png`/`b.png`.

## Verdict
Round 1 fixed most of the gate: every route titled, h1 focused, "X loaded" announced; dialogs, menus, tabs, pickers, Preview frame, reorder and map handles operable and announced; contrast, reduced motion, forced colours measured clean. Range 80–84 (capped by two P1). P0 0, P1 2, P2 5, P3 9. C1: fixed 22, partly 7, not fixed 0, regressed 0. axe: 0 findings at any impact on all in-scope routes and editors at 768, zoom200, 1024, plus lists, editors and key dialogs at 1440.

## Evidence summary
- Contrast probe (13 screens): lowest text 4.66:1 (disabled Save); muted 5.3–5.8; placeholders 5.63; chips 5.55–5.65; field borders ≥ 3:1.
- Route change (10 links + Back/Forward): title "X · Project · iGuide CMS", h1 focus with ring, polite "X loaded".
- Reduced motion: 2 `skelpulse` animations without preference, 0 with reduce; dialog transitions 120 ms → none.
- Forced colours: every button, tab, chip, nav item bordered; selected tab underline; focus ring visible.

## Scores (T25/H20/C15/Co15/A15/R10)
| Screen | Total |
|---|---|
| Home, switcher, user menu | 86 |
| Nav, drawer at 768, route changes | 88 (90 raw; not every state shot) |
| POI list | 86 |
| Create dialogs incl. 422 | 91 |
| POI editor | 78 |
| Route editor | 83 |
| Category and Event editors | 87 |
| Map and floor-plan editors | 86 |
| Media: upload, picker, asset editor | 82 |
| Preview page and new tab | 86 |
| Zoom200 / forced colours / reduced motion | 81 |
Nielsen 32.5/40.

## Findings
- **R2-p5-01 P1 POI/Place editor map adds ~47 unnamed Tab stops** (`<path class="leaflet-interactive">`, no role/name, tooltip shows another POI's name). shots/poi-editor__map-path-focus__1440.png; t8.mjs, t9.mjs. `contextMarkersFocusable=false` documented in system.md but markers still focusable; Maps editor has none. Remainder of C1-80. Fix: non-draggable layers non-focusable (`keyboard:false`), nearby POIs as a list, one stop for the pin group. Files: map/GeoPicker.vue, CanvasMarker. 14 §4. S.
- **R2-p5-02 P1 Focus falls to body after attaching an image and after Restore/Discard of a local draft.** t14.mjs, t44.mjs, shots/poi-editor__image-attached__1440.png, shots/poi-editor__restore-banner__1440.png. Opener unmounts. Fix: focus the new Replace button; after Restore/Discard focus first field or h1 and announce; `restoreFocus` handles unmounted elements. Files: ResourcePickerDialog.vue, media card, lib/focus.ts, EditorShell.vue. S.
- **R2-p5-03 P2 Route stop Undo 22 Tab stops away and off-screen** (top 1108 px in 900 px viewport); Ctrl+Z nothing; announcement "Use Undo under the list." t21.mjs, shots/route__undo-offscreen__1440.png. Fix: sticky Undo strip near the list head or focus it briefly; accept Ctrl/Cmd+Z. S.
- **R2-p5-04 P2 At 200 % zoom the editor sticky stack covers 43 % (155 of 360 px) and hides the focused field;** `scroll-mt` uses `--editor-sticky-h` 96 px. t36.mjs, shots/poi-editor__tabbed-down__zoom200.png. Fix: non-sticky or single-row bar at small heights; scroll-margin from measured height. Files: EditorShell.vue, style.css. WCAG 1.4.10/2.4.7. S.
- **R2-p5-05 P2 User menu has no keyboard model** (ArrowDown nothing; Esc leaves focus on body); switcher behaves differently. t2.mjs. Fix: Radix dropdown pattern. Files: UserMenu.vue. S.
- **R2-p5-06 P2 Coordinate and date errors appear only on Save / not announced** (Latitude 999: no aria-invalid until Ctrl+S; Event end-before-start shows inline but not announced). t12, t13, t27.mjs, shots/poi-editor__lat-invalid__1440.png. Fix: validate on blur, announce politely. S.
- **R2-p5-07 P2 Preview stand-in exposes ~40 inert "buttons" to AT; no quick exit from Interact** (Esc does nothing; "Stop interacting" is before the content). t28, t29.mjs. Fix: `aria-hidden`/inert until Interact; Esc stops interacting and returns focus. Files: PreviewPane.vue. S.
- **R2-p5-08 P3** Latitude/Longitude placeholders look like values.
- **R2-p5-09 P3** Sort changes are not announced; count "of 72" includes archived while default segment says 66.
- **R2-p5-10 P3** Switcher `aria-controls=""` empty.
- **R2-p5-11 P3** Asset picker tiles each a Tab stop (no roving tabindex); upload dialog focuses the hidden file input.
- **R2-p5-12 P3** Esc in a create dialog discards typed text with no confirm; error summary in server order not form order; an unmapped 422 key shows the raw server message.
- **R2-p5-13 P3** Offline save raises three alerts at once.
- **R2-p5-14 P3** Forced colours: "Practical details" row text touches its border; current nav item differs only by a thicker border.
- **R2-p5-15 P3** Copy source announces only "Unsaved changes"; tab names "English default 1 of 5" lack a unit; leave guard returns focus to h1 not the trigger; h1 focus after each nav click means re-Tabbing 21 links; long drag instruction repeated per block; Dashboard keeps "Ready with N warnings" as persistent polite text.

## Round-1 fixes verified
fixed: C1-06, 07, 08, 09, 22, 38, 40, 67, 69, 70, 75, 76, 78, 79, 81, 85/88, 86, 94, 98, 102, 104, 114 · partly: C1-57 (user menu), 71 (unmapped keys), 72 (error only on Save), 77 (picker attach, Restore/Discard, user-menu Esc), 80 (~47 stops remain), 101 (Undo unfindable), 117 (focus lost after attach). Counts: fixed 22, partly 7.

## What works
Route change pattern; skip link; drawer focus management; create dialogs (Title first, focused role=alert summary with request id, links, aria-describedby, clears on edit); row ⋮ menu (arrows, Home/End, Esc); Move to position; Route stops keyboard reorder with announcements; Activate confirm focus; Preview in app Esc; 409 mine/current; map pins and handles; Category radio group; Event dates Undo; upload `role=log`.

## Unverified
Real screen readers; Create Project wizard; Guide drag by keyboard on own Guide; Place editor beyond axe; Media paging focus; toast timing; Greek/RTL labels; touch drag; activation/Apply of own POI.
