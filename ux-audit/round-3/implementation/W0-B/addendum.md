# W0-B addendum (Wave 1 requests)

Typecheck and `check-css-tokens --all` both pass (280 files, 0 flagged). The `--all` artifact from my main report is gone because the `previewExpanded` class is deleted.

## Done (W0-B files only)
| Request | Change | Probe result (admin, `UX-R3-W0B` records) |
|---|---|---|
| P5b 1: live `completeness` must win | `EditorShell.vue`: `withGaps` runs only when the editor passes no `completeness`; the editor's model already carries its gaps. | Event with no dates: "no dates" lines in the side column 1 before, 0 after "Add a date" (was 1 after). |
| P5b 2: Category used by DRAFT items | `EditorShell.vue` `blockedReason`: for `kind === "category"` it counts every non-ARCHIVED, non-TRIGGER user. `StatusChangeDialog.vue` also shows a disabled action with its reason when the dialog is blocked, so it never has only Close. | Category used by one DRAFT POI: Deactivate `aria-disabled=true`, reason "Used by 1 point of interest. Choose another category in that point of interest first." plus "Show where it is used", whose click focuses `#used-in-heading`. |
| W0-A 2: Discard toast tone | `useResourceEditor.ts`: both "Changes discarded" toasts now use `"neutral"`. | Type-checks. Not re-probed visually. |
| W0-A: `--toast-inset-right` | Removed from `EditorShell.vue` (publisher, resize listener, cleanup). Unused, because `lib/toastOffset.ts` measures `#editor-side-column` itself. | Typecheck passes. |
| W0-A 5: "not reachable" for a platform 503 | `EditorShell.vue` load-error card now takes its title and body from `problemText(status, code, ...)`, so a 503 reads "busy or down for maintenance". | Not probed: it needs a mocked 503 on load. |
| P4: Practical details disclosure | `TranslationsPanel.vue`: `px-2 pb-1` and rounded; `border: 1px solid ButtonText` under `@media (forced-colors: active)`. | Not probed in forced colours. |
| P8: preview class and stack | The `:class` on `<PreviewPanel>` is deleted. `EditorSectionNav` scroll-spy offset is now `--sticky-stack-h` plus the app header bottom. | Typecheck and check-css pass. The scroll-spy offset was not measured. |

## Not done
- W0-A 4 (`platform/assets.ts` `formatBytes` re-export): `assets.ts` belongs to P7 in Wave 1 and only its completeness function is W0-B's; left for P7.
- P5b 3 (shared `fold` helper): W0-A's.
- P5b 4: nothing to do.
- Still open from my main report: P4's trigger-row reconciliation (`onPartialSave`) and P7b's `baseBlocks:false`.

## Files touched in this addendum
`src/components/editor/EditorShell.vue`, `src/components/editor/TranslationsPanel.vue`, `src/components/editor/EditorSectionNav.vue`, `src/components/StatusChangeDialog.vue`, `src/workspace/useResourceEditor.ts`. Probes: `ux-audit/round-3/implementation/W0-B/probes/add*.mjs` (logs in `logs-add.txt`).
