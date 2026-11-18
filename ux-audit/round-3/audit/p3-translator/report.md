# p3-translator — Round 3

Account `admin`, Project `UX Audit – Populated` (en default, el, it sparse). Windows Node + Playwright, headless Chromium.
Records I created, all named `UX-R3-p3 …`:
- a POI "Poi Παρθενώνας test", now ACTIVE and applied;
- a Route with one stop and a long Greek title;
- a Guide with a paragraph and a heading, plus an Arabic/Hebrew title and paragraph;
- an Event with one date;
- a Category;
- an Asset, `UX-R3-p3-asset.png`.
No pre-existing record was saved, applied, archived or deleted.

## Verdict
The translation job now works end to end: an Italian worklist in three steps, source beside target, Copy source, live tab marks that agree with the side card and header (checked on POI, Route, Guide, Event, Category, Asset), folded "Other settings", Greek dates and accent-insensitive list search. No P0 or P1.
Remaining faults are P2:
- structural controls still show under the Category and Asset language tabs;
- ACTIVE Place and POI double-count the accessibility gap;
- "Save and apply" does not list the changes;
- the stop picker is accent-sensitive;
- the worklist is lost when you leave an item.
Close, but not 90+ on every screen.

## Context check
- `12-cms-experience.md` §2: the Translator needs a per-language view of everything untranslated, side-by-side with the default language, and search in the language being translated. All three exist now.
- `14` §4: the document `lang` follows the selected language. Observed: Greek fields carry `lang="el" dir="ltr"`, and the preview root has `lang="el"`.
- `03` §1: an ACTIVE Resource is edited through one Working Copy. Observed on my POI: Save draft, then Apply changes, a "Pending changes" chip, and focus on "Status" afterwards.
- DECISIONS D-090 (one readiness model), D-088 (one date formatter), D-085 (Manrope for Greek only): checked below.
- PRODUCT.md: the Translator must find untranslated work and see the default-language text beside the target.
- impeccable (Operate mode; interview steps skipped because I am a subagent):
  - `critique.md`: "Viewable targets require browser inspection".
  - `audit.md`: flag a global 0.01 ms reduced-motion kill. Observed: transition-duration 0.001 s, and `getAnimations()` is empty under reduce.
  - `polish.md`: "Inspect the rendered experience and real interaction path".
  - `operate.md`: "The tool should disappear into the task" (the Category and Asset tabs fail it).

## Scores
| Screen / state | Task 25 | Visual 20 | Consist. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| Lists: Italian worklist, dots, MatchHint (6 kinds) | 22 | 17 | 12 | 13 | 13 | 7 | 84 |
| Media worklist (grid and list) | 23 | 17 | 13 | 13 | 13 | 8 | 87 |
| Editor translation tab: POI, Route, Guide, Event, Place | 23 | 18 | 13 | 13 | 14 | 8 | 89 |
| Editor translation tab: Category | 19 | 16 | 10 | 13 | 12 | 8 | 78 |
| Asset editor translation tab | 20 | 16 | 11 | 13 | 13 | 7 | 80 |
| ACTIVE item: pending changes, Apply confirm | 21 | 17 | 12 | 12 | 14 | 8 | 84 |
| Search (Greek, accents, Search in, MatchHint) | 21 | 17 | 12 | 14 | 13 | 8 | 85 |
| RTL (observed Arabic and Hebrew) | 18 | 15 | 11 | 14 | 11 | 7 | 76 |

No open P1, so the 85 cap does not apply. No group reaches 90 because each has an open P2 or a missing state.
Nielsen (group), 0-4 each:
- visibility of status 3
- match with real world 3
- user control 2 (worklist lost on return)
- consistency 2 (tab gap, structural controls)
- error prevention 3
- recognition 3
- flexibility 3
- minimalist design 2 (double count, two language selects)
- error recovery 3
- help 3

## Round-2 fixes verified
| ID | Status | Evidence |
|---|---|---|
| C2-33 one readiness model | partly | Tab marks, side card and header agree live on DRAFT items (Route: 3 of 7, then Complete; card lines drop with them). ACTIVE Place and POI count the empty accessibility field twice (finding 04). |
| C2-34 completeness counts structure | fixed | Route stop texts counted (7 slots). Guide story is one slot, and the "no story" gap is its own line. Asset alt text counts. |
| C2-42 Translations column at 1024 | partly | Dots no longer break mid-letter (`English` is 69x24). But the Title column is 118 px on Routes and 166 px on Events at 1024 (finding 07). |
| C2-48 match in another language | fixed | `Matches Ελληνικά: Ζωφόρος του Παρθενώνα – …` under the row (`shots/pois-list__search-greek-search-in-el__1440.png`). |
| C2-49 Needs translation language | partly | Ticking it alone picks Ελληνικά and shows "in [language]"; choosing Search in = Italiano seeds it. There are still two language selects (finding 10). |
| C2-50 translation navigation | partly | Dots open `?lang=`. Next missing finishes the current language, moves focus and announces. Not fixed: breadcrumb loses the worklist, row title opens English, Preview "144 missing titles" is not a link (findings 01, 13). |
| C2-51 Media worklist | partly | Per-row `Italiano: alt text, title missing` in grid and list; `No alt text in Italiano`; Next missing and Translations on the Asset editor. "Complete" still has two meanings: my asset's tab says `2 of 3` (caption empty) while its library row flags nothing. |
| C2-52 one date formatter | fixed | 20 pages scanned. Only `D Mon YYYY, HH:mm`, `D Mon YYYY` (Media, Maps) and `Saved HH:mm` appear. Event dates read `Τετ 18 Νοε 2026 · 10:00–11:00` under Greek and `mer 18 nov 2026` under Italian. Date fields are typed 24 h. |
| C2-53 RTL | partly | `dir=auto` on the h1, search input and list-row wrapper (observed). Not auto: breadcrumb and editor fields (finding 11). |
| C2-54 long titles | fixed | Title is an auto-growing textarea (79 px for a 165-character Greek title). Header h1 clamps to two lines with an ellipsis. List titles wrap in full. No horizontal scroll at 1440, 1024, 768, zoom200. |
| C2-55 language-independent controls | partly | POI, Place, Route, Guide, Event fold them ("Other settings (all languages)"; Event shows "Go to English"). Category and Asset do not (findings 02, 03). |
| C2-56 Apply confirm names the change | partly | After Save draft the Apply dialog reads "Changes: Title (Ελληνικά), Summary (Ελληνικά), Summary (Italiano)". "Save and apply" reads "Changes: your unsaved edits." (finding 05). |
| C2-67 Translations / Next missing far down | partly | Below 1180 px "Next missing" sits beside the tabs (x 827 at 1024, 571 at 768). At 1440 and 1280 only the side-card copy exists (finding 08). |
| R2-V-03 sticky chrome | partly | POI editor at zoom200: 56 px app header plus 56 px title bar is 112 of 360 css px (31 %). Focused fields stay below it (12 Tab stops measured, none hidden). |

R2-V-02, V-04 and V-07 were not exercised.

## Job walk
| Job | Result | Time and hesitation |
|---|---|---|
| 1 Italian worklist in each list, Media | pass | Three actions (Filters, Search in = Italiano, tick Needs translation). 2.0-2.8 s scripted, about 10 s by hand. URL is `?lang=it&missing=it`. Hesitation: once the popover closes nothing says which language the worklist is in. Nothing unfindable; map and floor-plan names are single-language by design. The loop fails on returning from an item. |
| 2 POI | pass | Copy source; marks go `1 of 5`, `3 of 5`, Complete; the side card `English: 2 texts missing` agrees. |
| 2 Route with stops | pass | Stop texts show in the Greek tab as text fields only; marks and card agree through to Complete. |
| 2 Guide story blocks | pass | Each block has source and target, and its own Copy source. |
| 2 Event, dates | pass | Dates read-only in el and it, with a "Go to English" link. |
| 2 Category | partial | Works, but "Category setup" stays editable and adds many Tab stops. |
| 2 Asset alt text | partial | Alt, title, caption work; Decorative and Name stay editable. |
| 3 Greek search, MatchHint, long Greek, fonts, dates | pass with P2 | Lists fold accents and case; the stop picker does not (finding 06). |
| 4 ACTIVE item through pending changes and Apply | pass with P2 | Focus lands on "Status" after Activate and after Apply. The "Save and apply" dialog is generic. |
| 5 RTL | partial | Finding 11. |

## Findings

### R3-p3-translator-01 — Worklist is lost when you leave an item
Severity P2. All six lists and Media, 1440. Translator, job 1. Evidence: `j1.mjs`. From `/pois?lang=it&missing=it`, the Italiano dot opens `?lang=it` (good). The breadcrumb "Points of Interest" goes to `/pois` with 50 unfiltered rows; only browser Back restores the filter. The row title link has no `lang`, so it opens the English tab.
Why it hurts: a translator working through 40 items re-applies the filter after every item.
Recommendation: carry `lang` and `missing` in the breadcrumb and Back link while they are set. Add `?lang=` to title links when a language filter is active.
Files: `EditorShell.vue` breadcrumb, `listRows.ts`, list row title links. Spec: `12` §2. Effort S.

### R3-p3-translator-02 — Category language tabs still show structural controls
Severity P2. Category editor, `?lang=el` and `?lang=it`, 1440. Evidence: `shots/categories-editor__el-tab__1440.png`, `b3.mjs`. "Category setup" (Applies to, Level, Icon grid, Details) is editable under the Greek tab and not folded. The Tab run from Description crosses three radio groups plus the icon radios. Every other kind folds them.
Why it hurts: a translator can change what the category applies to, and the keyboard run is padded with structural stops.
Recommendation: move Category setup behind "Other settings (all languages)" as on POI and Place.
Files: Category editor view. Spec: D-079. Effort S.

### R3-p3-translator-03 — Asset language tabs keep Decorative and Name editable
Severity P2. Asset editor, `?lang=el` and `?lang=it`, 1440. Evidence: `as1.mjs` dump, `shots/asset-editor__el-tab__1440.png`. The "Decorative image" checkbox and the "Name" input are present under non-default tabs.
Why it hurts: Decorative changes the image for every language and removes the alt-text duty. It should not sit one click from a translation field.
Recommendation: fold both under "Other settings (all languages)".
Files: `AssetEditorView.vue`. Effort S.

### R3-p3-translator-04 — ACTIVE Place and POI count the empty accessibility field twice
Severity P2. Own ACTIVE POI and seed Place `Acropolis Museum`, 1440. Evidence: `shots/poi-editor__apply-dialog__1440.png` (side card), `pl1.mjs`. The card shows `Texts (1) English: 2 texts missing` and `Other (1) English: Accessibility information for visitors is empty`. The tab says `3 of 5` (two missing, one of them accessibility). The header says "2 warnings" for one gap. DRAFT items do not show this.
Why it hurts: it breaks D-090 "nothing counted twice"; header, card and tab disagree by one.
Recommendation: drop the platform's accessibility-empty item when the client already counts that slot.
Files: `completeness.ts` merge. Spec: D-090. Effort S.

### R3-p3-translator-05 — "Save and apply" confirm does not list the changes
Severity P2. ACTIVE POI with unsaved Greek and Italian edits, 1440. Evidence: `shots/poi-editor__active-pending-saved__1440.png` shows "Changes: your unsaved edits." After Save draft the Apply dialog does list "Title (Ελληνικά), Summary (Ελληνικά), Summary (Italiano)".
Why it hurts: the one-step path (primary button while dirty) is the least informative.
Recommendation: build the same per-language list from the dirty fields.
Files: ApplyDialog, `EditorShell.vue`. Effort S.

### R3-p3-translator-06 — Stop picker search is accent- and case-sensitive for Greek
Severity P2. Route, Add stops dialog, 1440. Evidence: `s2.mjs`, `shots/stop-picker__search-greek-unaccented__1440.png`.
- "Παρθενώνας": 1 match
- "παρθενώνας": 1 match
- "παρθενωνας": 0
- "ΠΑΡΘΕΝΩΝΑΣ": 0
The lists find all four. Cause: `ResourcePickerDialog.vue:55-60` uses `toLowerCase().includes`, while `ProjectList.vue:57` already has a `fold` helper.
Why it hurts: a Greek translator types without tonos and finds nothing, in this one place.
Recommendation: reuse `fold` in every picker and filter.
Files: `ResourcePickerDialog.vue`. Effort S.

### R3-p3-translator-07 — Title column collapses at 1024 on Routes and Events
Severity P2. Routes and Events lists, 1024, long titles and MatchHint. Evidence: `l3.mjs`, `shots/routes-list__long-greek-title__1024.png`. Title column is 118 px on Routes and 166 px on Events, against 192 px for Translations and 128 px for Updated. A Greek MatchHint wraps to 7 lines and the row is 259 px (median Events row 140 px).
Why it hurts: the item name wraps every two words and the hint is hard to read, in the worklist where hints appear.
Recommendation: let Translations and Updated shrink (stack the dots under the status), or drop Updated below 1180 px as the card layout already does at 768.
Files: list table column widths. Effort S-M.

### R3-p3-translator-08 — "Next missing" is not beside the tabs on desktop
Severity P2. All editors, 1440 and 1280. Evidence: `t1.mjs`. The visible button is at page y 791 (Category), 904 (Route), 1162 (POI), 1291 (Asset). The beside-tabs copy exists only below 1180 px, although the release notes say it sits beside the tabs.
Why it hurts: the tab row has free space on the right, yet the translator has to scroll the side column.
Recommendation: show the beside-tabs button at every width and keep the side-card copy.
Files: `TranslationsPanel.vue:88`, `EditorShell.vue:11`. Effort S.

### R3-p3-translator-09 — Tab bar spacing differs between kinds
Severity P3. Editors at 1440, 1024, 768. Evidence: `t1.mjs`. The gap between the "Texts" heading and the tab list is 0 px on POI, Route, Guide and 16 px on Event, Category, Asset. Asset tabs are 93 and 85 px wide against 110 px elsewhere. Compare `shots/categories-editor__el-tab__1440.png` with `shots/poi-editor__el-tab__1440.png`.
Recommendation: one shared spacing. Effort S.

### R3-p3-translator-10 — The active worklist language is only visible inside the popover
Severity P3. All lists and Media. After closing Filters the toolbar shows "Filters 2" and "Clear filters" and nothing names Italiano. The two selects ("Search in" and "Needs translation in") can disagree. Evidence: `shots/media__italian-worklist-closed__1440.png`.
Recommendation: a chip "Needs translation in Italiano" beside Clear filters, and one Language control. Effort S.

### R3-p3-translator-11 — RTL: explicit `dir` in editors misplaces punctuation; search clear button flips
Severity P3. Evidence: `shots/guide-editor__rtl-arabic-hebrew__1440.png`, `shots/guides-list__rtl-row__1440.png`, `r1.mjs`, `r2.mjs`.
Observed (Arabic and Hebrew typed):
- h1 has `dir=auto`.
- Search input has `dir=auto`; computed direction is rtl and the text is right-aligned.
- List-row wrapper has `dir=auto`.
- Editor fields use the language's direction (`dir=ltr lang=en`), so a Hebrew paragraph in an English field is left-aligned, with "(2026)" and the full stop at the wrong ends.
- Breadcrumb has no `dir`.
- In the RTL search the clear button moves next to the magnifier.
Inferred, not observed: the Project has no RTL language, so the `dir=rtl` path from `language.direction` never ran.
Recommendation: `dir=auto` on text fields unless the language is known RTL; `dir=auto` on the breadcrumb current item. Effort S.

### R3-p3-translator-12 — Tab title stays stale after renaming
Severity P3. Category editor, 1440. Evidence: `ti1.mjs`. After Save the h1 shows the new name while `document.title` keeps the old one until reload.
Recommendation: derive the title reactively from the saved record. Effort S.

### R3-p3-translator-13 — Preview "144 missing titles in Italiano" is plain text
Severity P3. Preview, Italiano. It is not a link or button, though C2-50 asked for a link to the filtered list. Evidence: `pv2.mjs`, `shots/preview__italiano__1440.png`. The dashed outlines on missing texts are fine (pattern plus text).
Recommendation: link to `/pois?lang=it&missing=it`. Effort S.

### R3-p3-translator-14 — Small copy nits
Severity P3.
- Guide heading label "Heading 2, level 2" reads as one number twice (block 2, level 2).
- The Guide card says "Ελληνικά: 1 text missing" for a two-block story without saying which block.
- The asset alt hint uses straight quotes around "image of".
- The Apply dialog title breaks at the hyphen: "UX-" / "R3-p3 …".
- Media and Maps dates are date-only while lists show date and time.
Evidence: `d2.mjs`, `shots/poi-editor__apply-dialog__1440.png`, `d4.mjs`. Effort S.

### R3-p3-translator-15 — Forced colours: "Practical details" disclosure has no inner padding
Severity P3. POI editor, forced colours, 1440. Evidence: `shots/poi-editor__el-tab-forced-colors__1440.png`. The bordered row puts "Practical details" and "Show" flush against the border, with "Show" clipped by 1-2 px. A stray dot also appears before the readiness badge.
Recommendation: add padding to the row, or drop the border in forced colours. Effort S.

## What works (keep these)
- Italian worklist in three steps; URL carries `?lang=it&missing=it`; the Media filter becomes "No alt text in Italiano".
- Dots link to the language; the Italiano dot opens the Italian tab with focus on the h1.
- Source beside target at 1440, 1024, 768 and zoom200. Copy source moves focus to the target. Tab marks update as you type (six kinds) and match the card.
- Next missing: arrow keys move tabs; focus goes to the first empty field; the live region says "English: moving to the first missing text".
- Event under the Greek tab: dates read Greek, read-only, with a link to the English tab.
- Greek type, measured at 100 px: Latin x-height 53, Greek ν 54, ο 56 (includes a 2 px overshoot); cap height 70 against Η 72; identical font ascent/descent (97/25), so no line-box jump.
- Greek in sentence case keeps its accents. The only CSS uppercase is the preview stand-in, which correctly drops tonos for `lang=el` ("ΞΕΧΩΡΙΣΤΑ").
- Long Greek: no mid-word break, no horizontal scroll at any viewport, the title textarea grows, and the header clamps to two lines.
- Reduced motion gives 1 ms transitions and no running animations. Focus rings are 2 px purple with a 4 px white halo on Copy source, tabs and dots.
- List search folds accents and case in all languages and shows "Matches Ελληνικά: …" hints.
- Apply after Save draft lists changes per language; Activate and Apply leave focus on "Status".

## Unverified / could not test
- A real RTL ProjectLanguage: the Project has none, and editing languages is out of scope.
- Greek polytonic fallback font (U+1F00 range): not rendered in this run.
- Apply across a 409, offline, or 5xx during a translation save: not forced in this slice.
- HelpHint 32 px target (R2-V-02) and toast overlap (R2-V-04): not exercised.
- Maps and Floor plans have no translatable fields, so there is no translator job there beyond the lists.
