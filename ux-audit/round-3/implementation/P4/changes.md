# P4 changes: Place and POI editors, triggers, media slots (Round 3)

## C3 ids
- Fixed: C3-20 (partial trigger save), C3-30 (Triggers card height, beacon head wrap), C3-34 (Map link), C3-69 QR items (print size, link wrap, "Link copied" one line).
- Partly: C3-12 (coordinates announce once: no change needed in P4 files, left as is), C3-63 (Practical details padding and forced-colours border live in `TranslationsPanel.vue`, a W0-B file; requested, not built).
- Not done: the POI "Tab stops Save to end of Placement <= 8" target (see Acceptance). MediaSlots.vue was not changed (nothing in scope needed it).

## Files changed
- `src/platform/triggers.ts`: `TriggerForm.problem`; `syncTriggers` returns `ids` (row key to trigger id) and failures carry the row `key`; `reconcileTriggers(forms, notice)`; `rowFailureText`; `PartialTriggers` now carries `triggers`, `ids`, `rows`; a DUPLICATE_VALUE from a trigger row is rewritten to a 422 field error at the row ("This code is already used by another item in this Project..." or the beacon UUID/Major/Minor sentence), so the editor's "Another point of interest ... uses this qr code 1, code" sentence can no longer be built from a trigger row; if a create hits DUPLICATE_VALUE and an identical trigger already exists on this item, that row is adopted as saved; an adopted or half-created DRAFT trigger is now activated.
- `src/components/editor/TriggersCard.vue`: saved rows collapse to one line (type chip, summary, Edit/Done, Test, Remove). New rows, rows with an error, and failed rows stay open. A failed row shows "Not saved: <sentence> Save again to retry...". The sentence clears when the row is edited. "Mobile app only" chip removed (the beacon description now starts "Mobile app only:"). Buttons use `aria-label` ("Edit QR code", "Done with ...", "Test in preview for ...", "Remove ..."). Rows have `data-trigger-row`, `data-open` and `data-trigger-problem` hooks.
- `src/views/workspace/pois/PoiEditorView.vue`, `places/PlaceEditorView.vue`: `onPartialSave` replaces saved rows with the returned triggers (same row key) and keeps only failed rows marked.
- `PlaceEditorView.vue`: Map/Floor plan select shows "Saved immediately, not with Save." and a `role=status` line "Linked to “X”." with Undo (Undo restores the previous choice and offers nothing further); the 503 sentence uses `problemText`.
- `QrCodePreview.vue`: "Link copied" with no URL body; "Prints sharp up to N cm wide." (300 dpi from the image's pixel size); the URL wraps only after `/ ? = &`.
- `BackendQrCode.vue`: 503 uses `problemText` ("busy or down for maintenance"), not "not reachable".
- `e2e/place-editor.spec.ts`: new test "a partly saved trigger list keeps the saved row and retries only the failed one". It was not run (e2e cannot run here).
- No D/Q/G entries (none reserved for P4).

## Acceptance (before from the audit, after measured at 1440x900, admin account)
Test data: `UX-R3-P4 POI three triggers` (QR, Geo, Beacon, all saved), `UX-R3-P4 Place`, `UX-R3-P4 Map`, plus spare duplicates (`UX-R3-P4 Place`/`POI` copies from a re-run).
- Saved row height: collapsed 50 px each (target <= 56; before about 330 / 240 / 290). Row head is one line at 1440, 1024, 768 and zoom200 (head 48 px).
- Triggers card with 3 saved rows: 316 px (before 1,074 on an ACTIVE POI; 722 for QR + geo).
- Editor `main` scroll height, POI with 3 saved triggers: 1,655 px at 1440 (before about 2,270 for a DRAFT with three, 2,496 ACTIVE). This meets the brief's <= ~1,700 but NOT the plan's <= 1,500. The remaining height is Texts, Placement and Media (not P4 files).
- Other widths: 2,033 px at 1024, 2,050 at 768, 2,297 at zoom200. A row expanded: 231 to 285 px.
- Partial failure (route-injected 503 on the Geo create): the summary says "Saved in part ... Geo-proximity 1 could not be saved", the request-id row shows, the QR and Beacon rows collapse to saved, the Geo row stays open and says "Not saved: The platform is busy or down for maintenance...". Retry sent exactly one create plus its activation for the failed row (a measured write list), and no duplicate sentence appeared.
- Lost-response case (create reached the platform, answer 503): the retry adopted the row and only activated it (1 POST), with no "already uses" text.
- Place map link: the select links at once; "Linked to “UX-R3-P4 Map”." appears with Undo; Undo restores "No map". Linking does not make the form dirty (unsaved stayed false). When the form was already dirty, the header said "Unsaved changes" only because of the author's own edit.
- Tab stops from Save to the end of Placement: 14 (POI: More actions, language tab, Next missing, title, summary, description, Practical details, two FilteredSelect filter inputs, Place, Category, Lat, Lng, Set position). The Placement section alone is 7. Not <= 8 without changing the Texts panel and `FilteredSelect` (W0-B).
- axe (wcag2a/aa, 21a/aa): 0 violations on the POI editor (collapsed, one row open) and the Place editor.
- Keyboard: Enter on Edit expands (`aria-expanded` true) and focus stays on the Done button.
- Typecheck: no errors in P4 files (remaining errors are in `DashboardView.vue`, not mine). `check-css-tokens`: ok. Gate grep over the owned components: nothing. Impeccable detect: `[]`.
- Screenshots in `ux-audit/round-3/implementation/P4/after/`: collapsed at 1440, 1024, 768 and zoom200; one row open at 1440, 1024, 768 and zoom200; forced colours; partial failure; retry; Place linked, undone, linked while dirty. Scripts are in `P4/scripts/`.

## Deferred and notes for other packages
- W0-B: the "Practical details" disclosure padding and forced-colours border are in `TranslationsPanel.vue`; the two extra tab stops come from the `FilteredSelect` filter inputs. Both are in requests.md or noted here.
- Row names in the summary ("Geo-proximity 1") are always numbered by `triggerRowName`, which the existing e2e spec relies on.
- The working-copy path (ACTIVE items) still stops the save on any failed row and puts the triggers back; only DRAFT saves are partial. The mapped row error shows at its field there too.
- Spare test records created: the extra `UX-R3-P4 Place` and `UX-R3-P4 POI` copies from a re-run; harmless.
