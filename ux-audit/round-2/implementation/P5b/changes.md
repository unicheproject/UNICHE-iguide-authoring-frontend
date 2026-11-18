# P5b changes (Event and Category editors, round 2)

## Closed
C2-52 (Event: dates on `DateTimeFields`, one 24 h formatter, Greek tab dates and preview in the tab's language), C2-55 (Event), C2-59 (Category sentence: shell's reason plus the lock text now agree), C2-69 (Event end-before-start), C2-72 (Repeat weekly clamp, icon grid, scope switch, combobox look), C2-43 (Category "Used in"/"Used by" merged; Texts section already the shared panel heading), C2-53 (combobox `dir="auto"`).
Partly: C2-43 list items (list views, P3b), Used in collapse after 5 (shell, request).

## Files
`events/EventEditorView.vue`, `events/EntityCombobox.vue`, `events/eventDates.ts`, `categories/CategoryEditorView.vue`. `CategoryIcon.vue`, `platform/events.ts` (en-US there only reads numeric clock parts), `platform/categories.ts`: no change needed. No D or Q entries (none reserved for P5b). Requests appended to `../requests.md`.

## What changed
- Dates: start and end are `DateTimeFields` (Day, Month name, Year, Hour 0-23, Minute; format hint; "(required)"); no native date/time inputs, no "AM/PM". Moving the start keeps the length (remembered while a half-typed year empties the value). List re-sorts when focus leaves a date's fields. Summary line, read-only list, preview and repeat preview all use `lib/format` through `eventDates.ts` (`formatEventDay/Time/Span/When/Preview`, `localeForLanguage`).
- End before start: the message and `aria-invalid` show once the end group is left (or after a failed Save) and are announced with `say(..., "polite")` ("Date 1: It must end after it starts."); gone as soon as it is corrected. No Save needed.
- Non-default language tab: Texts, read-only dates (written in that language: "Τετ 18 Νοε 2026 · 10:00–11:00") and one collapsed "Other settings (all languages)" with a "Go to English" button. Where, Media, triggers and Details are not rendered there. A saved error on a hidden field switches back to the default tab.
- Repeat weekly: "(1 to 52)" beside the number; typing 99 sets 52 at once and shows "99 is more than the limit of 52 weeks at a time, so 52 is used. Repeat again for more." (also announced). "Until" uses `DateTimeFields` (date mode) outside the radio's label.
- Comboboxes: chevron turns when open, "Type to search" placeholder while open, muted "None", `dir="auto"`, a hint on each of Place, Point of interest, Route; the drafts note stays once under the row.
- Category: one "Used in" card (the shell's); lock text "Choose another category in that one first (see “Used in”)" and its link focuses the card; scope switch announced ("Applies to Routes. Level reset to top-level."); icon grid: ArrowDown/Up move by the real row length (measured from the layout), Left/Right by one, selecting as they go.

## Measured (admin, Populated; records `UX-R2-P5b Event`, `UX-R2-P5b Category`; scripts v1-v4.mjs, shots in after/)
- Event editor: native date/time inputs 0; "AM/PM" in body: false. Start typed 17 to 20: end followed (17 to 20). End day 10 before start 20: error text and one `aria-invalid` group after blur, live region "Date 1: It must end after it starts."; cleared when end set to 24.
- Repeat 99 becomes 52, message visible. Combobox ArrowDown + Enter chose "Athens Historic Centre". Greek tab headings: Texts, Dates, Other settings (all languages).
- Icon grid ArrowDown from item 1: 8 (7 columns at 1440 and 768), 10 (9 at 1024), 6 (5 at zoom200); ArrowUp returns; ArrowRight +1; selected follows.
- Category in use (Monuments, 17): one "Used in (17)" card, status reason "Used by 12 points of interest...", focus lands on `#used-in-heading`.
- axe serious/critical: none (Event 1440 and zoom200, combobox open, Category 1440 and zoom200). No horizontal scroll at 1440, 1024, 768, zoom200. Forced-colour shots taken (event-forced, category-forced). Typecheck clean; `impeccable detect` []. e2e: no spec uses the changed selectors; none run (cannot here).

## Deferred / notes
- Used in collapse after 5 and the "each of them" wording are in the shell (request). Event preview language switches with the tab; the header "Saved" and toast use the shell formatter (P4s).
- Keyboard-only run of the date fields was exercised through Playwright keyboard/fill, not with a screen reader.
- Records `UX-R2-P5b ...` remain (Draft Event with 2 dates, unused Draft Category).
