# p2-manager — Round 2
(Saved by the orchestrator from the agent's returned report: its Write call was refused. Shots and scripts in this folder.)

Persona: project manager and first-time author. Mode: Operate (impeccable interview steps skipped, subagent). Accounts admin and curator, viewports 1440 and 1280. Created Project `UX-R2-p2 Trail` (id cddb627d-1ec0-4f83-9dca-91da3df58183) through all 4 steps (abandoned after step 1, resumed via "Resume initialization", finished). At the end, created `UX-R2-p2 First Place` and `UX-R2-p2 First POI` (DRAFT) in Empty D following the first-run guide, after capturing Empty D pristine (`shots/emptyD__*-pristine__1440.png`).

## Verdict
The manager path is usable: sign-in, the searchable switcher, the 4-step wizard (abandon, resume, finish) and the first-run guide all work, with keyboard and axe clean. The Populated Dashboard fails the 5-second test: "Ready with 366 warnings" and no way to launch. Three meanings of "active" remain. The "App: Draft" chip regressed to a permanent skeleton after reloads. Errors still echo raw server detail.

## Context check
- 12 §3: Dashboard "answers 'what do I do now'"; one status card, one action; content-less Project gets the five-step guide.
- 14 §4: validation errors announced and summarised with links (Create step 1 verified: focus lands on role=alert summary).
- 03 §1: ACTIVE Resource edited through one Working Copy (editor banner says so with HelpHint; the Dashboard only says "pending changes").
- D-077: guide while nothing is live and there is no Place or POI; "Ready" needs at least one ACTIVE Resource.
- PRODUCT.md: manager = short, infrequent sessions, low training, reads the Dashboard to decide what blocks launch.
- Impeccable: critique.md (two isolated assessments; not possible here); audit.md (keyboard order/traps, clean); operate.md ("standardize loading... states", violated by the chip skeleton).

## Scores (Task 25, Visual 20, Consistency 15, Copy 15, A11y 15, Resp/state 10)
| Screen / state | T | V | C | Co | A | R | Total | Cap |
|---|---|---|---|---|---|---|---|---|
| Sign-in view and silent SSO | 21 | 17 | 13 | 13 | 14 | 8 | 86 | no capping P1 |
| Home / picker | 20 | 16 | 12 | 12 | 14 | 8 | 82 | P1 -01 |
| Header switcher | 19 | 16 | 12 | 12 | 14 | 7 | 80 | P1 -01 |
| Create Project incl. resume | 20 | 16 | 12 | 12 | 14 | 8 | 82 | none above P2 |
| Dashboard, Populated | 19 | 16 | 11 | 10 | 13 | 7 | 76 | P1 -02, -03 |
| Dashboard, drafts only (Empty B) | 20 | 16 | 11 | 11 | 13 | 8 | 79 | P1 -03 |
| First-run guide (Empty D), first Place/POI | 21 | 16 | 12 | 12 | 14 | 8 | 83 | none above P2 |
| Error, session, offline states | 19 | 15 | 12 | 9 | 13 | 8 | 76 | P1 -04 |
Nielsen 0–4: visibility 3, match 2, control 3, consistency 2, error prevention 3, recognition 3, flexibility 3, aesthetic 3, recovery 2, help 2 = 26/40.

## Findings
- **R2-p2-01 P1 — Switcher chip skeleton never resolves.** Evidence: shots dashboard__emptyB-admin__1440, error__project-404__1440, firstrun__add-place-click__1440. In `s5.mjs`, reload 0 showed "App: Draft"; reloads 1 and 2 of the same URL showed only the skeleton at 1, 4 and 8 s while GET /projects/{id} returned 200. Works after in-app switching. Fix: take the chip from the Project detail the layout already loaded; time-box the skeleton; never show it on error pages. Files: ProjectSwitcher.vue, stores/projects.ts, workspace/ProjectLayout.vue. Effort S–M.
- **R2-p2-02 P1 — Populated Dashboard has no next step.** Evidence: dashboard__populated-admin__1440/1280. "Ready with 366 warnings / Nothing blocks the visitor app" with one "Review warnings" button; footer "Visitor app: Draft". Never says the app is not live or that going live is under Launch. Drafts-only state is good. Fix: when nothing blocks, the action is "Go to Launch / Preview then launch", warnings a secondary line, one sentence states the consequence. Files: dashboard/StatusCard.vue. Spec 12 §3. Effort S.
- **R2-p2-03 P1 — ACTIVE has three meanings, unexplained.** Evidence: dashboard__emptyB-admin__1440, dashboard__new-project-after-initialize__1440: green "Active" beside the h1, "Nothing is live yet" in the card, "App: Draft" in the header, "Visitor app: Draft" in the footer. A brand-new Project is labelled Active. 0 HelpHints on Dashboard. Fix: drop the Project "Active" chip from the Dashboard h1, keep only "Visitor app: Draft/Live" with a HelpHint. Files: DashboardView.vue, PageHead.vue, ProjectSwitcher.vue. Effort S.
- **R2-p2-04 P1 — Raw server detail echoed; 403 on save has no cause/action.** Evidence: error__dashboard-readiness-500__1440 (mock detail "boom" shown), editor__save-403__1440 ("The point of interest was not saved • Not allowed for secret-user-123 • Request id…"), Places 403 shows "The places could not be loaded | no". Project-level 403/404/503/500 pages are good. Fix: map by code/status to a fixed sentence plus request id; show detail only for 422 field errors; 403 on write says what to do. Files: platform/api.ts describeError, DashboardView.vue, editor save handlers, list views. BRIEF hard constraint (value never echoed). Effort M.
- **R2-p2-05 P2 — Auth code stays in the address bar.** After sign-in the Home URL keeps `/#state=…&session_state=…&code=…` even after reload (h1.mjs). Fix: history.replaceState after exchange. Files: platform/auth.ts. Effort S.
- **R2-p2-06 P2 — Abandoned Project looks finished on Home.** Evidence: home__after-abandon__1440, home__needs-setup-open__1440, switcher__abandoned-project-search__1440. Absent from "Needs setup (10)"; searching in the switcher moves it to "Needs setup (1)" with Resume. G-029 limit, but the two lists disagree. Fix: resolve setup state for rows or label "Setup not checked". Files: ProjectList.vue, stores/projects.ts. Effort M.
- **R2-p2-07 P2 — Create wizard silent defaults.** Evidence: create__step2-resumed__1280, create__step3__1280. "Trail" arrives with Multi-region network, Aegean Network and Greek default preselected. Template cards say "under one Application" and "Surfaces: WEB, MOBILE, KIOSK" vs "Web, Mobile, Kiosk" on step 3. No HelpHint for "style". Fix: no preselection or one "Recommended"; same surface words; "visitor app". Files: StepTemplate.vue, useCreateProject.ts. Effort S.
- **R2-p2-08 P2 — First-run guide breaks.** Evidence: firstrun__add-place-click__1440, firstrun__dashboard-after-poi__1440. (a) "Add a Place" opens the empty list; a second click on "New place" needed; same for POIs. (b) Once a Place and POI exist (drafts) the guide disappears into "Nothing is live yet" plus a public-address warning; steps 3–5 never reached. (c) POI dialog defaults Place to "Not inside a Place" although one exists. Fix: guide buttons open the create dialog; keep the guide until step 5 or first activation; default to the only Place. Files: FirstRunGuide.vue, DashboardView.vue, create dialogs. Spec 12 §3. Effort S–M.
- **R2-p2-09 P2 — Jargon coverage.** HelpHint counts: Dashboard 0, six lists 0, Preview 0, Overview 0; wizard 4; POI editor 1 (Working Copy). Pending changes: list only a title tooltip. Trigger: explained only in the editor card. Surface: not on Preview. ACTIVE / "App: Draft" / Project "Active": not explained. "Content revision 149", Geo-proximity, Beacon: not explained. Fix: HelpHints on Dashboard chips and "Content revision", the "Pending changes" filter, Preview surface/trigger controls. Files: lib/glossary.ts, StatusCard.vue, ListFilterMenu.vue, PreviewView.vue. Effort S–M.
- **R2-p2-10 P2 — Warnings repeat and have no fix path.** Evidence: dashboard__populated-warning-group-open-admin__1440. Under "Description is not translated (31)" the same line `Place "Acropolis Museum": Italian` appears three times; the single Empty B warning (no public address) sits under "Project" with no action. Fix: de-duplicate or name the field; link project warnings to the setting. Files: platform/readiness.ts, ReadinessGroups.vue. Effort S.
- **R2-p2-11 P2 — Offline banner shifts layout ~50 px.** Evidence: error__offline__1440. Files: OfflineBanner.vue, PageFrame.vue. Effort S.
- **R2-p2-12 P2 — Splash and loading inconsistencies.** sso__silent-admin-t1__1440 vs signin__landing-admin__1440 (solid "U" logo vs gradient logo, alignment); loading__dashboard-slow__1440 (4 s delay: "Loading projects" while the nav is clickable). Fix: one logo asset; nav inert until the Project is confirmed. Effort S.
- **R2-p2-13 P2 — Slug placeholder looks like a value** (create__step1-errors__1440, monospace `cycladic-gallery-guide`). Fix: lighter placeholder or "e.g.". Files: StepName.vue. Effort S.
- **R2-p2-14 P3 — No automatic return to last Project** ("Continue to X" card works; two clicks).
- **R2-p2-15 P3 — Counts: zeros not greyed** (12 §3); no visible link affordance on counts.
- **R2-p2-16 P3 — "Clear filters" twice on the Places list** (toolbar and footer).
- **R2-p2-17 P3 — Switcher chips mean "known", not status** (13 of 15 rows without chip).
- **R2-p2-18 P3 — Session-ended dialog:** Esc does not dismiss it, no secondary action.
- **R2-p2-19 P3 — Dashboard load ~5 s as admin** (1.5–1.9 s curator); status card waits for pending queries.

## Round-1 fixes verified
| C1 | Result | Evidence |
|---|---|---|
| 41 first-run guide | fixed | Empty D and new Project show the five steps; step 1 ticks |
| 42 false Ready | fixed | Empty B/D "Nothing is live yet" + "Activate content" |
| 43 action and status mark | fixed | one button, icon + words (see -02) |
| 44 warnings list | partly | grouped, but 366 lines and duplicates (-10) |
| 45 waiting to apply | fixed | table with Open links |
| 46 counts row | fixed | zeros not greyed (-15) |
| 47 translation bars | not fixed | documented absence (G-023) |
| 48 latest packages | not fixed | documented absence (G-024) |
| 49 error card | partly | request id; raw detail (-04) |
| 50 copy | partly | "Content revision", "web app" remain |
| 51 a11y details | fixed | axe clean on Home, Dashboard, switcher, wizard step 1, Empty D |
| 52 pending count for assets | not verified | |
| 53 searchable picker | fixed | |
| 54 ACTIVE ×3 | partly | three meanings remain (-03) |
| 55 Manage members/Help | partly | Help gone; Manage members absent (no Portal URL) |
| 56 switch with unsaved work | fixed | one dialog |
| 57 switcher keyboard | fixed | |
| 58 OFF capabilities | not verified | |
| 59 Create step 1 errors (P0) | fixed | focus on role=alert summary, links |
| 60 Create structure and copy | partly | silent defaults (-07) |
| 61 chrome nits | partly | chip skeleton regressed (-01); logo mismatch (-12) |
| 62 session expired | fixed | dialog keeps edits; capped loop page |
| 63 error pages | partly | |
| 64 config errors | not verified | |
| 65 403/404 on save | not fixed | raw detail, no cause/action |
| 66 wording and requestId | partly | raw detail remains |
| 67 offline | partly | banner shifts layout (-11) |
| 68 toasts/banners | not verified | |
| 124 vocabulary | partly | no HelpHint on Dashboard/lists/Preview (-09) |
Counts: fixed 11, partly 11, not fixed 3, regressed 0 (one sub-item of C1-61, see -01), not verified 4.

## What works
Sign-in and SSO (2–3 s, "Continue to X" card); switcher search, Current first, Recent, Esc; Create Project stepper, linked error summary, resume, Review with Change links, Initialize lands on the guide; drafts-only Dashboard; error pages; axe clean in 5 states; curator has the same entry points as admin.

## Unverified
Real session expiry; Create Project as curator; config-error page, Manage members, OFF capabilities, toasts; 1024, 768, zoom200, forced colours, reduced motion; Greek Project-name sort.
