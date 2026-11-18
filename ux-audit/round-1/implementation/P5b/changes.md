# P5b: Event and Category editors

## Closed (consolidated IDs / audit findings)
C1-102, C1-103 (Event pickers), C1-104, C1-39, C1-71 (end before start inline), C1-106 (repeat weekly count or end date); s11 findings 03, 04 (occurrences), 08 (partly), 09, 12, 13, 23, 24.
Partly: finding 08 / one date format. The summary lines, list and repeat preview use one en-GB formatter (`eventDates.ts`, read-only), but the native `date` / `time` controls draw in the browser's own locale (en-US in the test browser: "01/12/2027 12:00 PM"); a page cannot change that. Not replaced by typed text fields to keep the picker and validation.

## Files
Rewritten: `src/views/workspace/events/EventEditorView.vue`, `src/views/workspace/categories/CategoryEditorView.vue`. New (inside P5b's folders): `events/EntityCombobox.vue` (ARIA combobox, no dependency), `categories/RadioChips.vue` (native radios as chips). `CategoryIcon.vue`, `platform/events.ts`, `platform/categories.ts`: no change needed. Scripts/records: `P5b/{make-records,shots,forced}.mjs`, `records.json`, `results.json`, `after/`.

## What changed
Event: sections Texts, Dates, Where and booking, Media, How visitors reach it, Details (collapsed) via `EditorSection`. Each occurrence is a card (Start date/time, End date/time as labelled fields, Cancelled switch, Remove) that reflows at any width. Moving the start keeps the length. End-before-start shows inline as typed and disappears when corrected (also validated on Save). Time-zone note in plain words ("Times are Athens time (Europe/Athens), the time zone of this Project."). Remove uses `useUndoRemove` + `RemovedBar` (announced, focus to next card, Undo). "Repeat weekly" opens a panel: N more weeks (1 to 52) or Until a date, with a plain preview ("Adds 4 dates, every week from ... to ..."); additive, no API change. Place/POI/Route are searchable comboboxes (type to filter, arrows, Enter, Esc; "None" first); drafts are marked "Draft" and listed after active ones (spec is silent, so marked not excluded); archived only while chosen. In non-default tabs the date editor is replaced by a read-only list and a "Go to <default language>" button.
Category: scope and level are fieldset radio groups with check mark and tint on the chosen chip; scope shows its lock reason with a lock icon and a "Show where it is used" button; Subcategory is disabled with a stated reason (has children / no parent available) instead of a toast. Icon grid is one fieldset "Icon" of native radios: one Tab stop, arrows move and choose, selected has check badge, thicker border, tint and the "Chosen: Museum" line, plus "None". "Used by" side card lists the referencing items with editor links and status; Alert explains the block while ACTIVE and used (the shared Deactivate dialog already lists blockers with links). Code moved to a collapsed Details section.

## Acceptance (Windows Node, populated Project, my records "UX-P5b event", "UX-P5b category")
- Occurrence cards at 1440, 1024, 768, zoom200: 0 clipped Cancelled/Remove controls, no page horizontal scroll.
- End 11 Jan vs start 12 Jan: inline error shown (1), 0 after correcting. Remove date 2: removed bar present, focus moved to date 1 start, Undo restores (2 cards).
- Repeat weekly: "Adds 4 dates, every week from Tue, 26 Jan 2027 to Tue, 16 Feb 2027, 12:00-14:00."
- POI combobox: 56 options, "a" filter + ArrowDown + Enter chose "Ancient Agora Entrance and Ticket Office". Greek tab: 0 date cards.
- Icon grid: Tab from the checked radio leaves the group at once (one Tab stop); two ArrowRight from None gave Museum.
- axe wcag2a/aa/21 on Event, Category, Category used (ACTIVE) at 4 viewports: 0 violations in my markup (the header Project switcher `label-content-name-mismatch` seen once at 1440 is stage 0.1 and disappeared on re-run).
- vue-tsc: clean for my files (errors only in P5a's GuideEditorView at the time). Style gate grep empty. `impeccable detect`: `[]`.
- Forced colors: `after/category-forced-colors__1440.png`, `event-forced-colors__1440.png`: check marks and borders remain.
- Screenshots in `after/` (event-draft, -dates-view, -end-before-start, -removed-undo, -repeat-weekly, -poi-combobox, -greek-tab; category-draft, -icon-selected, -active-used; each at 1440/1024/768/zoom200).

## Deferred / notes
- Native date/time locale (above). No Greek/long-text/keyboard-focus screenshots beyond the Greek tab; the full Tab walk of the Event form was not run.
- No D or Q entries: plan section 3 reserved none for P5b (combobox and radio-chip patterns are local; a shared combobox would help P5a's stop picker: `EntityCombobox` could move to `components/ui`).
- Used count on a Category now follows the where-used list (11 for "Monuments and Temples") rather than `resourceCount` (17), so it matches the Status card; the backend counts differ (cf. G-030).
- e2e: no spec touches these editors; none changed, none run.
- `useUndoRemove` comment cites D-085, which is the Greek font decision (P5a's file).
