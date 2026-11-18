# W0-B changes (sticky stacks, one completeness model, editor-side root causes)

## Closed
C2-05, C2-06 (measured stack, short banner, one-row list toolbar, no sliver), C2-33, C2-34 (model, tab marks, side card, header count, Activate confirm, toast; Guide with empty story is no longer "Complete"), C2-58 (map Tab stops), C2-59 (own triggers never block; reason sentence), C2-21 sticky part.
Partly: C2-33 for Route stop texts typed but not saved (the shell reads the saved Route; P5a passes `completeness` from the live form, see requests.md); list translation dots and Dashboard have the model available but their files are P3/P2.

## Files
New: `src/platform/completeness.ts`, `src/workspace/useStickyStack.ts`.
Changed: `editor/EditorShell.vue`, `WorkingCopyBanner.vue`, `EditorSection.vue`, `EditorSectionNav.vue`, `ReadinessList.vue`, `ActivateDialog.vue`, `EditorStatusCard.vue`, `TranslationsPanel.vue`, `StatusChangeDialog.vue`, `workspace/useResourceEditor.ts` (`reportIssues`, `languages`, `defaultLanguage`, toast), `platform/readiness.ts` (NAVIGATION), `platform/assets.ts` (`missingTextIn` delegates), `list/ListToolbar.vue`, `styles/list-table.css`, `GeoPicker.vue`, `map/GeoMapCanvas.vue`; `e2e/place-editor.spec.ts` (banner text). D-089, D-090 in DECISIONS.md. Requests in `../requests.md`.

## Measurements (admin, Populated, ACTIVE records)
| Screen | Before | After |
|---|---|---|
| POI list 1280x720 stuck area | 255 px (35 %) | 106 px (15 %); `--sticky-stack-h` 106 |
| POI list 1440x900 | n/a | 106 px (12 %) |
| Editors 1440x900 (header + banner) | 96+ px, banner two lines possible | 98 px (11 %) |
| Editors 1280x720, 1024x768 | banner sticky | 56 px (header only) |
| Editors zoom200 (640x360) | banner sticky | 56 px; form share 69 % of viewport |
| POI Placement Tab stops | 62 (74 from Save/Apply to the end) | 7 (19 from Save/Apply) |
| Tab at zoom200 through POI form | | no field under the header (only tall autogrow textareas start above the fold) |
| Same issue sentence in header, card, Activate confirm, toast | differed | equal: "3 warnings, nothing blocks" (empty-story Guide, DRAFT); "6 warnings, nothing blocks" (POI after activation, header = card = toast) |
| Guide, empty story | "Complete" | English "1 of 2", 1 warning "The guide has no story yet" |
| Category "Used by" | "Used by 1 item. Remove it from it first" | "Used by 1 route. Choose another category in that route first." |
axe (serious/critical): none on POI, Route, Category, empty Guide, POI list at 1024, 768, zoom200. Screenshots in `after/`; scripts `measure.mjs`, `tabs.mjs`, `probe.mjs`, `shots.mjs`; before data `before/`.

## C2-59 finding (G-037)
Frontend now enables Deactivate when the only users are the item's own triggers. The platform still refuses with 409 `RESOURCE_IN_USE` (verified on `UX-R2-W0B QR point of interest` with a draft QR code); the dialog then reads "It is still reached through the codes below. Deactivate them first" with a link to the trigger. The backend should deactivate a Resource's own triggers with it.

## Deferred / notes
- Not done: "Next missing" label wording (P4s), `StatusChangeDialog` `reviewTo` is added but no caller passes it yet (P3-core lists), Route editor `z-index: 10` -> `z-raised` (P5a file; in requests).
- DRAFT counts cannot include the platform's non-text readiness (it evaluates ACTIVE only); ACTIVE shows more lines than the same item as DRAFT for that reason.
- The `Filters` popover moved search language, sort and view filters out of the bar; `e2e/content-lists.spec.ts` (P3-core) may need to open it.
- Not run: e2e (cannot here), `make check-css`/build (no make here; typecheck passes).
- Records created: Guide `UX-R2-W0B Empty story guide`, POI `UX-R2-W0B QR point of interest` (now ACTIVE, one draft QR trigger).

## Verification fixes
- R2-V-01: backend `RouteReadiness` blocks with `ROUTE_WITHOUT_ACTIVE_STOP`, so it is a blocker everywhere. `completenessOf` takes `blocking` gaps (new input); `RouteEditorView` passes one when stops exist and none is an ACTIVE POI; `EditorShell` drops it when the platform reports the same code. Probe on `UX-R2-W0B Draft stop route` (only stop a DRAFT POI): header, card and Activate confirm all say "1 to fix before activating, 3 warnings" and list "Blocking: No stop is an active point of interest yet", matching the editor's alert.
- R2-V-06: the side column already had max-height = viewport minus stack with its own scroll; it ended 16 px above the viewport foot but showed no sign of more. It now fades at the foot while more is below (`side-more`, updated on scroll and resize). 1440 POI: top 175, bottom 884 of 900, scrollHeight 1463 inside 709. Shot `after/side-1440.png`.
