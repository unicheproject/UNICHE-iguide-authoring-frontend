# P7a changes (Media library and upload)

## Closed
C2-75 (list overprint), C2-51 (per-row missing text in the language in force; language-aware alt filter; one definition; Asset editor Translations card is P7b), C2-82 (view in URL, "(1 archived)", one count line; "in [language]" slot is the toolbar's, requested), C2-83 (toolbar hidden for an empty library), C2-76 (verified: dialog opens on its heading), C2-77, C2-79, C2-57 (Upload anyway / Skip / Undo skip focus; Reset has no control in my files), C2-09 / C2-40 (Media: ProblemAlert with request id, Try again; Describe now too), C2-21 (list skeleton with thead).
Partly: C2-51 "Needs translation in" / "Search in" as one Language control (ListToolbar is P3-core's; requests.md). "Used in N" source label left to P7b (editor tooltip, G-030).

## Files
`media/MediaView.vue`, `UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `DescribeNowDialog.vue`, `workspace/useAssetUpload.ts`, `platform/assets.ts` (`missingTextNames`), `e2e/media.spec.ts` (new test; cannot run here). AssetThumb unchanged. D-094 in DECISIONS.md. Requests appended. No Q entries.

## Acceptance (admin, Populated; scripts probe/flow/upload/states.mjs, shots in after/)
- List view columns (px, Name/Type+size/Status/Used in/Updated): 1440 598/192/144/112/112; 1280 438/...; 1024 430/...; no cell overflows or overlaps at 1440, 1280, 1024, 768 (cards), zoom200; no horizontal scroll. Before: 0 to 76 px "Needs attention".
- Upload dialog first focus: H2 "Upload files" (not the file input). Keyboard run Library -> 2 held files -> Skip (focus: next "Upload anyway") -> Undo skip (focus: its "Upload anyway") -> Upload anyway -> Skip -> "Choose files" -> Close -> "Upload files": activeElement never body. Names "Upload anyway, <file>"; axe wcag2a/aa/21 on dialog, list, error, empty: no violations (label-content-name-mismatch clean).
- "Clear filters": 1 button; after use focus is the search field; Type/alt filters reset with it. Count line "Showing 48 of 87 files (1 archived)"; filtered "31 files (1 archived)". `view=list|grid` in URL.
- 503 (page.route, detail "NullPointerException at X", title "SECRET"): "The platform is busy", request id, Try again; no server text. Empty (totalElements 0): no toolbar, "No files yet" + Upload files.
- vue-tsc: no errors in my files (others: ProjectList, DashboardView, other agents'). detect: [].

## Deferred / notes
- "Caption where required" in the completeness definition: model has title + alt only; unchanged.
- Created records: two "UX-R2-P7a-one.exe" uploads (left, DRAFT).
- Back after toggling the view leaves the page (replace, no history entry per toggle) by design.
