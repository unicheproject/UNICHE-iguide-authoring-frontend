# Round 2 implementation plan: iGuide CMS UX overhaul

Planner output. Inputs read: `BRIEF.md`, `user-comments.md` (round 1: "go for round 2", no screen comments), `round-2/audit/consolidated.md` (94 unique findings, 0 P0, 31 P1; p6-edge addendum and C2-94 included), `scoreboard.md` (R1 column), `round-1/plan/plan.md` §1-§2, §9, §10, `round-1/implementation/system.md`, `round-2/audit/design-system/cleanup.md`, `AGENTS.md` §4, specs `12` §3-§6 and `14` §4, `DECISIONS.md` (last D-085), `QUESTIONS.md` (last Q-016), `GAPS.md` (last G-036), the backend paging contract (read-only), and `src/`. Nothing here edits source.

Mode: **Operate**. Round 2 refines; it adds no visual direction. Emphasis: consistency, interaction detail, states, keyboard and screen-reader behaviour, microcopy, density, motion. Craft floor applies to every package: no eyebrow labels, no side stripes, no nested cards, no gradient text, no glyph icons, no modal where an inline panel works, tokens only (no `text-[Npx]`, hex, `z-[N]`, `shadow-[`), every interactive component has default, hover, focus, active, disabled, loading, error.

Contents: 1 Direction refinements and DECISIONS; 2 Wave 0; 3 Wave 1 packages; 4 Deferred, rejected, QUESTIONS and GAPS; 5 Execution protocol and definition of done; 6 File-ownership table.

---

## 1. Direction refinements and DECISIONS entries

Round 1 direction stands (calm institutional workbench, purple only for the one primary action, selection and focus; status = word + drawn icon + colour; Montserrat; 14 px body; 8 px controls). Round 2 sharpens six rules that the audit showed are not yet *true everywhere*:

1. **One number, one sentence.** Every count or completeness statement (tab mark, side card, header badge, confirm, toast, list dots, Dashboard) comes from one function and one sentence template.
2. **The chrome never costs more than 15 % of the viewport.** Sticky stacks are measured and published (`--sticky-stack-h`), `scroll-padding-top` follows it, and below 800 px of height the Working Copy banner scrolls away.
3. **An icon-only control is 32 px at least (44 on coarse pointers) and every row link has a 44 px hit area.**
4. **Errors are fixed sentences chosen by `code`/status plus the request id.** The server's `detail` is shown only for mapped 422 field paths. Same rule everywhere (cards, toasts, dialogs).
5. **Focus never falls to `<body>`.** Every action that removes or replaces its opener names where focus goes (one `restoreFocus` with fallback chain).
6. **Dates are written one way:** 24 h time, UK day-month-name, in the UI language; inputs show their format.

Direction details that are new but inside the incumbent: Working Copy banner collapses to one line under 800 px height; "Preview in app" is a full-width panel below the action (still "below the action", `12` §3); Dashboard status card ends with the way to go live (link to out-of-scope Launch, allowed); first-run guide stays until step 5 or until dismissed in browser storage (a per-viewer convenience, not a token); lists page their rendered rows (50) over the complete set; motion: reduced-motion keeps 120 ms opacity fades, drops transform and spin.

### DECISIONS.md entries to add (append-only, one heredoc per entry, only the ids reserved to you)

| Id | Owner | Title | Paragraph (what changed and why) |
|---|---|---|---|
| D-086 | W0-A | Hit areas and forced colours completed | `size-control` is a real token (`spacing.control`), so icon buttons are 40 px (44 coarse); a `.hit-44` utility gives text links a 44 px target through padding/`::after`; a build-time check (`scripts/check-css-tokens.mjs`, `make check-css`) fails when a `size-*|h-*|w-*|min-h-*|z-*` class used in `src/components/ui/**` has no rule. The forced-colours block gets a 1 px `CanvasText` boundary for dialogs, menus, popovers, toasts and alerts, `Highlight`/`HighlightText` for `[aria-selected=true]` and `aria-current`, and a 2 px border on filled buttons. Reduced motion keeps 120 ms opacity fades. Why: C2-01 left every icon button at 18 px; C2-02 left dialogs borderless. Spec `14` §4 (44x44, state not by colour). |
| D-087 | W0-A | Errors are sentences chosen by code, never server text | `describeError` maps by `code` and status (403, 404, 409, 422, 429, 500, 502, 503, 504, network) to fixed English sentences with the request id. 503 reads "The platform is busy or down for maintenance"; "not reachable" only for network failures. `detail`/`title` of a problem is never rendered, except `fieldErrors[].message` at a mapped field path of a 422. One `ProblemAlert` component renders it in cards, dialogs and toasts. Why: C2-09 showed stack traces and secrets in the UI; BRIEF hard constraint, `07` §15, AGENTS §4.5. |
| D-088 | W0-A | One date and time formatter | `formatDate`, `formatTime`, `formatDateTime`, `formatDateTimeRange` in `lib/format.ts` are the only formatters: 24 h, `en-GB` day-month-name-year ("16 Nov 2026, 14:05"), in the Project's time zone where one exists, the author's elsewhere. Native date/time inputs are labelled with their format (`DD/MM/YYYY`, `HH:MM`) or replaced by typed fields with day, month-name and 24 h parts (Event editor). Why: C2-52, C1-39 (12 h and 24 h, three formats on a page). |
| D-089 | W0-B | Sticky stacks are measured and short | Editor: header (56 px, one line, title wraps inside it at most to two lines in the content, not the header) plus Working Copy banner. Below 800 px viewport height the banner is not sticky and is one line; above, it is sticky at 40 px. The stack height is published as `--sticky-stack-h` on `<html>` and `main { scroll-padding-top }` reads it. Lists stick only the title row and the table head. `z-raised` (5) sits below `z-sticky` (10). Why: C2-05, C2-06; WCAG 1.4.10 and 2.4.7. Replaces the fixed 96 px constant of D-074. |
| D-090 | W0-B | One readiness and completeness model | `platform/completeness.ts` is the only place that counts "things to fix": blockers, warnings, per-language missing texts including Route stop texts, Guide story blocks and asset alt text. Tab marks, side card, header badge, Activate/Apply confirm, toast, list dots and Dashboard call it; sentence: "N to fix before activating" / "N warnings, nothing blocks". A resource's own triggers are never "used by" blockers. Why: C2-33, C2-34, C2-59. |
| D-091 | P3-core | List paging, sort direction and counts | List loaders keep reading every page of the API (`size=200`, loop to `totalPages`, a test proves page 2 is read); the table renders 50 rows per page with a pager and `page` in the URL, "Showing 51-100 of 184". Sorts carry a direction; Updated is newest first; denominators match the active segment. Reason for client-side windowing instead of server paging: search across languages, segment counts, the translation worklist, trees and manual order need the whole set; server paging is recorded as G-041. Why: C2-36, C2-37, C2-39. |
| D-092 | P2 | Dashboard says how the visitor app goes live | Status card: no blockers and at least one ACTIVE resource while the visitor app is Draft -> primary "Go to Launch" with one sentence; "Ready" also offers Preview. The Catalogue Project status chip leaves the h1; the one status line is "Visitor app: Draft/Live · Content revision N". First-run guide stays until step 5 is done or the viewer dismisses it (browser storage, per Project); steps 3-5 tick from data; "Activate content" becomes "Show drafts". Why: C2-24, C2-25, C2-26. `12` §3 stays (five steps, one action). |
| D-093 | P8 | Preview in app is a full-width panel with fit-width | The panel opens below the action across the editor's content width at every viewport width, with Expand at every width; Kiosk and Web default to "Fit width" with an inner scroll; options that give the same result are hidden; "Test in preview" opens `/preview?trigger=<id>` which selects the surface, selects the trigger and fires it. The stand-in is `inert`/`aria-hidden` until Interact, Esc inside the frame stops interacting. Why: C2-61, C2-88 to C2-92; `12` §3 ("below the action"), `14` §4. |
| D-094 | P7a | Media worklist names what is missing | Each Media row (grid and list) says "Italiano: alt text, title missing" from the completeness model; one definition of "complete" (title + alt + caption where required) across tab, worklist and Asset editor; "Used in N" is labelled with its source; list view is a URL state; the table has no overprinting column (minimum widths, chips inside the Status cell). Why: C2-51, C2-75, C2-81, C2-82. |
| D-095 | P4s | Editor save, conflict and restore model | Dirty -> Save draft primary and Apply secondary ("Save and apply" when both); Apply is truly disabled with a reason when nothing is pending; 409 is a three-way merge: only fields I changed conflict, "Reload their version (discards your 1 change)", request id; Restore-draft is one compact row inside the banner area that dismisses on save; trigger and asset writes run in parallel with a partial-failure sentence; "Revision N" replaces "Version 0". Why: C2-56, C2-62, C2-63, C2-65, C2-73. |
| D-096 | P6 | Maps: keyboard and touch model | Non-draggable layers are not in the Tab order (W0-B); one Tab stop for the pin group; coarse pointers use two-finger gestures ("Use two fingers to move the map") or a "Move map" toggle, pin drag stays; visitor-filter is one grouped disclosure with checkboxes; floor-plan "Place" buttons carry the item name. Why: C2-58, C2-84, C2-85, C2-86; `14` §4 coordinate fields stay. |
| D-097 | P1 | Session, picker and loading states | No silent defaults in Create Project (no preselected Template or surfaces without "Recommended"); skeletons mirror the final layout and announce "Loading X"; nav is `inert` until the Project is confirmed; session-ended dialog is dismissible with a secondary action; the authorization code leaves the address bar (`history.replaceState`). Why: C2-14, C2-15, C2-21, C2-22. |
| D-098 | P5a | Removing a stop or block is undoable where you are | Undo bar anchored to the list head (and focused for 4 s), Ctrl/Cmd+Z undoes; Route map pins fan out and the map card states stops without a position by link. Why: C2-70, C2-71. |
| D-099 | spare | reserved for the orchestrator | |

Order of verification: D-086 to D-090 must exist before Wave 1 starts.

---

## 2. Wave 0: root causes first (two agents, disjoint files, run in parallel, then verified)

Gate after Wave 0 (orchestrator): `make typecheck`, `make build`, `make check-css`; three screenshots (POI list at 1280x720, POI editor at zoom200, a dialog under forced colours); only then Wave 1.

Contract between the two agents: W0-B publishes `--sticky-stack-h` on `<html>` (JS, `ResizeObserver`); W0-A adds `main { scroll-padding-top: var(--sticky-stack-h, 0px) }` and the `.hit-44` utility to `src/style.css` (W0-A owns `style.css`; W0-B touches no global CSS and uses component `<style>` blocks). W0-B calls `formatDateTime`/`formatTime` from `lib/format.ts` (W0-A keeps old names exporting the new behaviour, so both compile at any moment). W0-B uses `describeError`/`ProblemAlert` the same way.

### W0-A Foundations, errors, focus, time, chrome store race (size L)

Closes: C2-01, C2-02, C2-04, C2-07, C2-09, C2-10 (copy part), C2-12, C2-13, C2-16, C2-18, C2-20, C2-52, C2-57, C2-76 (autofocus rule), C2-94 (loader API), C2-03 (duplicates only), C2-23 (no; Wave 1).

| # | Work | Files | Acceptance (checkable) |
|---|---|---|---|
| A1 | `spacing.control` and `size.control` tokens; `Button` `icon` uses `size-control`; `WorkspaceNav` `min-h-header` -> `h-header`; remove per-call `size-8`/`min-h-8`/coarse patches in `editor/ReorderControls.vue`, `editor/RemovedBar.vue` (MediaSlots patch is P4's); `.hit-44` utility; coarse block 44 px for links | `tailwind.config.js` (also `z-raised`, `shadow-drop-before/after`), `src/components/ui/button/index.ts`, `Button.vue`, `WorkspaceNav.vue` (one line), `editor/ReorderControls.vue`, `editor/RemovedBar.vue`, `src/style.css` | Playwright probe on the POI list: every icon-only `button` has `getBoundingClientRect()` >= 32 px at 1440 and >= 44 px with `pointer: coarse`; `.hit-44` element hit box >= 44 x 44 |
| A2 | CSS-build check: build Tailwind output and fail when a `size-*`, `h-*`, `w-*`, `min-h-*`, `z-*`, `shadow-*`, `rounded-*` class used in `src/components/ui/**` or any file listed in cleanup.md section A has no rule; add `make check-css` and a `package.json` script (no installs) | `scripts/check-css-tokens.mjs` (new), `Makefile`, `package.json` (scripts only) | Re-introducing `size-control` without the token makes `make check-css` exit 1 |
| A3 | Forced-colours block: 1 px `CanvasText` border on `[role=dialog]`, `[role=alertdialog]`, `[role=menu]`, popover content, toast, `Alert`; filled buttons 2 px `Highlight`/`ButtonText`; `[aria-selected=true]`, `[aria-current]` get `Highlight` + `HighlightText`; padding on disclosure and sort-header boxes; reduced motion: keep 120 ms opacity, drop transform and spin (C2-04) | `src/style.css`, `ui/tabs/*`, `ui/button/*`, `ui/dialog/FormDialog.vue` (border class only) | `forcedColors: "active"` screenshots of Create dialog, a menu, a toast, POI editor header and Preview tabs: every boundary and the selected tab visible; `prefers-reduced-motion`: skeleton does not pulse, dialog fades in 120 ms |
| A4 | Errors by code: rewrite `describeError` per D-087 (status table, 503 wording, network wording, `detail` never shown, rejected value never echoed); `ProblemAlert` (title, sentence, request id with copy, optional Try again); replace raw-detail rendering in `DashboardView errorText`, `PreviewView`, `MediaView`, `UploadDialog`, list views and editor save handlers *by contract* (Wave 1 packages call `ProblemAlert`; W0-A fixes only shared call sites: `api.ts`, `errors.ts`, `AppToast`, `ui/alert`, `ui/state-card`) | `src/lib/errors.ts`, `src/platform/api.ts` (describing helpers only), `src/components/ui/alert/ProblemAlert.vue` (new), `AppToast.vue`, `src/stores/toast.ts`, `src/lib/glossary.ts` | Unit-style probe through `page.route` returning 503 with `detail: "NullPointerException at X"` and 403 with `detail: "Not allowed for secret-user-123"`: neither string appears in the DOM (grep the page text), request id does; 503 text contains "busy or down for maintenance" |
| A5 | Toasts: identical toasts collapse with a count ("x3"); one announcement (toast role xor `say()`); offset above sticky footers via `--toast-offset-bottom`; no 12 h time; body never server `detail` | `AppToast.vue`, `src/stores/toast.ts` | Triggering the same error five times shows one toast "x5"; the live region text changes once |
| A6 | Focus: `restoreFocus(opener, fallbacks?: string[])` tries opener, then each fallback selector (`[data-focus-fallback]`, neighbour row, `main h1`), then `main`; `focusAfterRemoval(container, index)`; StateCard takes focus on its `h1` on mount (C2-13); `ConfirmDialog` claims focus after a popover's focus return (C2-18); `AppDialog` initial focus never lands on a hidden input (C2-76): first visible focusable, else heading | `src/lib/focus.ts`, `ui/state-card/StateCard.vue`, `ConfirmDialog.vue`, `AppDialog.vue`, `stores/confirm.ts` | Keyboard run: open Upload dialog -> focus is on "Choose files" or the dialog heading; Esc from a confirm opened from the switcher returns to the switcher button; no step of the C2-57 list ends on `<body>` after W0 for shared paths (verified fully in Wave 1) |
| A7 | Duplicate landmarks: `AppDialog` header becomes `div` (user menu stays P1) ; `ui/popover` `aria-labelledby` reaches `role=dialog`, empty `aria-controls` removed | `AppDialog.vue`, `ui/popover/*` | axe on the switcher open: no `aria-dialog-name`, no `landmark-no-duplicate-banner` |
| A8 | Projects store race: `loadProjects()` merges instead of replacing `state.groups`, or `doLoad` calls `ensureDetailed([currentId])`; chip and tab title come from the detail the layout holds; skeleton time-boxed (3 s) with "Loading app status", nothing on read failure or error pages; `routeAnnouncer` never drops the Project name; unknown routes and invalid project id -> 404 (C2-13); 404 clears the Project label and chip | `src/stores/projects.ts`, `src/views/workspace/ProjectLayout.vue` (logic only; skeleton mirror is P1), `src/lib/routeAnnouncer.ts`, `src/router.ts`, `src/App.vue` | Reload `/projects/<id>/pois` three times (Populated and Empty): chip shows the status within 2 s every time; `document.title` = "Points of interest · <Project> · iGuide CMS" on first paint after load; `/projects/not-a-uuid` shows the 404 card with focus on its h1 |
| A9 | One date/time formatter per D-088; callers in shared files only (`AppToast`, `EditorShell` is W0-B); typed-field component `DateTimeFields.vue` for the Event editor (P5b uses it) with visible format hints, `aria-describedby`, 24 h | `src/lib/format.ts`, `src/components/ui/field/DateTimeFields.vue` (new, `ui/` is W0-A) | One page (Event editor) shows no "AM/PM"; every date matches "D Mon YYYY"; the date input names its format in its label/hint |
| A10 | Languages loader: `useProjectLanguages` gets `error` and `reload()` additively (out-of-scope screens unaffected); a failed read never resolves to "no languages" | `src/workspace/useProjectLanguages.ts`, `src/platform/languages.ts` (read path only) | `page.route` abort on `/languages`: composable exposes `error` set, `languages` stays `null`, never `[]` |
| A11 | Glossary: pre-seed every hint the packages need (Content revision, Pending changes filter, Working Copy, Geo-proximity, Beacon, preview surface, trigger, Visitor app vs Application, Revision) so no package edits `glossary.ts` | `src/lib/glossary.ts` | Keys exist; a probe lists them |
| A12 | Dead duplicates that confuse ownership: delete `src/components/ReorderControls.vue` (the root duplicate; confirm no importer) | `src/components/ReorderControls.vue` | `grep -rn "components/ReorderControls" src` empty; build passes |
| A13 | e2e: `e2e/touch-and-forced-colours.spec.ts` (icon-button size, forced-colours dialog border, coarse 44 px); update `e2e/screens.spec.ts` selectors | `e2e/touch-and-forced-colours.spec.ts` (new), `e2e/screens.spec.ts`, `e2e/support/*` | Written, typecheck passes; not run (needs Keycloak) |

QUESTIONS.md Q-017 to Q-020 and GAPS.md G-037 to G-042 are appended by W0-A (section 4), plus D-086, D-087, D-088.

### W0-B Sticky stacks, readiness model, editor-side root causes (size L)

Closes: C2-05, C2-06, C2-33, C2-34 (model, tab marks, side card, confirms), C2-58, C2-59 (frontend part), C2-21 (list thead during load: only the sticky part).

| # | Work | Files | Acceptance |
|---|---|---|---|
| B1 | Editor sticky rule per D-089: banner non-sticky and one line below 800 px height (and when zoom >= 150 %, same media query because zoom shrinks CSS height); header single line, no 56 -> 63 px jump when the banner text wraps (banner text fixed-length; wrapping goes to the card); publish `--sticky-stack-h`; side column `top` and `max-height` read it; sections use `scroll-mt-[var(--sticky-stack-h)]`; `z-raised` token used by Route editor line 787 (replace `z-index: 10`) | `editor/EditorShell.vue`, `editor/WorkingCopyBanner.vue`, `editor/EditorSection.vue`, `editor/EditorSectionNav.vue`, `tailwind.config.js` is W0-A's: A adds the `z-raised` (5) token and the `shadow-drop-before/after` shadows in A1, W0-B and Wave 1 only use the class names | At 1280x720, 1024x768 and zoom200 (640x360 CSS px): stuck area is <= 56 px (header only) and <= 15 % of height at every size >= 800 px (banner 40 px + header 56 = 96 of >= 800 is 12 %); Tab through the POI form at zoom200: the focused field is never under the header (`getBoundingClientRect().top >= stack height`); Route editor drag handles show above their row and below the header |
| B2 | List toolbar compaction: stick only title row + `thead` (about 100 px) at top 56; filters in one row with the overflow in a "Filters" popover at < 1180; fix the 24 px sliver (the `top` of the head equals measured toolbar height); publish `--sticky-stack-h` in lists too | `list/ListToolbar.vue`, `styles/list-table.css` | POI list at 1280x720: first row fully visible under the sticky area after scrolling 300 px; stuck area <= 112 px; row 2's text is never half-clipped |
| B3 | `platform/completeness.ts` (new): `completenessOf(resource, languages)` returns `{ blockers, warnings, perLanguage, lines }` including Route stop texts, Guide story blocks (empty story = warning until G-039 is answered), asset title/alt per language; `countIssues(issues)`; `issueSentence(counts)`. `readiness.ts` gets `NAVIGATION` in `ReadinessResourceType`, `describeIssue` reuses the sentence. Asset `missingTextIn` in `assets.ts` delegates to it (single line) | `src/platform/completeness.ts` (new), `src/platform/readiness.ts`, `src/platform/assets.ts` (function at ~L301 only) | One resource with 3 blockers + 4 warnings shows the same numbers in header badge, side card, Activate confirm and toast (assert equal strings in a probe); Guide with 5 empty blocks is not "Complete"; tab mark counts stop texts |
| B4 | Wire the model: `ReadinessList`, `ActivateDialog`, `EditorShell` (header count, toast text, tab marks via `completenessOf` not `data-path` scraping, `goToNextMissing` finishes the current language first - the "Next missing: Italiano" label itself is P4s), `EditorStatusCard` (no new copy), `TranslationsPanel` (marks only), `StatusChangeDialog` (adds `blockedReason` and optional `reviewTo` props: Activate disabled with reason when alt is missing; "Review in editor" link; blockers before warnings; no raw enum "ACTIVE") | `editor/ReadinessList.vue`, `editor/ActivateDialog.vue`, `editor/EditorShell.vue`, `editor/EditorStatusCard.vue`, `editor/TranslationsPanel.vue`, `StatusChangeDialog.vue` | Same as B3; Activate of a DRAFT image without alt is disabled with "Add alt text in English first" |
| B5 | Own triggers never block: when `blockedBy.references` contains triggers whose `targetResourceId` is the item's own id, filter them client-side; if the API's refusal then has none, the Deactivate button is enabled; sentence template fixed ("Used by 1 route. Choose another category in that route first.") ; "Used in" shown once | `workspace/useResourceEditor.ts`, `editor/EditorStatusCard.vue` (the "used by" sentence builder; one line) | POI whose only users are its own QR/geo trigger: Deactivate enabled; Category used by 1 route shows the fixed sentence; if the backend still refuses, the refusal shows "Deactivate the QR code first" with a link and G-037 is recorded |
| B6 | Map Tab stops: layers of other POIs are non-interactive (`interactive:false`, `keyboard:false`, `tabindex=-1` on `leaflet-interactive` paths), only the draggable pin and Leaflet zoom are focusable; nearby POIs available as a list "Nearby points of interest (n)" in a disclosure; "Skip map" link | `map/GeoMapCanvas.vue`, `GeoPicker.vue` | Count Tab stops from Save to the end of the Placement card on the POI editor: <= 8 (was 40-47); Maps editor unchanged |
| B7 | Delete dead duplicates in W0-B's own area if any (none) | | |

QUESTIONS and GAPS appends are W0-A's. D-089 and D-090 are W0-B's.

---

## 3. Wave 1 packages

Common to all: import W0 primitives only; every screen state screenshotted at 1440, 1280, 1024, 768, zoom200, plus forced-colours and reduced-motion for the principal state; axe clean (`e2e/support/a11y.ts`); recorded keyboard run; icon-only controls >= 32/44; `ProblemAlert` for every error card; request ids; `restoreFocus` for every opener; report at `ux-audit/round-2/implementation/<package>.md`; e2e selectors updated where markup changes (cannot run here, say so); never weaken a test; no API client changes beyond thin wrappers; no `any`; DRAFT/ACTIVE/ARCHIVED words; British spelling. A package that needs a file owned elsewhere writes a request in its report and uses the documented contract.

Batches (at most 6 concurrent; lowest scores first): **batch A** = P7a, P7b, P2, P1, P3-core, P4s; **batch B** (as slots free) = P8, P6, P3a, P3b, P4, P5a, P5b. P3a and P3b start after P3-core lands its contract (`ListTable`, `ListToolbar`, `useListQuery` APIs listed in P3-core); P4, P5a, P5b start after P4s publishes the contract below.

Contract of P4s (stable for the editors, only additions): `EditorShell` props/slots unchanged; new optional props `restoreNotice`, `nextMissingLabel`; `RemovedBar` keeps props, gains `anchor`; `TranslationsPanel` unchanged props; `useResourceEditor` return shape unchanged plus `partialFailure` and `lastSavedAt`.

### P7a Media library and upload (size L) [Media library 61, Upload dialog 69]
- Closes: C2-51, C2-75, C2-77, C2-79, C2-82, C2-83 (toolbar part), C2-40 (Media), C2-49 (Media select), C2-09 (Media, Upload), C2-57 (Upload anyway/Skip/Reset), C2-21 (Media loading).
- Changes toward 90:
  1. List view: Name min 14 rem, Status cell holds "Needs attention" chips (no separate 0-76 px column), "Used in" min 9 rem and wraps; grid and list both show per-row "Italiano: alt text, title missing" (from `completeness.ts`); "Needs translation in" and "Search in" are one Language control with a visible label; "(1 archived)" wording instead of "Showing 48 of 61 (62 in the library)"; reserved slot for "in [language]" so the toolbar does not jump; `view=list` in the URL; toolbar hidden when the library has zero files; "Clear filters" once.
  2. Upload dialog: formats table collapses after files are added; log is sr-only with the live region; "Done" -> "Close"; Skipped row offers "Undo skip", not "Retry"; "Upload anyway, tool.exe" accessible name starts with the visible text (2.5.3); focus after Upload anyway/Skip goes to the next held row, after Reset to the select; 503 shows `ProblemAlert`; Decorative effect text visible before the confirm.
  3. States: loading skeleton with thead, empty library with upload CTA, error with request id and Try again, offline.
- Files: `media/MediaView.vue`, `media/UploadDialog.vue`, `media/UploadEntryRow.vue`, `media/UploadLimits.vue`, `media/DescribeNowDialog.vue`, `media/AssetThumb.vue`, `workspace/useAssetUpload.ts`, `platform/assets.ts`, `e2e/media.spec.ts`.
- Acceptance: at 1280 and 1024 the list view has no overlapping cell (probe: no two cell boxes intersect); upload dialog first focus is not an `input[type=file]`; axe `label-content-name-mismatch` clean; keyboard run from Library -> upload 2 files -> Upload anyway -> Close never leaves `document.activeElement === body`.
- Constraint check: `12` §3 Media library; `14` §4 live-region for uploads; D-080 pattern; no analytics.

### P7b Asset editor and picker (size M-L) [Asset editor 66, Asset picker 68]
- Closes: C2-78, C2-80, C2-81 (label), C2-83 (editor), C2-34 (asset), C2-51 (Translations card, Next missing), C2-55 (Decorative), C2-57 (picker attach image), C2-09 (editor).
- Changes: alt text field above the fold at <= 1024 (preview <= 25 vh or thumbnail row below 1100 px); Decorative moves into the alt-text card; DRAFT asset without alt: Activate disabled with the reason from `blockedReason` (B4); Translations card and Next missing on the Asset editor; readiness accordion labelled by its state; "Used in 8" with a tooltip that explains 8 vs 7 (G-030); picker tiles are one roving Tab stop (arrow/Home/End), unnamed hidden input removed from the Tab order, "No alt text" chip on tiles, view toggle inside Filters, sticky footer only on short viewports, focus lands on the new Replace/Clear button after attach.
- Files: `media/AssetEditorView.vue`, `media/AssetPickerDialog.vue`, `media/AssetPreview.vue`, `components/ResourcePickerDialog.vue` is P5a's (not touched).
- Acceptance: at 1024x768 alt field top < 768 px without scrolling; picker first Tab reaches the tile grid in one stop, 20 tiles take 1 Tab; zoom200 picker body shows >= 4 tiles' rows.
- Constraint check: `14` §4 labels and alt; `12` §3 Media library.

### P2 Dashboard and first run (size M) [Dashboard 64, first run 67]
- Closes: C2-24, C2-25 (Dashboard part), C2-26, C2-27, C2-28, C2-29, C2-30, C2-31 (Dashboard), C2-32, C2-09 (Dashboard card), C2-21 (Dashboard skeleton), C2-73 (Dashboard queries in parallel).
- Changes: status card per D-092 (four states, one primary action, the sentence names the consequence; "Go to Launch" when no blockers and ACTIVE > 0; Ready also offers Preview; "and 3 more" is a link; blocked card copy plain); h1 loses the green Project "Active" chip; "Visitor app: Draft · Content revision N" with HelpHint; first-run guide persists until step 5 or dismissed (browser storage key per Project, wrapped in try/catch), steps 3-5 tick from data, step buttons open the create dialogs with `?create=1` (contract with P3a/P3b), default POI Place = the only Place, "Activate content" -> "Show drafts"; Waiting for you to apply: fetch pending for every kind sorted by saved time (all pages), title-only link text, "Showing 10 of 15" + link to the pending-filtered list; warnings: `groupIssues` yields one row per Resource ("Italian: Description, Summary"), field named, kind prefix dropped, `PENDING_WORKING_COPY` warnings removed, de-duplicated, Project warnings link to their setting; counts strip "10 active · 8 draft", zero counts fully grey, strip above pending/warnings on empty and drafts-only Projects, counts above the 10-row table below 1100; Dashboard item links 44 px hit area (`.hit-44`); settings 409 no longer silently drops its footer line; skeleton mirrors the layout and announces "Loading dashboard".
- Files: `views/workspace/DashboardView.vue`, `views/workspace/dashboard/*` (all six), `platform/dashboardData.ts`, `platform/readiness.ts` (after W0-B: `groupIssues` only), `platform/workingCopies.ts` (read), e2e none.
- Acceptance: Populated with 366+ warnings shows <= 40 warning rows and every row unique; first-run guide remains after creating a DRAFT Place and POI and shows steps 1-2 ticked, step 3 current; Dashboard h1 contains no "Active"; the pending list's newest item (saved last) is in the top 3.
- Constraint check: `12` §3 Dashboard (status card, one action, <= 3 items, five-step guide, counts row, pending only when present); "Go to Launch" links to an out-of-scope screen (allowed); `contentRevision` one line; no recompute button; G-023/G-024 absences stay documented.

### P1 Chrome, session, picker, Create Project (size L) [Toasts/dialogs/skeletons 62, Offline 69, SSO 68, Picker 72]
- Closes: C2-08, C2-11, C2-14, C2-15, C2-17, C2-19, C2-21 (layout skeleton, nav inert, logo), C2-22, C2-23 (slug placeholder), C2-25 (switcher chip), C2-13 (copy: 404 links the Portal), C2-18 (switcher side).
- Changes: provisional counts before grouping and "Setup not checked" for unknown (G-029 limit stated); switcher list `max-height: calc(100dvh - 8rem)` (shows >= 8 rows); "Resume initialization" first in "Needs setup"; user menu uses the Radix dropdown pattern (ArrowDown/Esc, focus return; `div` not `header`); "Off" nav items are one line + chip, the reason goes to the destination page and `aria-describedby`; offline banner reserves its slot (no shift), one alert, "Back online" clears "not saved", mutating controls in shell chrome `aria-disabled`; session-ended dialog dismissible with Esc and a secondary action; `history.replaceState` after Keycloak init (hash gone, one history entry); skeleton mirrors the final layout, `ProjectLayout` nav `inert` until the Project is confirmed, one logo asset, header logo link does not reload; Create Project: no preselected Template/surfaces or one "Recommended", same surface words everywhere, HelpHint for "style", step 1 says it creates a record, native select for "Add a language", slug placeholder is a pale "e.g." example, zoom200 stepper does not fill the fold; Home does not repeat the Project three times.
- Files: `views/HomeView.vue`, `SignInView.vue`, `SessionErrorView.vue`, `CreateProjectView.vue`, `views/createProject/*`, `components/ProjectList.vue`, `ProjectSwitcher.vue`, `AppHeader.vue` (includes user menu), `WorkspaceNav.vue`, `OfflineBanner.vue`, `SessionEndedDialog.vue`, `PageFrame.vue`, `PageHead.vue`, `AppBreadcrumbs.vue`, `SectionTabs.vue`, `stores/connection.ts`, `stores/sessionNotice.ts`, `views/workspace/ProjectLayout.vue` (skeleton only), `platform/auth.ts` (replaceState only), `platform/catalogue.ts`, `platform/templates.ts`.
- Acceptance: after sign-in `location.hash === ""` and `history.length` increased by <= 1; switcher axe clean; tab title keeps the Project name on a 403 and a 404 page; offline toggle shifts nothing (CLS 0 on the content top); user menu keyboard run passes.
- Constraint check: `12` §3 picker (popover, organisations, resume, no soft-deleted list); tokens in memory; Platform Portal link only when `portalUrl` exists.

### P3-core List core (size L) [lists 70-74]
- Closes: C2-35, C2-36 (flat lists), C2-37, C2-39, C2-40, C2-41, C2-42, C2-43 (shared parts), C2-44 (FormDialog), C2-45, C2-47 (move dialog), C2-48, C2-49, C2-53 (list search/row titles `dir="auto"`), C2-74 (`/` focuses search only), C2-94 (list-level error Alert with request id and Try again; never "Add a language first" from a failed read), C2-21 (list loading shows thead and a disabled toolbar), C2-01 (row title links `.hit-44`).
- Changes: shared sort control with direction (`SortSelect`), Updated newest first and rows show time; tree lists show "Ordered by hierarchy and manual order" instead of an inert sort (Q-018); pager (50 per page, `page` in URL), "Showing 51-100 of 184" (D-091); POI row compact (about 64 px); denominators match the segment, segment counts respect search, the live region names the noun and announces sort; "Clear filters" once; back from editor restores scroll and focuses the row link (conflict 1: s9's numeric evidence taken); Translations column wraps at spaces and has a min width at 1024; "Matches Ελληνικά: …" line; "Needs translation in" defaults to Search-in or the first non-default language; warning toasts persist, neighbour kebab focus after Archive, Undo for Archive, blocked Archive retitled ("Can't archive Sculpture") with a Close-only dialog; Move-to-position error `role=alert` with `aria-describedby`; `FormDialog`: one pass validation, one required marker, Esc/backdrop confirms before losing typed text, summary in form order, unmapped 422 keys never shown, slug capped at 100, body scrolls at zoom200 (>= 4 lines); list-row activation confirm reuses `StatusChangeDialog` (`reviewTo`).
- Files: `components/list/*` (ListTable, ListToolbar, ListFooter, ListEmpty, RowMenu, SetPositionDialog, SortSelect, StatusSegments, ListSelect, useListQuery), `components/TranslationDots.vue`, `TriggerChips.vue`, `views/workspace/useListLifecycle.ts`, `LifecycleDialogs.vue`, `listRows.ts`, `workspace/listFilters.ts`, `useReorder.ts`, `useCategoryFilter.ts`, `components/ui/dialog/FormDialog.vue` (exception to W0-A ownership), `styles/list-table.css`, `e2e/content-lists.spec.ts`.
- Contract for P3a/P3b: `ListTable` slots and `query` unchanged; new props `pageSize`, `rowKeyFocus`; `useListQuery` gains `sortDir` and `page`; `FormDialog` gains `confirmDiscard`.
- Acceptance: a 84-POI list renders <= 50 rows and its page height <= 4,000 px; "Sort by Updated" first row is the newest; Back from editor at scroll 3000 returns within 50 px and focuses the row; unit/probe: loader reads page 2 when `totalPages` = 2.
- Constraint check: `12` §3 lists (search `q` across languages, filters, `sortOrder` default, reorder persisted via order endpoint, indentation, trigger chips); keyboard reorder alternative kept (`14` §4); Q-016 bulk stays deferred.

### P4s Editor shell, round 2 (size L) [all editors 70-78]
- Closes: C2-10 (dialog part), C2-11 (editor Ctrl+S `aria-disabled` offline), C2-12 (editor toasts policy), C2-50 (dots -> `?lang=`, Next missing label), C2-53 (editor fields), C2-54, C2-56, C2-57 (shell callers: Activate, Restore/Discard, Archive, leave guard), C2-62, C2-63, C2-64, C2-65, C2-67 (shell part), C2-68, C2-70, C2-73.
- Changes: per D-095; header h1 wraps to two lines, full title in tooltip, title textarea auto-grows (default and translation tabs); header state line is the single Save announcement, toast for errors only; 5xx and offline focus the summary; stable summary slot (no 100 px shift); Restore-draft compact row; Archived: one Restore (card), no stale Title hint, success toast uses the success icon; Version -> "Revision N"/"Not saved yet"; ConflictDialog three-way with request id and what Reload discards; Undo anchored (Ctrl/Cmd+Z) per D-098 shell part (`RemovedBar`); Next missing beside the tabs at <= 1100 px; parallel trigger/asset writes; activation refusal renders inside the dialog "Not activated"; 403/404 on save: "You no longer have access / this record was removed" + one action.
- Files: `editor/EditorShell.vue`, `WorkingCopyBanner.vue`, `EditorStatusCard.vue`, `ConflictDialog.vue`, `ActivateDialog.vue`, `TranslationsPanel.vue`, `SourcePairField.vue`, `EditorSection.vue`, `EditorSectionNav.vue`, `ReadinessList.vue`, `RemovedBar.vue`, `ReorderControls.vue`, `undoRemove.ts`, `PreviewPanel.vue` is P8's, `workspace/useResourceEditor.ts`, `activationHandoff.ts`, `formFields.ts`, `translationStatus.ts`, `referenceLinks.ts`, `components/AiMarker.vue` (`editor/AiMarker.vue`).
- Acceptance: all numbers as in B1; forced 409 (real, via API change) shows three-way with only the changed fields; Apply disabled with a reason on a clean ACTIVE editor; dirty state: Save draft is the primary button; focus after Activate is the new status heading, after Restore the first restored field; a failed save at 1280x720 does not move any field by more than 4 px.
- Constraint check: `12` §3 (header Apply; Save draft and Discard in the banner), `12` §5 409/422 behaviour, `14` §4.

### P8 Preview page, stand-in, Preview in app (size L) [Preview in app 68, Preview 79]
- Closes: C2-09 (Preview), C2-13 (`/app-preview/nothing` not found), C2-31 (Preview hints), C2-50 (missing titles link), C2-57 (FireTrigger), C2-61, C2-88, C2-89, C2-90, C2-91, C2-92, C2-93 (stays with P4; only the PNG-size caption if verified).
- Changes: D-093 in full; one compact sticky toolbar on `/preview` (language, surface, live/preview, trigger combobox with search, Interact 40/44 px), one-line subtitle, picture starts above y 480 at 1440x900, status lines in the frame caption, scale caption >= 12 px; "Fit width" default for Kiosk, hide duplicate size options ("Fits at real size"); Esc in the frame returns to Interact; `inert` until Interact; the expanded panel bar sticks below the stack (`top: var(--sticky-stack-h)`) so it never covers Apply changes; Expand at every width; `/preview?trigger=` selects surface (beacon -> Mobile, QR/geo -> its "Runs on"), selects and fires, or says why not; "71 missing titles" links to the filtered list; hex colours in `ResourceContent`/`PreviewApp` to tokens, glyphs to lucide; `z-raised`.
- Files: `views/workspace/PreviewView.vue`, `views/AppPreviewView.vue`, `components/preview/*` (DeviceFrame, PreviewApp, ResourceContent, PreviewPane, PreviewControls, FireTrigger, strings, surfaces), `components/editor/ResourcePreview.vue`, `components/editor/PreviewPanel.vue`, `workspace/preview.ts`, `previewData.ts`, `previewModels.ts`, `projectTheme.ts`, `e2e/editor-preview.spec.ts`.
- Acceptance: POI editor at 1440: panel scale >= 50 % for Web and Kiosk (fit width), width equals the content area; at 1024 Expand exists; with the panel expanded, Apply changes is clickable and not overlapped (`elementFromPoint`); `/preview?trigger=<qr id>` fires and shows the chip; Esc returns focus to Interact.
- Constraint check: `12` §3 ("below the action", labelled by surface and language, missing translations in red), `14` §4 CMS chrome operable with the frame focused, AGENTS 4.9, 4.10 (no analytics event, author's token).

### P6 Maps and floor plans (size M) [Map editor 77, Floor plan editor 82; Maps list/Floor plans list 85 already]
- Closes: C2-69 (map editor), C2-84, C2-85, C2-86, C2-87, C2-23 (GeoPicker placeholder), C2-01 (checkbox 44 px, attribution), C2-58 follow-up check.
- Changes: D-096; Leaflet gesture handling on coarse pointers; visitor-filter as one grouped disclosure (checkbox list, one Tab stop to open); visibility checkboxes 44 px; coordinates validate on blur with `aria-invalid` and a polite announcement, same rules as the New map dialog; floor plan "Place" buttons named ("Place Acropolis"), armed bar anchored below the stack or at the plan bottom on short screens; New floor plan dialog error summary; New map dialog reserves result space; Latitude/Longitude never show the centre as a placeholder; placed numbering stable after save; tile-failure card does not cover pins; route lines legend.
- Files: `views/workspace/maps/*` (MapsView, MapEditorView, NewMapDialog, FloorPlansView, FloorPlanEditorView, NewFloorPlanDialog, MapsTabs), `components/map/GeoMapCanvas.vue`, `basemap.ts`, `coordinates.ts`, `components/GeoPicker.vue`, `RouteMap.vue` (P5a requests changes), `platform/maps.ts`, `floorPlans.ts`, `e2e/place-map-link.spec.ts`.
- Acceptance: swipe on a 768 touch map scrolls the page; Tab from the map to "Placed on this map" <= 6 stops (was 40); floor plan has 0 identical accessible names among Place buttons.
- Constraint check: `14` §4 coordinate fields for every placement; D-064/D-081; Nominatim stays.

### P3a Places, POIs, Routes lists and create dialogs (size M)
- Closes: C2-38 (Place), C2-43 (views), C2-44 (per dialog), C2-46, C2-47 ("Add sub-place" in the Places kebab), C2-50 (`?lang=` links), C2-26 (`?create=1`), C2-02 (n/a).
- Changes: Sub-place requires a Parent (validated, empty "Choose a parent" option); POI list degrades with a notice when Categories or Places fail (a Places 403 does not fail the list); "Dates"/"Next date" naming, blank Order header fixed, "trigger" placeholders only where the kind has them; `?create=1` opens the create dialog and strips the param; row text uses `PageHead`; CreatePoi Category select; Route "Setting" is one control type in the dialog.
- Files: `places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, `places/CreatePlaceDialog.vue`, `pois/CreatePoiDialog.vue`, `routes/CreateRouteDialog.vue`, `places/placeTree.ts`.
- Acceptance: creating a Sub-place without a Parent shows an error and creates nothing; `/pois?create=1` opens the dialog with focus on Title; POI list with Categories request aborted still lists rows plus a notice.
- Constraint check: `12` §3 Place creation order (INDOOR/OUTDOOR, top-level/sub-place with parent, name), no map asked.

### P3b Guides, Events, Categories lists and create dialogs (size M)
- Closes: C2-38 (Category), C2-43 (Categories: "Name", "Applies to", no Featured), C2-44, C2-50, C2-26 (`?create=1`), C2-72 (list parts).
- Changes: Subcategory requires an explicit parent (no preselecting the first); Categories list columns fixed; Events "Next date" with the shared formatter; same create-dialog pattern as P3a; Category tree not sortable (Q-018) with the explanatory line from P3-core.
- Files: `guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue`, `categories/RadioChips.vue`.
- Acceptance: Subcategory with no parent chosen: error, no record; Events rows show "16 Nov 2026, 14:00".
- Constraint check: `12` §3 Category ("Applies to", Level, subcategory parent among top-level of the same scope).

### P4 Place and POI editors, triggers, media slots (size L) [POI editor 70, Place editor 73]
- Closes: C2-23 (Placement, beacon UUID placeholders), C2-55 (POI), C2-59 (POI wording), C2-60, C2-66, C2-67 (POI/Place), C2-69 (coordinates), C2-93 (QR caption if true), C2-01 (MediaSlots patches), C2-57 (attach image), C2-09 (editor cards).
- Changes: `checkTriggers` flags empty beacon/geo rows before the request, summary entries named ("Beacon 1, UUID"); one "Audio narration" row with per-language chips inside the Media card (not under Practical details); two-column Summary/Description or 56 px growing rows, Placement map 200 px or behind "Edit position", empty Media and Triggers folded into one "Add…" row, Place setup readiness hint; non-default language tabs show only translatable fields (D-079), "Other settings (all languages)" collapsed; coordinate fields validate on blur; Place/Category native selects with 25+ options become searchable combobox only if one exists in `ui/` (else a native select with a filter field above it); placeholders are "e.g." text; after attach, focus the Replace button; "Test in preview" link text unchanged (P8 fixes the target). POI editor height <= 1,450 px at 1280 for an empty POI (D-074 target).
- Files: `places/PlaceEditorView.vue`, `pois/PoiEditorView.vue`, `components/editor/TriggersCard.vue`, `QrCodePreview.vue`, `BackendQrCode.vue`, `components/media/MediaSlots.vue`, `platform/pois.ts`, `places.ts`, `triggers.ts`, `e2e/place-editor.spec.ts`.
- Acceptance: POI editor empty height <= 1,450 px; saving an empty beacon row never reaches the server (network log), the summary names its field; Tab stops Save -> end of Placement <= 8 (with B6).
- Constraint check: `12` §3 POI (Placement card, media slots, collapsed Practical details with filled count, triggers in "How visitors reach it"), `14` §4.

### P5a Route and Guide editors, StoryEditor, resource picker (size M-L)
- Closes: C2-34 (route/guide inputs to the model), C2-43 (editor parts), C2-57 (picker), C2-70 (stop/block Undo wiring), C2-71, C2-72 (picker, icon grid n/a), C2-55 (n/a), C2-09, C2-53 (StoryEditor lang/dir).
- Changes: Route map card: guidance only at 0 stops, "Stops 1-5 have no position" with links, pins fan out, list behind "Show as list"; collapse the optional walking-instruction field; picker search ArrowDown/Enter moves to results and selects; Guide story status: an empty story is a warning in the card and on the tab; Undo anchoring per D-098; `z-raised` token for the line at `RouteEditorView.vue:787`; shadow tokens `shadow-drop-before/after` replace the arbitrary inset shadows.
- Files: `routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `guides/guideElements.ts`, `components/editor/StoryEditor.vue`, `StoryEditor.ts`, `components/ResourcePickerDialog.vue`, `resourcePicker.ts`, `platform/routes.ts`, `guides.ts`, `e2e/guide-reference.spec.ts`.
- Acceptance: removing a stop: Undo bar visible in the viewport and reachable in <= 2 Tabs; Ctrl+Z restores; a Guide with five empty blocks is not "Complete".
- Constraint check: `12` §3 Route (stops reorder by drag with keyboard alternative, fewer than two stops warning), Guide (story editor, reference blocks, inline images as INLINE bindings).

### P5b Event and Category editors (size M)
- Closes: C2-52 (Event), C2-55 (Event), C2-59 (Category sentence), C2-69 (Event dates), C2-72, C2-43 (Category), C2-53.
- Changes: Event dates use `DateTimeFields` (24 h, format visible), end-before-start announced on blur with `aria-invalid`; summary in the target language; Event non-default tabs show only translatable fields + read-only dates, "Other settings (all languages)" collapsed; "Repeat weekly 99" is capped at its real limit with a hint before typing; comboboxes look like comboboxes; icon grid arrow keys move in the grid's rows and columns; scope switch announced; Category sentence "Used by 1 route. Choose another category in that route first."
- Files: `events/EventEditorView.vue`, `events/EntityCombobox.vue`, `events/eventDates.ts`, `categories/CategoryEditorView.vue`, `components/CategoryIcon.vue`, `platform/events.ts`, `categories.ts`.
- Acceptance: no "AM/PM" anywhere in the Event editor; end before start announced without Save; icon grid ArrowDown moves one row.
- Constraint check: `12` §3 Category (Applies to locked when in use, Level, icon picker with None).

---

## 4. Deferred and rejected; QUESTIONS and GAPS

### Deferred or rejected (count: 14)

1. Bulk actions and an "Activate drafts" bulk dialog (Q-016): Dashboard uses "Show drafts".
2. Quick switcher / jump keys (C2-74, Q-016): only `/` focuses search.
3. Tree-list sorting (C2-36 for Places and Categories): `12` §3 fixes `sortOrder`; Q-018.
4. First-run guide step 6 "Go live" (C2-26): spec change, Q-017; the guide gets its persistence in browser storage, which is a convenience.
5. Server-side list paging (C2-37 literal reading): conflicts with cross-language search, counts, the worklist and manual order; window the rendered rows over the complete set (D-091), G-041.
6. Language-aware asset filter at scale (C2-51): G-040; client-side stays.
7. Editor ARIA for the Preview stand-in AX tree (conflict 4): implement `inert` until Interact; verify with a CDP `Accessibility.getFullAXTree` run in round 3.
8. Visitor-app screens sweep (cleanup E, `.field-input` migration, `.dialog-*`): out of scope; only shared components change.
9. Remaining dead code (cleanup B except the root `ReorderControls.vue`, C, D) and the lint/CI grep gate (F): round 3; only the CSS-token check ships now.
10. Dashboard ~5 s load as admin (C2-73): dev-server timing unverified; only parallelise the queries.
11. Empty-Guide blocker (C2-34): a warning until G-039/Q-019 is answered.
12. RTL beyond `dir="auto"` and `lang` (C2-53): inferred, not observed; no real RTL language in the seed.
13. Reduced-motion extras beyond keeping opacity fades (C2-04): done in A3, no more.
14. Seam lines on raster tiles, QR print size (C2-87, C2-93): unverified; QR caption only if the size is confirmed.

### QUESTIONS.md (append in one heredoc, W0-A; next id Q-017)

```
### Q-017 — First-run guide persistence and a sixth step
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-26).
- Question: `12` §3 fixes a five-step guide for a Project without content. After the author creates a draft
  Place and Point of Interest the guide disappears while steps 3 to 5 and going live are still open. May the guide
  stay until the Project has ACTIVE content (or the author dismisses it), and may a sixth step "Activate and
  launch" be added? The CMS keeps the guide until step 5 or a per-viewer dismissal stored in the browser.
- Consequence: Dashboard first run.

### Q-018 — Sort on tree lists (Places, Categories)
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-36).
- Question: `12` §3 sorts Places and Categories by `sortOrder`. May the lists offer Title, Status and Updated,
  showing the parent as context when the tree is flattened? Until answered, tree lists show "Ordered by hierarchy
  and manual order" and offer no sort control.
- Consequence: Places and Categories lists.

### Q-019 — Does an empty Guide story block activation?
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-34).
- Question: A Guide with empty story blocks is "Complete" and activates with no blocking issue. Should it be a
  blocking issue, or a warning? The CMS shows a warning; the backend code is G-039.
- Consequence: Guide editor, readiness, Dashboard.

### Q-020 — Small clarifications: slug length and "Revision"
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-44, C2-65).
- Question: (1) What is the maximum slug length (a 328-character slug is accepted today; the CMS caps at 100)?
  (2) May authors see "Revision N" instead of "Version N" for the Working Copy and Resource `version`?
- Consequence: create dialogs, editor status card.
```

### GAPS.md (append in one heredoc, W0-A; next id G-037)

```
### G-037 — Does the backend count a Resource's own triggers as users? (verify)
- Need: Deactivate and archive refusals list references. The UI shows "Used by 1 item" for a Point of Interest whose
  only user is its own QR or geo trigger. If the backend refuses because of own triggers, change it (deactivate
  them with the Resource); otherwise the CMS filters them client-side (already done).
- Backend item: the where-used rule behind `409` on deactivate. UX overhaul round 2, C2-59.

### G-038 — Pending Working Copies across kinds, newest first
- Need: one request (or a `sort=updatedAt,desc` with `pending=true` per kind) so the Dashboard shows the most
  recently saved Working Copies. Today it reads every kind's `pending=true` list in manual order. C2-27.

### G-039 — Readiness code for a Guide with an empty story
- Need: a readiness code for empty story blocks (and for a DRAFT asset without alt text if not already
  covered by G-027). Today a Guide with five empty blocks reports 0 blocking. C2-34, Q-019.

### G-040 — Language-aware missing-text filter for assets
- Need: `missingTextIn=<language>` on the asset list. The CMS filters client-side (fine at about 100 assets). C2-51.

### G-041 — Counts and filters for paged lists
- Need: per-status counts, and `missing=<language>` and search across languages, from the list endpoints so the
  CMS can page on the server. Today the CMS reads every page (`size=200`) and windows the rows (D-091). C2-37.

### G-042 — Verify two silent limits
- Need: confirm whether the Event "repeat weekly 99" becoming 52 is the client or the server, and whether any list
  endpoint truncates silently above `size=200`. C2-37, C2-72.
```

---

## 5. Execution protocol and definition of done

1. Order: W0-A and W0-B in parallel, orchestrator gate (typecheck, build, `make check-css`, three screenshots), then batch A, then batch B. P3a/P3b after P3-core; P4/P5a/P5b after P4s; P8 and P6 independent.
2. Definition of done (each package, W0 included): `make typecheck`, `make build`, `make check-css` pass; `/home/mirto/.claude/skills/impeccable/scripts/impeccable detect --json <owned files>` clean; gate grep `text-\[[0-9.]+px\]|rounded-\[|shadow-\[|z-\[|tracking-\[|uppercase|#[0-9a-fA-F]{6}` over owned in-scope files returns nothing (except documented fallbacks); screenshots and keyboard run recorded in the package report with the acceptance measurements above; tests not weakened; e2e updated, not run; no commit.
3. A package's report lists C2 ids closed, ids partly closed, and requests to other owners.
4. Round-1 constraints stay: header Apply and banner Save draft/Discard (`12` §3), no new heavy dependency, tokens in memory, no analytics, specs and backend read-only.

---

## 6. File-ownership table

"W0" column: who edits during Wave 0 (A or B, never both). "Wave 1" column: the single owner afterwards. `DECISIONS.md`: D-086..D-088 W0-A, D-089/D-090 W0-B, D-091 P3-core, D-092 P2, D-093 P8, D-094 P7a, D-095 P4s, D-096 P6, D-097 P1, D-098 P5a. `QUESTIONS.md` Q-017..Q-020 and `GAPS.md` G-037..G-042: W0-A.

| File | W0 | Wave 1 |
|---|---|---|
| `tailwind.config.js`, `src/style.css`, `scripts/check-css-tokens.mjs`, `Makefile`, `package.json` (scripts) | A | nobody (requests to the orchestrator) |
| `src/components/ui/**` (all primitives, `ProblemAlert`, `DateTimeFields`, popover, tabs, button, alert, state-card) | A | nobody; exception `ui/dialog/FormDialog.vue` -> P3-core |
| `src/lib/format.ts`, `focus.ts`, `errors.ts`, `glossary.ts`, `announcer.ts`, `routeAnnouncer.ts`, `utils.ts` | A | nobody |
| `src/stores/toast.ts`, `confirm.ts`, `projects.ts`, `components/AppToast.vue`, `AppDialog.vue`, `ConfirmDialog.vue` | A | nobody |
| `src/router.ts`, `src/App.vue`, `src/main.ts`, `platform/api.ts`, `platform/languages.ts`, `workspace/useProjectLanguages.ts` | A | nobody (P1: `auth.ts` only) |
| `src/components/ReorderControls.vue` (delete) | A | removed |
| `src/components/editor/ReorderControls.vue`, `RemovedBar.vue` (size patches) | A | P4s |
| `src/components/WorkspaceNav.vue` (`h-header` line) | A | P1 |
| `src/views/workspace/ProjectLayout.vue` | A (logic) | P1 (skeleton) |
| `e2e/touch-and-forced-colours.spec.ts`, `screens.spec.ts`, `e2e/support/*`, `zoom-and-structure.spec.ts` | A | nobody |
| `src/components/editor/EditorShell.vue`, `WorkingCopyBanner.vue`, `EditorSection.vue`, `EditorSectionNav.vue`, `ReadinessList.vue`, `ActivateDialog.vue`, `EditorStatusCard.vue`, `TranslationsPanel.vue` | B | P4s |
| `src/components/StatusChangeDialog.vue` | B | P3-core |
| `src/workspace/useResourceEditor.ts` | B | P4s |
| `src/platform/completeness.ts` (new) | B | P2 (reads), nobody writes |
| `src/platform/readiness.ts` | B | P2 |
| `src/platform/assets.ts` (L301 only) | B | P7a |
| `src/components/list/ListToolbar.vue`, `src/styles/list-table.css` | B | P3-core |
| `src/components/map/GeoMapCanvas.vue`, `src/components/GeoPicker.vue` | B | P6 |
| `src/components/list/*` (rest), `TranslationDots.vue`, `TriggerChips.vue`, `views/workspace/useListLifecycle.ts`, `LifecycleDialogs.vue`, `listRows.ts`, `workspace/listFilters.ts`, `useReorder.ts`, `useCategoryFilter.ts`, `e2e/content-lists.spec.ts` | - | P3-core |
| `editor/ConflictDialog.vue`, `SourcePairField.vue`, `undoRemove.ts`, `AiMarker.vue`, `workspace/activationHandoff.ts`, `formFields.ts`, `translationStatus.ts`, `referenceLinks.ts` | - | P4s |
| `places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, `places/CreatePlaceDialog.vue`, `pois/CreatePoiDialog.vue`, `routes/CreateRouteDialog.vue`, `places/placeTree.ts` | - | P3a |
| `guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue`, `categories/RadioChips.vue` | - | P3b |
| `places/PlaceEditorView.vue`, `pois/PoiEditorView.vue`, `editor/TriggersCard.vue`, `QrCodePreview.vue`, `BackendQrCode.vue`, `media/MediaSlots.vue`, `platform/pois.ts`, `places.ts`, `triggers.ts`, `e2e/place-editor.spec.ts` | - | P4 |
| `routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `guides/guideElements.ts`, `editor/StoryEditor.vue`, `StoryEditor.ts`, `components/ResourcePickerDialog.vue`, `resourcePicker.ts`, `platform/routes.ts`, `guides.ts`, `e2e/guide-reference.spec.ts` | - | P5a |
| `events/EventEditorView.vue`, `events/EntityCombobox.vue`, `events/eventDates.ts`, `categories/CategoryEditorView.vue`, `components/CategoryIcon.vue`, `platform/events.ts`, `categories.ts` | - | P5b |
| `maps/*` (6 views + `MapsTabs.vue`), `components/map/basemap.ts`, `coordinates.ts`, `RouteMap.vue`, `platform/maps.ts`, `floorPlans.ts`, `e2e/place-map-link.spec.ts` | - | P6 |
| `media/MediaView.vue`, `media/UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `DescribeNowDialog.vue`, `AssetThumb.vue`, `workspace/useAssetUpload.ts`, `e2e/media.spec.ts` | - | P7a |
| `media/AssetEditorView.vue`, `components/media/AssetPickerDialog.vue`, `AssetPreview.vue` | - | P7b |
| `views/workspace/DashboardView.vue`, `views/workspace/dashboard/*`, `platform/dashboardData.ts` | - | P2 |
| `views/HomeView.vue`, `SignInView.vue`, `SessionErrorView.vue`, `CreateProjectView.vue`, `views/createProject/*`, `components/ProjectList.vue`, `ProjectSwitcher.vue`, `AppHeader.vue`, `OfflineBanner.vue`, `SessionEndedDialog.vue`, `PageFrame.vue`, `PageHead.vue`, `AppBreadcrumbs.vue`, `SectionTabs.vue`, `stores/connection.ts`, `sessionNotice.ts`, `platform/auth.ts`, `catalogue.ts`, `templates.ts`, `workspace/currentProject.ts`, `lastProject.ts` | - | P1 |
| `views/workspace/PreviewView.vue`, `views/AppPreviewView.vue`, `components/preview/*`, `editor/ResourcePreview.vue`, `editor/PreviewPanel.vue`, `workspace/preview.ts`, `previewData.ts`, `previewModels.ts`, `projectTheme.ts`, `e2e/editor-preview.spec.ts` | - | P8 |
| Out of scope, untouched (screenshot once each): `OverviewView.vue`, `LanguagesView.vue`, `SurfacesView.vue`, `TranslationsView.vue`, `navigation/NavigationView.vue`, `SectionView.vue`, `workspace/translationCatalog.ts`, `e2e/navigation-editor.spec.ts`, `platform/overview.ts`, `settings.ts`, `workspace/projectSettings.ts`, `navigationMenu.ts` | - | - |
| Read-only: specs folder, backend, generated API client, `public/config.js`, `silent-check-sso.html` | - | - |

Overlap check done by file: each path appears in one row per wave. Shared files changed twice (WorkspaceNav, ProjectLayout, EditorShell family, ListToolbar, GeoPicker/GeoMapCanvas, readiness.ts, assets.ts, StatusChangeDialog, ReorderControls/RemovedBar) move owner between waves, never inside one.

## 7. Orchestrator review (binding, 2026-11-16)
1. Paging: the planner's alternative is accepted — loaders read every page; the list renders 50 rows per page with
   `page` in the URL; server-side counts/filters go to G-041. Nothing is silently capped.
2. Tree lists keep `sortOrder` only (spec); Q-018 records the question.
3. Account: the owner authorised `admin@uniche.test` for all remaining work in the audit Projects (curator lost access).
4. Wave 0 agents run in parallel on disjoint files; Wave 1 batch A starts only after the orchestrator verifies Wave 0.
