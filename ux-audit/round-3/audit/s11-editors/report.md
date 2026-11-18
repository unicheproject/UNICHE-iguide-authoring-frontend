# s11-editors — Round 3

## Verdict
- Route, Guide and Category are close to shippable.
- Event has two P1s: an invalid time silently rewrites the end date to 1 Jan 2000 with no message, and the red border disappears in forced colours.
- Route's remove/Undo, keyboard reorder, ArrowDown/Enter picking and the R2-V-01 blocker are verified good.
- The shared frame still drifts in four places: Texts-to-tab spacing, Category language tabs, the Deactivate pattern, and the per-kind completeness and readiness story.
- Final-round scores: Route 80-84, Guide 80-84, Event 66-72, Category 80-84.

Records created (project `UX Audit – Populated`): POIs `UX-R3-s11 Éclair Stop Alpha`, `UX-R3-s11 Άγιος Stop Beta`, `UX-R3-s11 Stop Gamma`, `UX-R3-s11 Stop Delta`, `UX-R3-s11 Stop Echo`, `UX-R3-s11 Stop Foxtrot`, `UX-R3-s11 Stop Golf`; Route, Guide, Event and Category `UX-R3-s11 …`. The Category is ACTIVE and used by 6 POIs. Ids are in `ids.json`. Pre-existing records were opened read-only (seed route "Acropolis Highlights" for the map).

Method: Playwright via `session.mjs` as admin at 1440, 1280, 1024, 768 and zoom200, plus forced-colors, reduced-motion and page.route 422/409/503. Impeccable interview steps skipped (subagent).

## Context check
The specs, `DECISIONS.md` and `PRODUCT.md` were not opened in this session (see "Unverified"). The facts below come from `BRIEF.md` and `consolidated.md`.
- `12`: a Resource's readiness is the single source of "what is missing".
- `14` §4: every reorder needs keyboard alternatives, and errors are linked, announced and summarised.
- `03` §1: lifecycle is DRAFT / ACTIVE / ARCHIVED.
- D-079: non-default tabs show only translatable fields, with "Other settings (all languages)" collapsed.
- `PRODUCT.md`: not read.

Impeccable rules cited (read via the brief's headers):
- critique: Assessment A and B must be isolated sub-agents. Not applicable here; recorded as an unrun path.
- audit: "Missing ARIA … errors announced". Applied to Event's date fields.
- polish: "Classify each drift: local defect, one-off, conceptual mismatch". Applied to frame drift.
- operate: "State-rich semantic vocabulary: hover, focus, active, disabled … standardise". Applied to R3-s11-15.

## Scores
Columns, in order: Task clarity /25, Visual hierarchy and craft /20, Consistency /15, Copy and feedback /15, Accessibility /15, Responsiveness and state coverage /10, Total. Caps apply: an open P1 caps a screen at 85.

| Screen | Task | Craft | Consist. | Copy | A11y | Resp. | Total |
|---|---|---|---|---|---|---|---|
| Route editor | 21 | 16 | 12 | 12 | 12 | 8 | 81 |
| Guide editor | 21 | 16 | 12 | 12 | 12 | 8 | 81 |
| Event editor | 16 | 14 | 11 | 9 | 7 | 8 | 65 (cap 85, drops to ~70 once the P1s are weighed) |
| Category editor | 21 | 16 | 11 | 13 | 12 | 8 | 81 |

Nielsen, 0-4 each:

| Heuristic | Score |
|---|---|
| 1 Visibility of status | 3 |
| 2 Match with the real world | 3 |
| 3 User control | 4 (Undo and Ctrl+Z are strong) |
| 4 Consistency | 2 |
| 5 Error prevention | 2 |
| 6 Recognition over recall | 3 |
| 7 Flexibility | 3 |
| 8 Minimalist design | 3 (triple repeats) |
| 9 Error recovery | 2 |
| 10 Help | 3 |

## Round-2 fixes verified
Scope covers the C2 items in my remit plus R2-V-01/02/03/04/07 where reachable.

| ID | Verdict | Evidence |
|---|---|---|
| R2-V-01 (route blocker agrees in header, card and confirm) | fixed | Header "1 to fix before activating, 3 warnings", card "Blocking: No stop is an active point of interest yet", inline alert and confirm all agree (`shots/route__4stops__1440.png`, `route__activate-click__1440.png`). |
| C2-34 (completeness counts stop texts and story blocks) | partly | Route tab counts stop texts ("1 of 16"). Guide with an empty story is only a warning and Activate stays primary (R3-s11-09). |
| C2-52 (one date formatter) | fixed | "Wed 18 Nov 2026 · 10:00–11:00". Greek renders "Σάβ 12 Δεκ 2026 · 18:00–19:00". |
| C2-55 (language-independent controls) | partly | Event fixed: Greek tab shows read-only dates plus "Other settings (all languages)" collapsed. Category Greek tab still shows "Category setup" open and editable (R3-s11-05). |
| C2-69 (date errors on blur, announced) | partly | `aria-invalid` and blur validation exist. Hour 25 / minute 61 have no message and no announcement, and end-before-start text "It must end after it starts." is visible but not in a live region (R3-s11-01). |
| C2-70 (Undo bar visible, focused, Ctrl+Z) | fixed | Focus lands on Undo. Bar is sticky 734-788 of 900. Ctrl+Z restores. Guide behaves the same. |
| C2-71 (route map honest, fan-out) | partly | Guidance, unplaced stops as links and "Show as list" work. Pins 1-4 still overlap on the seed route (R3-s11-10). |
| C2-72 (comboboxes, picker keys, Repeat clamp, icon arrows) | partly | Picker ArrowDown/Enter works. The clamp sentence "60 is more than the limit of 52 weeks at a time, so 52 is used. Repeat again for more." appears. Icon grid arrows move by row (6 columns). Search is still accent-sensitive (R3-s11-03). |
| R2-V-02 (HelpHint 32 px) | not tested | Not reached in my screens. |
| R2-V-03 (sticky chrome share) | still open | Header 56 + page head 56 = 112 of 360 px (31%) at zoom200. |
| R2-V-04 (toast overlaps form column) | not observed | The toast in the Category activate shot sat in the bottom centre. |
| R2-V-07 (editor height) | out of scope | |

## Findings

### P1

**R3-s11-01 P1 — Event: invalid start time gives a red border only, and silently rewrites the end to 1 Jan 2000**
- Screen and state: Event editor, Dates, Add a date. Viewports: 1440 and forced-colors 1280. Job: authoring an event.
- Evidence: `shots/event__hour25__1440.png`, `event__day45__1440.png`, `event__invalid__forced-colors.png`, script `e3.mjs`.
- Steps to reproduce:
  1. Add a date.
  2. Type Hour 25, or Minute 61, or Day 45, then Tab.
  3. Measured: `aria-invalid="true"` on that field only.
  4. No message text appears anywhere.
  5. The live regions hold only "Unsaved changes", "3 warnings…" and "Date 1 added.".
  6. The End fields change to 1 / January / 2000 / 1:00.
  7. The card shows an "Ended" chip.
  8. A warning says "No upcoming scheduled date…".
  9. In forced colours the red border vanishes, so the field looks valid.
- Why it hurts: the error is colour-only (fails `14` §4 and WCAG 1.4.1 and 3.3.1), the end date is destroyed, and the "Ended" chip and "no upcoming date" warning mislead.
- Recommendation:
  - Per-field sentence linked by `aria-describedby`, e.g. "Hour must be 0 to 23".
  - Announce it politely.
  - Never rewrite the end from an unparseable start; keep the last good end.
  - Show the error icon plus text, not border colour alone.
  - Show "Ended" only for a valid past date.
- Likely files: the `DateTimeFields` component, the Event occurrences editor. Effort: S-M.

**R3-s11-02 P1 — Event: 31 February 2027 is not flagged**
- Evidence: `shots/event__31feb__1440.png`.
- Observation: Day 31, Month February, Year 2027 shows no `aria-invalid` on any field, yet the summary collapses to "Date 1 Ended" and the end becomes 1 Jan 2000, the same silent corruption as R3-s11-01. Day 45 is flagged but 31 February is not.
- Recommendation: validate the day against the month and year, with the same linked sentence. Effort: S.

### P2

**R3-s11-03 P2 — Accent-sensitive search (stop picker and EntityCombobox)**
- Evidence: scripts `r2.mjs` and `e6.mjs`.
- Measured, stop picker: "eclair" gives "0 items match", while "ÉCLAIR" matches the "Éclair" record. "αγιος" and "ΑΓΙΟΣ" give 0 against "Άγιος".
- Measured, Event POI combobox: "eclair" and "αγιος" give no options.
- Recommendation: fold diacritics and final sigma with `normalize("NFD").replace(/\p{M}/gu,"")` and `toLocaleLowerCase`. Effort: S.

**R3-s11-04 P2 — Ended date cards dim all text via `opacity: .8`**
- Evidence: `shots/event__ended-card__1440.png`, script `e6.mjs`.
- Measured: the label colour is rgb(86,96,112), which is 5.83:1 at full opacity. Under the 0.8 opacity it is 3.73:1. That fails 4.5:1 for 12 px helper text and labels, and the same dimming applies to inputs.
- Recommendation: mark ended with the chip and a muted background, not opacity. Effort: S.

**R3-s11-05 P2 — Category language tabs still expose structural fields**
- Evidence: `shots/category__greek-tab__1440.png`, script `x1.mjs`.
- Observation: under the Greek tab, "Category setup" (Applies to, Level, 24 icons, height 623) is open and editable. The Event Greek tab shows the dates read-only and "Other settings (all languages)" collapsed, and Route and Guide show only translatable sections.
- Recommendation: apply D-079 here too. Effort: S.

**R3-s11-06 P2 — Texts heading to tab-bar spacing differs across kinds**
- Measured at 1440, gap between the "Texts" h2 bottom and the tablist top: POI 0, Route 0, Guide 0, Event 16, Category 16 (tablist y 211.4 versus 227.4; `f1.mjs`).
- Evidence: `shots/category__fresh__1440.png` against `route__fresh__1440.png`.
- Everything else in the frame matches: h1 20 px / 700 at y 131.5, Save 68x40 at x 1296, status card top 210, section header padding 16/24, body padding 12/24/24.
- Recommendation: pick one value (0) and fix Event and Category. Effort: S.

**R3-s11-07 P2 — Over-announcement in live regions**
- Add stops: one Enter fires "Added … as stop 1.", "… added. 1 added in total.", "4 items match, 1 added", plus the "Unsaved changes" and "No active stop" alerts, several of them in separate regions.
- Reorder: every move re-announces the unchanged "1 to fix before activating, 3 warnings.". It appeared 5 times in one run.
- Remove: both an sr-only status ("…removed. Press Ctrl+Z or use Undo…") and the visible bar status ("…removed.").
- Event: the clamp sentence is announced twice.
- Recommendation: one polite region per action, and announce readiness only when its counts change. Effort: S-M.

**R3-s11-08 P2 — Activate confirm repeats the readiness sentence three times**
- Evidence: `shots/route__activate-click__1440.png`; Category and Guide confirms behave the same.
- Observation: "(1 to fix before activating, 3 warnings)" in the paragraph, again as the "1 to fix…" heading, and a third time as the chip text.
- Recommendation: drop the parenthetical and keep the list. Effort: S.

**R3-s11-09 P2 — Guide: empty story is a warning, but the status copy says a story is required**
- Evidence: `shots/guide__empty-after-remove__1440.png`.
- Observation: the Status card says "Activate it once it has … a story, every paragraph and heading written…". With zero blocks the card shows a warning only ("The guide has no story yet"), the primary Activate stays enabled, and the confirm says nothing blocks. Route blocks this case ("No active stop"). G-039 backend gap.
- Recommendation: client-side blocking reason, as Route does, or soften the copy. Effort: S.

**R3-s11-10 P2 — Route map: pins overlap and the guidance repeats**
- Evidence: `shots/route__seed-map-v2__1440.png`, `route__seed-map-v2__768.png`.
- Observation: pins 1, 3 and 4 sit within 24 px of each other (26 px pins at x 571-595, y 438-455). Pin 1 is almost fully covered, so fan-out does not separate them at the default zoom.
- Also: two legend lines ("The line is the route…" and "Stops are joined in order."), and a "Show as list" that toggles a numbered list beside the editable stop cards.
- Recommendation: fan out or cluster-expand at the default zoom, and merge the legend lines. Effort: M.

**R3-s11-11 P2 — Deactivate-while-used is inconsistent, and the Category dialog title is misleading**
- Evidence: `shots/category__deactivate-used__1440.png` against `route__seed-map__1440.png`.
- Route: the button is disabled, with inline "Used by 1 event and 3 guides. Remove it from each of them first."
- Category: the button is enabled and opens "Deactivate UX-R3-s11 Category?", which contains no Deactivate action, only Close. The sentence is "It is still used by the items below. Remove it from them first, then try again." It does not say which field to change.
- Recommendation: one pattern, e.g. disabled button, reason, and a "Show where it is used" link. Effort: S.

### P3

**R3-s11-12 P3 — Guide heading label reads "Heading 2, level 3"**
- Position and level collide. After pressing H3 the label read "Heading 2, level 3". Use "Heading (block 2)".

**R3-s11-13 P3 — Missing space in copy**
- The Undo bar shows "Paragraph 1 removed.1 more can be undone." (`shots/guide__empty-after-remove__1440.png`).

**R3-s11-14 P3 — Position select is 32 px tall next to 40 px buttons**
- Measured: the select is 76x32 and the neighbours are 40x40, in the stop rows and the story rows.

**R3-s11-15 P3 — Pressed state equals hover**
- Ghost move buttons: hover and mouse-down both compute rgb(238,240,243).
- Disabled ones use opacity .6.
- Handle hover has no visible change besides cursor `grab`.

**R3-s11-16 P3 — Stop row copy and tooltips**
- The chip title reads "The point of interest is DRAFT" (raw enum).
- The draft warning sentence repeats on every row, so 4 rows give 4 warnings.

**R3-s11-17 P3 — Undo bar floats 112 px above the viewport bottom**
- At 1440x900 the bar spans 734-788 and covers the next row's header while leaving about 112 px of content visible below it. In the forced-colours shot it hides stop 2's controls. Dock it lower, or add scroll margin.

**R3-s11-18 P3 — Narrow viewports: status text truncates and sticky chrome is large**
- zoom200 and 768: "Draft · 3 warnings, nothing blo…" is truncated (`shots/event__top__zoom200.png`).
- Sticky chrome is 112 of 360 px, which is R2-V-03.

**R3-s11-19 P3 — 422 summary**
- The summary says "Occurrence 1: …" while the editor calls it "Date 1".
- The Close button sits in a detached white strip below the pink alert, and the sticky summary covers the tab bar (`shots/event__422__1440.png`).

**R3-s11-20 P3 — Repeat weekly Until and weeks**
- A non-existent day (31 November) gets "Choose the last day to repeat on." with no "does not exist" wording.
- "Add dates" looks disabled but has no stated reason beyond that sentence.
- Weeks field "0" or empty gives no message.

**R3-s11-21 P3 — EntityCombobox value keeps its hierarchy indentation**
- After choosing a Place, the input holds "   Acropolis Museum" with leading spaces. Trim the indentation from the value.

**R3-s11-22 P3 — Link targets are 18 px tall**
- The unplaced-stops links (162-207x18) and the "Used in" links (140-188x18) are below 24 px.
- They are adjacent in lists, so the WCAG 2.2 spacing exception probably does not apply.

**R3-s11-23 P3 — Slug breaks mid-token**
- In the Status card on the seeded route, "acropolis-highlights-classical" then "-walk" (`shots/route__seed-map__1440.png`).

**R3-s11-24 P3 — Misc**
- Hour is labelled "(0 to 23)" but Minute has no range.
- The Format hint is duplicated for Starts and Ends.
- End-before-start flags all five End fields although only one is wrong.
- In forced colours the disabled "Routes" scope chip looks like an enabled one.

## What works (keep these)
- Undo: focus goes to Undo after a remove. Ctrl+Z restores. The bar names the item. Both Route and Guide behave the same.
- Keyboard reorder: handle ArrowUp/Down moves the stop, with "Moved … to position 1 of 4." announced. The position select and the arrow buttons agree. Every control has an accessible name with the item.
- R2-V-01: the route blocker is the same in the header, the card, the inline alert and the confirm.
- Repeat weekly: clamps 60 to 52 with a plain sentence, and previews "Adds 52 dates, every week from … to …".
- Event dates: moving the start keeps the length (25 Nov 14:30 gives 15:30 end). End-before-start gives a sentence ("It must end after it starts."). The Greek tab shows the dates read-only with a "Go to English" link.
- Category: icon radio group with arrow keys. A lock reason with a "Show where it is used" link. The merged "Used in" card collapses after 5 with "Show all 6".
- Layout: no horizontal overflow at 1280, 1024, 768 and zoom200.
- Reduced motion removes the row and Undo transitions.
- Error handling: 422, 409 and 503 never echo "SECRET-DETAIL", and each shows the request id.

## Unverified / could not test
- Specs, `DECISIONS.md` and `PRODUCT.md` were not opened. Context facts come from the brief and `consolidated.md`.
- Drag-and-drop with the mouse was not exercised (keyboard and select reorder only).
- Hover and active states were measured on the move-down and handle buttons only.
- The route picker was tested at 1440 only. Zoom, 768 and 1024 shots cover the route top and full page only.
- Toast offset against the Undo bar was not captured together.
- R2-V-02 and R2-V-04 are not reachable from my screens.
- Slow-network and offline states for these editors were not run (422, 409 and 503 only, on Event).
- Dates in a non-Athens time zone were not tested.
