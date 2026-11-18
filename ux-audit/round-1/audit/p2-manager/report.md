# p2-manager — Round 1
Persona: Project manager / first-time author. Accounts: `admin` (all jobs), `curator` (comparison). Viewports 1440, 1280, zoom200. Impeccable interview steps skipped (subagent; the brief answers them). Mode: Operate. Axe (wcag2a/aa/21aa) was clean on Home, Create, both Dashboards, empty Places, POI list and the open switcher; all findings below are task/copy/structure problems that axe cannot see.

## Verdict
A manager can sign in and create/initialize a Project without help (the 3-step page is the best screen audited), but cannot answer "what blocks launch and what do I do next": the Dashboard is a one-sentence "Ready for visitors" card plus a 269-line warning dump, and the five-step first-run guide, counts, pending changes and translation bars are all missing (spec `12` §3). The Project picker is a flat list of 37 cards, 29 of them "Not initialized". "ACTIVE" means three different things on screen. First Place and first POI are createable in about 2 minutes, but nothing guides the author from one to the next, and Activate is one unconfirmed click.

## Context check
- `12` §3 Dashboard: "a Project without content shows a five-step guide instead ... the next step is highlighted" (absent in the running app: P0 below).
- `14` §4: errors "associated with their control, announced on submission, and summarized at the top of the form with links to each field".
- `03` §1: an ACTIVE Resource is edited through one working copy; the editor does show "You are editing a working copy" (verified).
- DECISIONS.md D-045: "resume initialization" leads a Project with `initialized` false to step 2 (verified in the picker, the switcher, and a direct `?resume=` link).
- PRODUCT.md: Project manager = "short, infrequent sessions, low training; ... reads the Dashboard to decide what blocks launch".

## Scores (0-100)
Weights: Clarity 25 · Hierarchy 20 · Consistency 15 · Copy 15 · A11y 15 · Responsive/states 10.

| Screen / state | Clarity | Hier | Cons | Copy | A11y | Resp | Total | Cap |
|---|---|---|---|---|---|---|---|---|
| Sign-in view + silent SSO | 21 | 16 | 13 | 12 | 13 | 7 | 82 | P3 only |
| Home / Project picker (37 cards) | 12 | 12 | 11 | 9 | 12 | 5 | 61 | P1 (85) |
| Header switcher popover | 11 | 13 | 11 | 10 | 10 | 5 | 60 | P1 |
| Create Project steps 1-3 + resume | 19 | 17 | 13 | 11 | 11 | 7 | 78 | P1/P2 |
| Dashboard, Populated | 5 | 10 | 8 | 6 | 12 | 6 | 47 | P0 (60) |
| Dashboard, Empty / fresh Project | 3 | 9 | 8 | 5 | 12 | 5 | 42 | P0 |
| Places empty list + New place dialog | 18 | 15 | 12 | 12 | 12 | 7 | 76 | P2 |
| New POI dialog | 20 | 16 | 13 | 13 | 13 | 7 | 82 | P2 |
| Place / POI editor first open (as a first-timer) | 15 | 12 | 12 | 10 | 12 | 6 | 67 | P1 (85) |

Nielsen (group, 0-4): visibility of system status 2 · match with real world 2 (jargon) · user control 3 · consistency 2 · error prevention 2 (Activate unguarded) · recognition not recall 3 · flexibility 2 · aesthetic/minimal 3 · error recovery 3 (503/422/403/409/offline are good) · help and documentation 1. Total 23/40.

## Findings

### R1-p2-manager-01 — P0 — No five-step first-run guide on an empty Project
Screen: Dashboard of `UX Audit – Empty` and of my new `UX-p2-manager Trail` · 1440, 1280 · job 5.
Evidence: `shots/dashboard-empty__1440__1440.png`, `shots/dashboard-new__after-init__1280.png`. Repro: open Empty Project > Dashboard. `DashboardView.vue` contains no guide, no statistics call (network shows only `/readiness` and `/settings`).
Observation: an empty Project shows "Ready for visitors" (green) and four metadata cards. There is no "add a Place, add POIs, compose a Page, build the Navigation, preview" guide, no highlighted next step. I had to guess to open Content > Places.
Why it hurts: the first-time author lands after "Initialize" on a green "Ready" screen with nothing to do; the manager's core first-run job fails.
Recommendation: build the guide as spec'd: numbered steps with the next one highlighted and a single primary button each ("Add your first Place"), steps tick when done (Place count > 0, etc.), hide warnings until content exists. After Initialize, route straight to the guide.
Likely files: `src/views/workspace/DashboardView.vue` (+ statistics client wrapper). Spec: `12` §3 Dashboard, §4 First run. Effort M.

### R1-p2-manager-02 — P0 — The status card cannot tell a manager what blocks launch or what to do next
Screen: Dashboard, Populated + Empty · 1440/1280 · job 4.
Evidence: `shots/dashboard-populated__1st__1440.png`, `shots/dashboard-new__after-init__1280.png`, `shots/launch__peek__1280.png`.
Observation: Both an empty Project and a 269-warning Project say "Ready for visitors / Nothing blocks the application from going live with its active content". "Its active content" is nothing for Empty; Launch (the nav item that would act on "ready") says "Not available yet". There is no action button, no consequence sentence, no next step. The answer to "what blocks launch" is "nothing", which is only true because the check has no content to fail. I could not tell what to do next in either Project.
Why it hurts: false reassurance; the one screen built for the manager's decision gives a wrong answer for empty projects and no direction for populated ones.
Recommendation: status card states one of: "Nothing to show visitors yet" (no ACTIVE content), "N things block launch", "Ready, M suggestions". Always one primary action ("Review 4 blockers", "Add your first Place", "Translate to Italian"). "Ready" must require at least one ACTIVE Place or POI. Say plainly where launching happens (or that it is not available yet).
Likely files: `DashboardView.vue`, readiness mapping. Spec: `12` §3 (status card "names the consequence in one sentence, lists at most three items, offers one action"). Effort M.

### R1-p2-manager-03 — P1 — 269 warnings dumped as one flat list, repeated per field, with language codes
Screen: Dashboard > Warnings (269) · 1440 · job 4. Evidence: `shots/dashboard-populated__warnings-open__1440.png`, `...warnings-full__1440.png`.
Observation: the expanded `<details>` lists every field warning ("Place "Acropolis Museum": Description is not translated. (it)", then Summary, then Visitor information...) 269 times (276 a few minutes later, other agents). "(it)" is a bare language code. Spec says at most three items.
Why: unscannable; page grows by thousands of px; an Italian gap reads as 120 separate problems rather than "Italian is 0 % translated".
Recommendation: group by cause then item: "Italian is missing on 17 items (Translate)"; "Web address not set (QR codes unavailable)". Show top 3 with "See all" opening a dedicated filtered list, language names not codes.
Likely files: DashboardView / readiness presenter. Spec `12` §3. Effort M.

### R1-p2-manager-04 — P1 — Dashboard lacks counts, pending changes, packages, translation bars
Screen: Dashboard, Populated · 1440. Evidence: `dashboard-populated__1st__1440.png` (only Organisation, Slug, Template, Created, Last updated cards).
Observation: with 40+ items the page shows none of: content counts (each opening its list), pending Working Copies with apply/discard, translation bars per language, latest packages. Five metadata cards (slug, template, created, updated) take the space instead; at 1280 they wrap 4+1 with an orphan card (`dashboard-new__after-init__1280.png`).
Recommendation: replace metadata cards with a compact counts row plus pending changes; move slug/template/created to a "Project details" disclosure.
Spec `12` §3. Effort M.

### R1-p2-manager-05 — P1 — "ACTIVE" means three different things
Screen: header switcher chip, Dashboard title chip, Resource editor · 1440/1280. Evidence: `dashboard-new__after-init__1280.png` (ACTIVE chip + toast "The Application starts in DRAFT"), `poi-editor__activate-refusal__1440.png` ("Active: visible to visitors while the application is live").
Observation: a Project initialized seconds ago shows a green "ACTIVE" chip in both header and page title, while the toast says the Application is DRAFT and the Resource copy says "while the application is live". The chip is the Catalogue's Project status, not the app status or the Resource status. Picker cards call the same field "SETUP".
Why: a manager reads ACTIVE as "visitors can see it"; that is false.
Recommendation: show only the Application lifecycle (DRAFT/ACTIVE/ARCHIVED) next to the Project name and label it ("App: DRAFT"); hide the Catalogue status or call it differently ("Registered"). Never show a green ACTIVE on a Project with no ACTIVE content. Use one set of words in picker, header, Dashboard.
Likely files: `ProjectSwitcher.vue`, `AppHeader.vue`, `DashboardView.vue`, `StatusChip.vue`. Spec: `03` §1 lifecycle vocabulary. Effort S-M.

### R1-p2-manager-06 — P1 — Activate is a single unconfirmed click and its feedback contradicts readiness
Screen: POI editor (DRAFT) · 1440 · job 5. Evidence: `poi-editor__first-open__1440.png`, `poi-editor__activate-refusal__1440.png`. Repro: create a POI with only a title, click ACTIVATE.
Observation: no dialog; the POI becomes ACTIVE immediately, toast "The point of interest is complete and visible to visitors", and the side card says "WHAT NEEDS ATTENTION: Nothing: visitors see a complete point of interest" while it has no summary, no image, no coordinates, no Greek. After a reload the same card lists three warnings. Same Activate button is the biggest primary button on a blank Place draft (`place-editor__full__1440.png`).
Why: first-timers will activate empty items; the success copy is wrong; stale readiness erodes trust in the one source of "what is missing".
Recommendation: Activate opens a confirm that lists current readiness (blocking / warnings) and says what visitors will see; success toast must not claim "complete"; recompute readiness after activation; make Activate secondary while blockers/warnings exist.
Likely files: `StatusChangeDialog.vue`, editor status card. Spec: `12` §4 Activate a Resource. Effort S-M.

### R1-p2-manager-07 — P1 — The Project picker does not scale: 37 cards, 29 "Not initialized", no search, no ownership
Screen: Home and header switcher · 1440/1280 · job 2. Evidence: `home__after-signin__1440.png`, `home__full__1440.png`, `switcher__open__1440.png`, `switcher__scrolled-to-ux__1440.png`, `curator__home-2__1280.png`.
Observation: one organisation ("Test Museum") with 37 Projects sorted alphabetically (Greek names last, so `UX Audit …` sits 3 screens down). Every abandoned Project repeats "Not initialized · Resume initialization". Switcher popover shows about 10 rows, no search box, arrow keys do nothing (Tab walks 37 rows), "ACTIVE" and "SETUP" chips are the only differentiators. Cards of identical weight; no "recent" or "yours". Switching works and is fast (about 1.6 s, opaque skeleton, shot `switch__skeleton__1440.png`). Network: the picker fires one `GET /projects/{id}` per Project (37 requests per load, seen in `s4` log) to learn `initialized`.
Why: a manager with short sessions cannot find "their" Project; abandoned test Projects bury live ones.
Recommendation: search field in the popover and on Home; group "Recent", "Ready (ACTIVE)", "Needs setup (resume)"; collapse not-initialized items into one "Needs setup (29)" disclosure; remember the last Project and open it after sign-in (currently sign-in lands on the picker every time). Backend GAP: list should carry `initialized`.
Likely files: `HomeView.vue`, `ProjectSwitcher.vue`. Spec `12` §3 Project picker. Effort M.

### R1-p2-manager-08 — P2 — Create Project: errors and focus
Screen: Create a Project step 1 · 1440/1280 · job 3. Evidence: `create__step1-empty-submit__1440.png`, `create__forced-409__1280.png`, `create__forced-503__1280.png`.
Observation: (a) empty submit shows two field errors incl. a slug rule message while the manager never saw the slug; focus stays on the submit button; no summary with links (spec `14` §4). (b) 409 "Another Project ... already uses this slug" lands on the Slug input the author did not type; no hint how to fix beyond editing it. (c) After every forced error (503, 422, 403) and after step 1 success, `document.activeElement` is `BODY`: keyboard users restart at the top. (d) 422 shows a generic "Check the name and the slug" and ignores the per-field `errors`. (e) Placeholder "Cycladic Gallery Guide" is light grey and reads as a prefilled value; error text is small and pink on grey.
Recommendation: summary alert with links; focus first invalid field (or the alert) on failure and the step-2 heading on success; collapse Slug behind "Edit web address" with a plain-language explanation; label the example as "Example: ...".
Likely files: `src/views/CreateProjectView.vue`. Spec `14` §4. Effort S.

### R1-p2-manager-09 — P2 — Resume initialization and steps 2-3: wording and defaults
Screen: Switcher/Home "resume initialization", `/projects/new?resume=` · 1440/1280 · job 3. Evidence: `resume__switcher-row__1440.png`, `resume__step2-full__1440.png`, `create__step3-full__1440.png`, `resume__direct-deeplink__1280.png`.
Observation: Works as spec'd and I resumed an abandoned Project (closed tab after step 1) with its name kept and Aegean Network preselected; Initialize took 3 s and ended on the Dashboard with a clear toast. But: "Not initialized · Resume initialization" reads as a status line, not a button; "initialization" is IT jargon; step-2 "Continue" turns into a button-looking "STYLE CONFIRMED" that is not obviously a state; default language preselected as Greek with English second and no explanation (the manager must find "Make default"); "Application" is capitalised and never defined; the step 2 style tiles show font names ("Newsreader and Libre Franklin") a manager cannot judge. Step 3 is already visible and active before "Continue" is pressed.
Recommendation: label "Finish setting up" as a real button; call the page "Set up your guide"; show a progress strip "Step 2 of 3" at the top; explain once what the Template decides; make "Style confirmed" a check mark plus "Change".
Likely files: `CreateProjectView.vue`, `HomeView.vue`, `ProjectSwitcher.vue`. Effort S.

### R1-p2-manager-10 — P2 — First Place and first POI: no guided path, jargon at the first decision
Screen: Places empty list, New place dialog, Place and POI editors · 1440 · job 5. Evidence: `places-empty__list__1440.png`, `place-create__empty-submit__1440.png`, `place-create__toplevel-chosen__1440.png`, `place-editor__full__1440.png`, `poi-create__empty-submit__1440.png`, `poi-editor__first-open__1440.png`.
Observation: Places empty state is good (one sentence + button). Dialog step "1 · LEVEL: Top-level place / Sub-place" asks a hierarchy question before the title; "Sub-place" is greyed with no reason (no places yet); the error "Choose whether the place sits inside another one" is plain pink text (the POI dialog uses a warning icon). Buttons read "Create place" vs "Create". Title is labelled "Title · English" with no hint why English (project default is configurable). After creating, the Place editor opens with 7 sections (media, triggers, map, type, slug, internal name...) and a Save that is disabled; the toast "Add its texts, then activate it" disappears; nothing points to "Next: add a Point of Interest". Place "Type" has eight options (Site, Area, Destination, Region, Building, Floor, Room, Other) defaulted silently to "Area" with a single help line. The POI dialog is better: title, Place select, code, slug, inline error with icon; Place list contains the new Place.
Recommendation: default to top-level and move the Level question under "More options"; explain disabled Sub-place ("Needs an existing place"); after create show a 3-line "Next steps" panel in the editor; unify dialog error style and button labels; give each Type a one-line definition.
Likely files: `CreateResourceDialog`/place create dialog, `PlaceEditor`. Effort M.

### R1-p2-manager-11 — P2 — Jargon inventory: what the UI explains and what it does not
Evidence: screens above. Terms:
- Working Copy: explained at the moment it matters (banner "You are editing a working copy. Not saved yet. Visitors see the live version until you apply the changes", Save draft/Discard). Good.
- Surface: explained in step 3 ("Web: Browser app...", "Kiosk: A fixed screen in the venue"). Good. Elsewhere ("WEB, KIOSK" tags on Template tiles) not.
- Trigger: the UI says "How visitors reach it"; good, but "Geo-proximity", "Bluetooth beacon", "AR scan target" are unexplained.
- Readiness: appears as "Ready for visitors" / "What needs attention" / "Warnings"; three names for one thing, no explanation of blocking vs warning on the Dashboard.
- ACTIVE / SETUP / DRAFT: see 05; chips are not explained anywhere (no tooltip, no legend).
- Template: tile has a one-liner; never says it cannot be changed after Initialize.
- Style preset: shown as "Style"; fine, but font names only.
- Slug: explained only inside the editors ("Changing it breaks printed QR codes"); unexplained on Create Project.
- Application: capitalised, undefined.
- "version 0 / version 1" in every editor header, "Exhibit code", "Internal name", "Featured: highlighted in the visitor app's lists": partly explained.
Recommendation: one tiny "What is this?" popover pattern on chips and field labels; a Help page opens from the persistent "Help" link (its target was not checked, see Unverified).
Effort S-M.

### R1-p2-manager-12 — P2 — Zoom 200 leaves about 50 px of content
Screen: any workspace page at `zoom200` (640x360 CSS). Evidence: `shots/dash-pop__zoom200__zoom200.png`.
Observation: logo row, project switcher row and "Menu" row consume about 235 of 360 CSS px; the page head starts below; fixed chrome, no sticky collapse. At 200 % users scroll through chrome first.
Recommendation: merge logo/switcher/menu into one row below 768 px or stop making the header sticky.
Likely files: `AppHeader.vue`, `WorkspaceNav.vue`. Effort S.

### R1-p2-manager-13 — P3 — Smaller items
- Switch skeleton (`switch__skeleton__1440.png`) removes the sidebar and shows 4 cards; the loaded page has the sidebar and 5 cards (layout jump).
- Greeting "Welcome, Platform" (admin) and "Welcome, Demo" (curator) while the avatar says "P. Admin"/"D. Curator".
- Curator Dashboard shows "ORGANISATION: Organisation" (admin: "Test Museum"), `curator__populated-dashboard__1280.png`.
- Two "NEW PLACE" buttons in the empty list (header + centre): acceptable, but both identical.
- Toast "Place created" overlaps the "Used in" card bottom right and disappears in about 6 s; not reachable by keyboard before it goes.
- Switcher popover: ArrowDown does nothing, Esc returns focus correctly (verified), `aria-haspopup` absent while `aria-expanded`/`aria-controls` present.
- Header on Home shows "Select a project / 37 projects"; at 1280 the Home grid shows 4 columns: fine.

## Flows by account
| Flow | admin | curator |
|---|---|---|
| Fresh sign-in via UI, silent SSO | works (`Checking your UNICHE session...` flash, about 1.3 s) | works |
| Picker / switch | 37 Projects | 37 Projects (same) |
| Open "Create Project" page and step 1 | works, org Test Museum | page loads, same org, button visible; step 1 submit not executed (avoid extra test Projects) |
| Resume initialization of an admin-created Project | works | Project visible and openable (it was already initialized), resume of an uninitialized one not exercised |
| Dashboard / Places / POIs | identical | identical except the "Organisation" label |
So no flow is blocked for the curator; "Project creation: admin only" in the brief is not enforced by the UI (the Catalogue decides; 403 copy "Only managers of Test Museum can create Projects" is clear: `create__forced-403__1280.png`).

## What works (keep these)
- Silent SSO landing: "Checking your UNICHE session..." then the picker with no password prompt on the second tab (verified).
- Create Project single page with locked steps 2-3, live style preview, summary line before Initialize, idempotent resume; error cards for 503/422/403/409/offline carry a Request id and keep the form (verified with `page.route`, `setOffline`).
- Working Copy banner and Apply confirmation ("Visitors see the changed ... on their next refresh") are plain and correct.
- Empty Places state explains the kind in one sentence; POI dialog's inline errors with icon and visible labels.
- Surface toggles with one-line explanations; step 3 summary bar.
- Axe clean on every screen I scanned; visible focus ring on inputs; Tab order on Create page is logical (skip link, switcher, Manage members, Help, account, Close, name, slug, submit).
- Offline banner text is honest about what still works.

## Unverified / could not test
- Initialization completed with the curator account; Place/POI creation done only as admin (curator would run the same code path).
- Step-2/3 error paths (`initialize` 422/409) not forced; language add/remove and Template switching not exercised in full.
- Esc/empty/invalid states of the New place dialog were checked only for empty submit; Greek and very long names not tried in the dialogs (Greek names appear in the picker and wrap correctly).
- 1024/768 not requested; `Help` and `Manage members` link targets not opened (they are buttons, not `<a>`, in the DOM, see `s19` log).
- Greek-locale zoom; screen-reader announcements were inferred from `role=alert/status` markup, not heard.
- Records left behind (not deleted by rule): Project `UX-p2-manager Trail` (initialized, Outdoor/Quarry choice not saved; default Multi-region/Aegean), Place `UX-p2-manager Place` (DRAFT) and POI `UX-p2-manager POI` (ACTIVE, with an unsaved working copy typed and abandoned) in `UX Audit – Empty`.
