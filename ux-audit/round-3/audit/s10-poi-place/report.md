# s10-poi-place — Round 3

Audit only: nothing was edited, committed or installed. Scripts and 90-plus screenshots are in `ux-audit/round-3/audit/s10-poi-place/` (`*.mjs`, `shots/`). Records created: Place `UX-R3-s10 Place`, POIs `UX-R3-s10 POI Draft` (DRAFT with a QR trigger and a geo-proximity trigger) and `UX-R3-s10 POI Active` (ACTIVE, no pending changes at the end). `UX-R3-s10 POI Draft` was archived and then restored through the UI.

One slip to report. In the Place editor, choosing a map in the Map select links the map immediately (R3-s10-12). I selected `UX-R3-s12 Map`, a record owned by another agent, which linked my Place to it. I unlinked it within a minute and reloaded to confirm "No map". No other pre-existing record was touched. Three other existing records were only opened and viewed, with no save: `Acropolis Museum`, `Acropolis of Athens` and `Room of the Korai`.

## Verdict
The editor frame and its flows are solid, and axe is clean at 1440, 768 and zoom200 for the POI DRAFT, POI ACTIVE and Place editors. Round 3 still shows the three polish defects other agents reported, plus a readiness-count contradiction in the Activate confirm. The editor is still 2,000–2,500 px tall once populated. The last open P1 caps the editor at 85 until the Activate confirm's counts are fixed.

Score range: **76–84** across the screens audited. No P0.

## Context check
I did not open the spec files (`12`, `14` §4, `03` §1, `DECISIONS.md`, `PRODUCT.md`) in full. I relied on the facts in `BRIEF.md` §2:
- An ACTIVE Resource is edited through a Working Copy, and visitors see nothing until Apply.
- WCAG 2.1 AA is a gate.
- `DRAFT → ACTIVE → ARCHIVED` is the lifecycle, and "published" is never used.
- Readiness is "the single source of what is missing".

That last point is what R3-s10-01 breaks.

impeccable: Operate mode, interview steps skipped (I am a subagent). Rules applied:
- critique.md: "Viewable targets require browser inspection when available." Every finding below comes from a live browser run.
- audit.md: "`prefers-reduced-motion` needs an intentional alternative that preserves state change." Checked, and it passes (see "What works").
- polish.md: "Classify each drift before fixing it" as a missing token, a one-off, a conceptual mismatch or a local defect. Used in the Recommendation lines.
- operate.md, product slop test: the tool should not make the user "pause at every subtly-off component". Used for the two-Save-draft finding.

## Scores

| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| POI DRAFT, empty (1440 / 1280 / 1024 / 768 / zoom200) | 21 | 16 | 12 | 12 | 13 | 8 | 82 |
| POI DRAFT, populated (triggers, media) | 19 | 15 | 12 | 11 | 12 | 8 | 77 |
| POI ACTIVE and ACTIVE with pending changes | 19 | 16 | 11 | 10 | 12 | 8 | 76 |
| POI ARCHIVED | 22 | 17 | 13 | 12 | 13 | 8 | 85 |
| Place (outdoor, indoor sub-place, Greek tab) | 21 | 16 | 13 | 12 | 13 | 8 | 83 |
| Dialogs (Activate, Apply, 409, Discard, Leave) | 20 | 16 | 12 | 10 | 13 | 8 | 79 |

Open P1 caps these at 85. Nothing reaches 90.

Nielsen heuristics (0–4):

| Heuristic | Score |
|---|---|
| Visibility of system status | 3 |
| Match with the real world | 3 |
| User control and freedom | 3 |
| Consistency and standards | 3 |
| Error prevention | 3 |
| Recognition rather than recall | 3 |
| Flexibility and efficiency | 3 |
| Aesthetic and minimalist design | 3 |
| Error recovery | 3 |
| Help and documentation | 3 |

Total 30/40.

## Round-2 fixes verified

| ID | Status | Evidence |
|---|---|---|
| C2-60 (empty trigger rows flagged before requests) | fixed | An empty beacon row and an empty geo row sent zero requests. The summary read "6 things to fix", naming "Beacon 1, UUID" and the other fields, with `aria-invalid` on each. `shots/poiA__trigger-validation__1440x1500.png` |
| C2-66 (one Audio narration group) | fixed | One "Audio narration · One file per language" group inside Media. |
| C2-69 (coordinates validated on blur) | fixed | "abc" gave an inline error, linked through `aria-describedby`, and it is announced. |
| C2-23 (placeholders are examples) | fixed | "e.g. 37.9715", "e.g. KN-001". |
| C2-57 (focus after Activate, attach, Restore) | partly | Activate lands on `#status-card-heading`. Replace lands on the "Replace Primary image" button. Restore draft lands on the Title. Discard changes still drops to `BODY` (R3-s10-03). |
| C2-73 (parallel saves with a partial sentence) | fixed | Saving a QR row and a beacon row with a mocked 503 on the beacon gave two POSTs 3 ms apart. The text was "The point of interest was saved. Beacon 1 could not be saved: your changes to it are still in the form. Request id req-s10-503". No inline error appears on the failed row (R3-s10-08). |
| C2-93 (QR caption with PNG size) | fixed | "Download PNG (512 × 512 px)" |
| C2-55 (language-independent cards fold under a non-default tab) | fixed | Under Ελληνικά they sit in a collapsed "Other settings (all languages)" card. Greek tab 1,585 px; 2,793 px when open. |
| C2-01 (icon buttons size) | partly | "More actions" is 40×40. The two HelpHints are still 32×32 (R2-V-02 open, R3-s10-18). |
| C2-09 (error text from codes) | fixed | A canary `detail: "SECRET"` never appeared in the page. |
| C2-10 (403/404 on save) | not tested | Only 503 was mocked. |
| C2-11 (Ctrl+S offline says why) | fixed | "You are offline. Your changes are kept in this browser until you are back online." |
| C2-12 (no save toast) | fixed | The state line carries it: "Saved 11:49". |
| C2-50 (Next missing beside tabs below 1180 px) | fixed | Present at 1024. |
| C2-54 (two-line title) | partly | The h1 wraps to 2 lines (52 px, clamp 2) with `dir=auto`. The header grows from 56 to 61 px, which shifts the whole form by 5 px (R3-s10-17). |
| C2-56 (Apply secondary while dirty) | fixed | Dirty ACTIVE shows "Save and apply" as secondary and "Save draft" as primary. |
| C2-59 (own triggers block Deactivate) | partly | The Deactivate confirm shows no blocker for a POI with 3 own triggers. But "Used in (3)" still lists QR, Geo-proximity and Bluetooth beacon as "Trigger" (R3-s10-11). |
| C2-62, C2-63, C2-65, C2-68 | fixed | Not individually re-tested. The shell paths I used showed no regression. |
| C2-64 (Archived editor) | partly | There is one Restore as draft button and no stale Title hint. The Archived success toast still carries a warning triangle (R3-s10-03). |
| C2-67 (editor height ≈ 1,450) | not fixed | See R3-s10-07. |
| C2-53 (RTL) | partly | The h1 has `dir=auto`. The English-language Title field is `dir=ltr`, so the same Arabic string reads in a different order (R3-s10-17). |
| R2-V-02 (HelpHint 32 px) | not fixed | Confirmed 32×32 for "What is a Working Copy?" and "Why is AR scan target not available?". |
| R2-V-03 (sticky stack share) | not fixed | 1280×720: 112 px (16%). zoom200 (360 px high): header 56 + title row 56 = 112 CSS px, 31%. At 1440×900 the stack is 154 px (17%). |
| R2-V-04 (toast covers the form) | not fixed | See R3-s10-09. |
| R2-V-06 (side column clipped at the foot) | partly | `.side-more` is 714 px tall at `y=231`, so its bottom is at 945 against a 900 px viewport at scroll 0. A bottom fade exists (CSS mask) but sits below the fold. |
| R2-V-07 (editor height) | not fixed | See R3-s10-07. |

## Findings

**R3-s10-01 · P1 · Activate confirm under-reports readiness; sentence repeated three times**
- Screen: POI DRAFT, Activate dialog. Viewport 1440. Persona: content editor.
- Evidence: `shots/poiB__activate-confirm__1440.png` and `poiB__active-after-activate__1440.png`. Steps: save the DRAFT populated POI, click Activate.
- Observation:
  - The dialog says "3 warnings, nothing blocks" three times: in the sentence, as a standalone line, and as the list heading.
  - The success toast one second later says "Activated. 6 warnings, nothing blocks", and the side card now has "Other (3)": "Accessibility information for visitors is empty" for each of the 3 languages.
  - On the same item, "English: 2 texts missing" already counts the accessibility text, so it is counted twice.
- Why it hurts: the key decision dialog is wrong by half. The dialog names counts, not fields (known), and the figure changes right after confirming.
- Recommendation: show the same readiness list before and after activation, and de-duplicate accessibility. If the backend has a DRAFT-readiness gap, say "plus other checks run on activation". Keep the sentence once.
- Likely files: `ActivateDialog.vue`, `ReadinessList.vue`, `completeness.ts`.
- Spec constraint: `12` and BRIEF §2, "Readiness is the single source".
- Effort: S for copy and dedupe; M if the backend must supply the missing list.

**R3-s10-02 · P2 · "Next missing: English" focuses a filled Title** (verified)
- ACTIVE POI at 1440. Practical details is folded and shows "0 of 2 filled". English shows "2 texts missing", yet the click focuses `#f-title` (already filled) and `aria-expanded` stays `false`.
- The Greek variant works because the Greek Title is empty.
- Recommendation: expand the fold and focus the first empty field.
- Files: `TranslationsPanel.vue`, `useResourceEditor.ts`.
- Effort: S.

**R3-s10-03 · P2 · Discard drops focus to `BODY`; neutral confirmations carry a warning triangle** (verified)
- After "Discard changes" the focus is `BODY`. Its toast "Changes discarded" carries the warning icon (`text-warning`). The "Archived" toast has the same icon.
- Shots: `poiB__after-discard__1440.png`, `poiA__archived__1440.png`.
- Recommendation: focus the Status heading, as Activate and Archive do, and use a neutral or success icon.
- Files: `EditorShell.vue`, `AppToast`.
- Effort: S.

**R3-s10-04 · P2 · Two "Save draft" buttons visible at once** (verified)
- Dirty ACTIVE POI:
  - header: "Save and apply" (secondary, 143×40) and "Save draft" (primary, 106×40);
  - banner: "Save draft" (secondary, 122×32).
- Screenshot: `poiB__active-dirty__1440.png`.
- The primary action sits to the right of the secondary one, and the same verb appears at two sizes. When clean, the banner's Save draft and Discard are aria-disabled, which is fine.
- Recommendation: drop the banner's Save draft, or make the banner state-only.
- Files: `WorkingCopyBanner.vue`.
- Effort: S.

**R3-s10-05 · P2 · Primary button focus ring invisible; no pressed state** (verified)
- Header primary on keyboard focus: `outline 2px solid rgb(255,255,255)`, offset 2 px, plus a 4 px `rgb(76,29,139)` shadow, which is the button's own colour. The ring merges into the button.
- Idle, hover and pressed backgrounds read `rgb(76,29,139)`, `rgb(58,20,105)` and `rgb(58,20,105)`, so pressed equals hover. The secondary button does change (238 to 233).
- Recommendation: use a focus ring with a gap, for example `outline: 2px solid var(--ring); outline-offset: 2px` in a colour that contrasts with both the canvas and the button. Give primary a pressed state (darker, plus a 1 px translate or inset shadow).
- Files: `ui/button`.
- Effort: S.

**R3-s10-06 · P2 · Language tab strip clips the focus ring** (verified)
- The tab strip is `overflow: auto` with the same box as the focused tab (`y253 h52`, outline offset 2 px), so only a 2 px vertical bar at the right edge shows.
- Screenshot: `poiB__tab-focus__1440.png`. In forced colours the selected tab is a filled block, which is fine.
- Recommendation: add padding inside the scroller of at least 4 px, or draw the ring with an inset shadow.
- Files: `TranslationsPanel.vue` and the tab strip.
- Effort: S.

**R3-s10-07 · P2 · Editor height (R2-V-07 and C2-67 still open)**
- All measures are `main` scroll height at 1440×900. Card heights are in px; gaps are a uniform 16.

| Card | DRAFT empty | DRAFT with QR + geo | ACTIVE with 3 triggers |
|---|---|---|---|
| Header, breadcrumb and banner above the form | about 190 (ACTIVE adds the 42 px banner, about 232) | about 190 | about 232 |
| Texts (heading + tabs + card) | about 600 | about 600 | about 600 |
| Placement | 318 | 318 | 318 |
| Media | 234 | 234 | 304 (primary image row) |
| How visitors reach it | 147 | 722 | 1,074 |
| Details (folded) | 48 | 48 | 48 |
| **Total** | **1,454** | **2,028** | **2,496** |

- Empty DRAFT was 1,408 in round 2 and is 1,454 now; the new "Filter places…" input accounts for about 46 px. The Texts card shows heading, tabs and summary, and has 592 px of card with Practical details open.
- What makes it long: the triggers card, at about 330 px per QR row and about 240 to 290 px per geo or beacon row. Each row spends height on the code field, a 128 px QR block and a Runs-on checkbox row. Narrow views are longer: 1,818 at 1024 and 2,014 at zoom200.
- Recommendation: collapse trigger rows after saving into a one-line summary row, "QR 2akds9n7 · Web, Mobile, Kiosk", with an Edit disclosure. That brings 3 triggers to about 250 px.
- Files: `TriggersCard.vue`.
- Effort: M.

**R3-s10-08 · P2 · Error summary overlays the form and is clipped at zoom200; failed row not marked**
- At 1500 px high, the sticky summary (pink alert plus a white strip with a Close button) covers the Title and tabs, about 250 px.
- At zoom200 (`poiB__error-summary__zoom200.png`) the heading "5 things to fix" is half hidden, form text bleeds through the top edge ("ordinary link."), and the last item is cut off at the bottom.
- After a partial save the failed beacon row shows no inline error at its row. Only the summary names it.
- Recommendation: cap the summary height with its own scroll and an opaque top edge, put the Close button inside the alert, and mark the failed row.
- Files: `EditorShell.vue`, `TriggersCard.vue`.
- Effort: M.

**R3-s10-09 · P2 · Toast still covers the form (R2-V-04)**
- At 1440×900 the toast spans x 614–995 over the Place/Longitude fields of the form column, which ends at 992. The Activated, Discarded and Archived toasts all do this.
- Shots: `poiB__after-discard__1440.png`, `poiB__active-after-activate__1440.png`.
- Recommendation: anchor toasts to the bottom of the side column, or to the bottom-right of the app frame outside the form column.
- Files: `AppToast.vue`, `toastOffset.ts`.
- Effort: S.

**R3-s10-10 · P2 · 409 dialog: no visible reason for the disabled button; unclear about non-conflicting edits**
- A real 409 was forced with two browser contexts. "Keep my changes" is aria-disabled, but the reason "Choose Mine or Current for the field first" is visually hidden. A sighted user sees a faded button with no reason.
- The dialog does not say my own non-conflicting Title change is kept. It says "discards your 2 changes" for the Reload button.
- Shot: `poiA__409-dialog__1440.png`.
- Recommendation: show the reason in text under the footer, and add "Your other change (Title) is kept either way."
- Files: `ConflictDialog.vue`.
- Effort: S.

**R3-s10-11 · P2 · "Used in" lists a POI's own triggers**
- `Used in (3)` shows "QR code avs8948j · Trigger", "Geo-proximity 30 m · Trigger" and "Bluetooth beacon e2c56db5-dffb-48d2-b060-d0f5a71096e0 / 100 / 7 · Trigger". That reads like other items depend on this POI. The Deactivate confirm correctly shows no blocker.
- Recommendation: hide own triggers from "Used in", or label them "Its own ways in".
- Files: the Used-in builder.
- Effort: S.

**R3-s10-12 · P2 · Map select links at once while the header says "Unsaved changes"**
- Place editor. Picking a map shows the toast "Linked · The place page shows it now." immediately. There is no confirm and no Undo, but the header still shows "Unsaved changes" and Save is primary.
- Shot: `place__type0-linked__1440x1500.png`.
- Recommendation: either make Map a form field saved with Save, or label it "Link now" and add Undo.
- Files: `PlaceEditorView.vue`.
- Effort: S.

**R3-s10-13 · P3 · Revision shows "Not saved yet" on a created record, then disappears, then reads 2**
- On a freshly created record, Status shows "Revision: Not saved yet".
- After the first Save the row is gone for a DRAFT.
- After Activate it reads "2".
- After a Working Copy save, "Updated 11:48" does not move (the pending save was at 11:49).
- Recommendation: show "Revision 1" from creation, always show the row, and make Updated reflect the Working Copy save.
- Files: `EditorStatusCard.vue`.
- Effort: S.

**R3-s10-14 · P3 · Title hint on ACTIVE items**
- "Required in the default language before it can be activated." shows on an ACTIVE POI.
- Recommendation: drop it once ACTIVE.
- Files: Texts panel.
- Effort: S.

**R3-s10-15 · P3 · Side card inconsistencies** (measured)
- Heading sizes: Status is 16/700; "What needs attention", "On this page", "Translations" and "Used in" are 14/700.
- Card padding: "On this page" is 12 px; the others are 16 px.
- Alignment: the Status card top is at y=235 against the "Texts" h2 at y=231, 4 px off. The side column top matches the form column's first heading to within 4 px.
- Cards: Texts is `p-6` with `shadow-1`; the side cards are 16 px.
- Recommendation: one side-card heading size, 16 or 14 for all.
- Files: `EditorStatusCard.vue`, `EditorShell.vue`.
- Effort: S.

**R3-s10-16 · P3 · Side column foot and top edge**
- `.side-more` is 714 px tall (`y=231` to 945) at 1440×900, so 45 px, including the fade, sits below the fold at scroll 0.
- The inner scroll cuts text mid-line at the top: "Other (1)" shows half-height. There is no top fade.
- Shot: `place-indoor__side-scrolled__1440.png`.
- Recommendation: set `max-height` to the viewport minus the sticky offset, and fade both edges.
- Files: `EditorShell.vue`.
- Effort: S.

**R3-s10-17 · P3 · RTL string**
- The Arabic title in the h1 is `dir=auto`, but the same string in the English Title field is `dir=ltr` and reads in a different order (the dash).
- A two-line RTL h1 is right-aligned inside a 367 px box, so it floats away from the breadcrumb (`poiB__rtl-title-saved__1440.png`). The header grows 56 to 61 px and the form shifts 5 px.
- Recommendation: use `dir=auto` on text fields, and reserve the second line.
- Files: panel fields.
- Effort: S.

**R3-s10-18 · P3 · HelpHint buttons 32 px at a fine pointer (R2-V-02)**
- Two icon buttons measure 32×32. Fix in `ui/help-hint`.
- Effort: S.

**R3-s10-19 · P3 · Beacon row head wraps**
- At 1440, the beacon row's chips "Bluetooth beacon" and "Mobile app only" push "Test in preview" and "Remove" onto a second line. The QR and geo rows have one line, so the action columns do not line up.
- Shot: `poiB__filled-unsaved__1440x1800.png`.
- Recommendation: put "Mobile app only" in the description.
- Files: `TriggersCard.vue`.
- Effort: S.

**R3-s10-20 · P3 · Garbled duplicate-beacon sentence**
- "Another point of interest in this Project already uses this beacon 1, uuid." The "1, uuid" text is a leftover field list.
- Recommendation: "Another point of interest already uses this UUID, Major and Minor."
- Files: `triggers.ts`.
- Effort: S.

**R3-s10-21 · P3 · Duplicate nested headings**
- The side readiness card has two `h2` with the same text, "Before you activate" and "What needs attention", an outer and an inner one.
- Effort: S.

**R3-s10-22 · P3 · Place picker is two steps**
- The filter input and the select are separate. After "UX-R3-s10" shows "1 of 25 match", the select still reads "Not inside a Place".
- Recommendation: auto-select a single match, or show a list.
- Files: `FilteredSelect.vue`.
- Effort: S.

Not reproduced (the round-3 hint list):
- "Leading-space indentation in the closed Place select": the closed Parent select on a sub-place shows its value flush with other fields at x=294.
- "Primary button ring white": confirmed as R3-s10-05.
- "zoom200 focused textarea under the sticky header": the Summary textarea sat clear of the 111 px header after a click.

## What works
- All dialogs open on their h2, Esc returns focus sensibly, and each is scrollable at zoom200.
- Reduced motion keeps a 120 ms fade on dialogs (normal is 180 ms plus a 240 ms rise) and removes tab and fold animation.
- Forced colours: the primary button keeps a 2 px border, status chips keep a border, and the selected tab becomes a filled block.
- Restore row: "Unsaved changes from 17 Nov 2026, 12:03 are kept in this browser. Restore (2 fields) / Discard", 46 px, with focus on the first field.
- Leave guard: "They stay in this browser as a draft…", and Esc returns focus to the h1.
- Archived: read-only, one Restore button, an info box that points to it, and focus on the Status heading.
- Sticky behaviour:
  - the banner is sticky at 1440×900 (42 px, stack 154 px, 17%) and static below 800 px height (1280×720 and zoom200);
  - at 768 the header keeps the Save-and-apply control, and at zoom200 "Save and apply" moves into More.
- Greek tab: source beside target, "Copy source", and the fold for language-independent cards.
- Place editor: Level cards, Type with an explanatory hint, "New map" and "New floor plan", "Inside this place" links, and a 220 px map.
- Automatic trigger activation: a created trigger is activated by a second POST without any UI.
- Field rhythm is consistent: label 14/600, hint 12 px with 6 px gaps, 6 px to the field, 40 px inputs, and a 16 px gap between all cards.
- axe wcag2a, wcag2aa, wcag21a and wcag21aa returned no violations, including the Deactivate dialog at 1440, 768 and zoom200.

## Unverified / could not test
- "Show all N" in Used in: no Place or POI with more than 5 uses was reachable without touching other agents' records.
- 403 and 404 on save (C2-10).
- Floor-plan-linked Place editing with my own plan; I viewed `Room of the Korai` read-only (a sub-place that shows a parent floor plan in "Used in").
- AR scan target (disabled by design).
- Timing of Test in preview: I confirmed the link `/preview?trigger=<id>`, not what the preview does. That belongs to the preview agent.
- Tab-stop counts and the Ctrl+Z undo path in the Place editor.
- Pre-existing records were never saved, applied or archived.

Screenshots (all under `ux-audit/round-3/audit/s10-poi-place/shots/`) cover:
- empty DRAFT at all five viewports;
- tall 1440×1500 views;
- Activate, Apply, Discard, Archive and 409 dialogs;
- Restore row, partial failure, offline save and leave guard;
- Archived, Greek tab, RTL title, long Greek title, and forced colours.
