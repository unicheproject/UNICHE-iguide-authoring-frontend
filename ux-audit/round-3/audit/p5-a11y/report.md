# p5-a11y (keyboard-only and screen-reader user) — Round 3

Account `admin`, Project `UX Audit – Populated`. Keyboard only (`page.keyboard`); the only shortcut was `locator.focus()` to jump to a control where Tab-walking 250 stops was not the point. Records created: `UX-R3-p5 POI A – Parthenon test`, `UX-R3-p5 Route`, `UX-R3-p5 Guide`, `UX-R3-p5 Category`, `UX-R3-p5 Event`, uploads `UX-R3-p5 upload a/b`. Pre-existing records were opened only (axe, tab sweeps, Esc-cancelled Move dialog); nothing of theirs was saved.

## Verdict
Keyboard model is the best yet: one Tab stop for the map pin group, roving picker tiles, Undo that takes focus, a row menu that opens on Move, an editor that announces "Saving… / Saved 11:12", axe clean on 24 in-scope routes at 1440. But the visible focus indicator has three holes: every primary button's ring is white (1.0:1 on a white dialog, 1.09:1 on the canvas); tab strips clip the ring; the row menu's focused item is 1.14:1 (and inverted in forced colours). Event date fields flag bad hours/minutes by red border only, and a bad start rewrites the end to 1 Jan 2000. Three open P1: nothing here scores above 85.

## Context check
- 12-cms-experience §1: the CMS is "the only authoring surface of iGuide" and meets WCAG 2.1 AA (read §1 only).
- 14 §4: "validation errors are associated with their control, announced on submission, and summarized at the top of the form with links to each field".
- 03 §1: not read in full; relied on BRIEF.md (Working Copy, never "published"). Strings seen were consistent.
- DECISIONS D-099: coordinates "are checked when the field is left (and announced)": verified for latitude, not for event dates.
- PRODUCT.md: editor needs "keyboard flow, clear save feedback, and never losing work"; the lost end date (R3-p5-02) is the one lost-input case found.
- impeccable (Mode Operate; interview steps skipped, I am a subagent): critique.md "Viewable targets require browser inspection when available"; audit.md "flag a global 0.01ms kill" (motion); polish.md "A detector result is defect evidence, not proof of quality"; operate.md "Every interactive component has: default, hover, focus, active, disabled, loading, error".

## Scores (all capped at 85 by open P1s)
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp 10 | Total | Note |
|---|---|---|---|---|---|---|---|---|
| Home + switcher | 23 | 18 | 14 | 13 | 13 | 9 | 90 -> 85 | P1-01 |
| Dashboard | 22 | 17 | 14 | 13 | 11 | 8 | 85 | P1-01 ("Preview the app" 1.0:1) |
| Six lists | 22 | 17 | 13 | 13 | 10 | 9 | 84 | P1-01, P1-03, P2 paging |
| POI editor (draft + active) | 22 | 17 | 13 | 13 | 10 | 8 | 83 | P1-01, tab ring clip |
| Route / Guide editor | 23 | 17 | 14 | 13 | 12 | 9 | 88 -> 85 | P1-01 |
| Event editor | 20 | 16 | 12 | 11 | 7 | 8 | 74 | P1-02, P2-09 |
| Category editor | 23 | 17 | 14 | 14 | 12 | 9 | 89 -> 85 | P1-01 |
| Create dialogs | 22 | 17 | 14 | 12 | 11 | 9 | 85 | double announce |
| Asset picker / Upload | 23 | 17 | 14 | 14 | 12 | 9 | 89 -> 85 | P1-01 on "Use this image" |
| Preview page / in app | 22 | 17 | 14 | 13 | 10 | 8 | 84 | ring clip, stand-in ring |
| Nav drawer 768 | 24 | 18 | 14 | 14 | 14 | 9 | 93 -> 85 | P1-01 page-level |
| Session-ended / leave-confirm | 21 | 17 | 13 | 12 | 11 | 8 | 82 | P2-05 |
| Forced colours (app) | | | | | | | 80 | P2-08 |
Nielsen (0-4): status 3, real world 3, control 4, consistency 3, error prevention 3, recognition 3, flexibility 4, minimalism 3, error recovery 2, help 3.

## Round-2 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C2-01 icon buttons | fixed | kebab 40x40, Close 40x40, Menu 44x44 at 768 |
| R2-V-02 HelpHint 32 px | not fixed | "What does the visitor app status mean?" 32x32 |
| C2-02 forced-colour boundaries | partly | dialog, menu, popover 1px black border; nav current filled; chips bordered; menu focus inverted (P2-08) |
| C2-04 reduced motion | partly | reduce: spinner and splash pulse gone (getAnimations 6 -> 0), dialog fade kept 120 ms; button transitions still 1 ms |
| C2-05 / C2-06 / R2-V-03 sticky | partly | 1440: editor 112 px (12.4 %), list 162 px (18 %). 1280x720: list 166 px (23.1 %, 15.3 % below app header), editor 112 px (15.6 %). zoom200: editor 112 px = 31.1 % (header 56 px = 15.6 % below app header); list unsticks |
| R2-V-04, R2-V-07 | not tested | |
| C2-13 error states | fixed | not-a-uuid -> h1 "This page does not exist", title "Page not found · iGuide CMS", focus on h1; forced Project 404 -> h1 focused, title correct, axe clean, no server text |
| C2-16 switcher name | fixed | dialog "Switch project"; axe clean |
| C2-17 user menu | fixed | Enter opens on "Sign out", Esc -> account button |
| C2-18 leave-confirm from switcher | partly | focus in, Esc -> editor h1; but title and announcer then read the other Project's Dashboard (R3-p5-05) |
| C2-20 duplicate landmarks | fixed | one banner, nav "Primary", main; axe landmark rules clean |
| C2-21 skeleton | partly | aria-busy present; no live message captured in 900 ms |
| C2-57 focus never on body | fixed | Activate cancel -> Activate; attach -> Replace; Undo; Esc -> opener; upload -> h2. Body only on initial load and past the last Tab stop |
| C2-58 map Tab stops | fixed | Skip map + one group + Nearby POIs (3 stops, was ~47) |
| C2-68 save errors | fixed | 422: summary focused, links focus Latitude and Title; 503: fixed sentence + request id, no server text |
| C2-69 coordinate/date errors | partly | latitude announced on blur (twice); Event hour/minute: no message, no announcement (P1-02) |
| C2-70 Undo | fixed | Undo takes focus, Ctrl+Z works (Route stops, Guide blocks) |
| C2-74 shortcuts | partly | `/` works (types "/" inside the field); kind-to-kind still Tab/nav |
| C2-76 upload focus | fixed | opens on h2 "Upload files" |
| C2-77 Upload anyway | not exercised | small PNGs uploaded directly; axe label-in-name clean |
| C2-78 picker roving | fixed | one Tab stop, arrows, Home/End, Space, aria-pressed, "Selected: meander-border. Decorative", focus -> Replace |
| C2-86 floor-plan Place names | fixed | "PlaceRampin Rider"; 119 stops by design |
| C2-88, C2-92 | not exercised | |
| C2-91 Esc / inert stand-in | fixed | inert + aria-hidden (53 focusables) until Interact; Esc -> Interact + "Stopped interacting with the preview"; 2nd Esc closes the editor panel -> "Preview in app" |

## Job walk
| Job | Result | Time / hesitation |
|---|---|---|
| Switch Project | pass | ~12 s |
| Home search + arrows | pass (two "no match" messages) | ~10 s |
| POI list: segments, Filters, sort, pager, `/`, row menu, Move to position | partial | pager leaves focus 3,700 px down (P2-07); Filters popover unnamed (P2-12) |
| Open POI, edit, Ctrl+S, language tabs, Copy source, Next missing | partial | state line good; tab ring clipped (P2-04) |
| Activate confirm | pass | h2 focused, Esc -> Activate; same sentence 3x |
| Create POI + forced 422 | pass | summary focused, links work; double announce |
| Place by coordinates and pin | pass | "Pin moved to 37.97218, 23.72505" |
| Route stops reorder / remove / Undo / Ctrl+Z | pass | "Moved … to position 2 of 3." |
| Guide block remove + Undo | pass | readiness re-announced twice |
| Category icon radios | pass | 21 native radios, one Tab stop |
| Event DateTimeFields | fail | names good; errors not exposed (P1-02) |
| Asset picker attach | pass | focus on Replace |
| Upload live log | pass | role=log "Uploading 2 files." / "… uploaded." / "2 uploaded." |
| Preview page + in app | pass with P2 | Skip, Interact, Esc order, 46 stand-in stops |
| Nav drawer 768 | pass | opens on current item, Esc -> Menu, link -> h1 |
| Session-ended dialog | pass | opens on h2, Esc -> h1, no server text |

## Axe (wcag2a/aa, 21a/aa)
1440, 24 routes (Dashboard, 6 lists, Place/POI(2)/Route/Guide/Event/Category editors, Maps, Map editor, Floor plans, Floor plan editor, Media, Asset editor, Preview, 404, Create Project, bad id, Home): critical 0, serious 0, moderate 0, minor 0. zoom200, 7 routes: 0. States: `/pois?pending=1` serious x1 label-content-name-mismatch (R3-p5-03); Event editor with an invalid start serious x1 rule / 15 nodes color-contrast 3.71:1 (R3-p5-09); switcher, Filters popover, create dialog (empty, 422), Activate confirm, picker, upload, session-ended, drawer, 404, preview interacting, map open, Home empty search: 0.
Contrast (computed, with opacity): muted 5.35-6.36:1, placeholders 5.63:1, chips 5.65-10.31:1, disabled Save/Fire 4.66:1.

## Findings
R3-p5-01 P1 Primary buttons have no visible focus ring. Every primary button (New …, Create and open, Activate, Apply changes, Use this image, Sign in again, Upload "Close", Dashboard "Preview the app"); 1440/768/zoom200. Evidence: shots/focus__primary-button-in-dialog__1440.png, shots/focus__primary-button-on-canvas__1440.png, logs-a7.txt. Outline 2px solid #fff offset 2px: 1.0:1 on white dialogs, 1.09:1 on canvas; other controls 9.5-11.3:1. Hurts: WCAG 2.4.7/1.4.11; the main action is the one control a sighted keyboard user cannot see. Fix: two-tone ring (inner white, outer purple via box-shadow) or purple outline. Files: Button variants / base focus rule. Effort S.

R3-p5-02 P1 Event hour/minute errors colour-only and silent; bad start rewrites end. Event editor, Dates. Repro: Add a date, Hour 25, Tab, Minute 61, Tab. shots/event-editor__date-invalid__1440.png, logs-f2.txt. aria-invalid=true + red border, aria-describedby only the format hint, live region empty on blur, Ctrl+S summary says only "Occurrence 1: Set when it starts."; Ends row became 1/January/2000/01/00. "31 February 2027" accepted on blur. Hurts: 14 §4, 1.4.1, lost input. Fix: blur validation with linked, announced sentence; do not touch Ends while Start invalid; reject impossible days. Files: DateTimeFields, Event editor. Effort M.

R3-p5-03 P1 "Filters and sort, 1 on" fails label-in-name when a filter is on. Lists, /pois?pending=1; axe serious. Visible "Filters 1", name "Filters and sort, 1 on" (WCAG 2.5.3). Fix: name starts with the visible text ("Filters 1, and sort"). Files: ListFilterMenu.vue. Effort S.

R3-p5-04 P2 Tab strips clip the focus ring. Language tabs in every editor (L4,T4,B4 first; T4,B4 others), Preview Surface/Language/Content/size tabs (L4,T4,B5), Preview-in-app tabs. shots/poi-editor__lang-tab-focus__1440.png, poi-editor__greek-tab__1440.png. Container overflow-x-auto, ring 4 px, no padding. Fix: 4 px inset padding in the scroller. Files: language tab bar, preview tab bars. Effort S.

R3-p5-05 P2 Cancelling "Leave without saving?" leaves wrong title and announcement. Dirty POI editor, switcher, other Project, Esc: URL and page stay; document.title "Dashboard · UX Audit – Empty B · iGuide CMS"; announcer "Dashboard loaded". shots/leave-confirm__after-esc__1440.png. WCAG 2.4.2. Fix: set title/announce from the committed route. Files: router title/announcer hook, ProjectSwitcher.vue. Effort S.

R3-p5-06 P2 Duplicate announcements. Latitude error twice; Add stops says three things per add ("Added X as stop 2.", "12 items match, 2 added", "X added. 2 added in total."); Guide add re-announces "2 warnings…" then "3 warnings…"; "Saved 11:17" re-announced after Undo; Home no-match says two sentences; create-dialog summary + field alert. Fix: one message per action. Files: FieldError, ResourcePickerDialog, editor readiness live region, ProjectList. Effort S-M.

R3-p5-07 P2 After Next/Previous page, focus stays on the pager, off-screen. Focus on "Next" at y 3,703 while view scrolls to new rows ("Page 2 of 2, showing 51 to 93 of 93"). logs-a4.txt, shots/poi-list__page2__1440.png. Fix: focus the table or first row link. Files: shared list pager. Effort S.

R3-p5-08 P2 Row menu focus: 1.14:1 in light mode, inverted in forced colours. Highlight rgb(238,240,243) on white, no outline (logs-w1.txt); forced colours: unfocused items outline solid 2px, focused none (logs-u1.txt, shots/poi-list__row-menu__forced-colors__1440.png). Fix: outline on the highlighted item; none on others. Files: menu primitive CSS. Effort S.

R3-p5-09 P2 Ended Event date cards dim to 3.71:1. li opacity-80 takes text-muted-foreground (#78808d on #f6f7f9) to 3.71:1 for labels, hint, "(required)" (axe x15). Fix: dim border/bg, not opacity. Files: Event dates card. Effort S.

R3-p5-10 P2 Focus ring invisible on the Preview stand-in's dark header. CMS purple ring on navy: 1.38:1 for six header buttons (logs-j2.txt, shots/preview__interacting__1440.png). Fix: stand-in sets a light ring on dark themes. Files: src/components/preview/*. Effort S.

R3-p5-11 P2 Zoom200 active POI editor: focused textarea under the sticky header (ring clipped T203, centre covered by header title; logs-o1.txt). Fix: scroll-padding-top = app + editor header. Effort S. (Caveat: judged from geometry, not a screenshot.)

R3-p5-12 P2 Filters popover has no accessible name and no close control (aria snapshot `- dialog:`; axe silent; Tab wraps, Esc only exit). Fix: aria-label, visible Done. Files: ListFilterMenu.vue. Effort S.

R3-p5-13 P3 Sticky share above 15 % (R2-V-03): see table. Let the editor header scroll away on short screens. S.
R3-p5-14 P3 HelpHint buttons 32x32 (R2-V-02). S.
R3-p5-15 P3 Programmatic h1 focus paints a white 4 px halo on the grey canvas (box-shadow, no outline), visible in shots/poi-list__load__1440.png. S.
R3-p5-16 P3 Dialog Close button order inconsistent: first in Activate/Upload/Session, last in create dialogs and Asset picker. S.
R3-p5-17 P3 Native radio groups (status segments, icon radios): Home/End scroll the page instead of selecting first/last. S.
R3-p5-18 P3 Activate confirm repeats "3 warnings, nothing blocks" three times; "Review in editor" lands on the English tab, not the item; "Copy source" announces only "Unsaved changes". S.
R3-p5-19 P3 Translation dots add 3 link stops per row (250 per 50 rows); names read "English : complete". M.
R3-p5-20 P3 "Routes loaded" announced while the 401 session dialog is open; "Skip preview" announces region label plus status; map +/- zoom silent. S.
R3-p5-21 P3 Create dialog 422: unmapped field path (my forced `title.en`) shows a summary line without a link; real server path unverified. S.
R3-p5-22 P3 Filters popover label placement differs ("Category" inline, others stacked). S.

Counts: P0 0, P1 3, P2 9, P3 10.

## What works
Switcher (named, arrows, Esc returns, h1 + title + "Dashboard loaded"); row menu opens on Move, Home/End, Esc -> kebab; Move to position range message; state line "Unsaved changes / Saving… / Saved 11:12"; 422 summary focus + links + request id; 503 fixed sentence; offline announced; one Tab stop pin group with spoken positions; "37,9715" accepted; Route/Guide Move, Position, Remove, Undo (focus + Ctrl+Z); picker roving and attach -> Replace; upload dialog opens on its heading with a polite log; inert stand-in with Esc order and visible "Esc stops"; forced-colour borders on dialogs, menus, popovers, filled current nav; reduced motion removes spinners and pulses; axe 0 on 24 routes at 1440 and 7 at zoom200.

## Unverified / could not test
Held-file upload flow (Upload anyway, Skip); real server 422 paths; expanded Preview panel over the header (C2-88); Place editor map; Maps visitor-filter stop count; hover/active states beyond focus; toast overlap (R2-V-04); editor heights (R2-V-07); long Greek and RTL text; real NVDA/VoiceOver (checked via ariaSnapshot and live-region logs only); full axe sweep at 1024 and 768 (1440 and a 7-route zoom200 run done; 768 only drawer and Routes); Move to position submitted only with an invalid value then cancelled.
