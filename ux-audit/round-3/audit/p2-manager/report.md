# p2-manager — Round 3

Persona: project manager and first-time author. Account `admin`. Viewports 1440, 1280, 768, zoom200. Screenshots are cited as `shots/<name>`.

## Verdict
The round-2 repairs largely hold. The Dashboard is honest and readable in five seconds. The wizard is clear. The picker offers "Continue to …". The session dialog is dismissible. axe is clean on every wizard step and both Dashboards.

What is left is fine-grained but real:
- The first-run guide ticks two steps for merely visiting a "Not available yet" screen, and only per browser.
- The sign-in code is still in the address bar after a genuine sign-in.
- The wizard stepper misaligns by 10-13 px and loses its digits in forced colours.
- Several jargon terms (Launch, Working/Live, "Setup not checked") are not explained where a first-time author meets them.

Not yet "ship unchanged": one open P1 caps these screens at 85.

Score range 72-88. Counts: P0 0, P1 1, P2 10, P3 12 (R3-p2-17 bundles four nits).

## Context check
- `12-cms-experience.md` §3: "a Project without content shows a five-step guide instead". The guide is judged against it.
- `14` §4: text scales to 200 % without loss of content or function. Wizard and Dashboard at zoom200 show no horizontal scroll (`scrollWidth` 640).
- `03` §1: an ACTIVE Resource is edited through one Working Copy. The "What is a Working Copy?" hint says this (seen on a pending POI).
- DECISIONS D-092: the Dashboard says how the visitor app goes live. Checked: the Populated status card says Launch is not available.
- PRODUCT.md: the Project manager has "short, infrequent sessions, low training". That is the yardstick for every wording finding.
- impeccable, Operate mode (interview steps skipped, I am a subagent):
  - critique.md: "Viewable targets require browser inspection when available". All findings come from the running app.
  - audit.md: "flag a global 0.01ms kill". Not present: the switcher fade is 120 ms under reduced motion and 180 ms normally.
  - polish.md: "Classify each drift: local defect / one-off / conceptual mismatch". Used in each Recommendation.
  - operate.md: "The tool should disappear into the task". The guide ticking and its dead-end step break this.

## Round-2 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C2-07 chip/title race | fixed | Deep link and reload: chip "App: Draft" and tab title "Dashboard · UX Audit – Empty B · iGuide CMS" are correct. |
| C2-08 picker unread rows | partly | Rows are honest ("Setup not checked") but 15 of 17 carry that chip. The group count wobbles "10+" → "9+" → "1+" and "Test Museum (17)" → "(19)". R3-p2-07. |
| C2-09 server text (Dashboard) | fixed | Forced 503 and 403 with `SECRET-DETAIL` bodies gave fixed sentences, request id and Copy; the secret never shows. 403 still offers "Try again" (R3-p2-16). `shots/dashboard-populated__error-503__1440.png`. |
| C2-11 offline | partly | Banner text present ("You are offline. Changes are disabled; …"). Layout shift and aria-disabled were not re-measured. |
| C2-13 error focus/404 | not tested | Outside this walk. |
| C2-14 code in address bar | **not fixed** | A fresh sign-in and "Sign in again" both end on `/#state=…&session_state=…&iss=…&code=…`. Still present 6.7 s later; history length 4. R3-p2-01. |
| C2-15 last Project, dialog, switcher height | fixed | Home shows "Pick up where you left off, Continue to UX Audit – Populated". The session dialog closes on Esc and offers "Stay on this page". The switcher shows 7 rows at 1440x900. |
| C2-16 switcher name | fixed | Dialog name "Switch project"; axe clean. |
| C2-17 user menu keys | not tested | — |
| C2-19 nav "Off" items | fixed | Nav items are one line each. No OFF items exist on these Projects. |
| C2-21 skeletons | partly | "Loading dashboard" status and a route-aware skeleton are present. The head shifts 3 px and the cards 6 px, and the skeleton subtitle shows the literal word "Organisation" (R3-p2-11). |
| C2-22 wizard defaults/copy | partly | Template is not preselected, step 1 says it creates a real record, and there is a style hint. The default language is silently Greek (R3-p2-12), and the disabled Continue reason is only a `title` (R3-p2-05). |
| C2-23 placeholders | fixed | "e.g. Cycladic Gallery Guide", "e.g. cycladic-gallery-guide", "e.g. 37.9715 / 23.7257". |
| C2-24 how the app goes live | fixed | "Visitors still see nothing: the visitor app is in Draft. Going live happens under Launch, which is not available in this version of the CMS yet." Honest. The headline "Ready to go live" sits oddly with it (R3-p2-08). |
| C2-25 "Active" chip | fixed | h1 "Dashboard"; chip "Visitor app: Draft", HelpHint and "Content revision N" on one row. |
| C2-26 guide persistence | partly | Guide persists through 2 DRAFT items, buttons open the create dialog, and the POI Place is preselected. Steps 3 and 5 tick on visit and per browser (R3-p2-02). |
| C2-27 pending list | fixed | Newest first, "Showing 10 of 15", per-kind "See all". |
| C2-28 warnings | fixed | 103 warnings grouped by kind. Groups were not expanded in this walk. |
| C2-29 counts strip | partly | "11 active · 12 draft", grey zeros. Card alignment is off (R3-p2-10). |
| C2-30 blocked card | not tested | No Project with a blocker was available. |
| C2-31 jargon HelpHints | partly | The Dashboard status hint is good. Preview has none (R3-p2-09). |
| C2-32 keyboard run | fixed | Tab run on Empty B: 36 stops, all visible, 2 px focus ring on each. |
| R2-V-02 hint size | not fixed | Every HelpHint button is 32x32 (slug hint 30x32). |

## Scores
| Screen / state | Task 25 | Visual 20 | Consistency 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| Sign-in and silent SSO landing | 21 | 17 | 13 | 13 | 13 | 8 | 85 |
| Home picker and switcher | 19 | 16 | 12 | 10 | 13 | 8 | 78 |
| Create Project step 1 | 22 | 16 | 13 | 12 | 13 | 8 | 84 |
| Create Project steps 2-4 | 21 | 16 | 12 | 12 | 11 | 7 | 79 |
| Dashboard Populated | 22 | 17 | 13 | 12 | 13 | 8 | 85 |
| Dashboard drafts-only / first run | 17 | 16 | 12 | 12 | 13 | 8 | 78 (P1 cap 85 applies) |
| Session-ended dialog | 23 | 17 | 14 | 12 | 14 | 8 | 88 |
| First-run guide steps 1-5 | 15 | 15 | 12 | 11 | 12 | 7 | 72 (P1 cap 85 applies) |

Nielsen 0-4: visibility 3, real-world match 2 (jargon), user control 3, consistency 3, error prevention 3, recognition 3, flexibility 3, minimalism 3, error recovery 3, help 2. Mean 2.8.

## Findings

### R3-p2-01 · P2 · Authorization code and state remain in the address bar after sign-in
- Screen: Home and any deep link after sign-in, 1440.
- Evidence:
  - `s01.mjs`, fresh context with no storage state: the final URL is `http://localhost:5173/#state=…&session_state=…&iss=https%3A%2F%2Fidp…&code=…`. It persists after networkidle plus 1.5 s and at 6.7 s.
  - The navigation trace shows the URL cleaned to `/`, then the fragment set again.
  - The same happens after "Sign in again" (`s19.mjs`, `…/routes#state=…&code=…`).
  - `shots/home__after-signin__1440.png`.
- Observation: `clearCallbackFromAddressBar()` runs, but something rewrites the fragment afterwards, probably the router's first navigation using the location it captured before Keycloak init. P1's acceptance used a saved session ("live code-flow redirect not repeated").
- Why it hurts: a spent code sits in history, bookmarks and shared URLs. BRIEF names auth artefacts as a hard-constraint area. I rate it P2 because the code is single-use with PKCE; escalate if the owner treats it as a constraint breach.
- Recommendation: after `keycloak.init`, do a `router.replace` to the cleaned location, or clean after the router's initial navigation resolves. Add an e2e check that `location.hash === ""` after a real sign-in.
- Files: `src/platform/auth.ts`, `src/router.ts`, `src/main.ts`. Effort S.

### R3-p2-02 · P1 · First-run guide marks steps 3 and 5 "Done" for visiting a screen, only in this browser; step 3 is a dead end
- Screen: Dashboard guide, 1440.
- Evidence:
  - `s12.mjs`, `s13.mjs`: "Open Pages" opens "Not available yet. Pages is part of the iGuide CMS design, but the authoring backend does not offer it yet" (`shots/firstrun-step3__pages__1440.png`).
  - Back on the Dashboard: "Compose a page, Done" and "3 of 5 done" (`shots/dashboard-new__after-step3__1440.png`).
  - A fresh browser context shows "2 of 5 done" for the same Project (`s13b.mjs`).
  - After step 5 the whole guide disappears (`shots/dashboard-new__after-step5__1440.png`).
- Observation: steps 3-5 are ticked from localStorage "visited" flags. Step 3 sends the author to a placeholder. Nothing bridges "Preview done" to "Activate, then Launch".
- Why it hurts: a first-time author is told something is done that cannot be done. Progress vanishes on another device. The guide ends without a next step.
- Recommendation:
  - Tick only steps that data can prove (Place, POI, and Navigation only if its menu has items).
  - Show step 3 as "Not available yet in this CMS" with no button, and count "n of 4" until Pages exists.
  - End the guide with "Next: activate the drafts that are ready" (Show drafts).
- Files: `FirstRunGuide.vue`, `dashboard/guideState.ts`. `12` §3 five-step guide stays; a step-3 wording change is within it. Effort S-M.

### R3-p2-03 · P2 · Wizard stepper circles misalign by 10-13 px when a label wraps
- Screens: Create Project, all steps, at 1280, 768 and zoom200.
- Evidence: circle `y` from `getBoundingClientRect`:
  - 1280: step 1 184.9, step 3 195.4 ("Languages and surfaces" wraps), step 4 184.9.
  - 768: steps 2 and 3 at 195.4, steps 1 and 4 at 184.9.
  - zoom200: 150 / 163.4 / 155 / 150.
  - `shots/wizard-1__pristine__zoom200.png`, `shots/wizard-1__empty-errors__1440.png`.
- Observation: `items-center` centres each circle on its own text block, so circles ride up and down.
- Recommendation: `items-start` with the circle aligned to the first text line. Local defect.
- Files: `views/createProject/Stepper.vue`. Effort S.

### R3-p2-04 · P2 · Forced colours: the current step's number disappears (stepper and guide)
- Evidence: `shots/wizard-2__forced-colors__1440.png` (circle "2" is a blank white disc; steps 3 and 4 get boxes the other steps lack) and `shots/dashboard-emptyb__forced-colors__1440.png` (circle "3" blank).
- Why it hurts: the one number that says where you are is unreadable for forced-colours users.
- Recommendation: in the forced-colours block use `forced-color-adjust: none` with `Canvas`/`CanvasText` on the circle, or a thick border and `ButtonText` digit.
- Files: `Stepper.vue`, `FirstRunGuide.vue`, `src/style.css`. `14` §4. Effort S.

### R3-p2-05 · P2 · Disabled "Continue" explains itself only in a `title`
- Screen: wizard step 2 with no Template chosen, 1440.
- Evidence: `s07.mjs`: the button has `aria-disabled="true"`, `title="Choose a Template first"` and no visible text. Hover shows no custom tooltip. Clicking does nothing visible. `shots/wizard-2__continue-without-template__1440.png`.
- Why it hurts: keyboard and touch users never see a native `title`. A first-time author sees a pale button that does nothing.
- Recommendation: visible helper text beside the button (as the review step already does with `blockedReason`), and on click move focus to the Template group.
- Files: `CreateProjectView.vue`, `ui/button`. Effort S.

### R3-p2-06 · P2 · Slug: long and non-Latin names fail late, with a message that contradicts the hint
- Screen: wizard step 1, 1440.
- Evidence (`s23.mjs`):
  - A 117-character Greek name gives a 119-character auto slug. Submit returns "The Catalogue does not accept this slug. Use lowercase letters, digits and single hyphens." The slug already satisfies that rule; the likely cause is length. A Request id is shown. `shots/wizard-1__greek-long__1440.png`.
  - An Arabic name gives an empty slug, while the error says "type a name and one is made for you". The name field has no `dir="auto"`. `shots/wizard-1__rtl-name__1440.png`.
- Recommendation: cap the generated slug at the Catalogue limit client-side and state the limit in the hint. For non-Latin names say "Type a slug in Latin letters". Set `dir="auto"` on the name field.
- Files: `StepName.vue`, `useCreateProject.ts`. Effort S.

### R3-p2-07 · P2 · Picker: fifteen "Setup not checked" chips and unstable group counts
- Evidence: `shots/home__list__1440.png`, `shots/switcher__open__1440.png`.
  - 15 of 17 rows read "Setup not checked".
  - "Needs setup (10+)" becomes "(9+)" on the next load and "(1+)" in a search.
  - "Test Museum (17)" becomes "(19)".
  - The note "15 projects have not been checked for setup yet" never clears.
- Why it hurts: a manager reads "not checked" as a fault on every row, and "10+" is not a number to act on.
- Recommendation: drop the per-row chip when nothing is known. Show "Checking setup…" once, and settle the count before showing it.
- Files: `ProjectList.vue`, `stores/projects.ts`. Effort S-M.

### R3-p2-08 · P2 · "Ready to go live" over "Launch is not available"; the hint points to Launch
- Evidence:
  - `shots/dashboard-populated__loaded__1440.png`: headline "Ready to go live, with 103 warnings" above "…Going live happens under Launch, which is not available in this version of the CMS yet."
  - HelpHint text: "You change this in Launch." (`s16.mjs`).
  - Launch placeholder subtitle: "Readiness, the Application status, preview links, and Deployment Packages" (`shots/launch__placeholder__1440.png`).
- Why it hurts: the headline promises what the body takes away. The hint and "About Launch" send the author to a placeholder written in jargon.
- Recommendation: while Launch is a placeholder, headline "Content is ready; going live is not available yet"; hint "Going live will happen in Launch (coming)"; plain subtitle on the placeholder.
- Files: `StatusCard.vue`, `lib/glossary.ts`, Launch page meta. Effort S.

### R3-p2-09 · P2 · Preview controls have no HelpHints; "Working / Live" is unexplained
- Evidence: `shots/preview__populated__1440.png`, `s21.mjs`: no hint buttons on the page. Controls: "Content: Working | Live", "Surface", "Fire a trigger", "Choose a trigger…" (one list of about 40 QR, Geo-proximity and beacon options).
- Why it hurts: C2-31 asked for hints on surface and trigger. A first-time author cannot tell what "Working" means or what firing a trigger does.
- Recommendation: a hint beside "Content" ("Working shows drafts and your pending changes; Live shows what visitors have now") and one beside "Fire a trigger" ("Pretends a visitor scanned a QR code or came near a place").
- Files: `PreviewView.vue`, `lib/glossary.ts`. Effort S.

### R3-p2-10 · P3 · Dashboard cards do not share an edge
- Evidence:
  - 1440: guide card spans x 256-1024 (768 wide), status card below spans 256-1036 (780), so right edges differ by 12 px.
  - 1280: guide is still 768 wide while its column is 620 (256-876) and the Content card starts at 896, so the guide overhangs.
  - `shots/dashboard-emptyb__loaded__1280.png`, `shots/dashboard-new__after-poi__1440.png`.
- Recommendation: guide fills its grid column. Local defect.
- Files: `DashboardView.vue`, `FirstRunGuide.vue`. Effort S.

### R3-p2-11 · P3 · Skeleton to content: 3-6 px jump and a placeholder word
- Evidence: Dashboard hard reload with the API delayed 1.2 s. PerformanceObserver layout-shift totals: 0.017 (Populated 1440), 0.034 (Empty B 1440), 0.030 and 0.060 (768). All are under 0.1. The h1 moves y 80 → 83 and the first card top 155 → 161. The skeleton subtitle reads "UX Audit – Populated · Organisation", then "· Test Museum". `shots/dashboard-populated__skeleton__1440.png`, `…__after-skeleton__1440.png`.
- Recommendation: reserve the chip row and the 57 px head in the skeleton, and show a bar instead of the word "Organisation".
- Files: `ProjectLayout.vue`, `DashboardView.vue`. Effort S.

### R3-p2-12 · P2 · The default language is chosen for the author, then demanded in the first dialog
- Evidence: wizard step 3 preselects Ελληνικά as default plus English for a Project named in English (`shots/wizard-3__first-view__1440.png`). The New place dialog then reads "Title · Ελληνικά (required)" (`shots/firstrun-place__dialog-empty-error__1440.png`).
- Why it hurts: a first-time author types an English title and gets "Enter a title in the default language" without knowing why.
- Recommendation: no preselected default (or take it from the browser language). Add one line in the first create dialog: "Titles are written in your default language, Greek. Add the others later."
- Files: `StepLanguages.vue`, `useCreateProject.ts`, create dialogs. Effort S.

### R3-p2-13 · P3 · HelpHint targets are 32 px
- R2-V-02 is still open. Measured 32x32 on Dashboard and wizard (Template, Style, Surfaces, default language), and 30x32 on the slug hint.
- Recommendation: 40 px hit area with an unchanged 16 px icon.
- Files: `ui/help-hint`. Effort S.

### R3-p2-14 · P3 · Status card secondary actions use two styles
- `shots/dashboard-populated__loaded__zoom200.png`: "About Launch" is an underlined link, "Review warnings" is plain bold text.
- Recommendation: both ghost buttons or both links.
- Files: `StatusCard.vue`. Effort S.

### R3-p2-15 · P3 · Guide steps 4 and 5 are 18 px-high links in 52 px rows
- Focus rectangles are 147x18 and 118x18 (`s22.mjs`, stops 24 and 25). The row is not a click target.
- Recommendation: a block link filling the row.
- Files: `FirstRunGuide.vue`. Effort S.

### R3-p2-16 · P3 · 403 on the Dashboard offers "Try again"
- `shots/dashboard-populated__error-403__1440.png`: "Your account cannot do this in this Project. Ask a Project manager to check your membership." with "Try again" as the action.
- Recommendation: "Choose another Project" for 403.
- Files: `DashboardView.vue`. Effort S.

### R3-p2-17 · P3 · Wizard small craft nits
- The info notice is `max-w-xl` (576 px) while the error summary above it is 718 px (`shots/wizard-1__empty-errors__1440.png`).
- Review step: "Change" buttons sit 6 px lower than their row labels (Change y 499, label y 493; `shots/wizard-4__review__1440.png`).
- zoom200:
  - The first field is below the fold.
  - Close sits 14 px lower than the h1.
  - Continue is about 2.6 screens down (footer y 921 on a 360 px viewport).
  - `shots/wizard-1__pristine__zoom200.png`.
- Template copy uses the internal word "Application" ("Several sites under one Application, with shared content"). The Outdoor trail Template lists 9 style presets, including "Gallery House" and "Street Notes" (data).
- Files: `CreateProjectView.vue`, `StepReview.vue`, template data. Effort S.

### R3-p2-18 · P3 · An ACTIVE item's Title hint says "before it can be activated"
- `shots/poi-editor-pending__top__1440.png`.
- Recommendation: "Required in the default language." for ACTIVE items.
- Effort S.

### R3-p2-19 · P3 · Session-ended dialog spacing and claim
- The body-to-divider gap is 11 px against 28 px above the body (`shots/session-ended__dialog__1440.png`). "Your unsaved edits are kept in this browser" shows even when there are none.
- Recommendation: add bottom padding, and show the sentence only when a stored draft exists.
- Files: `SessionEndedDialog.vue`, `AppDialog.vue`. Effort S.

### R3-p2-20 · P3 · Guide ends with no next step
- After step 5 the card disappears and the status card says "Nothing is live yet, Show drafts".
- The Warnings card lists only "Project 1", while the new Place and POI each miss 4-5 texts (visible in their editors).
- Recommendation: a one-visit closing line "All five steps done. Next: activate the drafts that are ready."
- Files: `FirstRunGuide.vue`. Effort S.

## Jargon table (does the UI explain it?)
| Term | Where | Explained? |
|---|---|---|
| Working Copy | ACTIVE POI editor, banner | Yes. HelpHint "What is a Working Copy?" opens a 288 px popover; the trigger button is 32 px. |
| Pending changes / Waiting for you to apply | Dashboard, list filter | Yes, in the sentence "saved changes visitors do not see yet". |
| Trigger | Editors, Preview | Avoided in editors ("How visitors reach it", "Browsing only"). Beacon, Geo-proximity and QR have no hint; Preview "Fire a trigger" has none (R3-p2-09). |
| Surface | Wizard step 3, Template cards, Preview | Wizard yes ("What is a surface?"); Preview no. |
| Readiness | Dashboard, editor | The word is not shown to authors ("What needs attention", "Before you activate"). |
| "Visitor app: Draft", Content revision | Dashboard head | Yes, HelpHint, but it says "You change this in Launch" (R3-p2-08). |
| Style preset | Wizard step 2 | Yes ("What is a style?"). |
| Template | Wizard step 2 | Yes ("What is a Template?"). |
| Slug | Wizard, editors | Yes in the wizard; the editor says "The slug is part of the item's web address." |
| Working / Live (Preview) | Preview | No. |
| Setup not checked, Needs setup (10+) | Home | Partly (R3-p2-07). |
| Application, Deployment Packages, Application status | Template copy, Launch placeholder | No. |

## Job walk
| Job | Result | Time / hesitation |
|---|---|---|
| Sign in from a fresh context | pass (P2 open) | 6.7 s to a usable Home. Silent landing works but the code stays in the URL (R3-p2-01). |
| Return to last Project | pass | "Continue to UX Audit – Populated" is one click on Home. |
| Switch Projects (switcher and Home search) | pass | "Empty B" + ArrowDown + Enter took 5.3 s to the new Dashboard; focus lands on h1. |
| Create Project step 1, abandon, resume, finish | pass | Create in about 1 s. Resume found by Home search "R3-p2" first try. Initialize 0.4 s. Hesitation at step 2 (disabled Continue, R3-p2-05) and step 3 (Greek default). |
| Pristine Dashboard of the new Project | pass | Guide step 1 is obvious; "Add a Place" is the only primary. |
| Guide to first Place and first POI | pass | Dialogs open from the guide and the Place is preselected. |
| Guide steps 3-5 | partial | Pages is a placeholder and the step ticks on visit (R3-p2-02). |
| Dashboard Populated: what blocks launch, what next | pass | Under 5 s. "Ready to go live, with 103 warnings" and "Launch is not available" are both visible; primary is "Preview the app". |
| Dashboard Empty B (drafts only) | pass | "Nothing is live yet … Show drafts" is plain; the guide above competes for attention. |
| Session-ended dialog: dismiss and re-sign-in | pass | Esc closes it and it returns on the next request. "Sign in again" returns to the same page, with the code in the URL again. |

## What works (keep these)
- Honest Launch wording on the Dashboard, and fixed-sentence error cards with a request id. 503 and 403 leaked no server text.
- Wizard:
  - It warns that a real record is created.
  - Step state is shown in words ("Done", "Step 2 of 4").
  - One footer action per step, a resume path, and an error summary with links.
  - axe is clean on all four steps at 1280, 768 and zoom200, with no horizontal scroll.
- "Pick up where you left off" on Home. The switcher named "Switch project" focuses its search first and gives a clear no-match sentence.
- The guide opens create dialogs, preselects the only Place and persists through DRAFT items.
- Focus rings are 2 px on all 36 Dashboard tab stops. Reduced motion keeps a 120 ms fade instead of a kill.

## Unverified / could not test
- User menu keyboard model, "Off" nav items and the Dashboard blocked card. `admin` had no Project with blockers or OFF capabilities.
- Offline layout shift and Ctrl+S under offline (banner text only).
- Back-button behaviour after sign-in (history length 4 recorded, not walked).
- Switcher row focus indication on ArrowDown. It looks like a 2 px top line in `shots/switcher__arrow-focus__1440.png`; not measured.
- Expanded Dashboard warning groups, translation bars, and Greek or RTL text beyond the wizard name field.
- Real Keycloak failure states (identity-provider-down splash length).
