# W0 stage 0.2: editor shell

## Closed (consolidated IDs)
C1-11, C1-12 (one button hierarchy in the editor, no hand-rolled pills), C1-22 to C1-27, C1-29 to C1-33 (sticky header and Working Copy banner, side column,
Activate confirm, save feedback, validation summary, restore notice once), C1-34 shell part, C1-36 to C1-38, C1-40 (source beside target, Copy source, tab pattern,
completeness, Translations card, `describePath` fallback), C1-69 to C1-71, C1-73, C1-74 (summary focus, error clears on input, conflict choices unselected, no "complete" with warnings),
C1-86 container (inline PreviewPanel), C1-77 (editor uses `PageFrame`, h1 gets route focus). Partly: C1-23, C1-24 (kind packages fill sections/media/triggers).

## Files
Rewritten: `src/components/editor/EditorShell.vue`, `TranslationsPanel.vue`, `AiMarker.vue` (tokens). Added: `EditorSection.vue`, `EditorSectionNav.vue`, `WorkingCopyBanner.vue`, `ReadinessList.vue`,
`EditorStatusCard.vue`, `PreviewPanel.vue`, `ActivateDialog.vue`, `ConflictDialog.vue`. Changed: `src/workspace/useResourceEditor.ts`, `useStatusActions.ts` (toast no longer says "complete").
Not touched (no change needed): `StatusChangeDialog.vue`, `activationHandoff.ts`, `referenceLinks.ts`, `translationStatus.ts`. No kind editor edited.
Also: `DECISIONS.md` D-074, D-075, D-079; `requests.md` (3 items); scripts `W0.2/{shots,accept,make-records,probe}.mjs`; records `W0.2/records.json`.
Own records: POI "UX-W0.2 draft point" (id in records.json; saved, activated and edited by the scripts).

## Acceptance (Windows Node, dev server, populated Project)
- Scroll 1,500 px (frieze, ACTIVE + pending, 1440): header Apply changes at y 68-108, banner 120-179, both in view; side column sticks below them.
- Banner shift: first field y 414 before and after typing, delta 0 (ACTIVE, 1440).
- Ctrl+S on my record: PUT sent, state line "Saved 04:50 PM", browser dialog suppressed, focus stays in the field being typed in (restored to Save only if focus was lost).
- Activate always confirms (dialog 1); platform 422 shown in the dialog with a field link (focus lands on `#f-title`); toast "Activated with 7 warnings" (not "complete").
- Tabs: ArrowRight el, End it, Home en, ArrowLeft it. Copy source buttons present in a non-default tab (3).
- Preview (1440): opens under its button in the side column, readiness card y 753 to 1302 (pushed down), no overlap with the form, header action still visible, Esc closes and focus returns to the action.
- axe (wcag2a/aa/21): editor markup clean in ACTIVE pending, ACTIVE dirty, ARCHIVED, 409 dialog, Activate dialog. Only violation: `label-content-name-mismatch` on the header Project switcher and account menu (stage 0.1 / P1 files).
- 1024 and 768, zoom200: summary row ("Active · 2 warnings", Activate, Preview) is in the first screen; at zoom200 Apply changes and the banner are not clipped. The accept script also passed at 1024 (banner delta 0, preview pushes the form 505 to 1059 without overlap, Esc focus return, tab keys, Ctrl+S, same axe result). 768 and zoom200: screenshots only.
- `vue-tsc --noEmit -p tsconfig.app.json`: clean for my files (last run showed one unused import in P7's `UploadEntryRow.vue`).
- Screenshots: `W0.2/after/` (poi-draft, -active, -active-pending, -scrolled-1500, -activate-dialog, -translation-greek, -preview-open, -422-summary at 1440, 1180, 1024, 768, zoom200; archived, 409, activate-refused at 1440/1024; place, route, guide, event, category at 1440). e2e not run.

## Deferred / known
- "Fit" scale text and real-size link inside the preview are P8 (`ResourcePreview` unchanged); the unchanged preview still has its own uppercase header and Close.
- Parallel-safe save status: `saving` stays one flag; independent saves still go through each kind's `around`. Per-field author/time in conflicts needs G-035.
- Header "More actions" holds Archive (and Deactivate/Restore below 1180). Archived editors show a read-only Alert; field contrast with stated reason is left to the kind packages.
- Existing e2e selectors to update (P4/P8): `place-editor.spec.ts` ("You are editing a working copy" is now "Working Copy. No pending changes..."; Activate opens a confirm), `editor-preview.spec.ts` (inline panel, role group "Preview in app, showing the form as it stands", no dialog).

## Adopting the shell (P4, P5a, P5b, P8)
- Keep passing the old props. New optional: `sections` (`{ id, label, state? }[]`), `structuralInNonDefault`, slot `header-extra`, slot `aside` (extra side cards).
- Wrap each form section in `<EditorSection id title count? state? collapsible? default-open? description?>` (from `editor/EditorSection.vue`): it registers in the "On this page" rail and opens itself when a field inside is focused. Order: Texts, core setup, Media, How visitors reach it, Details (collapsible, with a count).
- `TranslationsPanel`: new `structural` prop (default true), `v-model:source` (default-language texts), default slot scoped `{ structural, language, isDefault }` rendered after the text groups. Route/Guide/Asset editors hide reorder/add/remove with `inject(EDITOR_STRUCTURAL, ref(true))` (exported from `EditorShell.vue`) or the slot's `structural`.
- Header: `data-editor-primary` marks the Save/Apply button (focus returns there). Editor API additions: `stateLine`, `lastSavedAt`, `requestActivate()`, `activateOpen`, `activationRefusal`, `confirmActivate(saveFirst)`, `closeActivate()`; `requestTransition("ACTIVE")` now opens the dialog; `showErrors(title, found, requestId, focus = "summary" | "field" | false)`; `ConflictField.choice` starts `null`.
- DRAFT readiness shown to the author is client-known (translation completeness from the `translations` prop); pass `translations` so "Before you activate" and the dialog have content. ACTIVE uses `editor.readiness`.
- P8: `PreviewPanel` mounts `ResourcePreview :model :dirty @close`; it expects the root element to be inline (no overlay) and focuses itself on open.
