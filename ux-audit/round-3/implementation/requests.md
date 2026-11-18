
## From W0-B

- P7b (`AssetEditorView.vue`): pass `baseBlocks: false` to `completenessOf` explicitly (D-107); W0-B's default only covers images with alt slots.
- P5a (`RouteEditorView.vue`) and P5b (`EventEditorView.vue`): pass `gaps: routeGaps(form.stops.length)` / `eventGaps(form.occurrences.length)` (exported from `platform/completeness.ts`) to `completenessOf` so the structural warning follows unsaved edits; until then the shell adds it from the saved Resource.
- P4 (`PoiEditorView.vue`, `PlaceEditorView.vue`, `platform/triggers.ts`, `TriggersCard.vue`): use the new `onPartialSave(saved)` option of `useResourceEditor` to replace trigger rows with the saved ones and keep only failed rows (`rowKey`); map the own-record duplicate to "already saved on this item"; mark the failed row in the error summary.
- P8 (`PreviewPanel`): `inject(EDITOR_PREVIEW)` from `EditorShell` and render Expand and Close in the panel header. The shell's "Preview in app / Close preview" toggle and the panel's own Close remain until then; the shell still applies the expanded max-height class.
- P3-core: write `back=listBackQuery(route.query)` on title links (`workspace/listBack.ts`).
- P5b/P7b: remove local Texts heading gap overrides; `TranslationsPanel` is one root with a 0 heading-to-tabs gap.
- W0-A: nothing required. `Select size="sm"` exists; ReorderControls uses the default 40 px select instead (C3-36 asks 40 px).

## From W0-A (Foundations)

1. `src/views/workspace/events/EventEditorView.vue` (P5b), `onStartInput` around lines 343-365: when the Start model is "" (a
   part is wrong, `DateTimeFields` now emits "" and never another value, and a `validity` event says why), do not
   recompute End (today End becomes 1 Jan 2000 03:00). Compare End with Start only when Start is valid; pass `:ended` to
   `DateTimeFields` for a valid past date instead of `opacity-80` + the "Ended" chip; listen to `@validity` to block Save
   while a part is wrong (the model is "" then, which already reads as "not entered").
2. `src/workspace/useResourceEditor.ts` line ~802 (W0-B): the Discard toast passes `"warning"`; pass `"neutral"` (check icon).
   The store maps by title in the meantime ("Changes discarded", "Archived", "Restored", "Link copied").
3. `src/components/editor/QrCodePreview.vue` (P4) line 36: `showToast("Link copied")` without the URL body (one line, 40 px);
   it still works unchanged because the store drops the body of "Link copied".
4. `src/platform/assets.ts` (W0-B/P7): `formatBytes` now exists in `@/lib/format` with a no-break space; replace the local
   function with `export { formatBytes } from "@/lib/format"` (acceptance: `formatBytes(163000)` contains U+00A0).
5. Surfaces that print "The UNICHE platform is not reachable" for a platform 503: `ProjectList.vue` 229 (P1),
   `StepTemplate.vue` 45 (P1), `EditorShell.vue` 515 (W0-B), `BackendQrCode.vue` 42 (P4). Use `problemText(503, ...)`
   (title "The platform is busy", body "busy or down for maintenance") and keep "not reachable" for network failures only.
   Pass `request-id` to `Alert`/`ProblemAlert` so the one `RequestIdRow` shows.
6. P8: put class `on-dark` on the stand-in root so its controls use `--ring-inverse` (ring 1.38:1 -> 12:1).
7. P1: `WorkspaceNav.vue` `.nav-item` already gets the pressed step from `style.css` (`.nav-item:active:not([aria-current=page])`);
   the scoped style must not set a background on `:active`. P1/P2: apply `.forced-step-current` to the stepper and first-run
   current-step circle. `AppHeader.vue` logo: use `h-logo` (26 px) with `hit-44` on the link.
8. P3-core: `Select size="sm"` exists (32 px, 44 coarse). Dialog frame: callers that build their own error text should use
   `QUIET_FIELD_ERRORS` (exported from `ui/field/FormField.vue`) when they show a summary.
9. Orchestrator: the running Vite process did not pick up changes to `tailwind.config.js` (new colours `primary-active`,
   `surface-active`, `z-popover-over`, `h-logo` render only after a restart of the dev server). W0-A measured a production build
   served through Playwright routing instead.

## From P4

- W0-B (`TranslationsPanel.vue`, the collapsed "Practical details" group disclosure): C3-63 asks for padding inside the disclosure box and a visible border in forced colours (`border: 1px solid ButtonText` under `@media (forced-colors: active)`). The group markup is in that file (around line 270), not in a P4 file.

## From P8 (Preview)
- W0-B / `EditorShell.vue` (line ~796): delete the `:class="previewExpanded ? '!max-h-[calc(100dvh-var(--sticky-stack-h,3.5rem)-1rem)]' : ''"` on `<PreviewPanel>`. `PreviewPanel` now sets `inheritAttrs: false`, so the class is already ignored (the panel computes its own measured cap from the app header plus `--sticky-stack-h`); the class only makes `check-css --all` fail. Also: `--sticky-stack-h` does not include the app header (49 px at 1440 while the stack is 105 px), so any other consumer that treats it as the whole stack (EditorSectionNav line 22) is short by the header height.
- P3-core / P3a: the Preview page links to lists as `?lang=<code>&missing=<code>` (the list's own `missing` value is a language code, not "1").

## From P5b (Event and Category editors)

1. `src/components/editor/EditorShell.vue` (W0-B), `completeness` computed (~line 283-294): `withGaps(model, structureOf(resource).gaps, ...)` still adds the saved Resource's structural gap when the editor passes its own live `completeness`. Event editor now passes `completenessOf({ ..., gaps: eventGaps(form.occurrences.length) })`; measured on an Event with no saved dates: after "Add a date" the warning "This Event has no dates" is still listed (1 before, 1 after) because the saved shape has 0 dates. When `props.completeness` is given, skip `withGaps` (the editor's model already carries the gaps). Route and Guide editors pass their own too.
2. `EditorShell.vue` `blockedReason` (~line 262), W0-B: it counts only ACTIVE users. The backend refuses to deactivate or archive a Category that is used by DRAFT items too (verified: Category used by one DRAFT POI, click Deactivate -> `StatusChangeDialog` "still used by the items below" with only Close). Category with an ACTIVE user already shows the disabled button plus reason plus "Show where it is used". For `kind === "category"` count every non-ARCHIVED, non-TRIGGER user (same sentence), so the dialog without an action is never reached. `StatusChangeDialog.vue` could also show a disabled "Deactivate" with the reason when `blocked` is true.
3. `src/lib/utils.ts` or `format.ts` (W0-A): a shared `fold(text)` (NFD, `\p{M}` stripped, `toLocaleLowerCase`) exists four times (`ProjectList.vue:57`, `assets.ts:239`, `listRows.ts:6`, `TranslationsView.vue:159`) plus a fifth in `EntityCombobox.vue` (P5b). One exported helper would let CLN delete them.
4. Not reproduced: "Warning:Italiano" without a space. In the Event editor `ReadinessList` renders "Warning: Italiano: 3 texts missing" (textContent "Warning:  Italiano", `innerText` and the accessible name both have the space). W0-B's `{{ " " }}` already fixed it; nothing for ReadinessList.

## From P3-core
1. `stores/toast.ts` + `AppToast.vue` (W0-A files): D-111 asks for a toast with Undo. The toast has no action button, so the list shows the move as a sticky bar in `ListTable`. If actions are added later, the bar can move into a toast; not needed for acceptance.
2. P3a/P3b views: see "Notes for P3a/P3b" in the P3-core changes.md (ListRowTitle, FilterField, header-action, counts/status on ListEmpty, ListFooter loading, query.reportError + ListSourceNotice, trigger load order for CLS).

## From P1

1. `e2e/touch-and-forced-colours.spec.ts` line 74 (W0-A): the not-found heading is now "Page not found" (was "This page does not exist"). Update the name in `getByRole("heading", { level: 1, ... })`.
2. List views (P3a, P3b) and `PageHead` consumers: `PageHead` now blocks primary and danger actions in `#actions` while offline (aria-disabled, reason, announced on click). Views need no change; an action that sets its own `disabled-reason` keeps it.
3. P3-core/P3a: after the layout skeleton (head now 51 px, rows 81 px, as the real list) the remaining shift on POI and Places loads (CLS 0.06 and 0.05) comes from the list's own rows and the Places footer moving when data lands; the list's own loading state should reserve those.
4. W0-A (`style.css`): `[aria-current] *` forces `HighlightText` on descendants, which beats `.forced-step-current` on a circle inside an `aria-current` element. P1 worked around it (aria-current on the label); P2's first-run guide circle probably needs the same, or the rule should exclude `.forced-step-current`.

## From P7a
1. `src/components/list/ListToolbar.vue` (P3-core): the Filters badge counts only `lang`, `pending`, `missing`, `cat`, `featured` and the status in the popover. A view's own filters in the `filters` slot (Media: Type, No alt text, Not used yet, Decorative) are not counted, so `?alt=1` or `?type=AUDIO` shows plain "Filters" (R3-s13-05). Please add a prop `extraActive?: number` (added to `activeInside`) and tell P7a the name; MediaView then passes `:extra-active="extraFilters.length"`. Until then MediaView cannot change the badge.
2. `src/lib/format.ts` (W0-A/CLN): `formatBytes` prints "20.0 MB" for a whole number of megabytes. Drop the ".0" there (`Number.isInteger(mb) ? mb : mb.toFixed(1)`) so `platform/assets.ts` messages ("Exceeds the 20.0 MB limit") also read "20 MB". UploadLimits already does this locally.
3. `src/platform/assets.ts` (W0-B/CLN): `assetMeta` and its local `formatBytes` still use a plain space ("163 KB" breaks across lines). MediaView uses its own `metaText` with the NBSP `formatBytes` from `@/lib/format`; once `assetMeta` re-exports it, `metaText` can go.
4. `src/platform/assets.ts` (G-041): `listAssets` has no `first page` mode; MediaView does its own first request of 48 with `apiRequest` and then calls `listAssets` for the rest in the background.

## From P5a (Route and Guide editors, picker, RouteMap)

1. `src/components/editor/RemovedBar.vue` (W0-B), line ~49: the bar still reads "Stop 1, X removed.1 more can be undone." (measured `textContent` with two removals, no space). The leading space of `<template v-if="count > 1"> {{ count - 1 }} more…` is trimmed by the compiler; write `{{ " " }}` (or `removed.{{ count > 1 ? ` ${count - 1} more can be undone.` : "" }}`) inside the template. The one-removal text is correct.
2. `src/components/editor/undoRemove.ts` (W0-B) and `RemovedBar.vue`: a removal speaks twice, `say("… removed. Press Ctrl+Z or use Undo…")` and the bar's `role="status"` text. Keep one: drop `role="status"` on the bar's span (the bar is a labelled group and `say` already announces), or drop the `say`.
3. `EditorShell.vue` / `EditorStatusCard.vue` (W0-B): the slug in the Status card and the header subtitle breaks mid-token ("acropolis-highlights-classical" then "-walk"). Add `break-words` (or `[overflow-wrap:anywhere]` plus `wbr` after hyphens) on the slug value; the Route and Guide views only render the slug in an input.
4. `EditorShell.vue` `completeness` (W0-B, same as P5b request 1): Route and Guide editors now pass `gaps: routeGaps(form.stops.length)` and `storyGaps` through their own `completenessOf`; the shell should skip `withGaps` when `props.completeness` is given.

## From P3b (Guides, Events, Categories lists and create dialogs)

1. `src/components/AppDialog.vue` (W0-A), header row (line ~157-168): the Close button (`size-control`, 40 px, `items-start`) centres 5 px lower than the
   title (measured on `/guides?create=1`: Close centre y 129, h2 centre y 124, unchanged from the audit). Align them (`items-center` on the header
   row with the title's `pt-2` removed, or `pt-2.5` on the h2). Body: `[data-dialog-body]` is `py-2`, so the last row (the "Edit slug" panel, "Review in editor")
   ends 8 px above the footer rule (measured 8 px in all three dialogs, slug closed and open); `pb-4` on the body (or `pb-2` on `form[data-form-dialog]`) gives 16 px.
2. `src/components/ui/dialog/FormDialog.vue` (W0-A), footer button (line ~230): `{{ busy ? "Creating..." : submitLabel }}` still prints three dots; use the
   ellipsis character `…` (C3-89, "one ellipsis character").
3. `src/components/ui/chip/index.ts` or a `PendingChip` (W0-A/CLN): the "Pending changes" chip is `whitespace-nowrap` 150 px; in the 128 px Status column it
   does not fit. P3b wraps it locally (`max-w-full whitespace-normal rounded-lg py-0.5`), as a two-line pill. If P3a and CLN want one rule, a `StatusChip`
   prop (`wrap`) would replace the class string repeated in the six list views.
