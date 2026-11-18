# s7-chrome — Round 2
(Saved by the orchestrator from the agent's returned report, condensed: its Write call was refused. Scripts a1…k2.mjs, lib.mjs, run.sh and 124 shots in this folder.)

Group: sign-in and session/error states, header, switcher, nav, page heads, toasts, dialogs, loading, Project switch, Home/picker, Create Project wizard (step 1 viewed only; steps 2–4 via Resume initialization on a Needs-setup Project, no writes). Interview skipped.

## Verdict
Clear step up: one StateCard family, real drawer, labelled stepper wizard, linked error summary, toasts that pause. Left: state timing and focus plumbing. Range 72–84 (mean ~78). P0 0, P1 2, P2 11, P3 7. C1 (24): fixed 6, partly 15, not fixed 0, regressed 0, not exercised 3. Nielsen 28/40.

## Context check
12 §6 skeletons/offline (banner does not disable controls, -05); 14 §4 dialog focus (broken for leave-confirm from switcher, -06); 03 §1 leave-guard copy matches; D-084, D-078; PRODUCT.md manager. Impeccable: critique.md browser evidence; audit.md name/role/value, focus, forced colours; operate.md skeleton states, component vocabulary.

## Scores
Sign-in 84 · Silent SSO landing 68 · Session ended dialog 86 · "Session keeps ending" page 87 · IdP unreachable/config 77 · 403/404/5xx Project states 82 · Offline banner 69 · Header + user menu 82 · Switcher popover 72 · Left nav + drawer 86 · Page heads 89 · Toasts 73 · Dialogs/confirm 78 · Loading skeletons 62 · Project switch with unsaved work 75 · Home/picker 83 · Create Project wizard 84.

## Findings
- **R2-s7-chrome-01 P1 Header "App: Draft" chip stays a grey skeleton after reload or deep link** (Empty B/C/D 4 of 4, Populated 3 of 4, also on 403/404/5xx pages; in-app switching works). shots/header__chip-EMPTY_D__1440.png vs header__chip-POP__1440.png; error__404__1440.png; b2.mjs. Root cause: `ProjectLayout.load()` upserts the detailed Project, then `loadProjects()` (started in App.vue) finishes later and replaces `state.groups` with the undetailed listing; ProjectSwitcher shows the placeholder while `!current.detailed` and nothing re-reads. Fix: merge detailed entries in `doLoad` or `ensureDetailed([currentId])`; show nothing (not a skeleton) when the read fails or the Project is not initialized. Files: stores/projects.ts, ProjectLayout.vue, ProjectSwitcher.vue. S.
- **R2-s7-chrome-02 P2 Tab title loses the Project name on deep link (same race)** for POIs, Routes, Guides, Categories, Media. WCAG 2.4.2. Files: lib/routeAnnouncer.ts, ProjectLayout.vue. S.
- **R2-s7-chrome-03 P1 Switcher dialog has no accessible name** (axe `aria-dialog-name` serious; `aria-label="Projects"` does not reach `role=dialog`). shots/switcher__open__1440.png. Fix: pass through PopoverContent or aria-labelledby. Files: ui/popover/*, ProjectSwitcher.vue. S.
- **R2-s7-chrome-04 P2 Authorization code and state stay in the address bar** (hash 266 chars; Back returns to it; 4 history entries). shots/sso-landing__code-in-url__1440.png. Fix: `history.replaceState` after keycloak init. Files: platform/auth.ts. S.
- **R2-s7-chrome-05 P2 Offline banner shifts layout (+49/+59/+80 px) and claims controls are disabled while "New place" and "Create and open" stay live.** e1, e2.mjs; offline__create-submit__1440.png. Fix: reserve slot; `aria-disabled` on mutating controls from the connection store; one-line banner when narrow. M.
- **R2-s7-chrome-06 P2 Leave-confirm from the switcher: focus stays on the header trigger outside the dialog; Esc returns to the editor h1.** h1, h2.mjs; switch__unsaved-confirm__1440.png. 14 §4. Fix: ConfirmDialog claims focus after the popover's focus-return; Esc returns to opener. S.
- **R2-s7-chrome-07 P2 Picker grouping and chips depend on lazy reads** ("Needs setup" 9 / 8 / 10 across places; chip on 4 of 19 rows). Fix: provisional count or read before grouping; em dash for unknown status. M.
- **R2-s7-chrome-08 P2 Forced colours: dialogs have no boundary** (forced__dialog-errors__1440.png). Fix: forced-colors border on AppDialog. S.
- **R2-s7-chrome-09 P2 Project load: "Loading projects" ~12 s with a 4 s API delay; generic four-card skeleton for a list; segments read "0".** i1.mjs. Fix: hide counts until loaded; route-aware skeleton; label switcher from first Project read. M.
- **R2-s7-chrome-10 P2 Error states leave focus on body; header keeps the Project name on 404; 404 copy names the Portal without a link; `/projects/not-a-uuid` shows 500 with a useless "Try again"; unknown routes redirect silently.** b3.mjs. Fix: focus StateCard h1; clear label/chip on 404; invalid id → 404. S.
- **R2-s7-chrome-11 P2 "Off" nav items grow to 4–9 lines and repeat their name** (nav__off-capabilities-events__1440.png). Fix: one line + chip; reason on the destination page and in aria-describedby. S.
- **R2-s7-chrome-12 P2 Toasts:** identical errors stack (~125 px each) over the list footer, no de-dupe; body is server `detail` verbatim; errors announced twice (role=alert + assertive say()); success dismisses at 5 s while the dismiss button is 22–32 Shift+Tabs away. Works: hover and focus pause. Fix: collapse identical toasts with count; offset above sticky footers; single announcement. Files: AppToast.vue, stores/toast.ts. M.
- **R2-s7-chrome-13 P2 Every dialog adds duplicate landmarks** (`<header>` in AppDialog → `landmark-no-duplicate-banner`, `landmark-unique`; user menu `region`). Fix: use a div. S.
- **R2-s7-chrome-14 P3** Logo twice on sign-in; header logo link reloads the page; splash uses a different mark and a dashboard skeleton; IdP down shows the splash 8–10 s before the error.
- **R2-s7-chrome-15 P3** Home repeats the Project (header switcher, Continue card, Recent).
- **R2-s7-chrome-16 P3** Wizard: dark mono slug placeholder; title/h1/button wording differs; direct load focus on body; step 1 button creates a real record without saying so; native select for "Add a language"; step 4 table misalignments; zoom200 head + stepper fill the fold.
- **R2-s7-chrome-17 P3** Switcher shows ~4 of 37 rows (340 px unused). `max-height: calc(100dvh - 8rem)`.
- **R2-s7-chrome-18 P3** Create category "Applies to *" vs "(required)".
- **R2-s7-chrome-19 P3** Announcer says "Places loaded" over the "session keeps ending" page.
- **R2-s7-chrome-20 P3** Dashboard "Active" chip beside "App: Draft".

## Round-1 fixes verified
fixed: C1-56, 60, 62, 119, 122, 123 · partly: C1-53, 54, 55, 57, 58, 61, 63, 64, 66, 67, 68, 124, 125, 76, 77 · not exercised: C1-59, 65, 78.

## What works
StateCard family with request id Copy; session-ended dialog and capped "keeps ending" page; drawer; consistent page heads across ten kinds; wizard (linked summary, stepper, focus to step heading, Review with Change links, Resume sends no writes, axe clean); toasts pause, cap 3, errors persist; offline auto-recovers; Home "Continue to X", Recent, search; axe clean on Home, sign-in, keeps-ending, 403/503.

## Unverified
Create Project step-1 submit and its 422/409; config-error and unusable-token pages (env fallback); Manage members with a Portal URL; Sign out; real screen readers; reduced-motion skeleton; touch; Initialize. Records: Categories `UX-R2-s7-chrome category`, `… toast timing A/B/F/G` (A active). A stray `.tmpstate.json` with cookies was deleted.
