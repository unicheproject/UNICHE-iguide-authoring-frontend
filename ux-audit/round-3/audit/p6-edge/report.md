# p6-edge (error and edge-case tester, "hostile day") — Round 3

Mode: impeccable **Operate**; its interview steps are skipped (subagent). Rules cited: critique.md "Nielsen #9: help users recognise, diagnose and recover from errors", audit.md "check every state, not only the happy path", polish.md "alignment and overlap at every viewport", operate.md "verify in the running product with evidence". Account `admin`, Project `UX Audit – Populated`, only `UX-R3-p6 …` records (Place A, POI A/B, Route A, Guide A, Event A, Category A, plus created guides and 19 `ux-r3-p6-img*` assets). Scripts `*.mjs`, logs `logs-*.txt`, `shots/` (about 110 PNG) all in this folder. No pre-existing record was saved, applied or archived.

## Verdict
The error layer is much improved: across about 150 forced states the canary `SECRET-SERVER-DETAIL` never appeared in a title, body, toast or announcement (only in an upload row for a 422 field message, which is allowed). Sentences are chosen by code and a request id is shown nearly everywhere. Real problems remain at the edges: a dismissed session-ended dialog leaves Save stuck on "Saving…", a partial trigger-row failure tells the author "Nothing was changed" while one row was saved and then blocks the retry, and the sticky error summary overlaps content at 1280 and at zoom 200.
Score range: 68–84 per screen (final-round caps apply: open P1 caps at 85). Counts: P0 0, P1 2, P2 14, P3 13.

## Context check
- `12-cms-experience`: the editor shows a Working Copy for ACTIVE items with Save draft / Apply / Discard (seen on POI B).
- `14` §4: errors linked to controls, announced, summarised with links (verified on 422, coordinates, create dialogs).
- `03` §1: lifecycle DRAFT, ACTIVE, ARCHIVED; archive blocked while referenced (verified).
- `DECISIONS.md` D-087: server `detail`, `title` and `message` never become error text (verified by canary).
- `PRODUCT.md`: authors work calmly and need to know whether their work is safe (violated by R3-p6-01 and -27).

## Scores (final-round, strict)
| Screen / state | Task 25 | Visual 20 | Consistency 15 | Copy 15 | A11y 15 | States 10 | Total | Cap |
|---|---|---|---|---|---|---|---|---|
| POI editor: save errors (401/403/404/409/422/5xx/offline/slow) | 19 | 14 | 11 | 12 | 12 | 9 | 77 | P1 -> 85 |
| Session ended / re-sign-in | 15 | 14 | 12 | 13 | 12 | 7 | 73 | P1 |
| Working Copy Apply / Save draft conflicts | 17 | 14 | 10 | 11 | 12 | 8 | 72 | P2 |
| Triggers partial failure | 11 | 14 | 10 | 8 | 11 | 6 | 60 | P1 |
| Create dialogs (6 kinds) | 21 | 16 | 12 | 11 | 13 | 9 | 82 | |
| List load / partial read failures | 20 | 15 | 12 | 12 | 11 | 9 | 79 | |
| Upload dialog and Describe now | 21 | 16 | 12 | 13 | 11 | 9 | 82 | |
| Coordinates (editor) | 22 | 16 | 12 | 13 | 13 | 8 | 84 | |
| Archive / Deactivate / Undo | 22 | 16 | 12 | 12 | 13 | 8 | 83 | |
| Offline banner | 18 | 10 | 12 | 13 | 11 | 7 | 71 | |
| Maps tile failure | 20 | 15 | 13 | 14 | 12 | 7 | 81 | |

Nielsen (0-4): visibility 3, match 3, user control 3, consistency 2, error prevention 3, recognition 3, flexibility 3, aesthetic 3, **error recovery 2**, help 3.

## Job walk
| Job | Result | Notes |
|---|---|---|
| Recover from a failed save (5xx, 503, network) | pass | fixed sentence, request id, "Your changes are still in the form"; ~10 s |
| Recover after the session ends | **partial** | dialog fine, edits restored after sign-in; but dismissed -> Save stuck (R3-p6-01); code stays in the address bar |
| Resolve an edit conflict | partial | DRAFT Save 409 pass (real and forced); Working Copy real 409 old wording (R3-p6-19); Apply 409 lacks request id |
| Create items with errors (422, 503, offline, double submit) | pass | one POST; but "1 thing to fix" over a server fault |
| Save triggers when one row fails | **fail** | R3-p6-27 |
| Archive / deactivate while referenced | pass | reason + link; not tested: own-trigger case G-037 |
| Upload files (too big, wrong type, duplicate, cancel, retry, many) | pass with nits | focus drops on Cancel (R3-p6-21) |
| Enter coordinates | pass | |
| Leave with unsaved changes (link, brand link, reload) | pass | one guard; stale "Places loaded" (R3-p6-13) |
| Load lists with failed reads | partial | Routes categories read fails silently-ish (R3-p6-10) |

## Round-2 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C2-09 raw detail echoed; 503 wording | partly | canary never shown anywhere (editor, lists, create, upload, apply). 503 reads "busy or down for maintenance" in lists/save, but editor-load heading and all create dialogs still say "The UNICHE platform is not reachable" (R3-p6-07, -11) |
| C2-10 403/404 on save | fixed | 403 "You no longer have access to this point of interest … Ask a Project manager"; 404 "This point of interest was removed … Your changes stay in this browser as a draft" + request id |
| C2-11 offline | partly | banner slot, Ctrl+S says why, "Back online" clears the "not saved" state; banner clipped / overlapping (R3-p6-05); aria-disabled Save silent (R3-p6-06) |
| C2-12 toasts | partly | identical toasts not stacked in my runs; archive shows bar plus toast (R3-p6-16), warning triangle on success (R3-p6-15) |
| C2-13 error states focus | partly | editor error cards focus the h1; list error cards leave focus on body (R3-p6-08) |
| C2-14 code/state in address bar | not fixed | after "Sign in again" the URL still ends `#state=…&code=…` after 4 s (R3-p6-29) |
| C2-15 session dialog dismissible | partly | Esc and "Stay on this page" work, but leave Save stuck (R3-p6-01) |
| C2-57 focus to body | partly | fixed for Activate (focus on Status heading), Restore (first field), Archive; not fixed for upload Cancel and list errors |
| C2-62 409 dialog | partly | DRAFT: three-way, "Reload their version (discards your 1 change)", request id, only both-changed fields, stray space fixed. Working Copy real 409: old wording (R3-p6-19). Apply 409: no request id (R3-p6-17) |
| C2-63 restore-draft row | fixed | one 46 px row, "Restore (1 field)", focus on first restored field, cleared by Save; redundant after failed save (R3-p6-03) |
| C2-64 archived editor | partly | single Restore button, but toast still has a warning triangle |
| C2-68 save errors / focus | fixed | focus moves to the alert; 422 summary links; stable area |
| C2-69 coordinate errors on blur | fixed | aria-invalid + describedby + announcement on blur |
| C2-76 upload focus | fixed | opens on the heading |
| C2-77 label in name | fixed | "Upload anyway, <file>" |
| C2-79 upload density | partly | formats collapsed, "Retry" on cancelled rows; "Needs your decision" wraps |
| C2-33 readiness counted four ways | partly | 3 warnings on DRAFT, 6 right after Activate (R3-p6-14) |
| R2-V-02 HelpHint 32 px | not fixed | "What is a Working Copy?" and "Why is AR scan target not available?" are 32x32 at fine pointer |
| R2-V-03 sticky chrome share | not fixed (worse with errors) | at zoom200 header + 422 summary = ~530 of 720 CSS px (R3-p6-02) |
| R2-V-04 toast overlap | not fixed | archived toast covers the Latitude field at 1440x900 |
| R2-V-07 editor height | not measured (document scroller is inner) | |

## Findings
- R3-p6-01 (P1) After the persistent-401 "Your session ended" dialog is dismissed ("Stay on this page" or Esc), the header Save button stays "Saving…" (disabled) and the status says "Still saving…" forever; Ctrl+S does nothing; no sentence says the session is over. Shot `poi-editor__401-persistent-dismissed__1440.png`.
- R3-p6-02 (P2) 422 summary card is sticky and covers the top of the Title field it links to (`poi-editor__save-422__1440.png`).
- R3-p6-03 (P3) After a failed save the "Unsaved changes from 11:27 are kept in this browser. Restore (1 field)" row appears while the same edit is still in the form (404/409/422/5xx): offering Restore on an unchanged form is noise.
- R3-p6-04 (P3) Network failure says "Check your connection and try again" (no "not reachable" wording; no requestId possible); 500/502/504 share one sentence.
- R3-p6-05 (P2) Offline banner (absolute, 544 px wide, 81 px tall, 3 lines) is clipped under the sticky editor page head (the third line and "Check again" are cut: `poi-editor__offline-ctrl-s__1440.png`), and on 768 px lists it overlaps the page subtitle (`poi-list__offline__768.png`).
- R3-p6-06 (P3) Offline: clicking the aria-disabled Save gives no feedback (title tooltip only, nothing announced); Ctrl+S announces "You are offline. Your changes are kept…". Inconsistent.
- R3-p6-07 (P2) 503 on an editor load: heading "The UNICHE platform is not reachable" contradicts the body "busy or down for maintenance" (C2-09 asked for "not reachable" only for network failures) (`poi-load__load-503__1440.png`).
- R3-p6-08 (P2) List error cards (POI/Place/Route/Guide/Event/Category/Media) leave focus on `<body>` (editor error cards focus the h1). Maps & Floor plans: when one tab's read fails the tab count shows a false "0" (Maps 0 / Floor plans 8) (`maps__load-503__1440.png`).
- R3-p6-09 (P3) Request id affordance inconsistent: state card "Copy", list alert "Copy request id", Maps/Floor plan alert none.
- R3-p6-10 (P2) Routes list with the Categories read failing: Category cells say "Not loaded" but there is no alert and no "Try again" (POI list with Categories failing does show ListLoadError) (`routes-list__reads-503-categories__1440.png`). Trigger read failing on POI list: trigger chips and the "No trigger" label silently disappear, search placeholder still says "or trigger" (P3).
- Verified OK: languages/Categories/Places read failures on POI list show a ListLoadError with Try again and never "Add a language first"; Guides/Events/Categories/Places with languages 503 show ListLoadError.
- R3-p6-11 (P2) Create dialogs (all six kinds) on a 503: summary titled "1 thing to fix" over "The UNICHE platform is not reachable. Nothing was created." Wrong diagnosis (editor says "busy or down for maintenance") and nothing for the user to fix. Focus does go to the summary; request id shown (`guides-create__503__1440.png`). 422 in create dialogs verified: summary "2 things to fix" with field link, announced (two alerts), focus on summary; unmapped field error appears in summary without a link (acceptable).
- R3-p6-12 (P3) Create double-submit verified safe (1 POST for click+click+Enter; Cancel disabled; Esc ignored while "Creating..."). Nits: label "Creating..." uses three dots while the editor uses "Saving…" (one ellipsis character); offline create says "nothing was saved" in a create dialog (503 says "Nothing was created"); offline again under the heading "1 thing to fix"; no live announcement while creating.
- R3-p6-13 (P2) After cancelling the unsaved-changes guard (Keep editing / Esc) the live region announces "Places loaded" while the author is still on the POI editor (stale route announcement) (`logs-e10.txt`). After Esc on the guard, focus lands on the page h1, not on the link that was clicked.
- Verified OK: guard on link / brand link / reload (native beforeunload), single guard dialog with accurate copy ("Leave without saving?", "They stay in this browser as a draft") and buttons "Keep editing" / "Leave without saving"; restore row after reload is one compact 46 px row ("Restore (1 field)" / "Discard"), Restore focuses the first restored field, Save clears it. Nit: Restore announces only "Unsaved changes" (not what was restored).
- R3-p6-14 (P2) Readiness count changes across a transition: POI B read "3 warnings, nothing blocks" as DRAFT (header, card and Activate dialog) and "6 warnings, nothing blocks" the instant after Activate (adds an "Other (3)" group) (`poi-editor__activate-dialog__1440.png`, `poi-editor__activated__1440.png`); the Activate dialog also repeats "3 warnings, nothing blocks" three times in 150 px (C2-33 only partly fixed). Activate double-submit verified safe (1 POST for click+click+Enter).
- R3-p6-15 (P3) Archived success toast still shows a warning triangle (C2-64 residue) and sits over the Latitude field at 1440x900 (`poi-editor__archived-undo__1440.png`). Archive from the editor has no Undo (Restore as draft in the Status card only).
- Verified OK: Deactivate/Archive of a POI used by a Route: dialog "It is still used by the items below. Remove it from them first, then try again." + Used-in table with link "(opens its editor)" + status chip, single Close, focus on heading, Esc returns focus to the opener (`poi-editor__deactivate-referenced__1440.png`).
- R3-p6-16 (P3) List archive: the Undo bar (below the table, after "Archived 1") and the toast both announce the same archive in different words ("archived. It is under Archived now." / "Archived … is archived. It is hidden from the default list…"), and the toast repeats the title. After navigating to Routes the Undo is gone but the stale toast stays (`poi-list__archived-undo__1440.png`). Undo bar itself verified.
- R3-p6-17 (P2) Apply 409 (forced, `currentVersion: 99`): dialog is the per-field Mine/Current merge with "Discard my changes" / "Save my choices" (good, `poi-editor__apply-409-forced__1440.png`) but, unlike the Save 409 dialog, shows no request id, and its heading is a 14-word sentence ("UX-R3-p6 POI B A-disjoint B-same changed since your pending changes were started"). 503 and 422 on Apply could not be re-tested because the conflict dialog stayed open (script limitation; see Unverified).
- R3-p6-18 (P3) With 25+ Places the Place control becomes a placeholder-only "Filter places…" input stacked above the select (no visible label, Category column left with a blank gap below) (`poi-editor__place-filter__1440.png`).
- R3-p6-19 (P2) REAL conflict on Working Copy "Save draft" (two tabs on one ACTIVE POI; the other tab applied first): the dialog is the OLD one, "Reload to see their version and lose your changes, or keep your changes and save them over theirs." with a bare "Reload their version" (no "discards your N changes", no three-way merge, no per-field Mine/Current), unlike the DRAFT Save 409 (`poi-editor__real-wc-conflict__1440.png`). C2-62 is therefore only fixed for DRAFT saves.
- Upload verified: dialog opens focused on its heading (C2-76 fixed); wrong type is held ("Needs your decision", Upload anyway / Skip, sentence says why); too big shows "Exceeds the 20.0 MB limit for image files. Retrying cannot help: choose a different file." with no Retry (good); one polite live announcement summarising all (`upload__wrong-type-too-big__1440.png`). Nit R3-p6-20 (P3): "Needs your decision" wraps to two right-aligned lines beside the buttons at 1440.
- R3-p6-21 (P2) Upload dialog: clicking a row's "Cancel" or "Cancel remaining" removes the focused button and focus falls to `<body>` (inside a modal dialog) (C2-57 residue; `logs-e21.txt`, `upload__cancel-one__1440.png`). Cancelled rows then offer "Retry" (good) and the live region announces "upload cancelled" per file.
- Upload verified: 8 files at once (concurrency 2, "Waiting"), forced 503 row shows fixed sentence + Retry + "Copy request id" and the live summary "6 uploaded, 2 failed"; Retry re-uploads only the retryable row; a name-duplicate is held with "This looks like a copy of X. Choose Upload anyway or Skip" (the sentence repeats the same name when the copy has the same name, so it adds nothing); Upload anyway / Skip names start with the visible text "Upload anyway, <file>" (C2-77 fixed). A forced 422 on upload puts the server's field message verbatim in the row and the live region (allowed for 422; canary shows there only because it was placed in `errors[].message`).
- R3-p6-22 (P3) Esc during upload with held (Upload anyway / Skip) rows closes the dialog without any confirmation or note that held files were dropped.
- R3-p6-23 (P2) "Describe now" (opened from the upload dialog as a second stacked dialog) on a 422 save: "Some fields need a change. Check the fields marked in the form." but no field is marked (the server's field message is not shown), the alert offers "Try again" (cannot help a 422) and focus stays on "Save and finish" (`describe-now__save-422__1440.png`). 503 shows the fixed sentence + request id + Copy + Try again (ok).
- R3-p6-24 (P2) Working Copy editor header carries TWO primary-looking "Save draft" buttons at once (header and the Working Copy bar) plus "Save and apply" when dirty; with a long title the h1 wraps to two lines at 1440 and the header grows (`poi-editor__coords-out-of-range__1440.png`). The 422 summary again overlays the Title label/hint (sticky, confirms R3-p6-02).
- Coordinates verified on the POI editor: "37,9715" is accepted and normalised to 37.9715; letters, "1e2", "23.7257.1" -> "Use a number such as 37.9715. A comma or a point is fine as the decimal mark."; out of range -> "A latitude is between -90 and 90." / "A longitude is between -180 and 180."; one axis only -> "Enter a longitude too, or clear the latitude." on the other field. Errors appear on blur with aria-invalid + describedby (C2-69 fixed for the editor), then again as the Save summary with links; focus goes to the summary. Nits R3-p6-25 (P3): each blur announces 2-3 overlapping alerts (field text, then "Longitude: <same text>"); "0, -0" saved without a hint; range sentences ("A latitude is between…") are statements, not instructions, unlike the other messages.
- R3-p6-26 (P3) Map tile host blocked: sentence "The map background could not be loaded. Placement still works with the coordinate fields." + Try again is right and announced, but it sits under the 500 px map (partly below the fold at 1440x900) and the map shows a grey canvas with 32 px blank gutters (`map-editor__tiles-blocked__1440.png`).
- R3-p6-27 (P1) PARTIAL FAILURE on trigger rows is mishandled (POI B, QR + Geo-proximity rows added, POST for the Geo row forced to 503, `poi-editor__trigger-partial-failure__1440.png`): the QR POST succeeded, yet the banner says "The point of interest was not saved. The platform is busy… Nothing was changed. … Your changes are still in the form." It does not name the failing row, and "Nothing was changed" is untrue. Pressing Save again then fails with "1 thing to fix: QR code 1, Code: Another point of interest in this Project already uses this qr code 1, code." — the "other" POI is the same record's own just-saved trigger, and the sentence is garbled (lower-cased "qr code 1, code"). Result: the author cannot save without deleting the first row; the UI and server disagree (`poi-editor__trigger-retry__1440.png`). Recommendation: after a parallel batch, reconcile saved rows (mark saved, keep only failed rows), name each failed row ("Geo-proximity 2 was not saved"), and map own-record duplicate to "already saved on this item". Files: `useResourceEditor.ts`, `TriggersCard.vue`, `platform/triggers.ts`. Effort M.
- R3-p6-28 (P3) HelpHint buttons remain 32x32 at fine pointer (R2-V-02 residue).
- R3-p6-29 (P2) After "Sign in again" the address bar keeps `#state=…&session_state=…&iss=…&code=…` (C2-14 not fixed on this path); a Back press returns to it. Evidence `logs-e31.txt`.

Template fields for the P1/P2 items. **R3-p6-01** Screen: POI editor, 1440, persistent 401 on PUT; steps: edit title, Save, wait for "Your session ended", press Esc (or Stay on this page); observation: header shows "Still saving…" and a disabled "Saving…" button indefinitely, Ctrl+S ignored, no sentence that the session ended; why it hurts: the author cannot tell whether work is safe and cannot retry without reload; recommendation: on dismiss set state to "Not saved: session ended. Sign in again" with an enabled "Sign in again" button and re-enable Save; files `useResourceEditor.ts`, `EditorShell.vue`, session-ended dialog; effort S. **R3-p6-02** steps: POI editor, force a 422, check at 1280, 1440 and zoom200: the summary (736 px fixed width) overlaps the right column at 1280 (hides the Status card text), covers the Title label, and with the header uses ~73 % of the viewport at zoom200 (`poi-editor__422__reduced.png`, `poi-editor__422__zoom200.png`, `poi-editor__422__forced.png`: in forced colours the Close button floats over "Save and activate"); recommendation: make the summary non-sticky below 900 px height or in-flow, width follow the main column, Close inside the card; effort S-M.

## What works (keep these)
- Fixed sentences by code and status with a request id everywhere; the canary never leaked (editor, 10 lists, maps, create, upload, Apply).
- 403/404/5xx/network save errors: "was not saved", "Your changes are still in the form", focus on the alert, live announcements, no layout jump beyond the summary.
- DRAFT 409 three-way merge, "Reload their version (discards your 1 change)", Keep my changes disabled until a choice with a title hint.
- Double submit safe on create, Save, Activate (one request); slow 8 s shows "Saving…" then "Still saving…"; 401 once retries silently (2 PUTs, saved, no dialog).
- Unsaved-changes guard: one dialog, accurate copy; reload restore row.
- Upload: limits, held files, per-file Retry, "Copy request id", label-in-name, many at once.
- Coordinates: comma accepted, blur validation, sentences tell what to do.
- List read failures: ListLoadError with Try again; never "Add a language first".
- Reduced motion: only a 120 ms fade; forced colours keep borders; zoom200 no horizontal scroll.

## Unverified / could not test
- Own-trigger archive case (G-037), Apply 503/422 (conflict dialog stayed open in the script), Guide block and Event date undo after removal (only Route stop removal and guard tested), Place/Category/Event editors' save errors (same shell, only the POI editor was driven through the full matrix), floor plan image blocked (my route abort broke the sign-in landing), tab-close beforeunload text (browser-owned), Project switch with unsaved changes (the switcher opened but I did not complete a switch), two-context real 409 for Event/Category.
- Leftovers on the server (mine): POI A draft, POI B active with a QR trigger and a working copy, Route A with one stop, guides "UX-R3-p6 dbl guide …", assets `ux-r3-p6-img*`.
