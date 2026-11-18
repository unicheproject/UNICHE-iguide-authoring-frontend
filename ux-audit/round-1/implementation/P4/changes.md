# P4: Place and POI editors, TriggersCard, media slots

## Closed
C1-24 (these two editors: section order Texts, Placement or Place setup, Media, How visitors reach it, Details), C1-28 (triggers card), C1-91/C1-92 (triggers and QR),
C1-80 part (coordinate fields and pin in sync, range and comma validation; engine props are P6's and GeoPicker already carries them), C1-33 part (draft-asset warning in the media card; not in the shell's list, see requests.md),
C1-23 for these editors (saves already parallel through `useResourceEditor`; not re-timed).

## Files
`PoiEditorView.vue`, `PlaceEditorView.vue`, `TriggersCard.vue` (rewritten, wraps itself in `EditorSection`), `QrCodePreview.vue`, `BackendQrCode.vue`, `MediaSlots.vue` (compact; `scope`, `language`, `itemStatus`),
`platform/pois.ts` (`checkPoiPosition`), `platform/triggers.ts` (`checkTriggers`, token chip classes, comma-tolerant numbers), `e2e/place-editor.spec.ts` (selectors). `place-map-link.spec.ts` needs none (`#f-link` kept). No D/Q entries (none reserved).

## Behaviour
- POI: Texts (audio narration chosen per language inside the language tab), Placement (Place, Category, lat/long, pin side by side), Media (filled slots as rows, empty ones as one wrapped row of buttons), triggers, Details collapsed with count. 'abc', 999 or a comma give field errors, no console error; "37,9715" is accepted and tidied on blur.
- Place: Texts, Place setup (Level radios, Type, Map or Floor plan, linked map canvas with area edit, "Inside this place" list of child places and POIs), Media, triggers, Details (slug, internal name, featured). Indoor shows "Open floor plan" and the x/y note, no outdoor map.
- Triggers card: QR block always drawn (image, link, Copy link, Download PNG, Open; or dashed frame with reason and "Set the web address"), one warning alert per card without a public address, per-row "Test in preview" (to Preview; query `trigger=<id>` for saved rows), "Remove QR code" with confirm, focus to the next row, announced; beacon UUID on its own row, labelled Major, Minor, Suggest within, Wait, "Mobile app only" chip and note; row errors at the field with `data-path`; AR note once as a HelpHint. `checkTriggers` validates UUID, major/minor, radius, coordinates.

## Acceptance (Windows Node, dev server, Populated Project; records `UX-P4 ...`, ids in records.json)
- Main scroll height at 1440: POI ACTIVE 1,910 (was 2,491 before this work), ARCHIVED 1,854, DRAFT with three triggers 2,760; form content itself about 1,640 px. Target 1,450 NOT met; the remaining height is the W0 Texts card (three auto-grow textareas) and the 260 px map.
- Placement is the second section, one click on the rail; Place INDOOR 1,985, OUTDOOR 2,278.
- Coordinate checks, no-address QR state (surfaces response rewritten), remove confirm, keep focus: pass (checks.mjs output). axe wcag2a/aa/21: clean on POI draft with errors, draft without address, active, archived, Place outdoor, indoor, sub-place. No page or console errors.
- Tab count from the field above the map to Save: Save is in the sticky header before the form, so forward Tab never reaches it (the check ran 41 tabs to wrap); Ctrl/Cmd+S is the shortcut. Not met as written.
- Screenshots `P4/after/`: poi draft, active, pending, archived, Greek draft, coordinate errors, triggers without address, remove confirm, forced colours; place outdoor, indoor, sub at 1440, 1024, 768, zoom200 (plus `-tall` at 1440).
- 'Save of 9 requests under 1.5 s' not timed. e2e specs not run (no Keycloak here). `impeccable detect` and token grep: clean. vue-tsc: clean for my files (one error in P5a's `GuideEditorView.vue`).

## Deferred
- Pending POI "ACTIVE with pending changes" shows the saved-copy banner; Place pending state not shot.
- Draft-asset line in the shell readiness list and `?trigger=` handling in Preview: requests.md.
- Shortening the 260 px map and Texts card belongs to P6 / W0.
