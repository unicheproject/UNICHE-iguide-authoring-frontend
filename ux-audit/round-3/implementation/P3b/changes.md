# P3b Guides, Events, Categories lists and create dialogs: changes

Typecheck (vue-tsc, tsconfig.app.json) passes. check-css-tokens passes (57 files). `impeccable detect --json` on the 7 owned files returns `[]`. The literal gate grep over the owned files is clean. Nothing was committed or installed. The e2e specs cannot run here (Keycloak); no selector they use changed (create buttons "New guide/event/category" keep their names; the empty state now has one such button instead of two), so I edited no spec. P3a had not written `changes.md` when I started. I followed the P3-core contract literally and copied the column-budget and Updated conventions from P3a's `PoisView` (it already used `ListRowTitle`, `FilterField`, `ListSourceNotice`, `NBSP` Updated, Status 128, Updated 152).

## C3 ids
- Fixed: C3-42 and 43 (views: Title column, slug, chips, Updated), 44 (Updated, Next date, "Used by", story figures keep their units), 85 (the three create dialogs' non-field failure sentence), 87 (Guides and Events trigger failure notice), 88 (see Deferred for what stays in the frame), 91 (rows set after the triggers read, footer always mounted), 93 (Category scope `aria-describedby`; the rest is in W0-A files, see requests), C3-13 (`RadioChips` Home/End), 51 (`lang`/`back` on title links via `ListRowTitle`), 47 (single New button, "N matches in Archived").
- Partly: C3-89 (503 sentence and "Nothing was created" in the summary title are done here; "Creating..." is in `FormDialog`, request 2), C3-93 (Close offset and body padding are in `AppDialog`, request 1).

## Files changed (all owned)
`guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue`, `categories/RadioChips.vue`. Probes and shots: `ux-audit/round-3/implementation/P3b/{probes,before,after}/`. Requests: three items appended to `requests.md` (AppDialog, FormDialog, pending chip). No D, Q or G entries (none reserved to P3b). Records created: `UX-R3-P3b Guide|Event|Category <long Greek title>` (one each, in the Populated project, DRAFT).

## What changed
- All three lists: `ListRowTitle` (bdi, hit-44, `back`, `lang`); slug on one line, truncated, with `title`; Updated is `text-muted-foreground`, NBSP, one line; single `ListEmpty` New button via `header-action`, with `counts` and `status`; `ListFooter` mounted while loading with `:loading`; Status chip "Pending changes" wraps inside the 128 px column (`max-w-full whitespace-normal rounded-lg py-0.5`); header has no per-column `h-*`.
- Guides and Events: triggers read reported with `query.reportError("triggers")`, `ListSourceNotice` above the list, rows set only after the triggers read settles, chips line says "Triggers not loaded" when it failed; the Featured checkbox moved to `filters-extra`; Story figures use NBSP and reading time is its own line.
- Events: Next date on one line (NBSP in date and "until HH:MM", "next of N dates").
- Categories: `h-12` removed; "Applies to" filter is a `FilterField` at full width; "Used by N ..." moved under the code (it wrapped in the 168 px column), one line, truncated with a `title` on deep rows; code and "in Parent" are separate truncating spans; the icon aligns to the first line.
- Column budget (table width 990 at 1024 and 1280, 1158 at 1440): Guides Story 160 + Status 128 + Updated 152 + Translations 192; Events Next date 168 + 128 + 152 + 192; Categories Applies to 168 + 128 + 152 + 192. Order 48 and menu 56 in all.
- Dialogs: non-field failures use `describeError(e, "create the <noun>").body` (503: "The platform is busy or down for maintenance. Nothing was changed. Try again in a few minutes.", one request-id row, summary title "The guide was not created", no "things to fix"). Category scope fieldset carries `aria-describedby` to the hint, or to the error when invalid (it was only on the radios, and only on error).

## Acceptance, measured (admin, Populated project)
Before for the layout rows is my probe on the unchanged views. Table/cards mode, then Title cell min px, in the order 1440, 1280, 1024, 768:
- **Guides**: before table 422?, cards 922, cards 914, cards 658 (1440 table not re-measured); after table 422, table 262, table 254, cards 658.
- **Events**: before (1440 table), cards 922, cards 914, cards 658; after table 414, table 254, table 246, cards 658.
- **Categories**: before table 398, cards 874, cards 866, cards 610; after table 414, table 254, table 246, cards 610.
- Result: **all three are tables at 1440, 1280 and 1024** (plan §9 item 7); cards only at 768. Title >= 246 px everywhere in table mode (Events at 1024: 246 px, Next date on one line). Overlapping cell pairs 0, cells with overflowing content 0, document overflow none, in all 12 combinations.
- **Row heights** (median/max, rows of the Populated data; max includes my long-Greek rows): Guides 81/104 at 1440 and 81/120 at 1280 and 1024 (before cards 114/117); Events 81/106 and 81/120 (before cards 114/147); Categories 83/118 at 1440, 83/160 at 1280, 97/160 at 1024 (the Greek row; before cards 128/128; at 1440 83/83).
- **Slug**: one line, truncated with `title` (cut rows: Guides 6, Events 7 at 1280, Categories code 9); wrapped slugs 0 (before Categories code wrapped on several rows).
- **Updated single line**: 0 wrapped rows in all lists and widths. Categories 40 of 40 wrapped at 1440 before. Colour: all three `rgb(86,96,112)` (`muted-foreground`, same as POIs), before `rgb(55,65,81)` (ink-2) in these three.
- **"Used by N" wrap**: 27 of 40 rows wrapped at 1440 before, 0 after (cards 768 included).
- **Events "Next date"**: single line "4 Dec 2026, 19:00" in the 168 px column at 1440, 1280 and 1024; its second line ("until 22:00 · next of 4 dates") may wrap between words.
- **60+ character Greek titles** (92 and 95 characters, with a 70-character unbroken word): 0 overlaps, 0 overflowing cells at 1440, 1024, 768 (Guide 3, 4, 2 lines; Event 3, 4, 2; Category 3, 5, 2).
- **Create dialogs** (1440): Category scope `aria-describedby` resolves to the hint id, and to the error id when invalid (`aria-invalid` true). Alerts: 1 (the summary) in every state. A 503 on POST shows only "The guide|event|category was not created / The platform is busy ... / Request id req-p3b-503". Focus goes to the summary. Escape returns focus to the New button.
- **Dialog body bottom padding with "Edit slug" open: still 8 px** (and 8 px with it closed), Close centre 129 vs title centre 124 (5 px): both come from `AppDialog` (W0-A), see request 1. I could not fix them from the dialogs.
- **List 503** (1440, 1024, 768, zoom200, 3 lists): focus on the h1 every time, one request-id row, one sentence "The platform is busy ...". Triggers 503: 27 rows still listed, notice "Triggers could not be loaded ... Try again", rows say "Triggers not loaded".
- **Pristine empty** (3 lists): one "New ..." button each.
- **axe** (wcag2a/aa, 21a/aa) on the three lists at 1440 and 1024: 0 violations.
- **Keyboard**: Tab through Categories: New category, search, status, Filters, disclosure, title, three translation links, kebab, next row; every stop has a 2 px solid ring and is in the viewport. Dialog opens with focus on the Title field, Escape returns to "New category". Category editor Level/Scope radio chips: End selects the last, Home the first, scroll delta 0.
- **Shots** (`after/`): each list at 1440, 1024, 768, zoom200; long-Greek search at 1440, 1024, 768; filtered-empty at 1440 and zoom200; list 503 at 1440, 1024, 768, zoom200; triggers-503 at 1440; pristine-empty at 1440; forced colours at 1440; the dialogs (slug open, empty submit, 503) at 1440; Categories keyboard focus. Read and checked; I fixed the icon alignment and the Story line from them.

## Deferred
- C3-88 for the create dialogs: an unmapped 422 path already shows the message without link in `FormDialog` (W0-A); nothing left in my files.
- A 422 without field messages shows `describeError`'s "Check the fields marked in the form" with no field marked (rare; the platform normally maps fields).
- Guides/Events Filters popover now holds only the Featured checkbox (in `filters-extra`); it has no `FilterField` to show.
- Not measured: CLS of Guides/Events/Categories loads (the chips arrive before the rows now, as in P3a's POIs).

## Notes for other packages
- Requests appended to `requests.md`: `AppDialog` Close centring and body bottom padding; `FormDialog` "Creating..." to one ellipsis; a shared "Pending changes" wrap rule (`StatusChip` prop) so the six lists stop repeating the class string.
- P3a: if you chose a different Status chip approach in a 128 px column, the three lists here use `class="max-w-full whitespace-normal rounded-lg py-0.5"` on the pending chip.
- CLN: `CategoryFilterSelect`-style ad hoc label layouts are gone from Categories (uses `FilterField`); nothing of mine is dead.
