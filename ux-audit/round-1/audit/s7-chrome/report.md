# s7-chrome — Round 1
Role: screen-group specialist (Operate mode). Impeccable interview steps skipped (subagent; the brief answers them). I did not load the impeccable reference files; I applied the BRIEF rubric and ran `impeccable detect` on the group's sources (0 findings). Evidence: `shots/` (83 PNGs), scripts `a*.mjs`/`b*.mjs` in this folder. Created one Project: `UX-s7-chrome Project` (slug `ux-s7-chrome-project`, id `7bb83c0c-d080-4971-84dc-d01cc914a62b`), initialized (Multi-region network, Aegean Network, Greek default + English, 3 surfaces).

## Verdict
The chrome is tidy and mostly accessible (axe clean on Home, workspace, picker, Create step 1; dialogs trap and restore focus), but it fails where users hit friction: Create Project errors are silent for assistive tech, there is no session-expired state at all, the Project picker is an unsearchable 39-row flat list, a Project switch with unsaved work collides with the popover, and a freshly initialized Project lands on "Ready for visitors". Header actions "Manage members" and "Help" do nothing. Error states use three different layouts. Score range 45-82; group mean about 66. Counts: P0 1, P1 5, P2 14, P3 5.

## Context check
- `12` §3 Project picker: a Project with `initializedAt` null shows "resume initialization" instead of open; switching opens the new Dashboard with an opaque skeleton and resets filters (the picker does this; the skeleton is not opaque over the content, see -12).
- `14` §4: validation errors are "associated with their control, announced on submission, and summarized at the top of the form" (Create Project step 1 fails this, see -01).
- `03` §1: lifecycle `DRAFT` -> `ACTIVE` -> `ARCHIVED`; relevant because Project/Application status chips reuse ACTIVE and SETUP words beside it (-11).
- DECISIONS.md D-040: offline banner clears on the next answered request; D-041: a 403 is a manager-only refusal, a 404 under the Project re-checks it; D-062: fixed header and menu, only the page scrolls (drives -13).
- PRODUCT.md: project manager = "short, infrequent sessions, low training"; desktop primary, tablets must stay usable by touch.

## Scores
Rubric columns: Task 25 · Hierarchy 20 · Consistency 15 · Copy 15 · A11y 15 · Responsive/state 10.

| Screen / state | Task | Hier | Cons | Copy | A11y | Resp | Total | Cap |
|---|---|---|---|---|---|---|---|---|
| Sign-in view | 21 | 15 | 12 | 12 | 13 | 8 | 81 | P2 only |
| Silent SSO landing (splash) | 16 | 11 | 9 | 11 | 10 | 5 | 62 | P3 |
| Session expired (no UI; redirect) | 8 | 5 | 6 | 5 | 8 | 3 | 35 | P1 cap 85 |
| Config / audience / IdP error | 15 | 12 | 9 | 8 | 11 | 6 | 61 | P2 |
| 403 access denied | 15 | 11 | 8 | 8 | 11 | 6 | 59 | P2 |
| 404 / soft-deleted Project | 17 | 11 | 8 | 12 | 11 | 6 | 65 | P2 |
| 502/503/504 platform unreachable | 18 | 11 | 9 | 12 | 11 | 6 | 67 | P2 |
| Offline banner | 21 | 14 | 12 | 13 | 12 | 7 | 79 | P3 |
| Header (logo, switcher, Manage members, Help, user menu) | 15 | 13 | 9 | 8 | 9 | 6 | 60 | P1 |
| Left navigation (groups, OFF, active, collapse) | 19 | 14 | 11 | 11 | 10 | 6 | 71 | P2 |
| Project picker popover | 13 | 11 | 9 | 10 | 9 | 5 | 57 | P1 |
| Project switch (unsaved work) | 14 | 8 | 8 | 12 | 8 | 4 | 54 | P1 |
| Toasts | 15 | 12 | 10 | 11 | 8 | 6 | 62 | P2 |
| Dialog / confirm dialog pattern | 21 | 15 | 12 | 13 | 13 | 7 | 81 | P2 only |
| Loading skeletons | 16 | 11 | 10 | 11 | 11 | 5 | 64 | P2 |
| Home | 15 | 12 | 10 | 10 | 11 | 6 | 64 | P1 (-05) |
| Create step 1 (name, slug) | 15 | 12 | 8 | 11 | 5 | 6 | 57 | P0 cap 60 |
| Create step 2 (Template, style) | 18 | 14 | 10 | 11 | 12 | 6 | 71 | P2 |
| Create step 3 + Initialize + landing | 11 | 11 | 8 | 7 | 9 | 5 | 51 | P1 (-02) |

Nielsen (0-4, group): 1 Visibility of status 2 · 2 Match real world 3 · 3 User control 2 · 4 Consistency 2 · 5 Error prevention 2 · 6 Recognition over recall 3 · 7 Flexibility/efficiency 2 · 8 Minimalist design 3 · 9 Error recovery 3 · 10 Help 1. Total 23/40.

## Findings

**R1-s7-chrome-01 · P0 (a11y gate)** — Create Project step 1: validation is neither announced nor summarized, and focus does not move.
Screen: `/projects/new`, empty submit and invalid slug · 1440 (same at all) · Project manager, first Project.
Evidence: `shots/create__step1-empty-submit__1440.png`, `create__step1-invalid-slug__1440.png`, `create__step1-409__1440.png`. Steps: open `/projects/new`, click "Create Project" with an empty name. Playwright: `[role=alert]` count 0, `document.activeElement` stays the submit button. Source `CreateProjectView.vue` renders `<span id="project-name-error">` with no role/aria-live; no summary. (Step 3's "Check languages and surfaces" box does have role=alert, so the page is internally inconsistent.)
Observation: errors appear in red text under fields only. Fields get `aria-invalid`/describedby, but nothing is announced and focus is not placed on the first invalid field. The New POI dialog moves focus to the first invalid field and shows a warning glyph; this page does neither.
Why it hurts: a screen-reader or keyboard user presses the button and hears nothing; sighted users with zoom may not see the error below the fold. Fails `14` §4 (announced, summarized with links).
Recommendation: one shared form-error pattern: summary box (`role=alert`, h2 "Fix 2 things", links to fields) at the top of the card, focus to the summary or first invalid field, same glyph + colour + text on every form (dialogs included). Build it once as `FormErrorSummary`.
Files: `src/views/CreateProjectView.vue`, dialogs in `src/components/*Dialog*.vue`. Spec: `14` §4, BRIEF §2 (WCAG gate). Effort S-M.

**R1-s7-chrome-02 · P1** — A freshly initialized Project lands on "Ready for visitors" with status ACTIVE and no five-step first-run guide.
Screen: Dashboard right after Initialize · 1440 · Project manager.
Evidence: `shots/create__first-run-dashboard__1440.png`. Steps: Create + Initialize `UX-s7-chrome Project`; wait 10 s.
Observation: title "Ready for visitors", "Nothing blocks the application from going live with its active content. 1 warning does not block, but deserve a look.", chip ACTIVE. Step 3 had promised "the Application starts in DRAFT". `12` §3 requires a five-step guide for a Project without content. Grammar: "1 warning ... deserve".
Why it hurts: the one moment a new author needs direction says everything is done; contradicts the copy of the step before. (Dashboard is another agent's screen; reported here because it is the end of my flow.)
Recommendation: empty Project -> first-run guide; status copy must not claim readiness with zero content; fix plural; make the chip reflect the Application status wording consistently.
Files: `src/views/workspace/DashboardView.vue`, `CreateProjectView.vue` (copy). Spec: `12` §3 Dashboard. Effort M.

**R1-s7-chrome-03 · P1** — There is no session-expired state; expiry is a silent full-page redirect, and a persistently failing 401 loops.
Screen: any workspace route · 1440 · all personas.
Evidence: `shots/session-expired__after-401__1440.png`, `shots/sso-landing__checking__1440.png`. Steps: intercept `GET /projects/*/places` with 401, click "Places": the page navigated 7 times in 8 s (`/places` <-> `#state=...&code=...`), ending on the "Checking your UNICHE session..." splash. Source `auth.ts sessionExpired()` calls `login()` and never resolves.
Observation: author sees white flash, splash, then back; no "Your session ended" message, no explanation, no confirmation that unsaved work is kept (spec keeps form state in browser storage). If the IdP session is gone, the author lands on a Keycloak form with no context.
Why it hurts: loss of trust at the worst time (mid-edit); developer/ops cannot tell a loop from a slow load.
Recommendation: before redirecting, show a blocking dialog "Your UNICHE session ended. Sign in again; your unsaved changes stay in this browser." with a "Sign in" button; cap automatic redirects (one per minute) and show the session error view after that. Add a visible state for "Restored after sign-in".
Files: `src/platform/auth.ts`, `src/platform/api.ts`, new dialog in `App.vue`. Spec: `12` §6 (states). Effort M.

**R1-s7-chrome-04 · P1** — Switching Project with unsaved changes: the Project popover stays open on top of the confirm dialog.
Screen: PoI editor with a typed edit, picker, choose another Project · 1440 · Content editor.
Evidence: `shots/project-switch__with-unsaved__1440.png`. Steps: open any POI editor, type in the title field, open the switcher, click `UX Audit – Empty B`.
Observation: "Leave without saving?" appears but the popover (z-80) is painted over the dialog's left part, cutting its title ("ut saving?") and body; two overlays at once, focus placement unclear.
Why it hurts: the one safety dialog is half hidden at exactly the moment it matters.
Recommendation: close the popover before asking, or raise the dialog above all popovers; put dialogs on a single z-index scale and trap focus. If the user cancels, reopen nothing.
Files: `src/components/ProjectSwitcher.vue`, `AppDialog.vue`, router guard. Spec: `12` §6 (unsaved work). Effort S.

**R1-s7-chrome-05 · P1** — The Project picker and Home are unsearchable flat lists of 39 Projects, 31 of them "Setup".
Screen: picker popover and Home · 1440/768/zoom200 · Project manager with many Projects.
Evidence: `shots/picker__open-in-project__1440.png`, `home__list__1440.png`, `home__list__768.png`, `picker__open__zoom200.png`. Steps: open the picker, count `li` = 38; type "Pop": nothing happens.
Observation: one alphabetical list (case-insensitive mix: "athina" between "A Day..." and "Example"), no search, no "recent", no grouping by status; the current Project is not scrolled into view (the 70vh list starts at "123"); the real Projects (`UX Audit – Populated`, Empty B) are rows 33-36. At zoom200 only 3 rows are visible. Home repeats the same list as 39 cards (3 screens of scrolling).
Why it hurts: scan-ability is the point of a picker; with 40+ Projects a daily user scrolls every time. Spec calls out "search/scan-ability" for 37+ Projects.
Recommendation: search field at top (autofocus, filters name/slug/org), "Recent" (last 3 opened) and "Current" pinned first, "Needs setup (31)" collapsed group with count, keyboard arrow navigation; Home becomes a table/list with search and the same grouping.
Files: `src/components/ProjectSwitcher.vue`, `src/views/HomeView.vue`, `src/stores/projects.ts`. Spec: `12` §3 picker. Effort M.

**R1-s7-chrome-06 · P1** — "Manage members" and "Help" are dead buttons.
Screen: header, all signed-in screens · 1440 · all.
Evidence: `shots/header__after-help-click__1440.png`; steps: click both: no navigation, no dialog, no toast, no new tab (`pages` stays 1). Source `AppHeader.vue`: `function openManageMembers() {}` / `openHelp() {}`.
Observation: two always-visible controls, styled as links, do nothing; they sit before the user menu in tab order and are also duplicated in the user menu below 768 px.
Why it hurts: broken promises in the primary chrome; "Manage members ↗" implies an external destination.
Recommendation: wire to the Catalogue/Portal URL (`portalUrl`) in a new tab or remove until they exist; Help -> a short panel (shortcuts, status vocabulary, contact). Never ship inert buttons.
Files: `src/components/AppHeader.vue`. Spec: `12` §3 (membership is Catalogue-owned). Effort S.

**R1-s7-chrome-07 · P2** — Project error pages (403/404/5xx) are left-aligned unbounded cards under a stale header, with a different layout from the centered session errors.
Screen: `/projects/:id` with forced 403/404/502/503/504/500 · 1440, 768, zoom200 · all.
Evidence: `shots/project-error__403__1440.png`, `project-error__404__1440.png`, `project-error__404__768.png`, `project-error__404__zoom200.png`, `session-error__no-audience__1440.png`.
Observation: (a) header still shows the unavailable Project as current with an ACTIVE chip; (b) 404 text says "It has been removed from your list of projects" yet the picker still lists it until a reload; (c) 403 copy: "The UNICHE Catalogue refused this. Only organization managers may do it" - "it" is undefined for someone who just tried to open a Project; (d) the error is not a heading/landmark structure: a `strong` inside `role=alert` and no `h1`; (e) the document title stays "iGuide CMS" on every page and state (verified via `page.title()` on all six forced states) - WCAG 2.4.2; (f) session errors are centered at 520 px, project errors top-left at 640 px, Home errors top-left; (g) 5xx offers "Try again" and "All projects" but 404/403 offer only "All projects".
Why it hurts: three layouts for one concept; manager hits the 403 and cannot tell what to do.
Recommendation: one `StateCard` component (icon, h1, cause, next step, request id, primary + secondary action) used for session, project, home and section errors; clear the current-project chip on error; per-state `document.title`; rewrite 403: "You cannot open this Project. Ask a manager of <Organisation> to add you." 
Files: `ProjectLayout.vue`, `SessionErrorView.vue`, `HomeView.vue`, `src/router.ts` (titles). Effort M.

**R1-s7-chrome-08 · P2** — Configuration/sign-in errors speak to operators, not authors, and "Try again" cannot fix them.
Screen: SessionErrorView (IdP unreachable, token without audience) · 1440/768/zoom200 · author.
Evidence: `shots/session-error__idp-unreachable__1440.png`, `session-error__no-audience__1440.png`. Forced via `page.route("**/config.js")` (IdP URL to a closed port; AUDIENCE to a wrong value). A missing-env "not configured" error was not forceable in dev because `VITE_*` fills the gaps (source read only).
Observation: text names Keycloak clients, mappers, `public/config.js`. Only action "Try again" = full page reload; no request/reference id, no contact, no "Sign out" (relevant for the audience case, where the session is valid but unusable).
Recommendation: two-level copy: plain sentence for authors ("Your account is signed in, but iGuide cannot use it yet. Tell your UNICHE administrator.") plus an expandable "Details for administrators" with the technical text, a Copy button, and "Sign out" for the audience error.
Files: `SessionErrorView.vue`, `platform/auth.ts`. Effort S.

**R1-s7-chrome-09 · P2** — "OFF" capability is shown only as a tiny grey pill; the reason lives in a hover tooltip and the opened page is silent.
Screen: nav + Routes page with ROUTES forced off (route interception of `/settings`) · 1440 · Content editor.
Evidence: `shots/nav__off-chips__1440.png`, `nav__off-item-opened__1440.png`. 
Observation: pill is `aria-hidden`; reason in `title` only (invisible on touch and keyboard); the screen reader string is "Routes off, off. Routes: disabled in App settings → Features" (duplicated "off"); the Routes page itself shows no banner that visitors will not see Routes, so the greyed-with-reason rule (`12` §3) is only half met. Pill is neutral grey, not distinguishable from a count badge pattern.
Recommendation: on the page head show an info bar "Routes are off for visitors: disabled in App settings -> Features. [Open Features]"; in the nav keep the pill but add visible secondary line on hover/focus; fix SR text.
Files: `WorkspaceNav.vue`, `PageHead.vue`. Spec: `12` §3 rule. Effort S.

**R1-s7-chrome-10 · P2** — Menus and popovers have no keyboard model and lose focus on Escape.
Screen: user menu, picker · 1440 · keyboard users.
Evidence: script `a9.mjs` / `a1.mjs` logs: opening the user menu keeps focus on the trigger (`role=menu` but ArrowDown does nothing; Tab moves to "Sign out"); Esc leaves `document.activeElement` = `body` (focus lost to the top of the page); same for the picker (Esc -> body). Picker lacks `aria-haspopup`; the list has no accessible name. `shots/header__user-menu__1440.png`.
Recommendation: either make them real menus (roving focus, arrows, Esc returns focus to the trigger) or plain disclosures (`role` removed; first item focused on open; Esc returns focus).
Files: `AppHeader.vue`, `ProjectSwitcher.vue`. Spec: `14` §4 (CMS chrome operable). Effort S.

**R1-s7-chrome-11 · P2** — Chip and button variants are inconsistent across the group.
Evidence: `shots/picker__open-in-project__1440.png` (picker chip: dot, 8-9 px, "SETUP"), `workspace__dashboard__1440.png` (page chip: ✓ glyph, 10 px, "ACTIVE"), `nav__off-chips__1440.png` (OFF pill), `home__list__1440.png`, `dialog__new-poi-empty-submit__1440.png`.
Observation: four chip shapes (dot / glyph / none / pill) and sizes 8, 9, 10 px; status text-and-icon rule is met only by `StatusChip`, the header and picker chips use a dot. Primary actions: "NEW POINT OF INTEREST" is a pink-to-teal gradient pill, "CREATE PROJECT" a solid purple pill, dialog "Create" a solid purple pill with different padding, "+ Create Project" in the picker a text link. "Manage members" is purple, "Help" grey. "Resume initialization" is lowercase in the picker and capitalized on Home. Project-level ACTIVE/SETUP (Application status) shares vocabulary with Resource lifecycle ACTIVE, which can mislead.
Recommendation: one `StatusChip` (glyph + text, min 11 px) used by header, picker, Home; label Project states "Live / Draft / Needs setup"; one primary button style; one casing rule for actions.
Files: `StatusChip.vue`, `ProjectSwitcher.vue`, `HomeView.vue`, `lib/format.ts`. Effort M.

**R1-s7-chrome-12 · P2** — Loading: the workspace skeleton has no navigation, so the page jumps; the header says "Loading projects..." while the Project itself is loading.
Evidence: `shots/project-loading__skeleton__1440.png`, `workspace__pois-list__1440.png` (blank page with "Select a project / Loading projects..." for 13 s on a cold dev load; likely dev-server compile only, not verified for production). Compare `workspace__poi-editor__1440.png`, where nav is present.
Observation: the skeleton replaces only `<main>`; nav appears after the Project resolves, shifting the main column 236 px; the spec's "opaque loading skeleton over the content area" is only partially met (translucent cards). `aria-busy` region fine.
Recommendation: render the nav as soon as the route has a `projectId` (items are static); make the skeleton match the target page head; header subtitle "Opening <name>..." from the URL.
Files: `ProjectLayout.vue`, `ProjectSwitcher.vue`. Effort S.

**R1-s7-chrome-13 · P2** — Header consumes too much height at 768 and zoom200 and the logo is not a link.
Evidence: `shots/picker__open__768.png` (header 118 px: avatar on a second row with empty space), `workspace__dashboard__zoom200.png`, `nav__disclosure-open__zoom200.png`: header 118 px + "Menu" bar 38 px = 156 of 360 px (43 %) are fixed; with the menu open 4 nav items are visible. The logo `<img>` is hot-linked from `uniche-eccch.eu` (blocked/offline = empty header, alt "UNICHE") and is not a link to Home. Picker at zoom200 shows 3 Projects.
Recommendation: at <= 768 put logo + user on one row, switcher as icon+name on the same row, drop the separate Menu bar into the header; bundle the logo locally and link it to Home.
Files: `AppHeader.vue`, `WorkspaceNav.vue`. Spec: `14` §4 200 % scaling. Effort M.

**R1-s7-chrome-14 · P2** — Toasts: one at a time, 6 s, no pause, and they cover content.
Evidence: `shots/create__step2-detail__1440.png` (toast over the style preview), `create__toast-project-created__1440.png`.
Observation: auto-dismiss at 6 s regardless of hover/focus (WCAG 2.2.1 timing, and error toasts vanish); a second toast replaces the first; dismiss is a "✕" text glyph; the toast holds the key instruction "If you leave now, the picker offers to resume initialization" which is gone in 6 s.
Recommendation: pause on hover/focus, errors persist until dismissed, queue up to 3, move durable instructions into the page (an inline "Project created" note in step 1).
Files: `AppToast.vue`, `stores/toast.ts`. Effort S.

**R1-s7-chrome-15 · P2** — Create Project: structure and feedback weaknesses in steps 2-3.
Evidence: `create__step1-initial__1440.png`, `create__step2-resumed__1440.png`, `create__step3-open__1440.png`, `create__step3-no-languages__1440.png`, `create__step3-init-zero-langs__1440.png`.
Observations: (a) the header says "Select a project" on the creation page (no context); (b) locked step 2 shows a pre-selected template card greyed, which reads as chosen before step 1; (c) "Continue" turns into an outlined "Style confirmed" button and the page scrolls with focus left on it; (d) the step 3 "summary" is one grey line with raw tokens ("no language · default — · Web, Mobile, Kiosk") and is not a review of choices; (e) Initialize stays enabled with zero languages and the error appears above the fold (role=alert present, focus stays on the button); (f) the card's own organisation line is plain text while labelled as a field; (g) after Initialize the author is dropped on the Dashboard with no "Initialized" confirmation and (see -02) wrong status; (h) "Close" has no explanation of what happens to a created-but-uninitialized Project (not tested).
Recommendation: real stepper (1 Name, 2 Style, 3 Languages and surfaces, 4 Review) with a sticky footer "Back / Continue / Initialize", a summary list with edit links, Initialize disabled with reason, confirmation page "UX-s7-chrome Project is ready: next, add your first Place".
Files: `CreateProjectView.vue` (829 lines; split into step components). Spec: `12` §4. Effort L.

**R1-s7-chrome-16 · P2** — Type scale in chrome is too small and too varied.
Evidence: computed font sizes on `/projects/new`: 8 px x1, 9 px x3, 10 px x12, 11 px x30; picker chip 8 px, nav group labels 9 px, subtitle 10 px, org headings 9 px (`picker__open-in-project__1440.png`, `home__list__1440.png`). Contrast passes axe, but 8-10 px uppercase tracked text is hard to read and wraps at 200 %.
Recommendation: floor of 12 px for anything readable, 11 px only for uppercase labels with weight >= 700; fewer sizes (12/13/14/16/24).
Files: `ProjectSwitcher.vue`, `WorkspaceNav.vue`, `HomeView.vue`. Effort S.

**R1-s7-chrome-17 · P2** — Home adds little over the picker.
Evidence: `home__list__1440.png`. "Welcome, Demo" (first token of `displayName`), no recent/last opened, no counts, same long list, "Create Project" top right. A returning editor needs "continue where I was".
Recommendation: Home = "Continue" (last 3 Projects with last-edited), "Needs setup" and "All Projects" with search; or redirect straight to the last Project.
Files: `HomeView.vue`. Effort M.

**R1-s7-chrome-18 · P2** — Offline banner works but shifts layout and does not announce recovery.
Evidence: `shots/offline__banner__1440.png` (banner 49 px pushes header-nav-main down), `__1024/768/zoom200` variants. Steps: `context.setOffline(true)`, click "Places": banner appears (role=alert, good copy); `setOffline(false)`: it clears silently.
Recommendation: announce "Back online" via the toast live region; reserve the banner as an overlay under the header so the nav does not move; disable "Check again" feedback is fine.
Files: `OfflineBanner.vue`. Effort S.

**R1-s7-chrome-19 · P3** — Nav: no counts, no icons, Media nested under Content.
Evidence: `workspace__dashboard__1440.png`. The audit brief expects counts; spec nav lists Media as a top-level item, here it sits inside "Content" between Categories and Maps. Group labels are 9 px.
Recommendation: show counts for the six content kinds (and pending dot), match spec grouping. Files: `sections.ts`, `WorkspaceNav.vue`.

**R1-s7-chrome-20 · P3** — SSO splash is a bare static page.
Evidence: `shots/session-expired__after-401__1440.png` (8 px body margin visible as a white frame, header strip without logo, "Checking your UNICHE session..." in 13 px). No timeout message before the IdP error appears (the check-sso timeout is several seconds).
Recommendation: splash with logo, spinner and, after 5 s, "Still checking... Sign in manually" link. Files: `index.html`.

**R1-s7-chrome-21 · P3** — Sign-in view is plain and offers no help.
Evidence: `shots/signin__default__1440.png`, `__1024/768/zoom200`. "iGUIDE CMS" appears three times (header, eyebrow, "iGuide uses..."); no link for "I have no UNICHE account" or contact; the card floats at mid-page. Button states "Opening UNICHE sign-in..." (source only; I could not capture it reliably). Keyboard: skip link, then the button; Enter works.
Recommendation: add "No account? Ask your organization manager or visit the UNICHE Platform Portal"; drop the duplicated brand line.
Files: `SignInView.vue`.

**R1-s7-chrome-22 · P3** — Skip link target and landmarks.
`href="#"` skip link moves focus via script (works), but the header has no `aria-label`ed landmark text beyond `<header>`, the OfflineBanner is not in a landmark and the Create Project page `<main>` has no skip anchor to step 1. Evidence: tab order log `a9.mjs` (Skip, switcher, Manage members, Help, user, nav...).

**R1-s7-chrome-23 · P3** — Dashboard grammar and wording: "1 warning does not block, but deserve a look" (`create__first-run-dashboard__1440.png`); "organization/organisation" mixed (403 copy says organization, UI says Organisation).
Files: `DashboardView.vue`, `ProjectLayout.vue`.

**R1-s7-chrome-24 · P3** — Greek strings: project names in Greek (`Δοκιμή Πίστας`, `αε φ`) render and sort fine in the picker, but picker sorts them after Latin names regardless of locale and `αεφ` sits at the bottom among test data; no issue otherwise (`picker__open-in-project__1440.png`). Nit only.

## What works (keep these)
- Dialog pattern: focus enters the first field, Tab is trapped, Esc and backdrop close, focus returns to the opening button, `aria-modal` + labelled title (`b2.mjs` logs, `dialog__new-poi-open__*`).
- The unsaved-work confirm exists and uses a plain, safe-first wording ("Keep editing" / "Leave without saving"); only its stacking is wrong (-04).
- All forced platform failures render a message with request id and never echo the rejected value; 502/503/504 share one calm message "Nothing has changed" (`project-error__502..504__1440.png`).
- Offline banner copy ("Your unsaved changes stay in the form") and automatic clearing.
- axe-core: no violations on Home, workspace chrome, open picker, Create step 1 (1440).
- No horizontal scroll at 1280, 1024, 768 and zoom200 on the screens checked.
- Slug auto-derivation and 409 slug-conflict message on Create step 1 are clear and specific (`create__step1-409__1440.png`).
- Active nav item (left bar + tint + `aria-current`) is unambiguous.

## Unverified / could not test
- "Not configured" session error (missing `IDP_URL` etc.): dev `.env.local` supplies values, so it was source-read only.
- A real expired Keycloak session: only simulated through a 401 intercept (the IdP login page itself is outside the CMS).
- Sign-in button "Opening UNICHE sign-in..." state: capture was blank during the redirect.
- SectionTabs and PageHead were audited from source and as seen on the POI/Routes pages, not as dedicated tabs screens (Maps/App settings belong to other agents).
- Create step 2/3 failure states (templates 5xx, Initialize 5xx): the client-side language check ran first, so a forced `/initialize` 503 never fired; `create__step3-init-503__1440.png` therefore shows the language error, not the 503.
- Keyboard focus ring visibility on every nav row and picker row was observed only on the user menu button; no tablet touch run.
- Cold load of 13 s on `/projects/:id/pois` was seen once with other agents active; treated as dev-server noise.
- Create step "Close" behaviour for a created-but-uninitialized Project; picker "resume initialization" click-through to step 2 (resume URL was used directly and works: `create__step2-resumed__1440.png`).
