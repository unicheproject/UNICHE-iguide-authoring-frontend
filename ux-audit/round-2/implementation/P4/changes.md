# P4 changes (Place and POI editors, triggers card, media slots)

## Closed
C2-60 (empty beacon/geo rows flagged before any request, summary names "Beacon 1, UUID"), C2-66 (one visible "Audio narration" group in the Media card), C2-69 (coordinates checked on blur, `aria-invalid`, announced; POI and trigger rows), C2-23 (placeholders are "e.g." examples; no value-like text), C2-57 (focus lands on Replace after attach), C2-73 (trigger writes in parallel, partial sentence), C2-93 (QR caption states the measured PNG size: 512 x 512 px), C2-55 (language-independent cards fold under a non-default tab), C2-01 (MediaSlots has no size patches; icon buttons use `size="icon"`), C2-09 (trigger/placement error text comes from codes; no server text added), C2-59 wording untouched (W0-B).
Partly: C2-67 (height: see below; the Texts card is P4s's panel, request filed), C2-55 for Event/Asset (not my editors).

## Files
`pois/PoiEditorView.vue`, `places/PlaceEditorView.vue`, `editor/TriggersCard.vue`, `editor/QrCodePreview.vue`, `media/MediaSlots.vue`, `platform/triggers.ts`, `platform/pois.ts`, `e2e/place-editor.spec.ts` (new test, not run). New: `editor/OtherSettings.vue`, `editor/FilteredSelect.vue`. D-099 in DECISIONS.md; system.md and requests.md appended. No Q entries.

## Measured (admin, Populated, `UX-R2-P4 Empty POI` / `UX-R2-P4 Empty place`; scripts base.mjs, v1-v5.mjs, shots in after/)
- Empty POI, `main` scroll height: 1280x720 1,951 -> 1,581; 1440x900 1,911 -> 1,560. Not at 1,450: the Texts card is 735 px for a POI and the panel (P4s) sets textarea minimum rows and gaps; with its three changes (requests.md) about 1,470. Empty Place: 1,879 -> 1,781 at 1280, 1,764 at 1440 (four text fields).
- Save with an empty beacon and an empty area row: zero requests to `/triggers`; summary "5 things to fix": Beacon 1 UUID, Major, Minor, Geo-proximity 1 Latitude, Longitude; each field `aria-invalid`.
- Coordinates: "abc" on blur gives the error, `aria-invalid=true`, announced "Latitude: Use a number such as 37.9715..."; 95 gives "between -90 and 90"; "37,9715" becomes 37.9715; one filled axis asks for the other.
- Partial save (503 mocked on the beacon POST): the three POSTs started 153 ms apart (parallel), POI saved, summary "The point of interest was saved. Beacon 1 could not be saved: your changes to it are still in the form." with request id, state "Unsaved changes", three rows kept; the retry sent one POST (the QR and area rows were adopted, not duplicated) and ended "Saved".
- Attach primary image: focus on "Replace Primary image" (`data-replace=HERO_IMAGE:all`).
- Tab stops from Save to the end of Placement: 11 (title, summary, description, Practical details, Place, Category, Latitude, Longitude, Set position); inside Placement 5 (target <= 8 met only inside the card; the texts fields precede it).
- Greek tab: "Other settings (all languages)" collapsed, cards hidden; opens on click; English tab shows the cards again. Filter field: with 32 mocked place options "acro" leaves 4 and says "4 of 31 match".
- axe serious/critical: none for POI and Place at 1440, 1024, 768, zoom200; no horizontal overflow. Forced colours checked (1440). `impeccable detect`: []. vue-tsc: no errors in owned files.

## Deferred / notes
- Map behind "Set position on the map" (opens a 220 px map) instead of an always-open 260 px map; the coordinate fields are the first path. Clicking a control below a coordinate field right after an error appears can miss because the error line moves it (blur error pattern); not reserved to keep the card short.
- Working-copy saves (ACTIVE items) stay all-or-nothing for triggers: `saveCopy` cannot take a partial result.
- Not run here: e2e. "Test in preview" already carries `?trigger=<id>` (unchanged link text); P8 handles the target. Records `UX-R2-P4 ...` remain (POI with a QR, area and beacon trigger; one Place).
