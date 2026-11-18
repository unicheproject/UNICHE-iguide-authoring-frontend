# Round 1 consolidated audit findings

Consolidator output for the iGuide CMS UX overhaul. Sources: the 15 reports under `ux-audit/round-1/audit/*/report.md` plus `design-system/proposal.md`; `BRIEF.md` for scope and caps. Screenshots were not reopened: every conflict below is resolved from the reports' own evidence (scripted runs, forced states, DOM measurements).

## Totals

- Original findings across the 15 reports: **290** (P0 6, P1 80, P2 160, P3 44), counted by each finding's own severity label (some reports' summary counts differ by one or two from their labels; labels were used).
- After de-duplication: **125 consolidated findings** in **20 clusters**: **P0 5, P1 54, P2 61, P3 5**. A consolidated finding takes the highest severity of its members. Every original ID maps to exactly one `C1-nn` (coverage checked mechanically: 290 of 290 IDs mapped once).
- Two IDs have no stated content in the saved reports: `s12-maps-17` and `-18` (P3). `s12-maps-07..-16` are not numbered in the saved report; they were assigned in the order its P2 themes are listed (a Place stacks at 0.5/0.5, b rotation, c unplaced lists, d text/targets, e route legend, f page order, g New map dialog, h floor plan order, i picker omits Places, j tab counts). Counts for that report are therefore approximate.
- Open P0 gate failures (consolidated): C1-06, C1-41, C1-42, C1-59, C1-81.

### The 10 most impactful problems

1. The Dashboard gives the wrong answer for 'what do I do now / what blocks launch': green 'Ready for visitors' for an empty or DRAFT-only Project, no first-run guide, no action, 296 warnings in one list (P0, manager and every new author). (C1-41, C1-42)
2. Every text input, textarea and select has a 1.24:1 border and 2.54:1 placeholder (WCAG 1.4.11/1.4.3), so fields are hard to find on every screen (P0, one token fix). (C1-06)
3. The Preview page frame is unlabelled and unbounded (second h1, 30-45 tab stops, no bypass): fails the `14` §4 'labelled preview frame' gate (P0). (C1-81)
4. Create Project step 1 errors are not announced, summarised or focused: an a11y gate failure on the first screen a manager meets (P0). (C1-59)
5. Activate is one unconfirmed click and the toast says 'complete and visible to visitors' while warnings stand; DRAFT items have no readiness panel (P1, all personas). (C1-29, C1-31)
6. Editors are 2.3-2.7k px tall scrolls with Save/Apply/readiness/Activate off-screen and the key fields (Placement) 1,700 px down (P1). (C1-22, C1-24)
7. A translator cannot see the default-language text beside the target and cannot list what is untranslated in any list or Media (P1). (C1-34, C1-35)
8. Focus drops to `<body>` after almost every state change and no route change is titled or announced (P1, keyboard and SR users). (C1-77, C1-76)
9. On tablets the nav never collapses, list actions are clipped, controls are far below 44 px and preview frames are scaled to unreadable (P1, kiosk persona). (C1-119, C1-120)
10. The six lists do not scale to 40+ items: no sticky header/sort/saved state/bulk, 5-6 Tab stops per row, no 'set position', one-step reorder; plus a 37-Project unsearchable picker (P1). (C1-13, C1-15)

## Clusters index

| Cluster | Highest severity | Consolidated IDs |
|---|---|---|
| 1. Design tokens, type scale and fonts | P1 | C1-01 - C1-05 (5) |
| 2. Contrast, focus rings and forced colours | P0 | C1-06 - C1-09 (4) |
| 3. Buttons and actions | P1 | C1-10 - C1-12 (3) |
| 4. Content list pattern (six kinds) | P1 | C1-13 - C1-21 (9) |
| 5. Editor structure, sticky actions and the Place/POI editors | P1 | C1-22 - C1-28 (7) |
| 6. Activation and readiness | P1 | C1-29 - C1-33 (5) |
| 7. Translation workflow | P1 | C1-34 - C1-40 (7) |
| 8. Dashboard and first run | P0 | C1-41 - C1-52 (12) |
| 9. Project picker, header and workspace chrome | P0 | C1-53 - C1-61 (9) |
| 10. Session, error and offline states | P1 | C1-62 - C1-68 (7) |
| 11. Dialogs, validation and conflicts | P1 | C1-69 - C1-75 (7) |
| 12. Focus management and announcements | P1 | C1-76 - C1-80 (5) |
| 13. Preview (page, new tab and 'Preview in app') | P0 | C1-81 - C1-90 (10) |
| 14. Triggers (How visitors reach it) | P1 | C1-91 - C1-92 (2) |
| 15. Maps and Floor plans | P1 | C1-93 - C1-100 (8) |
| 16. Route, Guide, Event and Category editors | P1 | C1-101 - C1-106 (6) |
| 17. Media (library, upload, Asset editor, picker) | P1 | C1-107 - C1-118 (12) |
| 18. Tablet layout, 200 % zoom and touch targets | P1 | C1-119 - C1-123 (5) |
| 19. Copy and vocabulary | P2 | C1-124 - C1-124 (1) |
| 20. Performance and loading states | P2 | C1-125 - C1-125 (1) |

## Findings by cluster

### 1. Design tokens, type scale and fonts

- **Severity (highest of members):** P1
- **Affected screens:** All screens (global)
- **Personas/agents that hit it:** design-system, s10-poi-place, s7-chrome
- **Consolidated recommendation:** Introduce the token layer first (rem type scale with a 12 px floor, sentence-case labels, one set of colour/status/radius/shadow/z-index tokens, a real icon set), then codemod the ~760 `text-[Npx]` and 40 hex literals; self-host Montserrat. This is `design-system/proposal.md` steps 1-5; every departure needs a `D-NNN` entry (BRIEF 'Visual design').
- **Likely files:** `tailwind.config.js`, `src/style.css`, `list-table.css`, `index.html`, `StatusChip.vue`, `lib/format.ts`, `TranslationDots.vue`, `TriggerChips.vue`, `WorkspaceNav.vue`, `AppToast.vue`, `Create*Dialog.vue`
- **Spec / constraint notes:** `14` §1/§4 (200 % text scaling). D-004 superseded by the BRIEF; D-053 (gradient) needs a successor entry. Font hosting vs BRIEF hard constraint 'CMS talks only to the authoring API and the IdP' (see Conflicts #11).
- **Effort:** M-L (mechanical)

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-01 | P1 | Type is set in px (rem scale absent), 61 % of text is under 12 px, uppercase-with-tracking is the default, micro-typography (9-11 px labels, 11 px text links) hurts scanning and 200 % text | ds-01, ds-02, ds-09, s7-16, s10-24 |
| C1-02 | P2 | Colour, spacing, radius, shadow, z-index live as call-site literals (40 hex literals, 15 radii, 21 shadows, arbitrary px spacing, duplicated `.field-input`/`.th/.td` CSS) | ds-10, ds-18, ds-19, ds-20 |
| C1-03 | P2 | Status chip roles and variants: DRAFT and ARCHIVED share one grey chip, 'pending' shares amber with warnings, four chip shapes/sizes (dot, glyph, none, pill) and mixed casing across header, picker, Home, lists | ds-11, s7-11 |
| C1-04 | P2 | Unicode glyphs used as icons (`+`, `⚠`, `✕`, `⠿`, `✎`...) with fallback-font misalignment; lucide installed but barely used | ds-15 |
| C1-05 | P1 | Google Fonts loaded at runtime (also Template fonts); breaks the 'only API and IdP' rule and offline use | ds-04 |

### 2. Contrast, focus rings and forced colours

- **Severity (highest of members):** P0
- **Affected screens:** Every screen with fields, chips, drag handles; Windows high-contrast users
- **Personas/agents that hit it:** design-system, p5-a11y
- **Consolidated recommendation:** One control-border token at >= 3:1 (`#737b8b` proposed, 4.26:1), placeholder >= 4.5:1, a 2 px offset focus ring on every control (fields included), no opacity-dimmed text (use outlined draft chips), link hover `#a3106a`, a `forced-colors` block (transparent 1 px border on every filled button/chip, Highlight underline on selected tabs), reduced-motion in the base layer.
- **Likely files:** `style.css` (`--input`, `.field-input`, focus rules, a:hover), `ui/input*`, `ui/textarea`, `ui/select`, `ui/button/index.ts`, `TriggerChips.vue`, `ReorderControls.vue`, `SectionTabs.vue`, `TranslationDots.vue`, `AppDialog.vue`
- **Spec / constraint notes:** BRIEF §2 gate (contrast 4.5:1 text / 3:1 UI), `14` §3 presentation. Needs `D-NNN` for new colour tokens.
- **Effort:** S-M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-06 | P0 | Form-field borders 1.24:1 and placeholders 2.54:1 fail WCAG 1.4.11/1.4.3 on every input; focus on fields is a 1 px recolour while buttons get a 2 px ring (three focus styles) | p5-01, ds-03, ds-16, p5-20 |
| C1-07 | P1 | Low-contrast chips and affordances: draft trigger chips 2.7-3.13:1 (axe serious), drag handle 2.54:1, tree connectors 1.47:1, disabled ▲▼, pink link hover 3.51:1 | p5-19, ds-06, ds-12, ds-13 |
| C1-08 | P1 | Forced colours: filled buttons (Save, Activate, Apply, Deactivate) lose their shape, selected language tab indistinguishable | p5-06, ds-05 |
| C1-09 | P2 | Reduced motion honoured in one component only; `skelpulse` and 42 transitions are unconditional (source evidence; p5 saw no running animation at the moment it measured) | ds-17 |

### 3. Buttons and actions

- **Severity (highest of members):** P1
- **Affected screens:** Lists, editors, dialogs, header
- **Personas/agents that hit it:** design-system, s10-poi-place, s11-editors
- **Consolidated recommendation:** One `Button` (cva) as the single source: 8 px radius, sentence case, 3 sizes, solid purple primary (no gradient CTA), consistent Deactivate/Archive treatment per context, disabled state with a visible reason. Lifecycle actions (Deactivate, Archive) move to an overflow menu in the editor; Save draft / Discard / Apply become real buttons in one group with explained disabled states.
- **Likely files:** `ui/button/index.ts`, `style.css` (`.dialog-primary/.dialog-secondary`), `EditorShell.vue`, `StatusChangeDialog.vue`, list views
- **Spec / constraint notes:** `12` §3 puts Apply in the header and Save draft/Discard in the Working Copy banner (see Conflicts #9). Gradient removal needs a `D-NNN`.
- **Effort:** M (L mechanical)

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-10 | P1 | Three button systems plus 66 hand-rolled pills; same verb looks different per screen ('Deactivate' grey in list, solid purple in editor); disabled states have no reason | ds-08 |
| C1-11 | P2 | Lifecycle actions outweigh editing actions: Deactivate styled primary, Archive large pill; where-used refusal arrives after the click although 'Used in' already knows; own triggers listed as blockers; copy 'Used by 1 route. Remove it from them' has no direct fix action | s10-10, s11-15, s11-24 |
| C1-12 | P2 | Save draft / Apply / Discard: three states, three styles, tiny text links in a banner; Apply enabled while the form is unsaved; Apply confirm lists nothing; stale 'different order' warning and no broken-link note after Apply | s10-09, s11-05 |

### 4. Content list pattern (six kinds)

- **Severity (highest of members):** P1
- **Affected screens:** Places, POIs, Routes, Guides, Events, Categories (+ Media list view)
- **Personas/agents that hit it:** p1-editor, p3-translator, p5-a11y, s13-media, s9-lists
- **Consolidated recommendation:** ONE `ContentTable` driven by per-kind column config (s9-lists 'Recommended list pattern'): sticky toolbar and header, sortable columns (Title, Status, Updated, Translations, Manual order), visible status segments with counts incl. Pending and Needs translation, one Tab stop per row with a kebab menu (Activate, Archive, Move up/down, Move to position...), whole-row open, query-string filters with scroll restore, bulk selection bar, tree disclosure for Places/Categories, one empty and one filtered-empty pattern with Clear buttons, ARCHIVED hidden from 'All'.
- **Likely files:** `src/views/workspace/*/*View.vue` (about 2,100 duplicated lines), new `ContentList.vue`, `ReorderControls.vue`, `useReorder.ts`, `ListFilterMenu.vue`, `FilterChoiceGroup.vue`, `listFilters.ts`, `StatusChangeDialog.vue`
- **Spec / constraint notes:** `12` §3 lists sort by `sortOrder` and filter by status/Category/featured/pending; extra sorts, bulk actions and a Translation filter are additive (spec-change-request candidates). `14` §4 requires move up/down AND set position. D-017 (reorder off while filtered), D-035.
- **Effort:** L

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-13 | P1 | No sticky header/toolbar, no sort, no pagination, 70-150 px rows (55 rows = 5,800 px), no 'Updated'/'edited by' handle: a daily editor cannot find 'what I edited yesterday' | s9-01, p1-03, p1-12 |
| C1-14 | P1 | 5-6 Tab stops per row (~330 to cross 55 POIs); misleading ▼ looks like a tree expander; no collapse for sub-places; only a 20 px title link opens the row; Categories rows truncate/wrap actions | s9-02, s9-08, s9-20, s9-23 |
| C1-15 | P1 | Reorder is one step at a time (53 clicks for a far move), no 'set position' or move to top/bottom, 24 px arrows, disabled whenever a search/filter is active | p1-02, s9-03, p5-15 |
| C1-16 | P1 | No selection or bulk Activate/Deactivate/Archive/Set Category | s9-04 |
| C1-17 | P1 | Filters, search and scroll are lost on reload and on Back from an editor; URL never changes | s9-07 |
| C1-18 | P2 | Filters and empty states: status is hidden in a popover, 'Pending changes' is a status radio, Search-in counted as a filter; filtered-empty is a dead end; empty list still shows toolbar and reorder hint | p1-13, s9-11, s9-12, s9-13 |
| C1-19 | P2 | ARCHIVED rows stay in the default list/library while the confirm/editor text says they leave it; draft-archive copy is wrong for drafts | s9-15, s13-18 |
| C1-20 | P2 | Per-kind drift: column names, chips, meta-line grammar, search width, status chips stacked in two lines, FEATURED duplicates, row heights jump 65-108 px | s9-10, s9-09 |
| C1-21 | P2 | Search clarity: a row matched through another language shows only the default title; placeholder does not say slug/code/trigger codes are searched; 'Search in' hidden in Filters | p3-07, s9-22 |

### 5. Editor structure, sticky actions and the Place/POI editors

- **Severity (highest of members):** P1
- **Affected screens:** Place, POI (and all Resource editors via `EditorShell`)
- **Personas/agents that hit it:** p1-editor, p4-kiosk, p6-edge, s10-poi-place, s11-editors
- **Consolidated recommendation:** Sticky action bar inside `<main>` (title, status chip, one state line 'Unsaved changes / Draft saved 12:41', readiness badge, Save draft / Discard / Apply or Save / Activate, overflow for Deactivate/Archive); left section rail with state badges and scroll-spy; reorder sections Texts, Placement/Place setup, Media (compact slots), How visitors reach it, Details (collapsed); sticky context column (readiness, translations, where used); reserve banner space so nothing shifts; Ctrl+S with a visible hint; save independent calls in parallel and say what was saved.
- **Likely files:** `EditorShell.vue`, `PageHead.vue`, `PoiEditorView.vue`, `PlaceEditorView.vue`, `MediaSlots.vue`, `TranslationsPanel.vue`, new `EditorSectionNav.vue`, `useResourceEditor.ts`, `AppToast.vue`
- **Spec / constraint notes:** `12` §3 'the header carries only Apply changes; Save draft and Discard sit in the Working Copy banner' and D-023 column arrangement: a sticky bar must keep Apply as the primary slot or record a spec-change-request/`D-NNN` (see Conflicts #9).
- **Effort:** M-L

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-22 | P1 | No persistent action bar or rail: editors are 2.3-2.7k px tall, Save/Apply/Discard/'Unsaved changes'/readiness/Activate scroll away (Save at y = -1,337 to -1,625); no accelerator; keyboard-less tablets lose the bar behind the on-screen keyboard | p1-04, s10-01, s11-02, p4-14 |
| C1-23 | P2 | Save is slow and sequential (9 requests, 2.5-3.1 s), partial saves are silent, no spinner/'still saving' after 3 s, Apply has no in-flight state, toast is the only (overlapping) confirmation | p1-06, s10-19, p6-12 |
| C1-24 | P1 | Section order buries the task (Placement 1,736 px down, empty media grid 440 px), no section index, fixed-height textareas clip long text | s10-02, s10-16 |
| C1-25 | P2 | Working Copy banner/chip insertion shifts the form ~90 px mid-typing; four overlapping 'pending' messages | p1-07, s10-08 |
| C1-26 | P2 | Header meta clutter: 'version 0' on unsaved records, chip drops to its own line, 90-character slug, version jumps by several, sub-title repeats name | s10-20, s11-22 |
| C1-27 | P3 | Archived editor: pencil icon on read-only banner, two Restore controls, disabled Save shown, disabled inputs at low contrast | s10-23 |
| C1-28 | P2 | Place/POI Placement ignores INDOOR Places (outdoor map, no floor-plan x/y), three sets of coordinates, no Indoors/Outdoors choice, no 'Inside this place' children card | s10-12, s10-13 |

### 6. Activation and readiness

- **Severity (highest of members):** P1
- **Affected screens:** All Resource lists and editors; Dashboard
- **Personas/agents that hit it:** p1-editor, p2-manager, s10-poi-place, s11-editors, s9-lists
- **Consolidated recommendation:** Activate always opens a confirm that names the item, lists blocking items (button disabled with reason) and warnings grouped by language with links, says what visitors will see; refusal stays on the list. Toast says 'Activated with 5 warnings' and never 'complete' unless warnings = 0. Readiness panel is shown on DRAFT as 'Before you activate' and recomputed after every save/activation. 'Save and activate' for a dirty draft.
- **Likely files:** `StatusChangeDialog.vue`, `EditorShell.vue`, `useResourceEditor.ts` (`requestTransition`), list `transition()` functions, `activationHandoff.ts`, `platform/readiness.ts`, `ResourcePickerDialog.vue`
- **Spec / constraint notes:** `12` §4 Activate a Resource (POST + 422 only: the pre-confirm is additive); `12` §5 readiness is the single source; `14` §4 readiness items are links. Backend: DRAFT readiness and Event-without-dates rule (GAP candidates).
- **Effort:** M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-29 | P1 | Activate is one unconfirmed click and the toast says 'complete and visible to visitors' while warnings are listed; side card reads 'nothing needs attention' until reload; lists behave differently per kind (Routes/Guides refused and the author is yanked off the list; an Event with no dates activates) | p1-01, p2-06, s10-03, s9-06, s11-20 |
| C1-30 | P2 | Activating a dirty draft is refused with 'Save first' instead of 'Save and activate' | p1-05 |
| C1-31 | P1 | 'What needs attention' exists only for ACTIVE records; a DRAFT shows no readiness and Placement/primary image are never flagged | s10-05 |
| C1-32 | P2 | Readiness text is generic, ungrouped and repeated per language/block ('(Italiano)' x5, 'Text is not translated' per paragraph); helper under Title is stale on ACTIVE | p1-08, s10-18, s11-07 |
| C1-33 | P2 | DRAFT assets/triggers can be attached to an ACTIVE item with no readiness warning; picker lists DRAFT images by default | p1-09 |

### 7. Translation workflow

- **Severity (highest of members):** P1
- **Affected screens:** All editors' language tabs, Translations card, lists, Media, Preview
- **Personas/agents that hit it:** p3-translator, p5-a11y, s10-poi-place, s11-editors, s13-media, s9-lists
- **Consolidated recommendation:** Non-default tabs show each field as a pair (read-only default-language text with Copy source + target); structural controls (reorder/add/remove blocks and stops) hidden in translation tabs; tabs get completeness marks and the real tab keyboard pattern; a 'Translation' filter group (language + missing/partial) and sort in every list and Media, counts in the footer; Translations card names missing fields with 'Next missing'; one language-aware date/number formatter; `lang` on tab labels and `<bdi>` for RTL names.
- **Likely files:** `TranslationsPanel.vue`, `StoryEditor.vue`, `EditorShell.vue`, `AssetEditorView.vue`, `ListFilterMenu.vue`, `SearchLanguageSelect.vue`, `MediaView.vue`, `TranslationDots.vue`, `lib/format.ts`, `platform/events.ts`
- **Spec / constraint notes:** `12` §2 Translator 'side-by-side with the default language'; `12` §3 Translation workspace (out of scope screen, but the pattern is in scope inside editors); `14` §4 text+icon state. A Translation filter in Content lists is not in `12` §3 filter set: additive.
- **Effort:** M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-34 | P1 | Translating hides the source: target tab shows empty fields with no default-language text, no Missing marker; Guide/Route/Asset translation tabs repeat the whole structural form (16 empty blocks, 48 buttons) so structure can be deleted/reordered per language | p3-01, s10-04, s13-02, p3-03, s11-01 |
| C1-35 | P1 | Nowhere to see 'what is left in Italian': no Translation filter/sort in any list, no translation state or missing-alt filter in Media, no Translations card on the Asset editor | p3-02, p3-08 |
| C1-36 | P2 | Translations card says 'Partial (3 of 5)' without naming the missing fields (hidden in collapsed Practical details), no 'Next missing', rows not marked as controls | p3-04 |
| C1-37 | P2 | Translation dots are 10-11 px glyph+code, grey ○ nearly invisible, no legend, stack vertically at 768, not links | p3-13, s9-17 |
| C1-38 | P2 | Language tabs are `role=tab` without roving tabindex/arrow keys, no completeness marks, per-language audio rows outside the language panel | p3-05, p5-07, s10-14 |
| C1-39 | P2 | Dates mix en-GB and en-US/12-hour in one row; native datetime-local; Event preview formats by language but list does not | p3-11, s11-08 |
| C1-40 | P2 | Greek tab labels upper-cased with wrong `lang` (ΕΛΛΗΝΙΚΆ); RTL display names not wrapped in `<bdi>`; `TranslationDots` hard-codes English words (RTL inferred, not observed) | p3-06, p3-12 |

### 8. Dashboard and first run

- **Severity (highest of members):** P0
- **Affected screens:** Dashboard (populated), Dashboard (empty/first-run), Create Project landing
- **Personas/agents that hit it:** p2-manager, s7-chrome, s8-dashboard
- **Consolidated recommendation:** Rebuild to `s8-dashboard` 'Recommended Dashboard': first-run guide for a Project without content (five steps, next highlighted, one button each, ticks from list totals incl. DRAFT); one status card with four states (not set up / nothing live / blockers / ready) and ONE primary action, 'Ready' only with at least one ACTIVE Resource; 'Waiting for you to apply' section; counts row; grouped warnings (collapsed); translation bars and packages when the backend exists; footer line with `contentRevision` and application status; metadata demoted to 'Project details'.
- **Likely files:** `DashboardView.vue` (extract `FirstRunGuide.vue`, `ReadinessGroups.vue`, `ContentCounts.vue`), `platform/readiness.ts` (`SENTENCES`), `PageHead.vue`, `CreateProjectView.vue` (landing)
- **Spec / constraint notes:** `12` §3 Dashboard (five-step guide, status card 'at most three items, one action', pending changes, packages with `stale`, counts, translation bars, `contentRevision`) and §4 First run: the running app implements 1 of 9 elements. D-022 under-delivers `12` §3 and needs a successor entry.
- **Effort:** M-L

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-41 | P0 | No five-step first-run guide on an empty Project; a created DRAFT Place and POI do not change the page | p2-01, s8-01 |
| C1-42 | P0 | Status card answers 'Ready for visitors' for an empty, DRAFT-only or uninitialized Project and offers no action; ACTIVE chip and 'application starts in DRAFT' toast contradict; right after Initialize the manager lands on this | p2-02, s8-02, s7-02 |
| C1-43 | P1 | Status card with blockers has no action button, blockers are small purple links in prose, left border is the only status mark; `contentRevision`/application status line missing | s8-08, s8-12 |
| C1-44 | P1 | 269-296 warnings in one flat 8,262 px list, one line per field per language with raw '(it)' codes, 296 tab stops, whole section `aria-live` | p2-03, s8-07 |
| C1-45 | P1 | No 'Waiting for you to apply': 10 Working Copies appear only as `PENDING_WORKING_COPY` lines inside the warnings | s8-03 |
| C1-46 | P1 | No content counts row; five metadata cards (slug, template, dates, organisation) take the prime slot and orphan-wrap at 1280/768 | p2-04, s8-04, s8-11 |
| C1-47 | P1 | No translation bars per language (needs statistics endpoint) | s8-05 |
| C1-48 | P2 | No latest-packages slot (no endpoint); spec says only after the first request | s8-06 |
| C1-49 | P1 | Dashboard error card keeps the green 'ready' border, no `requestId`, raw server `detail`, tiny Try again | s8-09 |
| C1-50 | P2 | Dashboard copy: 'does ... deserve' grammar, raw `(el)`, 'application'/'active content' jargon, organization/organisation mix | s8-13, s7-23 |
| C1-51 | P3 | Dashboard a11y details: content outside landmarks (axe region), whole section aria-live, 22 tabs before first content | s8-16 |
| C1-52 | P2 | `pending=true` is ignored for Assets (returns all 34): a pending count built on it would be wrong | s8-14 |

### 9. Project picker, header and workspace chrome

- **Severity (highest of members):** P0
- **Affected screens:** Home, header switcher popover, header, left nav, Create Project
- **Personas/agents that hit it:** p2-manager, p5-a11y, p6-edge, s7-chrome
- **Consolidated recommendation:** Picker and Home: search (autofocus), 'Recent' and 'Current' first, 'Needs setup (n)' collapsed, keyboard model, remember the last Project; one Project-status vocabulary (Application DRAFT/ACTIVE/ARCHIVED, labelled 'App:'); wire or remove Manage members/Help; close popovers before dialogs and put dialogs on one z-scale; one form-error pattern for Create Project; stepper with sticky footer and a real review step; nav counts and an info bar on pages whose capability is OFF.
- **Likely files:** `ProjectSwitcher.vue`, `HomeView.vue`, `AppHeader.vue`, `WorkspaceNav.vue`, `CreateProjectView.vue` (829 lines: split), `stores/projects.ts`, `AppDialog.vue`, `PageHead.vue`, `sections.ts`
- **Spec / constraint notes:** `12` §3 Project picker (search/scan-ability for 37+ Projects) and Create Project; `14` §4 for error summary. 'Sign-in lands on the picker every time' is spec'd behaviour? (see Spec section).
- **Effort:** M-L

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-53 | P1 | Picker and Home are unsearchable flat lists of 37-39 Projects (29-31 'Not initialized'); current Project not scrolled into view; 37 `GET /projects/{id}` per load; Home adds little over the picker | p2-07, s7-05, s7-17 |
| C1-54 | P1 | 'ACTIVE' means three things (Catalogue status chip, Application status, Resource status); green ACTIVE on a Project with no ACTIVE content; 'SETUP' vs 'Not initialized' | p2-05 |
| C1-55 | P1 | 'Manage members' and 'Help' are inert (`openManageMembers(){}`), styled as links | s7-06 |
| C1-56 | P1 | Switching Project with unsaved work: the popover stays open on top of 'Leave without saving?' and clips its text | p6-01, s7-04 |
| C1-57 | P2 | Switcher and user menu have no keyboard model (`role=menu` but no arrows, no `aria-haspopup`, Esc drops focus to body), list unnamed, no initial focus | p5-13, s7-10 |
| C1-58 | P2 | 'OFF' capability: aria-hidden grey pill, reason only in a `title`, page itself silent; nav has no counts/icons and Media is nested under Content | s7-09, s7-19 |
| C1-59 | P0 | Create Project step 1: errors not announced, no summary, focus stays on submit or drops to body; 422 ignores per-field errors; slug error for a field never seen | s7-01, p2-08 |
| C1-60 | P2 | Create Project structure and copy: no real stepper, 'Style confirmed' pseudo-button, one-line token summary, Initialize enabled with zero languages, 'Not initialized · Resume initialization' reads as status, defaults unexplained, 'Select a project' header | s7-15, p2-09 |
| C1-61 | P3 | Chrome nits: SSO splash bare, sign-in view has no help/dup brand line, skip-link/landmark details, Greek sort order, greeting/avatar mismatch, 'Organisation' placeholder, switch skeleton layout jump, small a11y/landmark leftovers, minor craft (units mix, faint Retry, 'their version') | s7-20, s7-21, s7-22, s7-24, p2-13, p5-21, p6-19 |

### 10. Session, error and offline states

- **Severity (highest of members):** P1
- **Affected screens:** Sign-in, session expiry, Project 403/404/5xx, record 403/404, offline banner, toasts
- **Personas/agents that hit it:** design-system, p4-kiosk, p6-edge, s13-media, s14-preview, s7-chrome, s9-lists
- **Consolidated recommendation:** One `StateCard` (icon, h1, cause, next step, request id with copy, primary+secondary action) for session/project/record/section errors; per-state `document.title`; map `status`+`code` to plain sentences (never developer text, `requestId` always shown); 403/404 on a save map to the same full-page states and keep the draft; a session-ended dialog with one capped redirect; offline banner only when `navigator.onLine` is false or two requests fail, with mutating controls `aria-disabled` and 'Back online' announcement; toasts: pause on hover/focus, errors persist, queue 3, no covering of cards.
- **Likely files:** `SessionErrorView.vue`, `ProjectLayout.vue`, `HomeView.vue`, `EditorShell.vue`, `platform/auth.ts` (flag only), `platform/api.ts` (message strings only), `stores/connection.ts`, `OfflineBanner.vue`, `AppToast.vue`, `stores/toast.ts`, `router.ts`
- **Spec / constraint notes:** `12` §6 states (404 -> Portal, 403 -> Catalogue no longer admits); BRIEF §2 problem details with `requestId`, rejected value never echoed (kept). WCAG 2.2.1 timing for toasts.
- **Effort:** M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-62 | P1 | No session-expired state: silent full-page redirect (7 navigations in 8 s on a persistent 401), no 'your edits are kept' message before or after sign-in | s7-03, p6-07 |
| C1-63 | P2 | Error pages use three layouts; stale header chip; 404 copy says removed from your list while picker still lists it; 403 copy ambiguous; record 404/403 dead ends with raw detail, no 'Back to ...'; Project 403 wrongly says only managers | s7-07, p6-14, s9-21 |
| C1-64 | P2 | Configuration/sign-in errors speak to operators ('Keycloak clients, mappers, `public/config.js`'); 'Try again' cannot fix them | s7-08 |
| C1-65 | P1 | A 403 or 404 on save is rendered as 'The X was not saved' + server detail, no cause, no action; the author retries forever | p6-02 |
| C1-66 | P2 | Error wording and requestId gaps: developer text ('check that it is running'), server `detail` verbatim, upload/library/preview/new-tab errors drop `requestId` or mis-diagnose (503 shown as 'platform not reachable') | p6-09, s13-11, p4-15, s14-13 |
| C1-67 | P2 | One aborted fetch flips the whole CMS to 'offline'; mutating controls (row actions, Upload, Replace) stay enabled offline; banner shifts layout, recovery not announced | p6-08, s9-14, s13-14, s7-18 |
| C1-68 | P2 | Toasts and banners: 6 s fixed (no pause), one at a time, each banner draws its own coloured stripe and hard-coded hex (one Alert + one Toast needed), polite live region even for errors, `✕` glyph, cover cards and list footer, hold durable instructions; static hints repeated six times | s7-14, s9-24, ds-14 |

### 11. Dialogs, validation and conflicts

- **Severity (highest of members):** P1
- **Affected screens:** Six create dialogs, editors' 422/409 handling, leave guard, confirm dialogs
- **Personas/agents that hit it:** p1-editor, p2-manager, p3-translator, p5-a11y, p6-edge, s10-poi-place, s11-editors, s12-maps, s13-media, s8-dashboard, s9-lists
- **Consolidated recommendation:** One create dialog: Title + the single kind-specific choice, slug under 'Edit address', shared error summary (`role=alert`, 'N things to fix', links) reused from the editors, no validation of an empty derived slug, 'Create and open'; one 422 path (`describePath` fallback to labels, `aria-describedby`, clear on input, focus first invalid field or the summary, in maps too, client-side range checks); 409: per-field dialog for Apply as well, nothing preselected, ordered stop lists; leave guard tells the truth ('stays in this browser as a draft'); sticky dialog footer at 200 %.
- **Likely files:** `src/views/workspace/*/Create*Dialog.vue`, `AppDialog.vue`, `ConfirmDialog.vue`, `lib/focus.ts`, `useResourceEditor.ts` (`describePath`, `showErrors`), `EditorShell.vue`, `GeoPicker.vue`, `MapEditorView.vue`, `FloorPlanEditorView.vue`
- **Spec / constraint notes:** `14` §4 (errors linked, announced, summarized with links), `12` §5 (draft in browser storage), `12` §3 (Apply 409 shows both versions).
- **Effort:** M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-69 | P1 | Create dialogs: errors neither summarised nor announced (`alerts: []`), focus stays on Create (Place), empty optional slug flagged on a blank form | p6-03, p5-12 |
| C1-70 | P2 | Create dialogs differ in shape (cards-first vs plain form), focus target, button labels, error style, Category/Level/slug/Code; Place Level question before title, Sub-place greyed with no reason; no Category in POI dialog; POI list-vs-editor behaviour disputed (see Conflicts #2) | s9-18, s11-11, s10-25, p2-10, s8-17, p1-18, p3-10 |
| C1-71 | P2 | 422 handling gaps: raw paths ('exhibitCode:', 'slug:') in summary, summary scrolled off, buttons not links, no `aria-describedby`, error persists after correction, focus not moved (Route distance, Map), end-before-start only on Save, duplicate label prefix | p5-11, p6-17, s10-22, s13-15, s11-10, p6-15, s11-09 |
| C1-72 | P1 | Coordinate fields: no client-side range check (123.4, 999 accepted); on the Map editor a non-number or decimal comma throws `Invalid LatLng (NaN)` then a Vue unmount error and the Save error says '-90 and 90' for 'abc' | p5-10, s12-01 |
| C1-73 | P2 | 409: Apply 409 shows a blunt two-button dialog (no per-field mine/current); collection rows (stops) not comparable, 'Mine' preselected so Enter overwrites a colleague, header keeps 'version 0' | p6-10, p6-11 |
| C1-74 | P2 | Leave guard says changes 'are lost' although they are kept as a draft; restore banner appears after a failed save in the same session and has day-only date and text-link buttons; Back changes the URL before the guard answers | p6-05, p6-06, s10-11, p6-18 |
| C1-75 | P2 | At 200 % zoom the create dialog scrolls internally and Cancel/Create are clipped | p6-16 |

### 12. Focus management and announcements

- **Severity (highest of members):** P1
- **Affected screens:** Every route change and state change; all editors, dialogs, picker
- **Personas/agents that hit it:** p1-editor, p5-a11y, p6-edge, s10-poi-place, s11-editors
- **Consolidated recommendation:** Router `afterEach`: set `document.title` ('<page> · <Project> · iGuide CMS'), move focus to the page h1 (not on same-page tab changes) and write '<page> loaded' to the polite region; a `restoreFocus` helper used after Save (keep the button enabled with `aria-disabled`), create, Place-on-plan, attach, dialog close, popover Esc, Project switch, Restore/Discard; announce search/filter result counts; fix Guide heading-level names; make only the editable map pin focusable; Ctrl+K quick switcher is an optional addition.
- **Likely files:** `router.ts`, `ProjectLayout.vue`, `PageHead.vue`, `lib/focus.ts`, `EditorShell.vue`, `ResourcePickerDialog.vue`, `ProjectSwitcher.vue`, `FloorPlanEditorView.vue`, `GeoPicker.vue`, `StoryEditor.vue`
- **Spec / constraint notes:** `14` §4 announcements; WCAG 2.4.2 (titles), 2.4.3 (focus order), 2.5.3 (label in name).
- **Effort:** S-M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-76 | P1 | No route announcement: `document.title` is 'iGuide CMS' everywhere, focus stays on the nav link or drops to body after opening an editor, nothing announced; no shortcuts or quick switcher | p5-03, p1-14 |
| C1-77 | P1 | Focus falls to `<body>` after almost every state change (Save, create, Place, attach, popover Esc, Project switch, failed save, dialog Esc, Restore/Discard, Leave) | p5-04, p6-04 |
| C1-78 | P2 | Search/filter results are not announced (55 -> 2 rows, polite region empty) | p5-17 |
| C1-79 | P2 | Guide heading-level buttons: `aria-label="Level 2"` vs visible 'H2' (axe serious x2 on every Guide heading block) | p5-18, s11-16 |
| C1-80 | P1 | POI/Place map adds 6-37 unnamed Tab stops (context markers `tabindex=0`), Save is 70 Shift+Tabs away, four audio 'Choose' buttons share one name, marker nudge not announced | p5-05, s10-15 |

### 13. Preview (page, new tab and 'Preview in app')

- **Severity (highest of members):** P0
- **Affected screens:** Preview page, Open in new tab, Preview in app panel
- **Personas/agents that hit it:** p3-translator, p4-kiosk, p5-a11y, s10-poi-place, s14-preview
- **Consolidated recommendation:** One shared `PreviewPane` for page, editors and new tab: labelled region (`aria-label="Preview: Kiosk, Ελληνικά, working content"`), stand-in headings demoted and inert until 'Interact', 'Skip preview' link; true device sizes with Fit/100 %/50 % and a stated scale, KIOSK portrait/landscape; Working Copies included in Working mode; surface-aware grouped Fire-trigger with a persistent 'Fired:' chip and Reset; in editors a docked split pane >= 1100 px (bottom sheet on tablets), live from the unsaved form; new tab with a slim control bar, real size, case-insensitive params and a per-state title; honest copy ('a stand-in ... drawn from your content').
- **Likely files:** `PreviewView.vue`, `AppPreviewView.vue`, `components/preview/DeviceFrame.vue`, `PreviewApp.vue`, `ResourceContent.vue`, `strings.ts`, `surfaces.ts`, `workspace/previewData.ts`, `ResourcePreview.vue`, `EditorShell.vue`, `AppDialog.vue`, `sections.ts`
- **Spec / constraint notes:** `14` §4 'labelled preview frame, CMS chrome operable while the frame has focus' (P0). `12` §3 Preview: preview view renders DRAFT Resources and Working Copies; 'Preview in app' opens 'below the action' (D-059 popover; a docked pane needs a spec-change-request/`D-NNN`). D-014/D-015 stand-in.
- **Effort:** M-L

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-81 | P0 | Preview page frame is unlabelled and unbounded: no region/role/label, a second h1 and five h2s plus a nested header in the CMS outline, 30-45 tab stops with no bypass | p5-02, s14-01 |
| C1-82 | P1 | 'Working content' ignores Working Copies: Preview page shows the old title/5 min where the editor card shows '(revised wording)'/7 min; status line still says 'drafts and active' | s14-02 |
| C1-83 | P1 | Frames are scaled, not real: WEB at 768 drawn at 0.37 (4-5 px text), KIOSK 0.44-0.59 (7-12 px), caption says '1080 wide' without scale; no Fit/100 % control; the editor card draws Web/Kiosk as the same <= 512 px layout | p4-04, s14-03, s14-06 |
| C1-84 | P1 | New tab does not use real surface size (KIOSK 1440 px wide), has no controls or title naming surface/language; invalid params silently fall back | s14-07 |
| C1-85 | P1 | Fire trigger ignores surface (beacon fires on KIOSK/WEB), stale notes survive surface/language/mode change, select resets so the fired trigger is unknown, 60+ char option labels, Live mode hides DRAFT triggers (23 -> 6) with no explanation | p4-07, s14-04, s14-12 |
| C1-86 | P1 | 'Preview in app' popover covers the field being edited (and at 768 the whole editor), is modal so CMS chrome is unreachable, opener sits ~3,400 px down at 768, `h1` leaks into the page, background not inert; Esc behaviour disputed (see Conflicts #1); opens on Mobile regardless of surface | p4-06, s14-05, p3-09, s10-07, p5-14, s14-10 |
| C1-87 | P2 | Page copy: subtitle 'The runtime rendered with your unpublished content' (not the runtime; 'unpublished' is banned-adjacent), disclaimer below the fold, Kiosk drawn in a browser chrome with fake dots | p4-08, s14-08 |
| C1-88 | P2 | Controls bar: wraps to 3-4 rows at tablet, unlabelled chip groups, native select without focus ring, `aria-pressed` here vs `role=tab` in the card, preview/trigger changes not announced | p4-09, s14-09, p5-08 |
| C1-89 | P2 | Stand-in chrome strings stay English under `lang=el` ('Visit 5 min', headings); 30 missing titles counted but not listed | s14-11 |
| C1-90 | P3 | Preview nits: `noopener` new tab each click, Open in new tab disabled without tooltip, 10 px caption, 1,167 px tall kiosk frame, bare new-tab 404, vague card copy, 18 nav stops before the first control | p4-16, s14-14 |

### 14. Triggers (How visitors reach it)

- **Severity (highest of members):** P1
- **Affected screens:** POI/Place/Route/Guide/Event editors (Triggers card)
- **Personas/agents that hit it:** p4-kiosk, s10-poi-place
- **Consolidated recommendation:** Always render the QR block (disabled frame + reason + 'Set the web address' link when no address; 'Test in preview' always); stack beacon UUID on its own row; real labels for Major, Minor, Radius, Wait; per-row 'Test in preview'; show 'Remove QR code' as a named button with confirm; one 'No QR image' warning per card.
- **Likely files:** `QrCodePreview.vue`, `TriggersCard.vue`, `TriggerChips.vue`
- **Spec / constraint notes:** `11` §9, D-039; `14` §4 visible labels.
- **Effort:** S-M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-91 | P1 | QR card shows no image/link/copy/download when the Project has no public web address (kiosk operator cannot print the QR; 'Test in preview' link not offered). Data-dependent: the Populated Project has since been given a WEB address and QR renders (see Conflicts #6) | p4-01 |
| C1-92 | P2 | Beacon UUID input runs under the 'major' label, inline labels without associated text, 11 px unnamed removal buttons, 'No QR image' repeated per row, permanent AR-target note | p4-10, s10-17 |

### 15. Maps and Floor plans

- **Severity (highest of members):** P1
- **Affected screens:** Maps list, New map dialog, Map editor, Floor plans list, New floor plan dialog, Floor plan editor
- **Personas/agents that hit it:** p4-kiosk, p5-a11y, s12-maps
- **Consolidated recommendation:** Map editor: map first (name and bounds adjacent), collapsible visitor filter, one set of zoom controls with 'Set as visitor start view', tile-error card with Retry, focusable bounds handles with arrow nudging and announcement, warning when placed items fall outside bounds. Floor plan: reserve space for the Working Copy banner, numbered pins, 'Place' arms a visible 'Tap the plan to place X' state with Cancel, new placements fan out instead of stacking at 0.5/0.5, search above Unplaced, per-item names and range validation on x/y, rotation explained. Tablet: map full width 360 px at <= 1100.
- **Likely files:** `MapEditorView.vue`, `maps/*`, `GeoPicker.vue`, `FloorPlanEditorView.vue`, `NewMapDialog`, `platform/maps.ts`, `map/basemap.ts`
- **Spec / constraint notes:** `14` §4 coordinate fields for every placement (all met); `12` §3 Maps & Floor plans. Tile/geocoder hosts vs 'only API and IdP' (Conflicts #11).
- **Effort:** M-L

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-93 | P1 | Tile hosts blocked: map is a blank grey box with no message, retry or fallback (also blank on first view with no loading indicator) | s12-02 |
| C1-94 | P1 | Bounds corner/centre handles (14 px) are not focusable and map markers do not move by keyboard | s12-03 |
| C1-95 | P1 | Placed POIs outside the bounds are clipped with no warning; Bounds fields sit about 1.5 screens below the map | s12-04 |
| C1-96 | P1 | Map editor layout: at 1024 map is ~326 px wide and starts below the fold, at 768 under five rows of chips; wrong page order (name last, filter chips above map), duplicate zoom controls | s12-05, p4-12, s12-12 |
| C1-97 | P1 | ACTIVE floor plan: Working Copy banner appears on the first pointer move and shifts the image 85-93 px mid-drag, pin ends clipped; pins show glyphs not numbers, inconsistent 26/37 px, 'Place' gives no feedback | s12-06, p4-13 |
| C1-98 | P2 | Floor plan placement: 63 identical 'Place' buttons, x/y labels, no range validation, 'Place' stacks every item at 0.5/0.5, rotation unexplained, Unplaced lists of 71-74 have no search; arrow nudge not announced | p5-09, s12-07, s12-08, s12-09 |
| C1-99 | P2 | Touch placement: copy says 'Click', 18 px pin, 310 x 260 map in a 350 px column, swipes pan instead of scroll, zoom 30 px; no 'Use my location' | p4-11 |
| C1-100 | P2 | Maps/Floor plans misc: purple route lines have no legend, New map dialog maps 429/others to 'check the connection' and shows raw OSM types ('HEATH'), floor plan list order per Place not shown, floor plan picker silently omits Places that already have a plan, tabs have no counts; two P3 items (s12-17/-18) whose text the saved report does not give | s12-11, s12-13, s12-14, s12-15, s12-16, s12-17, s12-18 |

### 16. Route, Guide, Event and Category editors

- **Severity (highest of members):** P1
- **Affected screens:** Route, Guide, Event, Category editors
- **Personas/agents that hit it:** s11-editors
- **Consolidated recommendation:** Confirm-or-Undo for every remove (stop, block, occurrence) with a live-region message and focus to the next row; Event occurrences stack as cards at narrow widths; searchable pickers for Place/POI/Route (multi-select for Route stops, status/Place filters); Category icon grid as a labelled radio group with arrow keys; resolve Guide/Category parity (How visitors reach it, Preview in app) by decision.
- **Likely files:** `RouteEditorView.vue`, `StoryEditor.vue`, `EventEditorView.vue`, `CategoryEditorView.vue`, `ResourcePickerDialog.vue`
- **Spec / constraint notes:** `12` §3 common-to-every-kind cards (Guide has no triggers card, Category no preview): needs a decision/QUESTIONS.md. D-029, D-063, D-065. `14` §4 (1.4.10 reflow at 200 %).
- **Effort:** M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-101 | P1 | Removing a stop, block or occurrence is instant: no confirm, no undo, no announcement, focus drops to body, ✕ sits beside the move arrows | s11-04 |
| C1-102 | P1 | Event occurrence row loses the Cancelled toggle and Remove button at 200 % zoom (WCAG 1.4.10) | s11-03 |
| C1-103 | P2 | Event Place/POI/Route are native selects with 60+ options and no search; Route POI picker closes after each pick (6 round trips), no filter, DRAFT POIs selectable | s11-13, s11-14 |
| C1-104 | P2 | Category icon grid: 20 `aria-pressed` buttons without group label or arrow keys (20 tab stops), border-only selected state | s11-12 |
| C1-105 | P2 | Guide has no 'How visitors reach it' card and Category no 'Preview in app' although `12` §3 says common to every kind | s11-18 |
| C1-106 | P3 | Minor: new Route shows blocking and warning at once, Route map pins overlap and map not sticky, 'Repeat weekly' has no count/end date, Guide paragraphs are plain textareas with separate image blocks (spec says inline; check D-065) | s11-19, s11-21, s11-23, s11-25 |

### 17. Media (library, upload, Asset editor, picker)

- **Severity (highest of members):** P1
- **Affected screens:** Media library, Upload dialog, Asset editor, Asset picker
- **Personas/agents that hit it:** p1-editor, p5-a11y, p6-edge, s13-media
- **Consolidated recommendation:** Asset editor two-column: sticky preview (<= 40 vh) + status, Translations first (alt text beside the image, decorative checkbox above it); library with sort and 'Needs attention' filters (no alt text, missing translation in X, unused, decorative), compact type icons and aspect-correct thumbnails, always-visible count, focus management on paging; upload: accepted formats listed, duplicate detection, queued live-region log with a final summary, rows link to the asset and a 'Describe now' batch stepper; picker: focus Search, taller dialog, two-line titles, default to ACTIVE, list mode for audio, auto-select the single uploaded file.
- **Likely files:** `AssetEditorView.vue`, `MediaView.vue`, `AssetThumb.vue`, `UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `useAssetUpload.ts`, `ResourcePickerDialog.vue`/`AssetPickerDialog.vue`, `platform/assets.ts`, `styles/list-table.css`
- **Spec / constraint notes:** `12` Media library and Asset detail (translations of title, caption, alt, credits, transcript), `14` §2 alternative text, `14` §4 live-region announcements for uploads. D-032 (Replace only DRAFT).
- **Effort:** M-L

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-107 | P1 | Alt-text field is below the fold on every viewport (y 841-1152) and the preview scrolls away while typing | s13-01 |
| C1-108 | P1 | Library cannot find the work: no sort, no 'missing alt text / untranslated / unused / decorative' filters; default order unlabelled; ragged cards | s13-03, p1-15 |
| C1-109 | P1 | 'Used in' count in the library (3) disagrees with the editor (4) | s13-04 |
| C1-110 | P1 | Every uploaded image becomes DRAFT with no alt text and there is no batch way to describe them; result rows are plain text, dialog has no close X | s13-05 |
| C1-111 | P2 | Thumbnails crop (120 px `object-cover`), non-image types shown as a 9 px text label (clipped 'OCUMEN' in list), ragged grid, 9 px chips | s13-06, s13-07, s13-08 |
| C1-112 | P2 | Paging drops focus to body and shows the range only below the list (24 per page although 200 are in memory) | s13-09 |
| C1-113 | P2 | Upload accepts any file type (.exe, .txt into the visitor library), accepted formats not listed, failed rows pile up on retry, Retry shown when it cannot help, no `requestId` | s13-10, p6-13 |
| C1-114 | P2 | Upload live region is one overwritten string: only the last message survives, no start/queue/summary announcement | s13-12 |
| C1-115 | P2 | No duplicate detection; copies are indistinguishable in the picker (truncated names) | s13-13 |
| C1-116 | P2 | Asset editor details: decorative flag hidden at the bottom with no visible effect and no library marker; audio/video/PDF previews give no filename, size, duration or transcript status; duplicate 'Nothing needs attention' line; version 0 subtitle, checksum without copy, wrong-type Replace row label | s13-16, s13-17, s13-22, p1-16 |
| C1-117 | P2 | Asset picker: initial focus on 'Any' not Search, 2.5 rows visible, truncated names, audio tiles blank (no play/language), no list mode, 'Use this image' after all tiles, attach not announced, new upload not auto-selected, no 'no alt text' cue until selected | p1-10, s13-19, p5-16 |
| C1-118 | P2 | Picker and library at zoom200/768: picker 295 px high shows only the filter rail; list table min-width 720 forces horizontal scroll | s13-20 |

### 18. Tablet layout, 200 % zoom and touch targets

- **Severity (highest of members):** P1
- **Affected screens:** Every screen at 1024, 768 and zoom200; kiosk and on-site authors
- **Personas/agents that hit it:** design-system, p1-editor, p2-manager, p4-kiosk, p5-a11y, s10-poi-place, s11-editors, s12-maps, s7-chrome, s8-dashboard, s9-lists
- **Consolidated recommendation:** Collapse the left nav to an icon rail/drawer below 1100 px (the 'Menu' button already exists at zoom200); one-row header at <= 768 (switcher inside the menu, Manage members/Help in the user menu, bundled logo linked to Home); editors keep two columns only >= 1180 px and show readiness/status as a compact bar under the sticky header; lists as cards below 900 px with a 48 px kebab; global `@media (pointer: coarse)` 44 px minimum (padding, not font size), 32 px minimum on desktop rows, larger Leaflet controls and pin hit areas.
- **Likely files:** `ProjectLayout.vue`, `WorkspaceNav.vue`, `AppHeader.vue`, `EditorShell.vue`, list views, `ui/button`, chips, `style.css`, `ReorderControls.vue`, Leaflet picker components
- **Spec / constraint notes:** PRODUCT.md 'tablets must remain fully usable'; `14` §4 200 % text scaling; WCAG 2.5.8 (2.2 AA) is not in the 2.1 gate but is P1 by the kiosk persona's rule (p4-05); WCAG 1.4.10 reflow.
- **Effort:** M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-119 | P1 | Left nav (236 px) never collapses at 1024/768: ~500-530 px of content, header wraps to two rows | p4-02, s11-17 |
| C1-120 | P1 | Lists at 768: table wider than its card (560 in 474), Actions column clipped without scroll hint ('DEA'), dots wrap to three lines, rows 147-207 px | p4-03, s9-05 |
| C1-121 | P1 | Editors at 1024/768: side column falls 3,300+ px down, Activate/readiness/Translations unreachable, form column ~330 px wide at 1024 (Title clipped) | s10-06 |
| C1-122 | P2 | Header + switcher + Menu consume 235-315 of 360 px at zoom200 and 118 px at 768; fixed chrome leaves ~50 px of content | p1-17, p2-12, s7-13, s8-15, s9-19, s10-21 |
| C1-123 | P1 | Touch/click targets: 930 controls under 24x24; most CMS controls < 44 px (lists 16-30 px, Move 24 px, Archive 52x16, 'Choose' 43x16, checkboxes 13 px, Leaflet 29-30 px, pins 18-26 px, map text 9-11 px) | p4-05, ds-07, p5-22, s9-16, s11-06, s12-10 |

### 19. Copy and vocabulary

- **Severity (highest of members):** P2
- **Affected screens:** All screens
- **Personas/agents that hit it:** p2-manager
- **Consolidated recommendation:** One glossary pass: lifecycle words (DRAFT/ACTIVE/ARCHIVED, never 'published'), Working Copy/pending changes, readiness ('Ready', 'What needs attention', 'Warnings' -> one name), Application/Surface/Template/Slug/Trigger/Geo-proximity/Beacon/AR scan target explained once via a small 'What is this?' pattern; replace 'initialization' with plain language; name organisations consistently.
- **Likely files:** `sections.ts`, `lib/format.ts`, `StatusChip.vue`, `CreateProjectView.vue`, field help text across editors
- **Spec / constraint notes:** BRIEF §2 lifecycle vocabulary (hard constraint); `14` content guidelines.
- **Effort:** S-M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-124 | P2 | Jargon inventory: Readiness has three names, ACTIVE/SETUP/DRAFT chips unexplained, 'Application' undefined, Template irreversibility unstated, slug explained only inside editors, 'Exhibit code', 'Internal name', 'version 0', Geo-proximity/Beacon/AR unexplained | p2-11 |

### 20. Performance and loading states

- **Severity (highest of members):** P2
- **Affected screens:** POI list, Media, Dashboard, workspace shell
- **Personas/agents that hit it:** p1-editor, s13-media, s7-chrome, s8-dashboard
- **Consolidated recommendation:** Stale-while-revalidate list cache, incremental/virtual rows, hide counts until loaded; render the nav and the page's own skeleton as soon as the route has a `projectId`; stop the N+1 `GET /projects/{id}` (backend `initialized` on the list); thumbnails from renditions.
- **Likely files:** `ProjectLayout.vue`, `stores/projects.ts`, list views, `MediaView.vue`, `DashboardView.vue`, `AssetThumb.vue`
- **Spec / constraint notes:** `12` §6 skeletons in place of lists, never blocking spinner. Dev-server timings; production not measured.
- **Effort:** M

| ID | Sev | Finding | Original IDs |
|---|---|---|---|
| C1-125 | P2 | Slow cold loads and skeleton flashes: POI list 3.7 s cold, Media 4-6.6 s, workspace skeleton without nav (236 px jump, 'Loading projects...' header for seconds), 'Organisation' placeholder rendered as data, '0 points of interest' flash, N+1 project fetches, jank when scrolling 54 rows | p1-11, s13-21, s7-12, s8-10 |

Original ID prefixes: p1 = p1-editor, p2 = p2-manager, p3 = p3-translator, p4 = p4-kiosk, p5 = p5-a11y, p6 = p6-edge, s7 = s7-chrome, s8 = s8-dashboard, s9 = s9-lists, s10 = s10-poi-place, s11 = s11-editors, s12 = s12-maps, s13 = s13-media, s14 = s14-preview, ds = design-system (`R1-ds-nn`). A number is the report's own finding number.

## Conflicts between agents

Evidence strength is stated for each. None required reopening a screenshot; where a conflict is not resolvable from the reports it is marked **unresolved** and carried into the Round 2 re-test list.

**1. 'Preview in app' popover and Esc.** p4-kiosk (-06: 'press Esc: popover stays', log 'after esc, popover visible: true', touch emulation at 1440/1024x400/768x600) and p3-translator (-09: 'Pressing Escape with the panel open left it open (observed once)') versus s14-preview (-10: Esc closes from tab, tabpanel and after clicking inside, focus returns to the button, at all four viewports, scripted `c1.mjs`), s10-poi-place (-07: 'persona "ignores Esc" is not reproducible when focus is inside; click outside already closes'), p5-a11y (-14 'what works': Esc and Close return to the trigger) and s11-editors (Esc restores focus on Guide). **Stronger evidence: not-reproduced** (four scripted runs, three viewports each, versus one touch-emulated run and a single 'observed once'). Likely cause: in p4's touch run focus was not inside the dialog when Esc was sent. Treat 'Esc ignored' as unconfirmed; what all agents agree on is that the card covers the form, is modal and unreachable-chrome (see C1-86). **Round 2 re-test:** Esc on touch emulation at 768x600. The consolidated finding is P1 for the covering/placement problem, not for Esc.

**2. POI create dialog: opens the editor or stays on the list.** p3-translator (-10) says POI create keeps the user on the list with a toast while Route/Guide/Event/Category open their editor. s9-lists (-18e: 'the earlier-persona note that POIs differ was not reproduced': all six open the editor), p1-editor ('Create -> editor takes 1.4 s'), s10-poi-place (create then editor) and p2-manager (first POI then editor) agree. **Stronger evidence: opens the editor** (four reports, one with a six-kind sweep). p3-10 is kept as a member of C1-70 but should not be read as a confirmed inconsistency; the p3 run likely happened while the list route was cached.

**3. QR image missing vs QR renders.** p4-kiosk (-01, P1) saw no QR image, link, copy or download on seeded POIs because the Project had no public web address; s10-poi-place ('what works': 'QR renders with link/Copy/Download/Open') and s10-17 saw a rendering QR. AUDIT-BRIEF update: 'The Populated Project now has a WEB public base URL, so QR codes render.' **Resolved by data, not by disagreement.** p4-01 remains valid for any Project without an address (the card gives no 'Test in preview' and no disabled placeholder), so it is kept as C1-91 at the severity p4 gave it (P1); for the seeded Project, which now has an address, a P2 reading is defensible. The Round 2 check must cover both states.

**4. Severity of the Dashboard first-run guide and false 'Ready'.** p2-manager rates both P0 (-01, -02); s8-dashboard rates the same two P1 (-01, -02) and s7-chrome rates the landing P1 (-02). All agree on the facts. I kept **P0** (highest member) because the guide is a spec requirement (`12` §3, §4), the headline product success criterion ('empty Project to a guide without training') fails, and the wrong answer is asserted, not just missing. If the owner prefers the s8 reading, C1-41 and C1-42 drop to P1 and the Dashboard cap moves from 60 to 85.

**5. Form-field borders: P0 or P1.** p5-a11y -01 is P0 (BRIEF §2 gate: 3:1 UI contrast); design-system ds-03 rates the same measurement P1. Measurement is identical (1.24:1 on 188 inputs). Kept **P0** (C1-06); it caps every screen with a text field at 60, which is why most Round 0 baselines in the scoreboard sit at 60.

**6. Reorder: 'set position' missing is P1 or P2 or a gate failure.** p1-02 and s9-03 rate it P1, p5-15 P2; p1-02 notes it is P0 'on a strict reading' of BRIEF §2 and `14` §4 ('every reorder interaction has move up, move down and set position'). Route stops and Guide blocks have it, lists do not. Kept **P1** (C1-15) as the majority and because `14` §4 does not name the lists, but flagged: if the owner reads the gate strictly this is a sixth P0 and caps all six list screens at 60 (already 60 through C1-06).

**7. Create Project validation: P0 or P2.** s7-chrome -01 P0 (gate: 'errors linked, announced, summarized with links' and focus does not move; `[role=alert]` count 0) versus p2-manager -08 P2 (same facts as a UX friction). Kept **P0** (C1-59); the facts are identical, only the framing differs.

**8. Toast duration.** s7-chrome (-14) states 6 s auto-dismiss from source and screenshots; p5-a11y 'toast was visible ~2 s in screenshots; my timing probe was unreliable'; p2-manager says 'disappears in about 6 s'. **Stronger: 6 s** (two reports plus source). WCAG 2.2.1 risk stands (C1-68).

**9. Sticky action bar vs `12` §3 button placement.** p1-04, s10-01/-09, s11-02 and p4-14 all recommend a sticky bar with Save draft / Discard / Apply as real buttons. `12` §3 (per s10) says 'the header carries only Apply changes; Save draft and Discard sit in the Working Copy banner'. s10-01 says a sticky bar must keep that split or record a `D-NNN`. **Not a factual conflict but a spec tension:** the bar can keep Apply in the primary slot and mirror, not move, the banner actions; if the owner wants them to live only in the bar, raise a spec-change-request (listed below).

**10. Animations / reduced motion.** p5-a11y: `document.getAnimations()` empty in both modes, 'nothing to reduce; pass'. design-system ds-17: `skelpulse` and 42 transitions run unconditionally; reduced motion honoured only in `AppDialog.vue:191` (source). Both can be true (p5 measured when no skeleton was on screen). **Stronger: ds-17** (source-level and covers the skeleton state); verify with a skeleton on screen in Round 2 (C1-09).

**11. Hard constraint 'only API and IdP' vs map tiles and geocoder.** design-system ds-04 flags Google Fonts (clear violation, fixable) and also OSM tiles (`map/basemap.ts:22`) and Nominatim (`platform/maps.ts:235`). The BRIEF scope lists 'New map dialog (geocoding search)' and a Leaflet map, which cannot work without a tile source and geocoder; s12-02 shows what happens when the tile host is blocked. **Unresolved for the owner:** fonts are fixable (C1-05); tiles/geocoder need an explicit statement (backend proxy = GAP, or an accepted exception recorded in DECISIONS.md).

**12. Counts that drift between reports (not a conflict of judgement).** Warnings on the populated Dashboard: p2 269, then 276, s8 296; Project count 37 (p2) vs 39 (s7); POI count 54-55-65; assets 34 vs 37. Other agents added records during the round. Findings do not depend on the exact numbers.

**13. Manage members / Help.** s7-chrome -06 shows both handlers are empty functions (source) and no navigation/dialog occurs; p2-manager only noted they are `<button>`s and did not open them ('targets not opened'). No contradiction; **s7 evidence stands** (C1-55).

**14. Picker/library 'Used in' count.** Only s13-media measured it (card 3, editor 4). p1-editor saw 'Used in 1' on audio tiles without comparing. Single-source evidence; kept P1 but needs a Round 2 check on a second asset (C1-109).

Conflicts recorded: **14** (of which unresolved: #11; Esc #1 and used-in #14 need a Round 2 re-test; #3 and #12 are data effects).

## Items that need the backend (GAPS.md candidates) - not UI fixes

- `GET /projects/{id}/statistics` (404 today): per-kind totals, ACTIVE totals and per-language translation completeness over ACTIVE Resources. Until then the UI may use list `totalElements` with `status`/`pending` filters for counts but must not approximate translation bars. _Affects:_ C1-46, C1-47, C1-35. _From:_ s8-04/-05.
- Deployment Package list endpoint with status, `stale`, `contentRevision`, `createdAt` (404 today); ICAgent ingestion status (Milestone 12). _Affects:_ C1-48. _From:_ s8-06.
- `workingCopyUpdatedBy` (last editor) on list rows; today only time (`workingCopyUpdatedAt`) exists. Needed for 'Waiting for you to apply' and 'edited by me'. _Affects:_ C1-45, C1-13. _From:_ s8-03, p1-03.
- Readiness: expose `activeResourceCount` (or an `empty` flag) so 'Ready' is not asserted for a Project without ACTIVE content (UI can use `status=ACTIVE` totals meanwhile). _Affects:_ C1-42. _From:_ s8-02.
- Readiness for DRAFT Resources (a 'before you activate' endpoint) and codes for missing Place/Category/coordinates/primary image (the report says Placement and media are never flagged even on ACTIVE). _Affects:_ C1-31. _From:_ s10-05.
- `pending=true` on `GET /assets` is ignored and returns all 34; reject or ignore explicitly. _Affects:_ C1-52. _From:_ s8-14.
- Project list should carry `initialized` (the picker issues one `GET /projects/{id}` per Project, 37 requests per load). _Affects:_ C1-53, C1-125. _From:_ p2-07, s8-10.
- Asset `usageCount` disagrees with the references list (3 vs 4; inline Guide bindings not counted). _Affects:_ C1-109. _From:_ s13-04.
- Thumbnail renditions for the library grid (thumbnails are presigned `/original`, up to 1.5 MB each). _Affects:_ C1-111, C1-125. _From:_ s13-06, s13-21.
- Asset upload type allow-list / policy for `OTHER` (an `.exe` and a `.txt` were accepted); also a decision whether the UI should warn or block. _Affects:_ C1-113. _From:_ s13-10, p6-13.
- Event activation with zero dates succeeds (backend rule question: dates required?). _Affects:_ C1-29. _From:_ s9-06.
- Preview data: Working Copy rows (or `pendingChanges`) for Working mode; if the list endpoints do not return them the Preview page cannot show pending edits. _Affects:_ C1-82. _From:_ s14-02.
- Version author/time in 409 `currentVersion` bodies for the conflict dialog, if the API has it; Apply 409 `conflictingFields` shape. _Affects:_ C1-73. _From:_ p6-10, p6-11.
- Video/audio duration when the API returns none; transcript status in asset rows. _Affects:_ C1-116. _From:_ s13-17.
- Tile and geocoder sources for maps (hosted by the platform or a proxy) if 'only API and IdP' is to be honoured. _Affects:_ C1-93, C1-100. _From:_ ds-04, s12-02.

Backend candidates: **15**.

## Items that need a spec change (spec-change-request candidates) - not UI fixes

The specs folder is read-only; each goes to `QUESTIONS.md` as `spec-change-request` before anything is built. Items marked (D) are DECISIONS.md-level rather than spec-level.

- 'Preview in app' as a docked split pane (and bottom sheet on tablets) instead of a card 'below the action' (`12` §3; D-059 popover). (D) plus spec. _Affects:_ C1-86.
- Sticky action bar that carries Save draft / Discard next to Apply (`12` §3 splits header and banner). _Affects:_ C1-22, C1-12.
- Translation filter (language + missing/partial) and a Translations column sort in Content lists and Media (`12` §3 lists filters status/Category/featured/pending and sort by `sortOrder`). _Affects:_ C1-35, C1-13.
- Bulk selection and bulk lifecycle actions in lists (not in `12` §3). _Affects:_ C1-16.
- Default list behaviour for ARCHIVED rows (hidden from 'All' vs shown): the confirm text promises 'leaves the default lists'; `12` §3 status filter is silent. _Affects:_ C1-19.
- Place creation: spec `12` §3 asks for INDOOR/OUTDOOR first, then top-level/sub-place; the build offers only Level and infers environment from Type. Confirm which is canonical. _Affects:_ C1-28, C1-70.
- Guide 'How visitors reach it' card and Category 'Preview in app' (`12` §3 says common to every kind; Guide has no triggers card, Category no preview). _Affects:_ C1-105.
- Guide story: paragraphs as rich text with inline images (spec) vs plain textareas and separate image blocks (check D-065). _Affects:_ C1-106.
- Return to the last Project after sign-in (today sign-in always lands on the picker); 'Recent' grouping on Home. _Affects:_ C1-53.
- Dashboard: 'Ready' semantics ('ready for a package' vs 'nothing blocks live') and what 'Ready' requires (>= 1 ACTIVE Resource); D-022 successor entry. _Affects:_ C1-42, C1-43.
- Left-nav structure: spec lists Media as a top-level item, the build nests it under Content (conformity question, also touches the Content-only scope rule). _Affects:_ C1-58.
- Is `OTHER` an allowed asset type in the visitor-facing library? (QUESTIONS.md per s13-10.) _Affects:_ C1-113.
- Hard-constraint wording: map tiles/geocoder vs 'only the authoring API and the IdP'. _Affects:_ C1-93.

Spec-change candidates: **13**. Design-direction departures that need a `D-NNN` (not spec): type scale in rem with 12 px floor, sentence-case buttons, gradient CTA removal, control-border/placeholder/hover colours, self-hosted Montserrat (6 departures in `proposal.md` §0), sticky bar, docked preview, list pattern, Dashboard rebuild.

## Data-dependent notes

- **Empty Projects got content from agents.** `UX Audit – Empty` holds `UX-p2-manager` records; p2 and s8 also created a DRAFT Place and POI in it (s8: Empty B). s9 had to mock the empty Places/POIs responses. The first-run guide could never be observed (it does not exist); Round 2 needs a freshly created, never-touched Project to verify guide progress. s7 created `UX-s7-chrome Project` and p2 `UX-p2-manager Trail`.
- **Seeded triggers are DRAFT.** In Live mode the Fire-trigger select says 'No triggers' (23 in Working vs 6 in Live), so Live-mode firing was only partly testable (C1-85).
- **QR rendering depends on the public web address.** p4 ran before the Populated Project had a WEB address (no QR); later agents saw QR render. Test both states.
- **Italian is enabled but untranslated** on all 85 seeded Content rows and all Media; Greek is complete on pre-existing rows. This is what made the translator's worklist problem visible; with a fully translated Project it would not show.
- **No RTL language exists in the Populated Project;** RTL findings are inferred from source (C1-40).
- **Picker scale is inflated by test data:** 37-39 Projects, 29-31 'Not initialized' leftovers from audit runs. The need for search/grouping stands, the magnitude does not.
- **Warnings count (269-296)** includes 232 `MISSING_TRANSLATION` lines; it will change as agents add records.
- **Cold-load times are dev-server numbers** (POI list 3.7 s, Media 4-6.6 s, one 13 s on a busy shared server); production not measured (C1-125).
- **Forced states, not real ones:** 401/403/404/409/422/5xx and offline were forced with `page.route`/`setOffline`; a real Apply 409, real 5xx bodies, a real expired Keycloak session and the 'not configured' error were not observed.
- **Seeded 'Used in' counts and duplicates:** s13 and p6 created duplicate/`.exe` assets, several 'dup' records and ARCHIVED rows; the 8 POIs + 1 Route + 1 Guide with Working Copies are seed data.
- **Records left behind** (not deleted by rule): all `UX-<agent> ...` records in Populated and Empty Projects; some are ACTIVE/ARCHIVED or hold stale browser drafts. They add rows to lists and warnings.
- **Curator vs admin:** the curator can open Create Project (not enforced by the UI; the Catalogue decides) and its Dashboard shows 'Organisation' where admin shows 'Test Museum'.
- **Scoring of lists:** only s9-lists scored the six lists as a family; per-kind scores in the scoreboard are therefore equal by construction until Round 2 separates them.

## Not verified in Round 1 (carry into Round 2)

- Real screen-reader output (all reports); touch drag of lists/pins/bounds; drag auto-scroll; forced-colors beyond lists/POI editor; dark mode (none exists).
- Esc on 'Preview in app' under touch emulation (Conflict #1); 'Used in' count on a second asset (#14); whether readiness items are links on every kind; Route stop translations; Event translation tab; Place/Map editors translations; ACTIVE translation through Working Copy.
- Loading skeletons (Library, Preview) were never captured; empty states for Places/POIs were mocked; asset Replace; 3D assets; Floor plan 'Place' then tap flow saved; indoor Route; Route with 20+ stops.
- `s12-maps` P3 items (-17, -18) and the exact numbering of its P2 items.
