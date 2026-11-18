# s11-editors — Round 2 (Route, Guide, Event, Category)
(Saved by the orchestrator from the agent's returned report, condensed: its Write call was refused. ~80 shots, scripts a1–h1.mjs and records.json in this folder.)

Operate mode; interview skipped. Rules: critique.md browser inspection; audit.md keyboard (R2-s11-01); operate.md inconsistent vocabulary (-02, -07, -08).

## Verdict
The four editors share one frame (sticky header + banner, side column, Remove with Undo, one reorder family); axe clean, no console errors, no horizontal scroll at five viewports. All round-1 P1s in this group closed; one new P1 (zoom200) and cross-screen inconsistencies remain. Route 77, Guide 77, Event 78, Category 78 (capped 85). P0 0, P1 1, P2 9, P3 4. C1: fixed 9, partly 10, not fixed 0, regressed 0. Nielsen 30/40 (3,3,4,2,3,3,3,3,3,3).

## Findings
- **R2-s11-01 P1 Sticky stack hides focus at 200 % zoom.** category-editor__scrolled-sticky__zoom200.png, category-icon__focused__zoom200.png: sticky bottom y=215 CSS px; focused icon radio at 124–196 fully covered; ~145 of 360 px left for the form. Fix: below ~700 px height banner non-sticky or merged into header; `scroll-padding-top` from measured sticky height; shorter banner text. Files: EditorShell.vue, WorkingCopyBanner.vue. 14 §4. M.
- **R2-s11-02 P2 "Texts" heading only on POI/Place;** Route starts at "Stops", Event "Dates", Guide "Story", Category "Category setup"; "On this page" lists "Texts" pointing to an unheaded card. Fix: one `EditorSection` "Texts" on every kind. S.
- **R2-s11-03 P2 Route map card contradicts the stop list; pins overlap.** With 4–5 stops the card still says "Pick the first stop below…"; amber "Place has no map" note plus a plain text list repeating stops; pins 5–7 on one coordinate; map not sticky. Fix: text only at 0 stops; "Stops 1–5 have no position" with links; fan out pins; list behind "Show as list". S–M.
- **R2-s11-04 P2 Undo bar off-screen after removing a stop** (announcement "Use Undo under the list"; stop cards ~250 px). Fix: anchor Undo to viewport bottom or inline; collapse optional walking-instruction field. Files: RemovedBar.vue, undoRemove.ts. S.
- **R2-s11-05 P2 Date/time formats mixed** (native "02/09/2027 12:00 PM" beside "Tue, 9 Feb 2027 · 12:00–14:00"; header "Saved 04:23 PM" vs side card "13 Nov 2026, 16:21"). Fix: `lang` on inputs or typed day/month-name/24 h fields; shared formatter for "Saved". C1-39. S–M.
- **R2-s11-06 P2 Guide with empty story reads "Complete" and activates** (Activate dialog "2 things need attention, 0 blocking"). Fix: count story blocks in completeness; "Story is empty" in "Before you activate"; blocking rule needs a backend readiness code (GAPS). S (frontend).
- **R2-s11-07 P2 Event translation tab exposes structural fields** (Place/POI/Route comboboxes, Booking URL, Media, triggers, Details editable under Ελληνικά; Route and Guide hide them). Fix: non-default tabs show only translatable fields + read-only dates (D-079). S.
- **R2-s11-08 P2 Category shows usage twice ("Used in (1)" + "Used by" + info box); broken copy** "Used by 1 item. Remove it from it first." Fix: one card "Used by 1 route"; "Used by 1 route. Choose another category in that route first." Files: CategoryEditorView.vue, EditorStatusCard.vue. S.
- **R2-s11-09 P2 Apply dialog names no change; Apply looks live with nothing pending** (faded violet; Save draft/Discard look enabled). Fix: list changed sections; truly disable with reason. S–M.
- **R2-s11-10 P2 Save errors shift the form; 5xx drops focus.** 422 summary inserted above tabs pushes form ~170 px, plain bullets; 503 focus on body; 409 "Occurrences Mine: 2 items / Current: 2 items". Request ids shown. Fix: stable summary area; focus summary/toast for 5xx and offline; one-line diff for list fields. Files: EditorShell.vue, ConflictDialog.vue. M.
- **R2-s11-11 P3** Event comboboxes look like native selects; hint far from Place; Route picker search: ArrowDown/Enter do nothing.
- **R2-s11-12 P3 Dead duplicate `src/components/ReorderControls.vue` (no importer);** editors use `components/editor/ReorderControls.vue`. Stops and blocks now look the same; lists use ⋮ (acceptable). Delete dead file.
- **R2-s11-13 P3** Repeat weekly 99 silently becomes 52; icon grid ArrowDown moves along sequence not down the 7-column grid; scope switch not announced; end-before-start error wraps.
- **R2-s11-14 P3** Version number jumps (0 → 6). Hide unless needed or label "Revision".

## Round-1 fixes verified
fixed: C1-101, 102, 103, 104, 22, 24, 29, 79, 119 · partly: C1-105 (Q-012), 106, 11 (copy), 12 (Apply dialog), 26, 32, 34 (Event), 39, 71, 123.

## What works
Remove with Undo everywhere (never expires); Route picker multi-add with filters; reorder announcements; activation confirm with warning count; Event inline validation, repeat preview, time-zone note, read-only dates; Category radios and lock reason; forced colours keep marks; Guide Greek tab source beside fields; leave guard; offline banner.

## Unverified
Real pointer drag and touch; long Greek beyond tab layout; reduced-motion run; Guide image/reference insertion; 422 field-path mapping; Event/Guide Working Copy + Apply; slow-network skeletons. Records: `UX-R2-s11` Route (ACTIVE, applied), Guide, Event, Category (ACTIVE, used by the Route), 6 POIs (4 ACTIVE).
