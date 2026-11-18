# P8 changes (Preview page, DeviceFrame, stand-in, ResourcePreview, new tab)

Fixed: C1-81 (P0), C1-82, C1-83, C1-84, C1-85, C1-87, C1-88, C1-89, C1-90; C1-86 content part (ResourcePreview; container is W0's PreviewPanel).
Files: views/workspace/PreviewView.vue, views/AppPreviewView.vue, components/preview/{DeviceFrame,PreviewApp,ResourceContent,strings,surfaces}.ts|vue,
new PreviewPane.vue, FireTrigger.vue, PreviewControls.vue, components/editor/ResourcePreview.vue (props model, dirty, close unchanged),
workspace/previewData.ts (withWorkingCopies), e2e/editor-preview.spec.ts (rewritten for the inline region; not run, needs Keycloak). D-082 added; no Q entries.
Acceptance (Windows Node, capture.mjs): one h1 on the page; region "Preview: Web, English, working content"; 0 tab stops inside the frame (inert);
Skip preview works; "Interact" releases inert; 768 Web fit 57.5 % with stated scale plus hint (below the 60 % bar, so the alternative clause applies),
Kiosk 768 fit 40 %; QR fired on Mobile shows "Fired: QR code, ..." chip, cleared on surface change; Web offers no beacons; Live says "17 draft triggers are hidden";
Working draws 12 Working Copies. axe: preview page, panel, new tab (mobile, invalid, 404) no serious/critical from P8 code; the only one is the header project switcher
(label-content-name-mismatch, not mine, in requests.md). New tab: title per state, invalid params shown, case-insensitive, 404 StateCard.
Deferred: forced-colors shot reviewed only as captured (preview-web__forced.png); 1024/zoom200 shots captured not individually reviewed; Greek stand-in strings for
languages other than el/it/fr/de/es fall back to English; NavigationView still uses bare frame (requests.md).
Remaining vue-tsc errors are in media/maps files owned by others. impeccable detect: [].

## Verification fixes
- R1-V-08: the Preview intro is now two short sentences (theme, not-yet-available, missing-text outlines); the repeated disclaimer is gone.
- R1-V-09: removed the duplicate Close (X) from `ResourcePreview` (the shell's "Close preview" is the one; `close` stays in the emit contract). Panel caption is `compact` (scale only, no advice paragraph) so the frame gets the room. Web/Kiosk still fit a ~330 px panel at 24-29 % by design; "Open at real size" is the way to read them. No PreviewPanel change needed.
- Chrome operable with focus in the frame after "Interact": probe `P8/focus.mjs` focused a button in the frame, Tab left it (32 stops through the live stand-in, then the header), a nav link then navigated. "Skip preview" and "Stop interacting" sit before the frame. vue-tsc: 0 errors.
