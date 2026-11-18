# Scoreboard

Filled by the consolidator. Round 1 audit = Round 0 baseline (the app was unchanged). Rubric and caps: `BRIEF.md` (open P1 caps a screen at 85, open P0 at 60; 90+ needs every state screenshotted and a clean keyboard run). Target: every in-scope screen >= 90, mean >= 93 by the end of Round 3.

How the baseline was built: the **minimum** credible agent score for the screen; for lists, dialogs and editors the 1440/1280 headline score (tablet and zoom variants are noted, not used). Two columns are given: **Uncapped min** (the lowest merit score any agent gave) and **Baseline** (that score with the consolidated P0 cap of 60 applied to every screen the P0 touches). The P0 cap is applied by me consistently: only p5-a11y applied the form-field-border P0 (C1-06) in its own scores, but it is a global token defect, so every screen with a text field, textarea or select is capped at 60. Screens without text fields (sign-in, error states, pickers, Maps list, Floor plans list, panel) are not capped by it.

Rows are the BRIEF §1 screen/state groups; Sign-in and session states, workspace chrome and Create dialogs are split into their listed states because the agents scored them separately. R1 = the round-1 build as measured by the round-2 audit (see 'Round 1 build, measured in round 2' at the end); R2-R3 and Final are empty until the later rounds; fill with the lowest credible score of the round's verification agents.

| # | Screen / state | Uncapped min | Baseline (Round 0) | Range across agents | R1 | R2 | R3 | Final | Cap driver / sources |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Sign-in view | 81 | **81** | 81-82 | **84** (84-86) | | | | s7 81, p2 82 (with SSO). R1 sources: s7 84, p2 86 (with SSO). |
| 2 | Silent SSO landing | 62 | **62** | 62 | **68** (68-86) | | | | s7 only (p2 scored sign-in + SSO together at 82). R1 sources: s7 68; p2 scored sign-in + SSO together at 86. |
| 3 | Session-expired state | 35 | **35** | 35-66 | **76** (76-87) | | | | s7 35 (no UI at all, silent redirect, 7-navigation loop on persistent 401); p6 66 (silent retry works, drafts survive). R1 sources: p2 group 76 (errors, session, offline); s7 dialog 86, 'keeps ending' 87. |
| 4 | Configuration / audience error | 61 | **61** | 61 | **77** (77) | | | | s7. R1 sources: s7 only; config-error and unusable-token pages not exercised (env fallback). |
| 5 | Access denied (403) | 59 | **59** | 59-71 | **76** (76-82) | | | | s7 59; p6 load failures group 71. R1 sources: p2 group 76, s7 82. |
| 6 | Not found / soft-deleted Project (404) | 65 | **65** | 65-81 | **76** (76-82) | | | | s7 65, p6 71, p5 81. R1 sources: p2 group 76, s7 82. |
| 7 | Platform unreachable (502/503/504) | 67 | **67** | 67-81 | **76** (76-82) | | | | s7 67, p6 74 (save), p5 81. R1 sources: p2 76, s7 82, s13 library 503 78; Dashboard error card 66 is in row 14. |
| 8 | Offline banner | 70 | **70** | 70-81 | **69** (69-76) | | | | s7 79, p6 70, p5 81. R1 sources: s7 69 (layout shift, controls stay live), p2 group 76. |
| 9 | Header & left navigation | 60 | **60** | 60-71 | **80** (80-88) | | | | s7 header 60, nav 71; p2 switcher 60. R1 sources: p2 header switcher 80, s7 header 82 / nav 86, p5 nav 88. |
| 10 | Toasts, dialogs & loading skeletons (chrome states) | 62 | **62** | 62-81 | **62** (62-78) | | | | s7 toasts 62, skeletons 64, dialog pattern 81. R1 sources: s7 skeletons 62 (s8 loading 62), toasts 73, dialogs 78. |
| 11 | Project picker (Home + switcher popover) | 57 | **57** | 57-67 | **72** (72-86) | | | | s7 popover 57, Home 64; p2 Home 61, popover 60; p5 67. R1 sources: s7 switcher 72, Home 83; p2 Home 82, switcher 80; p5 86. |
| 12 | Project switch (incl. unsaved work) | 54 | **54** | 54-67 | **75** (75) | | | | s7 54 (popover over the guard dialog); p5 67. R1 sources: s7 only. |
| 13 | Create Project (steps 1-3, resume, landing) | 51 | **51** | 51-78 | **82** (82-84) | | | | At/below cap: P0 create validation + P0 borders. p2 78; s7 step 1 57, step 2 71, step 3 + Initialize + landing 51. R1 sources: p2 82, s7 84 (steps 2-4 via Resume only). |
| 14 | Dashboard, populated | 47 | **47** | 47-52 | **64** (64-76) | | | | At/below cap: P0 first-run/false Ready. p2 47, s8 52 (296 warnings). R1 sources: s8 64 (no next step, warnings), p2 76. |
| 15 | Dashboard, empty / first-run | 40 | **40** | 40-42 | **67** (67-83) | | | | At/below cap: P0 first-run/false Ready. p2 42, s8 40. R1 sources: s8 drafts-only 67 (first-run simulated 79), p2 drafts-only 79 / guide 83. |
| 16 | Places list | 61 | **60** | 61-76 | **72** (72-77) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s9 61 (family score, 1440; 768 = 47, zoom200 = 51); p2 76 (empty list + dialog). R1 sources: s9 72 (1440; 1024/768 cards p1 74, p4 75), p1 77. |
| 17 | POI list | 61 | **60** | 60-77 | **70** (70-86) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s9 61, p4 61 (1024/768 touch), p1 69, p5 77 (60 capped). R1 sources: s9 70, p1 77 (74 at 1024/768), p5 86. |
| 18 | Routes list | 61 | **60** | 61-63 | **72** (72-81) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s9 61 (family); p3 63 (dots/search). R1 sources: s9 72, p3 worklist 81. |
| 19 | Guides list | 61 | **60** | 61-63 | **74** (74-81) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s9 61 (family); p3 63. R1 sources: s9 74, p3 81. |
| 20 | Events list | 61 | **60** | 61-65 | **74** (74-78) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s9 61 (family); p3 65 (dates). R1 sources: s9 74, p3 78 (dates). |
| 21 | Categories list | 61 | **60** | 61-63 | **73** (73-81) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s9 61 (family); p3 63. R1 sources: s9 73, p3 81. |
| 22 | Create dialogs (Place, POI, Route, Guide, Event, Category) | 70 | **60** | 70-82 | **73** (73-91) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s9 70, s10 77, p4 80, p1 82, p2 76-82, p5 77 (60 capped); p6 422-in-dialogs 69. R1 sources: s9 73, p5 91. |
| 23 | New map dialog | 69 | **60** | 69 | **83** (83) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s12. R1 sources: s12 only (partial run). |
| 24 | New floor plan dialog | 78 | **60** | 78 | **84** (84) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s12. R1 sources: s12 only (partial run). |
| 25 | Place editor | 65 | **60** | 65-67 | **73** (73-78) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s10 outdoor 67, indoor 65; p2 first open 67. R1 sources: p1 editors group 73, s10 78. |
| 26 | POI editor | 63 | **60** | 56-73 | **70** (70-82) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). p1 70/73, s10 65/66/70, p2 67, p3 65, p4 63 (touch placement), p5 68 (60 capped). Triggers card alone scored 56 (p4). R1 sources: s10 ACTIVE/pending 70, p1 73, p5 78, p4 79 tablet, p3 82. |
| 27 | Route editor | 64 | **60** | 64-65 | **75** (75-83) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s11 64; p3 65. R1 sources: p3 75, s11 77, p5 83. |
| 28 | Guide editor | 58 | **58** | 58-60 | **74** (74-77) | | | | At/below cap: P0 {borders} (field borders, every screen with a text field). p3 58, s11 60. R1 sources: p3 74, s11 77. |
| 29 | Event editor | 65 | **60** | 65-67 | **78** (78-87) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). p3 65, s11 67. R1 sources: s11 78, p3 78, p5 87. |
| 30 | Category editor | 65 | **60** | 65-77 | **78** (78-87) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). p3 65, s11 77. R1 sources: s11 78, p3 81, p5 87. |
| 31 | Maps list | 76 | **76** | 76 | **85** (85) | | | | s12. R1 sources: s12 only (provisional, partial run); capped 85 by open P1. |
| 32 | Map editor | 57 | **57** | 57-60 | **77** (77-82) | | | | At/below cap: P0 {borders} (field borders, every screen with a text field). s12 57, p4 60 (1024 touch). R1 sources: s12 77 (provisional), p4 pin-by-touch 82. |
| 33 | Floor plans list | 74 | **74** | 74 | **85** (85) | | | | s12. R1 sources: s12 only (provisional, partial run). |
| 34 | Floor plan editor | 63 | **60** | 63-64 | **82** (82-86) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). s12 64, p4 63 (touch), p5 64 (60 capped). R1 sources: p4 touch 82, p5 86; s12 did not reach it. Partly measured. |
| 35 | Media library (grid + list) | 60 | **60** | 60-74 | **61** (61-77) | | | | At/below cap: P0 {borders} (field borders, every screen with a text field). p3 60 (translation lens), s13 grid 70 / list 71 / empty-error 74, p1 72. R1 sources: s13 list view 61 / grid 76, p1 list 64 / grid 77, p3 worklist 71. |
| 36 | Upload dialog | 74 | **60** | 74-82 | **69** (69-82) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field) (as applied by p5). s13 74, p6 74, p5 82 (p5 capped it to 60 'via shared inputs'; arguably no text field). R1 sources: s13 69, p5 82. |
| 37 | Asset editor | 60 | **60** | 60-80 | **66** (66-82) | | | | At/below cap: P0 {borders} (field borders, every screen with a text field). p3 60 (translation lens), s13 image 71 / other 73, p1 audio 80. R1 sources: s13 activation 66, 1440 headline 77 (tablet/zoom 67), p3 79, p5 82. |
| 38 | Asset picker | 68 | **60** | 68-72 | **68** (68-83) | | | | Capped 60: P0 {borders} (field borders, every screen with a text field). p1 68, p5 71 (60 capped), s13 72. R1 sources: s13 68, p1 83, p5 82. |
| 39 | Preview page | 60 | **60** | 51-70 | **79** (79-86) | | | | At/below cap: P0 unlabelled frame. Headline 1440/1280: s14 60, p5 64, p4 70. Tablet 1024/768: s14 51, p4 58. Fire trigger / live vs working: s14 53. R1 sources: s14 79, p4 84 (tablet 81), p5 86. |
| 40 | Preview in app panel (editor) | 48 | **48** | 48-75 | **68** (68-71) | | | | p4 48, s10 66, s14 68 (61 narrow), p3 69, p5 75. R1 sources: s14 68, p4 71. |
| 41 | Open in new tab (`app-preview`) | 63 | **60** | 63-75 | **84** (84-86) | | | | Capped 60: capped by s14 (P0 stand-in frame). s14 63 (60 capped), p4 75. R1 sources: s14 84, p4 84, p5 86. |
| | **Mean of 41 in-scope rows** | **61.9** | **59.6** | | **74.4** | | | | Target mean >= 93 |

**Five lowest (baseline):** Session-expired state (35); Dashboard, empty / first-run (40); Dashboard, populated (47); Preview in app panel (editor) (48); Create Project (steps 1-3, resume, landing) (51).
Screens at >= 90: **0 of 41**. Screens at or below 60: **32 of 41**. Highest baseline: Sign-in view 81.

### Open P0 and P1 (consolidated, Round 0)

| | Consolidated (de-duplicated) | Original reports |
|---|---|---|
| Open P0 | **5** | 6 |
| Open P1 | **54** | 80 |
| Open P2 / P3 | 61 / 5 | 160 / 44 |

P0: C1-41, C1-42 (Dashboard), C1-06 (field borders), C1-81 (Preview frame), C1-59 (Create Project validation). Disputed severity (see `consolidated.md` Conflicts): C1-41/C1-42 (p2 P0, s8 P1), C1-06 (p5 P0, design-system P1), C1-15 (could be P0 on a strict reading of `14` §4).

### Per persona (Round 0)

Scores are the persona agent's own screen scores (their caps applied) and their stated group range; job success is as reported (Yes = done unaided without a workaround; Partial = done with a workaround or friction; No = not achievable in the CMS).

| Persona (agent) | Group range / mean of own screens | Job success as reported | R1 | R2 | R3 | Final |
|---|---|---|---|---|---|---|
| Content editor, daily power user (p1-editor) | 65-82 / mean 72.4 (8 screens); verdict 'not shippable for power use yet' | Create and edit a POI, Working Copy cycle, leave guard: **Yes**. Activate safely: **No** (one click, false 'complete'). Reorder across 54 rows: **Partial** (53 clicks). Find 'what I edited yesterday': **No** (no sort, no updated column, 8 editors opened by hand). Media/picker: **Partial**. | 62-83 (headline lists/editors 73-77), mean 72.2 of 9; verdict 'large step up, find-it-again jobs still fail'. Jobs: create/edit POI, Working Copy cycle, reorder (top/position/drag), URL state, Media: **Yes**. Find what I just saved on the Dashboard: **No**. Sort by Updated newest first: **No**. Deactivate a POI that has a trigger: **No** (2 of 3 test POIs stuck). Own 409 resolution: **Partial**. | | | |
| Project manager / first-time author (p2-manager) | 42-82 / mean 66.1 (9 screens); Dashboard 42-47 | Sign in (silent SSO): **Yes**. Create + initialize a Project (also resume): **Yes** (best screen audited, 78). Find the Project among 37: **Partial**. Answer 'what blocks launch and what do I do next': **No**. First Place and first POI in ~2 min: **Yes**, unguided. | 76-86, mean 80.5 of 8; Dashboard Populated 76 (s8: 64). Jobs: sign in, find Project, create + abandon + resume + initialize: **Yes**. First Place and POI via the guide: **Yes** (two clicks, guide then disappears). Answer 'what blocks launch and how do I go live': **Partial** (blockers yes, going live not stated). Understand ACTIVE vs App: Draft: **No**. | | | |
| Translator (p3-translator) | 55-72 (own stated range); mean 63.4 (7 screens) | Write Greek/Italian text and save: **Yes**. See source text beside the target: **No**. Build the Italian worklist across six lists + Media: **No** (estimated 10+ min, 85 of 85 rows incomplete). Accent-insensitive search: **Yes**. Alt text for an image: **Partial**. | 67-85, mean 73.5 of 11 (RTL 67 partly inferred). Jobs: Italian worklist across six lists in 2 clicks: **Yes**. Source beside target, Copy source: **Yes**. Greek search: **Yes**. Trust the completeness marks (Route stops, Guide blocks): **No**. Media worklist (what is missing per file): **Partial/No**. Dates read consistently: **No**. | | | |
| Kiosk operator / on-site tablet author (p4-kiosk) | 58-66 (own stated range); mean 63.4 (10 screens) | Check KIOSK/MOBILE/WEB preview and fire QR/geo/beacon: **Yes** (layout only, not true size; beacon fires on KIOSK wrongly). Print/copy the QR: **No** at audit time (no public address; now renders). Tablet navigation and row actions at 768: **Partial** (actions clipped). Place by touch on map/floor plan: **Yes**, with tiny pins and layout shift. | 71-84, mean 79.9 of 9. Jobs: check KIOSK/MOBILE/WEB preview, fire QR/geo/beacon from the Preview page: **Yes**. 'Test in preview' from the trigger row: **No** (dead link). Read the kiosk in the editor panel: **No** (24-29 %). Tablet row actions: **Partial** (18 px kebab). Place by touch (pin, floor plan): **Yes**. Scroll past a map by touch: **No**. Print/copy QR: **Yes**. | | | |
| Keyboard / screen-reader author (p5-a11y) | 58-68 (own stated range); uncapped 67-81 | Complete core tasks by keyboard only: **Partial** (focus drops to body after most actions; 37-70 extra Tab stops on the POI map; no route announcement). Gate checks: **3 fail** (field borders, Preview frame, forced colours); skip link, dialogs, live regions, reorder announcements **Yes**. | 78-91, mean 84.9 of 11; axe 0 findings on all in-scope routes. Core tasks by keyboard only: **Yes with gaps** (focus drops to body after attach/Restore; ~47 unnamed map Tab stops; Undo unfindable). Gates: field borders, preview frame, forced colours, reorder, live regions: **pass**; zoom 200 sticky stack: **P1**. | | | |
| Error / edge-case tester (p6-edge) | 66-78 (own stated range); mean 70.9 (13 state groups) | Recover from 422, 409 (DRAFT), 5xx, offline, silent 401: **Yes**. Understand a 403/404 on save, session expiry mid-edit, Apply 409: **No / Partial**. Upload failures and many-file queue: **Partial** (no requestId, any type accepted). | 74-80 (from the agent's returned summary; report written by the orchestrator). Recover from 401, 409 (Save and Apply, per field), 422, offline, double submit, uploads (hold/duplicate/cancel/retry), Undo: **Yes**. Understand a 403/404/500 on save: **No** (raw server sentence). Lists after a failed `/languages` read: **No** (silent 'Add a language first'). Apply after it was applied elsewhere: **No** (stale editor). | | | |

Persona group mean (the six ranges' midpoints, for orientation only): about 64.

### Notes

- Scores below 60 on merit (Dashboard 40-47, Session-expired 35, Create Project 51, Project switch 54, Preview in app 48, Map editor 57, Project picker 57) are real, not cap effects.
- Uncapped means show how far the cap flattens the table: baseline mean 59.6 versus uncapped 61.9.
- `consolidated.md` maps every finding to the cluster that fixes it; the Round 1 implementation plan should attack the P0 set first (five items, all small to medium) because clearing them lifts the cap on the 26 capped rows (of 41 rows).

## Round 1 build, measured in round 2 (consolidator, 2026-11-16)

Method: the **minimum** credible agent score per screen, same convention as the baseline: functional states count (ACTIVE/pending, list view, activation, drafts-only), tablet and zoom 200 variants are noted in the sources column, not used. Agent group scores (p2 error states, p1 editors) are used only where no per-screen score exists. No open P0 was reported by any round-2 agent, so the P0 cap (60) no longer applies; every screen still carries an open P1 (cap 85), which no score reaches. Scores were not inflated to meet a cap.

**Mean of the 41 in-scope rows: 74.4** (baseline 59.6; uncapped baseline 61.9). Screens >= 90: **0 of 41**. Screens >= 85: 2 (Maps list, Floor plans list, both single-agent partial). Screens <= 60: **0 of 41**. Lowest: 61.

**Five lowest (R1):** Media library grid + list (61, list view overprint, no per-row translation state); Toasts, dialogs and loading skeletons (62); Dashboard, populated (64); Asset editor (66, DRAFT activation contradicts the library); Dashboard, empty / first-run (67, drafts-only state). Next: Silent SSO landing, Asset picker, Preview in app panel (68 each).

**Not measured or only partly measured:** Floor plan editor (s12 stopped before it; scored from p4 touch 82 and p5 86), Maps list, Floor plans list, New map dialog, New floor plan dialog, Map editor (s12 partial: `curator` lost Catalogue access, `admin` sign-in then denied; scores provisional, single agent); Configuration / audience error page and Manage members (env fallback, not exercised); Create Project step 1 submit/422 as curator (not run); error/edge-case persona p6-edge (no report). Rows 23, 24, 31, 33 rest on one provisional agent each.

### Open P0 and P1 (consolidated, after round 2)

| | Consolidated (de-duplicated, `round-2/audit/consolidated.md`) | Original reports |
|---|---|---|
| Open P0 | **0** (baseline 5; all five closed: C1-06, 42, 59, 81 verified fixed; C1-41 first-run guide fixed by p2, partly by s8, see C2-26) | 0 |
| Open P1 | **30** (baseline 54) | 47 |
| Open P2 / P3 | 55 / 8 | 117 / 70 |

Not counted in the P1 number: C1-16 (bulk selection, deferred, Q-016) and C1-47/48 (translation bars, packages: backend gaps G-023/G-024). Ten root causes explain a large share of the P1s (listed in `consolidated.md`). Disputed severity: C2-09 (raw server detail echoed) is P1 because of the BRIEF hard constraint, P2-P3 in four of the five originals; C2-10 (403/404 on save, C1-65 was P1) is rated P2 by its only reporter.
