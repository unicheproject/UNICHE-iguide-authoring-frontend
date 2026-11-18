# s11-editors — Round 1 (Route, Guide, Event, Category editors)

(Saved by the orchestrator from the agent's returned report: the agent's Write call was refused. Evidence:
`shots/` (~70) and scripts `a*.mjs`, `g*.mjs`, `e*.mjs`, `c*.mjs` in this folder.)

## Verdict
The four editors work end to end; Working Copy, where-used and keyboard reorder are solid. Structure is the weak
spot: core content buried in one long scroll, actions not sticky, translation tabs re-render the structural form,
and at 768/200 % the activation card sits at the bottom and Event occurrence controls get clipped.
Counts: P0 0, P1 4, P2 14, P3 7. Nielsen 26/40.

## Context check
- 12 §3 Route: fewer than two stops is a warning (editor shows it, plus a blocking message at zero stops).
- 14 §4: every reorder needs move up/down and set position — Route stops and Guide blocks have them.
- 03 §1: no citable sentence found; relied on the brief's lifecycle summary.
- D-029: stops reorder by drag, Move up/down and position; stop-link warning on ACTIVE routes.
- PRODUCT.md: tablets must stay fully usable by touch.
- impeccable: critique.md cognitive load; audit.md touch targets/text scaling; operate.md inconsistent component vocabulary.

## Scores (Task 25 / Visual 20 / Consistency 15 / Copy 15 / A11y 15 / Responsive 10)
| Screen | Scores | Total |
|---|---|---|
| Route | 15/14/10/11/8/6 | 64 |
| Guide + StoryEditor + translation tabs | 14/13/9/10/8/6 | 60 |
| Event | 17/14/9/11/9/7 | 67 |
| Category | 20/15/11/12/11/8 | 77 |
| Shared editor chrome | 17/14/10/12/9/6 | 68 |

## Findings (R1-s11-editors-NN)
- **01 P1** Translation tabs repeat the whole structural form with no default-language text beside it. Guide Greek
  tab shows 16 empty blocks with position/move/insert/remove controls (48 buttons), placeholder the only label;
  Route Greek tab re-renders stops with reorder/remove, plus metadata and media. A translator can delete/reorder
  blocks for every language. Evidence: shots/guide-translation-el__top__1440.png, guide-translation-el-tall__1440.png,
  route-translation-el-tall__1440.png. Fix: translation tabs show only translatable fields with read-only source; no structure controls.
- **02 P1** Core content buried; Save/Apply/Activate scroll away. Route Stops after Media, Triggers and Metadata;
  6-stop Route ~3200 px, 16-block Guide ~2700 px; no sticky save bar; at 768/zoom200 status card + Activate +
  readiness at y≈3890 of 4624. Evidence: route-6-stops-tall__1440, route-dirty-before-leave__1440,
  route-active-tall__768, route-active__section__768. Fix: sticky action bar with readiness count, section anchors,
  Stops first on Route, collapsed readiness/Activate bar under the title on tablets.
- **03 P1** Event occurrence row loses the Cancelled toggle and Remove button at 200 % zoom (WCAG 1.4.10).
  Evidence: shots/event-editor-tall__zoom200.png. Fix: stack each occurrence as a card on narrow widths.
- **04 P1** Removing a stop, block or occurrence is instant: no confirm, no undo, no announcement; after "Remove
  paragraph 3" focus drops to body; remove ✕ sits beside the move arrows. Repro: g4.mjs, a6.mjs. Fix: "Removed — Undo"
  bar, live-region message, focus to the next row.
- **05 P2** "Stops in a different order than visitors see" warning still shown after Apply; Apply confirmation
  never mentions broken stop links or QR codes.
- **06 P2** Route stop targets tiny: move buttons 15.8×21 px, drag handle 11×15 px with no role/tabindex/label,
  remove ✕ similar (WCAG 2.5.8).
- **07 P2** Guide readiness repeats "Text is not translated (…)" per block; group by language.
- **08 P2** en-GB / en-US date formats mixed (list row "Fri, Dec 4, 2026, 07:00 PM–10:00 PM · 12 Nov 2026";
  datetime-local 11/13/2026 10:00 AM). Time-zone note confusing and offers no way to set a zone.
- **09 P2** End-before-start: no inline error until Save; error persists after correction.
- **10 P2** Route 422 (distance "2400.5"): summary at top but focus stays on Save (Event moves focus to summary);
  distance accepts decimals client-side; unit (metres) only in placeholder.
- **11 P2** Create dialogs inconsistent: Route cards with ✓ and no default; Category pills without ✓ and
  preselected defaults; Category says "Code" where others say "Slug".
- **12 P2** Icon grid: 20 aria-pressed buttons, no group label, no arrow keys (20 tab stops), border-only selected state.
- **13 P2** Event Place/POI/Route are native selects with 60+ options, no search; POI list includes drafts.
- **14 P2** Route POI picker closes after each pick (6 stops = 6 round trips); 6 visible rows; no Place/status
  filter; unlabelled code like "103"; DRAFT POIs selectable then warn.
- **15 P2** Lifecycle actions outweigh editing actions: Deactivate full primary, Archive large outline pill, Apply
  in the header, Save draft/Discard small links in a beige banner.
- **16 P2** axe on Guide: label-content-name-mismatch (serious ×2): heading-level buttons "H3" vs aria-label "Level 3".
- **17 P2** At 768 the left nav never collapses (main 532 px); long stop titles push ✕ out of line; only zoom200 gets a Menu button.
- **18 P2** Guide editor has no "How visitors reach it" card although 12 §3 says it is common to every kind; Category
  has no Preview in app. Needs a decision.
- **19 P3** New Route shows a red blocking message and amber warning at once plus the empty text.
- **20 P3** Toast covers side-column cards; "complete and visible" while warnings remain.
- **21 P3** Route map pins overlap; map not sticky.
- **22 P3** Sub-title repeats the name and shows internal "version N" that jumps by several per save.
- **23 P3** "Repeat weekly" adds one occurrence per click with no count or end date.
- **24 P3** Copy: "Used by 1 route. Remove it from them…"; deactivate dialog gives no direct fix action.
- **25 P3** Guide paragraphs are plain textareas; images are separate blocks (spec 12 says inline). Check against later decisions (D-065).

## What works (keep)
Keyboard reorder (Position select + Move buttons, focus follows, live region "Moved … to position 2 of 4"); drag as
an addition; Working Copy flow (banner, pending chip, Apply confirm, Restore/Discard after reload, Leave guard);
Category scope lock with reason and where-used block on Deactivate; create-dialog field errors and Esc focus
return; D-063 map with numbered pins; axe clean on three of four kinds; Greek renders fine.

## Unverified
Forced 409/422/5xx on working-copy saves; whether readiness items are links; Event translation tab; indoor Route;
Route with 20+ stops; touch drag; forced colors; Category and Guide at 768/zoom200 not reviewed; Preview in app
only on Guide (popover overlays form; Esc restores focus); `impeccable detect` not run.

Records created: UX-s11-editors Route (ACTIVE), Guide (ACTIVE, pending WC), Event (DRAFT), Category (ACTIVE), 6 Stop POIs (via API).
