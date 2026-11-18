# P5b Event and Category editors: changes

Typecheck passes for my files. The only `vue-tsc` errors left are in `DashboardView.vue` (P2's file). `check-css-tokens` passes, `impeccable detect` returns `[]`, and the literal-gate grep over my files is empty. Nothing was committed. Event and Category records are `UX-R3-P5b …` in the Populated project. Probes are in `ux-audit/round-3/implementation/P5b/probes/` and screenshots in `after/`.

## C3 ids
- **Fixed:**
  - C3-38 (Event End rewrite and `DateTimeFields` use).
  - C3-39 (ended card without opacity).
  - C3-52 (Category language-tab structural fields).
  - C3-53 (`EntityCombobox` accent folding).
  - C3-33 (`EntityCombobox` indent and closed value).
- **Partly fixed:**
  - C3-19 (Category). Blocked deactivate works when an ACTIVE item uses the category. A DRAFT user still reaches the dialog with no action. That needs the shell (request 2).
  - C3-36 (Event). Repeat-weekly messages and 31 November are done. The 40 px select is W0-B's `ReorderControls` and slugs are the shell's. No Event editor chip shows a raw enum, so nothing to change.
  - C3-37. No local Texts gap override exists in either editor; both use the shared `TranslationsPanel`.
- **Readiness (D-107):** the Event editor passes its live completeness with `eventGaps`. The shell still re-adds the saved-shape gap (request 1).

## Files changed
- `src/views/workspace/events/EventEditorView.vue`
- `src/views/workspace/events/EntityCombobox.vue`
- `src/views/workspace/categories/CategoryEditorView.vue`
- `requests.md`: four items appended.
- No D, Q or G entries (none reserved for P5b).
- `eventDates.ts`, `CategoryIcon.vue`, `platform/events.ts` and `platform/categories.ts` needed no change.

## What changed
- **End rewrite (C3-38).**
  - Cause: `wallMinutes("")` parsed `":00Z"` into a real date, so an empty or invalid Start moved End to 1 Jan 2000.
  - `wallMinutes` now accepts only `YYYY-MM-DDTHH:mm`.
  - `setStart` only stores the value. End follows the Start when the Start group is left (`followStart`), keeping the length, as a calendar does. Before, End jumped on every keystroke, for example on the way from "2" to "25".
  - End is never touched while the Start is not a real date, nor while End has its own wrong part. An empty End with a valid Start still gets +1 h.
  - The `validity` event is stored per group. Save now says "Correct the date and time above first." when a part is wrong, instead of "Set when it starts."
  - A group left with a blank part says "Enter every part: day, month, year, hour and minute." and announces it politely.
  - "Ended" needs a valid Start and a valid End in the past.
- **Ended card (C3-39).** The card uses `bg-muted` with the normal border and no `opacity`, so text keeps full contrast. I kept the card-level "Ended" chip and did not pass `ended` to `DateTimeFields`, so the legends do not read "(ended)" twice.
- **Repeat weekly.** The messages are now specific:
  - "0 weeks adds no dates. Enter a number from 1 to 52."
  - "Enter the number of weeks, from 1 to 52."
  - "Correct the last day to repeat on first." appears while the date has a wrong part. The date field itself says "November 2026 has 30 days."
- **Category (C3-52).** "Category setup" (Applies to, Level, Icon) and "Details" (Code) sit in `OtherSettings` ("Other settings (all languages)", folded under a non-default language tab). Both stay mounted, so the page rail, error links and Save still find them.
- **`EntityCombobox` (C3-33, C3-53).**
  - Search uses a local `fold` (NFD, marks removed, `toLocaleLowerCase`).
  - The closed value and the "chosen" announcement are trimmed.
  - The list shows the tree indent as padding by depth instead of leading spaces.

## Acceptance, measured (admin; "before" is the audit number or measured on the old code)
| Item | Before | After |
|---|---|---|
| Event Start hour 25, then Start minute 61, then 31 Feb, then an empty day. End was 10 Mar 2026 14:00. | hour 25 gave End 1/1/2000 02:00 | End stays 10/3/2026 14:00 in all four |
| Sentences | hour: red border and sentence, silent on the date | "Hour must be from 0 to 23.", "Minute must be from 0 to 59.", "February 2026 has 28 days.", "Enter every part: day, month, year, hour and minute." All four reach the live region. The hour input has `aria-invalid=true` and `aria-describedby` includes the error id. |
| Valid Start edit (12 Mar 15:00) | n/a | End 12 Mar 17:00 (length 2 h kept) |
| Ended card, `getComputedStyle` | `opacity .8` | `opacity 1`, background `rgb(233,235,239)` |
| axe (wcag2a/aa, 21a/aa) on an Event with an ended date | `color-contrast` serious, 15 nodes | 0 violations at 1440, 1024, 768 and zoom200 |
| Category `?lang=el` structural controls visible outside the fold | Category setup open, about 623 px tall, 23 controls visible | 0 outside the fold, fold closed; 25 radios inside after opening. axe 0 at 1440, 1024, 768, zoom200. Default tab unchanged (23 visible). |
| "παρθενωνας" in the POI combobox | 0 matches (audit) | 2 matches, including "Παρθενώνας" and "UX-R3-P5b Parthenon Παρθενώνας" |
| Same search in capitals | n/a | 2 matches |
| Place picked at depth 1 (closed value) | leading spaces (audit) | `"Acropolis Museum"`, no spaces; list paddings 0 / 20 / 40 / 60 px by depth |
| Category deactivate, ACTIVE POI user | n/a | `aria-disabled=true`, "Used by 1 point of interest. Choose another category in that point of interest first.", "Show where it is used" link |
| Category deactivate, DRAFT POI user | "Deactivate" dialog with only Close | unchanged; needs request 2 |
| Readiness "Warning:Italiano" | n/a | not reproduced. `textContent` "Warning:  Italiano", `innerText` and the accessible name ("Warning: This Event has no dates…") all have the space. Not mine, nothing to add. |

- **Keyboard (1024).**
  - Select all, type 25, Tab: focus goes to the minute and the hour is `aria-invalid`.
  - Retype 15 and Tab twice: focus lands on End day with 0 errors left.
  - Combobox: typing "parthenon", ArrowDown and Enter chooses an item, and focus stays on the combobox.
- **Screens covered:**
  - Event at 1440, 1024, 768 and zoom200.
  - Event with hour 25 in forced colours.
  - Category `?lang=el`, closed and open, at all four sizes.
  - Combobox search and places, repeat with 31 November, Category deactivate (both states).

## System additions
None. The shared `fold` is requested (request 3).

## Deferred
- DRAFT-user deactivate dialog (request 2) and the live gap that does not clear when a date is added (request 1). Both are in W0-B's files.
- Reading the Event "Warning:Italiano" item: nothing to fix (above).
- e2e: no spec references these editors' selectors, so none was edited. None can run here.
- The "Ended" chip stays at card level. If the orchestrator wants the legend "(ended)" instead, pass `:ended="ended(o)"` to the Ends group.

## Notes for other packages
- W0-B: requests 1 and 2.
- W0-A and CLN: request 3. There are now five copies of `fold`.
