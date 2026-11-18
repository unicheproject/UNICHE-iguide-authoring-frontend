# P8 changes — Preview page, stand-in chrome, Preview in app content

Fixed: C2-61, C2-88 (verified: expanded panel does not cover Apply changes, `elementFromPoint` = Apply changes; container is P4s's), C2-89 (Web 88 %, Kiosk 100 % at 1440; 1024 Web 75 %, Kiosk 89 %; Expand exists, P4s), C2-90, C2-91, C2-92, C2-57 (focus to the trigger choice after Reset), C2-50 (missing titles link to the filtered list), C2-13 (verified: sub-path shows "Page not found", W0-A router). Partly: C2-93 (print size stated: request to P4, QR files are theirs). C2-31/C2-09: toolbar and one-line subtitle done.

Files: `views/workspace/PreviewView.vue`, `components/preview/{DeviceFrame,PreviewPane,PreviewControls,FireTrigger,ResourceContent,PreviewApp}.vue`, new `components/preview/PreviewSize.vue`, `components/editor/ResourcePreview.vue`, `e2e/editor-preview.spec.ts`. `PreviewPanel.vue` untouched (Esc layering works through `defaultPrevented`).

D-093 appended. No Q entries.

Acceptance (admin, Populated, scripts b1/c1/d1 in this folder, shots in `after/`):
- 1440 Preview page: picture starts at y 354 (Web/Kiosk), 337 (Mobile); toolbar 118 px, 2 rows; at 768 also 2 rows (labels become screen-reader-only below 860 px), picture at y 364.
- `/preview?trigger=<beacon id>`: surface Mobile, select value = id, chip "Fired: Bluetooth beacon, ..."; QR id: Web, chip shown; unknown id: "The trigger from the link was not found...".
- Kiosk Fit width: 1440 = 100 % (was 33 %), 1024 = 92 %, 768 = 68 %, zoom200 = 56 %; Web 1440 = 91 %, no sideways scroll at any viewport; "100 %" is hidden when it equals Fit; Mobile says "Fits at real size".
- Esc: Preview page and editor panel, first Esc focuses "Interact", second closes the panel and focuses "Preview in app".
- CDP accessibility tree: actionable nodes 37 idle (CMS chrome) vs 82 interacting, so the 45 stand-in controls are absent while inert (also `aria-hidden`).
- Forced colours: selected Surface/Language/Content/Size tabs computed Highlight fill with HighlightText (W0-A global rule); screenshot `after/preview-forced-1280.png`.
- axe (wcag2a/aa, 21a/aa): 0 violations on Preview (fired, interacting), editor panel, new tab.
- Typecheck passes; impeccable detect: no findings.

Deferred / notes: "71 missing titles" list now offers `?missing=<lang>` links per kind (the lists read `missing`). QR print size and the "Test in preview" link are P4 (requests.md). Touch at 1024 and 5xx states of the preview data not run. e2e spec updated (Esc layering), cannot run here. Stand-in `Interact` button visible text is now "Interact" (accessible name still "Interact with the preview").
