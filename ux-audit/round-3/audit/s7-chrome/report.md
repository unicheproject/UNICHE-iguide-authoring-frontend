# s7-chrome — Round 3
Specialist for sign-in, session/error states, header, nav, page heads, toasts, dialogs, loading, HelpHint, picker. Admin account, Populated project, own browser only. Scripts `a1..a16.mjs` and `h.mjs`, shots in `shots/`. impeccable: Operate mode, interview skipped (subagent). Rules cited: critique "Viewable targets require browser inspection"; audit "keyboard navigation: missing focus indicators / keyboard traps"; polish "classify each drift (missing token, one-off, local defect)"; operate "product UI fails by strangeness without purpose, trust comes from consistent components".

## Verdict
Chrome is solid and consistent: header/nav geometry is exact, every chrome control has a 2 px visible focus ring, forced colours and Esc orders work, errors never leak server text. No P0/P1. What is left is state-polish: offline banner sits on the primary action, skeleton to content shifts (CLS up to 0.114), two dialects of error card with different 503 wording, HelpHint still 32 px, a few focus/announcement leaks.
Score range: 78 (offline) to 91 (sign-in). P0 0, P1 0, P2 6, P3 13.

## Context check
12-cms-experience: offline CMS keeps loaded content readable and disables changes (seen in banner copy). 14 §4: visible focus, errors announced. 03 §1: lifecycle vocabulary, no "published" seen in any chrome string. DECISIONS D-087: errors are sentences chosen by code, never server text (canary SECRET-DETAIL never rendered in 11 forced 4xx/5xx states). PRODUCT.md: tablets and speed, drawer < 1100 px confirmed (menu button 44x44 at 1024/768).

## Scores
| Screen / state | Task 25 | Craft 20 | Consist 15 | Copy 15 | A11y 15 | Resp/states 10 | Total |
|---|---|---|---|---|---|---|---|
| Sign-in view | 24 | 18 | 14 | 14 | 14 | 9 | 93 |
| Session ended dialog / keeps ending / unreachable | 22 | 17 | 12 | 13 | 12 | 8 | 84 |
| Error cards 403/404/5xx, Page not found | 22 | 17 | 11 | 12 | 14 | 9 | 85 |
| Offline banner | 18 | 14 | 12 | 13 | 12 | 8 | 77 |
| Header + switcher + user menu | 23 | 19 | 14 | 14 | 13 | 9 | 92 |
| Left nav + drawer | 24 | 19 | 14 | 14 | 14 | 9 | 94 |
| Page heads / Dashboard status slot | 23 | 18 | 13 | 14 | 14 | 9 | 91 |
| Toasts | 21 | 17 | 13 | 13 | 12 | 8 | 84 |
| Dialogs (pattern) | 22 | 17 | 14 | 14 | 14 | 6 | 87 |
| Loading skeletons | 20 | 14 | 12 | 14 | 12 | 7 | 79 |
| HelpHint | 20 | 15 | 13 | 14 | 12 | 8 | 82 |
| Home / picker | 21 | 16 | 12 | 12 | 14 | 9 | 84 |
Nielsen (0-4): visibility 3, match 4, control 3, consistency 3, error prevention 3, recognition 3, flexibility 3, minimal 3, error recovery 4, help 3 = 32/40.

## Round-2 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C2-02 forced colours | fixed | forced 1440: dialog 1px black border, toast border, nav items boxed, active nav Highlight bg (`chrome__forced__1440`, `switcher__forced__1440`, `toast__warning-forced__1440`) |
| C2-07/C2-25 chip race | fixed | switcher chip "App: Draft" present after load; skeleton shows "Loading projects" while pending; tab title keeps project name on /pois, /places... |
| C2-08 picker honesty | partly | honest, but 16/18 rows carry "Setup not checked" pill, "(10+)" Home vs "(9+)" switcher, R3-s7-chrome-14 |
| C2-09 server text | fixed | canary absent on 403/404/500/502/503/504 project and list states; request id shown |
| C2-10 write 403/404 | unverified | no write path in remit |
| C2-11 offline | partly | h1 top 80 before/after (shift 0), one alert; but New button not aria-disabled and covered (R3-s7-chrome-01) |
| C2-12 toasts | partly | x3 collapse works, one role per tone, hover pause holds past 7.5 s; keyboard dismiss drops focus, toast overlaps form 5 px (-10, -12, -13) |
| C2-13 error/unknown routes | partly | h1 focused on all 12 states, bad id and unknown routes show Page not found, header chip cleared; "keeps ending" page still announces "Places loaded" (-06) |
| C2-14 code in URL | fixed | location after sessions has no hash; live redirect not repeated |
| C2-15 session small | fixed | Esc closes session dialog and focus returns to h1; "Stay on this page" present; Home no repeat; switcher 40 rows scroll within 772 px |
| C2-16 switcher name | partly | dialog name "Switch project"; trigger still has `aria-controls=""` (-04) |
| C2-17 user menu | fixed | click opens, Esc returns to trigger |
| C2-18 leave confirm from switcher | partly | confirm focuses its h2; Esc returns to editor h1, not the switcher trigger (-05) |
| C2-19 nav Off items | fixed | all 17 nav items 36 px, one line |
| C2-20 duplicate landmarks | unverified | axe not rerun |
| C2-21 loading | partly | nav inert, "Loading Points of Interest" status; skeleton has no h1, CLS up to 0.114 (-03) |
| R2-V-02 HelpHint 32 px | not fixed | 32x32 on Dashboard and POI editor (`HINTS` log) |
| R2-V-04 toast inset | partly | stack right 996 vs form column right 991: 5 px overlap, covers Details card (`toast__link-copied__1440`) |

## Findings
**R3-s7-chrome-01 · P2 · Offline banner covers the primary action; "disabled" claim not true.** POI list 1440, offline. Banner box [872,64,544,81]; "New point of interest" box starts at y 80, `elementFromPoint` at its centre is the banner's "Check again" button. Button has `aria-disabled=null`; Enter opens the Create dialog, which then refuses on submit ("You are offline, so nothing was saved"). Shots `offline__poilist__1440`, `offline__create-submit__1440`. Why: a user clicking New hits Check again; the banner says changes are disabled while the control is live. Fix: put the banner in a reserved row under the header only when it overlaps page heads, or place bottom-left; set `aria-disabled` + offlineReason on page-head primary actions. Files `OfflineBanner.vue`, `PageHead.vue`, list views. Effort S-M.

**R3-s7-chrome-02 · P3 · HelpHint is 32 px at fine pointer (R2-V-02 open).** All hints measured 32x32 (`help-hint/HelpHint.vue` `size-8`); coarse is 44. Fix `size-10`. S.

**R3-s7-chrome-03 · P2 · Skeleton to content shifts.** 1.2 s delayed API, CLS: Places 0.112, Routes 0.114, Guides 0.110, Events 0.076, POIs 0.068 (Categories, Maps, Media 0.017 baseline). Skeleton rows are 48 px, real rows 73 px; skeleton has no white card frame and no `h1` at all while loading (`h1: undefined`, `loading__poi-skeleton__1440` vs `loading__poi-loaded__1440`). Fix: skeleton rows at real row height inside the card, render the h1 (route title is known) in the skeleton. Files `ProjectLayout.vue`, list skeletons. M.

**R3-s7-chrome-04 · P3 · Switcher trigger still has `aria-controls=""`** (C2-16 remnant). `ProjectSwitcher.vue`. S.

**R3-s7-chrome-05 · P3 · Esc on the unsaved-work confirm opened from the switcher lands on the editor h1**, not the switcher trigger (measured, `switch-unsaved__confirm__1440`). Esc order itself is right (confirm first, popover already closed). S.

**R3-s7-chrome-06 · P2 · "Your session keeps ending" page announces "Places loaded".** After a forced 401 loop the route announcer live region reads "Places loaded" while the page shows the error (C2-13 asked for this to stop). `lib/routeAnnouncer.ts`. S.

**R3-s7-chrome-07 · P3 · Full-page cards sit at different heights.** Sign-in, "keeps ending", "did not start" cards top 144 px; Project 403/404/5xx and Page not found cards top 80 px (same 576 px width). `SessionErrorView/SignInView` use `mt-6 sm:mt-16`, `StateCard` in `ProjectLayout/NotFoundView` none. Pick one. S.

**R3-s7-chrome-08 · P2 · Same failure, two sentences and two card styles.** Project load 502/503/504 all read "The UNICHE platform is not reachable / The CMS cannot check your access right now" (503 is "busy", D-087). A list 503 reads "The platform is busy... a few minutes". The ProblemAlert renders "Request id", the id and the "Copy request id" button label entirely in monospace and bold; StateCard uses sans label, mono id, "Copy" (`err503__project__1440` vs `err503__poilist__1440`). Fix: share the request-id row component; 503 wording from one map. `lib/errors.ts`, `ProjectLayout.vue`, `ui/alert`. S.

**R3-s7-chrome-09 · P3 · Dashboard h1 is 3 px lower than every other page** (top 83 vs 80, all other 11 routes 80; `#status` row is 32 px high vs 26 px h1; subtitle 116). Align h1 to the row's top or make the row 26 px. `PageHead.vue`. S.

**R3-s7-chrome-10 · P2 · Create dialog at zoom 200 hides its primary action.** 640x360: dialog 328 px, body scroll height 456 in a 278 px body, "Create and open" bottom at 517 (off-screen, inline footer). Only Title, Place, Category visible (`dialog__create-poi__zoom200`). Fix: sticky footer when dialog height > 70 % of viewport. `AppDialog.vue`. S.

**R3-s7-chrome-11 · P3 · Create dialog jumps when the error summary appears:** height 619 to 718, top 141 to 91 at 1440 (50 px jump of the title). Anchor top or reserve. S.

**R3-s7-chrome-12 · P3 · Keyboard dismiss drops focus.** Focus a toast's "Dismiss notification" and press Enter: `document.activeElement` becomes BODY (40+ Tabs from the header). Move focus to the control that raised the toast or the next toast. `AppToast.vue`. S.

**R3-s7-chrome-13 · P3 · Toast still overlaps the form column (R2-V-04).** Stack right 996, form column right 991, toast [612,774,384,110] covers the Details card bottom-right. Set `--toast-inset-right` to column end + 8 or move the stack into the side column. `toastOffset.ts`. S.

**R3-s7-chrome-14 · P2 · Picker noise and mismatched counts.** Home: 16 of 18 rows carry an outlined "Setup not checked" pill that never resolves; group titled "Needs setup (10+)" on Home but "(9+)" in the switcher at the same moment; "Needs setup" header has a chevron and sits 12 px right of "Test Museum (18)" (text left 268 vs 256), same 12/600 type (`home__default__1440`, `switcher__open__1440`). Fix: drop the pill for unread rows (state only when known) and stop showing "n+" counts. `ProjectList.vue`. S.

**R3-s7-chrome-15 · P3 · Warning toast with an instruction auto-dismisses.** "The link was not copied. Select it and copy it by hand." disappears after 8 s (persist false). Make it persist. S.

**R3-s7-chrome-16 · P3 · Nav pressed state equals hover** (both bg rgb(238,240,243)); while nav is inert during loading it looks fully live (no dim, no cue). `WorkspaceNav.vue`. S.

**R3-s7-chrome-17 · P3 · Drawer dialog is named "Primary"** while its trigger is "Menu" and its visible title "Menu". Use "Menu". S.

**R3-s7-chrome-18 · P3 · Copy nits.** Page-not-found h1 "This page does not exist" vs document title and brief "Page not found"; Home subtitle ends with a period, page-head subtitles ("Objects and spots visitors can open directly") do not; dialog h2 is 16/700 beside 20 page h1 and 24 state-card h1. S.

## What works
- Header geometry exact: height 56, logo/switcher/user menu vertical centres all 27.5; nav icons 20 px centred on 36 px items, pitch 38, active item 3 px inset bar plus fw 600 plus aria-current.
- Focus ring: 2 px solid, 2 px offset on all 28 chrome tab stops; skip link first; user menu and switcher return focus on Esc; drawer opens on current item, Esc returns to `#nav-toggle`, 44 px menu button.
- Page head identical on 11 routes (20/700, left 256, top 80); toasts, dialogs, popovers share radius 12/8 and shadow tiers; toast hover pause, x3 collapse, one role per tone verified.
- Error cards: focus on h1, request id with Copy, no server text, soft-deleted Project explained with Portal pointer, unknown routes and bad ids give Page not found with one next step.
- Dialog: Esc order correct (confirm then dialog), focus trap cycles, forced-colours border, reduced motion keeps 120 ms fade, leave-confirm copy clear.

## Unverified / could not test
Configuration-error card (needs a missing runtime setting; I did not alter config). Upload toast and 409 dialog (other agents' remit, write paths). Real browser Keycloak redirect for C2-14. axe for C2-20 not rerun. Greek/RTL strings in chrome not injected (no project data change allowed). Sign-in at 768/zoom200 not shot (Home was).
