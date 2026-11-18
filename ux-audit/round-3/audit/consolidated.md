# Round 3 consolidated audit findings

Date: 2026-11-17. Consolidator of 15 round-3 reports (p1-editor, p2-manager, p3-translator, p4-kiosk, p5-a11y, p6-edge, s7-chrome, s8-dashboard, s9-lists, s10-poi-place, s11-editors, s12-maps, s13-media, s14-preview, design-system + `design-system/cleanup.md`). Most reports were saved by the orchestrator from the agents' replies; s10, s11 and s13 did not read the specs, DECISIONS.md or PRODUCT.md (thin context checks, their measured findings stand). All agents ran as `admin`. Original IDs are `R3-<agent>-nn` exactly as printed in each report (`R3-p1-editor-nn`, `R3-p2-nn`, `R3-p3-translator-nn`, `R3-p4-kiosk-nn`, `R3-p5-nn`, `R3-p6-nn`, `R3-s7-chrome-nn`, `R3-s8-nn`, `R3-s9-lists-nn`, `R3-s10-nn`, `R3-s11-nn`, `R3-s12-maps-nn`, `R3-s13-nn`, `R3-s14-preview-nn`, `R3-ds-nn`). Short codes in cluster text: `p1-03` = `R3-p1-editor-03`, `ds-03` = `R3-ds-03`. Hit-by lists agent codes (p1 editor, p2 manager, p3 translator, p4 kiosk, p5 a11y, p6 edge, s7 chrome, s8 dashboard, s9 lists, s10 POI/Place, s11 editors, s12 maps, s13 media, s14 preview, ds design-system).

Check by script over the 15 report files (`R3-<agent>-nn` identifiers found in each report): 289 original findings found, 289 mapped to clusters, **0 missing, 0 duplicated, 0 unknown**; 101 clusters; cluster severity = highest member severity (recomputed by the script).

```
verify: found=289 mapped=289 missing=[] duplicated=[] unknown=[]
```

## Totals

| | Unique (de-duplicated C3) | Original reports |
|---|---|---|
| P0 | **0** | 0 |
| P1 | **18** | 20 |
| P2 | **61** | 122 |
| P3 | **22** | 147 |
| Total | **101** | 289 |

Original counts are by the severity in each finding line (p2 states 10 P2 and 12 P3 in its header but lists 20 findings, 9 P2 and 9 P3 plus one P1 and R3-p2-17 as a bundle of P3 nits; s7 states 13 P3, lists 12). Round 2 for comparison: 94 unique (P0 0, P1 31), 234 originals plus the p6-edge addendum.

Open P1 clusters (18): C3-01, C3-02, C3-03, C3-07, C3-08, C3-14, C3-17, C3-20, C3-38, C3-40, C3-41, C3-54, C3-55, C3-56, C3-64, C3-65, C3-77, C3-83. **No P0** was reported by any agent. Round 2 closed or reduced most of its 31 P1s; the 18 left are mostly new or residual specifics, ten of them are rated P1 by one agent and P2 by others (disputed, see Conflicts: C3-01, C3-02, C3-03, C3-07, C3-08, C3-14, C3-17, C3-41, C3-56, C3-65). ROOT clusters (11): C3-01, C3-02, C3-03, C3-07, C3-09, C3-14, C3-21, C3-38, C3-49, C3-50, C3-85.

### The 10 most impactful problems

1. Primary and danger buttons show no visible focus ring (white ring, 1.0:1), tab strips clip the ring and the menu highlight is 1.14:1: the main action and the tabs are invisible to a sighted keyboard user (C3-01, C3-02, C3-03; all ROOT, small CSS fixes).
2. Event date fields: an invalid hour, minute or day is a red border only (colour alone, nothing announced) and silently rewrites the End date to 1 Jan 2000; 31 February is accepted (C3-38).
3. Readiness still disagrees with itself: the Activate confirm says 3 warnings, the toast and the card 6, accessibility is counted twice, and a Route with no stops, an Event without dates or a Guide with no story activates unchallenged (C3-14, C3-16).
4. Editor focus handling: Discard, Move and cross-page moves drop focus to `<body>`, and "Next missing" focuses the already filled Title (and invites overwriting it) (C3-07, C3-08, C3-17; C2-57 and C2-45 residue).
5. Work-safety under failure: dismissing the session-ended dialog leaves Save on "Saving..." forever, and a partial trigger failure says "Nothing was changed" then blocks the retry (C3-83, C3-20).
6. Preview: the new tab ignores `orientation` and `real` ("Open at real size" does nothing) and the editor panel puts Close and Expand about 1,000 px below the picture (C3-64, C3-65).
7. Dashboard: a SUSPENDED or unreadable app status is headlined "Live", the Tab order jumps back and forth below 1100 px, and the first-run guide ticks steps 3 and 5 for visiting a placeholder (C3-54, C3-55, C3-56).
8. List Filters popover: unreachable at 200 % zoom, no accessible name or Close, and a visible-label mismatch with the accessible name (WCAG 2.5.3) (C3-40, C3-41).
9. Asset editor: the "Decorative image" checkbox stays ticked after Esc or "Keep it described" while the model says nothing changed (C3-77).
10. List core at 1280/1024: Title column 118-206 px with 4-line titles, trigger chips overprinting neighbours, toasts over the form column; plus the sign-in code left in the address bar (C3-42, C3-43, C3-26, C3-84).

Runners-up: touch targets of 18-21 px on text links (C3-48), Working Copy conflict still the old dialog (C3-32), offline banner over "New" (C3-86), HelpHint still 32 px (C3-49).

## Round-2 fix status

One row per `C2-nn` rated by any round-3 agent (all 94 were, most by several), plus R2-V-01 to R2-V-07. Final status = worst credible rating; where agents differ the Conflicts section says which evidence is stronger. Agents: p1 editor, p2 manager, p3 translator, p4 kiosk, p5 a11y, p6 edge, s7 chrome, s8 dashboard, s9 lists, s10 POI/Place, s11 editors, s12 maps, s13 media, s14 preview, ds design-system.

**Counts (C2-01 to C2-94): fixed 37, partly 54, not fixed 3, regressed 0.** Not fixed: C2-14, C2-45, C2-67. No regression was reported, but p1 rates C2-50 (Next missing) regressed in its own table: "Next missing" now focuses a filled Title (C3 cluster C3-17), so C2-50 is counted partly here and the regression sits in that cluster.

| C2 | Final status | Agent ratings | Note and C3 cluster |
|---|---|---|---|
| C2-01 | **partly** | p5 fixed, ds fixed, s9 fixed (kebab 40x40), p4 partly, s10 partly, s12 partly | Icon buttons 40 px; text links 18-21 px, HelpHint and checkboxes remain (C3-48, C3-49) |
| C2-02 | **partly** | ds fixed, s7 fixed, p5 partly | Dialog, menu, popover borders fixed; menu focus inverted, `shadow-drop-*` lines vanish (C3-03, C3-97) |
| C2-03 | **partly** | ds partly | Sections B and C of the old cleanup list are still open (C3-97, C3-99) |
| C2-04 | **partly** | ds fixed, p5 partly | 120 ms fade kept; button transitions still 1 ms |
| C2-05 | **partly** | p1 partly, p3 partly, p4 partly, p5 partly, s10 not fixed, p6 not fixed (worse with errors) | 1440 stack 112-154 px; zoom200 31 %; banner released on short screens loses Save draft (C3-21, C3-23, C3-25) |
| C2-06 | **partly** | p1 partly (18 %), p5 partly (23 % at 1280x720), s9 fixed (104 of 720 px) |  |
| C2-07 | **fixed** | p2 fixed, s7 fixed |  |
| C2-08 | **partly** | p2 partly, s7 partly | Rows honest but 15 of 17 say "Setup not checked"; counts wobble (C3-90) |
| C2-09 | **partly** | p2 fixed, s7 fixed, s8 fixed, s10 fixed, s14 fixed, p6 partly | Canary never rendered; 503 wording still two dialects (C3-85) |
| C2-10 | **fixed** | p6 fixed |  |
| C2-11 | **partly** | p2 partly, s7 partly, p6 partly, s10 fixed | Banner covers "New", clipped under the editor head (C3-86) |
| C2-12 | **partly** | s7 partly, p6 partly, p4 partly, s10 fixed | Identical toasts collapse; toast still over the form (C3-26, C3-27) |
| C2-13 | **partly** | p5 fixed, s7 partly, p6 partly, s14 unverified | List error cards leave focus on body; "keeps ending" announces "Places loaded" (C3-87, C3-11) |
| C2-14 | **not fixed** | p2 not fixed, p6 not fixed, s7 fixed (saved session only) | Fresh sign-in and "Sign in again" keep `#state=...&code=...` (C3-84); p2/p6 stronger |
| C2-15 | **partly** | p2 fixed, s7 fixed, p6 partly | Dialog dismissible, but dismissal leaves Save stuck (C3-83) |
| C2-16 | **partly** | p2 fixed, p5 fixed, s7 partly | Name fixed; `aria-controls=""` remains (C3-92) |
| C2-17 | **fixed** | p5 fixed, s7 fixed |  |
| C2-18 | **partly** | p5 partly, s7 partly | Esc returns to the editor h1, title/announcer read the other Project (C3-11) |
| C2-19 | **fixed** | p2 fixed, s7 fixed |  |
| C2-20 | **fixed** | p5 fixed, s7 unverified |  |
| C2-21 | **partly** | p2 partly, p5 partly, s7 partly, s8 fixed, s9 fixed, s13 fixed | CLS 0.07-0.11 on lists, no h1 in skeleton (C3-91) |
| C2-22 | **partly** | p2 partly | Template not preselected; Greek default silent, Continue reason only a title (C3-95) |
| C2-23 | **fixed** | p2 fixed, s10 fixed |  |
| C2-24 | **partly** | p2 fixed, s8 partly | "Ready to go live" over "Launch not available" (C3-57) |
| C2-25 | **partly** | p2 fixed, s8 partly | Chip name differs between header and page (C3-62) |
| C2-26 | **partly** | p2 partly, s8 partly, s9 fixed | Guide persists and opens dialogs; steps 3/5 tick on visit, dead end (C3-56) |
| C2-27 | **fixed** | p1 fixed, p2 fixed, s8 fixed |  |
| C2-28 | **fixed** | p2 fixed, s8 fixed |  |
| C2-29 | **partly** | p2 partly, s8 partly | Counts card 525 px below 1100 px (C3-60) |
| C2-30 | **partly** | s8 partly | NAVIGATION blocker not exercised; blocked rows lose cause (C3-58) |
| C2-31 | **partly** | p2 partly, s8 partly, s14 partly | No hints on Preview Working/Live and Fire (C3-67) |
| C2-32 | **partly** | p2 fixed, s8 partly | Tab run clean; focus order jumps below 1100 px (C3-55) |
| C2-33 | **partly** | p3 partly, p6 partly, s10 partly | Counted twice after activation; 3 warnings then 6 (C3-14) |
| C2-34 | **partly** | p3 fixed, s11 partly, s13 partly, s9 partly | Route stops and asset alt count; empty Guide story, Route 0 stops, Event no dates only warn (C3-16); asset blocker remains (C3-14) |
| C2-35 | **partly** | s9 partly | Confirm lists warnings but not structural gaps (C3-15, C3-16) |
| C2-36 | **fixed** | p1 fixed, s9 fixed |  |
| C2-37 | **fixed** | p1 fixed, s9 fixed | Paging works; focus after paging off-screen (C3-10) |
| C2-38 | **fixed** | s9 fixed |  |
| C2-39 | **fixed** | p1 fixed, s9 fixed | Media count line still ignores filters (C3-78) |
| C2-40 | **fixed** | s9 fixed, s13 fixed |  |
| C2-41 | **fixed** | p1 fixed | s9 did not test |
| C2-42 | **partly** | p1 fixed, p3 partly, s9 fixed | Dots fixed; Title column 118-126 px at 1280/1024 (C3-42) |
| C2-43 | **partly** | s9 partly | Drift remains (C3-43, C3-47) |
| C2-44 | **partly** | s9 partly | One-pass summary, Esc discard, slug maxlength fixed; control types differ (C3-93) |
| C2-45 | **not fixed** | p1 not fixed, s9 partly | Moves silent, no Undo, focus lost cross-page and after drag (C3-08) |
| C2-46 | **fixed** | s9 fixed |  |
| C2-47 | **partly** | s9 partly | Move error not linked (C3-46) |
| C2-48 | **fixed** | p3 fixed, s9 not verified |  |
| C2-49 | **partly** | p3 partly | Two language selects remain (C3-51) |
| C2-50 | **partly** | p3 partly, s9 fixed, s14 partly, p4 not tested | Breadcrumb loses the worklist; Preview count not a link (C3-51) |
| C2-51 | **partly** | p1 fixed, p3 partly, s13 fixed | "Complete" still two meanings for an asset (C3-14) |
| C2-52 | **fixed** | p3 fixed, s11 fixed |  |
| C2-53 | **partly** | p3 partly, s9 partly, s10 partly | `dir=auto` on h1/search/rows; editor fields and Latin-led titles still reorder (C3-50) |
| C2-54 | **partly** | p1 partly, p3 fixed, s10 partly | h1 clamp works; header grows 5 px, list wraps to 4 lines (C3-42) |
| C2-55 | **partly** | p3 partly, s10 fixed, s11 partly, s13 partly | Category and Asset keep structural controls (C3-52) |
| C2-56 | **partly** | p1 fixed, p3 partly, s10 fixed | Save and apply lists no changes (C3-15) |
| C2-57 | **partly** | p5 fixed, p4 fixed (Reset), s14 fixed (Reset), p1 partly, s10 partly, s9 partly, p6 partly, s13 partly | Body after Discard, Undo, Restore, upload Cancel/Retry, list errors (C3-07, C3-09, C3-87) |
| C2-58 | **fixed** | p5 fixed, s12 fixed | Three Tab stops (Skip map, pin group, Nearby POIs) |
| C2-59 | **partly** | s10 partly | Deactivate no longer blocked by own triggers; "Used in" still lists them (C3-19) |
| C2-60 | **fixed** | s10 fixed |  |
| C2-61 | **fixed** | p4 fixed, s14 fixed |  |
| C2-62 | **partly** | s10 fixed, p6 partly | Three-way merge for DRAFT; Working Copy conflict old dialog, Apply 409 no request id (C3-32) |
| C2-63 | **fixed** | p6 fixed | Redundant after a failed save (C3-89) |
| C2-64 | **partly** | p6 partly, s10 partly | Warning triangle on success toasts (C3-27) |
| C2-65 | **partly** | p1 partly, s10 partly | "Not saved yet" on saved records, jumps (C3-28) |
| C2-66 | **fixed** | p1 fixed, s10 fixed |  |
| C2-67 | **not fixed** | p3 partly, s10 not fixed | 1,454-2,496 px (C3-30) |
| C2-68 | **fixed** | p5 fixed, p6 fixed, s10 fixed | New: sticky summary overlay (C3-25) |
| C2-69 | **partly** | p1 fixed, p5 partly, s10 fixed, s11 partly, s12 fixed, p6 fixed | Event hour/minute/day not announced (C3-38) |
| C2-70 | **fixed** | p5 fixed, s11 fixed |  |
| C2-71 | **partly** | s11 partly | Pins 1-4 overlap (C3-35) |
| C2-72 | **partly** | s11 partly | Search still accent-sensitive (C3-53) |
| C2-73 | **partly** | p1 partly, s8 fixed, s10 fixed | Save 0.45-1.5 s; Media cold load 3.3-4.0 s (C3-80) |
| C2-74 | **partly** | p1 fixed, s9 fixed, p5 partly | `/` works; kind-to-kind still Tab/nav |
| C2-75 | **fixed** | p1 fixed, s13 fixed |  |
| C2-76 | **fixed** | p1 fixed, p5 fixed, p6 fixed, s13 fixed |  |
| C2-77 | **fixed** | p5 fixed, p6 fixed, s13 fixed |  |
| C2-78 | **partly** | p5 fixed, s13 partly | zoom200 shows one row (accepted limit) |
| C2-79 | **partly** | s13 fixed, p6 partly | "Needs your decision" wraps (C3-82) |
| C2-80 | **fixed** | s13 fixed |  |
| C2-81 | **fixed** | s13 fixed | HelpHint text generic |
| C2-82 | **partly** | p1 fixed, s13 partly | Count line and Filters badge ignore filters (C3-78) |
| C2-83 | **fixed** | s13 fixed |  |
| C2-84 | **fixed** | p4 fixed, s12 fixed |  |
| C2-85 | **fixed** | s12 fixed |  |
| C2-86 | **partly** | s12 partly, p5 fixed | Armed bar covers 16-19 % of the plan (C3-71) |
| C2-87 | **partly** | s12 partly | Handles clipped, legend, New map jump (C3-72, C3-74, C3-76) |
| C2-88 | **fixed** | p4 fixed, s14 fixed | Replaced by a new problem (C3-65) |
| C2-89 | **partly** | p4 fixed, s14 partly | Scale fixed; Expand far below the picture (C3-65) |
| C2-90 | **fixed** | p4 fixed, s14 fixed |  |
| C2-91 | **fixed** | p4 fixed, p5 fixed, s14 fixed | R2 conflict 4 settled: inert + aria-hidden until Interact (p5 53 focusables) |
| C2-92 | **fixed** | p4 fixed, s14 fixed |  |
| C2-93 | **partly** | p4 partly, s10 fixed | No print size; link breaks mid-word (C3-69) |
| C2-94 | **fixed** | s9 fixed, p6 verified |  |
| R2-V-01 route blocker agrees | **fixed** | s11 fixed |  |
| R2-V-02 HelpHint 32 px | **not fixed** | p2, p4, p5, p6, s7, s10, ds (7 agents) | C3-49 |
| R2-V-03 sticky chrome share | **not fixed** | p1, p3 partly, p4, p5, p6, s10, s11 | C3-21; p4 accepted as is |
| R2-V-04 toast overlaps form | **not fixed** | p1, p4, p6, s7, s10; s11 not observed | C3-26 |
| R2-V-05 row menu first focus | **fixed** | p1 fixed, p5 fixed, s9 fixed | menu opens on Move, Esc returns to kebab |
| R2-V-06 side column foot | **partly** | s10 partly | C3-31 |
| R2-V-07 populated POI editor height | **not fixed** | p1 1,983 px, s10 up to 2,496 px | C3-30 |

## Conflicts between agents

1. **Dialog Close position.** p5-16: Close is first in the Tab/DOM order in Activate, Upload and Session dialogs and last in create dialogs and the Asset picker. s9-21: Close X centre is 5 px lower than the title centre; p2-17: 14 px lower at zoom200. ds read the code: all 15 `AppDialog`/`FormDialog` users share one 40 px Close at top right (`-mr-2`). **Stronger:** ds for the visual position (code plus measurement), p5 for the Tab order (measured walk). Both can be true; filed as a P3 order item inside cluster C3-92, not as an inconsistency of position.
2. **Row menu: focus on open, and focus after a move.** s9: the menu opens on the first enabled Move item, Esc returns to the kebab, and menu moves keep focus on the kebab ("focus to body" not reproduced); drag-drop lands on `<main>`. p5: opens on Move. p1: opens on the container (no longer on Deactivate), and Move to position from page 2 leaves `BODY` focused. **Stronger:** both are right for different cases. p1 moved a row across pages (the focused row left the DOM), s9 moved within a page. The defect is cross-page moves and drag (C3-08); menu open focus is fixed (R2-V-05).
3. **Zoom200 focused textarea under the sticky header.** p5-11 (geometry only, no screenshot): ring clipped at T203, centre covered by the header. s10: the Summary textarea sat clear of the 111 px header after a click. p3: 12 Tab stops measured, none hidden. **Stronger:** s10 and p3 (observed). Kept as a P2 item (C3-22) flagged "probably not reproducible"; the sticky share itself (112 px, 31 %) is real (C3-21).
4. **"Next missing" works or not.** p3: Next missing finishes the current language and focuses the first empty field. p1 (14 clicks, all `TEXTAREA#f-title`) and s10 (`aria-expanded` stays false): it focuses the filled Title. **Stronger:** p1 and s10; p3 used records with an empty Title, s10 notes the Greek variant works because the Greek Title is empty (C3-17).
5. **Code in the address bar (C2-14).** s7: fixed (no hash after a saved session, live redirect not repeated). p2 (fresh context) and p6 ("Sign in again"): `#state=...&code=...` persists 4-6.7 s and after a Back. **Stronger:** p2 and p6, who ran a real sign-in; s7 states it did not repeat the live redirect (C3-84). p2 rates it P2 (single-use PKCE code) and says escalate if the owner treats auth artefacts as a hard-constraint breach.
6. **Preview in app panel severity.** s14-02: P1 (Close/Expand at y 1305 at 1440 and 1179 at 1280, Expand scrolls the picture off screen, no-op at 1024 and below). p4-03: P2 (1,050 px below, Close reachable by scrolling or Esc). **Stronger:** s14 (measured at 1440 and 1280 plus the no-op at 1024); P1 kept (C3-65). Scores: s14 68-75, p4 80 at 1440 and 86 at 1024/768, p5 84; the screen row uses 68.
7. **Severity disputes, same defect.** Primary-button focus ring (C3-01): p5 P1, s10 and ds P2. Tab-strip ring clip (C3-02): ds P1, p5, s10, s14 P2. Menu highlight (C3-03): ds P1, p5 and s9 P2. Filters label-in-name (C3-41): p5 P1 (axe serious), s9 P2. Readiness after activation (C3-14): s10 P1, p3, p6, s13 P2. Discard focus (C3-07): p1 P1, s10 P2. Move feedback (C3-08): p1 P1, s9 P2. Next missing (C3-17): p1 P1, s10 P2. First-run guide (C3-56): p2 P1, s8 P2. All are taken at the highest credible severity; those marked with ds-only or single-agent P1 are the first to reconsider if the owner wants fewer P1s.
8. **Stand-in and assistive technology (R2 conflict 4).** Resolved: p5 reports `inert` + `aria-hidden` with 53 focusables until Interact; s14's Tab order has no stand-in stops idle; p4 agrees. C2-91 fixed. The CDP AX tree was still not run by anyone.
9. **Dashboard Populated score.** p2 85, p5 85, s8 78. **Stronger:** s8 (two P1 probes: SUSPENDED headline, focus order). Row 14 uses 78.
10. **C2-57 (focus to body) and C2-01 (icon buttons).** p5 rates C2-57 fixed (Activate, attach, Undo, Esc, upload h2) and C2-01 fixed (kebab 40 px); p1, p6, s9, s10, s13 and p4 find the leftovers (Discard, Undo/Restore, upload Cancel/Retry, list errors; 18-21 px text links). **Stronger:** the narrower, later probes; both stay partly.
11. **s7 chrome scores 91-94 vs 78-85 elsewhere.** s7 scored sign-in 93, header 92, nav 94, page heads 91. Not credited at 90+: s7 did not shoot sign-in at 768/zoom200 and ran its keyboard walk on 28 chrome stops only; the header user menu uses `DropdownMenuItem` whose highlight is 1.14:1 (ds P1, C3-03); primary buttons (Sign in) have the white ring (C3-01). The scoreboard takes the lowest agent score and caps the header at 85.
12. **Agent count mismatches.** p2 header counts (P1 1, P2 10, P3 12) do not match its 20 findings; s7 says P3 13, lists 12. Findings were counted from the finding lines.
13. **s14-15 echoes rejected values** (`lang`, `surface`, `t`) in new-tab notices: s14 rates it P3 inside a bundle; the BRIEF hard constraint says rejected values are never echoed in errors. Kept at P3 as filed (C3-70); the owner may want it P2.

## Not covered

- **Accounts:** every round-3 agent used `admin`; the `curator` account (authoring only) was not run, so permission-dependent states (Create Project as curator, Catalogue access) are unverified.
- **Sign-in and session states:** configuration-error card (s7 would have needed a missing runtime setting), silent SSO landing as its own state (p2 scored it with sign-in), sign-in at 768 and zoom200, identity-provider-down splash, Back after sign-in, Project switch with unsaved work completed (p6 opened the switcher only).
- **Error injection only on the POI editor** (p6): Place, Category, Event, Route and Guide save-error matrices, Apply 503/422 (the conflict dialog stayed open in the script), two-context real 409 for Event/Category, Guide-block and Event-date undo, floor-plan image blocked, tab-close beforeunload text. p1's forced 5xx/409/422 missed the real save URL, so p6 and s10 carry that evidence.
- **Dashboard:** blocked card with a real NAVIGATION blocker, translation bars, an uninitialised Project, contrast of the muted "Done"/"Next step" text, cause of the zoom200 CLS 0.68 (s8-12), real touch targets.
- **Translation:** a real RTL ProjectLanguage (only typed Arabic/Hebrew in LTR languages), Greek polytonic fallback font, Apply across a 409/offline during a translation save.
- **Maps and floor plans:** lists only at 1440, New map and New floor plan dialogs and Map editor at 1280/1024 not repeated, no touch run for New map or the floor plan editor at 1024, fan-out only with already-placed POIs, drag reorder in the Floor plans list, real WebGL basemap (headless used the raster fallback), axe on the plan editor at 1024, Save path of floor-plan pins.
- **Media:** upload progress between 0 and 100 % (mock held at 0), persisted "Save and finish" in Describe now, server activation refusal, long Greek names, forced-colours editor shot captured but not studied (s13).
- **Preview:** CDP AX tree, offline, RTL, forced colours and reduced motion on p4's screens, C2-13 Page-not-found sub-path, editors other than the POI.
- **Cross-cutting:** HelpHint size R2-V-02 and toast R2-V-04 by several agents, R2-V-07 not measured by p3/p4/p5/s11, 1024 and 768 axe sweeps (1440 and a 7-route zoom200 run only), real NVDA/VoiceOver (ariaSnapshot and live-region logs only), skeleton colours and animation (ds probe did not delay the list), hover/active states beyond focus, own-trigger deactivation (G-037), Out-of-scope screens one-shot render check after the round.
- **Thin context checks:** s10, s11 and s13 did not read the specs, DECISIONS.md or PRODUCT.md (s13 also not the impeccable reference files); their measured findings are kept, but spec-backed severity calls from them are weaker.
- **Environment effects:** records named `UX-R3-<agent> ...` remain (several ACTIVE; p6 left a POI with a QR trigger and a working copy). s10 linked and unlinked a Place on s12's map by mistake. Counts drift between agents (warnings 103/104, library 48-50 files, lists 92-109 rows); Vite dev-server timings are not production numbers.

## Job walk summary

Result per persona job (pass = done unaided; partial = done with a workaround or friction; fail = not achievable or wrong result), as reported and cross-checked against the clusters.

**Content editor, daily power user (p1-editor)**

| Job | Result | Note |
|---|---|---|
| Create 3 POIs with image, audio, Category, Place, map, QR and geo; activate through the confirm | pass | about 40 s per POI scripted; hesitation at "2 texts missing" naming no fields (C3-15, C3-17) |
| Pending changes: Save draft, Ctrl+S, leave, find, Apply, Discard | pass / partial on Discard | focus to body after Discard (C3-07) |
| URL state, sort Updated, paging | pass | edited-yesterday is one click |
| Reorder: position, top/bottom, drag, Undo | partial | works but silent, no Undo, focus lost (C3-08) |
| Media: find audio, per-row text, attach, upload | pass | Audio plus alt gives an empty list with no hint (C3-81) |
| Keyboard between kinds, slow interactions | pass | Media cold load 4 s (C3-80) |

**Project manager / first-time author (p2-manager)**

| Job | Result | Note |
|---|---|---|
| Sign in from a fresh context | pass | code left in the address bar (C3-84) |
| Return to the last Project, switch Projects | pass | Continue to ... is one click; 5.3 s switch |
| Create Project step 1, abandon, resume, finish | pass | disabled Continue and Greek default hesitation (C3-95) |
| Guide to first Place and first POI | pass | dialogs open from the guide, Place preselected |
| Guide steps 3-5 | partial | tick on visit, dead end (C3-56) |
| Dashboard Populated: what blocks launch, what next | pass | under 5 s; "Ready to go live" over "Launch not available" (C3-57) |
| Dashboard drafts-only; session-ended dialog | pass | guide competes with Show drafts |

**Translator (p3-translator)**

| Job | Result | Note |
|---|---|---|
| Italian worklist in each list and Media | pass | 3 actions; lost when leaving an item (C3-51) |
| Translate POI, Route stops, Guide blocks, Event | pass | source beside target, Copy source, marks agree with the card |
| Category and Asset translation | partial | structural controls editable under language tabs (C3-52) |
| Greek search, accents, long Greek, dates | pass with P2 | stop picker accent-sensitive (C3-53) |
| ACTIVE item through pending changes and Apply | pass with P2 | Save and apply lists no changes (C3-15) |
| RTL | partial | explicit `dir` in editors, no real RTL language (C3-50) |

**Kiosk operator / on-site tablet author (p4-kiosk)**

| Job | Result | Note |
|---|---|---|
| Preview Kiosk, Mobile, Web; size and scale | pass | scale label matches the frame |
| Fire QR/geo/beacon, Reset, Interact, Skip | pass | stale "Opened by" line after a Geo fire (C3-69) |
| Open in new tab with query parameters | pass (p4) / fail for real size and orientation (s14) | C3-64 |
| QR print, copy, download, test | partial | no print size (C3-69) |
| Preview in app panel 1440/1024/768 | partial | Expand/Close far below (C3-65) |
| Tablet drawer, cards, row menu, dialogs | pass | 18-21 px text links remain (C3-48) |
| Tablet editor on a short screen | partial | Save draft scrolls away (C3-23) |
| Map swipe and Move map; floor-plan placement by touch | pass / partial | armed prompt covers the plan (C3-71) |

**Keyboard / screen-reader author (p5-a11y)**

| Job | Result | Note |
|---|---|---|
| Switch Project, Home search, nav drawer, session dialog | pass | axe 0 on 24 routes at 1440, 7 at zoom200 |
| POI list: segments, Filters, sort, pager, row menu, Move | partial | pager focus off-screen, Filters unnamed (C3-10, C3-41) |
| Open POI, edit, Ctrl+S, language tabs, Next missing | partial | tab ring clipped (C3-02) |
| Activate confirm; create POI with forced 422; place by coordinates | pass | primary ring invisible (C3-01) |
| Route reorder, Guide block remove, Undo, Category icons, picker, upload | pass | one polite message per action still open (C3-12) |
| Event DateTimeFields | fail | C3-38 |
| Preview page and in app | pass with P2 | stand-in header ring 1.38:1 (C3-04) |

**Error / edge-case tester (p6-edge)**

| Job | Result | Note |
|---|---|---|
| Recover from a failed save (5xx, 503, network) | pass | fixed sentence, request id, changes kept |
| Recover after the session ends | partial | dismissed dialog leaves Save stuck (C3-83) |
| Resolve an edit conflict | partial | Working Copy 409 old dialog, Apply 409 no request id (C3-32) |
| Create items with errors (422, 503, offline, double submit) | pass | wrong diagnosis on 503 (C3-85) |
| Save triggers when one row fails | fail | C3-20 |
| Archive/deactivate while referenced; coordinates; leave guard | pass | stale announcement after the guard (C3-11) |
| Upload limits, held files, retry, many files | pass with nits | focus drops on Cancel (C3-09) |
| Lists with failed reads | partial | Routes Categories silent, false 0 on Maps (C3-87) |

## Backend (GAPS) and spec-change candidates new or confirmed in round 3

- **G-039 (still open)** Guide with an empty story, Route without stops, Event without dates are not readiness blockers (s9-10, s11-09, cluster C3-16).
- **G-037 (still unverified)** own triggers as "used by": the UI no longer blocks Deactivate for them, but "Used in" lists them (s10-11); backend behaviour not observed.
- **Verify (no gap yet):** slug maximum accepted by the Catalogue (p2-06: a 119-character slug is refused, limit unknown); `/files` first request size 200 vs 48 shown (s13-08); Working Copy 409 payload carries `current` (p6-19 shows the old dialog).
- **Spec-change candidates (QUESTIONS.md, `spec-change-request`, not implemented):** a step-3 wording or a four-step guide while Pages is a placeholder (p2-02, s8-03, stays inside `12` §3's five-step guide if reworded); none other (all other fixes stay inside the existing spec).

## De-duplicated findings (C3)

Each entry: highest severity, ROOT where one defect explains several findings, then screens, `Merged` original IDs and the agents that hit it, evidence paths (relative to `ux-audit/round-3/audit/<agent>/`), consolidated fix, likely files and effort. Disputed severities are listed in Conflicts.

## A. Focus visibility

### C3-01 · P1 · ROOT · Primary and danger buttons have a white focus ring: invisible on white dialogs and the grey canvas
- Screens: Every primary button (New ..., Create and open, Activate, Apply changes, Use this image, Sign in again, Preview the app); all viewports.
- Merged (hit by p5, s10, ds): R3-p5-01, R3-s10-05, R3-ds-03
- Evidence: p5 shots/focus__primary-button-in-dialog__1440.png, focus__primary-button-on-canvas__1440.png, logs-a7.txt; ds shots/places__btn-primary-focus__1440.png
- Fix: For `[data-variant=primary|danger]` use `outline-color: hsl(var(--ring))`, offset 2, no coloured halo (10.4:1 on canvas); drop the literal `#fff` at style.css:189 and :391. Add an e2e that measures ring contrast on a primary button in a dialog.
- Files: `src/style.css` 186-194, 391; `components/ui/button/index.ts`. Effort: S.

### C3-02 · P1 · ROOT · Tab strips (`overflow-x-auto`) clip the focus ring: language tabs in every editor, Preview tabs, Maps/Floor plans LinkTabs
- Screens: POI/Place/Route/Guide/Event/Category/Asset editors, Preview (Surface/Language/Content/Size), Preview in app, Maps and Floor plans tabs.
- Merged (hit by p5, s10, s14, ds): R3-p5-04, R3-s10-06, R3-s14-preview-05, R3-ds-01
- Evidence: ds shots/placeEditor__tab-focus__1440.png (clip.mjs: sides L,T,B); p5 shots/poi-editor__lang-tab-focus__1440.png
- Fix: Give the scroller 4 px inset padding (`p-1 -m-1`) or draw the ring inset (`focus-visible:outline-offset:-2px`) in the shared TabsList and LinkTabs; add a clipped-ring check to the keyboard e2e.
- Files: `components/ui/tabs/TabsList.vue`, `ui/tabs/LinkTabs.vue:25`, `EditorShell.vue` / `TranslationsPanel.vue` tab strip. Effort: S.

### C3-03 · P1 · ROOT · Menu item highlight is 1.14:1 with no ring (row menu, user menu, editor "More actions"); inverted in forced colours
- Screens: Every list row menu, header user menu, editor More actions; forced-colours menus.
- Merged (hit by p5, s9, ds): R3-p5-08, R3-s9-lists-09, R3-ds-02
- Evidence: ds shots/places__rowmenu-open__1440.png; p5 logs-w1.txt, shots/poi-list__row-menu__forced-colors__1440.png
- Fix: `data-[highlighted]:bg-accent-strong` plus a 2 px inset outline (`outline-ring -outline-offset-2`) on DropdownMenuItem; in forced colours outline only the highlighted item.
- Files: `components/ui/dropdown-menu/DropdownMenuItem.vue:21`, `src/style.css` forced-colours block. Effort: S.

### C3-04 · P2 · Focus ring invisible on the Preview stand-in dark header (1.38:1)
- Screens: Preview page and Preview in app when Interact is on.
- Merged (hit by p5, s14): R3-p5-10, R3-s14-preview-06
- Evidence: p5 shots/preview__interacting__1440.png; s14 shots/preview__interacting-focus-ring__1440.png
- Fix: Inside the frame use a ring colour from the theme `on-primary`, or a two-tone ring.
- Files: `src/components/preview/*`. Effort: S.

### C3-05 · P2 · Pressed state equals hover on primary, danger-outline, tabs, nav, ghost and move buttons
- Screens: All primary buttons, TabsTrigger groups, nav items, ghost move buttons, list rows/kebabs.
- Merged (hit by p1, p4, s7, s9, s11, ds): R3-p1-editor-13, R3-p4-kiosk-12, R3-s7-chrome-16, R3-s11-15, R3-ds-04, R3-s9-lists-25
- Evidence: ds states.mjs (rest rgb(76,29,139), hover and active rgb(58,20,105)); p4 `ui/button` and TabsTrigger notes
- Fix: Add a `--primary-active` token (about L 19 %) and a `danger-outline` active tint; `active:bg-muted` on tabs and nav; one extra grey step for row/kebab active.
- Files: `components/ui/button/index.ts:26,34`, `ui/tabs`, `WorkspaceNav.vue`. Effort: S.

### C3-06 · P3 · Programmatic h1 focus paints a white 4 px halo on the grey canvas
- Screens: Every page after navigation.
- Merged (hit by p5): R3-p5-15
- Evidence: p5 shots/poi-list__load__1440.png
- Fix: Use the same outline as other focus targets, or no ring for a programmatic heading focus.
- Files: `src/style.css` focus rules. Effort: S.

## B. Focus management and announcements

### C3-07 · P1 · ROOT · Focus falls to `<body>` after Discard changes (and the success toast carries a warning triangle)
- Screens: ACTIVE POI editor (all editors share the handler).
- Merged (hit by p1, s10): R3-p1-editor-03, R3-s10-03
- Evidence: p1 shots/poi-editor__beta-discarded__1440.png; s10 shots/poiB__after-discard__1440.png
- Fix: Focus the Status heading (as Activate/Archive do) or the Working Copy banner; neutral/check icon for "Changes discarded".
- Files: `useResourceEditor.ts` discard handler (~:802), `EditorShell.vue`, `AppToast`. Effort: S.

### C3-08 · P1 · Moving a row: no visible confirmation, no Undo, focus lost when the row leaves the page or on drag-drop
- Screens: All six lists (reorder by menu, position dialog, drag).
- Merged (hit by p1, s9): R3-p1-editor-01, R3-s9-lists-05
- Evidence: p1 shots/pois-list__after-move-to-1__1440.png, pois-list__after-move-to-bottom-300ms__1440.png; s9 shots/guides__move-up-after__1440.png, guides__drag-in-flight__1280.png
- Fix: Visible toast "Moved to position N of M" with Undo and Ctrl+Z, a "Show it" action that jumps to the target page and focuses the row, flash the moved row 1.5 s (reduced-motion alternative), focus the kebab after a drop or the next row when it leaves the page; shorten the live string to 40 characters of title.
- Files: list core `RowMenu.vue`, reorder composable `src/views/workspace/` / `workspace/useReorder.ts`, `ListTable.vue`. Effort: M.

### C3-09 · P2 · ROOT · Focus still drops to `<body>` after Undo/Restore on lists, upload Cancel/Retry, tile Try again, toast dismiss, Preview Retry
- Screens: Lists (Archive Undo bar, Restore), Upload dialog, Map editor tile card, toasts, Preview error card.
- Merged (hit by p6, s7, s9, s12, s13, s14): R3-s9-lists-06, R3-p6-21, R3-s13-03, R3-s12-maps-04, R3-s7-chrome-12, R3-s14-preview-09
- Evidence: s9 shots/events__after-undo__1440.png; p6 logs-e21.txt, shots/upload__cancel-one__1440.png
- Fix: One rule: when the focused control is removed, move focus to its successor (next row action, "Choose files", map region, toast opener, h1 / toolbar). Add a "focus never on body inside a dialog" assertion to the e2e.
- Files: `ListTable.vue`/undo bar, `UploadEntryRow.vue`, `UploadDialog.vue`, `GeoMapCanvas.vue`, `AppToast.vue`, `PreviewView.vue`. Effort: S-M.

### C3-10 · P2 · Paging leaves focus on the (now disabled) pager, 3,700 px down; scroll lands 51 px low
- Screens: All paged lists.
- Merged (hit by p1, p5, s9): R3-p1-editor-17, R3-p5-07, R3-s9-lists-04
- Evidence: p1 shots/pois-list__page2__1440.png; p5 logs-a4.txt
- Fix: After a page change focus the table heading or first row link and scroll to the table top; keep the live "Page 2 of 3" message.
- Files: shared list pager. Effort: S.

### C3-11 · P2 · Route announcer, document title and focus return are out of step with the committed route (cancelled guard, session loop, renamed record)
- Screens: Leave-confirm from switcher and from links, "keeps ending" page, 401 dialog, Category rename.
- Merged (hit by p3, p5, p6, s7): R3-p5-05, R3-s7-chrome-06, R3-p6-13, R3-p5-20, R3-s7-chrome-05, R3-p3-translator-12
- Evidence: p5 shots/leave-confirm__after-esc__1440.png; p6 logs-e10.txt
- Fix: Announce and set the title from the committed route only; after Esc on the guard return focus to the trigger that opened it; derive `document.title` reactively from the saved record.
- Files: `lib/routeAnnouncer.ts`, router title hook, `ProjectSwitcher.vue`, editor title. Effort: S.

### C3-12 · P2 · Duplicate live announcements: one action says two or three things (Add stops, latitude, Guide add, Undo, create summary)
- Screens: Route/Guide editors, coordinate fields, create dialogs, Home search.
- Merged (hit by p5, p6, s11): R3-p5-06, R3-s11-07, R3-p6-25
- Evidence: p5 logs; s11 e*.mjs live-region dumps
- Fix: One polite message per action; announce readiness only when its counts change; do not duplicate field text and summary.
- Files: `FieldError`, `ResourcePickerDialog.vue`, editor readiness live region, `ProjectList.vue`. Effort: S-M.

### C3-13 · P3 · Keyboard niceties: native radio groups scroll on Home/End; translation dots add 3 link stops per row
- Screens: Status segments, icon radios, every list row.
- Merged (hit by p5): R3-p5-17, R3-p5-19
- Evidence: p5 shots/ (list tab sweep), logs
- Fix: Roving Home/End for the radio groups; make the dots one stop with a menu or a single "translations" link per row.
- Files: list row components, `TranslationDots`. Effort: S-M.

## C. Readiness, completeness and activation

### C3-14 · P1 · ROOT · Readiness is still counted two ways: Activate confirm says 3 warnings, the toast and card say 6; accessibility counted twice; asset blocker remains after alt text
- Screens: POI (DRAFT to ACTIVE), ACTIVE Place/POI card and tab, Asset editor.
- Merged (hit by p3, p6, s10, s13): R3-s10-01, R3-p3-translator-04, R3-p6-14, R3-s13-02
- Evidence: s10 shots/poiB__activate-confirm__1440.png, poiB__active-after-activate__1440.png; p3 shots/poi-editor__apply-dialog__1440.png
- Fix: One readiness list before and after activation, de-duplicate the platform "accessibility empty" item against the client slot, either drop or enforce the asset title blocker, phrase toasts without "to fix". Say "plus checks run on activation" while the DRAFT-readiness backend gap stands.
- Files: `ActivateDialog.vue`, `ReadinessList.vue`, `completeness.ts` merge. Effort: S-M (M if backend supplies the list).

### C3-15 · P2 · Activate and Apply confirms repeat the readiness sentence 3 times, name counts not fields, and "Save and apply" lists no changes
- Screens: Activate confirm (POI, Route, Guide, Category), Save-and-apply confirm.
- Merged (hit by p1, p3, p5, s11): R3-p1-editor-09, R3-p1-editor-14, R3-s11-08, R3-p5-18, R3-p3-translator-05
- Evidence: p1 shots/poi-activate-confirm__alpha__1440.png; s11 shots/route__activate-click__1440.png
- Fix: Keep the sentence once; list the missing fields as links that open the section and focus the field; build "Changes:" from the dirty fields for the one-step path.
- Files: `ActivateDialog.vue`, `ApplyDialog`, `EditorShell.vue`. Effort: M.

### C3-16 · P2 · Route with 0 stops, Event with no dates and Guide with an empty story activate with only translation warnings
- Screens: Route/Event/Guide activation; list activation confirm.
- Merged (hit by s9, s11): R3-s9-lists-10, R3-s11-09
- Evidence: s9 shots/events__activate-dialog__1440.png; s11 shots/guide__empty-after-remove__1440.png
- Fix: Client-side blocking reason like the Route "No active stop", or soften the copy; add backend G-039.
- Files: `completeness.ts`, `ActivateDialog.vue`. Effort: S.

### C3-17 · P1 · "Next missing: English" focuses the filled Title and never opens "Practical details"
- Screens: POI editor (ACTIVE), 1440; works when the Greek title is empty.
- Merged (hit by p1, s10): R3-p1-editor-02, R3-s10-02
- Evidence: p1 shots/next-missing__english-click__1440.png (14 clicks all TEXTAREA#f-title); s10 Practical details `aria-expanded=false`
- Fix: Expand the fold, focus the first empty field scrolled clear of the sticky stack; when none empty go to the next language.
- Files: `TranslationsPanel.vue`, `useResourceEditor.ts`. Effort: S.

### C3-18 · P2 · "Next missing" sits beside the tabs only below 1180 px; at 1440/1280 it is 800-1300 px down the side column
- Screens: All editors, 1440/1280.
- Merged (hit by p3): R3-p3-translator-08
- Evidence: p3 t1.mjs positions (Category 791, Route 904, POI 1162, Asset 1291)
- Fix: Show the beside-tabs button at every width and keep the side-card copy.
- Files: `TranslationsPanel.vue:88`, `EditorShell.vue:11`. Effort: S.

### C3-19 · P2 · Where-used and Deactivate: own triggers listed under "Used in"; Category opens a "Deactivate" dialog with no Deactivate action
- Screens: POI/Place editors, Category editor.
- Merged (hit by s10, s11): R3-s10-11, R3-s11-11
- Evidence: s10 Used in (3) dump; s11 shots/category__deactivate-used__1440.png
- Fix: Hide own triggers or label them "Its own ways in"; one pattern for blocked deactivate (disabled button, reason, "Show where it is used").
- Files: Used-in builder, `CategoryEditorView.vue`, ConfirmDialog. Effort: S.

### C3-20 · P1 · Partial trigger failure says "Nothing was changed", then blocks the retry with a garbled own-record duplicate sentence
- Screens: POI editor Triggers card (QR + geo/beacon, one row 503).
- Merged (hit by p6, s10): R3-p6-27, R3-s10-20
- Evidence: p6 shots/poi-editor__trigger-partial-failure__1440.png, poi-editor__trigger-retry__1440.png; s10 duplicate-beacon dump
- Fix: After a parallel batch reconcile saved rows (mark saved, keep failed), name each failed row, map own-record duplicate to "already saved on this item", fix "beacon 1, uuid" field-list leftovers.
- Files: `useResourceEditor.ts`, `TriggersCard.vue`, `platform/triggers.ts`. Effort: M.

## D. Editor shell and Working Copy

### C3-21 · P2 · ROOT · Editor sticky chrome is still 112 px (31 %) at zoom200 and 154 px (17 %) at 1440 (R2-V-03)
- Screens: All editors, zoom200 and short screens.
- Merged (hit by p1, p5, s11): R3-p1-editor-10, R3-p5-13, R3-s11-18
- Evidence: p1 shots/poi-editor__alpha-active__zoom200.png; s11 shots/event__top__zoom200.png
- Fix: Release the page-head bar below about 700 px height; truncate status text with a title; keep only the app header sticky.
- Files: `EditorShell.vue`, `style.css` sticky vars. Effort: S.

### C3-22 · P2 · Zoom200: focused textarea sits under the sticky header (judged from geometry; contradicted by s10/p3)
- Screens: Active POI editor, 640x360.
- Merged (hit by p5): R3-p5-11
- Evidence: p5 logs-o1.txt (no screenshot)
- Fix: `scroll-padding-top` = app header + editor header.
- Files: `EditorShell.vue`, `style.css`. Effort: S.

### C3-23 · P2 · ACTIVE editor on a landscape tablet: Working Copy banner (Save draft, Discard) is static at 1024x768 and scrolls away
- Screens: POI/Floor plan editor ACTIVE at 1024x768, 768x600, 1024x480 touch.
- Merged (hit by p4): R3-p4-kiosk-01
- Evidence: p4 shots/poi-editor__scrolled-touch__1024x768.png, t3.mjs
- Fix: Add a compact Save draft to the sticky header when the banner is released, or keep the banner sticky at >= 700 px height.
- Files: `EditorShell.vue`. Effort: S.

### C3-24 · P2 · Two "Save draft" buttons at once, different sizes, plus "Save and apply"
- Screens: Dirty ACTIVE editor header and Working Copy banner.
- Merged (hit by p1, p6, s10): R3-p1-editor-12, R3-s10-04, R3-p6-24
- Evidence: p1 shots/poi-editor__active-dirty__1440.png; s10 shots/poiB__active-dirty__1440.png
- Fix: Drop the banner Save draft or make the banner state-only.
- Files: `WorkingCopyBanner.vue`. Effort: S.

### C3-25 · P2 · Sticky 422/5xx summary covers the field it links to, overlaps the side column at 1280 and eats 73 % of zoom200
- Screens: Editors with a save error; Event 422; forced colours.
- Merged (hit by p6, s10, s11): R3-p6-02, R3-s10-08, R3-s11-19
- Evidence: p6 shots/poi-editor__save-422__1440.png, poi-editor__422__zoom200.png; s10 shots/poiB__error-summary__zoom200.png
- Fix: Non-sticky or in-flow below 900 px height, width follows the main column, Close inside the card, opaque top edge, cap height with its own scroll, mark the failed row (partial saves).
- Files: `EditorShell.vue`, `TriggersCard.vue`. Effort: S-M.

### C3-26 · P2 · Toasts still overlap the form column by 4-5 px (R2-V-04) and the Link copied toast is 110 px tall
- Screens: All editors: Activated, Discarded, Archived, Link copied toasts.
- Merged (hit by p1, p4, s7, s10): R3-p1-editor-07, R3-s7-chrome-13, R3-s10-09, R3-p4-kiosk-06
- Evidence: p1 shots/poi-editor__gamma-active__1440.png; s7 shots/toast__link-copied__1440.png
- Fix: Inset the stack to column end + 8 px or dock it in the side column / bottom of the app frame; "Link copied" only.
- Files: `toastOffset.ts` (`--toast-inset-right`), `AppToast.vue`, `TriggersCard.vue`. Effort: S.

### C3-27 · P3 · Toast and Undo-bar tone and duplication: warning icon on success, same event in bar and toast, instruction toast auto-dismisses
- Screens: Discard, Archive (list and editor), Link copy failure.
- Merged (hit by p6, s7, s9, ds): R3-ds-11, R3-p6-15, R3-p6-16, R3-s9-lists-14, R3-s7-chrome-15
- Evidence: ds `useResourceEditor.ts:802`; p6 shots/poi-editor__archived-undo__1440.png, poi-list__archived-undo__1440.png
- Fix: Success icon for neutral confirmations; one of bar or toast; persist toasts that carry an instruction; clear stale toast on route change.
- Files: `useResourceEditor.ts`, `CreatePoiDialog.vue:68`, `AppToast.vue`. Effort: S.

### C3-28 · P2 · Revision shows "Not saved yet" on a saved record and jumps (0, 2, 6)
- Screens: Status card, all editors.
- Merged (hit by p1, s10): R3-p1-editor-08, R3-s10-13
- Evidence: p1 shots/poi-editor__new-draft__1440.png; s10 revision sequence
- Fix: Show the server revision ("Revision 1" from creation), always show the row, make Updated follow a Working Copy save.
- Files: `EditorStatusCard.vue`. Effort: S.

### C3-29 · P3 · ACTIVE items still say "Required in the default language before it can be activated"
- Screens: ACTIVE editors Title hint.
- Merged (hit by p2, s10): R3-p2-18, R3-s10-14
- Evidence: p2 shots/poi-editor-pending__top__1440.png
- Fix: "Required in the default language." once ACTIVE.
- Files: Texts panel. Effort: S.

### C3-30 · P2 · Editor height 1,454 to 2,496 px (target ~1,450); Triggers card rows are 240-330 px each; beacon head wraps
- Screens: POI editor DRAFT/ACTIVE with triggers (R2-V-07, C2-67).
- Merged (hit by s10): R3-s10-07, R3-s10-19
- Evidence: s10 height table; shots/poiB__filled-unsaved__1440x1800.png
- Fix: Collapse saved trigger rows to a one-line summary with an Edit disclosure; move "Mobile app only" into the description.
- Files: `TriggersCard.vue`. Effort: M.

### C3-31 · P2 · Side-card inconsistencies: heading 16 vs 14 px, padding p-3 vs p-4, duplicate nested h2, clipped foot and top edge
- Screens: Place/POI/Route editors side column.
- Merged (hit by s10, ds): R3-s10-15, R3-s10-16, R3-s10-21, R3-ds-08
- Evidence: s10 shots/place-indoor__side-scrolled__1440.png; ds measure.mjs
- Fix: One `SideCard` rule (h2 `text-sm font-bold`, `p-4`); max-height = viewport minus sticky offset with a fade on both edges; remove the nested duplicate h2.
- Files: `EditorStatusCard.vue`, `ReadinessList.vue`, `EditorSectionNav.vue`, `EditorShell.vue`. Effort: S.

### C3-32 · P2 · Conflict dialogs differ: Working Copy Save 409 still the old dialog, Apply 409 has no request id and a 14-word heading, disabled "Keep my changes" reason hidden
- Screens: POI editor Save draft / Apply / Save 409.
- Merged (hit by p6, s10): R3-p6-19, R3-p6-17, R3-s10-10
- Evidence: p6 shots/poi-editor__real-wc-conflict__1440.png, poi-editor__apply-409-forced__1440.png; s10 shots/poiA__409-dialog__1440.png
- Fix: Use the DRAFT three-way dialog for Working Copy saves, show request id in every variant, visible reason under the footer, "Your other change (Title) is kept either way".
- Files: `ConflictDialog.vue`, `useResourceEditor.ts`. Effort: M.

### C3-33 · P3 · Place pickers: leading-space indentation in closed select/combobox, placeholder-only filter at 25+ Places, two-step choose
- Screens: POI editor Place, Event Place combobox.
- Merged (hit by p1, p6, s10, s11): R3-p1-editor-11, R3-s11-21, R3-p6-18, R3-s10-22
- Evidence: p1 shots/poi-editor__alpha-saved__1440.png; p6 shots/poi-editor__place-filter__1440.png
- Fix: Show the plain title when closed (trim the indent), visible label on the filter input, auto-select a single match.
- Files: `FilteredSelect.vue`, `EntityCombobox`. Effort: S.

### C3-34 · P2 · Place editor: choosing a Map links it immediately while the header says "Unsaved changes" (no confirm, no Undo)
- Screens: Place editor (one cross-agent record was linked and unlinked).
- Merged (hit by s10): R3-s10-12
- Evidence: s10 shots/place__type0-linked__1440x1500.png
- Fix: Make Map a form field saved with Save, or label "Link now" with Undo.
- Files: `PlaceEditorView.vue`. Effort: S.

### C3-35 · P2 · Route map: pins 1-4 overlap at default zoom, two near-duplicate legend lines
- Screens: Route editor map at 1440 and 768.
- Merged (hit by s11): R3-s11-10
- Evidence: s11 shots/route__seed-map-v2__1440.png, route__seed-map-v2__768.png
- Fix: Fan out or cluster-expand at default zoom; merge legend lines.
- Files: `RouteMap.vue`. Effort: M.

### C3-36 · P3 · Route/Guide/Event small items: heading label "Heading 2, level 3", missing space in Undo bar, 32 px position select, enum "DRAFT" in a chip, Undo bar position, repeat-weekly messages, slug breaks mid-token
- Screens: Route, Guide, Event editors.
- Merged (hit by p3, s11): R3-s11-12, R3-s11-13, R3-s11-14, R3-s11-16, R3-s11-17, R3-s11-20, R3-s11-23, R3-s11-24, R3-p3-translator-14
- Evidence: s11 shots/guide__empty-after-remove__1440.png; p3 d2.mjs, d4.mjs
- Fix: Label "Heading (block 2)"; add the space; 40 px selects; humanise the enum; dock the Undo bar lower; messages for 0/empty weeks and 31 November; `break-words` on slugs.
- Files: Route/Guide/Event editors, `RemovedBar.vue`. Effort: S.

### C3-37 · P2 · Texts heading to tab-bar gap differs (0 px POI/Route/Guide, 16 px Event/Category/Asset; tab widths differ)
- Screens: Editor Texts card.
- Merged (hit by p3, s11): R3-p3-translator-09, R3-s11-06
- Evidence: p3 t1.mjs; s11 f1.mjs
- Fix: One shared spacing (0) and tab width.
- Files: Event/Category/Asset editors. Effort: S.

## E. Event dates

### C3-38 · P1 · ROOT · Event date fields: invalid hour/minute/day is a red border only, silent, rewrites the End to 1 Jan 2000; 31 February is accepted
- Screens: Event editor Dates (add a date), 1440 and forced colours.
- Merged (hit by p5, s11): R3-p5-02, R3-s11-01, R3-s11-02
- Evidence: s11 shots/event__hour25__1440.png, event__day45__1440.png, event__31feb__1440.png, event__invalid__forced-colors.png; p5 shots/event-editor__date-invalid__1440.png
- Fix: Per-field sentence linked by `aria-describedby` and announced on blur; validate day against month/year; never rewrite End from an unparseable Start; error icon plus text; "Ended" chip only for a valid past date.
- Files: `DateTimeFields.vue`, Event occurrences editor. Effort: M.

### C3-39 · P2 · Ended date cards dim all text with `opacity: .8`: 3.71:1 (axe serious, 15 nodes)
- Screens: Event editor with an ended date.
- Merged (hit by p5, s11): R3-p5-09, R3-s11-04
- Evidence: p5 axe run; s11 shots/event__ended-card__1440.png
- Fix: Dim border/background and use the chip, not opacity.
- Files: Event dates card. Effort: S.

## F. Lists core

### C3-40 · P1 · Filters popover is unreachable at 200 % zoom (418 px tall in a 360 px viewport, top at y -239)
- Screens: Every list, zoom200; below 900 px the status segments live only here.
- Merged (hit by s9): R3-s9-lists-01
- Evidence: s9 shots/guides__filters-open__zoom200.png
- Fix: `max-height: var(--radix-popper-available-height)` with `overflow-y:auto`, or a bottom sheet below 900 px.
- Files: `ListToolbar.vue`, popover wrapper. Effort: S.

### C3-41 · P1 · Filters popover: no accessible name, no Close; button name "Filters and sort, 1 on" fails label-in-name (axe serious)
- Screens: Every list; `/pois?pending=1`.
- Merged (hit by p5, s9): R3-p5-03, R3-s9-lists-08, R3-p5-12
- Evidence: p5 axe on `/pois?pending=1`, aria snapshot; s9 popover dump
- Fix: `aria-label` on the popover and a visible Done; name the button "Filters 1" (visible text first); "Filters and sort" only where sort exists.
- Files: `ListToolbar.vue` / filter popover (the old `ListFilterMenu.vue` is dead). Effort: S.

### C3-42 · P2 · Title column collapses at 1280/1024 (Routes 118-126 px, Events 166-174 px, Places nested 198-206 px); long Greek word overprints next columns
- Screens: Routes, Events, Places, Guides at 1280 and 1024.
- Merged (hit by p1, p3, s9): R3-p1-editor-05, R3-p3-translator-07, R3-s9-lists-02, R3-s9-lists-03
- Evidence: p1 shots/list-routes__default__1280.png; p3 shots/routes-list__long-greek-title__1024.png
- Fix: Title flexible with `min-w` 240 px; let Category/Setting/Next date/Updated stack or shrink below 1280; `overflow-wrap:anywhere` on the title link.
- Files: list core column widths, `listRows.ts`. Effort: S-M.

### C3-43 · P2 · Row anatomy differs between lists: slug truncates in 3 and wraps in 3, trigger chips overprint Place column, Order 53 vs 48 px, header heights 35-53, tree leaf offsets
- Screens: All six lists.
- Merged (hit by p1, s9): R3-p1-editor-04, R3-p1-editor-06, R3-p1-editor-21, R3-s9-lists-15, R3-s9-lists-17, R3-s9-lists-18, R3-s9-lists-19
- Evidence: p1 shots/pois-list__search-ux-r3__1440.png, list-guides__default__1440.png; s9 m1.json
- Fix: One row rule: slug on one line with `title`, chips on their own line (cap 2 plus "+N"), same Order width, one header height, fixed tree indent step.
- Files: `ListTable.vue`, `listRows.ts`. Effort: M.

### C3-44 · P3 · Values wrap away from their units and chips: "1.6 / km", "163 / KB", date and time on two lines, translation dots wrap
- Screens: Routes, Media picker, all Updated columns.
- Merged (hit by p1, s9, s13): R3-p1-editor-18, R3-p1-editor-22, R3-s9-lists-16, R3-s13-11
- Evidence: p1 shots/list-routes__default__1440.png, asset-picker__image__1440.png; s13 shots/picker__open__1440.png
- Fix: Non-breaking spaces between number and unit; widen Updated to about 150 px.
- Files: format helpers, list columns. Effort: S.

### C3-45 · P2 · Status segments hide inside Filters below 900 px (no visible status cue); header sort cannot return to manual order
- Screens: Lists at 768 and zoom200.
- Merged (hit by s9): R3-s9-lists-07, R3-s9-lists-13
- Evidence: s9 notes
- Fix: Scrollable segment row or active-status chip beside Filters; third click clears sort or a "Manual order" chip.
- Files: `ListToolbar.vue`. Effort: S.

### C3-46 · P2 · Move-to-position error is not linked to the field (no `aria-invalid`/`aria-describedby`, type=text)
- Screens: Move dialog on all lists.
- Merged (hit by s9): R3-s9-lists-12
- Evidence: s9 dialog dump
- Fix: `aria-invalid`, `aria-describedby`, `inputmode=numeric`.
- Files: move dialog component. Effort: S.

### C3-47 · P3 · List and Filters popover copy/layout nits: label placement, 144 vs 350 px selects, placeholders differ, duplicate "New" in empty state, filtered-empty does not point to other statuses
- Screens: All lists and Media.
- Merged (hit by p1, p5, s9): R3-s9-lists-22, R3-s9-lists-23, R3-s9-lists-24, R3-p1-editor-15, R3-p5-22
- Evidence: p1 shots/pois-list__filters-popover__1440.png; s9 shots/pois__archive-undo-bar__1440.png
- Fix: One label layout and control width; one placeholder pattern; one New button; "1 match in Archived".
- Files: `ListEmpty.vue`, `ListLoadError`, popover. Effort: S.

### C3-48 · P2 · Text links under a finger are 18-21 px: row titles, Dashboard links, logo, sort headers, unplaced-stop links, guide steps (C2-01 residue)
- Screens: Dashboard, POI/Places/Routes lists, header, Route editor, first-run guide at coarse pointer.
- Merged (hit by p2, p4, s11): R3-p4-kiosk-02, R3-s11-22, R3-p2-15
- Evidence: p4 t1.mjs (Dashboard 49 of 77 controls under 44 px)
- Fix: `min-h-control` hit area via padding or `::after` on title links, Dashboard links, logo, sort buttons and 44 px label rows around checkboxes under `pointer:coarse`.
- Files: `ListTable.vue`, `listRows.ts`, Dashboard components, `ui/checkbox`, `AppHeader.vue`. Effort: S-M.

### C3-49 · P3 · ROOT · HelpHint buttons are 32x32 at fine pointer (R2-V-02, third round open); Save draft/Discard banner buttons 32 px high
- Screens: Dashboard, wizard, editors.
- Merged (hit by p2, p4, p5, p6, s7, s10, ds): R3-p2-13, R3-p4-kiosk-15, R3-p5-14, R3-s7-chrome-02, R3-s10-18, R3-p6-28, R3-ds-14
- Evidence: s7 HINTS log; ds measure
- Fix: `size-10` (40 px) hit area with a 16 px icon in `ui/help-hint`; 40 px banner buttons.
- Files: `components/ui/help-hint/HelpHint.vue`. Effort: S.

### C3-50 · P3 · ROOT · RTL and mixed-direction titles reorder punctuation: no `dir=auto` / `<bdi>` on list titles, editor fields, breadcrumb
- Screens: List titles, editor Title fields, h1, breadcrumb, search clear button (observed Arabic/Hebrew; real RTL language not available).
- Merged (hit by p1, p3, s9, s10): R3-p1-editor-19, R3-s9-lists-20, R3-p3-translator-11, R3-s10-17
- Evidence: s9 shots/guides__rtl-title-crop__1440.png; p3 shots/guide-editor__rtl-arabic-hebrew__1440.png, guides-list__rtl-row__1440.png
- Fix: `<bdi>` around titles; `dir=auto` on text fields unless the language is known RTL; breadcrumb current item `dir=auto`; reserve the second h1 line.
- Files: list row title, `FormField`, `PageHead.vue`. Effort: S.

## G. Translation workflow

### C3-51 · P2 · Translator worklist is lost when leaving an item; active worklist language is only visible inside the popover; Preview count is not a link
- Screens: All six lists, Media, Preview (Italiano).
- Merged (hit by p3, s14): R3-p3-translator-01, R3-p3-translator-10, R3-p3-translator-13, R3-s14-preview-12
- Evidence: p3 j1.mjs, shots/media__italian-worklist-closed__1440.png, shots/preview__italiano__1440.png; s14 shots/preview__missing-titles-open__1440.png
- Fix: Carry `lang` and `missing` in breadcrumb/Back and in title links while a language filter is on; chip "Needs translation in Italiano" beside Clear filters and one Language control; make the per-kind links the visible row and fix the plural ("point of interests").
- Files: `EditorShell.vue`, `listRows.ts`, `PreviewView.vue`. Effort: S.

### C3-52 · P2 · Category and Asset editors keep structural controls editable under non-default language tabs (Category setup, Decorative, Name)
- Screens: Category editor and Asset editor `?lang=el|it`.
- Merged (hit by p3, s11, s13): R3-p3-translator-02, R3-p3-translator-03, R3-s11-05, R3-s13-07
- Evidence: p3 shots/categories-editor__el-tab__1440.png, asset-editor__el-tab__1440.png; s11 shots/category__greek-tab__1440.png
- Fix: Fold under "Other settings (all languages)" as POI/Place/Route/Guide/Event do (D-079), or read-only with "Edit under English".
- Files: `CategoryEditorView.vue`, `AssetEditorView.vue`. Effort: S.

### C3-53 · P2 · Stop picker and Event POI combobox are accent- and case-sensitive for Greek ("παρθενωνας" finds nothing)
- Screens: Route Add stops dialog, Event POI combobox.
- Merged (hit by p3, s11): R3-p3-translator-06, R3-s11-03
- Evidence: p3 shots/stop-picker__search-greek-unaccented__1440.png; s11 r2.mjs, e6.mjs
- Fix: Reuse the `fold` helper (`ProjectList.vue:57`) in every picker; NFD strip plus `toLocaleLowerCase`.
- Files: `ResourcePickerDialog.vue:55-60`, `EntityCombobox`. Effort: S.

## H. Dashboard and first run

### C3-54 · P1 · A SUSPENDED or unreadable app status is headlined "Live, with N warnings"
- Screens: Dashboard status card (settings 409/503 or SUSPENDED).
- Merged (hit by s8): R3-s8-01
- Evidence: s8 shots/dashboard__app-suspended__1440.png, dashboard__err-503-settings__1440.png
- Fix: Explicit SUSPENDED and null branches ("Visitors cannot open the app: it is suspended", "Status unknown"); use "Live" only for `applicationStatus === "LIVE"`.
- Files: `StatusCard.vue` (`headline`, `sentence`). Effort: S.

### C3-55 · P1 · Dashboard focus order jumps back and forth below 1100 px (counts card is second visually, fourth in Tab order)
- Screens: Dashboard Populated at 1024 and below.
- Merged (hit by s8): R3-s8-02
- Evidence: s8 a7.mjs tab stops by y
- Fix: Render the counts block second in DOM order in the single-column layout (named grid areas, not `contents` plus `order`).
- Files: `DashboardView.vue`. Effort: S.

### C3-56 · P1 · First-run guide ticks steps 3 and 5 for visiting a screen, per browser; step 3 opens a placeholder; guide ends with no next step and cannot be restored
- Screens: Dashboard first run / drafts-only, all widths.
- Merged (hit by p2, s8): R3-p2-02, R3-s8-03, R3-p2-20
- Evidence: p2 shots/firstrun-step3__pages__1440.png, dashboard-new__after-step3__1440.png, dashboard-new__after-step5__1440.png; s8 shots/guide__step3-ticked__1440.png
- Fix: Tick only what data proves; show step 3 as "Not available yet" and count "n of 4" until Pages exists; close with "Next: activate the drafts that are ready"; "Show the guide again" in Project details. Spec: a step-3 wording change stays inside the `12` §3 five-step guide.
- Files: `FirstRunGuide.vue`, `dashboard/guideState.ts`, `ProjectDetails.vue`. Effort: S-M.

### C3-57 · P2 · "Ready to go live, with N warnings" sits above "Launch is not available yet"; the hint says "You change this in Launch"
- Screens: Dashboard Populated status card, HelpHint, Launch placeholder.
- Merged (hit by p2, s8): R3-p2-08, R3-s8-05
- Evidence: p2 shots/dashboard-populated__loaded__1440.png, launch__placeholder__1440.png; s8 shots/dashboard__helphint-open__1440.png
- Fix: While Launch is a placeholder: "Content is ready; going live is not available yet"; hint "Going live is done in Launch, which this CMS does not offer yet"; plain Launch subtitle.
- Files: `StatusCard.vue`, `lib/glossary.ts`, Launch page meta. Effort: S.

### C3-58 · P2 · Blocked rows name the field but not the cause; kind prefix repeats; RTL colon misplaced
- Screens: Dashboard blocked card (mocked).
- Merged (hit by s8): R3-s8-06
- Evidence: s8 shots/dashboard__blocked5-expanded__1440.png
- Fix: Build rows from `describeIssue` ("Title is missing in English"), drop the PROJECT prefix, `<bdi>` titles.
- Files: `readiness.ts` (`issuePart`), `StatusCard.vue`. Effort: S.

### C3-59 · P2 · Dashboard errors: 403 offers "Try again", 422 mentions a form, 404 says "item", one failed pending list blanks everything
- Screens: Dashboard error states.
- Merged (hit by p2, s8): R3-s8-08, R3-p2-16
- Evidence: s8 shots/dashboard__err-*__1440.png; p2 shots/dashboard-populated__error-403__1440.png
- Fix: Hide Retry on 403/404 ("Choose another Project"), own sentences for 404/422, keep the status card when a pending list fails.
- Files: `DashboardView.vue`, ProblemAlert mapping. Effort: S-M.

### C3-60 · P2 · Dashboard layout below 1100 px and card edges: counts card 525 px tall pushes pending to y 917; guide 768 px overhangs; paddings differ
- Screens: Dashboard at 1024/768/zoom200 and 1280.
- Merged (hit by p2, s8): R3-s8-07, R3-s8-10, R3-p2-10
- Evidence: s8 shots/dashboard-pop__populated__1024.png; p2 shots/dashboard-emptyb__loaded__1280.png
- Fix: Counts as 2-3 column compact tiles below `nav:`; guide fills its grid column; one card header class `px-5 pt-5 pb-3`.
- Files: `ContentCounts.vue`, `FirstRunGuide.vue`, dashboard cards. Effort: S.

### C3-61 · P2 · Status-card secondary actions use three styles (filled, underlined link, bold ghost)
- Screens: Dashboard status card.
- Merged (hit by p2, s8): R3-s8-09, R3-p2-14
- Evidence: s8 shots/status-focus-preview-btn__1440.png; p2 shots/dashboard-populated__loaded__zoom200.png
- Fix: Both secondaries as links or both ghost.
- Files: `StatusCard.vue`. Effort: S.

### C3-62 · P3 · Dashboard polish: unformatted thousands, h1 3 px lower than other pages, two primaries in first run, guide copy shown with drafts, header chip name differs
- Screens: Dashboard.
- Merged (hit by s7, s8): R3-s8-11, R3-s8-13, R3-s7-chrome-09
- Evidence: s8 shots/dashboard__counts-thousands__1440.png
- Fix: `toLocaleString("en")`; align h1 to the 26 px row; "Show drafts" secondary while the guide is open; one chip name.
- Files: `ContentCounts.vue`, `PageHead.vue`, `FirstRunGuide.vue`. Effort: S.

### C3-63 · P2 · Forced colours: the current step number disappears (stepper and first-run guide); "Practical details" disclosure has no padding
- Screens: Create Project stepper, first-run guide, POI editor disclosure.
- Merged (hit by p2, p3, s8): R3-p2-04, R3-s8-04, R3-p3-translator-15
- Evidence: p2 shots/wizard-2__forced-colors__1440.png, dashboard-emptyb__forced-colors__1440.png; s8 shots/dashboard-trail__forced__1280.png
- Fix: `forced-color-adjust:none` with Canvas/CanvasText on the circle or a thick ButtonText border; padding on the disclosure box.
- Files: `Stepper.vue`, `FirstRunGuide.vue`, `style.css`. Effort: S.

## I. Preview

### C3-64 · P1 · New tab ignores `orientation` and `real`: "Open at real size" does nothing, Kiosk landscape opens portrait
- Screens: `/app-preview` and Preview "Open in new tab" (1024, 1440).
- Merged (hit by s14): R3-s14-preview-01
- Evidence: s14 shots/newtab__real-size-click__1024.png, newtab__from-preview-kiosk-landscape__1024.png, a8.json
- Fix: Pass `orientation` and `real` through the route props; e2e on the checkbox.
- Files: `src/router.ts` 21-28, `AppPreviewView.vue`. Effort: S.

### C3-65 · P1 · Preview in app at 1280/1440: Close and Expand are about 1,000 px below the picture and Expand makes the picture vanish; Expand is a no-op at 1024 and below
- Screens: POI editor Preview in app (1440 and 1280; 1024/768/zoom200).
- Merged (hit by p4, s14): R3-s14-preview-02, R3-p4-kiosk-03, R3-s14-preview-03, R3-p4-kiosk-04
- Evidence: s14 shots/editor-panel__open__1440.png, editor-panel__expanded__1440.png, a6-*.json; p4 shots/poi-preview-panel__after-expand-click__1440.png
- Fix: Put Expand and Close in the panel header beside the Surface tabs; do not scroll on Expand; hide Expand when the panel already fits.
- Files: `ResourcePreview.vue`, `PreviewPanel.vue`, `EditorShell.vue` 626-631. Effort: S-M.

### C3-66 · P2 · Preview picture jumps 17-68 px when the surface changes; trigger select shrinks and truncates while the chip does not
- Screens: Preview page, all widths.
- Merged (hit by p4, s14): R3-s14-preview-04, R3-p4-kiosk-07, R3-p4-kiosk-09, R3-s14-preview-16
- Evidence: s14 a2.json, shots/preview__deeplink-unknown__1440.png; p4 t8.mjs
- Fix: Fixed-height caption/note row (3 lines at 768, 1 otherwise), keep the Size row height, own row for the chip, fixed select width.
- Files: `PreviewPane.vue`, `PreviewSize.vue`, `PreviewView.vue`, `FireTrigger.vue`. Effort: S.

### C3-67 · P2 · Preview controls have no HelpHint: "Working / Live", "Fire a trigger", Surface
- Screens: Preview toolbar.
- Merged (hit by p2, s14): R3-s14-preview-07, R3-p2-09
- Evidence: p2 shots/preview__populated__1440.png
- Fix: Hints beside Content and Fire a trigger ("Pretends a visitor scanned a QR code").
- Files: `PreviewControls.vue`, `FireTrigger.vue`, `lib/glossary.ts`. Effort: S.

### C3-68 · P2 · Empty Project preview: "Nothing to show yet in this mode" is a dead end
- Screens: Preview, Live and Working, new tab.
- Merged (hit by s14): R3-s14-preview-08
- Evidence: s14 shots/preview__empty-project__1440.png, preview__empty-live__1440.png
- Fix: Outside the frame: links to Places and a plain Live/Working explanation.
- Files: `PreviewView.vue`, `AppPreviewView.vue`. Effort: S.

### C3-69 · P3 · Preview page small items: toolbar 4 px wider than the content, QR print size and mid-word wrap, "Skip preview" extra stop, mixed state after a Geo fire, caption wording, unlabelled groups below 860 px
- Screens: Preview page, QR card, new tab links.
- Merged (hit by p4, s14): R3-s14-preview-10, R3-p4-kiosk-08, R3-s14-preview-11, R3-s14-preview-13, R3-s14-preview-14, R3-p4-kiosk-10, R3-p4-kiosk-11, R3-p4-kiosk-14, R3-p4-kiosk-13
- Evidence: p4 shots/preview__web-fired-geo__1440.png, preview__kiosk__768.png; s14 a10.json
- Fix: Align card to the 256/1416 column, NBSP in "100 %", "Fit width" caption, clear the old "Opened by" line, `?trigger=` replaced after use, short visible labels at 768, "Prints sharp up to N cm".
- Files: `PreviewView.vue`, `PreviewPane.vue`, `QrCodePreview.vue`. Effort: S.

### C3-70 · P3 · New-tab invalid-parameter notices echo the rejected `lang`/`surface`/`t` values; scale not stated; `<html lang>` stays en
- Screens: `/app-preview` with bad params; 768 and zoom200 control bar.
- Merged (hit by s14): R3-s14-preview-15
- Evidence: s14 a8.json
- Fix: Fixed sentences without echoing values (BRIEF hard constraint); state the scale; set `<html lang>` for the content language.
- Files: `AppPreviewView.vue`. Effort: S.

## J. Maps and floor plans

### C3-71 · P2 · Armed floor-plan prompt covers the lower 16-19 % of the plan; tapping an existing pin while armed is a silent no-op
- Screens: Floor plan editor armed state (1024x768 mouse and touch, 1440, zoom200).
- Merged (hit by p4, s12): R3-p4-kiosk-05, R3-s12-maps-02, R3-s12-maps-03
- Evidence: p4 shots/fp-editor__armed__1024-touch.png; s12 shots/plan-editor__armed__1024.png, plan-editor__armed-tap-pin__*.png
- Fix: Dock the prompt in the sticky header or below the plan; announce and show "That spot is taken by <pin>"; fix the touch copy.
- Files: `FloorPlanEditorView.vue`. Effort: S-M.

### C3-72 · P2 · Map editor bounds handles are half-clipped on desktop (26 px, 12 px outside north/south)
- Screens: Map editor Edit bounds, 1440.
- Merged (hit by s12): R3-s12-maps-01
- Evidence: s12 shots/map-editor__edit-bounds__1440.png, map-editor__handle-focus__1440.png
- Fix: Pad the fit by 14-16 px or clamp handle anchors; move the attribution while editing.
- Files: `GeoMapCanvas.vue`. Effort: S.

### C3-73 · P3 · Map tile failure card sits below the 500 px map (below the fold) and the map shows grey gutters that look like unloaded tiles
- Screens: Map editor 1440x900, 768.
- Merged (hit by p6, s12): R3-p6-26, R3-s12-maps-11
- Evidence: p6 shots/map-editor__tiles-blocked__1440.png; s12 shots/map-editor__after-create__1440.png
- Fix: Overlay the card on or above the map; fit the box to the bounds aspect or tint the gutter.
- Files: `GeoMapCanvas.vue`. Effort: S-M.

### C3-74 · P3 · New map dialog: error alert moves the dialog 30 px, kind labels wrong ("Suburb"), Reset appears only for valid bounds
- Screens: New map dialog.
- Merged (hit by s12): R3-s12-maps-05, R3-s12-maps-06, R3-s12-maps-07
- Evidence: s12 shots/new-map__search-429__1440.png, new-map__bounds-invalid__1440.png
- Fix: Reserve a message line; use `type` before `addresstype`; show Reset whenever any field differs.
- Files: `NewMapDialog.vue`, `platform/maps.ts`. Effort: S.

### C3-75 · P3 · Coordinate formatting mixed (37.9738 / 37.97387 / trailing zero / typed comma) and floor-plan range copy terse
- Screens: Map and Floor plan editors.
- Merged (hit by s12): R3-s12-maps-08, R3-s12-maps-09
- Evidence: s12 out.log (BOUNDS, pl0 lines)
- Fix: One formatter on blur; "Across (x) must be between 0 and 1."
- Files: `components/map/coordinates.ts`, `FloorPlanEditorView.vue`. Effort: S.

### C3-76 · P3 · Maps minor: duplicate Map landmark and silent loading chip, categories listed twice with bare counts, legend with nothing drawn, wording differs, focus on Name
- Screens: Map editor, Maps and Floor plans lists, New floor plan dialog.
- Merged (hit by s12): R3-s12-maps-10, R3-s12-maps-12, R3-s12-maps-13, R3-s12-maps-14
- Evidence: s12 shots/map-editor__visibility__1440.png, maps-list__default__1440.png
- Fix: `aria-hidden` on the canvas and `role=status` on the chip; "17 POIs" labels; collapse by category; legend only when drawn; focus the first field.
- Files: `MapEditorView.vue`, `basemap.ts`, `NewFloorPlanDialog.vue`. Effort: S.

## K. Media

### C3-77 · P1 · "Decorative image" checkbox stays ticked after Esc or "Keep it described" while the model says nothing changed
- Screens: Asset editor (DRAFT), 1440.
- Merged (hit by s13): R3-s13-01
- Evidence: s13 shots/editor__decorative-after-esc__1440.png, ed6.mjs
- Fix: Controlled checkbox: cancel restores false.
- Files: `AssetEditorView.vue`, Decorative confirm handler. Effort: S.

### C3-78 · P2 · Library count line and Filters badge ignore filters ("0 files (1 archived)"; alt/type/unused/decorative not counted)
- Screens: Media library.
- Merged (hit by s13): R3-s13-04, R3-s13-05
- Evidence: s13 shots/lib__audio-noalt-empty__1440.png; filt2.mjs
- Fix: Scope "(1 archived)" to the same filter or drop it; count every non-default filter or drop the number.
- Files: `MediaView.vue`. Effort: S.

### C3-79 · P2 · Grid and picker chip rows are not bottom-aligned (24-30 px ragged)
- Screens: Media grid, Asset picker tiles.
- Merged (hit by p1, s13): R3-s13-06, R3-p1-editor-20
- Evidence: s13 shots/lib__grid-chiprow-misaligned__1440.png; p1 shots/media__grid__1440.png
- Fix: `mt-auto` on the chip block with a fixed minimum title height.
- Files: media grid card, picker tile. Effort: S.

### C3-80 · P2 · Library cold load 3.3-4.0 s: `size=200` requested, 48 shown
- Screens: Media library (R2 C2-73 residue).
- Merged (hit by s13): R3-s13-08
- Evidence: s13 lib.mjs
- Fix: Server paging or first request of 48.
- Files: `MediaView.vue`, media list loader. Effort: M.

### C3-81 · P3 · Media copy and format nits: straight quotes, "20.0 MB", Unused vs Not used yet, "asset", date-only, audio+alt empty state, 1 px thumbnails
- Screens: Media library, picker, editor.
- Merged (hit by p1, s13): R3-s13-09, R3-s13-10, R3-p1-editor-16, R3-s13-13, R3-s13-14
- Evidence: s13 shots/lib__audio-noalt-empty__1440.png; p1 shots/media__audio-noalt-empty__1440.png
- Fix: Typographic quotes, one word for unused, date and time like lists, "Audio files have no alternative text.", min-size for thumbnails.
- Files: `MediaView.vue`, picker, editor. Effort: S.

### C3-82 · P3 · Upload dialog: position jumps, "Describe now" stacks a second dialog, "Needs your decision" wraps, Esc silently drops held files
- Screens: Upload dialog.
- Merged (hit by p6, s13): R3-s13-15, R3-p6-20, R3-p6-22
- Evidence: s13 notes; p6 shots/upload__wrong-type-too-big__1440.png
- Fix: Anchor the top edge, confirm on Esc with held rows, keep the label on one line.
- Files: `UploadDialog.vue`. Effort: S.

## L. Errors, session and edge cases

### C3-83 · P1 · After the persistent-401 session dialog is dismissed, Save stays "Saving…" forever and Ctrl+S does nothing
- Screens: POI editor, persistent 401 on PUT, Esc or "Stay on this page".
- Merged (hit by p6): R3-p6-01
- Evidence: p6 shots/poi-editor__401-persistent-dismissed__1440.png
- Fix: On dismiss set "Not saved: session ended. Sign in again", enable "Sign in again" and re-enable Save.
- Files: `useResourceEditor.ts`, `EditorShell.vue`, `SessionEndedDialog.vue`. Effort: S.

### C3-84 · P2 · Authorization code and state remain in the address bar after a fresh sign-in and after "Sign in again" (s7 saw none with a saved session)
- Screens: Home and any deep link after a real Keycloak sign-in.
- Merged (hit by p2, p6): R3-p2-01, R3-p6-29
- Evidence: p2 s01.mjs, shots/home__after-signin__1440.png, s19.mjs; p6 logs-e31.txt
- Fix: `router.replace` to the cleaned location after `keycloak.init` or after the first navigation resolves; e2e `location.hash === ""` after a real sign-in.
- Files: `src/platform/auth.ts`, `src/router.ts`, `src/main.ts`. Effort: S.

### C3-85 · P2 · ROOT · The same failure has two sentences and two card styles: 503 "not reachable" vs "busy"; create dialogs say "1 thing to fix" over a server fault; request-id row differs
- Screens: Project load 502/503/504, editor load, all six create dialogs, list alerts, Maps.
- Merged (hit by p6, s7): R3-s7-chrome-08, R3-p6-07, R3-p6-11, R3-p6-04, R3-p6-09
- Evidence: s7 shots/err503__project__1440.png, err503__poilist__1440.png; p6 shots/poi-load__load-503__1440.png, guides-create__503__1440.png
- Fix: One 503 sentence map in `lib/errors.ts`, "not reachable" only for network failures; one request-id component; no "N things to fix" title for non-field errors.
- Files: `lib/errors.ts`, `ProjectLayout.vue`, `ui/alert`, create dialogs. Effort: S.

### C3-86 · P2 · Offline banner covers the primary action ("Check again" over "New ..."), clips under the sticky head, controls stay live; aria-disabled Save is silent
- Screens: Lists and editors offline (1440, 768).
- Merged (hit by p6, s7): R3-s7-chrome-01, R3-p6-05, R3-p6-06
- Evidence: s7 shots/offline__poilist__1440.png, offline__create-submit__1440.png; p6 shots/poi-editor__offline-ctrl-s__1440.png, poi-list__offline__768.png
- Fix: Reserved row under the header or bottom-left; `aria-disabled` plus offline reason on page-head primaries; announce on click.
- Files: `OfflineBanner.vue`, `PageHead.vue`, list views. Effort: S-M.

### C3-87 · P2 · List load failures: error cards leave focus on body, Maps/Floor plans show a false "0", Routes Categories failure has no alert, trigger chips vanish silently
- Screens: List error cards for 7 kinds, Maps tabs, Routes list.
- Merged (hit by p6): R3-p6-08, R3-p6-10
- Evidence: p6 shots/maps__load-503__1440.png, routes-list__reads-503-categories__1440.png
- Fix: Focus the error h1, error count instead of 0, ListLoadError with Try again for every failed read.
- Files: list views, `useListQuery.ts`, `ListLoadError`. Effort: S.

### C3-88 · P2 · 422 field mapping gaps: "Describe now" marks no field and offers Try again; unmapped create-dialog field path has no link
- Screens: Describe now (from Upload), create dialogs.
- Merged (hit by p5, p6): R3-p6-23, R3-p5-21
- Evidence: p6 shots/describe-now__save-422__1440.png
- Fix: Show the field message at the field (422 allowed), no retry for 422, link or generic line for unmapped paths.
- Files: Describe now dialog, create dialog summary. Effort: S.

### C3-89 · P3 · Save/create edge copy: Restore row offered on an unchanged form after a failed save; "Creating..." three dots; offline says "nothing was saved" in a create dialog
- Screens: Editors after 404/409/422/5xx, create dialogs.
- Merged (hit by p6): R3-p6-03, R3-p6-12
- Evidence: p6 shots/guides-create__503__1440.png
- Fix: Hide Restore when the form equals the stored draft; one ellipsis character; consistent "Nothing was created".
- Files: `useResourceEditor.ts`, create dialogs. Effort: S.

## M. Chrome, picker and state cards

### C3-90 · P2 · Picker: 15-16 of 17-18 rows carry "Setup not checked"; "(10+)" vs "(9+)" and "(17)" vs "(19)" counts wobble
- Screens: Home list, header switcher.
- Merged (hit by p2, s7): R3-p2-07, R3-s7-chrome-14
- Evidence: p2 shots/home__list__1440.png, switcher__open__1440.png; s7 shots/home__default__1440.png
- Fix: Drop the chip when nothing is known, "Checking setup..." once, settle the count before showing it.
- Files: `ProjectList.vue`, `stores/projects.ts`. Effort: S-M.

### C3-91 · P2 · Skeletons do not mirror content: CLS 0.07-0.11 on lists, no h1 while loading, Media grid 35 px jump, "Organisation" placeholder word
- Screens: Lists, Dashboard, Media grid loading.
- Merged (hit by p2, s7, s8, s13): R3-s7-chrome-03, R3-s13-12, R3-s8-12, R3-p2-11
- Evidence: s7 shots/loading__poi-skeleton__1440.png vs loading__poi-loaded__1440.png; s8 shots/dashboard__loading-orgs-held__1440.png
- Fix: Rows at real height inside the card, render the known h1, reserve the status row and count line, bar instead of "Organisation".
- Files: `ProjectLayout.vue`, list skeletons, `DashboardView.vue`, `MediaView.vue`. Effort: M.

### C3-92 · P3 · Chrome small items: session dialog spacing and claim, switcher `aria-controls=""`, full-page cards at different heights, drawer named "Primary", copy nits, dialog Close order differs
- Screens: Session dialog, header switcher, error cards, nav drawer, dialogs.
- Merged (hit by p2, p5, s7): R3-p2-19, R3-s7-chrome-04, R3-s7-chrome-07, R3-s7-chrome-17, R3-s7-chrome-18, R3-p5-16
- Evidence: s7 shots/err503__project__1440.png; p2 shots/session-ended__dialog__1440.png
- Fix: Bottom padding; show the stored-draft sentence only when a draft exists; remove empty `aria-controls`; one card top; name the drawer "Menu"; "Page not found" everywhere; one Close position in tab order (visual position already shared, ds).
- Files: `SessionEndedDialog.vue`, `AppDialog.vue`, `ProjectSwitcher.vue`, `StateCard`, `SessionErrorView`. Effort: S.

## N. Create Project and create dialogs

### C3-93 · P2 · Create dialog frame: control types and hints differ (Route Setting select vs radio cards), error summary and field both `role=alert`, body padding, Close X 5 px low, 50 px jump when the summary appears
- Screens: All six create dialogs.
- Merged (hit by s7, s9): R3-s9-lists-11, R3-s9-lists-21, R3-s7-chrome-11
- Evidence: s9 shots/routes__create-dialog-empty-submit__1440.png, categories__create-dialog__1440.png; guides__create-slug-open__1440.png
- Fix: One control pattern for scope/level, one alert per error, anchor the top edge.
- Files: create dialogs, `AppDialog.vue`. Effort: S-M.

### C3-94 · P2 · Create dialog at zoom200 hides its primary action (footer inline, 328 px dialog, "Create and open" off-screen)
- Screens: Any create dialog, 640x360.
- Merged (hit by s7): R3-s7-chrome-10
- Evidence: s7 shots/dialog__create-poi__zoom200.png
- Fix: Sticky footer when the dialog exceeds 70 % of the viewport.
- Files: `AppDialog.vue`. Effort: S.

### C3-95 · P2 · Create Project wizard craft: stepper circles misalign 10-13 px, disabled Continue explained only by `title`, Greek default silent, zoom200 first field below the fold
- Screens: Create Project steps 1-4 at 1280, 768, zoom200.
- Merged (hit by p2): R3-p2-03, R3-p2-05, R3-p2-12, R3-p2-17
- Evidence: p2 shots/wizard-1__pristine__zoom200.png, wizard-2__continue-without-template__1440.png, wizard-3__first-view__1440.png
- Fix: `items-start` on the stepper; visible helper text and focus the Template group on click; no preselected default or one explanatory line in the first dialog; align notices and "Change" buttons.
- Files: `Stepper.vue`, `CreateProjectView.vue`, `StepLanguages.vue`, `StepReview.vue`. Effort: S.

### C3-96 · P2 · Slug: a 117-character Greek name gives a 119-character slug the Catalogue rejects with a contradicting message; Arabic name gives an empty slug
- Screens: Create Project step 1.
- Merged (hit by p2): R3-p2-06
- Evidence: p2 shots/wizard-1__greek-long__1440.png, wizard-1__rtl-name__1440.png
- Fix: Cap the generated slug client-side and state the limit; "Type a slug in Latin letters"; `dir=auto` on the name field.
- Files: `StepName.vue`, `useCreateProject.ts`. Effort: S.

## O. Tokens, cleanup and gates

### C3-97 · P2 · Dead code and legacy CSS from round-2 cleanup B still present (5 filter components, `useStatusActions`, `dropLineClass`, `.small-label`, `.nums`, unused tokens)
- Screens: Repository (see `design-system/cleanup.md` for file:line and proofs).
- Merged (hit by ds): R3-ds-06, R3-ds-10, R3-ds-17
- Evidence: ds cleanup.md sections A-D
- Fix: Delete per cleanup.md; `shadow-drop-*` in Route/Guide editors need a forced-colours counterpart before `dropLineClass` goes.
- Files: see cleanup.md. Effort: S.

### C3-98 · P2 · `check:css` covers about 56 files and 8 class families, is not in CI or build; the literal gate is not wired
- Screens: Build tooling.
- Merged (hit by ds): R3-ds-07
- Evidence: ds cleanup.md F
- Fix: Widen the tokenizer (no split inside `[...]`), add text/leading/duration/animate/spacing/colour/custom screens, run `--all` in build; wire the literal grep gate; add the e2e icon-size, forced-colours and ring checks.
- Files: `scripts/check-css-tokens.mjs`, `package.json`. Effort: S-M.

### C3-99 · P2 · Hand-rolled button forks and literal sizes in in-scope files (filter chip x2, ghost buttons, `!min-h-8`, `h-[1.625rem]`, `border-black/10`)
- Screens: ListEmpty, MediaView, ReadinessList, MapEditorView, EditorShell, AppHeader, ReorderControls, StepTemplate.
- Merged (hit by ds): R3-ds-09, R3-ds-16
- Evidence: ds cleanup.md C and D
- Fix: Extract `FilterChip`, use `Button variant=ghost`, add `size="sm"` to `ui/select`, name the literals.
- Files: files listed in cleanup.md C and D. Effort: S-M.

### C3-100 · P2 · Popover, menu and tooltip z-index (40) is below modals (50): latent
- Screens: Any future select/HelpHint/menu inside a dialog.
- Merged (hit by ds): R3-ds-05
- Evidence: ds cleanup.md A5
- Fix: z-index `calc(var(--z-modal)+1)` inside a dialog or a `z-popover-over` token.
- Files: `ui/popover/PopoverContent.vue:25`, `ui/dropdown-menu/DropdownMenuContent.vue:31`, `ui/tooltip/Tooltip.vue:19`. Effort: S.

### C3-101 · P3 · Type and spacing system undocumented or drifting: line-height per size, 24 px translation dots, Leaflet glyph, scrollbars/caret, no spacing scale
- Screens: DESIGN.md / system.md.
- Merged (hit by ds): R3-ds-12, R3-ds-13, R3-ds-15, R3-ds-18, R3-ds-19
- Evidence: ds measured system
- Fix: Document one line-height per size and the 4 px base with half-steps; 32 px dots; themed scrollbars and caret.
- Files: `DESIGN.md`, `TranslationDots`. Effort: S.
