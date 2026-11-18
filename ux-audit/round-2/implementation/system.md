
## Round 2 additions (W0-A)

- Tokens: `spacing.control` (so `size-control`, `h-control`, `w-control`; 40 px, 44 coarse), `z-raised` (5), `shadow-drop-before`, `shadow-drop-after`; utility `.hit-44` (44 px click target through `::after`). Check: `make check-css` / `pnpm check:css`.
- Errors: `lib/problemText.ts` (the table), `describeError`, `ApiError.message` (fixed sentence), `ProblemAlert` (`ui/alert`), `showErrorToast`. Server `detail` is never rendered.
- Dates: `lib/format.ts` `formatDate`, `formatTime`, `formatDateTime`, `formatDateTimeRange` with `{ timeZone, locale }`; `DateTimeFields` (`ui/field`).
- Focus: `lib/focus.ts` `restoreFocus(opener, fallbacks)`, `focusAfterRemoval`, `firstVisibleField`; `AppDialog` focuses its first visible text field or its heading and returns to the opener or its menu's trigger; `StateCard` focuses its `h1` on mount.
- Toasts collapse identical messages ("x3"), one announcement each, `--toast-offset-bottom` lifts the stack above a sticky footer.
- Projects store: `detailState(id)`, `markDetailFailed(id)`; direct reads survive a later listing. Router: UUID-only Project ids; unknown addresses show `NotFoundView`.
- `useProjectLanguages`: `languagesOrNull`, `reload()`, never `[]` on failure.

## P4s additions (editor shell, round 2)
- `EditorShell` props: `restoreNotice?`, `nextMissingLabel?`; header grows to two title lines (`min-h-14`); `secondary` action "Save and apply"; save errors in `[data-summary-slot]` (floating, `z-raised`); preview container `#editor-preview` full width above the form grid; `EDITOR_NEXT_MISSING` injection key.
- `useResourceEditor`: `partialFailure`, `reportPartial`, `focusSummary`, `dismissSummary`, `activationFailure`, `pendingDraftFields`, `describePendingChanges`; exports `runIndependentWrites`, `partialSentence`, `collectionDiff`; `?lang=` seeds the language.
- `RemovedBar anchor="sticky|inline"`; `useUndoRemove` handles Ctrl/Cmd+Z; `TranslationsPanel heading` ("Texts") and autogrow title.
- `ConflictDialog`: three-way (`saveConflict.takeCurrent`, `myChanges`); `ActivateDialog` props `issueSentence`, `failure`.

## Round 2 additions (P3-core)

- `useListQuery`: `page` (URL `page`, 50 rows, `LIST_PAGE_SIZE`), `dir`/`sortDir` with `defaultDirFor(sort)` (Updated newest first), `sortDirectionLabel`, `pageCountOf`, `segmentTotal(rows, status)`; `useScrollRestore(ready)` returns `{ rowKeyFocus }` and restores scroll plus row focus; `useResultAnnouncer(shown, total, ready, noun, { query, options })` names the noun and announces sort.
- `ListTable`: windows rows by `pageSize`, pager, `rowKeyFocus`, `data-row-id` on rows, head stays while `loading`; `ListToolbar`: `counts` may be null, optional `loading`, "/" focuses search, one "Clear filters"; `ListFooter paged`; `ListLoadError`; `MatchHint` with `matchedInOtherLanguage` (`listRows.ts`); `useCreateParam(creating, ready)` for `?create=1`; `TranslationDots route` (links with `?lang=`); `shortTitle` and `undo`/`undoArchive` in `useListLifecycle`; `useCategoryFilter().failed`.
- `FormDialog`: `validate`, `dirty`, `confirmDiscard`; form-order summary; slug capped at 100.

## P4 additions
- `editor/OtherSettings.vue`: wraps the language-independent cards of an editor; `folded` (non-default language open) collapses them into "Other settings (all languages)", they stay mounted and open on a reveal event, a hash link or a rail click.
- `editor/FilteredSelect.vue`: native select plus a filter field from 25 options; use for Place, Category, parent choices.
- `MediaSlots.vue`: per-language slots are one "Audio narration" group in the card; focus lands on the new Replace (`data-replace`, `data-focus-fallback` while attached).
- `platform/triggers.ts`: `describeTriggerPath`, `triggerRowName`, `triggerCoordinateError`, `syncTriggers` runs writes in parallel and returns `{ triggers, failed }`, `saveWithTriggers(..., { partial, onPartial })`.
