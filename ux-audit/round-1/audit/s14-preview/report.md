# s14-preview — Round 1
Screen-group specialist: Preview (Visitor app → Preview page, new-tab app preview, "Preview in app" card in Resource editors). Project `UX Audit – Populated`. Mode: Operate. Impeccable interview steps skipped (subagent; the brief answers them). Nothing created or saved: all observation, no records touched. Scripts: `a1,b1,c1,d1,e1.mjs`; raw data `out/*.json`; shots in `shots/`.

## Verdict
The stand-in works and is mostly legible, but the Preview page fails the `14` §4 gate "labelled preview frame" (no role, no label, a second h1, 45 tab stops), WEB at 768 is drawn at 0.37 scale (4–5 px text), and "Working content" does not show Working Copies (the editor card does, so the two previews disagree). Trigger firing ignores surfaces (beacon on KIOSK/WEB) and leaves stale notes. The editor card hides the very fields being edited and, below 1024, its opener sits ~3400 px down the page. Recommend a persistent split-view preview panel with real sizes and a zoom control.

## Context check
- `12` §3 Preview: the preview "embeds the web runtime … toggle between live view and preview view (DRAFT Resources and Working Copies)"; fire-trigger lists QR/GEO/BEACON and "tests what the Application does when the trigger fires".
- `14` §4: "the preview frame is labelled with the surface and language it renders, and the CMS chrome remains operable while the frame has focus".
- `03` §1: ACTIVE Resources are edited through a Working Copy; visitors see nothing until Apply.
- DECISIONS.md D-059: editor card is a popover at most 560 px, Esc/click outside/Close closes it; D-042 claims the preview is labelled; D-066 lets the wheel scroll under the card.
- PRODUCT.md: kiosk operators "check how the guide looks on KIOSK, MOBILE and WEB, often on a tablet on site"; desktop 1440/1280 primary, 1024/768 fully usable.
- Impeccable: critique.md (score all 10 Nielsen heuristics 0-4, "Hard Invariants: Assessment A and B", degraded run flagged; I ran inline, no sub-agent tool: DEGRADED single-context, detector not run); audit.md ("Touch targets… keyboard navigation: illogical tab order, keyboard traps; Fixed widths"); operate.md ("Overlays escape their container… Modal as first thought. Exhaust inline/progressive alternatives first").

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total (capped) |
|---|---|---|---|---|---|---|---|
| Preview page, WEB/MOBILE/KIOSK, 1440/1280 | 15 | 14 | 10 | 9 | 6 | 6 | 60 (P0 cap) |
| Preview page at 1024 / 768 | 11 | 11 | 10 | 9 | 6 | 4 | 51 |
| Fire trigger / live vs working | 10 | 12 | 9 | 8 | 8 | 6 | 53 |
| New tab (`app-preview`) | 14 | 14 | 11 | 9 | 9 | 6 | 63→60 |
| Editor "Preview in app" card 1440/1280 | 15 | 14 | 11 | 11 | 11 | 6 | 68 |
| Editor card 1024 / 768 / zoom200 | 11 | 12 | 11 | 11 | 11 | 5 | 61 |
| Error states (403/404/502/503, Try again) | 16 | 13 | 12 | 11 | 11 | 7 | 70 |

Nielsen (0-4): 1 Visibility of status 2 · 2 Match with real world 2 ("The runtime rendered…", "unpublished") · 3 User control 3 · 4 Consistency 2 · 5 Error prevention 2 (beacon on KIOSK) · 6 Recognition 3 · 7 Flexibility 1 (no zoom/fit, no side-by-side) · 8 Aesthetic/minimal 3 · 9 Error recovery 3 · 10 Help 2. Total 23/40.

## Findings

**R1-s14-preview-01 · P0 (14 §4 gate)** — Preview page frame is unlabelled, adds a second h1 and 45 tab stops.
Preview page, all viewports. Evidence: `out/a1.json` (`label:null, role:null`, `h1:2`, `tabbables` 30–45 per surface), `out/b1.json` headings (`H1:Preview`, `H1:Ζωφόρος… [FRAME]`, 6 more h2 inside frame, nested `HEADER` landmark in `main`). Repro: open Preview, run a heading/landmark list; Tab from "Open in new tab": 9 CMS stops then 45 frame stops (b1 walk 10–54).
Observation: `DeviceFrame` non-card variant renders a bare `div[data-preview-frame]` (the D-042 label exists only in `ResourcePreview`). The stand-in's h1/h2/header/nav live in the CMS page outline, and every card is a tab stop with no way to skip.
Why: screen-reader users cannot tell where the app starts, headings of the CMS and the mock mix; keyboard users have no bypass; spec-mandated labelling not met.
Rec: wrap the frame in `role="region"`/`group` with `aria-label="Preview: Kiosk, Ελληνικά, working content"` (visible same text in the caption); render stand-in headings as `role="heading" aria-level` below the page h1 (or `div`s) and the frame header as `div`; add a "Skip preview" link after the frame start and a "Preview is interactive; Esc leaves it" hint; make the stand-in `inert` by default behind an "Interact" toggle so that browsing is a deliberate mode.
Files: `components/preview/DeviceFrame.vue`, `PreviewApp.vue`, `ResourceContent.vue`, `views/workspace/PreviewView.vue`. Constraint: `14` §4 labelled frame. Effort M.

**R1-s14-preview-02 · P1** — "Working content" ignores Working Copies; the two previews disagree.
Preview page vs editor card. Evidence: POI "Parthenon Frieze – North Side" has a working copy titled "(revised wording)" and 7 min; Preview page (Working content, after firing frieze-101) shows "Parthenon Frieze – North Side", "Visit 5 min" (`out/b1.json`, `out/e1.json workingTitle`), editor card shows revised title and 7 min (`shots/editor__preview-open-mobile__1280.png`). Status line still says "Showing drafts and active content."
Why: spec `12` §3 / `03` §1 say preview view renders Working Copies; author checks a change, sees the old text, and trusts neither.
Rec: load Working Copy rows (or merge `pendingChanges`) for Working mode; flag cards "Pending changes" with ✎; rename modes to "With pending changes" / "As visitors see it"; if the backend lacks it, say "Pending changes are not shown here" in the status line and log in GAPS.md.
Files: `workspace/previewData.ts`, `PreviewView.vue`. Constraint: `12` §3, `03` §1. Effort M.

**R1-s14-preview-03 · P1** — WEB at 768 is drawn at 0.37 (4–5 px text); KIOSK 0.44–0.59 (7–12 px). Caption states "1280 wide"/"1080 wide".
Evidence: `out/a1.json` (768-Web scale 0.370, min text 4.1 px, median 5.0; 1024-Web 0.57 min 6.4; 768-Kiosk 0.439 min 7.4); `shots/preview__web__768.png`, `preview__kiosk__768.png`, `preview__kiosk__1440.png` (kiosk frame 640 px wide, 1167 px tall). Caption is true about the logical size but silent about scale; no zoom, fit or 100 % control, no way to see real pixels except "Open in new tab".
Why: kiosk operators on a tablet judge legibility from a screenshot-sized thumbnail that no visitor sees; can not check text size or touch-target size.
Rec: show "Scaled 44 %" beside the caption and a Fit / 100 % (scroll) / 50 % control; at 100 % the frame scrolls inside its viewport; default WEB to Fit width but never below 0.5 (otherwise 100 % with scroll). Cap the controls row so frame starts in the first viewport.
Files: `DeviceFrame.vue`, `PreviewView.vue`, `surfaces.ts`. Effort M.

**R1-s14-preview-04 · P1** — Beacon (and geo) fire on WEB/KIOSK; fire control ignores surface; stale notes survive.
Evidence: `out/b1.json` (beaconKiosk → "Nearby: Excavated Athenian Neighbourhood" on KIOSK; `out/e1.json beaconWeb:true`); `shots/preview__fired-beacon-kiosk__1440.png`. After QR fire, switching surface (`noteAfterSurface:true`) or mode or language (Greek view still shows "Opened by QR code frieze-101" and English "Nearby: …" banner, `greekText`) keeps the old detail screen and notes. The select resets to "Choose a trigger…" so the last fired trigger is not shown.
Why: beacon is MOBILE-only (`12`/`03` §14): a kiosk operator "verifies" something impossible. Stale banners mislead after a language change.
Rec: filter the list by surface (beacon only MOBILE, others greyed with reason, as editors do); show a persistent "Fired: QR frieze-101 · Reset preview" chip and a Reset button; clear the stack/notes on surface, language or mode change, or keep them but state it. Replace the native select by a grouped list (QR / Geo / Beacon) with search; labels truncate at 150+ chars (long reception title) and show uuid/major/minor.
Files: `PreviewView.vue`, `PreviewApp.vue`. Effort S–M.

**R1-s14-preview-05 · P1** — Editor "Preview in app" opener is ~3400 px down at 768 and the card hides the form being edited.
Evidence: `out/c1.json` 768 `btnBox.y:3388`; `shots/editor__before-preview__768.png` (button not near the top; side column follows the form below 1024); `shots/editor__preview-open-mobile__1280.png` card 330 px tall (720 viewport) covering Title/Summary; `…__1440.png` covers the form's right half; at 768 covers the lower editor (`editor__preview-open-kiosk__768.png`). Card height = space below the opener, so it shrinks as the button sits lower: 510 px at 1440, 330 px at 1280.
Why: the preview exists to compare while typing; a floating card covers the inputs and the author must open/close it for every edit. On tablets the entry point is effectively undiscoverable.
Rec: replace by a persistent right-side **split panel** (see Recommendation) toggled from the editor header (sticky "Preview" toggle next to Apply changes, `P`-key shortcut), surface/lang follow the editor language tab; below 1024 use a bottom sheet capped at 60 % height with "Show preview" in the sticky header. Never position by opener.
Files: `EditorShell.vue`, `AppDialog.vue`, `ResourcePreview.vue`. Effort L.

**R1-s14-preview-06 · P1** — Editor card's WEB/KIOSK tabs are the same ≤512 px layout; no statement of size.
Evidence: `shots/editor__preview-open-web__1440.png`, `…-kiosk__1768`/`1024`: Web and Kiosk look like a wide mobile; note only says "An approximation". D-059 consciously dropped scaling.
Why: a "Kiosk" tab that draws no kiosk (1080×1920, tiles, 24 px base) misleads; author cannot judge kiosk tile layout from the card.
Rec: in split panel render the real surface via the same `DeviceFrame` scale-to-width logic with a Fit/100 % control; until then relabel tabs "Mobile layout / Wide layout" and add "Not to scale" caption.
Files: `ResourcePreview.vue`, `DeviceFrame.vue`. Effort M.

**R1-s14-preview-07 · P1** — New tab does not use the real surface size and has no controls.
Evidence: `out/d1.json`: KIOSK `wrapW:1440`, font 24 px (a 1440 px wide "kiosk", not 1080); WEB `?surface=WEB` full-window; only MOBILE is 390. `shots/newtab__kiosk-el__1440.png`. Invalid `?surface=kiosk` (lowercase) silently shows WEB; `?lang=zz` and `?mode=bogus` fall back silently (`bad-params`). No surface/language/mode/trigger controls, no title naming surface/language ("Preview · Project" only). Page is `h-screen`, so tall KIOSK content scrolls inside.
Why: the "real" preview is not real for KIOSK/WEB; the URL contract is case-sensitive and silent on error.
Rec: centre a 1080×1920 (scaled-to-fit) frame with a slim top bar (surface, language, mode, zoom) in the new tab; accept case-insensitive params and show "Unknown surface 'kiosk', showing Web"; set `document.title` to "Preview · Kiosk · Ελληνικά · Project".
Files: `AppPreviewView.vue`. Effort M.

**R1-s14-preview-08 · P2** — Copy and truth: page subtitle and status line.
`shots/preview__kiosk__1440.png`: "The runtime rendered with your unpublished content…" — it is not the runtime (stand-in, D-014) and "unpublished" is banned-adjacent (lifecycle: never "published"). "Showing drafts and active content" implies Working Copies (see 02). Footer: "Nothing here changes what visitors see." is fine. The disclaimer is 11 px muted text below a tall frame, which is below the fold (`preview__web__768.png`).
Rec: subtitle "A stand-in of the visitor app drawn from your content, per surface and language."; put the "approximation" notice in a dismissible banner above the frame; use "pending changes" vocabulary.
Files: `sections.ts` (subtitle), `PreviewView.vue`. Effort S.

**R1-s14-preview-09 · P2** — Control bar: wraps to 4 rows, 3 chip groups with different meaning but the same look, native select without a visible focus ring.
Evidence: `shots/preview__web__768.png` (controls take ~230 px, frame begins at y≈560 of 1024); at 1440 two rows. `out/e1.json selectFocus`: `outline none 3px`, only the border colour changes (purple vs grey), 3:1 questionable. Group labels exist for AT ("Surface","Language","Content") but nothing visible. Chip text 11 px bold uppercase. Surface chips have `aria-pressed` while the editor card uses `role=tab` — inconsistent patterns for the same control.
Rec: one toolbar row, visible small labels, radio-group/segmented semantics shared by both previews, 2 px outline on select, language as a select when >3 languages (a 24-language Project overflows the chip row).
Files: `PreviewView.vue`, shared `SegmentedControl`. Effort S.

**R1-s14-preview-10 · P2** — Editor card: Escape verified working; focus entry/trap fine; but background is not inert, Close/Tab order and wheel behaviour have gaps.
Evidence (`out/c1.json`, all four viewports): Esc closes from tab, tabpanel and after clicking inside the frame, focus returns to "Preview in app". Tab cycles Close → panel → Mobile tab → Close (three stops only; the stand-in inside the card is not focusable, good, the opposite of the Preview page). Opens on the Mobile tab not Close. Conflicting report ("Esc doesn't close, covers whole editor at 768") not reproduced: card is 560×410 at 768 (29 % of the viewport). Gaps: the card's `h1` is added to the page (h1 total 2); background editor tabpanel remains in the a11y tree (strict locator found two tabpanels) while the dialog is modal; the surface tab ring is `NONE` on programmatic focus (`focus` field), appears only on keyboard focus-visible; the tab panel has `tabindex=0` plus label "Kiosk" only (`aria-label` on the section "Preview: Kiosk, English" is on a `section`, not the panel).
Rec: `aria-hidden`/`inert` the editor while open, demote h1/h2 inside to divs, label tabpanel with the "Preview: surface, language" text.
Files: `AppDialog.vue`, `ResourcePreview.vue`, `ResourceContent.vue`. Effort S.

**R1-s14-preview-11 · P2** — Greek/RTL view: stand-in chrome strings partly untranslated.
`out/b1.json greekText`: "Visit 5 min", "Opened by QR code", "Nearby", headings "When you are there / Accessibility / Audio narration / Where / On these routes" remain English under `lang=el`, while menu labels are Greek; the status line counts 30 missing titles in Ελληνικά (good) but the 30 are not listed/jumpable. Mixed `lang` is not marked per run.
Rec: complete `strings.ts` for the Project languages or mark app chrome "(CMS wording)" ; add "Show missing" list linking to editors (translator persona).
Files: `components/preview/strings.ts`, `PreviewView.vue`. Effort M.

**R1-s14-preview-12 · P2** — Live mode with DRAFT triggers.
`out/b1.json liveOpts` (6 triggers in Live vs 23 in Working): triggers are filtered by trigger status; a trigger ACTIVE whose target is DRAFT would give "What this trigger opens is not shown in this mode." (code `PreviewApp.fire`). No explanation in the select for why triggers disappeared (23 → 6) and the status line says nothing about hidden items or counts of DRAFT items.
Rec: keep DRAFT triggers listed but disabled with "Draft — not active for visitors"; status line "Live: 41 active items, 12 drafts hidden".
Files: `PreviewView.vue`. Effort S.

**R1-s14-preview-13 · P2** — Loading/error states.
`out/e1.json`: 403/404 "The preview could not be loaded" and 502/503 "The UNICHE platform is not reachable" with Try again which recovers (verified). Error shows only `message`; no `requestId`, though the brief requires problem details with `requestId`. 401 returns to the sign-in view (expected). Skeleton has `role=status` + label (seen in code; my slow-load capture did not hold the request, so skeleton visual unverified). Any single failing list (places) kills the whole preview; no partial rendering.
Rec: show requestId, say which list failed, allow preview with missing lists.
Files: `PreviewView.vue`, `AppPreviewView.vue` (its error is a bare red line, no retry, `newtab__error-503__1440.png`). Effort S.

**R1-s14-preview-14 · P3** — nits. Caption "KIOSK SCREEN, 1080 WIDE" 10 px uppercase; fake browser dots are `aria-hidden` decoration; frame bar shows no URL (cannot tell it's a stand-in); "Open in new tab" disabled without tooltip while loading; new-tab 404 project shows only "This Project is not available." (`newtab__404-project__1440.png`) without a way back; the 1440 Kiosk frame is 1167 px tall, so the first viewport shows only the top 40 % (`preview__kiosk__1440.png`); card "Shows the form as it stands." copy for a clean form is vague.

## Recommended preview model (drastic)
1. One shared `PreviewPane` used by the Preview page, the editors and the new tab: header with Surface (segmented), Language (follows editor tab), Mode, **Zoom: Fit / 100 % / 50 %**, "Scaled 61 %" readout, Reset, Open in new tab; frame labelled `role=region aria-label="Preview: Kiosk, English"`.
2. In editors: a persistent **split view** (right 40 %, resizable, remembered per user) toggled from the sticky header; at <1024 a bottom sheet. Updates live from the unsaved form, highlights the field under the cursor, "Missing in Italiano" jump links.
3. Real device sizes drawn into a scrollable viewport at 100 %; Fit scales but never below 50 %.
4. Preview page: left rail trigger list (grouped, surface-aware, shows "Fired: …" with Reset), the stand-in inert until "Interact" is switched on.
5. Pending changes included; badge when a shown item has a Working Copy.

## What works (keep)
- Editor card: Esc, Close, click outside close it and return focus to the button; focus lands on the active surface tab; arrow keys move between tabs; unsaved form is reflected (title "(revised wording)", 7 min) with "Shows unsaved changes" note; axe 0 violations (c1, b1, a1).
- Language switch re-renders in Greek with `lang="el"`, RTL `dir` handled, and the status line counts missing titles per language.
- Forced 403/404/502/503 show distinct, recoverable errors and Try again works.
- QR deep link `?t=` opens its target with a note; unknown code gives a clear role=status message.
- No horizontal page scroll at any viewport; Mobile frame is 1:1 (390 at 1.02).

## Unverified / could not test
- Preview page at zoom200: the screenshot caught the project loader (`shots/preview__zoom200__zoom200.png`), no judgement. Editor card at zoom200 checked: usable (328 px high), Preview button not re-checked.
- Slow-load skeleton visual (`preview__loading__1440.png` was taken after the route did not delay); offline mode and 409/422 not applicable.
- Frame focus with a screen reader; touch gestures; the contrast of the stand-in themes beyond axe (0 violations).
- Impeccable detector not run (degraded single-context; no source edits intended).
