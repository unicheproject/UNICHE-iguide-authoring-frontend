# p6-edge — Round 1

Persona: error and edge-case tester ("hostile day"). Account `curator`, Project `UX Audit – Populated`, Chromium 1440 (two shots at `zoom200`). Mode: Operate. Impeccable interview steps skipped (subagent; the brief answers them). Nothing was added to `UX Audit – Empty`.
Scripts are `s*.mjs` in this folder; shots in `shots/` (119 files, paths below are relative to this folder).

## Verdict
The error plumbing is better than the incumbent average: requestId is shown on every problem body, the rejected value is never echoed, a single 401 is retried silently, double-submit is blocked everywhere I tried, a real 409 gives a per-field "mine / current" dialog, where-used blocks archive/deactivate, drafts survive an expired session. What lets it down is the last metre: focus is dropped to `<body>` after almost every error and dialog, 403/404 on a save are rendered as a generic "not saved", create dialogs neither summarise nor announce errors, a confirm dialog can be hidden behind the Project switcher, and several messages read as developer text.
Open P1 problems: 4 (P0: 0). Score range for the error/edge states as a group: 66-78.

## Context check
- `12-cms-experience.md` §5: "`422` errors are shown at the field named by `path` and summarized at the top of the form; the message names the field or referenced id, never the submitted value"; §6: a `404` on a Project shows that it no longer exists and points to the Platform Portal; a `403` says the Catalogue no longer admits the caller.
- `14` §4: "validation errors are associated with their control, announced on submission, and summarized at the top of the form with links to each field".
- `03` §1 (as restated in the brief): an `ACTIVE` Resource is edited through a Working Copy (Save draft / Apply changes / Discard); archive/deactivate shows where-used first. Observed: the editor does exactly that (`shots/poi-editor__active-edited__1440.png`).
- DECISIONS.md D-025: `ApiError` reads RFC 7807 by `code`, then URN suffix; DRAFT save conflicts are field by field.
- PRODUCT.md: the content editor needs "clear save feedback, and never losing work".

## Scores
Weights: Clarity 25 · Hierarchy/craft 20 · Consistency 15 · Copy/feedback 15 · A11y 15 · States/responsive 10. Caps applied (open P1 → 85).

| Screen / state | Clar | Craft | Cons | Copy | A11y | States | Total |
|---|---|---|---|---|---|---|---|
| Save errors 500/502/503/504 (POI + 5 other editors) | 20 | 15 | 12 | 11 | 8 | 8 | 74 |
| Save 403 / 404 (record, Project) | 14 | 13 | 8 | 6 | 8 | 5 | 56 |
| 422 in editors (summary + field + tab marker) | 21 | 16 | 12 | 12 | 11 | 8 | 80 |
| 422 in create dialogs | 18 | 15 | 12 | 11 | 6 | 7 | 69 |
| 409 DRAFT conflict dialog | 21 | 16 | 12 | 12 | 9 | 8 | 78 |
| 409 on Apply (Working Copy) | 17 | 14 | 9 | 10 | 8 | 6 | 64 |
| 401 silent retry / session expiry / draft restore | 20 | 12 | 11 | 8 | 8 | 7 | 66 |
| Offline banner and mid-save offline | 18 | 14 | 12 | 9 | 10 | 7 | 70 |
| Slow network, double submit | 18 | 12 | 13 | 9 | 10 | 7 | 69 |
| Leave with unsaved changes | 19 | 11 | 12 | 9 | 8 | 7 | 66 |
| Archive/deactivate where-used | 23 | 17 | 14 | 13 | 12 | 8 | 85 (capped) |
| Uploads (limits, errors, retry, cancel, many) | 19 | 15 | 12 | 10 | 10 | 8 | 74 |
| Load failures (record 404/403/500/503, Project 404/403/502, list 500) | 18 | 14 | 11 | 10 | 10 | 8 | 71 |

Nielsen (0-4): visibility of status 3 · match with real world 2 (developer wording) · user control 3 · consistency 2 · error prevention 3 · recognition 3 · flexibility 2 · aesthetic/minimal 3 · error recovery 2 (focus, 403/404 mapping) · help 2. Group total 25/40.

## Findings

### R1-p6-edge-01 · P1 · Project switcher popover stays open on top of the "Leave without saving?" dialog
Screen: POI editor with unsaved edit, header Project switcher → pick another Project. 1440. Job: switch Project with unsaved changes.
Evidence: `shots/nav-away__projectswitch__1440.png`; steps: edit title, open switcher, click "UX Audit – Empty".
Observation: the confirm dialog opens but the switcher list is not closed and paints over the left half of the dialog; title shows "ut saving?", body text and "Keep editing" are cut ("P EDITING"). Focus is on the dialog button, behind the overlay.
Why it hurts: the one decision that can lose work is half unreadable; a pointer user may click a Project row again and nothing seems to happen.
Recommendation: close the popover before the guard dialog opens (or raise the dialog above every popover), and restore the popover trigger as the focus target on "Keep editing".
Files: `src/components/ProjectSwitcher.vue`, `src/components/ConfirmDialog.vue`, `src/components/AppDialog.vue`. Spec: `14` §4 (operable chrome). Effort S.

### R1-p6-edge-02 · P1 · A `403` or `404` on a save is rendered as "The X was not saved" + the server's detail
Screen: POI, Route, Guide, Event, Category, Place, Asset save. 1440. Job: save after the record or Project was deleted or access was removed.
Evidence: `shots/poi-editor__err-403__1440.png`, `poi-editor__err-404__1440.png`, `poi-editor__err-404project__1440.png` (forced 403 `PROJECT_ACCESS_DENIED`, 404 `RESOURCE_NOT_FOUND`, 404 `PROJECT_NOT_FOUND`); same text for the other five editors.
Observation: banner "The point of interest was not saved / Forced by p6-edge audit / Request id req-p6-0001". No sentence says the record was deleted, the Project is gone, or access was withdrawn; no action (Reload, All projects, Portal link). Compare load-time handling, which does it right: `shots/load-project-404__1440.png` and `load-project-403__1440.png`.
Why it hurts: a person who edited for an hour in a deleted record or revoked Project is told only "not saved" and will retry forever. `12` §6 defines both cases.
Recommendation: map `status` 404 `PROJECT_NOT_FOUND` / 403 on save to the same full-page states used at load (keep the draft in browser storage and say so), and 404 on the record to "This point of interest was deleted by someone else. Your text is kept; copy it before you leave" with a link to the list. Put the mapping in the shared editor save handler once.
Files: `src/components/editor/EditorShell.vue`, editor stores under `src/views/workspace/*`, `src/platform/api.ts` (thin wrapper only). Spec: `12` §6. Effort M.

### R1-p6-edge-03 · P1 · Create dialogs: errors are neither summarised nor announced
Screen: New POI / Route / Guide / Event / Category / Place dialogs, submit empty. 1440 and zoom200. Job: create with invalid data.
Evidence: `shots/poi-create__empty-submit__1440.png`, `create-routes__empty__1440.png`; probe: after empty submit the page has no `role=alert`/`aria-live` content (script `s1.mjs`, `s12.mjs`: `alerts: []`). Place dialog: `alerts: ['Choose whether the place sits inside another one.']` but focus stays on the Create button (`create-places__empty__1440.png`).
Observation: inline red text at each field and focus moves to the first invalid input, but nothing is read out as an error and there is no summary with links (the editor forms do have one). The empty slug error appears before the author has typed anything, so a blank form shows two errors where one is the cause.
Why it hurts: screen-reader users hear only that focus moved to an empty field. `14` §4 makes announcement and summary a gate.
Recommendation: reuse the editor's error summary component inside the dialog (heading "2 things to fix", links), `role=alert`, and do not validate the derived slug while it is empty and the title is empty.
Files: `src/views/workspace/*/Create*Dialog.vue`, `src/lib/focus.ts`. Spec: `14` §4. Effort M.

### R1-p6-edge-04 · P1 · Focus drops to `<body>` after failed saves, dialogs and draft actions
Screen: all editors. 1440. Job: keyboard recovery after an error.
Evidence (focus read via `document.activeElement`, scripts `s3`, `s8`, `s10`, `s16`, `s19`): after a failed save (500/502/503/403/404/abort/empty-body) focus is `body` because the Save button becomes disabled while saving and is never refocused; the error banner is announced (`role=alert`) but the next Tab starts at the top of the page, above the banner. After Esc on the 409 dialog focus is `body`; after "Leave without saving" focus is `body`; after "Restore" and "Discard" (draft banner) focus is `body` (`shots/poi-editor__after-restore__1440.png`, `poi-editor__after-discard__1440.png`) and nothing is announced. Map 422: focus `body` although an input is invalid (`shots/map-err-422__1440.png`). The 422 case on POI/Route/Guide/Event/Category/Asset does move focus to the first invalid field (good).
Why it hurts: a keyboard author loses place after every error and must tab through header and navigation again; screen-reader users get no confirmation for Restore/Discard.
Recommendation: after a failed save focus the error summary (heading, `tabindex=-1`) and keep the Save button enabled-but-busy (`aria-disabled` + "Saving…") so it is not dropped; return focus to the opener when any dialog closes; after Restore focus the first restored field and announce "Draft restored"; after Discard announce "Draft discarded".
Files: `src/components/editor/EditorShell.vue`, `src/components/AppDialog.vue`, `src/components/ConfirmDialog.vue`, `src/lib/focus.ts`. Spec: `14` §4. Effort M.

### R1-p6-edge-05 · P2 · "Leave without saving?" says changes "are lost", yet they are kept as a draft
Evidence: `shots/nav-away__sidebar__1440.png` text: "You have unsaved changes to this point of interest. If you leave now, they are lost." After leaving and reopening, the restore banner offers them (`poi-editor__after-login-draft__1440.png`, `s14` log).
Why it hurts: the dialog is untrue, so authors will keep editing to "save" instead of leaving; the restore feature is hidden from the moment it matters.
Recommendation: "Your edits stay in this browser as a draft; open this point of interest again to restore them. They are not saved to the iGuide." Buttons "Keep editing" / "Leave, keep draft"; offer "Leave and discard draft" as the tertiary action.
Files: `src/components/editor/EditorShell.vue`. Spec: `12` §5. Effort S.

### R1-p6-edge-06 · P2 · After any failed save the draft banner "Unsaved changes are kept in this browser: Restore / Discard" appears on top of the same form
Evidence: `shots/poi-editor__err-422__1440.png`, `poi-editor__err-404project__1440.png`, `poi-editor__401-twice-after__1440.png`.
Observation: after a 500 the form already holds the text, yet a banner asks to Restore it. Clicking Restore changes nothing visible; Discard throws the text away from the form with no confirmation. The banner plus error panel push the form ~300 px down and the error scroll hides the Save button and breadcrumb (screenshots show the page scrolled).
Recommendation: show the restore banner only on load, not after a failed save in the same session; after a failed save show "Your changes are kept" inside the error panel.
Files: `src/components/editor/EditorShell.vue`. Effort S.

### R1-p6-edge-07 · P2 · Session expiry mid-edit gives no explanation
Evidence: `shots/session-expired__login__1440.png` (cookies cleared, PUT forced to 401 twice, `s6.mjs`); with a live IdP session the redirect is invisible (`s5.mjs`).
Observation: the author lands on the bare Keycloak sign-in with no "Your session ended, sign in to continue; your edits are kept". After sign-in the editor reopens with the Restore/Discard banner (works: title and summary were restored, `poi-editor__after-restore__1440.png`), but no message links the two. The first (single) 401 is retried silently and the save succeeds, as intended (`poi-editor__401-once__1440.png`).
Recommendation: before redirecting, store a flag and show on return "You were signed out. Your unsaved changes are back; review and save." with the banner focused. Before redirecting, show a 3-second inline notice if possible.
Files: `src/platform/auth.ts` (flag only), `EditorShell.vue`. Effort S-M.

### R1-p6-edge-08 · P2 · One failed fetch flips the whole CMS to "offline" and blocks Retry/Save
Evidence: `shots/upload__err-abort__1440.png`, `poi-editor__offline-midsave__1440.png`, `s18.mjs` log. A single aborted request (browser still online) produced the banner "You are offline. Saving and other changes are disabled…"; the next upload Retry then failed with "You are offline, so nothing was saved. Your changes are still in the form." (wrong for an upload).
Real offline (`context.setOffline(true)`): banner appears at once, Save disabled, "Check again" works and the banner clears on recovery (`poi-editor__offline-banner__1440.png`, `poi-editor__back-online__1440.png`). Good, but Save is disabled with no reason at the button, and the previous "Saved" toast stays visible under the banner.
Recommendation: only show the offline banner when `navigator.onLine` is false or two requests fail; keep Save focusable with `aria-disabled` and the reason ("Offline") in its label; use per-operation wording for the blocked retry.
Files: `src/stores/connection.ts`, `src/components/OfflineBanner.vue`, `src/components/media/UploadEntryRow.vue`. Effort S.

### R1-p6-edge-09 · P2 · Developer wording in user-facing errors
Evidence: network failure text "The iGuide backend could not be reached. Check that it is running; nothing was changed." (`poi-editor__err-abort__1440.png`, `list-abort` in `s4`, upload rows). An author cannot "check that it is running". Also `500` shows the server `detail` verbatim ("Forced by p6-edge audit"; a real one would be "An unexpected error occurred"): no "what to do".
Recommendation: "We could not reach the iGuide. Your changes are still in the form. Check your connection and try again; if it keeps happening, tell your administrator and quote the request id." Add a "Try again" button in the banner and a Copy button for the request id.
Files: `src/platform/api.ts` message strings, `EditorShell.vue`. Effort S.

### R1-p6-edge-10 · P2 · Working Copy Apply `409` does not show "mine / current" per field
Evidence: `shots/poi-apply__409__1440.png` (forced 409 with `conflictingFields`). Dialog: "Someone else changed this point of interest … Reload to see their version and lose your changes, or keep your changes and save them over theirs" with "Reload their version" / "Keep my changes". Spec `12` §3 says apply `409` shows both versions with the conflict rules. DRAFT conflicts (real, two contexts) are per-field (`poi-editor__409-conflict__1440.png`).
Also my forced `409` on Guide save produced the same blunt two-button variant (`guide-editor__err-409__1440.png`) while the real Guide conflict gave the per-field dialog (`guide-editor__409-real__1440.png`), so the behaviour depends on what the body carries; not verified against a real Apply conflict.
Recommendation: reuse the per-field dialog for Apply; "keep my changes" overwrite wording must say which version number it replaces. Effort M.

### R1-p6-edge-11 · P2 · 409 comparison: collection rows are not comparable and "Mine" is preselected
Evidence: `shots/route-editor__409-real__1440.png`: "Stops - Mine: 1 item / Current: 1 item" although nothing differs, so the author cannot choose. Guide/Event/Category/Place/Asset use text only. Everywhere "Mine" is preselected, so Enter on "Save my choices" overwrites a colleague's work.
Also: after choosing, the header still said "version 0" while the dialog said "now version 1" (`poi-editor__409-conflict__1440.png`), no requestId in the dialog, Esc closes without telling where the unsaved state went (`s8` log: reopened on next Save).
Recommendation: list stop titles in order for each side with a diff marker; preselect nothing and disable "Save my choices" until every row is chosen; show both versions' author/time if the API has it. Files: conflict dialog in `EditorShell.vue`. Effort M.

### R1-p6-edge-12 · P2 · Slow network: no spinner, no long-wait message, Apply has no in-flight state
Evidence: with the PUT delayed 8 s the button reads "Saving…" and is disabled (`poi-editor__saving-slow__1440.png`); no spinner, nothing after 8 s. Apply: after confirming the dialog closes and the button just turns grey with the label unchanged (`poi-apply__in-flight__1440.png`), no "Applying…". Double submit is protected (one PUT, one POST) in editors, Apply and all six create dialogs (`s9`, `s12`, `s15`). Esc is silently ignored in a busy create dialog (no cue why).
Recommendation: after 3 s show "Still saving…" with Cancel; give Apply/Activate/Deactivate the same busy label; announce "Saving…" and the result in one live region.
Files: `EditorShell.vue`, `AppDialog.vue`. Effort S.

### R1-p6-edge-13 · P2 · Uploads: any file type is accepted, failed rows pile up, errors lack requestId
Evidence: `upload__bad-files__1440.png`: a `.exe` and a `.txt` uploaded as "Other"/"Document" and are now in Media; oversize 38 MB image is refused before upload with "Exceeds the 20.0 MB limit for image files." (good) but its greyed "Retry" is still rendered. Forced failures (`upload__err-413__1440.png` … `err-abort`) show raw server details ("Request entity too large", "Unsupported media type application/x-msdownload") and no requestId; each retry attempt of the same file adds another identical row so the list shows five "UX-p6-edge-ok.png - Failed". The Done button stays the only exit.
Good: 12 files at once upload two at a time with queue states, per-file Cancel, "Cancel remaining", and Esc mid-upload asks "Stop the uploads?" (`upload__many-slow__1440.png`, `upload__close-mid-upload__1440.png`, `upload__cancelled__1440.png`).
Recommendation: show the accepted types in the limits block and warn on executables/unknown types before upload; replace the failed row on retry instead of adding; show requestId and a plain sentence per code (413: "This file is larger than the server accepts"); hide Retry when it cannot help. Files: `UploadDialog.vue`, `UploadEntryRow.vue`. Effort M.

### R1-p6-edge-14 · P2 · Record `404`, record `403` and Project `403` pages: dead ends and wrong copy
Evidence: `shots/load-poi-404__1440.png`: only "This point of interest does not exist in the Project" + request id; no button to the list, no hint (deleted by someone else?). Record `403` falls into "could not be loaded / Try again" with the raw server text, which cannot succeed (`load-poi-403`). Project `403`: "Access denied - The UNICHE Catalogue refused this. Only organization managers may do it; ask one of them, or go back to your projects." (`load-project-403__1440.png`): wrong rule for a member removed from a Project; the Project switcher still shows the Project as ACTIVE.
Recommendation: add a primary "Back to points of interest" button; split 403 into "You are no longer a member of this Project" with a Portal link; drop the retry for 403. Effort S.

### R1-p6-edge-15 · P2 · Map editor `422`: focus is not moved to the invalid field
Evidence: `shots/map-err-422__1440.png`, `s20` log: alert present, 1 invalid field, focus `body`. Editors elsewhere focus the first invalid field.
Files: `src/views/workspace/maps/MapEditorView.vue`. Effort S.

### R1-p6-edge-16 · P2 · Zoom200: dialog actions clipped
Evidence: `shots/poi-create__empty-submit__zoom200.png`: after the validation focus the dialog scrolls inside itself, the header of the dialog is gone and the Cancel/Create row is cut by the dialog edge. The 422 editor view at zoom200 is usable (`poi-editor__err-422__zoom200.png`).
Recommendation: make the dialog footer sticky, `max-height` with internal scroll, buttons always visible. Files: `AppDialog.vue`. Effort S.

### R1-p6-edge-17 · P3 · Category `422` summary shows an unmapped raw path
Evidence: `shots/category-editor__err-422__1440.png`: "slug: Use lowercase Latin letters." (lowercase, no label) next to "Name (English): …"; the Category editor has no slug field to link to.
Recommendation: map every `path` to a label or drop the prefix. Effort S.

### R1-p6-edge-18 · P3 · Browser Back: URL changes before the guard answers
Evidence: `s11` log: with the guard dialog open the address bar already shows the list URL while the editor stays; "Keep editing" restores the editor URL and the focus (good), "Leave" proceeds. `beforeunload` fires on reload (verified) and sidebar/breadcrumb/Project switch each show the in-app dialog (good).
Recommendation: acceptable, but suppress the URL change (`router.beforeEach` + `history.go(1)`) so a copy of the URL taken at that moment is not wrong. Effort S.

### R1-p6-edge-19 · P3 · Minor craft
- Toast "Saved" sits over the Translations card and persists under the offline banner (`poi-editor__offline-banner__1440.png`).
- Disabled "Retry" (oversize) is very faint (`upload__bad-files__1440.png`).
- The oversize message mixes decimal and binary units ("38.1 MB" file vs "20.0 MB" limit for a 40,000,000 byte file; the file is 40.0 MB decimal).
- Activate on a DRAFT POI happens on one click with no confirmation and only a polite status "5 things need attention, 0 blocking." (`poi-activate__dialog__1440.png`); fine for speed but the author is not told it is now visible to visitors.
- 409 "Reload their version" wording: "their" is unclear when the other editor was the same person in another tab.

## What works (keep these)
- requestId shown on every problem body; rejected values never echoed; HTML or empty 5xx bodies still give a sentence (`poi-editor__err-html502`, `err-empty500`).
- 502/503/504 say "The UNICHE platform is not reachable ... Your changes are still in the form. Try again in a moment." (`poi-editor__err-503__1440.png`).
- Project 404 and 403 at load: dedicated pages with request id and "All projects" (`load-project-404__1440.png`).
- 422: summary at top with links, field error, red border, tab marker, focus on first field (`poi-editor__err-422__1440.png`).
- Real DRAFT 409 per-field "mine / current" dialog, focus moved into it (`poi-editor__409-conflict__1440.png`); resolving saves on top of the current version.
- Single 401 retried silently; drafts survive session loss with Restore/Discard.
- Double-submit protected in editors, Apply, create dialogs; Esc blocked while busy.
- Archive/deactivate of a referenced POI shows a where-used table with a link and no destructive button (`poi-archive__referenced__1440.png`); Esc returns focus to the opener.
- Offline banner with "Check again"; upload limits shown before start; oversize file rejected without sending bytes; cancel one/cancel remaining/stop-uploads confirm.

## Unverified / could not test
- Real `502/503/504` and `401` from a live backend (all forced with `page.route`; a forced `401` pair redirects through the real IdP).
- Tab close: `beforeunload` confirmed on reload; closing a tab with `page.close({runBeforeUnload})` hung the harness, so only the reload path is evidenced.
- Whether the POI "Latitude" error in the 422 summary has a field shown in the visible card (the link exists, I did not trace where it lands).
- Apply `409` with a real conflict on an ACTIVE record (forced only, see 10); map/floor-plan placement coordinate errors beyond a forced map 422 and the client-side floor-plan check (`fp-err-500__1440.png` shows the summary "Check the highlighted fields" with focus on the summary, good).
- Maps/Floor plan create dialogs, asset Replace flow, and keyboard-only runs of every error state beyond reading focus were not walked in this session.
- Records I created (all `UX-p6-edge…`, Populated Project): 3 POIs (A, B, C active in a draft Route), 1 Place, 1 Category, 1 Guide, 1 Event, 1 Route with 1 stop, duplicates from the double-submit tests (one each POI/Guide/Event/Category `UX-p6-edge dup …`), 2 media files (`.exe`, `.txt`). No pre-existing record was saved; edits on the Map, Floor plan and Asset editors were intercepted so nothing reached the backend.
