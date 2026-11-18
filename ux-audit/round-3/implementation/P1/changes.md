# P1 Chrome, session, picker, Create Project: changes

Typecheck (`vue-tsc -p tsconfig.app.json`) passes. `check-css-tokens` passes. `impeccable detect --json` on the changed files returns `[]`. The literal-gate grep returns nothing. Nothing was committed, installed or started. The Create Project wizard was tested with `page.route` mocks only (a mocked POST and a mocked two-template list). No real Project was created, and no records were mutated.

## C3 ids
- **Fixed:**
  - C3-48 (logo)
  - C3-62 (header chip name)
  - C3-63 (stepper current step)
  - C3-85 (Project load, picker error, Template error and resume error: one 503 sentence and one request-id row)
  - C3-86 (offline row and reasons)
  - C3-90 (picker)
  - C3-91 (skeleton head)
  - C3-92 (switcher `aria-controls`, drawer name, not-found title)
  - C3-95
  - C3-96
- **Partly:**
  - C3-91: the head and the list card now match the real page. The remaining shift is inside the list views (see "Deferred").
  - C3-50: the Project name keeps `dir=auto`, which the W0-A `Input` already provides. The slug is `dir=ltr`.
  - C3-11 (switcher): nothing was left to do here after W0-A.
- **Verified, no change needed:** SessionErrorView and SignInView. W0-A already cleaned up sign-in.
- **Not done:** C3-48 on the nav links. They are 36 px with a fine pointer and 44 px under coarse or in the drawer, as before.

## Files changed
- Chrome: `components/OfflineBanner.vue`, `PageHead.vue`, `AppHeader.vue`, `ProjectSwitcher.vue`, `WorkspaceNav.vue`, `ProjectList.vue`, `views/NotFoundView.vue`, `views/workspace/ProjectLayout.vue`.
- Create Project: `views/CreateProjectView.vue`, `views/createProject/Stepper.vue`, `StepName.vue`, `StepLanguages.vue`, `StepTemplate.vue`, `useCreateProject.ts`.
- Probes and screenshots: `ux-audit/round-3/implementation/P1/{probes,before,after}/`.
- `requests.md` has four new items.
- No D, Q or G entries (none were reserved for P1).

## Changes
- **Offline banner**
  - It is now an in-flow row between the header and the page. Before it floated over the page.
  - `PageHead` sets `aria-disabled`, `aria-describedby` and the reason on primary and danger actions in `#actions` while offline. Activating one announces the reason. An action with its own reason is left alone.
- **Picker (`ProjectList`)**
  - The "Setup not checked" chip and "Opens its Dashboard" are removed.
  - The list renders once, after the first batch of setup reads settles (3 s cap), with one "Checking setup..." line while it waits.
  - Chips read "Visitor app: Draft", the same as the Dashboard.
  - The error alert uses `describeError`.
- **Switcher**
  - An empty `aria-controls` is dropped while the popover is closed.
  - Drawer and landmark `aria-label` is "Menu".
  - Not-found title is "Page not found".
- **Header logo:** `h-logo` plus `hit-44`.
- **Skeleton:** the head shows the known title (Dashboard, or the section's name) in the real h1 box, as `aria-hidden` text. It is not a heading, so the route announcer does not focus a heading that is about to be replaced. The subtitle is a bar in the real 21 px line. List cards use a 57 px toolbar, a 48 px header and 80 px rows. "Organisation" is gone.
- **Wizard**
  - The stepper top-aligns each circle with the first line of its label. `.forced-step-current` is on the current circle.
  - `aria-current` moved to the label.
  - Continue has a visible reason next to it. A press on the blocked Continue focuses the Template group.
  - A default language the author did not pick is stated in one line, with the way to change it. Removing the default no longer silently promotes the first remaining language.
  - The slug is capped at 100 on the generated value. Longer typed slugs get an error that states the limit. A name with no Latin letters gets "Type a slug in Latin letters". The hint states the limit.
  - The "real record" note moved below the fields. The single organisation is one line. At short heights the other steps' labels are screen-reader-only.
  - Template-load, resume and picker errors use the shared sentence.

## Acceptance (admin; before = audit or the first probe run; after = measured)
| Item | Before | After |
|---|---|---|
| Offline banner vs page-head actions, 1440 and 768 | covered "New ..." | banner y=56 h=49 (1440) and h=59 (768), position static, overlaps with actions: 0, with header: false |
| Offline primary | live | `aria-disabled=true`, no `disabled` attribute, description = reason, click announces "You are offline. Changes are disabled until the connection is back." |
| Home, 3 loads (17-20 rows) | 15-16 "Setup not checked"; Needs-setup count 1+, 3+, 7+, 10+ | "Setup not checked" max 0; "Checking setup..." max 1; Needs-setup states `""`, then `(10+)` once; org count states 2 |
| Switcher `aria-controls` | `""` | absent when closed; axe with the popover open and closed: 0 violations (all impacts) |
| Header | logo link 26 px; chip "App: Draft" vs "Visitor app: Draft" | logo link box 26 px with a 44 px `::after`; both chips "Visitor app: Draft"; nav landmark "Menu" |
| Skeleton head (POIs, Places, Dashboard) | 52 px bar, no title | 51 px, the real 51 px head, title text shown, no "Organisation" |
| Project 503 | "The UNICHE platform is not reachable" | "The platform is busy ... busy or down for maintenance", one request-id row and Copy, same at 1440, 1024, 768 and zoom200 |
| Slug, 117-char Greek name | 119 characters | 99 characters (limit stated) |
| Slug, Arabic name | empty, "Enter a slug..." | empty, hint and error "Type a slug in Latin letters..."; name `dir=auto` |
| Stepper circle tops (steps 1-3 at 1440 and 768) | 10-13 px apart | all four at y=180 |
| Template step, no Template chosen | tooltip only | visible "Choose a Template to continue."; click on Continue focuses the Template radio |
| Step 3 default | silent | "Ελληνικά is the default language because the Template ... marks it. To change it, choose another below." |
| zoom200 (640x360), first field top | 479 px | 359 px (marginal) |
| Forced colours, current step | number invisible | white-on-white fixed: number visible, 4 px black border, colour CanvasText (screenshot read) |
| axe (wcag2a/aa, 21a/aa), serious or critical | n/a | 0 on Home, POI list, not-found page, wizard step 3 |
| CLS | POIs 0.018-0.069; Places 0.16-0.18; Home picker reorder shifts 0.0307 + 8x0.0082 | Dashboard 0.0167; POIs 0.062-0.079; Places 0.069; Home: only the 0.0167 boot shift, no row-reorder shifts |

- The 0.0167 shift is `<body>` margin 8 to 0 when Vite's CSS arrives. It is a dev-server artifact and also appears on the Dashboard.
- The CLS target of 0.02 is met on the Dashboard and Home only.
- The CLS probe confirms the head and card boxes match: skeleton head 51 px against loaded 51 px.
- The picker CLS probe stacks one observer per load, so its cumulative figures are 0.0167 per load.

Keyboard: Tab, Tab from Home reaches the logo link ("UNICHE, all projects"; focus screenshot `after/logo-focus-1440.png`). The wizard steps and the Continue focus were driven by script, not by keyboard.

Screenshots in `after/`:
- `home-*`, `pois-*`, `notfound-*` and `project-503-*` at 1440, 1024, 768 and zoom200
- `offline-pois-1440` and `offline-pois-768`
- wizard steps at 1440, 768 and zoom200, plus Arabic and forced colours
- `home-forced-1440`
- `switcher-open-1440`

Not covered:
- Home at 768 and zoom200 was captured but not read in detail.
- The configuration-error card with a mocked runtime config (evidence for row 4) was not exercised.
- Sign-in at 768 and zoom200 was not re-shot.

## Deferred or not done
- **List shifts:** the remaining shift on POIs and Places (0.05-0.06) is inside the list views: rows move when data lands, and the Places footer moves. That is P3-core and P3a (request 3).
- **Sign-in and session error:** the 768 and zoom200 sign-in shots and the configuration-error evidence are not done (see "Not covered").
- **zoom200 first field** is 359 px. There is 1 px of room.
- **e2e specs:** one selector changed (the not-found heading text). The spec is W0-A's file (request 1). Specs cannot run here (they need Keycloak).

## System additions
- `PageHead` offline behaviour for `#actions` (marker attribute `data-offline-blocked`).
- `SLUG_MAX` and `defaultOrigin` in `useCreateProject.ts`.
- `ProjectList` settle hold: the list draws once after the first reads (3 s cap).

## Notes for other packages
- W0-A `style.css`: `[aria-current] *` sets `HighlightText !important` on descendants, which beats `.forced-step-current` on a circle inside an `aria-current` element. P1 moved `aria-current` to the label. P2's first-run guide probably needs the same change, or the rule should exclude the class (request 4).
- P3a and P3b list views need no change for offline blocking.
