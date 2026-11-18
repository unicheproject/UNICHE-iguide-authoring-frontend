
## From W0 stage 0.2 (editor shell)

1. `src/components/ui/field`, `ui/input` and `ui/textarea` have no `index.ts`, although `system.md` section 2 says to import `{ FormField } from "@/components/ui/field"`, `{ Input }`, `{ Textarea }`. Stage 0.2 imports the `.vue` files directly (`@/components/ui/field/FormField.vue`). Please add the three barrels (or correct `system.md`).
2. `src/components/AppDialog.vue`: the `popover` prop has no caller left (the editor "Preview in app" is the inline `PreviewPanel`, D-075). Remove the mode when convenient.
3. `src/components/ui/help-hint/HelpHint.vue`: the trigger is 32 px (44 coarse) and inline-flex; fine in the Working Copy banner, but it has no way to sit tight against a sentence (no `class` pass-through because the root is a Popover). Optional.

## P8
- `src/views/workspace/navigation/NavigationView.vue` mounts `DeviceFrame` + `PreviewApp` bare. They still work (fit width), but the
  stand-in there is not `inert` and has no "Skip preview" link. Wrap it in `PreviewPane` (props `surface`, `label`, `dir`, `lang`; v-model:interactive).
- `src/components/AppHeader.vue` (project switcher button): axe `label-content-name-mismatch` (serious), seen on every page including the Preview.
- `PreviewPanel.vue` (stage 0.2): its own `aria-label="Preview in app, showing the form as it stands"` group wraps the new region; fine, but could be dropped.

## From P3a
- Header (`AppHeader`/`ProjectSwitcher`): axe serious `label-content-name-mismatch` on the Project switcher button (`aria-label="Project: ..."`) and the account menu button (`aria-label="D. Curator, account menu"`): the accessible name must contain the visible text. Present on every page.
- `ui/select/Select.vue` was changed by P3a (id and attrs reach the native select); `list/ListSelect` can later be replaced by it.

## From P1 (Project picker, Create Project, session states)

- `src/components/AppHeader.vue` (W0): the account menu button has `aria-label="P. Admin, account menu"` while its visible
  text is the initials and the name, so axe reports `label-content-name-mismatch` (serious) on every screen. Make the
  accessible name start with the visible text ("P. Admin, account menu" after removing the visible initials from the
  name computation, or use `aria-labelledby` on the visible name span plus a visually hidden "account menu").
- `src/components/ui/select/Select.vue` (W0): `id` and `aria-describedby` land on the wrapper `<span>`, so a `<label for>`
  does not reach the select. Add `inheritAttrs: false` and bind `$attrs` to the `<select>`. P1 uses a native `<select class="ui-field">` meanwhile.
- `index.html` splash (W0): already says "Checking your UNICHE session…"; it has no logo (plan 2.4 asks for a branded skeleton).
- `src/components/SessionEndedDialog.vue` (W0) works unchanged: the redirect cap is recorded inside `platform/auth.ts` `login()`.
- New P1-owned helper outside the listed files: `src/views/heldTitle.ts` (keeps a full-page state's document title) and `src/components/ProjectList.vue`.

## From P3b
1. `src/components/ui/dialog/FormDialog.vue`: add optional props `titleLabel` (default "Title"; the Category dialog needs "Name", `12` §3 / `03` §10 say `name`) and `slugLabel` (default "Slug"; Category's platform field is `code`, so the dialog and its error summary could say "Code" like the Category editor). Until then the Category dialog shows "Title" and "Slug" and maps the platform's `code`/`name` errors onto them.
2. `src/lib/format.ts`: export `UI_LOCALE` (or add a `formatTime`/`formatOccurrence` that uses it) and make `platform/events.formatOccurrence` use it instead of `undefined` (browser locale, which mixed en-US with the en-GB "Updated" dates). P3b ships `views/workspace/events/eventDates.ts` (en-GB constant, Project timezone) as the interim; P5b should adopt or replace it so the Event editor and list agree.
3. `ux-audit/.../P3a` helpers (`useListLifecycle`, `LifecycleDialogs`, `listRows`) live in `src/views/workspace/` outside any package's ownership list; assign them to W0 in plan §9.

## From P7 (Media)
- `src/components/editor/EditorShell.vue` (W0.2): at 200 % zoom (640 css px wide) the page scrolls as a whole and `#main` is not the scroll container, so neither the shell's sticky header nor a sticky element inside the form column sticks (the Asset editor's preview strip scrolls away there; it sticks at 1280 and 768). Make `#main` the scroller at every width or use `position: sticky` against the window.
- `src/components/AppHeader.vue` / project switcher (P1): axe `label-content-name-mismatch` (serious) on the account menu button ("D. Curator, account menu" vs visible text) and the Project switcher button; present on every screen.
- `src/views/workspace/events/EntityCombobox.vue(35,7)`: unused `input` (TS6133) breaks `vue-tsc` while P5b is mid-edit.
- `src/views/createProject/StepReview.vue` was mid-edit (unclosed element) and showed the Vite error overlay while P7 captured; screenshots remove the overlay.

## From W0-fixup
- To P5b (`events/*Editor*`, `EventsListView`, `eventDates.ts`): `lib/format.ts` now exports `UI_LOCALE` ("en-GB"), `formatDayInZone`, `formatTimeInZone` (24-hour) and `formatOccurrenceSpan`; `platform/events.formatOccurrence` delegates to `formatOccurrenceSpan`, so it is en-GB like the "Updated" dates. `eventDates.ts` (DATE_LOCALE, formatEventDay/Time/Span) is output-identical and can re-export these or stay; do not mix locales.
- `FormDialog` has new optional props `titleLabel`, `slugLabel`, `slugHint`; the Category create dialog now passes "Name"/"Code".
- `ui/*` barrels now exist for field, input, textarea, switch, spinner, dialog (`import { FormDialog } from "@/components/ui/dialog"`).
- `HelpHint` accepts `class` (merged onto the button).

### W0-fixup status of requests above
- W0.2 1 (barrels): done (field/input already had one; added textarea, switch, spinner, dialog).
- W0.2 2 (AppDialog popover): done, no caller (grep), mode, placement code and styles removed.
- W0.2 3 (HelpHint class): done.
- P8 NavigationView PreviewPane wrap: out of scope (NavigationView untouched by order).
- P8 PreviewPanel redundant group label: done (removed; the PreviewPane region stays the one label).
- P8/P3a/P1/P7 header axe label-content-name-mismatch: done (see changes.md for axe numbers).
- P3a/P1 Select id/aria-describedby: already done by P3a (attrs go to the native select, verified in source).
- P1 index.html splash: done (inline mark, tokens, skeleton, no requests).
- P3b 1 (FormDialog labels): done. P3b 2 (UI_LOCALE/formatOccurrence): done. P3b 3 (helpers ownership): vue-tsc clean, no change needed.
- P7 200 % zoom scroller: done (`.app-shell` height lock now from 300 px viewport height, was 420).
- P7 EntityCombobox TS6133: not in my files; vue-tsc currently passes.
- P7 StepReview mid-edit: not mine.

## From P4 (Place and POI editors, TriggersCard, media slots)

- `src/views/workspace/PreviewView.vue` (P8): the triggers card links each saved row's "Test in preview" to
  `{ name: "preview", query: { trigger: "<trigger id>" } }` (no query for an unsaved row). Please read `route.query.trigger`
  on open: select that trigger in "Fire a trigger" (and its surface) so the author lands on it ready to Fire. Without it the
  link just opens the Preview, which is still a working path.
- `src/components/editor/EditorShell.vue` / `ReadinessList.vue` (W0): no hook yet for editor-supplied client-known readiness
  lines. P4's `MediaSlots` warns in the card ("X is still a draft") when a DRAFT Asset is bound to an ACTIVE item; if the shell
  offers an optional `extraReadiness` prop or slot, P4 will feed those lines.
- P5a/P5b: `TriggersCard` now renders its own `EditorSection` (id `triggers`, title "How visitors reach it"); do not wrap it again.
  Validate its rows with `checkTriggers(form.triggers, found)` from `@/platform/triggers` inside `validate()`.
