# P8 Preview page, stand-in, Preview in app, new tab: changes

## C3 ids
- Fixed: C3-64, C3-65, C3-66, C3-67, C3-68, C3-70, C3-04 (stand-in ring), C3-09 (retry focus in the new tab).
- Mostly fixed: C3-69 (see Deferred), C3-51 (Preview part).
- Not changed: QR print size and mid-word wrap (QrCodePreview is P4's file).

## Files changed
- `components/editor/PreviewPanel.vue`:
  - Consumes `EDITOR_PREVIEW`.
  - Renders Expand/Collapse and Close in the header.
  - Sets `inheritAttrs:false`, so the shell's `!max-h` class is ignored.
  - Measures the expanded cap itself.
- `components/editor/ResourcePreview.vue`: `controls` slot, Surface HelpHint, tighter padding.
- `components/preview/PreviewPane.vue`, `PreviewSize.vue`, `PreviewControls.vue`, `FireTrigger.vue`, `PreviewApp.vue`.
- `views/AppPreviewView.vue`, `views/workspace/PreviewView.vue`.
- `e2e/editor-preview.spec.ts` (selectors and new assertions). It cannot run here (needs Keycloak).
- `DECISIONS.md` D-113 and `requests.md` (P8 section).
- Probes and screenshots: `ux-audit/round-3/implementation/P8/{probes,after,before}/`.
- `workspace/preview*.ts`, `projectTheme.ts`, `router.ts`: no change needed. W0-A's router already passes `orientation` and `real`.

## Acceptance (admin; before = measured on the same page before my edits)

| Check | Before | After |
|---|---|---|
| Close and Expand in the panel header | absent from the panel, so only the shell toggle (audit: ~1,000 px below the picture) | present at 1440, 1280, 1024 |
| Distance from the Close bottom to the picture top | n/a | 69 px at 1440, 1280 and 1024 (limit 80) |
| Expand keeps the picture in the viewport | picture scrolled away | picture top 223 at 1440, 1280 and 1024 (vh 900, 720, 768). Expanded panel bottom is 884 of 900, 704 of 720, 752 of 768, so it fits. |
| Expand hidden when it would not help | no-op at 1024 and below | hidden at 768 (panel fits) and at zoom200 (gain under 48 px) |
| Picture top range across Web/Mobile/Kiosk | 17 px at 1440, 1280 and 1024; 64 px at 768; 58 px at zoom200 | 0 px at all five (limit 2) |
| New tab `?surface=kiosk&orientation=landscape` | portrait (audit) | frame width 1920 (landscape), scale label "Shown at 73 % (Fit width)" |
| `real=1` | no effect (audit) | `data-scale` 1.000, width 1280 for Web |
| Preview page, Kiosk + Landscape + 100 %, "Open in new tab" | not honoured | URL carries `orientation=landscape&real=1`; tab scale 1.000, width 1920 |
| Stand-in header focus ring (keyboard) | 1.38:1 | 2 px solid, 15.6:1 (white on rgb 16,36,63) |
| `?lang=<script>` | echoed (audit) | no `<script>` text. Fixed sentences: "The language in the link is not a language of this Project…". `<html lang>` is `el` for `lang=el`. |
| axe (wcag2a/aa, 21a/aa) | n/a | 0 violations on Preview at 1440, 1024, 768 and zoom200; the empty new tab; the editor panel at 1440, 1024, 768 and zoom200 |

- Keyboard run in the POI editor:
  - Enter on "Preview in app" opens the panel and focus lands on it.
  - Two Tabs reach the Surface hint, then Expand and Close.
  - Esc closes it and focus returns to "Preview in app".
- Also done:
  - Surface, Content and Fire a trigger have HelpHints, with glossary text and keys.
  - Empty-Project state outside the frame (Preview page and new tab) with links to Places and points of interest and the Working/Live text. It was checked with mocked empty lists.
  - New-tab bar states the scale. A 403 state was added. The retry focuses `#main`. Titles are per state.
  - "Opened by" and the suggestion are cleared on each new fire.
  - `?trigger=` is dropped from the address after use.
  - Toolbar is no longer 4 px wider than the content.
  - NBSP in "100 %".
  - The caption now says "(Fit width)".
  - Labels are visible at 768.
  - Missing-title links are visible and carry `lang` and `missing`. The plural is fixed ("points of interest").
- Forced-colours panel shot: `after/forced-colours-panel-1440.png`. I did not read it.

## Checks
- `vue-tsc`: no errors in my files. Other owners' in-progress files (DashboardView) still error.
- `check-css-tokens`: ok. `--all` still flags the EditorShell `max-h-[calc(…)]` class (request below).
- `impeccable detect`: `[]`.
- Literal gate: the only hits are the visitor-app stand-in's theme-variable `em` classes (`uppercase`, `tracking-[…]`, `rounded-[var(--t-radius)]`). They are drawing the visitor app, a documented exception.

## System additions
None. I used the existing `hints`, `glossary`, `formatPercent` and `HelpHint`. Stand-in focus ring: scoped `.stand-in-header :focus-visible` takes `--t-on-primary`, so it stays readable on any theme colour. I did not use `.on-dark`, because its light ring would fail on a light theme.

## Deferred
- QR print size and mid-word wrap (C3-69 part, P4's `QrCodePreview`).
- The "Skip preview" extra Tab stop is kept; it is the documented bypass.
- Expand is hidden at zoom200 (gain under 48 px). I judged that honest rather than a no-op.

## Requests
- W0-B / `EditorShell.vue` ~line 796: delete the `:class` with `!max-h-[calc(…)]` on `<PreviewPanel>`. It is already ignored and only breaks `check-css --all`. Also, `--sticky-stack-h` excludes the app header, so EditorSectionNav's offset is short by the header height.
- P3-core/P3a: the list `missing` query value is a language code. The Preview links use `?lang=<code>&missing=<code>`.
