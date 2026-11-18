# P2 changes (Dashboard and first run)

Fixed: C2-24, C2-26, C2-27, C2-28, C2-29, C2-30, C2-31 (Dashboard), C2-32, C2-09 (Dashboard card), C2-21 (Dashboard skeleton), C2-73. Partly: C2-25 (chip leaves the h1 but sits one row below it, PageHead has no slot; see requests.md).

Files: `views/workspace/DashboardView.vue`, `dashboard/StatusCard.vue`, `FirstRunGuide.vue`, `PendingChanges.vue`, `ReadinessGroups.vue`, `ContentCounts.vue`, new `dashboard/guideState.ts`, `platform/dashboardData.ts`, `platform/readiness.ts` (`groupIssues` one row per Resource, `dashboardIssues`, `issueRows`, `issueTitle`). D-092 appended. No Q entries. e2e: no spec touches the Dashboard.

Acceptance (admin, Populated, Empty D, real data; `shots.mjs`, `probe.mjs`):
- Populated: 100 Resources with warnings (was 396+ lines); all 7 groups opened show 33 rows, all unique (limit 40; 5 per kind first).
- Guide stays on Empty D (DRAFT Place and POI): steps 1-2 Done, step 3 "Next step". Pristine (mocked zero): 5 steps, step 1 opens `/places?create=1`.
- h1 is "Dashboard" (no "Active"); status line "Visitor app: Draft · Content revision 194".
- Pending: newest (saved 13 Nov 15:57) is row 1; "Showing 10 of 15" and per-kind See all links.
- Status card Populated (ACTIVE 11+, no blockers, app Draft): "Ready to go live, with 100 warnings", primary "Go to Launch", secondary Preview.
- 503 mock: ProblemAlert with fixed sentence and request id, no server text. Dismiss guide: focus lands on the h1, stays dismissed after reload.
- axe serious/critical: none at 1440, 1024, 768, zoom200 (both Projects); no horizontal scroll; forced-colors shots taken. Typecheck: no errors in P2 files (one existing error in `editor/undoRemove.ts`, not mine).

Deferred: Launch screen itself (out of scope); "N pending" for Assets (API ignores it); Project theme warnings have no link (no theme route). Not run: e2e, keyboard run beyond Dismiss/step links, Greek and long-text shots. Screens in `after/`.
Notes: the guide only shows while nothing is live or a Place/POI is missing; steps 3 and 5 tick when this viewer opened them from the guide.

## Orchestrator correction
Launch is still the "Not available yet" placeholder, so "Ready to go live" now has primary "Preview the app", the sentence "Visitors still see nothing: the visitor app is in Draft. Going live happens under Launch, which is not available in this version of the CMS yet.", and a plain secondary link "About Launch". Availability is detected by whether Launch resolves to a dedicated route (`router.resolve(...).name !== "project-section"`); once it does, the primary returns to "Go to Launch" with Preview secondary. Typecheck clean for P2 files; re-shot `after/populated-1440.png`; axe clean.
