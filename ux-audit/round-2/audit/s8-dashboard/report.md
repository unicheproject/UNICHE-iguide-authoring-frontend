# s8-dashboard — Round 2
(Saved by the orchestrator from the agent's returned report, lightly condensed: its Write call was refused. Scripts a1–a3.mjs, lib.mjs and shots/ in this folder. Tall shots use 2400–2600 px viewports because the app scrolls inside the shell.)

Operate mode; interview skipped. Rules cited: critique.md one primary action + consequence; audit.md evidence not assertion; operate.md scope.

## Verdict
The Dashboard no longer lies (no false "Ready", icon + word states, axe clean on 3 states), but still fails "what do I do now": nothing says how the visitor app goes live; the first-run guide vanishes after two drafts; warnings misname fields and repeat lines; the "Active" chip contradicts "App: Draft". Range 64–79 (overall ~66–74). P0 0, P1 4, P2 6, P3 5. C1: fixed 5, partly 5, not fixed 2 (documented absences), regressed 0.

## Context check
12 §3 "answers what do I do now", one action; 14 §4 text+icon; 03 §1 lifecycle; D-077 "Ready" needs ≥ 1 ACTIVE; PRODUCT.md manager reads the Dashboard to decide what blocks launch.

## Scores (T25/H20/C15/Co15/A15/S10)
| State | Total |
|---|---|
| Populated | 64 |
| Drafts-only (Empty B, D) | 67 |
| First run (simulated) | 79 |
| Blocked (simulated) | 76 |
| Loading | 62 |
| Error (503, readiness 500/403) | 66 |
Nielsen 23/40 (2,2,3,2,3,3,2,2,2,2).

## Findings
- **R2-s8-01 P1 Status card never says how to go live.** shots/dashboard__pop-tall__1440.png, dashboard__D__1440.png, dashboard__ready__1440.png. "Ready with 396 warnings" → only "Review warnings" (scrolls to list); `applicationStatus: DRAFT` only a muted footer; no state links to Launch; "Ready" offers "Preview the app". Fix: no blockers and ACTIVE > 0 → primary "Go to Launch" with "Visitors still see nothing: the visitor app is in Draft". Files: StatusCard.vue. S.
- **R2-s8-02 P1 "Active" chip beside the h1 (Catalogue Project status via PageHead `:status`) contradicts "App: Draft" / "Nothing is live yet".** Fix: remove it or show the Visitor app status from /settings. Files: DashboardView.vue, PageHead.vue. S.
- **R2-s8-03 P1 Warnings list wrong and repetitive.** shots/dashboard__pop-groups-open__1440.png: "Description is not translated. (151)" shows 20 lines, 6 unique; "Text is not translated. (60)" 20 lines, 2 unique. Cause: `groupIssues` titles a group with its first issue's sentence; Summary/Title lines sit under "Description"; no row names its field (e.g. "Ancient Agora Entrance and Ticket Office: Italian" ×4); rows repeat the kind under a kind heading; PENDING_WORKING_COPY warnings duplicate the pending card; counts are lines not resources. Fix: one row per Resource ("Italian: Description, Summary"), drop kind prefix, drop PENDING_WORKING_COPY, name the field. Files: readiness.ts, ReadinessGroups.vue. M.
- **R2-s8-04 P1 First-run guide disappears once a DRAFT Place and POI exist** (`firstRun` = no ACTIVE and (places == 0 or pois == 0)); steps 3–5 never reached; page becomes "Nothing is live yet" + "Warnings (1)" + zeros. Evidence: dashboard__D__1440.png vs dashboard__first-run-pristine__1440.png. Fix: keep the guide until done or dismissed; tick 3–5 from data; add step 6 "Activate and launch". M.
- **R2-s8-05 P1 First-run buttons open the list, not the create dialog.** Fix: `?create=1` opens the create dialog on arrival. Files: FirstRunGuide.vue, list views. S–M.
- **R2-s8-06 P2 "Activate content" lands on `/places?status=DRAFT`, not an activation.** Fix: rename "Show drafts" or open an "Activate drafts" dialog. M.
- **R2-s8-07 P2 Pending table numbers do not add up** ("15 items…", table of 10, "Show 3 more", "2 more not listed"; `PENDING_ROWS = 10` is also the per-kind fetch size); Open links' names repeat the title. Fix: "Showing 10 of 15" + link to pending-filtered list; title-only link text. Files: PendingChanges.vue, dashboardData.ts. S.
- **R2-s8-08 P2 Counts strip:** zero rows only muted but still full links; big number is active+draft while the card reasons on ACTIVE. Fix: "10 active · 8 draft", grey zeros fully, strip above pending/warnings on empty or drafts-only Projects. Files: ContentCounts.vue. S.
- **R2-s8-09 P2 Blocked card:** "Fixed in the live content" unclear; "and 3 more" plain text; backend NAVIGATION resource type missing in frontend `ReadinessResourceType` (raw string, `issueLink` null, may disable "Fix the first issue"). Evidence: dashboard__blocked-6__1440.png. Files: readiness.ts. S.
- **R2-s8-10 P2 Error copy shows raw server detail and blames the wrong cause** (503 on one list → "The UNICHE platform is not reachable."; 500/403 echo `detail` verbatim, e.g. "NullPointerException at ReadinessReport.java:88"). Request id shown (good). Fix: fixed sentences by code/status. Hard constraint. Files: DashboardView.vue `errorText`. S.
- **R2-s8-11 P2 Loading:** two grey boxes, nothing announced (only `aria-busy`), heights 176/256 px don't match final layout; switcher chip blank ~1 s. Fix: hidden "Loading the Dashboard" status; skeleton mirrors final layout. S.
- **R2-s8-12 P3 Copy:** "Everything you have written is still a draft" false in some states; "visitor app"/"app"/"Application" mixed; "live content" jargon.
- **R2-s8-13 P3 Layout:** below 1100 px counts fall under the 10-row pending table; at 1440 the guide is 770 px on a 1180 px canvas.
- **R2-s8-14 P3 Keyboard:** 29 stops in main; no traps; "Review warnings" focuses the warnings h2; pending capped at 5 would shorten the run.
- **R2-s8-15 P3 State coverage:** offline reload shows the browser error page; settings 409 silently drops the footer line; uninitialized state not reached.
axe (wcag2a/aa/21a/aa): 0 violations on Populated, groups open, Empty D.

## Round-1 fixes verified
C1-41 partly (R2-s8-04, -05) · C1-42 fixed · C1-43 partly (-01, -09) · C1-44 fixed · C1-45 partly (-03) · C1-46 fixed · C1-47/48 not fixed (G-023, G-024) · C1-49 partly (-10) · C1-50 partly (-12) · C1-51 fixed · C1-52 fixed. Totals: fixed 5, partly 5, not fixed 2, regressed 0.

## Recommended Dashboard (existing API data only)
1. Header line replacing the Active chip: "Visitor app: Draft · Content revision N".
2. One next-step card, in order: blockers > 0 → "N things block going live" (3 items with field names, "Fix first", "See all N"); not initialized → resume; no Place or POI → first-run guide; ACTIVE = 0 with drafts → "N drafts are not visible" + "Activate drafts"; ACTIVE > 0, app Draft, no blockers → "Ready to go live", primary "Go to Launch", secondary "Preview"; app live → "Live · N pending changes".
3. First-run guide stays until done/dismissed; buttons open create dialogs; step 6 "Go live".
4. Pending: top 5 + "See all N", title-only links.
5. Counts: "10 active · 8 draft", zeros greyed, above warnings.
6. Warnings: one summary line, per-Resource rows with field names, no PENDING_WORKING_COPY, link to Translations.

## What works
Icon+word card and four states; collapsed groups; focus to warnings heading; error Alert with request id; language names; axe clean; no horizontal scroll at zoom200; skeleton not spinner.

## Unverified
Uninitialized state; pristine first run simulated; no real screen reader; forced colours, reduced motion not re-run; 1024 shots not examined in detail; warning counts drift (396→410).
