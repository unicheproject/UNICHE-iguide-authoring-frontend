# s10-poi-place — Round 1

Screen-group specialist: Place and POI editors (and the shared `EditorShell`), Project `UX Audit – Populated`. Impeccable `critique`/`audit`/`operate` references read; mode Operate; its interview steps skipped (subagent, the brief answers them). `impeccable detect --json` on `EditorShell.vue`, `PoiEditorView.vue`, `PlaceEditorView.vue`, `TriggersCard.vue`, `MediaSlots.vue`, `TranslationsPanel.vue` returned `[]`; axe (wcag2a/aa/21aa) on four editor states returned no violations, so the problems below are structural and behavioural, not mechanical.

## Verdict
The editors are correct, safe and accessible by the numbers, but they are one 2,300-2,750 px scroll with no persistent action bar, a readiness panel that appears only for ACTIVE records, activation that is one click with a "complete" toast over a list of warnings, and a translation tab that hides the source text. No P0; six P1. Best state scores about 70; the structure, not the polish, is the limit. A section-rail + sticky action bar + persistent readiness/"Publish-bar" restructure (below) lifts every Resource kind.

## Context check
- `12` §3 Resource editors: "the header carries only 'Apply changes'; 'Save draft' and 'Discard' sit in the Working Copy banner"; this is built as specified, and it is exactly what makes Save invisible after scrolling.
- `14` §4: "the readiness panel is a list of links; each item moves focus to the field" — verified: clicking an Italiano readiness item switches to the Italiano tab and focuses `f-accessibilityInformation`.
- `03` §1: ACTIVE records are edited through a Working Copy; visitors see nothing until Apply — verified end to end (Save draft creates it, Apply and Discard ask for confirmation).
- DECISIONS.md D-023 (760 + 310 column arrangement "as the prototype"), D-059 ("Preview in app" is a pop-up card), D-024 (unsaved form state kept in browser storage), D-036/D-037 (refused activation opens at first missing field; where-used entries link to where they are edited).
- PRODUCT.md: Translator "needs to see the default-language text beside the target" — not met (R1-s10-04).

Data used: seed DRAFT / ACTIVE / ACTIVE-with-WC / ARCHIVED POIs (`horsemen`, `pediment`, `frieze`, `copies`), Places `site` (OUTDOOR, map, sub-place), `parthenon` (INDOOR, floor plan), `museum` (parent). Created and mutated only: Place `UX-s10-poi-place Κήπος Ωδείου – Odeon Garden …` (`e2429d5c-31f0-44c0-96d6-eadbacdaaca5`, now ACTIVE), POI `UX-s10-poi-place Odeon Mosaic Floor Ψηφιδωτό` (`109e19ff-…`, ACTIVE, may hold a pending working copy), POI `UX-s10-poi-place Garden Bench` (`7b3cf597-…`, DRAFT, stale browser draft). Scripts `a01…a23.mjs`, shots in `shots/`.

## Editor information architecture (as built, 1440 × 900, content scroll height of `<main>`)

Page scroll is inside `<main>` (document does not scroll). Heights are `main.scrollHeight`.

| Kind / state | Height |
|---|---|
| POI ACTIVE + Working Copy (`frieze`) | 2,616 px (2,688 with chrome) |
| POI ACTIVE (`pediment`) | 2,489 |
| POI DRAFT | 2,330 (2,402) |
| POI ARCHIVED | 2,302 |
| Place OUTDOOR with map (`site`) | 2,681 (2,753) |
| Place INDOOR with floor plan | 2,261 (2,333) |
| POI ACTIVE at 1280 / 1024 / 768 / zoom200 | 2,827 / 3,969 / 4,201 / 3,786 |

Order, top to bottom (y = offset in `main`, POI ACTIVE+WC):
1. Breadcrumb; page head: title + status chip + (wrapping) "Pending changes" chip + meta line "kind · slug · version n"; right: "Unsaved changes" + Save / Apply changes (y 100-210).
2. Banners (conditional, 70-100 px each): restore-draft, Working Copy ("Save draft" / "Discard changes" as text links), archived/readonly, error summary.
3. Language tab row (English default / Ελληνικά / Italiano) with, in the side column, "Preview in app".
4. Form column (~760 px at 1440, fluid to side column 360): (a) texts card: Title, Summary, Description, [Place: Visitor information, Accessibility information] or [POI: collapsed "Practical details"]; (b) Media (POI: 6 slots Primary image/Video/Audio per language/Gallery/3D model/3D poster; Place: 2 slots) y 841; (c) "How visitors reach it" (QR / geo / beacon rows with Runs-on) y 1368; (d) POI: Placement (Place, Category, lat/long, site map) y 1736 / Place: "Place setup" (Level, Parent, Map or Floor plan, map preview) y 1397; (e) Details (Exhibit code, visit minutes, slug, internal name, Featured) y 2149.
5. Side column (not sticky; ends ~y 1100 then empty): Status and visibility (status, slug, version, updated, created, explanation, Activate/Deactivate, Archive) y 332; What needs attention (ACTIVE only) y 666; Translations (completeness per language) ; Used in (n).
Below 1024 px the side column moves below the whole form (y ~3,300 at 768).

## Scores
Weights: Task clarity 25 · Hierarchy/craft 20 · Consistency 15 · Copy/feedback 15 · A11y 15 · Responsive/state 10. Open P1s cap every row at 85; the rows below are well under the cap.

| Screen / state | Task 25 | Hier. 20 | Cons. 15 | Copy 15 | A11y 15 | Resp./states 10 | Total |
|---|---|---|---|---|---|---|---|
| POI editor, DRAFT | 15 | 12 | 11 | 10 | 12 | 6 | 66 |
| POI editor, ACTIVE + Working Copy | 15 | 12 | 10 | 10 | 12 | 6 | 65 |
| POI editor, ARCHIVED | 17 | 13 | 11 | 11 | 12 | 6 | 70 |
| Place editor, OUTDOOR with map | 16 | 12 | 11 | 10 | 12 | 6 | 67 |
| Place editor, INDOOR with floor plan | 15 | 11 | 11 | 10 | 12 | 6 | 65 |
| Create Place / Create POI dialogs | 19 | 14 | 12 | 12 | 13 | 7 | 77 |
| Deactivate/Archive with where-used dialog | 17 | 13 | 12 | 10 | 13 | 7 | 72 |
| Preview in app popover | 15 | 12 | 11 | 10 | 12 | 6 | 66 |
| Error/loading/offline states of the editor | 18 | 13 | 12 | 12 | 13 | 8 | 76 |

Range for the group: 65-77. Nielsen heuristics (0-4): 1 Visibility of status 2 (readiness hidden for DRAFT, "Unsaved" scrolls away); 2 Match with real world 3; 3 User control and freedom 3 (leave guard, restore, discard confirm are good); 4 Consistency 2 (Save vs Save draft vs Apply, Deactivate styled as primary); 5 Error prevention 2 (one-click Activate); 6 Recognition over recall 2 (source text hidden, section order); 7 Flexibility/efficiency 1 (no section nav, no sticky bar, 2.5k px scroll); 8 Aesthetic/minimal 2 (all-caps 11 px labels everywhere, empty media cards); 9 Error recovery 3 (422 summary with links, 409 mine/current, 503 keeps form); 10 Help/docs 3. Total 23/40.

## Findings

### R1-s10-01 — P1 — No persistent action bar; the editor is a 2.3-2.7k px scroll
Screen POI + Place editors, all states · 1440/1280 · Content editor, translator · Evidence: `shots/poi-active-wc__1440__tall.png`, `shots/poi1-draft__scrolled-bottom__1440.png`; steps: open `/pois/<frieze>`, `main.scrollTo(bottom)`; Save button `getBoundingClientRect().bottom` = -1,337 px. Verified persona report (height 2,616; Save/Apply not sticky; neither are Save draft, Discard, readiness, Activate).
Observation: head, WC banner, side column and the "Unsaved changes" label all scroll away. After editing Details or Placement at the bottom the author must scroll ~2,000 px back up to save; "Unsaved changes" is invisible when it matters.
Why it hurts: lost-work anxiety, constant scrolling, mismatch with "saving is explicit" (`12` §5).
Recommendation: one sticky header bar (see Proposal) holding title, status chip, dirty/pending state, Save draft / Apply (or Save), and Discard; sticky inside `<main>` (`top: 0`), compact (48-56 px) with the full title truncated.
Likely files: `src/components/PageHead.vue`, `src/components/editor/EditorShell.vue` · Spec: `12` §3 says the header carries Apply and the banner carries Save draft/Discard; a sticky bar must keep that split or record a D-NNN · Effort M.

### R1-s10-02 — P1 — Section order buries the task; no section navigation
Screen POI/Place editors · 1440 · Content editor · Evidence: tall shots above; y offsets in the IA table.
Observation: after the text card come Media (≈530 px, mostly empty cards), then triggers, then Placement/Place setup (y 1,400-1,750), then Details. The fields an author must set to make a POI visible (Place, Category, coordinates) start 1,736 px down; coordinates and Place are separated from the map-based geo trigger that repeats lat/long. There is no anchor rail, tabs, or collapse state, so jumping from the readiness panel is the only shortcut.
Why it hurts: order does not follow the job ("what is it, where is it, how is it reached, media, housekeeping"); scanability suffers; the empty "Primary image / Video / Audio / Gallery / 3D / 3D poster" grid takes 440 px when nothing is set.
Recommendation: reorder to Texts → Placement/Place setup → Media → How visitors reach it → Details; add a left-sticky "On this page" rail (or tab bar) with per-section status badges (complete / needs attention); collapse empty media slots into one row of "+ Add image / video / audio / 3D" chips; show filled slots large.
Likely files: `PoiEditorView.vue`, `PlaceEditorView.vue`, `MediaSlots.vue`, new `EditorSectionNav.vue` · Spec: `12` §3 names the cards, not their order · Effort M-L.

### R1-s10-03 — P1 — Activate is one click and the success toast contradicts the readiness list
Screen Place/POI editor, DRAFT → ACTIVE · 1440 · Content editor, project manager · Evidence: `shots/place-new__activate-click__1440.png`, `shots/poi1__activated-top__1440.png`; steps: create Place with only a title, click Activate: single `POST …/status`, no dialog. Verified persona report.
Observation: the toast says "The place is complete and visible to visitors." while "What needs attention" immediately lists 8 warnings (Greek and Italian title/summary/visitor information, accessibility) and the live region says "5 things need attention, 0 blocking" at the same time. The POI got the same message with five warnings. The toast also sits on top of the readiness list (shot).
Why it hurts: a false positive about completeness for a heritage guide; the author never sees what visitors will lack before it is live; the same panel that could answer ("what is missing") is not shown on DRAFT (R1-s10-05).
Recommendation: Activate opens a confirm dialog that names the Resource, lists blocking items (activation disabled) and warnings grouped by language with links, and says what visitors will see ("visible on the next manifest refresh"); post-activation toast reads "Activated with 5 warnings" and links to them. Never say "complete" if any item remains.
Likely files: `EditorShell.vue`, `useResourceEditor.ts` (`requestTransition`), `StatusChangeDialog.vue`, toast copy · Spec: `12` §4 "Activate a Resource" only specifies the POST and the 422 behaviour; a pre-confirm is additive · Effort M.

### R1-s10-04 — P1 — Translating hides the source text
Screen POI/Place editor, language tab Ελληνικά/Italiano · 1440 · Translator · Evidence: `shots/lang-tab__italian-pediment__1440.png`; steps: open `pediment`, tab Italiano: Title/Summary/Description empty, "default-language text visible?" = 0 matches. Verified persona report.
Observation: fields of the target language are empty boxes without the English text, without a "missing" marker, without "copy source" and without per-field progress. Tabs carry no completeness dots; completeness lives only in the side card.
Why it hurts: the translator must switch tabs back and forth or keep a second window; PRODUCT.md names this need explicitly.
Recommendation: under each target field show the default-language value as read-only "English (default)" text (collapsible, copyable), a "Missing" pill on empty fields, and `● ◐ ○` completeness marks on the tab itself. Optionally a two-column "source | target" view for non-default tabs (spec `12` §3 Translation workspace already does this globally).
Likely files: `TranslationsPanel.vue`, `useResourceEditor.ts` · Spec: no conflict · Effort M.

### R1-s10-05 — P1 — "What needs attention" exists only for ACTIVE records
Screen DRAFT POI/Place · 1440 · Content editor · Evidence: `shots/poi1-draft-indoor__1440__tall.png` (side column: status, Activate, Translations, Used in — no readiness); `EditorShell.vue` line `v-if="editor.resource.status === 'ACTIVE'"`. DRAFT text says only "Activate it once the default-language title is set."
Observation: the DRAFT is where the author works toward readiness, yet the single source of "what is missing" (`12` §5, `14` §4, BRIEF §2) is hidden. A DRAFT with no coordinates, Place or primary image shows nothing; an ACTIVE POI with no coordinates and no image also gets no readiness item (Placement and media are never flagged) — verify with backend readiness codes.
Why it hurts: authors discover gaps only after activation (see 03).
Recommendation: show the readiness list for DRAFT as "Before you activate" (blocking vs warnings), computed from the form (client) plus last-saved readiness (server); count badge in the sticky bar ("2 blocking · 5 warnings"); GAPS.md entry if the backend lacks a DRAFT readiness endpoint.
Likely files: `EditorShell.vue`, `platform/readiness.ts` · Spec: `12` §5 "the same codes appear … on the Resource form" · Effort M.

### R1-s10-06 — P1 — Narrow widths: side column falls 3,300+ px down; at 1024 the form is 330 px wide; fixed 236 px nav at 768
Screen POI/Place editor · 1024 / 768 / zoom200 · Kiosk operator on a tablet, translator · Evidence: `shots/poi-wc__top__1024.png`, `shots/poi-wc__768__tall.png` (height 4,201; Activate/readiness/Translations at the very end), `shots/poi-wc__top__zoom200.png`; metrics `mainW` 788 (1024) / 532 (768), nav 236 at both.
Observation: at 1024 the grid keeps two columns, so the form column is ~330 px (Title input clipped "(revised w"); at 768 the side column (readiness, Activate, translations) is below 4,000 px of form. At zoom200 header + menu take ~310 of 720 px, so about 400 px show the editor and no action bar exists.
Why it hurts: tablets are first-class (PRODUCT.md "tablets must remain fully usable"); readiness and Activate become unreachable; keyboard users tab through 60+ controls.
Recommendation: breakpoint at 1180 for two columns; below it show the readiness/status as a compact bar under the sticky header that expands into a sheet; side cards become tabs or an accordion; collapse the workspace nav to a drawer below 1024.
Likely files: `EditorShell.vue`, `WorkspaceNav.vue`, `ProjectLayout.vue` · Spec: `14` §4 200 % text scaling · Effort M.

### R1-s10-07 — P2 — "Preview in app" popover covers the field being edited and traps focus
Screen POI editor · 1440 · Content editor · Evidence: `shots/preview-popover__open__1440.png`, `shots/preview-popover__kiosk__1440.png`; box x 649-1209, y 247-636.
Observation: the card opens over the right half of the Title/Summary fields and over Status/Activate/Archive; a clear backdrop closes on outside click (verified) and Esc closes it and returns focus to the button (verified: persona "ignores Esc" is not reproducible when focus is inside; focus starts on "MOBILE"). It is aria-modal with a Tab loop, so CMS chrome is inoperable while open. The content is a minimal stand-in (title, place line, summary, no media, no triggers, "missing translation" marks not visible); Web and Kiosk show the same narrow layout.
Why it hurts: edit-and-compare needs open/close cycling; "preview of what visitors see" is thin; modal trap vs `14` §4 "CMS chrome remains operable while the frame has focus".
Recommendation: a docked right-hand preview pane (toggle in the sticky bar) that updates live beside the form; keep popover as the narrow-width fallback; mark missing translations in red inside the frame (`12` §3).
Likely files: `ResourcePreview.vue`, `EditorShell.vue`, `AppDialog.vue` · Spec: `12` §3 says "below the action", D-059 owner decision: needs a D-NNN · Effort M-L.

### R1-s10-08 — P2 — Layout jumps and four overlapping "pending" messages
Screen ACTIVE POI after first Save draft · 1440 · Evidence: `shots/poi1__active-dirty-top__1440.png` vs `shots/poi1__apply-confirm__1440.png` (title block 100 → 190 px, banner moves from y 205 to 238).
Observation: saving the first change adds a head chip on its own line (+37 px) and relabels the banner, shifting the whole form ~90 px under the cursor. "Unsaved changes", "Pending changes · edited by you", the banner ("You are editing a working copy"), the toast ("Pending changes saved") and the readiness live region say overlapping things.
Recommendation: reserve the chip space; one state line in the sticky bar ("Draft saved 12:41 · not yet applied" / "Unsaved changes"); keep the banner only for "visitors still see the live version" once.
Likely files: `PageHead.vue`, `EditorShell.vue` · Effort S-M.

### R1-s10-09 — P2 — Save draft / Apply / Discard: three states, three styles, unexplained disabled buttons
Screen ACTIVE POI · 1440 · Evidence: `shots/poi-active-wc__top__1440.png` (Save draft grey at 50 % opacity, 11 px text-link; Apply primary), `shots/poi-archived__top__1440.png`, `shots/place-active-outdoor__top__1440.png` (Apply changes disabled, pale, no reason).
Observation: Save draft, the primary persistence action, is a tiny uppercase text link inside a banner; "Apply changes" is the pill; DRAFT uses "Save". Apply stays enabled while the form is dirty and unsaved ("Not saved yet" in banner) — it is unclear whether it applies unsaved edits. Disabled buttons have no tooltip/reason. Discard is a red text link.
Recommendation: one button group in the sticky bar: [Discard] [Save draft] [Apply…]; Apply disabled until a Working Copy exists, with a visible line "Nothing to apply" / "Save draft first"; Apply confirm lists changed fields.
Likely files: `EditorShell.vue` · Spec: `12` §3 split (header Apply; banner Save draft/Discard) · Effort S-M.

### R1-s10-10 — P2 — Deactivate is styled as a primary action; where-used refusal arrives after the click
Screen ACTIVE POI/Place · 1440 · Evidence: `shots/deactivate-inuse-poi__1440.png`, side panel in `shots/poi-active-wc__1440__tall.png`.
Observation: Deactivate is the same filled purple as Activate; Archive is a red outline. Clicking Deactivate/Archive on an in-use record opens a dialog that only refuses ("Remove it from them first"), although the side card "Used in (3)" already knows the references. A Trigger owned by the POI itself (`QR code pediment-102`, DRAFT) is listed as a blocker next to Floor plan and Route; a dialog link opens the referrer in the same tab (leaving unsaved edits to the leave guard).
Recommendation: show "Used in 3 — remove them first" beside disabled Deactivate/Archive (spec `12` §4: "the action is disabled with the explanation"); style Deactivate as secondary; exclude the Resource's own triggers from blockers; open referrers in a new tab or keep the list as links with the guard.
Likely files: `EditorShell.vue`, `StatusChangeDialog.vue`, `platform/references.ts` · Spec: `12` §4 Archive or deactivate, D-037 · Effort S-M.

### R1-s10-11 — P2 — Leave guard and restore banner copy
Screen POI editor, dirty · 1440 · Evidence: `shots/unsaved-guard__after-nav-click__1440.png`, `shots/restore-draft-banner__after-reload__1440.png`.
Observation: the dialog says "If you leave now, they are lost" although D-024 keeps the draft in the browser and offers Restore on return; browser reload triggers the native `beforeunload` prompt. The restore banner dates the draft only by day ("12 Nov 2026"), no time. Restore/Discard are 11 px text links.
Recommendation: "Your changes stay in this browser and you can restore them, but visitors and colleagues will not see them" + "Save and leave" third button; time in the banner; real buttons.
Likely files: `EditorShell.vue`, `useResourceEditor.ts` · Effort S.

### R1-s10-12 — P2 — Placement ignores INDOOR Places and shows three sets of coordinates
Screen POI in INDOOR Place (Parthenon Gallery) · 1440 · Content editor · Evidence: `shots/poi1-draft-indoor__1440__tall.png` (Placement card shows "Site map" with outdoor Athens and lat/long).
Observation: a POI inside a floor-planned Place still gets the outdoor GeoPicker; floor-plan placement (x/y) is not mentioned, linked or shown. A geo-proximity trigger repeats latitude/longitude/radius with "Use this point's position". The map label "Site map" appears even when the Place's own map exists. With no coordinates the map opens on Athens with other POIs as hollow pins (clear), but the typed-coordinate fields have no validation message for `999` (see `shots/placement__invalid-lat__1440.png`: no inline error until Save).
Recommendation: Placement card adapts to the Place: OUTDOOR → map + coordinates; INDOOR → floor-plan thumbnail with this POI's marker, "Place on floor plan" link and x/y fields; inline range errors; geo trigger defaults from Placement with one "Same as point" toggle.
Likely files: `PoiEditorView.vue`, `GeoPicker.vue`, `TriggersCard.vue` · Spec: `12` §3 POI Placement; `03` §5 · Effort M.

### R1-s10-13 — P2 — Place editor: no INDOOR/OUTDOOR choice, inconsistent link preview, no children
Screen Place editor · 1440 · Evidence: `shots/place-outdoor__1440__tall.png`, `shots/place-indoor-plan__1440__tall.png`, `shots/create-place__typed__1440.png`.
Observation: spec `12` §3 asks for INDOOR/OUTDOOR then top-level/sub-place then name; both dialog and "Place setup" offer only "Level" (top-level / sub-place); environment is implicit in the Type select (all eight options shown regardless of linked map/floor plan, with the hint "unlink in Place setup first"). OUTDOOR shows an embedded map with "Edit map area"; INDOOR shows only a select and "Open floor plan" link. A parent Place (Acropolis Museum) shows no list of its sub-places or POIs although it is the natural place to reorder them; "Used in" lists only referrers.
Recommendation: first choice "Indoors / Outdoors"; filter Type by it; show a floor-plan thumbnail with POI count; add "Inside this place" card (sub-places and POIs, links, count).
Likely files: `PlaceEditorView.vue`, `CreatePlaceDialog.vue` · Spec: `12` §3 Place (deviation to confirm against D-0xx) · Effort M.

### R1-s10-14 — P2 — Language tabs lack the tab keyboard pattern and completeness marks
Screen all editors · 1440 · Evidence: `a18.mjs` (focus on Italiano, ArrowLeft: selection unchanged); all three tabs `tabindex=0`.
Observation: `role=tab` without arrow-key roving; each tab is a Tab stop; no dots on tabs; the per-language Audio narration rows live under the language-neutral Media card.
Recommendation: roving tabindex with Left/Right/Home/End, completeness glyph + text in each tab ("Italiano · 2 of 5"); put per-language media inside the language panel or label clearly.
Likely files: `TranslationsPanel.vue` · Spec: `14` §4 · Effort S.

### R1-s10-15 — P2 — Map and media keyboard/names
Screen POI/Place editor · 1440 · Evidence: `a20.mjs`: 6 tab stops inside the POI map (15 in the Place map); four audio "Choose" buttons all have the same accessible name (no per-language `aria-label`).
Recommendation: markers `tabindex=-1` except the pin; "Choose audio for Ελληνικά" labels; a "Skip map" link.
Likely files: `GeoPicker.vue`, `MediaSlots.vue` · Effort S.

### R1-s10-16 — P2 — Fixed-height textareas clip long text; empty media cards waste 440 px
Screen POI editor · 1440 · Evidence: `shots/poi-active-wc__top__1440.png` (Description cut mid-sentence, inner scroll), `…__tall.png` (media grid 270 px per row with a lone button).
Recommendation: auto-grow textareas (min 3 rows, max 12), character/reading-level hint only when useful; compact empty slots (see 02).
Likely files: `TranslationsPanel.vue`, `MediaSlots.vue` · Effort S.

### R1-s10-17 — P2 — Triggers card details
Screen POI editor · 1440 · Evidence: `shots/poi2-with-triggers-dirty__1440__tall.png`.
Observation: QR renders (public base URL set) with link, Copy/Download/Open; geo and beacon rows are correct, beacon is "Mobile app only". The beacon UUID placeholder runs under the adjacent "major" label (overlap); trigger rows have 11 px "×" removal buttons without names visible; "Save to get a generated code" appears for an unsaved QR; "AR scan target: camera recognition is deferred" occupies a permanent line.
Recommendation: wrap beacon fields on two lines; text "Remove QR code" buttons with confirm; move the AR note to a disabled chip tooltip.
Likely files: `TriggersCard.vue` · Effort S.

### R1-s10-18 — P2 — Readiness list is long, unordered, repeated per language
Screen ACTIVE POI/Place · 1440 · Evidence: `shots/lang-tab__italian-pediment__1440.png` (5 lines "…(Italiano)"), place with 8 items.
Recommendation: group by severity then language ("Italiano: 4 missing" expandable), blocking first, count in the bar; keep links per item.
Likely files: `EditorShell.vue`, `platform/readiness.ts` · Effort S.

### R1-s10-19 — P2 — Toasts are the only confirmation and cover content
Screen Save/Activate/Apply · 1440 · Evidence: `shots/place-new__activate-click__1440.png` (toast overlaps readiness items).
Recommendation: inline state in the sticky bar ("Saved 12:41") plus toast above bottom-right safe area; no overlap with the side column; keep live-region text.
Likely files: `AppToast.vue`, `EditorShell.vue` · Effort S.

### R1-s10-20 — P2 — Header meta and chips for new and long-titled records
Screen new Place/POI, long title · 1440 · Evidence: `shots/place-new-draft__1440__tall.png`, `shots/place-new__activate-click__1440.png`.
Observation: "version 0" on a record never saved; status chip drops to its own line when the title wraps; meta line prints a 90-character slug; side-panel slug breaks mid-word ("…-od / eon-garden…"); DRAFT chip is tiny and grey (11 px, lowest emphasis for the state that needs the most action). Redundant with side card (Status, Slug, Version).
Recommendation: hide version until ≥ 1; chip next to breadcrumb or in sticky bar; truncate slug with copy button; move meta (version, updated) into the side card only.
Likely files: `PageHead.vue`, `StatusChip.vue`, `EditorShell.vue` · Effort S.

### R1-s10-21 — P2 — Chrome consumes the viewport at zoom200 so editors have no room
Screen editors · zoom200 · Evidence: `shots/poi-wc__top__zoom200.png` (header + "Menu" ≈ 315 of 720 px).
Recommendation: collapse switcher into the menu at ≤ 700 CSS px; sticky bar replaces it. (Chrome belongs to s7; flagged because the editor depends on it.)
Likely files: `AppHeader.vue`, `ProjectLayout.vue` · Effort M.

### R1-s10-22 — P3 — 422 summary wording, 403/404 states
Screen editor error states · 1440 · Evidence: `shots/validation__server-422__1440.png`, `shots/load-error__403__1440.png`, `shots/load-error__404__1440.png`.
Observation: summary lines duplicate the label ("Latitude: Latitude must be…"); the summary is inserted above the language tabs and pushes the form down (fine because it takes focus and links work, but it is far from Latitude 1,700 px below); 403 reads "could not be loaded" with a raw detail, no "you do not have access" and no way back besides the breadcrumb; 404 has no button.
Recommendation: "Latitude must be between…" without prefix when message starts with the label; add "Back to Points of Interest" and access wording.
Likely files: `EditorShell.vue`, `useResourceEditor.ts` · Effort S.

### R1-s10-23 — P3 — Archived editor
Screen ARCHIVED POI · 1440 · Evidence: `shots/poi-archived__top__1440.png`.
Observation: a pencil icon on a read-only banner; two Restore controls (banner link, side button); a disabled Save pill shown; disabled inputs at low contrast hide the content the author wants to read.
Recommendation: lock icon; single Restore in the bar; hide Save; read-only values at normal contrast.
Likely files: `EditorShell.vue` · Effort S.

### R1-s10-24 — P3 — Micro-typography
Screen all editors · 1440 · Evidence: any shot.
Observation: card titles and field labels are 11 px uppercase with wide tracking (Status, Placement, Details, labels), helper text 12-13 px grey; the combination is hard to scan at 1280 and at 200 %. Text-links in banners are 11 px.
Recommendation: sentence-case 13-14 px labels, 15-16 px section titles; reserve uppercase for chips only.
Likely files: Tailwind classes in `EditorShell.vue`, `PoiEditorView.vue`, `PlaceEditorView.vue` · Effort S.

### R1-s10-25 — P3 — Create dialogs
Screen Create Place/POI · 1440 · Evidence: `shots/create-place__open__1440.png`, `shots/create-place__after-submit-empty__1440.png`, `shots/create-poi__empty-submit__1440.png`.
Observation (mostly good): Esc closes with focus return, empty submit shows inline errors, slug is derived from Greek title by transliteration. Nits: the Level cards are toggle buttons (`aria-pressed`) rather than a radio group; the Place dialog says nothing about INDOOR/OUTDOOR; the POI dialog's Place select is a 15-level indented flat list without search; Category is not asked.
Likely files: `CreatePlaceDialog.vue`, `CreatePoiDialog.vue` · Effort S.

## Proposed restructured editor (all Resource kinds)

Layout (1440): `[sticky bar] / [section rail 168 px | form column fluid ≤ 760 | context column 340 px, sticky]`.

1. **Sticky action bar (56 px, top of `<main>`)**: left breadcrumb → truncated title + StatusChip (icon + text); centre: one state line ("Unsaved changes" / "Draft saved 12:41, not yet applied" / "Saved") and readiness badge ("2 blocking · 5 warnings", opens the readiness sheet); right: [Preview ▾ toggles docked pane] [Discard] [Save draft | Save] [Activate… | Apply…]. DRAFT: Save + Activate. ACTIVE: Save draft + Apply, with Deactivate/Archive in an overflow menu ("⋯"), not as primary buttons. Honours `12` §3 split by keeping Apply in the bar's primary slot and Save draft / Discard as its secondary group.
2. **Section rail (left of the form, sticky; below 1180 px a horizontal tab strip)**: Texts · Placement (POI) / Place setup (Place) · Media · How visitors reach it · Details, each with a state badge (✓ complete, ! needs attention n, ○ empty) driven by readiness paths; scrollspy highlights the current one; the same rail works for Route (Stops), Guide (Story), Event, Category by swapping the section list, so `EditorShell` owns the rail and each editor supplies sections.
3. **Texts first, with a source column**: language tabs with completeness marks; for non-default tabs a read-only "English (default)" line under each field with Copy source.
4. **Placement second** for POI/Place (the data that makes an item appear on the map), adapting to INDOOR (floor-plan thumbnail + x/y) or OUTDOOR (map + lat/long); Category beside it; geo trigger linked to it.
5. **Media third**: compact slot row, filled slots expand; audio per language inside the language panel.
6. **Triggers fourth, Details last (collapsed by default, with filled-count like Practical details)**: slug and internal name rarely change; slug warning remains.
7. **Context column (sticky)**: Readiness ("Before you activate" for DRAFT, "What needs attention" for ACTIVE, grouped), Translations completeness (clicking switches tab), Where used (count + blockers), then metadata (status, version, updated, created) in a collapsed card. Below 1180 px it collapses into the readiness sheet launched from the bar.
8. **Activation flow**: Activate… opens a dialog with blockers (disabled) / warnings by language / what visitors see; archive/deactivate disabled with the where-used explanation inline.
9. **Preview**: docked right pane (toggle, remembers choice) replacing the covering popover at ≥ 1280 px; popover stays for narrower windows.
10. **Height at 1440**: Texts (~550 px) + Placement (~350) + compact Media (~200) + Triggers (~250) + collapsed Details (~60) ≈ 1,400-1,500 px versus 2,300-2,750 today, with every section one click away and the bar never leaving view.

## What works (keep these)
- Working Copy model end to end: Save draft creates it, Apply and Discard each confirm and name the Resource (`shots/poi1__apply-confirm__1440.png`).
- Error handling: 422 summary with links to fields and request id, per-field messages, focus moves to the first invalid field (`a16.mjs`: `f-slug`); 409 mine/current dialog; 503 keeps the form and says so; offline banner disables Save and keeps the form.
- Leave guard dialog on in-app navigation, restore-draft banner with Restore/Discard, `beforeunload` on reload.
- Readiness items are links that switch language tab and focus the field (verified).
- Create dialogs: Esc, focus return, inline errors, Greek-to-slug transliteration; slug uniqueness hint.
- Triggers card: QR renders with link/Copy/Download/Open, per-surface "Runs on", beacon marked mobile-only, greyed AR target with reason.
- GeoPicker: click/drag/arrow keys plus typed coordinate fields (`14` §4), other POIs as hollow pins.
- Where-used refusal dialog lists referrers with kind, status and links.
- Axe clean on all four editor states; labels visible; no horizontal overflow at any viewport; Esc closes the Preview popover and returns focus to its button.

## Unverified / could not test (and why)
- Drag of the pin and floor-plan placement of a POI (outside this group; floor-plan editor belongs to Maps).
- Real 409 against the live API (forced through `page.route`; `currentVersion` rendering differed from the mock, it showed "version 0").
- Asset selection and upload from the picker (opened, filtered list seen; picking an Asset would mutate shared media; own-record only would need a new upload).
- Reordering gallery images with keyboard (no images in own records; gallery slot not populated).
- Apply with unsaved edits (not run, to avoid changing a pre-existing record; unclear from UI whether it saves first, see R1-s10-09; run on own ACTIVE POI in Round 2).
- Map tiles on the blank Placement map without coordinates appeared empty in one capture (`poi1-draft-indoor`); likely tile load timing, not confirmed.
- Place editor "Edit map area" and the New map geocoding result flow (dialog opened and cancelled; search needs the external geocoder).
- The persona claim "Preview ignores Esc" was not reproduced (works when focus is in the dialog; focus enters on open); if focus is moved to the page behind via mouse, the click already closes it.
