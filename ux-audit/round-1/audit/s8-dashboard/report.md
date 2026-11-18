# s8-dashboard — Round 1

Interview steps of the impeccable skill skipped (subagent; the brief answers them). Mode: Operate. `impeccable detect` on `DashboardView.vue`: no findings. States captured with `page.route` on `**/readiness` and on `GET /api/v1/projects/{id}`; scripts `a1.mjs`..`a10.mjs`, screenshots in `shots/` (all named `<project>__<state>__<viewport>.png`, `pop` = UX Audit – Populated, `emp` = UX Audit – Empty B).

## Verdict
The Dashboard implements exactly one of the nine spec'd elements (the readiness status card, partly) plus a row of five metadata cards the spec never asked for. The first-run guide, pending changes, latest packages, content counts, translation bars and the `contentRevision` line do not exist (the earlier persona was right; verified in source and screenshots). Worst effect: an empty or even uninitialized Project is announced as "Ready for visitors", and a Project with 296 warnings hides them in an 8,262 px flat list. Most of the missing data is obtainable from endpoints that already exist (list `totalElements`, `pending` filter, `GET /settings`); only statistics, packages and last-editor need backend work.
Score range for the group: 38 to 46 (capped at 85 by open P1s, well below it on merit).

## Context check
- `12` §3 Dashboard: "The Dashboard answers 'what do I do now', not 'what is everything'"; the status card lists at most three items and offers one action, with `contentRevision` as one line.
- `14` §4: status, pending and translation state by text and icon, never colour alone (applies to the card's coloured left border).
- `03` §1: an `ACTIVE` Resource edited through a Working Copy is invisible to visitors until Apply (hence "pending changes" belong on the Dashboard).
- DECISIONS.md D-022: Dashboard = one status card, at most three blocking items, warnings in a disclosure, "computed on every visit, no recompute button". The implementation follows D-022 literally; D-022 itself under-delivers on `12` §3 (no action, no revision, no guide).
- PRODUCT.md: the Project manager "reads the Dashboard to decide what blocks launch" in "short, infrequent sessions, low training".

## What the spec asks for vs what exists (verified)
| Spec element (`12` §3) | Exists | Works | Clear | Evidence / data source |
|---|---|---|---|---|
| Status card, blocking / warnings / ready | Yes (partly) | Yes, with real and simulated data | Partly | `pop__real__1440`, `emp__block5__1440`, `emp__clean__1440`. No action button, no `contentRevision`, false "ready" on empty |
| Names the consequence in one sentence | Yes | Yes | Jargon ("active content", "application") | `emp__block5__1440` |
| At most 3 items, one action | 3 items yes; **action no** | n/a | n/a | `DashboardView.vue` has no CTA; only "Show all N" |
| `contentRevision` one line | **No** | n/a | n/a | `GET /settings` returns `contentRevision: 116` and `applicationStatus: "DRAFT"` (probed); unused |
| Five-step first-run guide (empty Project) | **No** | n/a | n/a | `emp__real__1440`; after creating a Place and a POI the Dashboard is unchanged (`emp__dashboard-after-place-and-poi-draft__1440`) |
| Pending changes ("Waiting for you to apply") | **No** | n/a | n/a | Populated has 8 POIs + 1 Route + 1 Guide with a Working Copy (`GET /pois?pending=true` totalElements 8, rows carry `hasWorkingCopy`, `workingCopyUpdatedAt`); Dashboard shows them only as 10 `PENDING_WORKING_COPY` lines buried in the 296 warnings |
| Latest packages with `stale` | **No** | n/a | n/a | No endpoint: `/deployment-packages`, `/packages` return 404 `RESOURCE_NOT_FOUND` (grep of backend: no controller). Spec says "only after the first request", so the UI absence is right today; GAP |
| Content counts, one compact row, zero greyed | **No** | n/a | n/a | Available now: `GET /{kind}?size=1` returns `totalElements` (Populated: places 13, pois 55, routes 8, guides 7, events 9, categories 13, assets 34, maps 2, floor plans 2; `status=ACTIVE` also works) |
| Translation bars per language | **No** | n/a | n/a | `GET /statistics` is 404 (spec `05` §8). Per-row `translations` objects exist but a Project-wide bar needs a backend endpoint: GAP |
| "Not initialized" banner | Yes | Yes (simulated `initialized:false`) | Contradicted by the "Ready for visitors" card under it | `emp__uninitialized-sim__1440` |
| Loading / error | Text only | Yes | Error state is mis-coloured | `pop__loading__1440`, `emp__e403__1440`, `pop__e503__768` |

## Scores (0–100)
| Screen / state | Task clarity 25 | Hierarchy 20 | Consistency 15 | Copy 15 | A11y 15 | Responsive/states 10 | Total |
|---|---|---|---|---|---|---|---|
| Dashboard, Populated, 296 warnings | 8 | 9 | 10 | 9 | 10 | 6 | **52** |
| Dashboard, Empty B (first-run) | 4 | 7 | 9 | 5 | 10 | 5 | **40** |
| Dashboard, blocking issues (simulated) | 14 | 12 | 10 | 10 | 10 | 6 | **62** |
| Dashboard, loading | 8 | 8 | 9 | 8 | 10 | 4 | **47** |
| Dashboard, error 403/503/500 | 8 | 7 | 6 | 6 | 9 | 5 | **41** |
All rows are capped at 85 by open P1s; none reaches the cap on merit. Honest group range 38–52, blocking state 62.

Nielsen (0–4): 1 visibility of system status 2 · 2 match with real world 2 (jargon "application", "active content", raw `(el)`) · 3 user control 3 · 4 consistency 3 · 5 error prevention 2 · 6 recognition over recall 2 (author must recall the five steps) · 7 flexibility 2 · 8 aesthetic and minimalist 2 (low-value metadata cards beside a missing core) · 9 error recovery 2 (no requestId, wrong colour) · 10 help and documentation 1 (no guide). Total 21/40.

## Findings

### R1-s8-dashboard-01 — Severity P1
Screen & state: Dashboard, Empty B, pristine · Viewport 1440 (identical at 1280/1024/768) · Persona: Project manager / new editor, first run.
Evidence: `shots/emp__real__1440.png`, `emp__real__1024.png`, `emp__real__768.png`; after creating one Place and one POI (both DRAFT) `shots/emp__dashboard-after-place-and-poi-draft__1440.png` is unchanged. Source: `DashboardView.vue` has no first-run block at all.
Observation: no five-step guide (Place, POIs, Page, Navigation, Preview). The page of an empty Project is the green "Ready for visitors" card plus five metadata cards. Nothing tells the author what to do first; the Places empty state is the only teacher.
Why it hurts: this is the product's headline success criterion ("from an empty Project to a guide without training"). A low-training manager lands on a green card and concludes there is nothing to do.
Recommendation: when the Project has no content, replace the status card by the guide: numbered list of 5 steps, each with one-line purpose, state (done / next / later, text plus icon) and one button; the next step highlighted (filled button), others outline; capability warnings and the metadata row hidden. Step completion from existing data: 1 Place done when `GET /places?size=1` `totalElements > 0`; 2 POI likewise; 3 Page: `GET /pages` total (Templates open with initial Pages, so detect "edited" via the Pages list; if it cannot be known, show "Open Pages" as a review step); 4 Navigation: navigation list non-empty or edited; 5 Preview: always "next" once 1-2 are done (no data). Count DRAFT items too, so creating a DRAFT Place ticks step 1 (it did not progress at all in Empty B).
Likely files: `DashboardView.vue` (extract `FirstRunGuide.vue`), `platform/` list-total helper. Spec: `12` §3 Dashboard and "after initialization the Dashboard shows the five-step guide". Effort: M.

### R1-s8-dashboard-02 — P1
Screen & state: status card on empty, uninitialized, DRAFT-only Projects · 1440 · Project manager.
Evidence: `emp__real__1440.png` (Empty B: 0 content, `applicationStatus: "DRAFT"`, still "Ready for visitors"); `emp__uninitialized-sim__1440.png` shows "This Project is not initialized" directly above "Ready for visitors"; `emp__dashboard-after-place-and-poi-draft__1440.png`.
Observation: `activatable: true` is returned whenever no ACTIVE content is faulty, so a Project with zero or only DRAFT content, or not initialized, is "Ready for visitors". The header chip beside "Dashboard" says ACTIVE (the Project's status, not the app's), reinforcing it.
Why it hurts: false reassurance is the worst answer to "what blocks launch". Two cards contradict each other.
Recommendation: derive the card state in the UI from facts the API gives: not initialized → single "Finish setup" card (hide readiness); `activatable` but zero ACTIVE Resources → "Nothing is live yet" with the guide / "N drafts to activate" and the first action; `activatable` with content and `applicationStatus` DRAFT → "Ready for a first package" (do not say "for visitors" until a package exists); only then green "Ready". Rename the chip next to the title or remove it from this page (it is Project status; use "Project: Active" or drop). Consider a backend GAP: readiness could include an `activeResourceCount` (or the UI counts via `status=ACTIVE&size=1`, which works today).
Likely files: `DashboardView.vue`, `PageHead.vue`. Spec: `12` §3 ("blocking issues, warnings, or ready for a package"). Effort: S–M.

### R1-s8-dashboard-03 — P1
Screen & state: Dashboard, Populated · 1440 · Project manager / editor.
Evidence: `pop__real__1440.png`; `pop__warnings-open__1440.png`; API probe: `?pending=true` totals pois 8, routes 1, guides 1.
Observation: no "Waiting for you to apply" section. The 10 Resources with a Working Copy appear only as `PENDING_WORKING_COPY` lines inside the warning disclosure; the card says "Ready for visitors" although visitors do not yet see ten edits.
Why it hurts: Working Copies are invisible to visitors until Apply (`03` §1); forgetting them is the most likely authoring mistake, and the Dashboard is where it should be caught.
Recommendation: section "Waiting for you to apply (10)": rows (kind icon, title, "edited <relative time>"), per-row "Apply" and "Discard" (with the existing confirmations), "Apply all" no (risky); hidden when 0. Data: `GET /{kind}?pending=true` per kind (or filter rows with `hasWorkingCopy` / `workingCopyUpdatedAt`). "Who last edited" is not in list rows: needs the Resource's latest Audit Event; ask backend to add `workingCopyUpdatedBy` to list rows (GAP). Until then show time only and say so. Remove `PENDING_WORKING_COPY` from the warning list (it is the same info).
Likely files: `DashboardView.vue`, `platform/workingCopies.ts`. Spec: `12` §3 pending changes; `03` §1. Effort: M.

### R1-s8-dashboard-04 — P1
Screen & state: Dashboard, both Projects · 1440 · all personas.
Evidence: `pop__real__1440.png` (only Organisation / Slug / Template / Created / Last updated).
Observation: the "compact row of counts, each opening its list, zero counts greyed" is missing. The row of cards that exists shows slug, template and dates, which the project switcher already shows (name, organisation, slug).
Why it hurts: no sense of size or progress; no shortcut into lists; duplicate information takes the prime slot.
Recommendation: one row of 9 count chips (Places 13, POIs 55, Routes 8, Guides 7, Events 9, Categories 13, Media 34, Maps 2, Floor plans 2) as links to each list, zero greyed (disabled capabilities greyed with reason as in nav), with "34 active" secondary text. Data exists now: `GET /{kind}?size=1` `totalElements`, `&status=ACTIVE`; nine cheap requests, parallel, abortable. Prefer one `GET /statistics` once the backend has it (GAP below). Show the counts also in the left nav only if the owner wants (not here).
Likely files: `DashboardView.vue`, new `ContentCounts.vue`. Spec: `12` §3. Effort: S–M.

### R1-s8-dashboard-05 — P1
Screen & state: Dashboard, Populated · 1440 · Translator, Project manager.
Evidence: `pop__real__1440.png`; 296 warnings of which 232 are `MISSING_TRANSLATION` (counted from the real readiness response: 29 Place, 110 POI, 10 Route, 52 Guide, 13 Event, 18 Category).
Observation: no translation bars. The same information is exploded into 232 text lines.
Why it hurts: a translator or manager cannot see "Italian 40 %" at a glance; the Dashboard cannot hand them to the Translations screen.
Recommendation: one bar per enabled language (text "Italian 62 % · 38 items missing" plus bar, link to Translations filtered to that language); hidden when no content. Backend item: `GET /projects/{id}/statistics` (spec `05` §8) currently 404; it should return per language `{translated, total}` over ACTIVE Resources. Do not compute from every list row in the UI. Until then show nothing rather than a client approximation.
Likely files: `DashboardView.vue`; GAPS.md entry. Spec: `12` §3, `05` §8. Effort: M (UI S, backend M).

### R1-s8-dashboard-06 — P2
Screen & state: Dashboard · latest Deployment Packages · all.
Evidence: backend probe `/deployment-packages` and `/packages` → 404 `RESOURCE_NOT_FOUND`; no controller in `../uniche_iguide_backend`.
Observation/Why: spec section appears "only after the first request", so the missing UI is acceptable today, but nothing can be built.
Recommendation: record a GAPS item (backend: package list endpoint with status, `stale`, `contentRevision`, `createdAt`); design the slot now (below the status card, hidden until one exists). Same for the ICAgent line (Milestone 12, not available). Effort: backend M.

### R1-s8-dashboard-07 — P1
Screen & state: warnings disclosure · Populated · 1440 · Project manager, Translator.
Evidence: `pop__warnings-open__1440.png`, `pop__warnings-end__1440.png`: 296 `<li>` in one flat list, disclosure height 8,262 px; 232 of them "X is not translated. (it)"; the same Place repeated four times in a row with four sentences.
Observation: a flat unsorted dump, one line per field per language; 296 tab stops (`pop__focus-first-warning-link__1440.png`); one `aria-live` section whose content is re-announced when opened.
Why it hurts: unreadable; the actionable signal (3 missing accessibility texts, 3 missing transcripts, 10 pending copies) is lost among 232 translation lines. The card is useless at the exact load the owner asked about.
Recommendation: replace by a grouped summary: rows by code, each "Missing translations · 232 · 6 languages" (expand → by Resource, one line per Resource "Acropolis Museum: 4 fields missing in Italian" with one link), "Accessibility information empty · 51", "Transcript missing · 3", "Pending changes · 10" (moves to the pending section). Cap the open list to 10 rows with "Show more" and a link to the Translations screen for translation codes. Group client-side from the existing response (resourceType, resourceId, languageCode, code): no backend change. Collapse by default; show the top three groups collapsed-visible in the card.
Likely files: `DashboardView.vue`, new `ReadinessGroups.vue`, `platform/readiness.ts` (grouping helper). Spec: `12` §3 (at most three items), D-022. Effort: M.

### R1-s8-dashboard-08 — P1
Screen & state: status card with blockers (simulated, real response shape) · 1440, 1024, 768 · Project manager.
Evidence: `emp__block5__1440.png`, `emp__block5-expanded__1440.png`, `emp__block5__1024.png`, `emp__block5__768.png`.
Observation: the card has a headline and a text list but no action. Every item is a link, but links are small bold purple text in running prose (`Point of interest “…”: Title is missing…`); the first item ("Project: No surface is enabled") is not visually different although it fixes in one click. Left border colour is the only status mark; there is no icon. Long Greek title wraps across 2–3 lines and pushes the sentence out of the item.
Why it hurts: "what do I do next" requires reading prose and guessing which link to click; fails the 5-second test.
Recommendation: card = icon + headline ("5 things block going live") + one-sentence consequence + ONE primary button ("Fix first issue: No surface enabled") + three rows, each as a compact grid: kind chip (text + icon), truncated title (ellipsis, full on title attr), plain-language problem, language chip, "Fix" link on the right; "Show all 5" as a quiet link. Status icon (alert / check) in the heading so colour is never alone. Put blockers before warnings; warnings summarised as one line "296 warnings, see below".
Likely files: `DashboardView.vue`, `StatusChip`. Spec: `12` §3 ("offers one action"), `14` §4. Effort: M.

### R1-s8-dashboard-09 — P1
Screen & state: readiness error (403, 500, 503, 504 equivalent) · 1440, 768 · all.
Evidence: `emp__e403__1440.png` ("Forced by s8 audit" printed as the message), `pop__e503__768.png` ("The UNICHE platform is not reachable.", green left border), `emp__e500__1440.png`.
Observation: (a) the failed card keeps the green "ready" border colour (`border-l-[#0c6d62]` unless `readiness && !activatable`); (b) no `requestId` is shown in either error (hard constraint: errors shown with their `requestId`; spec `12` §6 for 502/503/504); (c) for non-platform errors the raw `ApiError.message` (server `detail`) is printed instead of a code-based sentence; (d) "Try again" is a tiny uppercase text button with no busy feedback; (e) the metadata cards below still render as if all is well.
Why it hurts: green means fine; users cannot quote an id to support.
Recommendation: neutral or warning-coloured card with an alert icon, "We could not check readiness", code-based sentence, "Request id: …" in mono with a copy affordance, "Try again" as a secondary button with spinner. Never show "Ready" state anywhere while this card is failed.
Likely files: `DashboardView.vue`, `platform/api.ts` (`ApiError.requestId` already exists in problem details). Spec: `12` §6, BRIEF constraints. Effort: S.

### R1-s8-dashboard-10 — P2
Screen & state: loading, fresh visit and deep link · 1440 · all.
Evidence: `pop__loading__1440.png` (header "Select a project / Loading projects…", subtitle "UX Audit – Populated · Organisation", cards show "Organisation" as a real value, card text "Checking what visitors would see…"); `emp__pois-list__1440` first attempt was a completely blank workspace after 2.5 s (heading appeared after 3.6 s; instrumented). On load the app issues one `GET /projects/{id}` for ~40 other Projects (network list in a1 run).
Observation: no skeleton (spec `12` §6: "skeletons in place of lists, never blocking spinner"); placeholder strings are rendered as data ("Organisation") and later swap; layout shifts when the card content arrives; N+1 requests slow the first paint.
Recommendation: skeleton the status card and the future counts/pending blocks; render nothing, not "Organisation", until the name is known; ask chrome owner to stop fetching every Project on load (picker should lazy-fetch). Report to s7-chrome.
Likely files: `DashboardView.vue`, `stores/projects.ts`. Effort: S–M.

### R1-s8-dashboard-11 — P2
Screen & state: metadata cards · all viewports.
Evidence: `pop__real__1440.png`; `pop__e503__768.png` (5 cards in a 2-column grid, last one alone); `emp__block5__1024.png` (3 + 2).
Observation: five equal 190 px cards of label/value pairs (Organisation, Slug, Template, Created, Last updated) are the most prominent thing after the card; Organisation and slug duplicate the switcher and the subtitle; "Created" and "Last updated" are the same date here; the subtitle sentence "The UNICHE Catalogue confirmed your access to this Project" is system narration, not information.
Recommendation: demote to one muted definition line or a "Project details" disclosure at the bottom; drop the subtitle sentence ("<Project> · <Organisation>" or nothing); free the area for counts and pending changes. Keep the "not initialized" banner but above everything.
Likely files: `DashboardView.vue`, `PageHead.vue`. Effort: S.

### R1-s8-dashboard-12 — P2
Screen & state: status card · 1440 · Project manager.
Evidence: probe of `GET /projects/{id}/settings` → `contentRevision: 116`, `applicationStatus: "DRAFT"`; not rendered anywhere.
Observation: the spec's one-line `contentRevision` is missing, as is application status.
Recommendation: footer line of the card: "Content revision 116 · Application: Draft · no package requested yet". The CMS already loads `/settings` on entry (it is in the request log), so no extra request.
Spec: `12` §3. Effort: S.

### R1-s8-dashboard-13 — P2
Screen & state: card copy · all.
Evidence: `emp__real__1440.png` ("1 warning does not block, but deserve a look." grammar), `emp__block5__1440.png` ("(el)", "Category id points at something archived or deleted", "The application cannot go live until these are fixed in the active content").
Observation: singular/plural bug ("1 warning does … deserve"); raw language codes `(el)` instead of "Greek"; "application" and "active content" are internal vocabulary (visitors' guide / items you have activated); `Show all 5` upper-cased by CSS; "Checking what visitors would see…" says nothing about the readiness check; headings "Dashboard" status chip ambiguous.
Recommendation: rewrite: "Nothing is blocking your guide from going live. 1 warning needs a look." / "5 things stop your guide from going live. Fix them in the items you have activated." / language chips by name. Greek translation tests later.
Likely files: `DashboardView.vue`, `platform/readiness.ts` (`SENTENCES`). Effort: S.

### R1-s8-dashboard-14 — P2
Screen & state: backend list filters · n/a.
Evidence: probe `GET /assets?size=1&pending=true` returns totalElements 34 (all assets) while Assets have no Working Copy.
Observation/Why: the `pending` filter is ignored for assets; a pending count built from it would be wrong.
Recommendation: GAPS item for the backend (reject or ignore explicitly); the Dashboard must not count assets as pending. Effort: backend S.

### R1-s8-dashboard-15 — P3
Screen & state: zoom200 and 768 · 1280 at zoom200, 768.
Evidence: `pop__real-viewport__zoom200.png`: header, project switcher and "Menu" bar take 312 of 360 CSS px of vertical space; the status card starts at 560 px and only its first sentence is in the first screen. At 768 the header wraps onto two rows (`pop__e503__768.png`).
Recommendation: chrome owner to compact the header at narrow/zoomed widths; Dashboard should put the status card (or guide) immediately under a smaller title. Effort: S (chrome).

### R1-s8-dashboard-16 — P3
Screen & state: a11y details · 1440.
Evidence: axe on Empty B: 1 moderate `region` violation (content outside landmarks); tab run `emp__focus-after-tabs__1440.png` (Skip link, switcher, Manage members, Help, user, 17 nav links, then the warnings summary: the dashboard content gets its first stop only after 22 tabs; the skip link exists, good).
Observation: whole status section is `aria-live="polite"`, so opening the 296-item disclosure or changing readiness re-reads a large block; the disclosure summary has no icon and lacks an accessible count in a heading. Focus ring on the link inside the list is visible and good (`pop__focus-first-warning-link__1440.png`).
Recommendation: `aria-live` only on a short status sentence; wrap content in landmarks; keep real headings (h2 per block) for the future sections.
Effort: S.

### R1-s8-dashboard-17 — P3
Screen & state: Place create dialog (first-run step 1), Empty B · 1440.
Evidence: `emp__place-create-dialog__1440.png`, `emp__place-create-level-chosen__1440.png`: the dialog opens with only a "1 · LEVEL" choice, the fields appear only after choosing (dialog grows, reflows); an earlier "Create place" click without choosing silently does nothing (no message; first run of `a5.mjs` ended on the same page); on the first step the Sub-place choice is greyed with no reason (no Place exists yet).
Recommendation: show title and slug at once, default the Level to "Top-level" when no Place exists, explain the disabled Sub-place ("Create a top-level place first"). Belongs to the Places audit; recorded because it is guide step 1.
Effort: S.

## Recommended Dashboard (answers "what blocks launch, what do I do next" in 5 seconds)
Top to bottom, every block hidden when empty, nothing dependent on new backend except where marked:
1. Page head: "Dashboard", subtitle "<Project> · <Organisation>" (no sentence about the Catalogue).
2. Setup banner, only if not initialized: "Finish setup" + one button (exists).
3. **Status card** (one of four states, icon + headline + one sentence + one primary button):
   - Not set up / empty: replaced by the **five-step guide** (done, next, later), next step has the filled button.
   - Blocking: red alert icon, "5 things stop your guide going live", primary "Fix first issue"; three rows (kind chip, truncated title, problem, language, "Fix"); "Show all 5".
   - No blockers, content present: "Ready for a first package" (or "Ready" once a package exists) plus warning count line; primary button: the most valuable action (Apply pending changes, else Preview, else open Launch).
   - Error: neutral card with request id and Try again.
   Footer line: "Content revision 116 · Application: Draft".
4. **Waiting for you to apply (10)**: Resource, edited time (editor name when the backend offers it), Apply / Discard.
5. **Content row**: nine count chips as links, zeros greyed, "34 active" hints.
6. **Translation bars** per language (backend statistics endpoint).
7. **Latest packages** (backend endpoint).
8. **Warnings, grouped** (collapsed by default): by code and Resource, link to Translations for translation codes.
9. "Project details" disclosure (slug, template, created, updated).
Data available today: readiness, settings (`contentRevision`, `applicationStatus`), list `totalElements` with `status` and `pending` filters, `hasWorkingCopy` and `workingCopyUpdatedAt` on rows.

### Backend items for GAPS.md (not UI fixes)
1. `GET /projects/{id}/statistics` (404 now): per-kind totals, ACTIVE totals, per-language translation completeness.
2. Deployment Package list endpoint with status, `stale`, `contentRevision` (404 now); ICAgent ingestion status (Milestone 12).
3. "Last editor" and time for Working Copies on list rows (`workingCopyUpdatedBy`); the list gives time only.
4. Readiness could expose an `activeResourceCount` or an explicit `empty` flag so "Ready" is not asserted for a Project without ACTIVE content (the UI can use `status=ACTIVE` totals meanwhile).
5. `pending=true` on Assets is ignored (returns all).

## What works (keep these)
- Readiness card reads real data, correct plural of the headline ("5 things block going live"), blockers expand with "Show all N" and `aria-expanded` (`emp__block5-expanded__1440.png`).
- Plain-language sentence per readiness code and per-issue deep links to the right editor (Project-level issues go to Surfaces); focus ring on those links is visible.
- "Not initialized" banner with Resume button works and is clearly differentiated (amber bar, filled button) (`emp__uninitialized-sim__1440.png`).
- Responsive: no horizontal scroll at 1440, 1280, 1024, 768 or zoom200; metadata cards reflow.
- Long Greek blocker title wraps without overflow at 768 (`emp__block5__768.png`).
- Warnings disclosure is keyboard operable (Enter on the summary opens it).

## Unverified / could not test
- A real Project with blocking issues: none exists; the state is simulated with the real response shape (`activatable`, `blocking[]`, `warnings[]` as returned by `GET /readiness`).
- Real 503 from the platform: simulated with `page.route`; `409`, offline banner on this page and Greek text zoom not exercised separately.
- Apply/Discard, packages, translation bars, ICAgent: no UI and no endpoint to test.
- The five-step guide could not be observed because it does not exist; the Place and a POI I created (`UX-s8-dashboard Place`, `UX-s8-dashboard POI`, both DRAFT, in Empty B) did not change the Dashboard, so "guide progress" is unverifiable. Note these two records remain in Empty B (not deleted, per the rules).
- impeccable `reference/*.md` files were not read in full; assessment used the brief's rubric and Operate-mode principles.
