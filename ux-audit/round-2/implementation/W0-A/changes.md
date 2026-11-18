# W0-A changes (foundations, errors, focus, time, chrome store race)

## Closed (consolidated IDs)
C2-01, C2-02, C2-04, C2-07, C2-09, C2-10 (copy), C2-12/C2-13 (404 page, StateCard focus), C2-16/C2-18/C2-20 (shared focus paths), C2-52 (formatter and DateTimeFields built; callers outside shared files remain), C2-57 (shared fallback; per-screen use is Wave 1), C2-76 (dialog initial focus), C2-94 (loader API), C2-03 (duplicate `ReorderControls.vue` deleted).

## Files
- Tokens/CSS: `tailwind.config.js`, `src/style.css`, `scripts/check-css-tokens.mjs` (new), `Makefile` (`check-css`), `package.json` (`check:css`).
- Errors: `src/lib/problemText.ts` (new), `src/lib/errors.ts`, `src/platform/api.ts` (message/field text only), `ui/alert/ProblemAlert.vue` (new), `src/stores/toast.ts`, `AppToast.vue`, `src/lib/glossary.ts` (11 hints/terms).
- Focus: `src/lib/focus.ts`, `AppDialog.vue`, `ui/state-card/StateCard.vue`; `ui/popover/PopoverContent.vue`, `ui/dropdown-menu/DropdownMenuContent.vue` (attrs reach the surface).
- Store/router: `src/stores/projects.ts`, `src/lib/routeAnnouncer.ts`, `src/router.ts`, `src/views/NotFoundView.vue` (new), `ProjectLayout.vue` (one line), `src/workspace/useProjectLanguages.ts`.
- Time: `src/lib/format.ts`, `ui/field/DateTimeFields.vue` (new).
- Sizes: `editor/ReorderControls.vue`, `editor/RemovedBar.vue`, `WorkspaceNav.vue` (`h-header`), `AppToast.vue`, `AppDialog.vue` use `size-control`.
- Deleted: `src/components/ReorderControls.vue` (no importer).
- e2e: `e2e/touch-and-forced-colours.spec.ts` (new, not run: needs Keycloak). `screens.spec.ts` selectors unaffected.
- Docs: DECISIONS D-086, D-087, D-088; QUESTIONS Q-017..Q-020; GAPS G-037..G-042; `requests.md` ("From W0-A"); `system.md` round-2 additions.

## Acceptance (Windows Node, admin, Populated; scripts `verify*.mjs` here)
- Icon-only buttons: POI list 40x40 (1440, 1024, 768, zoom200: 0 under 40 px), 44x44 with touch; POI editor "More actions" 40 (44 touch); HelpHint buttons stay 32 (44 touch) because they sit in running text.
- Reload `/projects/<id>/pois` x4: chip "App: Draft" and title "Points of Interest · UX Audit – Populated · iGuide CMS" every time, 1.9-2.3 s.
- `/projects/not-a-uuid` and `/projects/<id>/nonsense`: 404 card, focus on its h1, title "Page not found · …".
- Errors via `page.route`: 503 with `detail: "NullPointerException at X"` and 403 with `detail: "Not allowed for secret-user-123"` and a title `SECRET-TITLE-xyz`: none of them in the DOM; request id shown; 503 shows "busy or down for maintenance"; 500 on POI create shows the fixed sentence plus request id.
- Focus: Upload dialog opens on its heading (no hidden or checkbox input), Esc returns to "Upload files"; Archive dialog opens on its heading, Esc returns to the row's Actions button; switcher Esc returns to the switcher; `restoreFocus` with a removed opener lands on `main h1`; `focusAfterRemoval` lands on the neighbour.
- Forced colours (screenshots in `after/`): dialog (1 px boundary), menu, dialog error alert, POI editor (selected tab, nav item, breadcrumb filled with Highlight, readable), Preview tabs. Reduced motion: dialog fades 0.12 s, skeleton `animation: none`.
- Toast: five identical errors show one "x5".
- Formatter: "4 Sep 2026", "16:05", "16 Nov 2026, 14:05" (also for `en-US`), ranges incl. across days; no AM/PM.
- DateTimeFields: 31 April gives "", 30 April gives a value, hour 25 gives "", minute pads to 05; axe clean.
- axe (serious/critical and all A/AA): POI list, switcher open, create dialog, POI editor, 404, page with DateTimeFields: clean.
- `vue-tsc` passes; `make check-css` passes (and fails with `size-control` removed: verified); `impeccable detect` on changed files: `[]`; gate grep empty.

## Deferred / notes
- The Vite dev server did not reload `tailwind.config.js`; screenshots and size numbers were taken with a fresh CLI build of the CSS swapped in. Restart the dev server before the gate (also in `requests.md`).
- Toast `--toast-offset-bottom` is read but nobody sets it yet (W0-B/P4s sticky footers).
- C2-04 beyond the opacity rule, C2-12/16/18/20 per-screen verification: Wave 1 (picker attach, Restore, list actions call `restoreFocus`/`focusAfterRemoval`).
- Switcher chip skeleton time-box (3 s) is in `ProjectSwitcher.vue` (P1); the store exposes `detailState`.
- Raw `error.message` call sites are now safe; replacing them by `ProblemAlert` is a Wave 1 task (list in `requests.md`).
- Unlayered rules in `style.css` are emitted before Tailwind utilities, hence `!important` on the forced-colours selected state.
