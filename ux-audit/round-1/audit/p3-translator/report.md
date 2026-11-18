# p3-translator — Round 1

Interview steps of the impeccable skill skipped (subagent; the brief answers them). Mode: Operate. Persona: Translator (`curator`), Project `UX Audit – Populated` (en default, el, it). Viewports 1440, 1024, zoom200 (Greek long text). Records created: `UX-p3-translator …` POI ("Ακρόπολη" typed by mistake into the English title), Route, Guide, Event, Category (named "categorie", my typo), Asset `UX-p3-translator-image.png`. All translated to el + it and saved. Nothing pre-existing was edited.

## Verdict
A translator can write in Greek and Italian without trouble, but cannot find the work or see what to translate. The editor shows an empty target field with no default-language text beside it (P1), and no list can be filtered or sorted by missing language (P1), so the Italian worklist (85 of 85 Content rows incomplete, plus all Media) is built by eye across six lists. Search is accent-insensitive and language-aware (good), but results do not say why they matched. RTL is handled by source (`dir` per language) but is unobservable in this Project; findings on it are marked inferred.
Score range for the group: 55–72 (capped 85 by open P1s; effectively lower).

## Context check
- `12` §2: the Translator "needs a per-language view of everything untranslated, side-by-side with the default language" (lines 41–43); §3 Translation workspace shows default left, target right, with "next missing".
- `14` §4: status and translation state by text and icon, never colour alone; `14` line 60: every enabled language has `direction` so the runtime sets `dir`.
- `03` §1: lifecycle `DRAFT` → `ACTIVE` → `ARCHIVED`; an ACTIVE Resource's translations save to its Working Copy.
- DECISIONS.md D-042: `TranslationDots` shows ✓ / ◐ / ○ beside each language code (observed in lists, matches).
- PRODUCT.md: Translator "works per language across the whole Project … needs to find untranslated work and see the default-language text beside the target".

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| Editor language tabs + text panel (POI, Route, Event, Category) | 12 | 15 | 11 | 11 | 9 | 7 | 65 (cap 85) |
| Guide editor, Greek/Italian story | 9 | 14 | 10 | 10 | 9 | 6 | 58 |
| Translations card (editor right rail) | 13 | 14 | 11 | 10 | 10 | 6 | 64 |
| Lists: translation dots + search-language | 12 | 13 | 11 | 10 | 10 | 7 | 63 |
| Media list/grid + Asset editor translations | 10 | 14 | 10 | 10 | 10 | 6 | 60 |
| Event dates/numbers in list and editor | 14 | 14 | 9 | 10 | 11 | 7 | 65 |
| Preview in app panel (language follows tab) | 15 | 14 | 12 | 12 | 9 | 7 | 69 |

Nielsen (0–4): visibility of status 3 · match with real world 2 · user control 2 · consistency 2 · error prevention 2 · recognition rather than recall 1 · flexibility/efficiency 1 · aesthetic/minimal 3 · error recovery 3 · help 2.

## Observed vs inferred
Observed means done in the running app with a screenshot or console output. Inferred means read from source only.

## Findings

### R1-p3-translator-01  P1
Editor, Greek/Italian tab, POI/Route/Event/Category/Asset · 1440, 1024, zoom200 · Translator job 2
Evidence: `shots/poi-editor__greek-tab-empty__1440.png`, `shots/poi-editor__greek-filled-no-default-beside__1440.png`. Steps: open any DRAFT POI with English text, click ΕΛΛΗΝΙΚΆ.
Observation: the panel shows only the target fields. The English text is on another tab; the Translations card lists only completeness. While typing Greek the English summary is invisible (observed; source `TranslationsPanel.vue` renders one field set for the active language only).
Why it hurts: the translator must flip tabs to read the source for every field, and loses it while typing. This is the core translator need in `12` §2 / PRODUCT.md.
Recommendation: in non-default tabs render each field as a pair: read-only default-language text (small, labelled "English · default", `lang="en"`) above or left of the editable field, with a copy-to-field button. At ≥1280 two columns, below that stacked. Same for Asset alt text, Guide story blocks and Route stops.
Likely files: `src/components/editor/TranslationsPanel.vue`, `StoryEditor.vue`, asset editor. Spec: yes `12` §2–3, `14` §4 (visible labels); no change needed. Effort M.

### R1-p3-translator-02  P1
Lists (Places, POIs, Routes, Guides, Events, Categories, Media), translation worklist · 1440 · job 1
Evidence: `shots/pois-list__filter-menu-open__1440.png`, `shots/events-list__default__1440.png`; DOM count script output below.
Observation: the Filters menu has Status, Category, Featured, Search in. No "Translation: missing in …" filter, no sort by completeness, no per-language column. Counting dots by DOM: Italian is partly/not translated on Places 12/12, POIs 44/44, Routes 6/6, Guides 5/5, Events 7/7, Categories 11/11; Greek complete on all pre-existing rows. Media rows and cards show no translation state at all. Dots are 10px glyph + 2-letter code (`TranslationDots.vue`). Building the Italian worklist by reading 85+ rows takes an estimated 10+ minutes and must be repeated per kind; Greek is empty and you only learn that by scanning. The Translations menu is out of scope, and no Content list or editor links to it.
Why it hurts: the Translator cannot answer "what is left in Italian?" from Content.
Recommendation: add a "Translation" filter group to the shared list filter menu: language (el/it) + state (missing / partly / any gap), with a chip "Needs it". Add a Translations column sort. Show counts ("Italian: 44 of 47 need work") in the list footer. Add the same to Media (alt text missing, as per `MISSING_TRANSCRIPT`-style readiness). In the editor add "Next item missing Italian" after save.
Likely files: `ListFilterMenu.vue`, `SearchLanguageSelect.vue`, kind list views, `MediaView.vue`. Spec: `12` §3 lists search with language filter only; a translation filter is an addition within the list, no spec conflict, but check `12` §3. Effort M.

### R1-p3-translator-03  P2
Guide editor, Greek/Italian tab · 1440 · job 2
Evidence: `shots/guide-editor__greek-tab-after-english-story__1440.png`.
Observation: with an English paragraph and heading present, the Greek tab shows two empty fields "Write the paragraph in Ελληνικά" and a bold heading placeholder, with no English source. The block rows also expose position select, up/down, add and delete (X) controls in the translation view; deleting or moving here presumably acts on the shared structure (inferred, not tested to avoid damaging data).
Why it hurts: translator cannot see what to translate and can reorder or delete English structure by accident.
Recommendation: in non-default tabs show the English block read-only above each field and hide reorder/add/delete (keep a link "Edit structure in English").
Likely files: `StoryEditor.vue`. Effort M.

### R1-p3-translator-04  P2
Translations card (editor right rail) · 1440 · job 1
Evidence: `shots/poi-editor__saved-translations-card__1440.png`.
Observation: rows say "Partial (3 of 5 fields)" or "Missing" or "Complete". It does not name the missing fields; the two missing are inside the collapsed "Practical details" group, so a translator who filled every visible field still sees Partial for Greek and Italian — and also for the default language English. Missing is red text only on the word. No "next missing field" action (`12` §3 mentions it). Clicking a language row switches the tab (observed), but nothing marks rows as controls (no hover/arrow seen at rest).
Recommendation: expand the row hint to "Missing: Practical details, Opening hours" with a link that opens the group and focuses the first empty field; add "Next missing" button; render rows as buttons with chevron.
Likely files: `EditorShell.vue`, `TranslationsPanel.vue`. Effort S–M.

### R1-p3-translator-05  P2
Language tabs · all kinds · keyboard · a11y
Evidence: console run: focus English tab, ArrowRight → selected stays "ENGLISH · DEFAULT"; Tab moves to the next tab button.
Observation: `role="tablist"/tab` but all tabs are in the tab order and arrow keys do nothing (source: no roving tabindex). The ARIA authoring pattern is not met.
Recommendation: roving tabindex + Left/Right/Home/End, or drop tab roles and use a button group with `aria-pressed`.
Likely files: `TranslationsPanel.vue`. Spec: `14` §4. Effort S.

### R1-p3-translator-06  P2
Language tab labels · Greek · 1440
Evidence: `shots/poi-editor__greek-tab-empty__1440.png`: tab reads "ΕΛΛΗΝΙΚΆ" (computed `text-transform: uppercase`, element lang inherited `en`).
Observation: Greek capitals normally carry no tonos; with the wrong `lang` the accent survives on the final alpha. The same in the Story heading "STORY · ΕΛΛΗΝΙΚΆ", on every `<h>` label using `uppercase` with a language name. At 1024 the tab "ENGLISH · DEFAULT" wraps over two lines (`shots/poi-editor__greek-tab__1024.png`).
Recommendation: set `lang` on the tab (`lang="el"`), or stop upper-casing language names (use title case, which also respects the native name); keep "default" as a separate badge that does not wrap.
Likely files: `TranslationsPanel.vue`, `StoryEditor.vue`. Effort S.

### R1-p3-translator-07  P2
List search with Search in selector · 1440 · job 3
Evidence: `shots/pois-search__el-ακροπολη__1440.png`; console results: "ακροπολη", "Ακρόπολη", "ΑΚΡΟΠΟΛΗ" return identical 3 rows in All/Greek/English scopes where applicable (accent and case insensitive: works); Italian scope "Partenone" returns "Parthenon Frieze – North Side".
Observation: matching is good. But a row matched only through another language shows the default title, so "ακροπολη" returning "Acropolis View Terrace" or "Partenone" returning "Parthenon …" looks like a wrong result. "Search in" is inside the Filters popover; it only becomes visible as a chip after being set, and the search box placeholder "Search titles and exhibit codes" doesn't mention languages.
Recommendation: under a matched row show a line "Ελληνικά: Ακρόπολη …" (the matching translation, highlighted); put the language select next to the search box.
Likely files: list views, `SearchLanguageSelect.vue`. Spec: `12` §3 list search. Effort M.

### R1-p3-translator-08  P2
Media list/grid and Asset editor · 1440 · job 2
Evidence: `shots/media-list__default__1440.png`, `shots/asset-editor__top__1440.png`, `shots/asset-editor__greek-tab-alt-text__1440.png`.
Observation: Media has no translation dots and no missing-alt-text indicator, in grid or list (headers: Preview, Name, Type, Details, Status, Used in, Uploaded). The Asset editor right rail has Status and Used in but no Translations card (other kinds have it). The image preview is ~300px high near the top; when you write alt text in the tab below it scrolls out of view, and the English alt text is not shown next to the Greek field.
Why it hurts: the Translator writing alt text cannot see the image or the source text.
Recommendation: add translation dots to Media rows and an "Alt text missing in …" filter; add the Translations card; make the image preview sticky at a small size (or thumbnail beside the field) and apply finding 01.
Likely files: `MediaView.vue`, `AssetEditorView.vue`. Spec: `12` §3 Asset detail panel with translations. Effort M.

### R1-p3-translator-09  P2
Preview in app panel · 1440 · job 2
Evidence: `shots/poi-editor__preview-panel-open__1440.png`.
Observation: the panel opens over the form, covering the fields being translated and the Translations card; at 1440 it spans the form's right half. It follows the tab's language ("Language: English, following the editor's language tab", observed; the Greek tab was opened in the run, screenshot `poi-editor__preview-greek-tab__1440.png`). Pressing Escape with the panel open left it open (observed once).
Recommendation: dock it as a side column or make it dismissible with Esc and close on outside click; keep it from covering the Translations card.
Likely files: `ResourcePreview.vue`. Effort S.

### R1-p3-translator-10  P2
POI create vs other kinds · 1440
Evidence: `s4`/`s6` runs; after Create the POI stays on the list (toast "Point of interest created"), whereas Route, Guide, Event, Category open their editor (URL changes).
Observation: with 44+ rows the new POI is appended offscreen. Inconsistent behaviour for the same dialog pattern.
Recommendation: open the editor after create in every kind (or scroll to and highlight the new row).
Likely files: `CreatePoiDialog.vue`, `PoisView.vue`. Effort S.

### R1-p3-translator-11  P3
Dates and numbers in Events · 1440 · job 3
Evidence: `shots/events-list__default__1440.png`, `shots/event-occurrence__dialog__1440.png`; source `format.ts` (en-GB), `events.ts:187` (en-US), `:243` (undefined locale).
Observation: one row mixes "12 Nov 2026" (en-GB) with "next Fri, Dec 4, 2026, 07:00 PM 10:00 PM" (browser/en-US, 12-hour); the occurrence inputs are native datetime-local (MM/DD/YYYY, AM/PM here) and the editor shows "Times in Europe/Athens, this browser's timezone: the Project has none set". The editor's own preview formats with the language code (`EventEditorView.vue:102`), the list does not. No number formatting was seen (no localized numbers on screen apart from "94 M" distance).
Recommendation: one formatter (language-aware, 24-hour option) for lists and chips; show a sample line "13 Nov 2026, 10:00 (el: 13 Νοε 2026, 10:00)".
Likely files: `src/lib/format.ts`, `src/platform/events.ts`. Effort S.

### R1-p3-translator-12  P3
RTL handling (observed + inferred)
Evidence: `shots/poi-editor__rtl-typed-in-ltr-field__1440.png`; computed styles output.
Observed: typing Hebrew and Arabic into an Italian (LTR) field keeps `dir="ltr"`, `lang="it"`, `unicode-bidi: isolate`, `text-align: start`; the text renders left-aligned, with mixed-direction runs ("— … (Athens) 123") ordered as in any LTR box. This is correct for LTR; it shows what an RTL language would need.
Inferred (source): fields in `TranslationsPanel.vue` and `StoryEditor.vue` get `:dir` and `:lang` from `ProjectLanguage.direction`, so an RTL language would render RTL right-aligned there; `ResourcePreview.vue` and `DeviceFrame.vue` set `dir`; the language catalogue has `ar` and `he` as RTL. Not covered by any `dir`/`bdi`: tab labels, Translations-card rows, list dots (`TranslationDots.vue` hardcodes English words and en glyph order), titles shown in lists, create dialogs; `index.html` has `lang="en"` and the CMS chrome is never mirrored (breadcrumb chevron has `rtl:` flip only). Pure-LTR chrome is acceptable, but RTL display names (עברית) in tabs, cards and chips should be wrapped in `<bdi>`.
Not verified: that selecting an RTL language really flips the fields (no such language in the Populated Project and it is out of scope to add it).
Effort S.

### R1-p3-translator-13  P3
Translation dots · lists · 1440 · a11y
Evidence: `shots/events-list__default__1440.png`.
Observation: 10px text and 11px glyphs; ○ for "not translated" is grey on white and nearly invisible next to ✓; meaning is only by hover title and the sr-only text; no legend. Text + icon rule is met; size and scan speed are not.
Recommendation: 12–13px, a small pill per language ("IT · missing"), or a column header legend.
Likely files: `TranslationDots.vue`. Effort S.

## What works (verified)
- Search is accent- and case-insensitive for Greek in all language scopes; the "Search in: Ελληνικά" chip with a clear ✕ appears next to the box (`shots/pois-search__el-ακροπολη__1440.png`); long titles wrap rather than truncate.
- Dots use ✓ ◐ ○ with sr-only language names (D-042).
- Slug generation transliterates Greek titles; create dialogs label the field "TITLE · ENGLISH".
- Saving translations in the Draft state gives a clear "Saved" toast and live counts; clicking a language row in the Translations card switches the tab.
- Preview in app follows the language tab. Greek long strings with long compound words wrap inside textareas, and zoom200 stays single column without horizontal scroll (`shots/poi-editor__greek-tab-full__zoom200.png`), though the Translations card then sits at the very bottom.

## Unverified / could not test
- Route stop translations, Place and Map editors, Floor plans (not created in this run).
- ACTIVE Resource translation through the Working Copy; 409/422 states on translated fields.
- Real RTL rendering (no RTL language in the Project).
- Preview language selector inside the stand-in (`EN ▾`) was seen but not driven; Visitor app → Preview screenshot not reviewed in depth.
- Contrast numbers, axe run and focus-ring walk were not done.
- Time to build a worklist: estimated, not timed by hand; the scripted DOM scan of six lists took about 20 s of page loads.

Scripts and shots: `ux-audit/round-1/audit/p3-translator/` (`s*.mjs`, `shots/`).
