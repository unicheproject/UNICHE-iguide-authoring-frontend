# p3-translator — Round 2
(Saved by the orchestrator from the agent's returned report: its Write call was refused. Shots, scripts, logs and ids.json in this folder.)

Persona: translator (`curator`, Populated: en default, el, it). Operate mode; skill interview skipped (subagent). Records created (`UX-R2-p3 …`, ids in ids.json): POI "Stoa of Attalos Gallery" (DRAFT), POI "Active Kouros Hall" (activated, one Working Copy applied), Route "Agora Stroll" (3 stops), Guide "Walking the Agora" (5 blocks), Event "Evening Lecture" (2 dates), Category "Marketplace Life", Asset "mosaic".

## Verdict
Translator workflow usable now (Italian worklist in 2 clicks, ~2 s, every list; source beside target with Copy source; no structure in non-default tabs). Completeness signals still disagree or lie: Route stop texts and Guide story blocks are not counted (Guide Greek tab says "Complete" with 5 empty blocks); Media shows nothing per row about what is missing; a row matched through another language never says so. RTL inferred from code.
Scores 74–80 (RTL 67). P0 0, P1 2, P2 8, P3 4. C1 fixes: fixed 3, partly 6, not fixed 1, regressed 0.

## Context check
12 §2 Translator needs per-language view of untranslated, side-by-side, search in the language; 14 §3/§4; 03 §1 (Italian typed on ACTIVE item went to a Working Copy, survived reload, Apply confirms); D-079, D-085; PRODUCT.md translator. Impeccable: critique.md browser inspection; audit.md contrast/ARIA/keyboard (axe 0 violations on four Greek-tab screens); operate.md "the tool should disappear into the task".

## Jobs
1. Italian worklist: "Needs translation" + "in Italiano" = 2 interactions, 1.9–2.1 s, six lists (Places 17/18, POIs 69/75, Routes 9/11, Guides 9/11, Events 10/13, Categories 15/17); deep link `?missing=it` works. Media: toggle + "Needs attention". Not findable: items where only nested parts are missing (01, 02).
2. Translated POI, Route (incl. 3 stops × 4 fields), Guide (5 blocks), Event (dates read-only with "Go to English"), Category, Asset into el and it. Copy source works (disabled with reason when empty). Structural buttons: Route en 15 vs el 0; Guide 24 vs 0. Tab completeness updates live; roving tabindex Arrow/Home/End verified.
3. Greek search accent-, case- and final-sigma-insensitive; Search in narrows correctly. Tab labels keep diacritics, `lang` on bdi. Manrope Greek loads, metrics match Montserrat; mixed label reads as one line, Greek slightly lighter.
4. ACTIVE item: Activate dialog names warnings per language; pending-changes banner; reload keeps it; Apply confirms (but does not list what changes, 12).

## Scores (T25/V20/C15/Co15/A15/R10)
| Screen | Total |
|---|---|
| Lists Italian worklist | 81 |
| POI editor translation tabs | 82 |
| Route translation tab | 75 |
| Guide translation tab | 74 |
| Event | 78 |
| Category | 81 |
| Asset | 79 |
| Media worklist | 71 |
| ACTIVE pending translation + Apply | 85 |
| Greek search | 76 |
| RTL (partly inferred) | 67 |
Nielsen: 2,3,3,2,3,3,3,3,4,3.

## Findings
- **R2-p3-01 P1 Completeness ignores Route stop texts and Guide story blocks.** shots/guide-editor__el-saved__1440.png (tab "Complete", five story fields empty; side card "Ελληνικά 1 of 2"; readiness "1 text missing"); shots/route-editor__el-stops__1440.png (12 stop fields typed, tab stays "3 of 4"). Cause: tab marks count fields with `data-path`; stop fields and blocks have none; `goToNextMissing` (EditorShell.vue:304) looks only for `input[data-path]`. Fix: one completeness function for tab, card, list dots and readiness; count stops/blocks; Next missing visits them. Files: EditorShell.vue, TranslationsPanel.vue, StoryEditor.vue, route/guide status builders. 14 §4. Effort M.
- **R2-p3-02 P1 Media worklist cannot say what is missing; "complete" has two meanings.** shots/media__list-needs-translation-it__1440.png, media__default__1440.png, asset-editor__it-saved__1440.png. (a) no per-row translation state; "Needs attention" says "None" for an asset missing Italian title/caption, or "No alt text" (English) inside an Italian worklist; (b) `missingTextIn` (platform/assets.ts:301) checks title+alt only while the editor tab counts four fields ("Ελληνικά 2 of 4" yet not on the Greek worklist); (c) "No alt text" is default-language only; (d) Asset editor has no Translations card / Next missing; (e) "Showing 48 of 58 files (64 in the library)". Fix: per-row "Italiano: alt text, title missing", one definition, language-aware alt filter, Translations card, one count line. Files: MediaView.vue, platform/assets.ts, AssetEditorView.vue. Effort M.
- **R2-p3-03 P2 "Needs translation" defaults to the source language and is separate from "Search in".** shots/pois-list__needs-translation-no-lang__1440.png (`missing=en`); ListToolbar.vue:60. Fix: default to Search-in language or first non-default; or one Language control. Effort S.
- **R2-p3-04 P2 Row matched through another language does not say so.** shots/pois-search__greek-match-english-title__1440.png. Fix: "Matches Ελληνικά: …" line (bdi, lang). Files: listRows.ts, list views. Effort S–M.
- **R2-p3-05 P2 Worklist loses the language when opening an item; dots not links.** TranslationDots supports `to` but no list passes it (PoisView.vue:274 etc.). Fix: dots link to editor `?lang=it`, editor seeds active language. Effort S.
- **R2-p3-06 P2 Next missing skips the current language and collapsed Practical details;** label silent about target (EditorShell.vue:293). Fix: finish current language first (expand and focus), label "Next missing: Italiano", announce. Effort S.
- **R2-p3-07 P2 At 1024 Translations card and Next missing ~1,900 px down** (shots/poi-editor__long-greek-tab__1024.png). Fix: Next missing beside the tabs at ≤1100 px. Effort S.
- **R2-p3-08 P2 Dates/times: three formats on a page; Greek tab not localized** (shots/event-editor__dates-en__1440.png: header "Fri, 4 Dec 2026 · 20:30-22:00" above inputs "12/04/2026", "08:30 PM"; "Saved 03:43 PM" vs "Updated 13 Nov 2026, 15:41"; shots/event-editor__dates-el__1440.png English words in Greek tab). Fix: one formatter, 24 h, target-language summary; label or replace native inputs. Effort M.
- **R2-p3-09 P2 RTL: `dir` applied in editors only.** Observed: target fields and source cells have lang and dir from ProjectLanguage.direction; Arabic/Hebrew typed into LTR fields render left-aligned (shots/rtl__arabic-hebrew-typed-in-ltr-field__1440.png); `<html>` has no dir; list search, list titles, h1, breadcrumbs, readiness, Media names carry no lang/dir. Inferred: SourcePairField.vue:62,82,97; TranslationsPanel.vue:218,249,261; StoryEditor.vue:217,232; FormDialog.vue:166; ResourcePreview.vue:43 would get dir="rtl". Fix: `dir="auto"` on list search, row titles, header title; lang/dir on non-default-language titles. Effort S.
- **R2-p3-10 P2 Long titles: single-line target input; sticky header eats zoom200** (shots/poi-editor__long-greek-tab__zoom200.png, __1024.png; h1 ellipsis; at zoom200 headers + tabs ~half of 360 px). Fix: auto-growing Title textarea in translation tabs; h1 wraps to 2 lines; slimmer header at zoom. Effort S–M.
- **R2-p3-11 P3** POI has a "Texts" heading above tabs; Route, Event, Guide, Category, Asset start at the tabs. "Stop texts in Ελληνικά 3" has an unexplained 3.
- **R2-p3-12 P3** Apply dialog does not say what is applied.
- **R2-p3-13 P3** Language-independent controls stay editable under a language tab (Decorative checkbox, Event Place/POI/Route/Booking URL, POI Placement, Media, triggers). Suggest a note or collapsed "Other settings (all languages)".
- **R2-p3-14 P3** List footer denominator includes archived while the segment says Not archived; dots read ": partly translated" in English; stop title placeholder truncated.

## Round-1 fixes verified
C1-21 partly (cross-language match invisible) · C1-34 fixed · C1-35 partly (Media rows silent; no Asset Translations card) · C1-36 partly (skips current language/details; stops/blocks uncounted) · C1-37 partly (dots not links) · C1-38 fixed · C1-39 not fixed · C1-40 partly (RTL inferred) · C1-86 translator part fixed · C1-108 partly (alt filter default-language only). Totals: fixed 3, partly 6, not fixed 1, regressed 0.

## What works
Worklist with URL state and Back restore; source-beside-target with "Translating from English into Ελληνικά"; disabled Copy source with reason; dates read-only with "Go to English"; tab text+icon completeness and keyboard pattern; 422/409 handled per language (shots/poi-editor__422-on-greek-field-while-on-italian-tab__1440.png); Working Copy flow with Apply confirmation; Greek search; Manrope; axe clean on four Greek-tab screens.

## Unverified
RTL with a real RTL language; maps/floor plans have no translatable text; forced colours, reduced motion, real screen readers not run for translation tabs; Italian blocks/stops only partly filled.
