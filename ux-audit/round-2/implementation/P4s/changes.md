# P4s changes (editor shell, round 2)

## Closed
C2-10 (403/404 on save, activation failure inside the dialog), C2-11 (Ctrl+S offline says why), C2-12 (no save toast; state line is the announcement), C2-50 (`?lang=`, "Next missing: Italiano" beside tabs below 1180 px), C2-54 (two-line header h1, autogrow title), C2-56, C2-57 (shell paths: Activate, Apply, Archive, Restore, Restore draft), C2-62, C2-63, C2-64, C2-65, C2-68, C2-70, C2-73 (helper only), C2-53 (shell: `dir="auto"` on h1; panel fields already carry lang/dir).
Partly: C2-73 (`runIndependentWrites`/`partialSentence`/`reportPartial` exist; the trigger/asset writes live in P4's editors), C2-67 (Texts heading, Next missing; the editor-height items are P4), C2-70 (bar anchored and Ctrl/Cmd+Z; no brief focus move).

## Files
`editor/EditorShell.vue`, `WorkingCopyBanner.vue`, `EditorStatusCard.vue`, `ConflictDialog.vue`, `ActivateDialog.vue`, `TranslationsPanel.vue`, `RemovedBar.vue`, `undoRemove.ts`, `workspace/useResourceEditor.ts`, `e2e/place-editor.spec.ts` (Save draft is first of two; no success toast; confirm names changes; not run). D-095 in DECISIONS.md; system.md and requests.md appended. No Q entries.

## Measured (admin, Populated, UX-R2-P4s records; scripts v1-v7.mjs, shots in after/)
- Failed save (503 mocked) at 1280x720 on ACTIVE POI: first field moved 0 px; focus on the summary; no server detail in the page; request id shown.
- Dirty ACTIVE: header buttons "Save and apply" + "Save draft" (primary); clean: "Apply changes" aria-disabled with "Nothing to apply: there are no pending changes".
- Apply confirm: "Changes: Summary (English). ... Still open: 6 warnings, nothing blocks."; after Apply focus is `#status-card-heading`; Revision 3.
- Real 409 (record changed through the API): only both-changed fields listed; "Reload their version (discards your 2 changes)", "Keep my changes" disabled until chosen, request id; auto-merge case lists none, says "1 other field changed only by them will keep their version" and saved both.
- Restore notice: one 46 px row "Restore (1 field)"; focus on the first restored field; gone after Save. Archive then Restore: one Restore button, no Title hint, focus heading then first field.
- Route editor: Undo bar fully in the viewport after removing a stop; Ctrl+Z restored it.
- Preview: panel width equals the editor content area at 1440, 1024, 768, zoom200; Expand present at all; with it expanded the header primary is clickable (`elementFromPoint`).
- Activate with 503 mocked: "Not activated", request id, Try again inside the dialog.
- axe serious/critical: none (draft editor and Activate dialog at 1440, 1024, 768, zoom200). Forced colours: dirty ACTIVE editor checked.
- Typecheck: no errors in owned files (DashboardView and ProjectList errors belong to other packages). `impeccable detect`: [].

## Deferred / notes
- Duplicate "Texts" heading in the POI and Place editors until P4 removes its own (requests.md).
- Apply-conflict dialog stays two-way: the base of a Working Copy is not known to the client.
- Header badge hides below 1280 px and the state line below 1536 px while "Save and apply" shows, to keep the title on one line.
- e2e cannot run here. Records `UX-R2-P4s ...` (two POIs) remain.
