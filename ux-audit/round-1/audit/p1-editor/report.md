# p1-editor — Round 1

Persona: daily editor / power user (`curator`), Project `UX Audit – Populated` (54 POIs, 34 assets). Mode: Operate. Impeccable interview steps skipped (subagent; the brief answers them). Records created by me: `UX-p1-editor Alpha Kouros` (ACTIVE), `Beta` (ACTIVE, one applied Working Copy), `Gamma` (ACTIVE, deliberately empty), `Delta` (ACTIVE, Working Copy created then discarded). Reorder: only Delta/Gamma moved and put back. Scripts: `s01..s26.mjs` in this folder. Screenshots: `shots/`.

## Verdict
The editor flows are functionally complete and mostly honest (Working Copy, leave guard, apply confirm, discard confirm, live-region reorder announcement all work). For a daily user the weak spots are: one-click list Activate with no readiness check and a false "complete" toast, no way to find "what I edited yesterday", reorder only one step at a time (no set-position) over 54 rows, a 2,300 px editor whose Save lives only at the top, and long cold loads (POI list 3.7 s, Media 6.6 s). Not shippable for power use yet; fixable by structural changes (sticky action bar, saved views/sort, activation gate, set-position).

## Context check
- `12` §2: the Content editor "works daily during a production phase… needs fast entry, reliable preview, and safety when editing live Content" (the standard used for the speed/safety findings).
- `14` §4: "every reorder interaction … has a keyboard alternative: move up, move down, and set position; drag-and-drop is an addition".
- `03` §1: "An ACTIVE Resource is edited through one working copy, so a half-finished edit never reaches visitors."
- DECISIONS.md D-017: lists reorder by drag and by Move up/Move down only, off while search/status/Category filter is active.
- PRODUCT.md: success is "a daily editor who can maintain 40+ items per list quickly and confidently".

## Scores
Caps applied (open P1 → ≤85). Columns: Task clarity 25 · Hierarchy/craft 20 · Consistency 15 · Copy/feedback 15 · A11y 15 · Responsive/states 10.

| Screen / state | Task | Craft | Cons. | Copy | A11y | Resp./states | Total |
|---|---|---|---|---|---|---|---|
| POI list (54 rows, filters, search) | 17 | 14 | 11 | 10 | 10 | 7 | **69** |
| POI create dialog | 21 | 16 | 13 | 12 | 12 | 8 | **82** |
| POI editor, DRAFT (long form, save) | 17 | 14 | 11 | 10 | 11 | 7 | **70** |
| POI editor, ACTIVE + Working Copy | 19 | 14 | 12 | 10 | 11 | 7 | **73** |
| Asset picker (image/audio) | 17 | 14 | 11 | 10 | 10 | 6 | **68** |
| Media library (grid/list/filters) | 18 | 14 | 11 | 11 | 11 | 7 | **72** |
| Asset detail (audio) | 21 | 16 | 12 | 11 | 12 | 8 | **80** |
| Moving between kinds (nav, keyboard) | 16 | 13 | 11 | 9 | 9 | 7 | **65** |

Nielsen (group, 0–4): visibility of status 3 · match with real world 3 · user control/freedom 3 · consistency 3 · error prevention 2 (activation gate) · recognition over recall 3 · flexibility/efficiency 1 (no shortcuts, no set-position, no sort/saved views) · aesthetic/minimal 2 (dense rows, repeated "No trigger…" noise) · error recovery 3 · help/documentation 2. Total 25/40.

## Findings

### R1-p1-editor-01 · P1 · Activating from the list skips readiness and tells a falsehood
- Screen: POI list, row Activate · 1440 · editor activating own items
- Evidence: `shots/poi-list__activate-gamma-result__1440.png`. Steps: create a POI with only a title (Gamma), search "UX-p1-editor", click ACTIVATE on its row. It goes ACTIVE immediately, no dialog, no readiness list; toast: "UX-p1-editor Gamma is complete and visible to visitors." The same in the editor for Beta/Delta (`shots/poi-activate__Delta__1440.png`): toast "The point of interest is complete and visible to visitors" while "What needs attention" lists 5+ warnings.
- Observation: no blocking check was ever hit; I could not "resolve readiness blocks" because none occurred. Copy claims completeness it does not know.
- Why it hurts: an empty POI goes live by one mis-click; the toast trains the editor to ignore warnings. Brief principle: readiness is the single answer to "what is missing".
- Recommendation: activation always shows a short confirm that names the warnings (count + top 3, link "Review"), blocking items disable the button with the reason; the toast says "Activated · 5 warnings" and links to them. Never say "complete" unless warnings = 0.
- Files: `src/views/workspace/pois/PoisView.vue`, `src/components/StatusChangeDialog.vue`, `PoiEditorView.vue`. Spec: `12` readiness model (BRIEF §2). Effort M.

### R1-p1-editor-02 · P1 · Reorder: one step at a time, no "set position"
- Screen: POI list · 1440/1280 · power user reordering among 54 rows
- Evidence: `shots/pois-list__after-move-up__1440.png`; DOM `ReorderControls.vue` has only ⠿, ▲, ▼ (`aria-label="Move X up"`). Moving my row from 54 to 1 = 53 clicks, each a `PUT /pois:order` (204). Live region works: "Moved UX-p1-editor Delta to position 49 of 54."
- Observation: no "set position" field (BRIEF hard constraint and `14` §4 list it with move up/down). Drag: works with a mouse (drag Delta over Gamma, 2.3 s incl. save) but HTML5 drag has no auto-scroll test result and no touch support (unverified on touch). ▲▼ are 24×24 px and glued to the title text. Reorder is switched off by any search, filter, or even the "Search in" language (hint "Clear the search and filters to reorder"), which are exactly the situations a 54-row list needs it.
- Why it hurts: far moves are impractical by keyboard; arguably fails the BRIEF a11y gate (P0 on a strict reading; rated P1 because the lists are not named in `14` §4).
- Recommendation: row menu "Move to position…" (number + Enter), "Move to top/bottom", 32 px hit areas, and allow reorder while filtered by moving relative to the visible neighbour (or reorder inside a dedicated "Order" mode that ignores filters).
- Files: `src/components/ReorderControls.vue`, `src/workspace/useReorder.ts`. Spec: `14` §4, D-017. Effort M.

### R1-p1-editor-03 · P1 · Cannot find "the POI I edited yesterday"
- Screen: POI list · 1440 · job 3
- Evidence: `shots/pois-list__filter-pending__1440.png` (8 seeded POIs with PENDING CHANGES). Rows show only one date (12 Nov 2026, apparently creation), no "updated", no "edited by", no sort control; Working Copy author/time is only visible inside each editor ("saved 12 Nov 2026 by you", date only).
- Observation: the Pending changes chip is the only handle on recent work, and it is hidden in the Filters popover under "Status".
- Why it hurts: the daily-editor's first task each morning has no direct path; they open 8 editors to find theirs.
- Recommendation: add "Updated" (relative time + editor) column or secondary line, a Sort control (Order / Updated / Title / Status), a visible "Edited by me" / "Pending changes" quick chip next to search, and a "Recently edited" strip on the Dashboard. Show time, not only date, in the Working Copy banner.
- Files: `PoisView.vue`, `ListFilterMenu.vue`, `FilterChoiceGroup.vue`. Effort M.

### R1-p1-editor-04 · P1 · Editor is ~2,300 px tall; Save and Activate are not persistent
- Screen: POI editor (DRAFT and ACTIVE) · 1440 · job 1
- Evidence: `shots/poi-editor__draft-full__1440.png` (page height 2,576 at 1440), `shots/poi-editor__trigger-geo-added__1440.png`. After scrolling to Triggers/Placement, the Save button's top is at y = −1625 (not sticky); the dirty marker "Unsaved changes" is also off-screen. Ctrl+S saves (verified, `s10.mjs`) but nothing advertises it.
- Observation: the right rail (Status, Activate, What needs attention, Translations, Used in) is not sticky either; sections are a single scroll, Placement/Triggers/Details are 1,300–2,300 px down, and there is no in-page section index.
- Why it hurts: fill image → scroll to place → scroll up to save → scroll to rail to activate, for every POI; the "Save first" toast (below) follows.
- Recommendation: sticky action bar (title, state chip, "Unsaved changes", Save / Save draft / Apply) and sticky right rail; a section index (Content · Media · Reach · Placement · Details) with scroll-spy; show "Ctrl+S" in the Save tooltip.
- Files: `PoiEditorView.vue`, `src/components/editor/*`, `PageHead.vue`. Effort M.

### R1-p1-editor-05 · P2 · Activating a dirty draft is refused with "Save first"
- Evidence: `shots/poi-activate__dialog__1440.png`. Steps: edit, click ACTIVATE without saving → toast "Save first — Save or undo your changes before changing the point of interest's status." (and no dialog).
- Why: an extra round trip for a predictable intent. Recommendation: "Save and activate" (one action) or auto-save on Activate. Files: `PoiEditorView.vue`. Effort S.

### R1-p1-editor-06 · P2 · Save is slow and sequential; feedback is thin
- Evidence: `s13.mjs` output. A DRAFT save with image, audio, category, QR, geo = 9 sequential requests: triggers POST+status ×2, PUT, categories, resource-assets ×2, :order → 2.5–3.1 s with the button reading "Saving…"; a plain PUT is ~0.5 s. The only confirmation is a toast that disappears; the header keeps "Unsaved changes" + "Saving…" together.
- Recommendation: run independent calls in parallel, show "Saved 14:32" inline in the sticky bar (persistent), and say what was saved ("Saved · 2 triggers, 2 media"). Closing the page at ~1 s (my first run) saved the PUT but not the rest: partial saves are silent. Files: `useResourceEditor`, `platform/*`. Effort M.

### R1-p1-editor-07 · P2 · Working Copy banner shifts the form by 92 px mid-typing
- Evidence: `s16.mjs`: Summary top moves +92.25 px on the first keystroke of an ACTIVE POI (banner "You are editing a working copy / Not saved yet" appears). `shots/wc__beta-apply-with-unsaved__1440.png`.
- Also: Apply changes in the header is enabled while "Not saved yet"; the banner's SAVE DRAFT / DISCARD CHANGES are small text links; the Apply dialog does not list what will change; "Pending" is said three times (chip, banner, status card).
- Recommendation: reserve the banner space (always-visible slim bar on ACTIVE items), turn Save draft/Discard into real buttons in the sticky bar, and list changed fields in the Apply dialog. Files: `PoiEditorView.vue`, `WorkingCopyBanner*`. Effort S–M.

### R1-p1-editor-08 · P2 · Readiness text is generic, repeated and partly stale
- Evidence: `shots/poi-activate__Delta__1440.png`. "WARNING Accessibility information for visitors is empty. (English)" repeated for each language; "Title is not translated. (Ελληνικά)". Helper under Title still reads "Required in the default language before it can be activated." on an ACTIVE POI. Whether each item is a link that moves focus (`14` §4) was not verified.
- Recommendation: group by language ("Ελληνικά: title, summary, accessibility text missing"), name the field ("Alternative text for the primary image"), keep helper text status-aware. Effort S.

### R1-p1-editor-09 · P2 · DRAFT assets can be picked and an ACTIVE POI raises no warning
- Evidence: `shots/asset-picker__image-open__1440.png` lists DRAFT images (e.g. terrace-cafe, storeroom-shelves with "NO ALT TEXT"); Delta was activated with DRAFT `terrace-cafe` + DRAFT `audio-erechtheion`, no readiness item (`poi-activate__Delta`).
- Why: visitor may get a missing image (not verified in Preview). Recommendation: default the picker's status filter to ACTIVE (DRAFT behind a toggle with an "activate with this" option) and add a readiness warning for DRAFT attachments. Effort S–M.

### R1-p1-editor-10 · P2 · Asset picker: focus, size, audio
- Evidence: `asset-picker__image-open__1440.png`, `asset-picker__audio-open__1440.png`. Initial focus lands on the "Any" status chip, not Search; at 1440×900 only two grid rows show (the rest scrolls) and the dialog height changes between image (≈650 px) and audio (≈600 px); filenames truncated ("audio-parthenon-ove…"); audio tiles show a blank "AUDIO" box: no play, no language, only "Used in 1" (a number, not where); no list view in the picker though the library has one. Selected state is only a border (check "Nothing selected" label for text confirmation: present, good).
- Recommendation: focus Search; fixed dialog size using ~85 vh; list mode for audio with inline player and language; show where-used on hover/expand. Files: `ResourcePickerDialog.vue`, `components/media/*`. Effort M.

### R1-p1-editor-11 · P2 · Slow cold loads, skeleton on every visit
- Evidence (`s22.mjs`, dev server, live backend): POI list first row 3.7 s cold / 1.1 s warm; Guides 2.1 s; Places 0.95 s; Media first load 6.6 s; no list caching between visits so each return re-shows the skeleton. A count line "0 points of interest" was seen once ~1 s after navigation (`s17.mjs`, flash of the empty count; one observation). Search typing 22 chars: 698 ms with a 95 ms long task; scrolling the 54-row list produced long tasks of 421 ms and 54 ms (jank).
- Recommendation: keep last list in memory (stale-while-revalidate), render rows incrementally or virtualise, hide the count until loaded. Effort M.

### R1-p1-editor-12 · P2 · List density and noise
- Evidence: `pois-list__default__1280.png`: rows 90–105 px, 4 rows visible at 1280×720, ≈5,000 px for 54. Every row without triggers repeats "No trigger, only reachable by browsing" (italic); status column stacks chips; ▲▼ sit against the title. No pagination, no sticky table header.
- Recommendation: compact density toggle (single-line rows ~48 px), drop the empty-trigger sentence (show a chip only when present), sticky header, optional page size. Effort M.

### R1-p1-editor-13 · P2 · Filtered-empty state is a dead end; filters grouped oddly
- Evidence: `pois-list__filtered-empty__1440.png`: "No point of interest matches the search or the filters." with no Clear button. "Pending changes" lives inside the Status group; "Search in" language counts as an active filter (badge 1) and disables reordering. The active-filter chips (`Status: Pending changes ×`) are good.
- Recommendation: "Clear search and filters" button in the empty state; Pending changes as its own top-level chip; do not count Search-in as a filter. Effort S.

### R1-p1-editor-14 · P2 · No keyboard accelerators; focus/title after navigation
- Evidence: `s02.mjs`, `s26.mjs`, grep of `src` (only dialogs, map and tabs handle keys). 22 Tab stops (header + 17 nav links) precede the page content (a "Skip to content" link exists, good). After activating a nav link by Enter, focus stays on the link, the document title stays "iGuide CMS" on every screen, and nothing announces the new page. No command palette or "go to POI/Route/Guide" shortcut; moving POI → Route → Guide takes ~6 key presses each.
- Recommendation: `<title>` per page ("Beta · Points of Interest · iGuide"), move focus to the page H1 after route change, add Ctrl+K quick switcher (search any item by title, jump to kind), and `g p/r/g` or Alt+number shortcuts with a visible cheat sheet. Spec: WCAG 2.4.2. Effort M.

### R1-p1-editor-15 · P2 · Media library: no sort, mixed order, ragged grid
- Evidence: `shots/media__default__1440.png`, `media__list-view-audio__1440.png`. Default order puts documents, video, audio before images without a visible rule; no sort control; grid cards have unequal heights (first row), audio/video/document tiles are blank labelled boxes; "Used in" is a count only (names appear in the detail page `asset-editor__audio__1440.png`, good). Filters (Type, Status) work and show a chip; List view is much better for finding audio.
- Recommendation: default to List on libraries over ~24 items or remember the choice; sort by Newest/Name/Type/Used; equal-height cards; hover/"Used in" popover. Effort S–M.

### R1-p1-editor-16 · P3 · Asset detail duplicate copy
- Evidence: `asset-editor__audio__1440.png`: "WHAT NEEDS ATTENTION: Nothing needs attention: visitors see a complete asset." plus a second line "Nothing: visitors see a complete asset." (extra text node in DOM). Fix: one line. Effort S.

### R1-p1-editor-17 · P2 · 200 % zoom: chrome eats the viewport
- Evidence: `shots/poi-editor__active-top__zoom200.png`: header, project switcher and "Menu" row occupy ≈315 of 360 CSS px before the page title; no horizontal scroll (good). Recommendation: collapse switcher into the menu row, make the header non-sticky/auto-hide at small heights. Effort S.

### R1-p1-editor-18 · P3 · Smaller items
- Create dialog has no Category (must open the editor next); empty slug shows "Use lowercase Latin letters…" instead of "Enter a slug". `poi-create__empty-submit__1440.png`.
- Working Copy banner time: "saved 12 Nov 2026 by you" without time.
- Dates in lists ("12 Nov 2026") ambiguous: created or updated?
- QR trigger without public web address shows a warning inside each QR row ("No QR image…") — accurate but repeated; show once per card.
- Category/Place are native `<select>`s with 9 and 13 options (flat indentation by spaces, fine at this size, will not scale).

## What works (keep these)
- Create → editor takes 1.4 s; slug auto-fills from the title; empty submit shows inline errors with the field outlined (`poi-create__empty-submit__1440.png`).
- Leave guard dialog "Leave without saving?" works with the nav (verified); Discard dialog explains it "cannot be undone"; Apply dialog names the Resource (`wc__delta-discard-dialog`).
- Working Copy cycle verified end to end: edit → Save draft (1.3 s) → leave → list shows PENDING CHANGES → reopen with the draft intact → Apply (`wc__*` shots).
- Active-filter chips with remove buttons, "Filters (1)" badge, Greek search with Search-in language works (4 Kore results), counts "8 of 54".
- Reorder: ▲/▼ announced in a polite live region with position; focus stays on the moved row's button.
- Geo trigger pre-fills from the point's position; map click fills lat/long; coordinate fields exist.
- Asset detail: inline audio player, where-used with links, clear "can't be replaced while visitors may see it" explanation.
- No horizontal scroll at 1280 or zoom200.

## Unverified / could not test
- Touch drag, drag auto-scroll over long lists, and drag-and-drop in lists while the page scrolls (headless mouse only).
- Whether readiness items are links that move focus; `409`/`422`/offline/slow-network states (not forced; remit budget went to the editor job flow).
- Whether visitors see DRAFT-asset media of an ACTIVE POI (Preview not opened).
- Media upload dialog, Replace file, and Asset-picker "Upload new" (not exercised to avoid creating many assets).
- 1024/768 viewports; axe-core not run.
- A single oddity: my first run closed the browser 0.6 s into a save; only the PUT landed (expected, noted in 06).
