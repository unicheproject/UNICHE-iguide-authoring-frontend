# W0-A Foundations: changes

All work items A1 to A13 are done. A5 and the Event End value are partly closed (see Deferred). Typecheck (`vue-tsc -p tsconfig.app.json`) passes and `check-css-tokens` passes. A production build, run with a throwaway config because `vite-plus` is not installed in Windows `node_modules`, succeeds. `impeccable detect` on the changed files finds only the pre-existing Montserrat "overused font" warning. The literal-gate grep over the owned files returns nothing. Nothing was committed or installed.

Orchestrator: the running Vite process did NOT pick up changes to `tailwind.config.js`. The new colours (`primary-active`, `surface-active`) and `z-popover-over` render only after the dev server restarts, so restart it. I measured a production build instead, served at `http://localhost:5173` through Playwright routing, with the API relayed from Node. No server was started. The helper is `probes/dist.mjs`.

## C3 ids
- Fixed: C3-01, 02, 03, 04 (token and rule), 05, 06, 11, 26, 27, 49, 50, 84, 100, and the A10 part of 64.
- Mostly fixed:
  - C3-09: `focusSuccessor` exists and the toast dismiss, StateCard retry and confirm-return callers use it. Callers in other owners' files are in `requests.md`.
  - C3-38: the component validates field by field. The End rewrite is in the parent.
  - C3-44 and C3-48: `formatBytes`, `formatDistance` and `formatPercent` are in `lib/format.ts`; the hit-area classes and the HelpHint box are done. Adoption by `assets.ts` and the logo is in `requests.md`.
  - C3-85: one 503 sentence and one request-id row. Four surfaces owned by others still print "not reachable".
  - C3-92 and C3-93: Close order, anchored top, one alert.
- Fixed in the shared files: C3-94, plus the seed keys for C3-57/67 (glossary) and C3-63 (`.forced-step-current`).
- C3-12 (`FieldError` and announcer part): `DateTimeFields` and the field error announce once.

## Files changed
- Tokens and CSS: `src/style.css`, `tailwind.config.js`.
- Primitives:
  - `ui/button/index.ts`, `ui/tabs/{TabsList,LinkTabs,TabsTrigger}.vue`
  - `ui/dropdown-menu/{DropdownMenuItem,DropdownMenuContent}.vue`
  - `ui/popover/PopoverContent.vue`, `ui/tooltip/Tooltip.vue`
  - `ui/select/Select.vue`, `ui/checkbox/Checkbox.vue`, `ui/help-hint/HelpHint.vue`
  - `ui/input/Input.vue`, `ui/textarea/Textarea.vue`
  - `ui/field/{DateTimeFields,FormField,FormErrorSummary}.vue`
  - `ui/alert/{Alert,ProblemAlert}.vue`, `ui/alert/index.ts`
  - `ui/state-card/StateCard.vue`
  - `ui/dialog/FormDialog.vue`
- New component: `ui/alert/RequestIdRow.vue`.
- Shared components: `components/AppToast.vue`, `AppDialog.vue`, `ConfirmDialog.vue`.
- Stores and libs: `stores/toast.ts`, `stores/confirm.ts`, `lib/format.ts`, `lib/focus.ts`, `lib/glossary.ts`, `lib/toastOffset.ts`, `lib/routeAnnouncer.ts`.
- App entry: `router.ts`, `main.ts`. I did not need to edit `platform/auth.ts` or `App.vue`.
- e2e: `e2e/focus-and-gates.spec.ts` (new), `e2e/touch-and-forced-colours.spec.ts` (extended).
- Records: DECISIONS D-100 to D-106; QUESTIONS Q-021 and Q-022; GAPS G-043 to G-046; `ux-audit/round-3/implementation/requests.md` (new).
- Probes and screenshots: `ux-audit/round-3/implementation/W0-A/{probes,after}/`.

## Acceptance, measured (account admin; "before" is the round-3 audit number)
- **A1 ring.**
  - Primary button on the canvas: outline `rgb(76,29,139)`, 2 px solid, 2 px offset, no box-shadow. Ring against canvas is 10.37:1 (before: white, 1.0:1).
  - Primary button in the dialog: ring against the dialog surface is 11.32:1.
  - LinkTabs ring box is inside the scroller: 0 clipped sides (before: clipped).
  - Heading after a route change: H1, `outline-style: none`.
- **A2 pressed and menu highlight** (hover then active):
  - primary 58,20,105 to 45,15,82
  - secondary 238,240,243 to 221,225,230
  - ghost kebab 238,240,243 to 221,225,230
  - danger 0.9 alpha to 129,14,65
  - danger-outline tint to 0.2 alpha
  - tab transparent to 221,225,230
  - All six differ.
  - Menu highlight: fill `230,220,245` (1.32:1 on white, before 1.14:1) plus a 2 px solid inset `--ring` outline.
  - Forced colours: 1 of 7 items outlined, the rest `none`, no border on any item.
- **A5 DateTimeFields** (Event editor).
  - Hour 25, minute 61 and 31 February give three sentences: "Hour must be from 0 to 23.", "Minute must be from 0 to 59.", "February 2027 has 28 days."
  - Each has an icon (3 icons), the three parts are `aria-invalid`, `aria-describedby` points at each error id, and each was announced once, with the day sentence re-announced when the month or year is left.
  - End is not unchanged yet: the parent `EventEditorView` rewrites it (see Deferred).
- **A3 toasts.**
  - At 1440 and 1280 the toast `x` equals the side column `x` (1012 and 908), width 352 (equal to the side column's), right edge equal, so it does not cover the form column.
  - At 1024 the side column is stacked below the form, so the stack is full width with a 16 px gutter, as planned.
  - "Changes discarded" gets the check icon (the store maps it from "warning").
  - "Link copied" is 46 px high (limit 48).
  - Dismissing a toast moves focus to the next toast's dismiss button, then to the page h1. A stale toast is cleared on a route change.
- **A9 sign-in.** Before: the final URL was `/#state=…&session_state=…&iss=…&code=…`. After: `location.hash` is `""` and the final URL is `/`. History grew by 1, the identity-provider hop; no extra entry. The cause was the router capturing `location` at import time and restoring the hash on its first navigation; `main.ts` now does one `router.replace` before mounting.
- **A10.** `parseAppPreviewQuery` turns `orientation=landscape&real=1&surface=KIOSK&lang=el` into route props. Invalid values (`<script>`, `maybe`) give `{}`. It lives in `router.ts`; `AppPreviewView` already accepted these props.
- **A4 leave guard.** Cancel the guard from the switcher with Esc: `document.title` is unchanged (before it read "Dashboard · UX-P1"), focus is on the switcher button (before the h1), and no "Dashboard loaded" announcement. The cause was that `afterEach` also runs for cancelled navigations; it now returns when `failure` is set.
- **A6.**
  - 503 on Places, Events and POIs gives the identical sentence "The platform is busy or down for maintenance…" with exactly 1 request-id row and a Copy button.
  - `formatBytes(163000)` gives `159 KB` with U+00A0.
  - Arabic in the dialog Title keeps `dir=auto`, and the computed direction is `rtl`.
- **A7 dialogs.**
  - Tab from the dialog panel reaches "Close dialog" first in 6 of 6 create dialogs (Places, POIs, Routes, Guides, Events, Categories) and in the confirm dialog.
  - Dialog top is 88 px before and after the error summary (0 px jump).
  - Alerts in the dialog: 1 (the summary).
  - At zoom200 (640x360) "Create and open" spans top 295 to bottom 335, inside the 360 px viewport, with 0 page scroll.
- **A8.** `z-popover-over` computes to 51 and `modal` to 50. I did not open a real HelpHint inside a dialog (no HelpHint is reachable in a create dialog).
- **A11.** All 8 glossary keys are present.
- **axe** (wcag2a/aa and 21a/aa) found no serious or critical violations on:
  - the POI create dialog
  - the POI list
  - Maps
  - the Event editor
  - the Pages section
- **Out-of-scope screens.** Overview, Languages, Surfaces, Translations, Navigation and the Section view (`/pages`) all render (headings "Overview", "App settings" for Languages and Surfaces, "Translations", "Navigation", "Pages"), one screenshot each in `after/out-of-scope-*.png`.
- **Keyboard run.** Tab from the dialog panel, Esc, menu ArrowDown, ring on focus and toast-dismiss focus were all driven by keyboard in the probes.

## System additions
- Tokens:
  - `--ring-inverse`, `--primary-active`, `--destructive-active`, `--surface-active`, `--z-modal`
  - Tailwind: `primary-active`, `destructive-active`, `surface-active`, `ring-inverse`, `z-popover-over`, `h-logo` (1.625rem)
- CSS classes:
  - `.on-dark` (ring-inverse inside the preview stand-in)
  - `.forced-step-current`
  - `.nav-item:active` pressed step
- Components and APIs:
  - `RequestIdRow` (one request-id row).
  - `QUIET_FIELD_ERRORS` injection key exported from `FormField.vue`.
  - `ToastTone` `neutral`.
  - `focusSuccessor(removed, candidates)` in `lib/focus.ts`.
  - `confirmOpener()` in `stores/confirm.ts`.
  - `AppDialog` prop `returnFocusTo`.
  - `Select size="sm"`.
  - `Input` and `Textarea` default `dir="auto"`.
  - Date/time field (`DateTimeFields`): prop `ended`, event `validity`, per-part error ids `<id>-<part>-error`.
  - Toast stack: `toastDock` and `useToastDock` in `lib/toastOffset.ts`.
  - Formatting: `formatBytes`, `formatDistance`, `formatPercent`, `withUnit` and `NBSP` in `lib/format.ts`.
  - Router: `parseAppPreviewQuery` in `router.ts`.
- e2e: `focus-and-gates.spec.ts` was written but could not run (needs Keycloak). The two extra specs in `touch-and-forced-colours.spec.ts` (menu outline, screenshot) are also unrun. The type check of `tsconfig.node.json` showed no new errors outside `vite.config.ts`.

## Deferred or partly done, and why
- **Event End still rewritten.** `EventEditorView.setStart` is P5b's file; request 1 in `requests.md`. `DateTimeFields` emits `""` while a part is wrong and never another value.
- **Select list highlight.** The `Select` is a native `<select>`, so its highlight belongs to the platform.
- **`h-logo`.** The class compiles only when P1 uses it (Tailwind builds used classes only).
- **"One announcement by bar or toast, not both"** depends on the callers (RemovedBar, lists); not done here.
- **StateCard top alignment.** I did not compare card heights across pages; not changed.
- **HelpHint box.** Not measured, because no HelpHint is reachable on the tested screens. The 40 px class change is in place and `size-10` is a Tailwind default, so it will compile.
- **Toast probe at 1024.** The side column stacks below the form there, which is the full-width mode of the plan.

## Notes for other packages
- `requests.md` has 9 items. The main ones:
  - P5b: stop recomputing End from an invalid Start.
  - W0-B: pass tone `neutral` for the Discard toast.
  - W0-B and P7: `assets.ts` should re-export `formatBytes` from `@/lib/format`.
  - P1, P4 and W0-B: replace the four "not reachable" surfaces with `problemText(503)`.
  - P8: add class `on-dark` to the stand-in.
  - P1 and P2: apply `.forced-step-current`; use `h-logo` with `hit-44`.
- `EditorShell` still publishes `--toast-inset-right`. The toast ignores it whenever `#editor-side-column` exists, so W0-B may drop it.
