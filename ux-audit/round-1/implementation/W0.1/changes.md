# W0 stage 0.1: tokens, primitives, shell

## Closed (consolidated IDs)
C1-01, C1-05 (type scale, self-hosted Montserrat), C1-06 to C1-09 (P0 field border 4.26:1, placeholder 5.63:1, muted ink, focus ring), C1-10 (one Button/Chip),
C1-58 (nav icons, Media top level, Off chip, drawer), C1-63/C1-67/C1-68 (components: Alert, StateCard, toast stack, offline rule),
C1-75, C1-76 (Help removed, Manage members via portalUrl), C1-77, C1-78 (title/focus/announce), C1-119, C1-122 (skip link, route focus), C1-123/C1-124 (hit areas, tokens).
Partly: C1-61, C1-64..66 (session dialog and describeError exist, wiring is P1's). Not closed here (0.2/0.3/Wave 1): the screens still using px classes.

## Files
Changed: `src/style.css`, `tailwind.config.js`, `index.html`, `src/styles/list-table.css`, `src/App.vue`, `src/router.ts`, `src/components/{AppHeader,WorkspaceNav,PageHead,SectionTabs,AppBreadcrumbs,AppDialog,ConfirmDialog,AppToast,OfflineBanner,StatusChip,StatusChangeDialog}.vue`,
`src/components/ui/button/*`, `src/lib/{focus,format}.ts`, `src/stores/{toast,connection}.ts`, `src/workspace/sections.ts`, `e2e/support/a11y.ts` (+`expectSolidFillContrast`), `e2e/content-lists.spec.ts` (calls it; gradient check kept).
Added: `src/components/{PageFrame,CapabilityNotice,SessionEndedDialog}.vue`, `src/components/ui/{chip,input,textarea,select,checkbox,switch,field,tabs,popover,dropdown-menu,tooltip,alert,skeleton,empty-state,state-card,spinner,help-hint}/*`,
`src/lib/{announcer,errors,glossary,routeAnnouncer}.ts`, `src/stores/{sessionNotice,navDrawer}.ts`, `src/assets/uniche-logo.png`, `public/fonts/montserrat-{latin,latin-ext,cyrillic}-var.woff2`, `public/fonts/OFL.txt`, `ux-audit/round-1/implementation/system.md`, `W0.1/capture.mjs`.
Not touched: editor shell, list scaffold, `ProjectSwitcher`, `ProjectLayout`, `main.ts` (nothing needed), `stores/confirm.ts` (nothing needed), `lib/utils.ts`.

## Records
DECISIONS.md D-069, D-070, D-071, D-072, D-073, D-078, D-083 (one heredoc each). QUESTIONS.md Q-008..Q-016 and GAPS.md G-023..G-036 (one `cat >>` each, from plan section 8, under a new "Open: UX overhaul, Round 1" heading because both files end in a Closed/table section).

## Acceptance
- `vue-tsc -b`: clean for `src` (only error: `vite-plus` missing in `vite.config.ts`, environment). Build: `vite build` on Windows Node with a temp config without `vite-plus` passes (6.9 s). `make typecheck`/`make build` themselves cannot run here (no `make`, no `vp`, Windows Node 22.12 is below pnpm's minimum).
- Check 1 (probe, 1440): text under 12 px inside W0-owned markup: 0. Remaining under-12 px and uppercase text comes only from unmigrated views and `ProjectSwitcher` (Dashboard 7, POI list 550, POI editor 58, Home 1 nodes; uppercase 6 / 171 / 45 / 0). Input border on the POI editor: rgb(115,123,139) 1 px (4.26:1); the POI list search field still shows the legacy pale border (`ListFilterMenu`, 0.3). axe (wcag2a/aa/21): only violation in W0 code was `label-content-name-mismatch` on the account menu, fixed; remaining: `color-contrast` x3 on legacy trigger chips in the POI list (0.3). Picker, Dashboard, POI editor: clean after the fix (re-run of axe on the fix not repeated).
- Check 2: grep `text-[Npx]|rounded-[|shadow-[|z-[|tracking-[|uppercase|gray-|hex` over W0 files: 0 matches (one deprecated `statusGlyph` glyph kept for ProjectSwitcher/Home/Translations). `impeccable detect`: 5 findings, all accepted: "overused-font" x4 (Montserrat is pinned by the owner brief) and "cramped-padding" on the `index.html` pre-mount placeholder (false positive).
- Check 3: first Tab stop "Skip to content"; after in-app navigation focus is on `H1 "Points of Interest"`, title "Points of Interest · UX Audit – Populated · iGuide CMS", polite region "Points of Interest loaded". Drawer: Esc/focus return/arrow keys implemented, screenshot-verified open state only (Esc path not driven by script).
- Check 4: screenshots in `W0.1/after/` at 1440, 1024, 768, zoom200 (home, dashboard, poi-list, poi-editor, create dialog), drawer at 1024 and 768, forced-colours dashboard and POI list (nav items, chips, account button show boundaries; current item Highlight outline), Overview and Languages at 1440 (render). Reduced motion: 0 running infinite animations (no skeleton was on screen to sample).
- Check 5: Overview, Languages render; axe on them only the account-menu mismatch (fixed). Surfaces, Translations, Navigation, placeholder not screenshotted.
- e2e specs not run (need local Keycloak).

## Deferred / know before 0.2, 0.3, Wave 1
- Montserrat has no Greek glyphs: no Greek file shipped, Greek uses the system sans (D-071). Needs an owner choice if a webfont is wanted.
- Offline banner does not yet reserve its height (shifts content when it appears). `StatusChangeDialog` restyled only; 0.2 owns further change. AppDialog `popover` mode kept for `EditorShell` until `PreviewPanel`.
- Create dialogs carry local scoped `.field-input`/`.field-label` CSS (old pills, pale borders, uppercase): they shadow the new aliases until P3a/P3b replace them with `FormDialog`.
- Global `a { text-decoration: underline }` now underlines every unmigrated router link (by design, plan 1.4).
- New APIs: see `system.md`. `SessionEndedDialog` needs P1 to call `markSessionEnded()`. `FormDialog` and `list/*` are stage 0.3. `PageFrame` is not yet used by any view (views keep their own `<main>`; route focus finds either).
- A temporary Vite dev server (Windows Node, `.tmp-dev.config.mjs` in the repo root, port 5173) was started by this agent for screenshots and is still running; stop it before `make dev` and delete `.tmp-dev.config.mjs`.
