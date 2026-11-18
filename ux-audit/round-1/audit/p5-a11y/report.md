# p5-a11y — Round 1
Persona: keyboard-only and screen-reader author (`curator`, Project `UX Audit – Populated`), Chromium via Playwright, `page.keyboard` only (programmatic `.focus()` used only to jump to a known control; no pointer events). Skipped impeccable's interview steps (subagent; the brief answers them). Mode: Operate.

## Verdict (5 lines max)
Strong keyboard foundations: skip link, one `main`, one `h1`, consistent 2 px focus ring on buttons/links, modal dialogs that trap and restore focus, polite live regions for save/upload/reorder, role=alert error summaries, labelled coordinate fields on maps and routes. axe finds only 4 serious nodes in ~30 screens/states, but axe does not test what hurts most here.
Open gate failures: form-field borders are 1.24:1 (WCAG 1.4.11), the Preview page's frame is not labelled or bounded, and forced-colors strips the shape from every filled button.
Focus is dropped to `<body>` after almost every state change (route load, create, Save, Place on plan, asset attach, popover Esc, Project switch), and `document.title` never changes; screen-reader users get no "new page" cue.
Keyboard efficiency: the POI-editor map adds 37 unnamed Tab stops, Save sits 70 Shift+Tabs from the Slug field, and Preview/floor plan lists add 45-60 stops each.
Score range for this group: 58-68 (open P0 caps most screens at 60; uncapped screens score 67-81).

## Context check (one fact cited from each)
- `12-cms-experience`: every Project member has full authoring rights; personas differ in jobs, not permissions (§2).
- `14` §4: "the preview frame is labelled with the surface and language it renders, and the CMS chrome remains operable while the frame has focus" (also: reorder = move up, move down, set position).
- `03` §1: an `ACTIVE` Resource is edited through a Working Copy (Save draft / Apply / Discard); DRAFT → ACTIVE → ARCHIVED.
- `DECISIONS.md`: D-042 (error summary entries move focus to their field) and the line at ~L1053 (Preview-in-app card keeps its focus trap and Escape, focus back on the button).
- `PRODUCT.md`: "Desktop is primary (1440 and 1280); tablets (1024, 768) must remain fully usable"; daily editors maintain 40+ items per list "with keyboard flow".

## Test log (what I actually did)
Records created by me (all named `UX-p5-a11y …`, left in place): POI "UX-p5-a11y Alpha" (its title got overwritten to `edited` because Tab selects the field text and I typed over it; saved as DRAFT, version 1; a later unsaved image attach was not saved), POI "UX-p5-a11y Beta", floor plan "UX-p5-a11y Plan" (Beta placed, unsaved), asset `UX-p5-a11y-upload.png`. Reorder was exercised only between my items (moved Beta up then back down). 422/503/404/403 and offline were forced with `page.route` / `setOffline`; nothing pre-existing was saved.
Scripts: `s01-s30*.mjs` (this folder), raw data in `out/` (`scan.json`, `scan2.json`, `contrast.json`, `tab-*.json`, `poi-editor-snapshot.txt`), 56 shots in `shots/`.

### axe-core (wcag2a/2aa/21a/21aa), 1440 wide
Routes: dashboard, places, pois, routes, guides, events, categories, media, maps, floor-plans, preview, navigation, translations, editors of place/route/guide/event/category/map/floor plan (existing and mine)/asset/POI; states: create-POI dialog (open, empty-submit, duplicate slug), Filters popover, Preview-in-app panel, asset picker, upload dialog, new floor-plan dialog, POI 422 summary, project switcher, empty Project dashboard.

| Impact | Nodes | Rule | Where |
|---|---|---|---|
| critical | 0 | | |
| serious | 2 | color-contrast | POI list: trigger chip "QR code (draft)" 3.03:1 (#878d97 on #f4f4f5, 9 px bold); shows up under every dialog opened over the list |
| serious | 2 | label-content-name-mismatch | Guide editor heading-level buttons: `aria-label="Level 2"` vs visible text "H2" |
| moderate / minor | 0 | | |

Everything else was clean, which is exactly why the manual findings below matter: axe does not see 1.4.11, focus management, labelled frames, forced colors or tab sinks.

### Contrast I computed (all in-scope routes, every visible text node; script `s22.mjs`, `out/contrast.json`)
| Item | Ratio | Needs | Verdict |
|---|---|---|---|
| Text-input / select border `#e5e7eb` on white | 1.24:1 | 3:1 (1.4.11) | FAIL |
| Placeholder `#9ca3af` on white | 2.54:1 | 4.5:1 | FAIL |
| Draft trigger chips (QR/Geo/Beacon, 9 px bold, dimmed) | 2.7 to 3.13:1 | 4.5:1 | FAIL |
| Drag handle ⠿ `#9ca3af` | 2.54:1 | 3:1 (operable control) | FAIL (decorative for keyboard, but it is the drag affordance) |
| Hierarchy glyphs ↳ └ `#d1d5db` | 1.47:1 | 3:1 | FAIL (indentation also conveys it) |
| Disabled Save (white on `#4d1d8b` at reduced opacity) | 3.91:1 | exempt (disabled) | OK, noted |
| Disabled ▲ at list top, "‹ Previous", "+ AR scan target" | 1.34 to 2.54:1 | exempt (disabled) | OK, noted |
| Focus outline `#4d1d8b` on white | ~11:1 | 3:1 | OK |
| Status/pending/translation chips, helper text, "Missing" red, "Unsaved changes" amber | all ≥ 4.5 | | OK |

### Other global checks
- **Focus order** (POI list): skip link, header (switcher, Manage members, Help, user), 16 nav links, page action, search, Filters, then per row ▲ ▼ title Deactivate/Archive. Logical, but 22 stops precede the page and 5 per row.
- **Skip link**: present, first stop, visible on focus, moves focus to `main` (`tabindex=-1`, ring drawn around the whole main area).
- **Landmarks**: `header`, `nav[Primary]`, `main` everywhere; Media/Maps add `nav[Pages]`/`nav[Sections]`; editors add `aside`. No `search`/`complementary` labels, nav groups ("Content", "Visitor app") are plain text, not headings or lists.
- **Headings**: one `h1`, no skipped levels in every route except Preview and Navigation (stand-in content adds a second `h1` and its own `h2`s).
- **200 % zoom** (`zoom200`): no horizontal scroll on list, POI editor, Preview, floor plan, Media; nav collapses to a Menu button; dialog fits (520×295 box). Pass. Shots `zoom200__*`.
- **prefers-reduced-motion: reduce**: `document.getAnimations()` is empty in both modes (no running animations or transitions), so nothing to reduce. Pass.
- **forced-colors: active**: see R1-p5-a11y-07. Shots `forced__*`.
- **Live regions** found: a `role=status` "Saving…", a polite toast region (title + message + ✕), `aria-live=polite` region on list/Dashboard/Preview, `role=alert` for the 422 summary, load errors and the offline banner. They work for Save, upload, reorder, create, Place (toast text), errors.

## Scores (0–100, per screen/state audited)
Weights: Task clarity & flow 25 · Visual hierarchy & craft 20 · Consistency 15 · Copy & feedback 15 · Accessibility 15 · Responsiveness & state coverage 10. Caps: open P1 → 85, open P0 → 60.

| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total (cap) |
|---|---|---|---|---|---|---|---|
| POI list (search, Filters popover, reorder) | 20 | 16 | 12 | 12 | 9 | 8 | 77 → **60** (P0-01) |
| Create-POI dialog (open, empty, duplicate) | 20 | 16 | 12 | 11 | 10 | 8 | 77 → **60** (P0-01) |
| POI editor (edit, Save, 422, coordinates) | 17 | 15 | 12 | 11 | 6 | 7 | 68 → **60** |
| Asset picker / attach image | 18 | 15 | 12 | 11 | 8 | 7 | 71 → **60** |
| Media upload dialog | 21 | 16 | 13 | 13 | 11 | 8 | 82 → **60** (P0-01 via shared inputs) |
| Preview page (frame, language, trigger) | 15 | 16 | 12 | 10 | 5 | 6 | 64 → **60** (P0-02) |
| Preview in app panel (editor) | 19 | 16 | 12 | 12 | 9 | 7 | **75** |
| Floor plan list / new dialog / editor | 16 | 15 | 11 | 10 | 6 | 6 | 64 → **60** |
| Project switcher + Project switch | 16 | 16 | 11 | 11 | 6 | 7 | **67** (P1 cap 85 not binding) |
| Errors (503/404/403/offline) | 20 | 15 | 13 | 13 | 12 | 8 | 81 |
| Group (a11y persona) | | | | | | | **58-68** |

Nielsen heuristics (a11y lens, 0-4): 1 Visibility of status 3 (live regions good, but no page/route status) · 2 Match with real world 3 · 3 User control and freedom 2 (focus loss, popover Esc, panel trap) · 4 Consistency 2 (three focus-ring styles, tabs not APG, coordinate fields named three ways) · 5 Error prevention 2 (no client-side range checks) · 6 Recognition over recall 3 · 7 Flexibility/efficiency 2 (tab sinks, no shortcuts, no set-position on lists) · 8 Aesthetic/minimal 3 · 9 Error recovery 3 (summary + links + request id) · 10 Help 2.

## Findings

### R1-p5-a11y-01 — P0 — Form-field borders fail 3:1 non-text contrast
- **Screen/state**: every text input, textarea, select (POI editor, create dialogs, filters, floor plan, switcher); 1440; Persona: low-vision keyboard user.
- **Evidence**: computed border `rgb(229,231,235)` on white bg = **1.24:1** (`out/contrast.json`, `s23.mjs`); `shots/poi-editor__top__1440.png`. axe does not test this.
- **Observation**: the only visual boundary of an empty field is a 1 px `#e5e7eb` line; the focus state just recolours it to purple 1 px (no outline, `outline: 2px transparent`), unlike buttons that get a 2 px purple ring offset 3 px. Placeholder text is also 2.54:1.
- **Why it hurts**: with low vision or glare a field is not findable; focus on a field is a weaker cue than on any button.
- **Recommendation**: border ≥ `#8a8f98` (3:1) at rest, 2 px purple outline + offset on `:focus-visible` for all fields; placeholder `#6b7280` or darker.
- **Likely files**: `src/components/ui/input*`, `textarea`, `select`, tailwind tokens (`--input`). **Spec**: `14` §4 / BRIEF "3:1 UI" gate. **Effort**: S.

### R1-p5-a11y-02 — P0 — Preview page frame is not labelled or bounded
- **Screen/state**: Visitor app → Preview, Web/Mobile/Kiosk, 1440. **Evidence**: `shots/preview__default__1440.png`, `s11.mjs`, `s12.mjs`: no `iframe`, no `region`/`role=group` named with surface and language; the only cue is a visual caption "Desktop browser, 1280 wide". The editor's "Preview in app" panel is correct (`region "Preview: Mobile, English"`), so the Preview page is the odd one out.
- **Observation**: the stand-in renders directly in the CMS DOM. It adds a second `h1` ("UX Audit – Populated"), five `h2`s and 45+ tab stops (Web) between the toolbar and the end of the page, with no landmark to skip or announce it. Language is switched with `lang="el"` on a `div` (good).
- **Why it hurts**: a screen-reader user cannot tell where CMS controls end and the simulated app begins; the heading outline is polluted; the "CMS chrome remains operable" rule is only met by long Tab runs.
- **Recommendation**: wrap in `<section aria-label="Preview: Web, English, working content" role="region">` (or a real `iframe title=`), demote stand-in headings to `role=presentation`/aria-level offset or `inert`+`aria-hidden` the decorative parts, and add a "Skip preview" link after the toolbar and a Shift+Tab-safe "Back to controls" landmark. Same for the Navigation editor's embedded preview (second `h1`).
- **Likely files**: `src/views/workspace/PreviewView.vue`, `src/components/preview/*`. **Spec**: `14` §4 (labelled frame), BRIEF §2. **Effort**: M.

### R1-p5-a11y-03 — P1 — A route change is neither announced nor focused
- **Evidence**: `s03.mjs`, `s07.mjs`, `s21.mjs`. `document.title` is "iGuide CMS" on every route (11 list routes + 10 editors). After Enter on a nav link, focus stays on the link and the live regions stay empty (`/polite:` empty, `status:` empty). After opening an editor from a list, `document.activeElement` is `BODY`. Skip link and Project switch do move focus (skip to `main`).
- **Why it hurts**: a screen-reader user who activates "Routes" hears nothing; browser history/tab lists show identical titles (WCAG 2.4.2). Opening an editor leaves them at the top of the document with no "Edit POI: edited" cue.
- **Recommendation**: router `afterEach` sets `document.title = "<page> · <Project> · iGuide CMS"`, moves focus to the page `h1` (tabindex -1) on every navigation except same-page tab changes, and writes "<page> loaded" to the polite region.
- **Likely files**: `src/router.ts`, `ProjectLayout.vue`, `PageHead.vue`, `useResourceEditor.ts`. **Spec**: `14` §4 (announcements), WCAG 2.4.2/2.4.3. **Effort**: S.

### R1-p5-a11y-04 — P1 — Focus falls to `<body>` after most state-changing actions
- **Evidence** (focus after the action, `focusInfo`):
  - Save draft in POI editor (button disables after saving): `BODY` (`s08.mjs`).
  - Create POI / floor plan from dialog → editor opens: `BODY`.
  - "Place" on floor plan (button leaves the Unplaced list): `BODY`; the toast says "Placed on the plan … sits in the middle".
  - "Use this image" in the Asset picker: dialog closes, focus `BODY`, no announcement (toast absent, `status` empty).
  - Esc from the Project switcher with focus on one of its links: `BODY`.
  - Project switch (Populated → Empty): `BODY` (the Dashboard readiness text is announced by chance).
- **Why it hurts**: the next Tab starts from the document top or an arbitrary sequential-navigation point; screen readers lose context.
- **Recommendation**: a small `restoreFocus(target)` helper: after Save focus the page head "Save" stays enabled with `aria-disabled` (do not `disabled` a focused button), after create focus the editor `h1`, after Place focus the new row's x field, after attach focus the new "Change image" button (and announce "Image attached: tiny-thumbnail"), after popover close focus the trigger.
- **Likely files**: `EditorShell.vue`, `ResourcePickerDialog.vue`, `ProjectSwitcher.vue`, `FloorPlanEditorView.vue`, `lib/focus.ts`. **Spec**: `14` §4. **Effort**: M.

### R1-p5-a11y-05 — P1 — The POI map adds 37 unnamed Tab stops; Save is 70 Shift+Tabs away
- **Evidence**: `tab-poi-editor.json`, `s09.mjs`, `s29.mjs`. Between Longitude and the "Site map" group's Zoom controls, `path` elements 8×8 px (the other POIs' Leaflet circle markers) are tabbable: 37 stops, no role, no name, no action. From the Slug field, Shift+Tab needed 70 presses to reach Save (header, scrolls out of view); Ctrl+S does nothing.
- **Why it hurts**: a keyboard user crossing the Placement card must tab 37 times; once in the Details card, Save is effectively out of reach.
- **Recommendation**: `interactive: false` / `keyboard: false` on the context markers (only the editable pin is focusable) or `tabindex=-1` them; make the Save/status bar `position: sticky` and add Ctrl/Cmd+S ("Save draft") with a visible hint; consider a bottom action bar. Keep the map group's arrow-key nudging (works: 2 right + 1 up changed `37.9715/23.7257` to `37.97171/23.72646`) but add an announcement of the new coordinates (none today).
- **Likely files**: `src/components/GeoPicker.vue`, `EditorShell.vue`. **Spec**: `14` §4 (coordinate fields, reorder). **Effort**: S-M.

### R1-p5-a11y-06 — P1 — Forced colors: filled buttons lose their shape; selected tab lost
- **Evidence**: `shots/forced__pois__1440.png`, `forced__poi-editor__1440.png`. "New point of interest", Save, Activate render as bare text with no border (the gradient/fill is the only boundary). Active language tab and inactive tabs share the same black underline. English "editing" dot disappears. Focus ring and Filters popover survive.
- **Why it hurts**: Windows High Contrast users cannot tell primary actions from labels.
- **Recommendation**: add `border: 1px solid transparent` (forced-colors maps it to ButtonText) to filled buttons and `forced-color-adjust` rules for selected states (`border-bottom: 3px solid Highlight`, `aria-selected` marker); replace dots with text + icon already present or `Canvas`-safe borders.
- **Likely files**: `src/components/ui/button*`, `SectionTabs.vue`, `EditorShell.vue`, `TranslationDots.vue`, global CSS. **Spec**: `14` §3 Presentation. **Effort**: S.

### R1-p5-a11y-07 — P2 — Language tabs are not a tab pattern
- **Evidence**: `s23.mjs`: three `role=tab` all `tabindex=0`; ArrowRight leaves focus on the same tab; Enter or Space activates; the change is not announced (`status` empty). Preview toolbar buttons (`aria-pressed`) behave similarly with no arrow support.
- **Recommendation**: roving tabindex + Arrow/Home/End (as the preview-panel surface tabs already do per D-056), announce "Ελληνικά tab, 2 of 3" is native once selected; add `aria-live` "Editing Ελληνικά texts".
- **Likely files**: `TranslationsPanel.vue`, `EditorShell.vue`, `SectionTabs.vue`. **Effort**: S.

### R1-p5-a11y-08 — P2 — Preview changes are not announced
- **Evidence**: `s12.mjs`. Switching Web→Mobile keeps the same live text ("Showing drafts and active content. No missing titles in English."); the Greek switch changes it only through the count text; Fire trigger changes nothing announced (`live` unchanged).
- **Recommendation**: live text "Preview: Mobile, Ελληνικά, working content" plus "Fired QR code frieze-101: opened Parthenon Frieze – North Side".
- **Likely files**: `PreviewView.vue`. **Effort**: S.

### R1-p5-a11y-09 — P2 — Floor plan editor: generic names, terse labels, no validation, 63-stop list
- **Evidence**: `s18.mjs`-`s20.mjs`, `shots/floorplan-editor__placed__1440.png`. 63 buttons named just "Place" (name lacks the item; row text is the only context), "Remove from plan" is generic, number fields labelled `x`, `y`, "Rotation °" (the map editor's are "Latitude of Bema of Phaedrus"). `x = 1.7` is accepted silently (no `aria-invalid`, no message, no `min/max`). Arrow keys on the marker move by 0.01 (good, ring visible) but no announcement of the new value. Unplaced list has no search.
- **Recommendation**: `aria-label="Place <title> on the plan"`, "Remove <title> from plan", "Horizontal position of <title> (0 to 1)", range-validate with inline error + summary, announce "<title> at x 0.52, y 0.51", add a filter above Unplaced.
- **Likely files**: `FloorPlanEditorView.vue`. **Spec**: `14` §4 (coordinate fields). **Effort**: S-M.

### R1-p5-a11y-10 — P2 — Coordinate fields in the POI editor are not validated client-side
- **Evidence**: `shots/poi-editor__lat-invalid__1440.png`: latitude 123.4 shows no error and no `aria-invalid`; the error only appears after a server 422 (mocked: "Latitude must be between -90 and 90"). Label also exposes no unit.
- **Recommendation**: validate on blur (−90…90, −180…180), `aria-invalid` + `aria-describedby`, "Latitude (−90 to 90)".
- **Likely files**: `PoiEditorView.vue`, `GeoPicker.vue`. **Effort**: S.

### R1-p5-a11y-11 — P2 — Error summary: raw labels, scrolled-off, buttons not links
- **Evidence**: `shots/poi-editor__422-summary__1440.png`, `s09.mjs`. After a mocked 422 the summary (`role=alert`, `tabindex=-1`, request id shown) is correct and focus goes to the first field in error (good, D-042), but: an entry reads "exhibitCode: Exhibit code is taken." (raw path, while others read "Slug:", "Title (English):"); the page has scrolled to the Slug field so the summary is off-screen; entries are `<button>`s (fine for focus move, but the spec says "links"); the field messages are plain `⚠` text with no `aria-describedby` visible in the tree (`[invalid]` only).
- **Recommendation**: `describePath` fallback to humanised label; keep summary focus first (then the entry list lets the user jump), or scroll the summary into view and announce "4 errors"; give each message an `id` and `aria-describedby`/`aria-errormessage`.
- **Likely files**: `useResourceEditor.ts` (`describePath`, `showErrors`), field components. **Effort**: S.

### R1-p5-a11y-12 — P2 — Create dialog: optional Slug flagged on empty submit
- **Evidence**: `shots/pois-create__empty-submit__1440.png`: empty submit shows two errors: Title (right) and Slug "Use lowercase Latin letters, digits, and single hyphens." (empty slug is optional and auto-filled from the title). The duplicate slug case is correct (focus to Slug, "Another point of interest already uses this slug.").
- **Recommendation**: do not validate an empty optional slug; add an error summary/live announcement for multi-field dialogs ("2 fields need attention"); the messages should be programmatically tied (see 11).
- **Likely files**: `CreatePoiDialog.vue`. **Effort**: S.

### R1-p5-a11y-13 — P2 — Project switcher semantics and focus
- **Evidence**: `s25.mjs`, `s26.mjs`, `shots/switcher__open__1440.png`. The trigger has `aria-expanded` but no `aria-haspopup`; the popup has no role; on open, focus stays on the trigger (next Tab lands in the list); list is ~12 Projects with no search and link names concatenate title, status and "Not initialized · resume initialization"; "Escape" with focus inside the list drops focus to `BODY`.
- **Recommendation**: use a Popover/Dialog (focus moves to the first item or a Search field, Esc restores to trigger), group links under "Organizations" with `aria-labelledby`, name = Project name, description = status; add type-ahead search.
- **Likely files**: `ProjectSwitcher.vue`. **Effort**: M.

### R1-p5-a11y-14 — P2 — "Preview in app" panel traps focus; CMS chrome is unreachable while open
- **Evidence**: `s10.mjs`: Tab cycles Close → scroll region → Mobile → Close; focus starts correctly on the Mobile tab; Esc and Close return to the trigger (good). Everything behind the panel is unreachable by keyboard (spec says the chrome "remains operable while the frame has focus").
- **Recommendation**: either keep the modal contract (it is reasonable for a transient card) and record the interpretation in `DECISIONS.md`, or render the panel non-modally with the heading and Close as a landmark so Save and the language tabs stay reachable; the scroll region should have a name (`aria-label="Preview content"`).
- **Likely files**: `ResourcePreview.vue`. **Spec**: `14` §4. **Effort**: S-M.

### R1-p5-a11y-15 — P2 — Reorder on lists lacks "set position"; two stops per row
- **Evidence**: `s15.mjs`. POI/Place/Route/Guide/Event/Category/Floor-plan lists: ▲/▼ buttons named "Move <title> up/down" (24×24, ring visible), announced "Moved UX-p5-a11y Beta to position 54 of 55." (great), focus stays on the button, and while filtered the move controls disappear with the visible note "Clear the search and filters to reorder". There is no "set position" control on lists, though Route stops and Guide blocks have a "Position of stop N" combobox. 2 extra tab stops per row (≈100 on a 50-item list).
- **Recommendation**: add a "Move to position…" popover (number field) in the row actions or only on the focused row; consider one `role=toolbar` stop per row.
- **Likely files**: `ReorderControls.vue`. **Spec**: `14` §4. **Effort**: M.

### R1-p5-a11y-16 — P2 — Asset picker and upload: long tab runs, no attach announcement
- **Evidence**: `s13.mjs`, `s14.mjs`, `shots/asset-picker__selected__1440.png`. Focus lands on the "Any" status button (OK), tiles are `aria-pressed` buttons with ✓ icon + text (good), but "Use this image" sits after all tiles (≥22 stops; Enter on a tile does not confirm), "Use this image" stays disabled until a selection, the thumbnail `alt=""` (the name is in text, acceptable), and attaching announces nothing. Upload dialog is good: focus on "choose files", the per-file result "UX-p5-a11y-upload.png uploaded." goes to a polite region.
- **Recommendation**: sticky footer with Cancel/Use before the grid in DOM order or `Enter` on a tile = select, `Ctrl+Enter` = confirm; announce "Image attached: …"; return focus per 04.
- **Likely files**: `ResourcePickerDialog.vue`. **Effort**: S.

### R1-p5-a11y-17 — P2 — Search/filter results are not announced
- **Evidence**: `s06.mjs`: typing "UX-p5-a11y" in Search reduces rows from 55 to 2 with the polite region empty. Filters apply instantly too.
- **Recommendation**: debounced "2 of 55 points of interest" in the polite region. **Likely files**: list views / `ListFilterMenu.vue`. **Effort**: S.

### R1-p5-a11y-18 — P2 — Guide heading-level buttons: name does not contain visible label
- **Evidence**: axe `label-content-name-mismatch` x2 (`aria-label="Level 2"` vs "H2") on every Guide heading block. **Recommendation**: `aria-label="H2, heading level 2"` or drop the `aria-label` and use visible text + `title`. **Likely files**: `StoryEditor.vue` heading block. **Effort**: S.

### R1-p5-a11y-19 — P2 — Low-contrast chips and affordances
- **Evidence**: see contrast table: draft trigger chips 2.7-3.13:1 (axe serious), ⠿ handle 2.54:1, placeholder 2.54:1. **Recommendation**: do not dim chip text with opacity (use a "draft" icon + `#4b5563`), handle `#6b7280`. **Likely files**: `TriggerChips.vue`, `ReorderControls.vue`. **Effort**: S.

### R1-p5-a11y-20 — P3 — Three different focus styles
- Buttons/links: 2 px purple outline, 3 px offset. Text fields, selects, search: 1 px border recolour (Search keeps `outline 2px transparent`; `shots/pois__search-focus__1440.png`). Map marker: white/purple ring. `main` after skip: outline around the whole region. Unify (see 01). **Effort**: S.

### R1-p5-a11y-21 — P3 — Landmark/heading details
- Nav group captions are text, not headings or list groups; no `aria-current` text beyond `page` (present, good); Navigation editor has a second `h1`; "Open" link repeated beside the title link in the floor plan list (same URL, not distinguishable by name); only row 1's "Move up" is disabled while "Move down" of a one-item group is also disabled (fine). **Effort**: S.

### R1-p5-a11y-22 — P3 — Small targets on dense rows
- "Archive"/"Deactivate" text buttons are 16 px tall (Archive 52×16), "Choose" 43×16, "Place" 38×16. Exceeds the 2.1 AA bar (2.5.8 is 2.2) but fails the PRODUCT.md tablet-by-touch expectation (44 px). **Effort**: S.

## What works (keep these)
- Skip link first, visible, lands in `main`; one `h1`; `aria-current=page` on nav; zero axe criticals.
- Filters popover: focus moves into it, Tab stays inside, Esc/Done closes and returns focus to the Filters button.
- Create dialog: opens with focus on the first field, Esc returns to the trigger, empty and duplicate-slug errors set `aria-invalid` and move focus to the offending field.
- 422 summary is `role=alert` with request id, entries move focus to fields, a language tab with errors is opened automatically.
- Reorder announcements ("Moved … to position 54 of 55.") and focus retention are excellent; "Position of stop N" comboboxes exist on Routes and Guides; Map editor coordinate fields are named per item.
- Upload announces the result in a polite region; asset tiles are `aria-pressed` buttons with icon + text.
- Load errors (503/404/403) and offline are `role=alert` with request id, retry button, and unsaved-changes reassurance.
- 200 % zoom reflows with no horizontal scroll; no animations to reduce.

## Unverified / could not test (and why)
- Real screen-reader output (NVDA/VoiceOver): not available; verdicts rest on the accessibility tree, ARIA attributes and live-region contents.
- `aria-describedby` linkage of field error messages: the tree shows `[invalid]` but not descriptions; my DOM probe returned no inputs (script issue), so unconfirmed.
- Toast auto-dismiss duration (WCAG 2.2.1): the toast was visible ~2 s in screenshots; my timing probe was unreliable.
- Rich-text format announcements (Guide story editor) and Guide block set-position beyond tree inspection; not exercised.
- Sign-in, session-expired, 401 and configuration-error views; Create Project wizard; New map dialog and map-editor bounds editing; 409 conflict "mine / current": outside this run's time budget.
- 1280/1024/768 viewports beyond `zoom200`; touch; dark mode (none exists).
