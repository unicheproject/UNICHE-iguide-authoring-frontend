# W0-B Editor family: changes

## C3 ids
- **Fixed:** C3-07, 14, 15, 16 (warnings), 17, 18, 21, 22 (scroll-padding follows the measured stack; not reproduced), 23, 24, 25 (shell part), 28, 29, 31, 32, 37 (panel is one root, 0 gap), 50 (editor fields `dir=auto`), 51, 83, 89, 92 (session dialog), 12 (readiness live region announces only on count change), 33, 36 (`RemovedBar` space and lower dock, 40 px position select), 19 (Used in omits own triggers, "Show where it is used" link), 58 (data: `issueRowText`), 86 (editor primary announces its reason on click).
- **Partly:** C3-20. The hook side is done: no "Nothing was changed" after a partial save, and a new `onPartialSave(saved)` option. Replacing trigger rows and mapping the own-record duplicate sentence are P4's files (see requests.md). C3-25: the summary no longer overlaps; marking the failed row needs P4. C3-14: the Asset title blocker is dropped by default only for images with alt slots; P7b should pass `baseBlocks:false`.

## Files changed
- **New:** `editor/SideCard.vue`, `workspace/listBack.ts`.
- **Editor components:** `EditorShell.vue`, `WorkingCopyBanner.vue`, `ReadinessList.vue`, `ActivateDialog.vue`, `TranslationsPanel.vue`, `EditorStatusCard.vue`, `EditorSectionNav.vue`, `ConflictDialog.vue`, `FilteredSelect.vue`, `RemovedBar.vue`, `ReorderControls.vue`.
- **Dialogs and store:** `SessionEndedDialog.vue`, `stores/sessionNotice.ts` (`unsaved`, `setUnsavedEdits`).
- **Workspace and platform:** `workspace/useResourceEditor.ts`, `platform/completeness.ts`, `platform/readiness.ts`.
- **Not touched:** `StatusChangeDialog.vue`, `useStickyStack.ts`, `translationStatus.ts`, `OtherSettings.vue`, `EditorSection.vue`, `platform/assets.ts`; no change was needed there.
- **Docs:** D-107, D-108 and D-109 appended to `DECISIONS.md`; requests appended to `requests.md`.

## Contracts
- `id="editor-side-column"` is on the side column root; `#editor-preview` is unchanged.
- `EDITOR_PREVIEW { open, expanded, toggleExpand, close }` is exported from `EditorShell`. The Expand and Collapse buttons are removed. The "Preview in app / Close preview" toggle and the panel's own Close stay, so the panel can still be closed. P8 renders Expand and Close in its header.
- `listBackQuery` and `readListBack` are in `workspace/listBack.ts`; I added `withListBack`.
- `issueRowText` and `issueRowParts` (the `<bdi>`-safe split) are exported from `readiness.ts`.

## Acceptance (admin, `UX-R3-W0B …` records; probes in `implementation/W0-B/probes/`, shots in `after/`)
| Item | Before (audit) | After (measured) |
|---|---|---|
| B1 DRAFT POI, header / card / confirm / toast | confirm 3, toast and card 6 | all say "3 warnings, nothing blocks", confirm once, "plus checks run on activation" shown; same after activation; no separate accessibility line |
| B3 Discard | activeElement `body` | `h2#status-card-heading`, success toast |
| B3 401 on PUT, Esc | "Saving…" forever, Ctrl+S dead | "Not saved: session ended. Sign in again" plus a Sign in again button, Save not aria-disabled, Ctrl+S retries (dialog returns), no "Saving…" |
| B4 14 clicks, Title filled | 14 on `#f-title` | 0 on the title; "Practical details" `aria-expanded=true`, focus on `#f-instructions` at y=424 below the stack of 49; at zoom200 y=130 |
| B4 button position | 800–1300 px down the side column | 10 px from the tabs at 1440, 1024 and zoom200 |
| B5 chrome (app header included) | 154 px (17 %) at 1440; 112 px (31 %) at zoom200 | 1440x900 105 px = 11.7 %; 1280x720 105 px = 14.6 %; 1024x768 touch 109 px = 14.2 %; zoom200 56 px = 15.6 % (app header only) |
| B5 Save draft | two at once; scrolled away at 1024x768 | exactly 1 in the tree at top and scrolled; header compact Save draft is in view at 1024x768 touch; 4–5 Tabs from the title to Save draft |
| B6 side cards (Place / POI / Route) | 16 vs 14 px headings, p-3 vs p-4, nested h2 | every card h2 14 px, padding 16 px, one h2 per card; Texts gap 0 in all three editors measured; Revision shown from creation (2 on POI, 1 on Place and Route) |
| B7 mocked 409 | old dialog / 14-word heading | Working Copy Save 409 shows the three-way dialog, request id and "Your other changes (Title (English) and Summary (English)) are kept either way"; Apply 409 heading "The live point of interest changed", request id, visible "Choose Mine or Current for 2 fields first." |
| B10 | leading spaces in closed select; offline click silent | `selectedOptions[0].text` = "UX-R3-W0B Place A"; offline click on the aria-disabled primary announces the reason |
| B11 | worklist lost | `?back=lang=it&missing=1&q=x&bad=1` gives breadcrumb `?lang=it&missing=1&q=x` and the click lands filtered |
| Axe (wcag2a/aa, 21a/aa) | n/a | 0 violations on the dirty ACTIVE editor at 1440, 1024, 768 and zoom200 and on the Activate dialog |

## Quality gates
- `vue-tsc` passes.
- `check-css-tokens` passes. With `--all` it flags `max-h-[calc(100dvh-var(--sticky-stack-h,…` in EditorShell: the expanded-preview class that was already there, a parser artifact on the comma. P8 removes it.
- `impeccable detect --json` on the changed editor files returned `[]`.

## Deviations and notes
- ReorderControls Position select uses the default 40 px size, not `size="sm"`: C3-36 asks for 40 px.
- Banner is sticky only from 960 px of height and the header from 700 px (D-108), so at 1440x900 only the header sticks.
- Not built: B9 trigger-row reconciliation in `PoiEditorView` and `triggers.ts` (P4).
- Q-021 and G-043 to G-045 are W0-A's entries. G-045 is still unverified: the Working Copy 409 payload is read via `currentVersion`, and `current` is not needed because the dialog re-reads.
- e2e: `e2e/place-editor.spec.ts` still matches. Header "Save and apply" replaces header "Save draft"; the banner "Save draft" is first. Specs cannot run here.

## System additions
`SideCard` (props `title`, `headingId`, `as`, `flat`; slot `actions`); `EDITOR_ACTIVE`, `EDITOR_PREVIEW` keys; `FOCUS_FIRST_EMPTY_EVENT`; `completeness.ts` additions: `withGaps`, `coveredByModel`, `routeGaps`, `eventGaps`, `baseBlocks`.
