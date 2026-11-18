# s8-dashboard — Round 3

## Verdict
The Dashboard is structurally sound. Pending, warnings and counts reconcile (16 = 13 + 1 + 2), and axe is clean. Two correctness problems remain. A SUSPENDED or unreadable app status is headlined "Live", and the keyboard order jumps back and forth below 1100 px. The first-run guide and the status card still contradict themselves around Launch.

Mode: Operate. Interview steps skipped because I am a subagent.

## Context check
- `12` §3: the Dashboard answers "what do I do now", with one action on the status card and zero counts greyed.
- `14` §4: state is shown by text and icon, not colour alone.
- `03` §1: the lifecycle is DRAFT, ACTIVE, ARCHIVED, and nothing is visible before Apply.
- D-092: the guide's steps 3 and 5 tick from this viewer's visits.
- PRODUCT.md: authors want to know what is blocking and what to do next.

Impeccable rules cited (read from the skill reference, not re-quoted):
- critique: judge hierarchy by what the eye lands on in five seconds.
- audit: check focus order against visual order.
- polish: unify spacing and padding tokens across sibling cards.
- operate: never state a status you did not read.

## Scores
Weights: task 25, hierarchy 20, consistency 15, copy 15, accessibility 15, responsiveness 10.

| Screen / state | Task | Hier | Cons | Copy | A11y | Resp | Total | Cap |
|---|---|---|---|---|---|---|---|---|
| Populated (Ready, warnings) | 21 | 16 | 11 | 11 | 11 | 8 | 78 | P1 |
| First run / drafts-only (guide + card) | 19 | 15 | 11 | 11 | 10 | 8 | 74 | P1 |
| Blocked | 20 | 16 | 11 | 10 | 12 | 8 | 77 | P1 |
| Loading | 21 | 16 | 12 | 13 | 13 | 7 | 82 | none |
| Error (403/503/404/422) | 20 | 16 | 13 | 11 | 13 | 9 | 82 | none |

Range: 74–82. No screen reaches 90.

Nielsen heuristics (0–4):
- Visibility of status: 2. SUSPENDED reads "Live".
- Match with real world: 3.
- User control: 3. The guide cannot be restored once dismissed.
- Consistency: 2.
- Error prevention: 3.
- Recognition: 3.
- Flexibility: 3.
- Minimalist design: 3.
- Error recovery: 3.
- Help: 3.
- Total: 28/40.

## Round-2 fixes verified
| ID | Result | Evidence |
|---|---|---|
| C2-24 | partly | Preview is the primary action and the sentence names Launch (`StatusCard` Populated). The headline "Ready to go live" sits above "Launch is not available yet". |
| C2-25 | partly | The chip left the h1 and the line reads "Visitor app: Draft · Content revision 213". It still sits one row below the h1. The header switcher says "App: Draft" while the page says "Visitor app: Draft". |
| C2-26 | partly | The guide persists and its buttons open `?create=1`. Verified that `/places?create=1` opens "New place". Steps 3 and 5 tick only from a visit in this browser (localStorage `iguide.dashboard-guide.<id>` = `{"visited":["pages"]}`). Step 3 leads to the "Not available yet" placeholder. There is no way back after Dismiss. |
| C2-27 | fixed | The newest pending item is row 1. "Showing 10 of 16" matches See all 13 + 1 + 2. Links go to `?pending=1`. |
| C2-28 | fixed | One row per item (104 rows, was 400+). Fields are named ("Italian: Accessibility information, Description, …"). Groups are collapsed. Show more works. |
| C2-29 | partly | "11 active · 13 draft" and grey zeros are done. Below 1100 px the counts card is above the pending table, but it is 525 px tall (R3-s8-07). The guide is 768 px wide and its edge matches no column. |
| C2-30 | partly | "and N more" is now a link-style button. The blocked sentence still says "fixed in the live content". Verified that PROJECT issues link to `/surfaces`. NAVIGATION (the new type): not exercised. |
| C2-31 | partly | The chip has a HelpHint. Its text says "You change this in Launch", which is not possible yet. |
| C2-32 | partly | Pending is no longer capped at 5. With settings 409 or 503 the line "The visitor app status could not be read." shows. In-app offline Try again gives "Check your connection…". |
| C2-73 | fixed | The skeleton appears in one round of requests. |
| R2-V-02/03/04/07 | not in remit | Not tested. |

## Findings

### R3-s8-01 · P1 · A SUSPENDED or unreadable app status is headlined "Live"
- Screen: Dashboard Status card, 1440. Reproduced with `page.route` on `/settings`.
- Evidence: `shots/dashboard__app-suspended__1440.png`. The status line says "Visitor app: Suspended" while the card says "Live, with 104 warnings … Nothing blocks the visitor app". With settings 409 or 503 (`dashboard__err-503-settings__1440.png`) the line says "could not be read" and the card still says "Live, with 104 warnings". Only the DRAFT and LIVE branches are tested by name in `StatusCard.vue` (`headline`, `sentence`).
- Why it hurts: a false statement about what visitors can open.
- Recommendation: add explicit branches.
  - SUSPENDED: headline "Visitors cannot open the app: it is suspended". The Dashboard has no data for who suspended it or how to resume, so drop the warnings framing from the headline.
  - Null status: "Status unknown", and move the warnings to a neutral "N warnings". Never use "Live" unless `applicationStatus === "LIVE"`.
- Likely files: `StatusCard.vue` (`headline`, `sentence`). Effort: S.

### R3-s8-02 · P1 · Focus order does not match visual order below 1100 px
- Screen: Dashboard Populated, 1024. Probe `a7.mjs`.
- Evidence: Tab stops by y position run Review warnings (291), Pending rows (1034–1376), Warnings groups (1514–1861), and only then Counts (420–844), then Project details (1935). Visually, Counts is second, under the status card. The order comes from CSS `order-2` against DOM order in `DashboardView.vue`. At 1440 the order is column-wise and fine.
- Why it hurts: a keyboard user jumps down 700 px, then back up (WCAG 2.4.3).
- Recommendation: render the counts block in DOM order second in the single-column layout. For example, use a grid with named areas instead of `contents` plus `order`. Or move the counts card to the DOM position after the status card and place it in the right column with `nav:col-start-2 nav:row-span-2`.
- Likely files: `DashboardView.vue`. Effort: S.

### R3-s8-03 · P2 · Guide steps 3 and 5 tick from a browser visit, and step 3 is a dead end
- Screen: first run / drafts-only, all widths. `shots/guide__step3-destination__1440.png`, `guide__step3-ticked__1440.png`.
- Observation: "Open Pages" leads to "Not available yet … the authoring backend does not offer it yet". It then reads "Done" on return. A colleague on another browser sees 2 of 5 for the same Project.
- Why it hurts: "Done" is a claim the CMS cannot back, and the next step promises something that does not exist.
- Recommendation: while Pages is a placeholder, mark step 3 as "Not available yet" in grey with no link and no tick. Count "N of 4". Do not tick 3 or 5 from a visit; tick step 5 only when Preview was opened, and say "Opened" instead of "Done". Add a "Show the guide again" link in Project details so Dismiss is reversible.
- Likely files: `FirstRunGuide.vue`, `guideState.ts`, `ProjectDetails.vue`. Effort: S–M.

### R3-s8-04 · P2 · Forced colours: the number in the "Next step" circle disappears
- Screen: first run, 1280, `forced-colors: active`. `shots/dashboard-trail__forced__1280.png`.
- Observation: the "3" circle renders as a solid white disc on the dark-purple card. Computed colour and background are both white on a white circle. "Next step" text and `aria-current` remain, so the state survives. Done circles keep their check mark.
- Recommendation: in the circle, use `forced-color-adjust: none` with explicit `Canvas`/`CanvasText`. Or add a forced-colours rule for `[data-state=next]` that gives the circle `border: 2px solid CanvasText`. Remove the dark fill so the card itself is not inverted.
- Likely files: `FirstRunGuide.vue`, `style.css`. Effort: S.

### R3-s8-05 · P2 · The headline and the help text contradict "not available yet"
- Screen: Populated Draft, 1440. `shots/dashboard-pop__populated__1440.png`, `dashboard__helphint-open__1440.png`.
- Observation: "Ready to go live, with 104 warnings" is followed by "Going live happens under Launch, which is not available in this version of the CMS yet." The HelpHint says "You change this in Launch." Both can be true only in the future.
- Recommendation, using only existing data: headline "Content is ready; going live is not available yet" while `launchAvailable` is false. Change the HelpHint to "Going live is done in Launch, which this CMS does not offer yet." Drop "Ready to go live" until Launch resolves.
- Likely files: `StatusCard.vue`, `DashboardView.vue` (HelpHint). Effort: S.

### R3-s8-06 · P2 · Blocked rows lose the cause and repeat words
- Screen: blocked (mocked), 1440. `shots/dashboard__blocked5-expanded__1440.png`.
- Observations:
  - "Place: Ακρόπολη – Ψηφιδωτό: Name" says which field but not what is wrong. "Point of interest: … : English: Title" does the same.
  - A MAP issue reads "Map: Untitled: Bounds does not match what the template expects" instead.
  - The first row reads "Project: Project settings: No surface is enabled…".
  - An RTL title renders its colon out of place (`مرشد المتحف:`).
- Recommendation: build blocker rows from `describeIssue`: "Title is missing in English". Drop the kind prefix for PROJECT. Wrap titles in `<bdi>`. Show "Untitled Map" without bold.
- Likely files: `readiness.ts` (`issuePart`), `StatusCard.vue`. Effort: S.

### R3-s8-07 · P2 · Counts card is 525 px tall and pushes pending changes down below 1100 px
- Screen: Populated, 1024, 768, zoom200. `shots/dashboard-pop__populated__1024.png`.
- Observation: 9 rows of 53 px sit between the status card and "Waiting for you to apply". The pending table starts at y = 917 at 1024, against 372 at 1440.
- Recommendation: below `nav:` render the counts as a 2–3 column grid of compact tiles (about 180 px total). Or move counts after the warnings, but fix R3-s8-02 first.
- Likely files: `ContentCounts.vue`. Effort: S.

### R3-s8-08 · P2 · Error sentences and actions
- Screen: error states, 1440. `shots/dashboard__err-*__1440.png`.
- Observations:
  - 403 offers "Try again" (a retry cannot succeed) next to "Ask a Project manager to check your membership".
  - 422 on readiness says "Check the fields marked in the form." There is no form on the Dashboard.
  - 404 says "This item no longer exists" for a whole Dashboard.
  - A 503 on any one of the six pending lists blanks the whole Dashboard.
- Verified good: the canary detail never appears in 8 scenarios (`a3.log`). The request id and "Copy request id" show every time. Offline retry works.
- Recommendation: hide Retry on 403 and 404. Give the Dashboard 404 and 422 their own sentences ("This Project is no longer available"). Show pending as "could not be loaded" while keeping the status card.
- Likely files: `DashboardView.vue`, the ProblemAlert mapping. Effort: S–M.

### R3-s8-09 · P2 · Status-card secondary actions use three styles
- Screen: Populated Draft, 1440. `shots/status-focus-preview-btn__1440.png`.
- Measured: "Preview the app" is a 40 px filled button. "About Launch" is a 21 px underlined link in 14 px/500 purple. "Review warnings" is a 40 px ghost button in 600 weight black with no underline. All three are secondary actions on one row.
- Recommendation: make both secondary actions the same ghost or link style. "Review warnings" should look like a link, since it scrolls to a section.
- Likely files: `StatusCard.vue`. Effort: S.

### R3-s8-10 · P3 · Card paddings and right edges differ
- Measured at 1440 (`a1.json`):
  - Status and guide cards use 20 px padding.
  - The pending and warnings sections use px-5 with a pt-4 header, which is 16 px at the top and 20 px at the sides.
  - The counts and Project details cards use px-4, which is 16 px.
  - The guide right edge is 1024 and the status card right edge is 1036 (12 px).
  - At 1280 the guide is 256–1024 while the status column ends at 876 and the counts column starts at 896. It overhangs by 148 px.
- Recommendation: one card header class (`px-5 pt-5 pb-3`). Drop `max-w-3xl` on the guide, or put it in the left column.
- Likely files: the dashboard card components. Effort: S.

### R3-s8-11 · P3 · Numbers are not grouped
- Mocked values: "12345 active · 1234567 draft", "Content revision 1234567". `shots/dashboard__counts-thousands__1440.png`.
- Recommendation: use `toLocaleString("en")` in `ContentCounts` and the status line.
- Likely files: `ContentCounts.vue`, `DashboardView.vue`. Effort: S.

### R3-s8-12 · P3 · Skeleton does not match the content, and shows "Organisation"
- Screen: loading. `shots/dashboard__loading__1440.png`, `dashboard__loading-orgs-held__1440.png`.
- Measured:
  - With the organisations request held, the subtitle reads "UX Audit – Populated · Organisation". The fallback is `findOrganisation(...)?.name ?? "Organisation"` in `DashboardView.vue`.
  - The skeleton cards are 160 and 288 px high, against 191 and 553 for the content. They sit 6 px higher because the status row is missing. At 1440 CLS is 0.017.
  - At zoom200 CLS reaches 0.68 at t = 392 ms, before readiness is released. I did not attribute the shifting element.
- Recommendation: render the subtitle without the organisation until it resolves. Reserve a 26 px status row in the skeleton. Match the skeleton heights (191 and about 400).
- Likely files: `DashboardView.vue`. Effort: S.

### R3-s8-13 · P3 · Remaining nits
- "Review warnings" moves focus to the h2 `tabindex=-1` with `outline: none`. A keyboard user sees no indicator.
- First run with drafts shows two filled primary buttons ("Open Pages" and "Show drafts"). Make "Show drafts" secondary while the guide is open.
- Guide copy "Five steps take an empty Project…" shows even when drafts exist.
- Guide steps 4–5 are 18 px-high links in 52 px rows. The `hit-44` pseudo-element keeps the pointer target at 44 px.
- Header chip "App: Draft" and page chip "Visitor app: Draft" name the same state differently.
- "Dismiss guide" and the guide title are not on one baseline (centres at y = 198 and 192).
- Pristine first run shows only the guide, so there is no counts strip. The page is 470 px of 844 px.

## What works (verified)
- Warnings: 104 rows, collapsed, one per item, with fields named. First group opens on Review warnings. Row sums equal the chip count.
- Pending: newest first, "Showing 10 of 16", per-kind See all links with correct hrefs.
- Status and loading:
  - Error states show the fixed sentence plus request id and never the server detail.
  - Dismiss lands focus on the h1.
  - A guide that is not dismissed survives reload.
  - The loading skeleton announces "Loading dashboard" and `aria-busy` is set.
- Layout and accessibility:
  - No horizontal scroll at 768 or zoom200.
  - axe reports 0 violations on Populated.
  - Long Greek and Arabic project names wrap.
  - Reduced motion: there are no running animations.
  - Focus rings are 2 px purple or white on filled buttons.
- Counts show "N active · N draft" with zeros muted.

## Unverified / could not test
- Contrast on the muted "Done" and "Next step" 12 px text, and on the chip.
- The status card with a real NAVIGATION blocker.
- Touch targets with real touch.
- The cause of the zoom200 layout shift.
- The Dashboard of a Project that is not initialized (no read-only candidate; Resume initialization must not be run).
- R2-V-02/03/04/07: outside the Dashboard.

Evidence: shots in `ux-audit/round-3/audit/s8-dashboard/shots/`. Probe logs are `a2.log`–`a6.log` and scripts `a1.mjs`–`a7.mjs` in the same folder, with measurements in `a1.json`.
