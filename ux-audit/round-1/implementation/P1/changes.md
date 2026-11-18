# P1 changes: sign-in, session and error states, picker, Create Project, switcher (D-084)

## Fixed
C1-59 (P0), C1-62, C1-53 (list read lazily; full fix needs G-029), C1-54, C1-56, C1-57, C1-60, C1-63, C1-64.
Partly: C1-55 (switcher footer has "Manage members" only with a Portal URL; header menu is W0's), C1-61 (SSO splash is
W0's `index.html`; Greek sort order, switch skeleton, sign-in duplicate brand done), C1-65 and C1-66 (message strings and the
StateCard for Project 403/404/5xx; editors wire `describeError` themselves), C1-67 (not touched: W0 store).

## Files
New: `src/components/ProjectList.vue`, `src/workspace/lastProject.ts`, `src/views/heldTitle.ts`, `src/views/createProject/{useCreateProject.ts,Stepper,StepName,StepTemplate,StepLanguages,StepReview}`.
Rewritten: `SignInView`, `SessionErrorView`, `HomeView`, `CreateProjectView`, `ProjectSwitcher`, `workspace/ProjectLayout`.
Edited: `stores/projects.ts` (lazy `ensureDetailed`, collator sort), `platform/auth.ts` (`SessionError.kind/technical`, capped
session-expiry flow, author wording), `platform/api.ts` (default messages, "backend unreachable" strings).
Unchanged: `currentProject.ts`, `catalogue.ts`, `templates.ts`, generated client. D-084 appended; requests.md appended; no Q entry needed.

## Acceptance
- Create step 1 empty: summary (`role=alert`, `data-error-summary`) takes focus at 1440, 1024, 768, zoom200; each line links and focuses its field; fields `aria-invalid` and `aria-describedby`. Mocked 422: per-field errors, request id shown, rejected text not echoed; link focus lands on `project-name`. Real 409 (duplicate slug) shows the slug error and summary.
- Forced 401: the dialog "Your session ended" appears, 0 redirects in 3.5 s; a 401 within 30 s of a sign-in redirect shows the "Your session keeps ending" page.
- 403/404/503/500 on a Project: h1, document title, request id, one next action, no developer words; axe clean apart from the W0 header issue.
- Picker: search filters; keys run (open, ArrowDown/Up, Home/End, ArrowUp from first row to search, typing filters to 1 row, Esc returns focus to the trigger). Switch with unsaved work: popover closes, exactly 1 dialog on screen.
- Create flow walked for real with one Project (stepper, steps 2 to 4, languages emptied shows summary, Initialize disabled with reason via `aria-disabled` and title, Initialize lands on the Dashboard).
- axe (wcag2a/aa): 0 serious/critical on Home, sign-in, picker and wizard steps except the AppHeader account button (W0, in requests.md). `impeccable detect`: clean. Typecheck: no errors in P1 files (other packages' in-progress files had errors).
- Screenshots: `after/` at 1440, 1024, 768, zoom200 for home, switcher, create steps 1 to 4, session dialog, states; forced-colours for home and step 1 errors.

## Test data
One Project created and initialized: named `"UX-P1` (slug `ux-p1`; a quoting slip in my command line left the quote), id 510ee9b6-9f28-46e2-aae9-19b37be9ce03.

## Deferred, notes
- Setup state for Projects beyond the first 12 is unknown until opened (G-029). "Needs setup (n)" counts known ones only.
- Sign-in, error-unreachable and SSO splash captured at 1440 (plus 4 viewports for sign-in). Configuration and unusable-token error kinds were not forced (no safe way to blank the config); same component.
- No e2e specs referenced the changed markup; none were edited. Specs cannot run here.
- Other packages: `describeError` 401 wording matches the dialog; `useHeldTitle` is reusable for any full-page state.

## Verification fixes
- R1-V-02: `useCreateProject.chooseTemplate` preselects a default language only when the Template marks one (`isDefault`); otherwise none, and step 3 says "Required: choose which one is the default language" (Continue and Initialize already block with that reason).
- R1-V-03: the wizard footer is no longer sticky; it closes the card (sunken strip), so it cannot cover a field at any viewport. Primary stays reachable by scrolling (steps are short).
- R1-V-12 (P1 part): the switcher reserves the "App: Draft" chip's width with a skeleton pill while the open Project's detail is loading, so nothing shifts when it arrives.
- vue-tsc: 0 errors. Not re-screenshotted; no Project created.
