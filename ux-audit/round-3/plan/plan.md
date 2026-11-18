# Round 3 implementation plan: iGuide CMS UX overhaul

Planner output. Inputs read: `BRIEF.md`, `user-comments.md` (round 2 approved as is; round 3 requested, R2-V-02/03/04/07 go into this plan), `round-3/audit/consolidated.md` (101 clusters: 0 P0, 18 P1, 61 P2, 22 P3), `round-3/audit/design-system/cleanup.md` and the "DESIGN.md source table (as built)" of `report.md`, `scoreboard.md` (R2 column and "Round 2 build, measured in round 3"), `round-2/plan/plan.md`, `round-2/implementation/system.md`, `AGENTS.md` §4, specs `12` §3-§6 and `14` §4 (read-only), `DECISIONS.md` (last D-099), `QUESTIONS.md` (last Q-020), `GAPS.md` (last G-042), `src/`, impeccable `polish.md`, `document.md`, `craft-floor.md`. Nothing here edits source.

Mode: **Operate**. Round 3 is polish, then `document`, then a final cleanup. It adds no visual direction. Craft floor applies to every package: no eyebrow labels, no side stripes, no nested cards, no gradient text, no glyph icons, no modal where an inline panel works, tokens only, every interactive component has default, hover, focus, active, disabled, loading, error. Polish rule applied to every fix: classify the drift (missing token / one-off to replace with the shared component / conceptual mismatch / local defect) and fix at the narrowest correct level, in the owner's file.

Contents: 0 Cluster index; 1 Direction refinements and DECISIONS; 2 Wave 0; 3 Wave 1 packages; 4 Wave 2 (cleanup, then document); 5 Score lift table (41 rows); 6 Deferred, QUESTIONS, GAPS; 7 Execution protocol and definition of done; 8 File-ownership table.

Two deviations from the orchestrator's outline, stated up front:
1. **Shared list core is not in Wave 0.** Wave 0 is capped at two agents; foundations (A) and the editor family (B) already fill them. List core is the first Wave 1 package (`P3-core`, batch 1) because its files are disjoint from Wave 0, nothing in Wave 0 needs it, and P3a/P3b start after it (as in round 2).
2. **Structural-gap blockers on DRAFT are not planned.** `12` §3 says "fewer than two stops is a warning" for a Route and `12` §5 says readiness (the backend) is the single source of "what is missing". A client-only blocker for Route 0 stops, Event no dates or Guide empty story would contradict both. They stay warnings, made impossible to miss (named, listed first, in the confirm); the blocker question is Q-021 (Guide already Q-019, G-039).

---

## 0. Cluster index (every one of the 101 clusters has an owner; checked by script: 101 of 101)

Primary owner first, supporting owners after "+". Package ids are defined in sections 2-4. `P3-core` = list core, `W0-A` foundations, `W0-B` editor family, `CLN` cleanup, `DOC` document.

| Cluster | Sev | Owner | | Cluster | Sev | Owner |
|---|---|---|---|---|---|---|
| C3-01 | P1 | W0-A | | C3-52 | P2 | P5b + P7b |
| C3-02 | P1 | W0-A + W0-B (editor strip), P6 (MapsTabs uses it) | | C3-53 | P2 | P5a + P5b |
| C3-03 | P1 | W0-A | | C3-54 | P1 | P2 |
| C3-04 | P2 | W0-A (token) + P8 | | C3-55 | P1 | P2 |
| C3-05 | P2 | W0-A | | C3-56 | P1 | P2 (Q-022) |
| C3-06 | P3 | W0-A | | C3-57 | P2 | P2 + W0-A (glossary) |
| C3-07 | P1 | W0-B | | C3-58 | P2 | W0-B (`readiness.ts`) + P2 |
| C3-08 | P1 | P3-core | | C3-59 | P2 | P2 |
| C3-09 | P2 | W0-A (rule, toast) + P3-core, P6, P7a, P8 | | C3-60 | P2 | P2 |
| C3-10 | P2 | P3-core | | C3-61 | P2 | P2 |
| C3-11 | P2 | W0-A + P1 (switcher) | | C3-62 | P3 | P2 + P1 (PageHead, chip name) |
| C3-12 | P2 | W0-A + W0-B, P1, P4, P5a, P6 | | C3-63 | P2 | W0-A (CSS contract) + P1, P2, P4 |
| C3-13 | P3 | P3-core (radio Home/End only; dots deferred) | | C3-64 | P1 | W0-A (`router.ts`) + P8 |
| C3-14 | P1 | W0-B + P7b | | C3-65 | P1 | W0-B (inject contract) + P8 |
| C3-15 | P2 | W0-B | | C3-66 | P2 | P8 |
| C3-16 | P2 | W0-B (warnings; blocker to Q-021) | | C3-67 | P2 | P8 + W0-A (glossary) |
| C3-17 | P1 | W0-B | | C3-68 | P2 | P8 |
| C3-18 | P2 | W0-B | | C3-69 | P3 | P8 + P4 (QR size) |
| C3-19 | P2 | W0-B + P5b (Category) | | C3-70 | P3 | P8 |
| C3-20 | P1 | W0-B + P4 | | C3-71 | P2 | P6 |
| C3-21 | P2 | W0-B | | C3-72 | P2 | P6 |
| C3-22 | P2 | W0-B (verify, fix only if reproduced) | | C3-73 | P3 | P6 (card overlay; gutter tint only) |
| C3-23 | P2 | W0-B | | C3-74 | P3 | P6 |
| C3-24 | P2 | W0-B | | C3-75 | P3 | P6 |
| C3-25 | P2 | W0-B | | C3-76 | P3 | P6 |
| C3-26 | P2 | W0-A (+ W0-B contract) | | C3-77 | P1 | P7b |
| C3-27 | P3 | W0-A + W0-B, P3a | | C3-78 | P2 | P7a |
| C3-28 | P2 | W0-B | | C3-79 | P2 | P7a + P7b |
| C3-29 | P3 | W0-B | | C3-80 | P2 | P7a (progressive load; server paging G-041) |
| C3-30 | P2 | P4 | | C3-81 | P3 | P7a + P7b |
| C3-31 | P2 | W0-B | | C3-82 | P3 | P7a |
| C3-32 | P2 | W0-B | | C3-83 | P1 | W0-B |
| C3-33 | P3 | W0-B (`FilteredSelect`) + P5b (`EntityCombobox`) | | C3-84 | P2 | W0-A (`auth.ts`, `router.ts`, `main.ts`) |
| C3-34 | P2 | P4 | | C3-85 | P2 | W0-A + P1, P3a, P3b |
| C3-35 | P2 | P5a | | C3-86 | P2 | P1 + W0-B (editor Save) |
| C3-36 | P3 | P5a + P5b, W0-B (`RemovedBar`) | | C3-87 | P2 | P3-core + P3a (Routes), P6 (Maps) |
| C3-37 | P2 | W0-B + P5b, P7b | | C3-88 | P2 | P7a + P3a, P3b |
| C3-38 | P1 | W0-A (`DateTimeFields`) + P5b | | C3-89 | P3 | W0-B + P3a, P3b |
| C3-39 | P2 | P5b | | C3-90 | P2 | P1 (G-029 limit: partial) |
| C3-40 | P1 | P3-core | | C3-91 | P2 | P1, P2, P3-core, P7a (each its own skeleton) |
| C3-41 | P1 | P3-core | | C3-92 | P3 | W0-A (Close order, StateCard), W0-B (session dialog), P1 |
| C3-42 | P2 | P3-core | | C3-93 | P2 | W0-A (`AppDialog`/`FormDialog`) + P3a, P3b |
| C3-43 | P2 | P3-core + P3a, P3b | | C3-94 | P2 | W0-A |
| C3-44 | P3 | P3-core + W0-A (`format.ts`), P3a, P7b | | C3-95 | P2 | P1 |
| C3-45 | P2 | P3-core | | C3-96 | P2 | P1 |
| C3-46 | P2 | P3-core | | C3-97 | P2 | CLN |
| C3-47 | P3 | P3-core + P7a | | C3-98 | P2 | CLN |
| C3-48 | P2 | P3-core, P1, P2, P5a, W0-A (checkbox) | | C3-99 | P2 | CLN + owners (Wave 1 literals) |
| C3-49 | P3 | W0-A | | C3-100 | P2 | W0-A |
| C3-50 | P3 | W0-A (`FormField`) + P1, P3-core, W0-B | | C3-101 | P3 | DOC + P3-core (dots 32 px) |
| C3-51 | P2 | P3-core + W0-B (`listBack.ts`), P7a, P8 | | | | |

---

## 1. Direction refinements and DECISIONS entries

Direction stands (calm institutional workbench, purple only for the one primary action, selection and focus; status = word + drawn icon + colour; Montserrat; 14 px body; 8 px controls). Round 3 makes six rules true everywhere, because the audit found each one true in most places and broken in the rest:

1. **One focus ring.** Every interactive element, including primary and danger buttons, menu items, tab strips and programmatic targets, shows the same 2 px `--ring` outline with a 2 px offset, never white, never clipped.
2. **One state ladder.** Default, hover, pressed, selected, highlighted, focus, disabled are visibly different steps on every control.
3. **One readiness list.** Before and after activation, in the card, the confirm, the toast and the Dashboard, the same list with the same counts.
4. **One Save draft at a time.** Header, banner and compact header never show two.
5. **Focus has a successor.** Removing, moving or replacing the focused element names where focus goes; a route announcement and a document title describe only the committed route.
6. **One sentence per failure.** Same status, same sentence, same request-id row, in every surface.

### DECISIONS.md entries to add (append-only; one heredoc per entry; only the ids reserved to the owner)

| Id | Owner | Title | Paragraph (what changed and why) |
|---|---|---|---|
| D-100 | W0-A | One focus ring, no clipping | Focus is `outline: 2px solid hsl(var(--ring)); outline-offset: 2px` on every focusable control, including `[data-variant=primary\|danger]` (the white ring and the `#fff` at `style.css:189` and `:391` go; the 4 px coloured halo goes). The gap between the control and the ring shows the surface, so the ring is 10.4:1 on the canvas. Tab strips (`overflow-x:auto` scrollers: `TabsList`, `LinkTabs`, the editor language strip) get a 4 px inset (`p-1 -m-1`) so the ring is never clipped. A programmatic focus on a heading (`tabindex=-1`, route change, dialog heading) draws no ring (it is not a control; the route announcer names it). Inside the dark preview stand-in the ring uses `--ring-inverse`. Forced colours: `Highlight`. Why: C3-01, C3-02, C3-04, C3-06; `14` §4 "focus is visible at all times". |
| D-101 | W0-A | State ladder and menu highlight | Pressed is its own step: `--primary-active` (about L 19 %) for primary, `--destructive-active` and a stronger tint for danger-outline, one extra grey step for ghost, tab, nav, row and kebab (`active:bg-muted`-class tokens). Menu items (row menu, user menu, More actions, select list): highlighted = `bg-accent-strong` plus a 2 px inset `--ring` outline (the fill alone is 1.14:1); in forced colours only the highlighted item is outlined (`Highlight`/`HighlightText`), no inversion of the rest. Popover, menu and tooltip layers sit above modals (`z-popover-over` = `calc(var(--z-modal) + 1)`). Why: C3-03, C3-05, C3-100. |
| D-102 | W0-A | Toasts dock beside the form, success is a check | Wide editors (from `edit`, 1180 px): the stack is anchored bottom-right, as wide as the side column (21.5 rem) and its right edge equals the side column's, so it never covers the form column (`--toast-inset-right` measured from `#editor-side-column`, `--toast-offset-bottom` above a sticky footer). Below 1180 px: full-width bottom with the 16 px gutter. "Link copied" is one line (no body, 40 px). Neutral confirmations (Discarded, Archived, Restored, Link copied) use the check icon, never the warning triangle; a toast that carries an instruction ("copy it by hand") persists until dismissed; a route change clears stale toasts; an event is announced by the bar or by the toast, not both. Why: C3-26, C3-27 (R2-V-04). |
| D-103 | W0-A | Focus has a successor; route announcements follow the committed route | `lib/focus.ts` gains `focusSuccessor(removed, candidates)`: next sibling action, else previous, else the nearest labelled region, else the page h1, never `<body>`. Toast dismiss, error-card retry, tile retry, upload Cancel/Retry, Undo and Restore all call it. The announcer and `document.title` are set from the committed route only (a cancelled guard announces nothing), after Esc on the leave guard focus returns to the opener, and the title follows the saved record's name reactively. Why: C3-09, C3-11. |
| D-104 | W0-A | Date and time fields validate field by field | `DateTimeFields` validates each part on blur: hour 0-23, minute 0-59, day against month and year (31 February is invalid), with one sentence per field linked by `aria-describedby`, an error icon plus text (never colour alone), and a polite announcement. An unparseable Start never rewrites End; End is only compared with a valid Start. "Ended" chip only for a valid past date. Why: C3-38 (WCAG 3.3.1, 3.3.3), `14` §4 errors linked and announced. |
| D-105 | W0-A | One sentence per failure, one request-id row | `lib/errors.ts`/`problemText.ts` hold the only table: 503 reads "busy or down for maintenance" in every surface; "not reachable" only for network failures; non-field errors never use a "N things to fix" title; `ProblemAlert` carries the one request-id row (label, value, Copy) used by cards, dialogs, lists, Maps, toasts. Why: C3-85; extends D-087. |
| D-106 | W0-A | Hit areas and HelpHint | `HelpHint` is a 40 px hit area with a 16 px icon (44 coarse); checkbox and radio rows have a 44 px label row under `pointer: coarse`; `.hit-44` is the rule for every text link in tables, the Dashboard, the logo and sort headers. Number-and-unit values use a non-breaking space (`formatBytes`, distance, "100 %"). Why: C3-49 (R2-V-02, third round open), C3-48, C3-44; `14` §4 44x44. |
| D-107 | W0-B | One readiness list before and after activation | `completeness.ts` merges the platform readiness items with the client slots by code and path: an item present on both sides is counted once (accessibility was counted twice). The Activate confirm, the card, the header badge, the toast and the Dashboard read the same list and the same sentence, "N to fix before activating" / "N warnings, nothing blocks", and while the backend cannot return readiness for a DRAFT (G-044) the card adds "plus checks run on activation". The client asset title blocker is dropped (the spec blocks on alt text or decorative only: `14` §4). Route with no stops, Event without dates and Guide with an empty story stay warnings (`12` §3) but are listed first and named in the confirm ("This Route has no stops. Visitors will see an empty route."); whether they should block is Q-021 (Guide: Q-019). The confirm lists missing fields as links that open the section and focus the field. Why: C3-14, C3-15, C3-16, C3-58. |
| D-108 | W0-B | One Save draft at a time | `12` §3 puts Save draft and Discard in the Working Copy banner and Apply in the header. While the banner is visible the header carries Apply (and "Save and apply") only. When the banner is released (viewport height below 700 px, which includes zoom 200) the header shows one compact Save draft. A DRAFT has no banner, so its header Save stays. The editor header, banner and compact header are measured: sticky chrome is at most 15 % of the viewport height down to 700 px, and at zoom 200 at most the app header. "Save and apply" lists the changes it applies. Why: C3-21, C3-23, C3-24, C3-15. |
| D-109 | W0-B | Side cards are one component | `SideCard` (h2 `text-sm font-bold`, `p-4`, `rounded-lg border bg-card shadow-1`, no nested h2) is the only side-column card; the column's max height is the viewport minus the sticky offset with a fade on both edges. Why: C3-31. |
| D-110 | P3-core | List row anatomy and the Filters popover | One row rule for all six lists: Title column flexible with `min-w` 15 rem and `overflow-wrap:anywhere`; slug on one line with a `title`; trigger chips on their own line (at most 2 plus "+N"); Order column one width; one header height; one tree indent step. The Filters popover has an accessible name, a visible Done, a button named "Filters 1" (visible text first), `max-height: var(--radix-popper-available-height)` with internal scroll, one label layout and one control width; below 900 px the active status is a chip beside the button; a third header-sort click returns to manual order. Why: C3-40..C3-47. |
| D-111 | P3-core | A move is visible and undoable | After Move up/down, Move to position or a drop: a toast "Moved to position N of M" with Undo (Ctrl/Cmd+Z), "Show it" when the row left the page, a 1.5 s row flash (a static outline under reduced motion), focus on the kebab (or the next row when it left the page). The live string uses at most 40 characters of the title. Paging moves focus to the table heading. Why: C3-08, C3-10. |
| D-112 | P2 | The Dashboard headline tells the truth and the guide ticks from data | "Live" only when `applicationStatus === "LIVE"`; SUSPENDED and unknown have their own sentences. While Launch is a placeholder: "Content is ready; going live is not available yet". The first-run guide ticks only what data proves (never a visit); step 3 shows "Not available yet" and is not counted (Q-022); the guide ends with "Next: activate the drafts that are ready" and can be restored from Project details. Why: C3-54, C3-56, C3-57. |
| D-113 | P8 | Preview controls live in the panel header; the new tab honours the options | "Preview in app" shows Surface tabs, Expand and Close in one header row (never 1,000 px below); Expand does not scroll, and is hidden when the panel already fits. `/app-preview` receives `orientation` and `real` as route props. Invalid parameters get fixed sentences without echoing the value; `<html lang>` follows the content language. Why: C3-64, C3-65, C3-70; `12` §3 "below the action". |
| D-114 | P6 | The armed floor-plan prompt docks | The "Placing X" prompt is in the sticky header zone (or below the plan on short screens), never over the plan; a tap on a taken spot announces "That spot is taken by <pin>". Why: C3-71. |
| D-115 | DOC | DESIGN.md is the system of record | `DESIGN.md` at the repo root (and `.impeccable/design.json`) describes the shipped system; `PRODUCT.md` stays the product source. Every token named in it exists (grep-proved). Spacing is a 4 px base with half steps; one line-height per type size; dots 32 px. Why: C3-101, `BRIEF.md` §2 item 4. |
| D-116 | CLN | Dead code removed; gates wired | The deletions of cleanup.md B and in-scope C are made and each is proved by grep; `check:css` covers every Tailwind family and runs `--all` in `make build`; `scripts/check-literals.mjs` (the literal gate) runs from `make check`. Out-of-scope visitor-app screens keep their legacy classes (`.field-input`, `.dialog-*`, Button aliases, `statusChipStyle`), listed in DESIGN.md as legacy. Why: C3-97, C3-98, C3-99. |
| D-117 | spare | reserved for the orchestrator | |

Order: D-100 to D-109 exist before the packages that rely on them start (written by W0-A and W0-B in Wave 0).

---

## 2. Wave 0: root causes (two agents, disjoint files, in parallel, then verified)

Gate after Wave 0 (orchestrator): `make typecheck`, `make build`, `make check-css`; screenshots: a primary button focused in a dialog, an editor language tab focused, an open row menu, a toast beside a POI editor at 1440, forced-colours dialog, Event date error. Only then Wave 1.

Contracts between the agents (both read these before starting):
- W0-A defines tokens used by W0-B: `--ring-inverse`, `--primary-active`, `--destructive-active`, `z-popover-over`, `h-logo`, `SideCard` is W0-B's own.
- W0-B guarantees an element with `id="editor-side-column"` (the side column root) for W0-A's `toastOffset.ts`; and an element `#editor-preview` unchanged.
- W0-B exports from `EditorShell` the injection key `EDITOR_PREVIEW` with `{ open: Ref<boolean>, expanded: Ref<boolean>, toggleExpand(): void, close(): void }` and removes the shell's own Expand/Close buttons (lines 626-631); P8's `PreviewPanel` renders them in its header.
- W0-B publishes `workspace/listBack.ts`: `listBackQuery(query): string` (whitelist of `q, status, lang, missing, sort, dir, page, category, featured, pending, view`) and `readListBack(route)`; P3-core writes `back` on title links, EditorShell reads it for the breadcrumb and Back.
- W0-B exports `issueRowText(issue)` from `readiness.ts` ("Title is missing in English"), used by P2.
- W0-A exposes `DateTimeFields` props/events (documented in its JSDoc) and a `Select` `size="sm"`; P5b and P3-core use them.

### W0-A Foundations (size L)

Closes: C3-01, 02, 03, 04 (token), 05, 06, 09 (rule and shared callers), 11, 12 (`FieldError`/announcer part), 26, 27 (toast), 38 (component), 44 (format), 48 (checkbox, hit-44), 49, 50 (`FormField`), 57/67 (glossary keys only), 63 (CSS contract), 64 (router), 84, 85, 92 (Close order, StateCard top), 93, 94, 100.

| # | Work | Files | Acceptance (checkable) |
|---|---|---|---|
| A1 | D-100: primary/danger ring from `--ring`; drop `#fff`; tab-strip inset in `TabsList` and `LinkTabs`; programmatic heading focus without ring; `--ring-inverse` token | `src/style.css`, `tailwind.config.js`, `ui/button/index.ts`, `ui/tabs/TabsList.vue`, `LinkTabs.vue`, `TabsTrigger.vue` | Playwright probe: focus a primary button in the Activate dialog and on the canvas: computed `outline-color` is not white and ring-vs-surface contrast >= 3:1 (measured 10.4:1 expected); tab focus ring has 0 clipped sides (compare `getBoundingClientRect` of ring box and scroller `clientRect`); heading focus after route change has `outline-style: none` |
| A2 | D-101: pressed tokens and classes for primary, danger-outline, ghost, tab, nav (`WorkspaceNav` is P1's: W0-A ships a `.nav-item` pressed class P1 adopts), row/kebab; menu highlight (`DropdownMenuItem`, select listbox); forced-colours block: highlighted item only | `src/style.css`, `tailwind.config.js`, `ui/button/index.ts`, `ui/dropdown-menu/DropdownMenuItem.vue`, `ui/select/Select.vue` | Computed background differs hover vs `:active` on 6 controls (script); highlighted menu item has a 2 px inset outline; forced-colours screenshot of an open menu shows one outlined item and no inverted rows |
| A3 | D-102 toasts: dock rule, `toastOffset.ts` reads `#editor-side-column`, tone icons, persistence, clear on route change, "Link copied" one line, one announcement | `components/AppToast.vue`, `stores/toast.ts`, `lib/toastOffset.ts` | POI editor 1440/1280/1024: toast box does not intersect the form column box (probe over `getBoundingClientRect`); "Discarded" shows the check icon; "Link copied" height <= 48 px |
| A4 | D-103 `focusSuccessor`; `restoreFocus` callers in shared files (toast dismiss, `StateCard` retry); announcer and title from committed route; `routeAnnouncer.ts` + router hook; Esc on the guard returns to the opener (`confirm.ts`) | `lib/focus.ts`, `lib/routeAnnouncer.ts`, `stores/confirm.ts`, `ConfirmDialog.vue`, `ui/state-card/StateCard.vue`, `router.ts` (title hook) | Cancel a leave-guard from the switcher: announcer text and `document.title` unchanged, focus on the switcher button; Category rename updates the title without reload; no step of the probe list ends on `BODY` for shared paths |
| A5 | D-104 `DateTimeFields`: per-part validation, `aria-describedby`, error icon + text, blur announce, no End rewrite, month-length rule, optional `ended` prop for dimming without opacity | `ui/field/DateTimeFields.vue`, `ui/field/FormField.vue` (error slot icon) | Typing hour 25, minute 61, day 31 in February: each shows a sentence with an icon, is `aria-invalid`, is announced once (live-region log), End is unchanged; forced colours: error visible without colour |
| A6 | D-105/D-106: `ProblemAlert` request-id row, one 503 sentence, no "N things to fix" for non-field errors (`FormErrorSummary` title rule), `HelpHint` 40 px hit, checkbox 44 px label row on coarse, `.hit-44`, NBSP in `format.ts` units, `FormField`/`Input`/`Textarea` `dir="auto"` unless the field's language is known RTL (prop `dir`) | `lib/errors.ts`, `lib/problemText.ts`, `lib/format.ts`, `ui/alert/ProblemAlert.vue`, `ui/field/FormErrorSummary.vue`, `ui/help-hint/HelpHint.vue`, `ui/checkbox/Checkbox.vue`, `ui/input/Input.vue`, `ui/textarea/Textarea.vue`, `ui/select/Select.vue` (`size="sm"`) | `page.route` 503 on three surfaces gives the same sentence and one request-id row; HelpHint hit box 40x40 (fine) and 44x44 (coarse); `formatBytes(163000)` has a NBSP; Arabic text typed in a Latin-language field keeps punctuation order |
| A7 | `AppDialog`: Close is first in Tab order in every dialog (visual position unchanged), anchored top edge (no jump when a summary appears: summary slot reserved or the panel top fixed), body padding one rule, one alert per error (summary `role=alert`, field message not), sticky footer when the panel exceeds 70 % of the viewport (C3-94); `FormDialog` same; Esc rules unchanged | `components/AppDialog.vue`, `ui/dialog/FormDialog.vue`, `ui/dialog/index.ts` | Create dialog at zoom200 (640x360 CSS px): the primary button is visible without scrolling the page; opening the summary moves the panel top by 0 px; Tab from dialog open reaches Close first in 15 of 15 dialogs (script over three dialogs) |
| A8 | Layers: `z-popover-over`, popover/menu/tooltip use it | `ui/popover/PopoverContent.vue`, `ui/dropdown-menu/DropdownMenuContent.vue`, `ui/tooltip/Tooltip.vue`, `tailwind.config.js` | A HelpHint opened inside a dialog is above the dialog (elementFromPoint) |
| A9 | C3-84: remove `code`, `state`, `iss` from the address bar after `keycloak.init` and after the first navigation resolves (`router.replace` to the cleaned location once, no extra history entry; also after "Sign in again") | `platform/auth.ts`, `router.ts`, `main.ts` | After a real sign-in (admin) `location.hash === ""` within 500 ms and `history.length` grew by <= 1; Back does not return to a URL with a code; token still in memory only (grep: no storage writes) |
| A10 | C3-64 router: `/app-preview` route passes `orientation` and `real` (and `surface`, `lang`, `t`) as props with a whitelist parser; `App.vue` untouched | `router.ts` | Unit probe: `?orientation=landscape&real=1` reaches the view props |
| A11 | Pre-seed glossary keys other packages need so none edits `glossary.ts`: `previewContent` (Working / Live), `fireTrigger`, `previewSurface`, `launchPlaceholder`, `readinessChecksOnActivation`, `translationsWorklist`, `bounds`, `visitorFilter` | `lib/glossary.ts` | Probe lists the keys |
| A12 | Pressed/selected/focus classes for forced colours of the stepper and first-run current-step circle (class `.forced-step-current`: `forced-color-adjust:none`, Canvas/CanvasText + thick ButtonText border) for P1/P2 | `src/style.css` | Class exists; P1/P2 apply it (their acceptance) |
| A13 | e2e: new `e2e/focus-and-gates.spec.ts` (ring contrast on a primary button in a dialog and on the canvas, tab-strip ring not clipped, menu item ring, toast does not overlap the form, icon-only buttons >= 32/44, no focus on `BODY` after the shared paths, `location.hash === ""` after sign-in); extend `touch-and-forced-colours.spec.ts` (forced-colours dialog and open menu screenshots) | `e2e/focus-and-gates.spec.ts` (new), `e2e/touch-and-forced-colours.spec.ts`, `e2e/support/*` | Written, `make typecheck` passes; not run (needs Keycloak), say so |

D-100 to D-106 are W0-A's. Out-of-scope check: `OverviewView`, `LanguagesView`, `SurfacesView`, `TranslationsView`, `NavigationView`, `SectionView` still render (one screenshot each; Button aliases and `.field-input` are untouched).

### W0-B Editor family (size L)

Closes: C3-07, 14, 15, 16 (warnings), 17, 18, 19 (POI/Place), 20 (hook), 21, 22, 23, 24, 25, 28, 29, 31, 32, 33 (FilteredSelect), 36 (`RemovedBar`), 37, 58 (data), 65 (contract), 83, 86 (editor Save), 89, 12 (readiness live region), 50 (TranslationsPanel dir), 51 (Back keeps the worklist), 92 (session dialog).

| # | Work | Files | Acceptance |
|---|---|---|---|
| B1 | D-107 merge: platform items and client slots counted once; accessibility counted once; drop the client asset title blocker (keep alt/decorative); one sentence in header badge, card, Activate confirm, toast, Dashboard; "plus checks run on activation" while G-044; structural gaps (Route 0 stops, Event no dates, Guide empty) are first in the warnings and named in the confirm | `platform/completeness.ts`, `platform/readiness.ts` (adds `issueRowText`, drops the kind prefix; RTL-safe `<bdi>` helper), `platform/assets.ts` (the completeness function only), `editor/ReadinessList.vue`, `editor/ActivateDialog.vue`, `StatusChangeDialog.vue` | DRAFT POI with 0 blockers and 6 warnings: confirm, toast, card and header all say 6; accessibility appears once; asset with alt text and no title activates; Route with 0 stops: confirm names "no stops" first (probe against a seeded Route) |
| B2 | C3-15: confirm shows the readiness sentence once, lists missing fields as links (open section, focus field), "Save and apply" lists the dirty fields | `editor/ActivateDialog.vue`, `editor/EditorShell.vue`, `StatusChangeDialog.vue` | Click a listed field: its section opens and the field has focus below the sticky stack; "Save and apply" confirm lists >= 1 "Changes:" line for a dirty ACTIVE editor |
| B3 | C3-07/C3-83: Discard moves focus to the Status heading (as Activate/Archive do), neutral check toast; persistent-401 dialog dismissed: state "Not saved: session ended. Sign in again", Save re-enabled and Ctrl+S works, "Sign in again" action in the banner; session dialog spacing and "your changes are kept" sentence only when a draft exists | `workspace/useResourceEditor.ts`, `editor/EditorShell.vue`, `SessionEndedDialog.vue`, `stores/sessionNotice.ts` | Discard: `document.activeElement` is the Status heading; force 401 on PUT, press Esc: Save is enabled, status line names the session, Ctrl+S retries; no state shows "Saving..." after dismissal |
| B4 | C3-17/C3-18: "Next missing" focuses the first empty field (skipping filled Title), expands "Practical details"/"Other settings" when the field is inside, scrolls clear of the sticky stack, goes to the next language when none; the button sits beside the language tabs at every width (side-card copy stays) | `editor/TranslationsPanel.vue`, `editor/EditorShell.vue`, `workspace/useResourceEditor.ts`, `workspace/translationStatus.ts` | 14 clicks on a POI with a filled Title never focus `#f-title`; when the fold holds the next field `aria-expanded` becomes true; at 1440 the button is within 60 px of the tabs |
| B5 | C3-21/22/23/24/25 chrome: D-108 (one Save draft), release the head bar rule below 700 px height, truncate status text with a `title`, keep only the app header sticky at zoom200 (<= 56 px), compact Save draft in the header when the banner is released, `scroll-padding-top` = measured stack; summary: in-flow below 900 px height, width follows the main column, Close inside the card, opaque top edge, own scroll with a cap, marks the failed row; C3-22 verify and fix only if reproduced | `editor/EditorShell.vue`, `editor/WorkingCopyBanner.vue`, `workspace/useStickyStack.ts` | At 1440x900 stack <= 15 %; at 1280x720 <= 15 %; at zoom200 only the app header sticks (<= 56 px, 15.6 % of 360) and Save draft is reachable by Tab from the title; at 1024x768 touch the Working Copy Save draft is visible without scrolling (header compact button); never two "Save draft" in the accessibility tree (script counts `button` names); the 422 summary does not intersect the field it links to |
| B6 | C3-28/29/31/37: Status card shows "Revision N" from creation (server revision), always shown, Updated follows Working Copy saves; ACTIVE Title hint "Required in the default language."; `SideCard` (D-109) used by `EditorStatusCard`, `ReadinessList`, `EditorSectionNav`; one Texts heading to tab-bar gap (0) and tab width for all editors | `editor/SideCard.vue` (new), `editor/EditorStatusCard.vue`, `editor/EditorSectionNav.vue`, `editor/TranslationsPanel.vue`, `editor/EditorSection.vue` | Side card h2 computed font-size and padding identical in Place/POI/Route (script); one nested h2 removed; Texts gap measured 0 in POI, Route, Guide, Event, Category, Asset (P5b/P7b only remove local overrides) |
| B7 | C3-32: ConflictDialog: Working Copy save 409 uses the three-way dialog, Apply 409 shows the request id and a short heading, a visible reason under the footer when "Keep my changes" is disabled, "Your other change (Title) is kept either way" | `editor/ConflictDialog.vue`, `workspace/useResourceEditor.ts` | Mocked 409 on Working Copy Save and on Apply: both show the three-way body, the request id, no 14-word heading; G-045 recorded if the payload lacks `current` |
| B8 | C3-19 (POI/Place): "Used in" omits the item's own triggers (or labels them "Its own ways in"), one pattern for blocked deactivate (disabled button, reason, "Show where it is used"); expose the same pattern for Category (P5b uses it) | `editor/EditorStatusCard.vue`, `workspace/useResourceEditor.ts` | POI with only its own QR: no "Used in" row; Category used by a Route: Deactivate disabled with reason and a link |
| B9 | C3-20 hook: after a parallel trigger batch the editor replaces its rows with the returned saved rows (marked saved), keeps the failed ones with `rowKey`, and never reports "Nothing was changed" after a partial save; retry sends only failed rows | `workspace/useResourceEditor.ts` | Mock one of two trigger writes 503: summary names the failed row, saved row is not re-sent on retry (network log) |
| B10 | C3-33 `FilteredSelect`: closed state shows the plain title (indent trimmed), visible label on the filter field at 25+ options, single match selects on Enter; C3-89: Restore row hidden when the form equals the stored draft; C3-36 `RemovedBar` space fix and a lower dock; C3-86: editor primary `aria-disabled` offline announces the reason on click; C3-12 readiness announces only when counts change; C3-27 callers; C3-50 `TranslationsPanel` passes `dir="auto"` | `editor/FilteredSelect.vue`, `editor/RemovedBar.vue`, `editor/ReorderControls.vue` (`!min-h-8` → `Select size="sm"`, `w-[4.75rem]` named), `editor/OtherSettings.vue`, `workspace/useResourceEditor.ts` | Closed Place select shows "Acropolis" with no leading spaces (read `select.selectedOptions[0].text`); after a failed 5xx save the Restore row is absent when nothing differs; offline: click Save announces the reason once |
| B11 | C3-51 Back: `workspace/listBack.ts`; EditorShell breadcrumb/Back keeps the list query | `workspace/listBack.ts` (new), `editor/EditorShell.vue` | List filtered `lang=it&missing=1`, open an item, click the breadcrumb: the filter is still on |
| B12 | C3-58 data: `describeIssue` gives the cause sentence for Dashboard rows | `platform/readiness.ts` | `issueRowText` returns "Title is missing in English" for a blocked mock |

W0-B writes D-107 to D-109. Preview: removes the shell's Expand/Close, adds `EDITOR_PREVIEW`.

---

## 3. Wave 1 packages

Common to all (verbatim from round 2 plus round-3 additions): import Wave 0 primitives only; every changed state screenshotted at 1440, 1280, 1024, 768 and zoom200 plus forced colours and reduced motion for the principal state; axe clean (`e2e/support/a11y.ts`); a recorded keyboard run with `document.activeElement` logged after every step (never `BODY` inside the path); icon-only controls >= 32 px (44 coarse) and text links 44 px under `pointer:coarse`; `ProblemAlert` for every error card; `focusSuccessor`/`restoreFocus` for every opener; report at `ux-audit/round-3/implementation/<package>.md` listing C3 ids closed, partly closed, and requests to other owners; e2e selectors updated, not run; never weaken a test; no `any`; DRAFT/ACTIVE/ARCHIVED words; British spelling; gate grep (section 7) over owned files; a package that needs a file owned elsewhere writes a request in its report and does not touch it.

Batches (at most 6 concurrent; lowest scores first): **batch 1** = P3-core, P2, P5b, P8, P1, P4. **Batch 2** (as slots free) = P3a, P3b (after P3-core lands its contract), P5a, P6, P7a, P7b.

Contract of P3-core (stable for P3a/P3b/P7a): `ListTable`, `ListToolbar` props unchanged; additions: `FilterChip` (new), `ListToolbar` slot `filters-extra`, `ListLoadError` takes `error`, `onRetry`, `useListQuery` exposes `errors` per source (`categories`, `places`, `triggers`) so views can show a notice.

### P3-core List core (size L) [lists 75-79]
- Closes: C3-08, 09 (lists), 10, 13 (radio Home/End), 40, 41, 42, 43, 44, 45, 46, 47, 48 (rows, sort headers), 50 (row titles `<bdi>`), 51, 87 (list errors), 91 (list skeleton), 99 (`FilterChip`), 101 (TranslationDots 32 px).
- Changes:
  1. Filters popover (D-110): name, Done, button "Filters 1", `max-height` available height with scroll (reachable at zoom200), one label layout and control width, status chip beside the button below 900 px, header-sort third click resets to manual order, plural and "1 match in Archived".
  2. Row anatomy (D-110): Title `min-w` 15 rem and `overflow-wrap:anywhere`; Category/Setting/Next date/Updated stack or shrink below 1280; slug one line with `title`; trigger chips own line (2 and "+N"); one Order width; one header height; one tree indent; Updated 150 px with NBSP for units/dates.
  3. Moves (D-111): toast with Undo and Ctrl+Z, "Show it", row flash with reduced-motion outline, focus kebab or next row, drag-drop focus, shortened live string; pager focus on the table heading and scroll to the table top.
  4. `focusSuccessor` for Undo bar, Restore, kebab; error cards focus the h1; `ListLoadError` for every failed read (Routes Categories, chips), error count instead of "0"; skeleton rows at real height and the known h1; reserved status row and count line.
  5. Move dialog: `aria-invalid`, `aria-describedby`, `inputmode=numeric`. Row title/Dashboard-style links get `.hit-44`; carry `lang`/`missing` on title links (`back` via `listBack.ts`) and a "Needs translation in Italiano" chip beside Clear filters and one Language control; per-kind links in Preview are P8's.
  6. `FilterChip` extracted (also used by `ListEmpty`); `ListEmpty` one New button, filtered-empty says what other statuses hold; `ListSelect` uses `Select`; Home/End roving in `StatusSegments`.
- Files: `components/list/*` (ListTable, ListToolbar, ListFooter, ListEmpty, ListLoadError, ListSelect, MatchHint, RowMenu, SetPositionDialog, SortSelect, StatusSegments, useCreateParam, useListQuery, FilterChip new), `components/TranslationDots.vue`, `TriggerChips.vue`, `views/workspace/useListLifecycle.ts`, `LifecycleDialogs.vue`, `listRows.ts`, `workspace/listFilters.ts`, `workspace/useReorder.ts`, `workspace/useCategoryFilter.ts`, `styles/list-table.css`, `e2e/content-lists.spec.ts`.
- Acceptance: at 1280 and 1024 every list's Title cell >= 240 px and a 60-character Greek title wraps without overprinting (no two cell boxes intersect); Filters popover at zoom200: fully inside the viewport (`top >= 0`, `bottom <= innerHeight`) and scrollable; axe `label-content-name-mismatch` clean on `/pois?pending=1`; Move to position 3 from page 2: toast visible, Undo restores (Ctrl+Z too), focus not on `BODY`; page change focus on the table heading within the viewport; `/pois` skeleton CLS <= 0.02 (was 0.07-0.11); radio Home/End does not scroll.
- Constraint check: `12` §3 lists (sortOrder default, reorder persisted, keyboard alternatives kept `14` §4); D-091 paging unchanged.

### P2 Dashboard and first run (size M) [Dashboard 78, first run 72]
- Closes: C3-48 (Dashboard links), 54, 55, 56, 57, 58 (rows), 59, 60, 61, 62, 63 (guide), 91 (Dashboard skeleton), plus Q-022 handling.
- Changes: D-112 headline branches (LIVE, SUSPENDED, unknown) in `StatusCard`; counts block second in DOM order in the single column (named grid areas, no `contents`+`order`); first-run guide ticks only from data, step 3 "Not available yet", "n of 4", ends with "Next: activate the drafts that are ready", "Show the guide again" in `ProjectDetails`; only one primary in first run ("Show drafts" secondary while the guide is open); launch wording while Launch is a placeholder; blocked rows use `issueRowText`, no kind prefix, `<bdi>`; errors: 403/404 hide Retry ("Choose another Project"), own sentences for 404/422, a failed pending list keeps the status card; counts as 2-3 column compact tiles below `nav`, guide fills its column, one card header class (`px-5 pt-5 pb-3`), thousands formatted, h1 on the 26 px row, secondary actions in one style (links); stepper-like current-step circle uses `.forced-step-current`; links `.hit-44`; skeleton mirrors the layout and says "Loading dashboard".
- Files: `views/workspace/DashboardView.vue`, `views/workspace/dashboard/*` (ContentCounts, FirstRunGuide, PendingChanges, ProjectDetails, ReadinessGroups, StatusCard, guideState), `platform/dashboardData.ts`.
- Acceptance: Tab order at 1024 follows visual order (script logs the order, no back-and-forth); mocked `applicationStatus: SUSPENDED` and a 503 settings read: headline contains neither "Live" nor "Ready"; visiting the placeholder pages leaves steps 3 and 5 unticked; counts card at 1024 <= 220 px tall and pending starts above y 560; forced-colours: current step number visible; Dashboard 403 shows no "Try again".
- Constraint check: `12` §3 Dashboard (status card, one action, <= 3 items, five-step guide: kept at five steps, step 3 flagged "Not available yet"); no recompute button.

### P5b Event and Category editors (size M) [Event 65, Category 78]
- Closes: C3-19 (Category), 33 (`EntityCombobox`), 36 (Event), 37 (remove local gaps), 38 (use `DateTimeFields`, Event occurrences), 39, 52 (Category), 53 (Event POI combobox).
- Changes: occurrences use `DateTimeFields` (D-104): per-field sentences, no End rewrite, 31 November and repeat-weekly 0/empty messages, "Ended" chip only for a valid past date, ended cards dim border and background, text stays full contrast (no `opacity`); Event non-default tabs and Category non-default tabs fold structural controls under "Other settings (all languages)" (as POI/Place, D-079); Category blocked deactivate uses the B8 pattern (no "Deactivate" dialog without an action); `EntityCombobox` and its search use the shared fold helper (NFD strip + `toLocaleLowerCase`) and a visible label; slug `break-words`; enum humanised in chips; 40 px position select.
- Files: `events/EventEditorView.vue`, `events/EntityCombobox.vue`, `events/eventDates.ts`, `categories/CategoryEditorView.vue`, `components/CategoryIcon.vue`, `platform/events.ts`, `platform/categories.ts`.
- Acceptance: probe types hour 25 / minute 61 / 31 Feb / empty day: each field announces its sentence (live-region log), End unchanged; axe 0 on an Event with an ended date (`color-contrast` clean); `?lang=el` Category shows no editable structural control outside the fold; "παρθενωνας" finds "Παρθενώνας".
- Constraint check: `12` §3 Category ("Applies to" locked when in use) and Event dates.

### P8 Preview page, stand-in, Preview in app, new tab (size L) [Preview in app 68, new tab 72, Preview 81]
- Closes: C3-04, 09 (Retry), 51 (Preview count is a link), 64, 65, 66, 67, 68, 69 (with P4 for QR), 70.
- Changes: D-113 in full; `PreviewPanel` header = Surface tabs + Expand + Close (consumes `EDITOR_PREVIEW`), Expand never scrolls the picture away and is hidden when the panel already fits (also fixes the no-op at <= 1024); `AppPreviewView` honours `orientation` and `real`; fixed-height caption/note row so the picture does not jump when the surface changes, trigger select fixed width and the chip on its own row; HelpHints for Working/Live, Fire a trigger and Surface (glossary keys exist); empty Project: links to Places and a plain Live/Working explanation outside the frame; toolbar aligned to the 256/1416 column, NBSP in "100 %", clear the old "Opened by" line after a fire, `?trigger=` replaced after use, short visible labels at 768; stand-in dark header focus ring uses `--ring-inverse`; invalid params: fixed sentences, no echo, `<html lang>`; "Preview count" links to the filtered list with `lang`/`missing`; plural fixed.
- Files: `views/workspace/PreviewView.vue`, `views/AppPreviewView.vue`, `components/preview/*`, `components/editor/ResourcePreview.vue`, `components/editor/PreviewPanel.vue`, `workspace/preview.ts`, `previewData.ts`, `previewModels.ts`, `projectTheme.ts`, `e2e/editor-preview.spec.ts`.
- Acceptance: POI editor at 1440, 1280, 1024: Close and Expand are in the panel header, within 80 px of the top of the picture; Expand keeps the picture in the viewport; `/app-preview?surface=kiosk&orientation=landscape` opens landscape and `real=1` sets scale 1.0 (read scale label and frame width); focus ring on the stand-in header >= 3:1 (measured); changing Surface moves the picture top by <= 2 px; `?lang=<script>` shows no `<script>` text; axe clean.
- Constraint check: `12` §3 ("below the action", labelled frame), `14` §4 CMS chrome operable with the frame focused, AGENTS 4.9/4.10 (no analytics event, author's token).

### P1 Chrome, session, picker, Create Project (size L) [Offline 71, Picker 78, Create Project 79, Header 85, Sign-in 85]
- Closes: C3-11 (switcher), 48 (logo), 50 (PageHead, breadcrumb), 62 (h1 row, chip name), 63 (stepper), 85 (project load), 86, 90, 91 (layout skeleton), 92, 95, 96.
- Changes: offline banner gets a reserved row under the header (no cover of "New ...", no clip under the sticky head), page-head primaries `aria-disabled` plus an offline reason, announced on click; picker: no "Setup not checked" chip when nothing is known, one "Checking setup..." line, counts settle before they show (G-029 limit stated); `aria-controls=""` removed; nav drawer named "Menu"; "Page not found" everywhere; one error-card top; Create Project: `items-start` stepper, visible helper for the disabled Continue and focus on the Template group on click, Greek default stated in one line, notices and "Change" aligned, zoom200 first field above the fold; slug capped at 100 client-side with a stated limit, "Type a slug in Latin letters" for an empty slug, `dir=auto` on the name; header chip name = page chip name ("Visitor app"); `h-logo` token on the logo and a 44 px logo link under coarse; skeleton shows the known h1 and a bar instead of "Organisation"; session error and sign-in verified at 768 and zoom200; configuration-error card exercised by a mocked runtime config (evidence for row 4).
- Files: `views/HomeView.vue`, `SignInView.vue`, `SessionErrorView.vue`, `NotFoundView.vue`, `CreateProjectView.vue`, `views/createProject/*`, `components/ProjectList.vue`, `ProjectSwitcher.vue`, `AppHeader.vue`, `WorkspaceNav.vue`, `OfflineBanner.vue`, `PageFrame.vue`, `PageHead.vue`, `AppBreadcrumbs.vue`, `SectionTabs.vue`, `CapabilityNotice.vue`, `stores/connection.ts`, `stores/projects.ts`, `views/workspace/ProjectLayout.vue`, `platform/catalogue.ts`, `platform/templates.ts`, `workspace/currentProject.ts`, `workspace/lastProject.ts`.
- Acceptance: offline toggle at 1440 and 768: banner box does not intersect any page-head action; Home list of 17 rows shows at most 1 "Checking setup..." and settled counts on three loads; axe `aria-valid-attr-value` clean on the switcher; Create Project at zoom200: first field's top < 360 px; a 117-character Greek name gives a slug <= 100; forced colours: stepper current number visible; sign-in screenshots at 768 and zoom200 and a clean keyboard run recorded (closes the evidence gap).
- Constraint check: `12` §3 picker, `02` §2; tokens in memory.

### P4 Place and POI editors, triggers, media slots (size L) [POI 76, Place 83]
- Closes: C3-12 (coordinate fields), 20 (UI, mapping), 30, 34, 63 (disclosure padding), 69 (QR size).
- Changes: Triggers card: saved rows collapse to a one-line summary with an Edit disclosure (target editor height <= 1,450 px populated at 1280, R2-V-07), "Mobile app only" moves into the description, beacon head does not wrap, failed rows are marked with their sentence (consumes B9), own-record duplicate is mapped to "already saved on this item", no "beacon 1, uuid" leftovers; "Link copied" only (no instruction paragraph); QR card says "Prints sharp up to N cm"; Place editor: choosing a Map does not mark the form "Unsaved changes", shows "Linked to <map>" with Undo and an inline "Saved immediately" label; "Practical details" disclosure padding and forced-colours border; coordinates announce once.
- Files: `places/PlaceEditorView.vue`, `pois/PoiEditorView.vue`, `components/editor/TriggersCard.vue`, `QrCodePreview.vue`, `BackendQrCode.vue`, `components/media/MediaSlots.vue`, `platform/pois.ts`, `platform/places.ts`, `platform/triggers.ts`, `e2e/place-editor.spec.ts`.
- Acceptance: POI with QR, geo and beacon saved: editor height <= 1,500 px at 1440 (from 1,454-2,496) and each saved row <= 56 px collapsed; one of two trigger writes 503: summary names the failed row, the saved row is not re-sent; Place map link then Undo restores; header does not say "Unsaved changes" after linking; Tab stops Save to end of Placement <= 8.
- Constraint check: `12` §3 POI (triggers inside "How visitors reach it").

### P3a Places, POIs, Routes lists and create dialogs (size M) [after P3-core]
- Closes: C3-27 (`CreatePoiDialog:68`), 42/43/44 (view column definitions), 85, 87 (Routes Categories failure alert, trigger chips failure notice), 88 (unmapped path), 89, 93, 48 (view links).
- Changes: Route "Setting" and Place/Category levels use one control pattern across the six dialogs (radio cards for scope/level, select only for long lists); one `role=alert` per error (summary), "Creating..." with one ellipsis character, offline "Nothing was created", no "1 thing to fix" over a server fault, unmapped field path gets a generic line; Routes distances "1.6 km" with NBSP; trigger chips cap 2 plus "+N".
- Files: `places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, `places/CreatePlaceDialog.vue`, `pois/CreatePoiDialog.vue`, `routes/CreateRouteDialog.vue`, `places/placeTree.ts`.
- Acceptance: with Categories aborted the POI and Routes lists still list rows plus a notice with Try again and focus on its heading; the create dialogs of the six kinds measure identical body padding and Close offset (script); a 503 on create shows the one 503 sentence and no "things to fix".
- Constraint check: `12` §3 Place creation order.

### P3b Guides, Events, Categories lists and create dialogs (size M) [after P3-core]
- Closes: C3-42/43 (views), 85, 88, 89, 93 for Guide, Event, Category dialogs; Events "Next date" values keep date and time on one line.
- Files: `guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue`, `categories/RadioChips.vue` (Home/End roving).
- Acceptance: as P3a for these dialogs; Events at 1024: Next date on one line, Title >= 240 px.

### P5a Route and Guide editors, StoryEditor, resource picker (size M) [Route 81, Guide 81]
- Closes: C3-12 (Add stops and Guide add announce once), 35, 36 (Route/Guide), 48 (unplaced-stop links), 53 (picker).
- Changes: Route map pins 1-4 fan out at default zoom (cluster-expand), one merged legend line; label "Heading (block 2)"; position select 40 px; slug `break-words`; the empty-story and no-stops warnings render through the B1 model; picker search folds accents and case (`fold`), one polite message per action; unplaced-stop links `.hit-44`.
- Files: `routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `guides/guideElements.ts`, `components/editor/StoryEditor.vue`, `StoryEditor.ts`, `components/ResourcePickerDialog.vue`, `resourcePicker.ts`, `components/RouteMap.vue`, `platform/routes.ts`, `platform/guides.ts`, `e2e/guide-reference.spec.ts`.
- Acceptance: Route with 5 stops at 1440 and 768: no two pin boxes overlap by more than 25 %; adding 3 stops yields one live-region message; picker finds "Παρθενώνας" with "παρθενωνας"; block label never reads "Heading 2, level 3".
- Constraint check: `12` §3 Route, Guide.

### P6 Maps and floor plans (size M) [Map editor 84, Floor plan editor 83, lists 85, dialogs 85]
- Closes: C3-02 (MapsTabs), 09 (tile Try again), 12 (coordinates once), 71, 72, 73, 74, 75, 76, 87 (Maps false "0").
- Changes: D-114 armed prompt docked, taken-spot announcement, correct touch copy; bounds handles not clipped (fit padding 16 px, attribution moves while editing); tile-failure card overlays the map; gutter tinted; New map dialog reserves a message line, kind label from `type` before `addresstype`, Reset whenever any field differs; coordinates formatted on blur by one formatter and copy "Across (x) must be between 0 and 1."; `aria-hidden` on the canvas and `role=status` on the loading chip; "17 POIs" labels; legend only when something is drawn; New floor plan dialog focuses its first field; a failed read shows an error count, not "0".
- Files: `maps/MapsView.vue`, `MapEditorView.vue`, `FloorPlanEditorView.vue`, `FloorPlansView.vue`, `NewMapDialog.vue`, `NewFloorPlanDialog.vue`, `MapsTabs.vue`, `components/map/*`, `components/GeoPicker.vue`, `platform/maps.ts`, `platform/floorPlans.ts`, `e2e/place-map-link.spec.ts`.
- Acceptance: floor plan armed at 1024x768 touch and mouse: prompt box does not intersect the plan image box; bounds handles fully inside the map box at 1440; New map error moves the dialog top by 0 px; Maps list with `/maps` aborted shows an error, not "0"; evidence added for 1280/1024 of lists and dialogs (closes the "one width" gap).
- Constraint check: `14` §4 coordinate fields; D-064/D-081.

### P7a Media library and upload (size M) [Media library 82, Upload 82]
- Closes: C3-09 (Cancel/Retry), 47, 51, 78, 79 (grid), 80, 81, 82, 88 (Describe now), 91 (grid), 99 (MediaView chip, ghost).
- Changes: count line and Filters badge count every active filter or drop the number, "(1 archived)" scoped to the same filter; grid chip rows bottom-aligned (`mt-auto`, fixed minimum title height); cold load: the first request is 48 and the rest loads in the background with the count updating (full server paging is G-041); typographic quotes, "20 MB", one word "Not used yet", date and time like lists, "Audio files have no alternative text.", thumbnail minimum size; upload dialog: top edge anchored, Esc with held rows confirms, "Needs your decision" on one line, "Describe now" shows the 422 message at its field and offers no retry; focus after Cancel/Retry goes to the next held row or "Choose files" (`focusSuccessor`); skeleton at real height (35 px grid jump gone); uses `FilterChip` and `Button variant=ghost`; Language control and the worklist chip as lists.
- Files: `views/workspace/media/MediaView.vue`, `components/media/UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `DescribeNowDialog.vue`, `AssetThumb.vue`, `workspace/useAssetUpload.ts`, `e2e/media.spec.ts`.
- Acceptance: library cold load first paint of 48 tiles in <= 1.5 s on the dev server (measured, noted as dev timing), count settles without a jump; chip rows' bottom edges equal within 1 px across a grid row; upload Cancel then Tab: focus is inside the dialog; Describe now with a mocked 422 shows the message at the field and no "Try again"; filtered library count line states the filtered count.
- Constraint check: `12` §3 Media library; `14` §4 live-region for uploads.

### P7b Asset editor and picker (size M) [Asset editor 80, Asset picker 82]
- Closes: C3-14 (asset blocker UI), 37 (remove local gap), 44 ("163 KB" NBSP), 52 (Asset), 77, 79 (picker), 81 (picker/editor).
- Changes: "Decorative image" is a controlled checkbox: Esc and "Keep it described" restore it to unticked and the model agrees; under non-default language tabs the Name and Decorative controls fold into "Other settings (all languages)"; Activate disabled only for the spec blockers (alt or decorative), the reason names the missing language; picker tiles chips bottom-aligned, sizes with NBSP, quotes, thumbnails minimum size.
- Files: `views/workspace/media/AssetEditorView.vue`, `components/media/AssetPickerDialog.vue`, `AssetPreview.vue`.
- Acceptance: tick Decorative, press Esc: checkbox unticked (`checked === false`) and nothing was changed; same for "Keep it described"; `?lang=it` shows no editable structural control outside the fold; picker chip rows aligned within 1 px.
- Constraint check: `14` §4 (alt text or decorative).

---

## 4. Wave 2: cleanup, then document (after Wave 1 is verified; sequential so DESIGN.md describes the final tokens)

### CLN Final cleanup (size M) [C3-97, C3-98, C3-99, cleanup.md B, C (in-scope), D, F]
Each deletion is proved by `grep -rnE "\bName\b" src e2e` (and path forms) returning 0 hits outside the file; record the grep and its output in the report. Out-of-scope visitor-app screens (cleanup §E) are NOT touched; classes they still use are kept and listed.
- **B delete:** `components/CategoryFilterSelect.vue`, `FeaturedFilterChip.vue`, `FilterChoiceGroup.vue`, `ListFilterMenu.vue`, `SearchLanguageSelect.vue`; `workspace/useStatusActions.ts`; `useReorder.ts` `dropLineClass` (only after Route/Guide editors show `shadow-drop-*` lines in forced colours: add a `Highlight` outline counterpart in `style.css` first, per C3-97); `style.css` `.small-label`, `.table-head`, `.table-row`, the `.on-primary` selector (keep `[data-variant]` selectors); `.nums` after replacing the 2 users (`LinkTabs.vue:30`, `PreviewPane.vue:95`) with `tabular-nums`; `styles/list-table.css` dead `.th`, `.th.text-right`, `.td` (and `.list-th-translations`/`.list-guide` if grep shows 0); unused barrels `ui/dialog/index.ts`, `ui/empty-state/index.ts`, `ui/spinner/index.ts`, `ui/switch/index.ts`, `ui/textarea/index.ts` (delete, since callers import `.vue` directly; one import style); dead config: `tailwind.config.js` `darkMode`, `container`, the `tailwindcss-animate` plugin line, unused tokens (`--radius`, `z-base`, `line` colour, `text-2xl`, `card-foreground`, `popover-foreground`) after grep, the 2 `rounded-xl` users (`StateCard.vue`, `SignInView.vue`) become `rounded-lg`. `package.json`: do **not** edit dependencies or the lockfile (no installs from WSL); the report lists `tailwindcss-animate` for the owner to remove.
- **C in-scope consolidation:** delete `components/list/ListSelect.vue` once Wave 1 migrated callers (grep 0); keep `.field-input`/`.field-label`, `.dialog-primary/.dialog-secondary`, Button aliases `default/brand/outline/destructive/lg` and `format.ts` `statusChipStyle`/`statusGlyph` (all used only by out-of-scope screens: `SurfacesView`, `TranslationsView`, `NavigationView`, `LanguagesView`, `OverviewView`; grep proof in the report); decide the three empty-state patterns: `ListEmpty` (lists) and `StateCard` (full-page) survive, `ui/empty-state` is deleted if its single non-ui user is in scope (migrate it first).
- **D in-scope literals:** the Wave 1 owners fix their files (AppHeader `h-logo`, ReorderControls, PreviewView skeleton height, FloorPlanEditorView shadow and px, GeoMapCanvas 22 px glyph named and commented, StepTemplate `border-black/10`, PreviewApp `z-raised`, WorkspaceNav `text-compact`); CLN runs the gate and fixes only leftovers, documenting the intentional ones with a comment (`QrCodePreview` `bg-white` for QR contrast, `EditorShell` mask `#000`).
- **F gates:** widen `scripts/check-css-tokens.mjs` (no split inside `[...]`, add `text`, `leading`, `duration`, `ease`, `animate`, spacing, colour families and the custom screens, keep `--all`); new `scripts/check-literals.mjs` implementing the literal gate (`text-\[[0-9.]+px\]|rounded-\[|shadow-\[|z-\[|tracking-\[|uppercase|#[0-9a-fA-F]{6}`) over CMS-chrome paths with a documented allow-list and an explicit out-of-scope path list; `package.json` scripts `check:literals` and `check`; `Makefile` targets `check-literals`, `check`, and `build` runs `check-css --all` first; no CI files outside the repo. e2e additions already exist (A13); CLN confirms they are referenced in `e2e/README.md`.
- Files owned (Wave 2): `scripts/*`, `Makefile`, `package.json` (scripts only), the files listed for deletion, and the one-line edits above in `StateCard.vue`, `SignInView.vue`, `LinkTabs.vue`, `PreviewPane.vue`, `tailwind.config.js`, `src/style.css`, `styles/list-table.css`, `workspace/useReorder.ts`.
- Acceptance: `make typecheck`, `make build` (with `check-css --all`), `make check-css`, `make check-literals` pass; build bundle size not larger; the 15 deletions each have a recorded zero-hit grep; one screenshot of each out-of-scope screen (Overview, Languages, Surfaces, Translations, Navigation, a section page) renders as before; `git`-free diff note lists files deleted (no commit).

### DOC Write DESIGN.md (size M) [C3-101, D-115]
Runs after CLN. Impeccable `document` in scan mode, with no user questions (a subagent cannot ask): the qualitative language (North Star, colour names, elevation philosophy) is taken from `PRODUCT.md` and the incumbent description in `round-3/audit/design-system/report.md`, and the report lists which wording is an assumption for the owner to correct.
- Source: the "DESIGN.md source table (as built)" corrected for what Wave 0/1/CLN changed: focus model (D-100), state ladder (D-101, `--primary-active` etc.), toast dock (D-102), z layers including `z-popover-over`, `HelpHint` 40 px, tokens added (`--ring-inverse`, `h-logo`), removed aliases (`secondary`, `sunken`, `line`, `2xl`, `--radius` if deleted), the line-height per size, a 4 px base with 6 and 10 half-steps, translation dots 32 px, themed scrollbars/caret/selection if W0-A shipped them (document only what exists). Each token and class named in the file is checked by `grep` against `src/style.css` and `tailwind.config.js`; any mismatch is fixed in DESIGN.md (not the code) or reported.
- Output: `DESIGN.md` at the repo root in the official format (YAML frontmatter: `colors`, `typography`, `rounded`, `spacing`, `components` with `button-primary`, `-hover`, `-active`, `button-secondary`, `button-ghost`, `button-danger`, `chip-*`, `input`, `card`, `dialog`; then Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts) and the sidecar `.impeccable/design.json` (schemaVersion 2). Do's and Don'ts carry the craft floor bans and the round-3 rules 1-6. Legacy classes used only by out-of-scope screens are listed under Don'ts ("do not use `.field-input` in new screens").
- Files owned: `DESIGN.md`, `.impeccable/design.json`, `ux-audit/round-3/implementation/document.md`. It edits nothing else and reads `src/` only.
- Acceptance: every colour hex equals `style.css`; every type size/line-height equals `tailwind.config.js`; a grep script (saved in the report) lists 0 unknown tokens; the file's spacing and radius sections match `check-css` families.

---

## 5. Score lift table (all 41 in-scope rows are below 90 in R2)

Lift means: the listed fixes close every open P1/P2 on the row, and the round-3 verification supplies the 90+ evidence (every state screenshotted at 1440/1024/768/zoom200, a clean keyboard run, axe 0). Rows resting on one agent at one width (31, 33, 23, 24, 32, 34) also need the missing widths re-shot by the owner.

| # | Row | R2 | Clusters | Package | What lifts it to 90 |
|---|---|---|---|---|---|
| 1 | Sign-in | 85 | 01, 84, 92 | W0-A, P1 | Primary ring visible, code leaves the address bar, 768/zoom200 and keyboard evidence |
| 2 | Silent SSO landing | 85 | 84, 91 | W0-A, P1 | Same, plus a skeleton with the known h1 |
| 3 | Session-expired | 73 | 83, 92, 11, 85 | W0-B, W0-A, P1 | Save recovers after dismiss, spacing and draft sentence, one 503 sentence |
| 4 | Config error | 77 | 85, 92 | W0-A, P1 | One card top and wording, exercised by a mocked config (evidence) |
| 5 | 403 | 82 | 85, 59, 92 | W0-A, P2, P1 | One sentence and request row, no "Try again" |
| 6 | 404 | 82 | 92, 59 | P1, P2 | "Page not found" everywhere, own sentence |
| 7 | 502/503/504 | 82 | 85, 92 | W0-A, P1 | One sentence per status, one card style |
| 8 | Offline banner | 71 | 86, 12 | P1, W0-B | Reserved row, no cover of "New", aria-disabled reasons announced |
| 9 | Header and nav | 85 | 01, 03, 48, 49, 92, 62 | W0-A, P1 | User menu highlight and ring, 44 px logo, drawer "Menu"; offline/skeleton states clean |
| 10 | Toasts, dialogs, skeletons | 79 | 26, 27, 91, 93, 94, 100, 09 | W0-A, P1 | Toast dock, tone, sticky footer at zoom200, mirrored skeletons |
| 11 | Project picker | 78 | 90, 92, 11, 12 | P1 | No "Setup not checked" noise, settled counts, no empty `aria-controls` |
| 12 | Project switch | 82 | 11, 09 | W0-A, P1 | Announcer/title from committed route, focus back to opener |
| 13 | Create Project | 79 | 95, 96, 63, 49 | P1 | Stepper alignment, visible Continue reason, slug cap, forced-colours step |
| 14 | Dashboard populated | 78 | 54, 55, 57, 58, 59, 60, 61, 62, 48, 91 | P2 | Truthful headline, DOM order, copy, layout, errors |
| 15 | Dashboard first run | 72 | 56, 62, 63, 60 | P2 | Data-driven ticks, step 3 flagged, next step, one primary |
| 16 | Places list | 77 | 08, 09, 10, 40-48, 51, 87, 91 | P3-core, P3a | Core fixes, tree indent, Title width |
| 17 | POI list | 79 | same + 43 chips | P3-core, P3a | Chips on own line, filters popover, move feedback |
| 18 | Routes list | 75 | 42, 44, 87 | P3-core, P3a | Title 240 px, "1.6 km", Categories failure alert |
| 19 | Guides list | 77 | core | P3-core, P3b | Core fixes |
| 20 | Events list | 77 | core, 42, 44 | P3-core, P3b | Core fixes, Next date on one line |
| 21 | Categories list | 77 | core | P3-core, P3b | Core fixes, Home/End roving |
| 22 | Create dialogs | 82 | 93, 94, 85, 88, 89, 27 | W0-A, P3a, P3b | One frame, one alert, sticky footer |
| 23 | New map dialog | 85 | 74, 01, 94 | P6, W0-A | Reserved message line, correct kind label, Reset; 1280/1024 shots |
| 24 | New floor plan dialog | 85 | 76, 94 | P6, W0-A | First-field focus, sticky footer; 1280/1024 shots |
| 25 | Place editor | 83 | 07, 14-18, 21-25, 28, 29, 31, 32, 34, 37 | W0-B, P4 | Chrome, readiness, side cards, map-link wording |
| 26 | POI editor | 76 | + 20, 30, 63 | W0-B, P4 | Triggers card, height, Next missing, Discard focus |
| 27 | Route editor | 81 | 35, 36, 12, 53, 16 | P5a, W0-B | Pin fan-out, announcements, picker folding |
| 28 | Guide editor | 81 | 16, 36, 12 | P5a, W0-B | Same |
| 29 | Event editor | 65 | 38, 39, 36, 53, 33 | W0-A, P5b | DateTimeFields rebuilt, contrast |
| 30 | Category editor | 78 | 52, 19, 37 | P5b, W0-B | Structural controls folded, deactivate pattern |
| 31 | Maps list | 85 | 87, 76, 02 | P6 | Error count, labels, ring; 1280/1024 evidence |
| 32 | Map editor | 84 | 72, 73, 75, 76, 09 | P6 | Handles, tile card, formatter |
| 33 | Floor plans list | 85 | 87, 76 | P6 | Same; evidence at more widths |
| 34 | Floor plan editor | 83 | 71, 75 | P6 | Docked prompt, taken-spot message |
| 35 | Media library | 82 | 78-81, 47, 51, 91, 99 | P7a | Honest counts, alignment, first paint |
| 36 | Upload dialog | 82 | 82, 09, 88 | P7a | Anchored top, Esc confirm, focus successor |
| 37 | Asset editor | 80 | 77, 52, 37, 14 | P7b, W0-B | Controlled Decorative, fold, blocker aligned with spec |
| 38 | Asset picker | 82 | 79, 81, 44 | P7b | Alignment and format |
| 39 | Preview page | 81 | 04, 66-69, 51 | P8, W0-A | No jump, hints, ring inside frame |
| 40 | Preview in app | 68 | 65 | W0-B, P8 | Close/Expand in the panel header, no scroll, Expand logic |
| 41 | Open in new tab | 72 | 64, 68, 70 | W0-A, P8 | Orientation/real honoured, dead end explained, no echo |

Expected mean after Wave 1 if every package meets its acceptance: at or above 90 for the 41 rows, mean >= 93 target; the verification agents decide (lowest credible score, caps applied).

---

## 6. Deferred, rejected, QUESTIONS and GAPS

### Deferred or partial (count: 6; no whole cluster is dropped)

1. **C3-13 (P3), translation dots add 3 link stops per row:** left as is. Each dot is a deep link to a language tab (`12` §3 completeness dots, translator job); one stop with a menu adds a click to the translator's main path. Radio Home/End is planned. Revisit in a later round with a translator test.
2. **C3-80 (P2), full server paging for Media:** only the first request of 48 plus background load is planned; server-side counts and filters are G-041.
3. **C3-16 (P2), blocking for Route/Event/Guide gaps:** warnings, named and listed first (D-107); the blocker is Q-021 (Guide also Q-019, G-039).
4. **C3-73 (P3), map box fitted to the bounds aspect:** only the overlay card and tinted gutter are planned; resizing the box changes the editor height contract (D-074).
5. **C3-90 (P2), persistently unknown setup status:** the chip noise and count settling are planned; the cause is that the listing carries no setup status (G-029 limit stays).
6. **C3-14 asset title blocker:** dropped client-side by D-107; if the backend still blocks on title it is G-043.

Rejected: client-side blockers for structural gaps (spec `12` §3/§5); making the Place Map link a Save-bound field (it is a separate write; the plan labels it "saved immediately" with Undo); removing `tailwindcss-animate` from `package.json` (needs a lockfile update, no installs from WSL: reported to the owner); touching visitor-app screens (cleanup §E).

Not planned because already covered by the plan's evidence rules: curator-account runs, real RTL language, real NVDA/VoiceOver (the verification round, section 7 item 6).

### QUESTIONS.md (append in one heredoc, by W0-A; next id Q-021)

```
### Q-021 — Should a Route without stops, an Event without dates or a Guide without a story block activation?
- Kind: spec-change-request
- Source: UX overhaul round 3 (C3-16).
- Question: `12` §3 says "fewer than two stops is a warning" for a Route and lists no dates or story rule for an
  Event or a Guide; `12` §5 makes readiness the single source of what is missing. Today a Route with no stops,
  an Event with no dates and a Guide with an empty story activate with only translation warnings. May readiness
  report them as blocking issues (and the CMS show them as such), or must they stay warnings? Q-019 asks the
  same for the Guide story; this entry covers Route and Event. The CMS shows them as warnings, listed first and
  named in the activation confirm, until answered.
- Consequence: Route, Event and Guide editors, Activate confirm, Dashboard status card.

### Q-022 — Five-step guide while "Compose a Page" is not available
- Kind: spec-change-request
- Source: UX overhaul round 3 (C3-56).
- Question: `12` §3 fixes a five-step first-run guide whose third step is "compose a Page". Pages is a placeholder
  in this CMS, so step 3 opens a page that says "Not available yet" and used to be ticked by visiting it. May the
  guide say "Not available yet" on step 3, count progress as "n of 4" while Pages is missing, and end with
  "Next: activate the drafts that are ready"? The CMS does this and keeps five steps.
- Consequence: Dashboard first run.
```

### GAPS.md (append in one heredoc, by W0-A; next id G-043)

```
### G-043 — Does the backend block activation of an asset without a title? (verify)
- Need: `14` blocks activation on missing alt text or the decorative flag only. The audit saw an asset blocker
  remain after alt text was added. If the backend refuses on a missing title, change it to a warning; otherwise
  the CMS drops its own title blocker (done). UX overhaul round 3, C3-14.

### G-044 — Readiness for one Resource while it is a DRAFT
- Need: a per-Resource readiness read (blockers and warnings with codes and paths) before activation, so the
  card, the confirm and the toast share one list from the server. Today the platform items appear only on
  activation, so the CMS says "plus checks run on activation". C3-14.

### G-045 — Working Copy 409 payload and request id on Apply (verify)
- Need: confirm that the Working Copy save/apply `409` carries `current` (the other version's values) and the
  `requestId`; the three-way dialog needs both. C3-32.

### G-046 — Authorization-code cleanup is client-only (record)
- Need: none from the backend. Recorded so the identity-provider redirect (`code`, `state`, `iss` in the
  address bar) is not mistaken for a backend defect; the CMS removes them after `keycloak.init`. C3-84.
```

New ids: D-100..D-116 (D-117 spare), Q-021, Q-022, G-043..G-046.

---

## 7. Execution protocol and definition of done

1. Order: W0-A and W0-B in parallel -> orchestrator gate (section 2) -> batch 1 (P3-core, P2, P5b, P8, P1, P4) -> batch 2 (P3a, P3b after P3-core; P5a, P6, P7a, P7b) -> orchestrator Wave 1 gate (typecheck, build, check-css, one screenshot per out-of-scope screen) -> CLN -> orchestrator gate -> DOC -> final verification round.
2. Definition of done (each package): `make typecheck`, `make build`, `make check-css` pass; `/home/mirto/.claude/skills/impeccable/scripts/impeccable detect --json <owned files>` clean; gate grep `text-\[[0-9.]+px\]|rounded-\[|shadow-\[|z-\[|tracking-\[|uppercase|#[0-9a-fA-F]{6}` over owned in-scope files returns nothing (documented exceptions only); measurements of the acceptance column recorded; keyboard run recorded; no commit; no edits outside the owned files; the specs, backend, generated API client, `public/config.js`, `silent-check-sso.html` are read-only.
3. Each package's report lists C3 ids closed, partly closed, deferred, and requests to other owners. Round-3 additions to the design system go in the package report (W0-A: `ux-audit/round-3/implementation/w0a.md`, W0-B: `w0b.md`); DOC consolidates them into DESIGN.md.
4. Verification round (not part of this plan's packages): fresh agents re-run the 15 audit scopes including `curator`, the Not-covered list of the consolidated report where cheap (keyboard run on sign-in at 768/zoom200, error injection on Place/Event/Route/Guide/Category, Dashboard blocked card with a real NAVIGATION blocker, translation bars, forced colours on editors and preview, a CDP accessibility tree of the stand-in), and score with caps.
5. Constraints stay: lifecycle vocabulary (DRAFT/ACTIVE/ARCHIVED, never "published"), tokens in memory, errors by `code` with request id and no echo, no analytics, no heavy dependency, header Apply and banner Save draft/Discard (`12` §3), WCAG 2.1 AA gate.

---

## 8. File-ownership table

"Wave 0" column: who edits during Wave 0. "Wave 1" column: the single owner afterwards. "Wave 2": CLN/DOC. A path appears once per wave. Shared files (style.css, tailwind.config.js, `ui/**`, `EditorShell`, list core, `completeness.ts`, `router.ts`) each have exactly one owner per wave.

| File or area | Wave 0 | Wave 1 | Wave 2 |
|---|---|---|---|
| `src/style.css`, `tailwind.config.js` | W0-A | nobody (requests to the orchestrator) | CLN (dead rules and tokens) |
| `src/components/ui/**` (all primitives, `ProblemAlert`, `DateTimeFields`, `FormDialog`, popover, menu, tooltip, tabs, button, select, checkbox, help-hint, state-card) | W0-A | nobody | CLN (barrels, `rounded-xl`) |
| `src/components/AppToast.vue`, `AppDialog.vue`, `ConfirmDialog.vue`, `StatusChip.vue`, `stores/toast.ts`, `stores/confirm.ts` | W0-A | nobody | - |
| `src/lib/format.ts`, `focus.ts`, `errors.ts`, `problemText.ts`, `glossary.ts`, `announcer.ts`, `routeAnnouncer.ts`, `toastOffset.ts`, `utils.ts` | W0-A | nobody | - |
| `src/router.ts`, `src/main.ts`, `src/App.vue`, `platform/auth.ts`, `platform/api.ts`, `platform/languages.ts`, `workspace/useProjectLanguages.ts` | W0-A | nobody | - |
| `e2e/focus-and-gates.spec.ts`, `touch-and-forced-colours.spec.ts`, `screens.spec.ts`, `zoom-and-structure.spec.ts`, `e2e/support/*` | W0-A | nobody | - |
| `editor/EditorShell.vue`, `WorkingCopyBanner.vue`, `EditorSection.vue`, `EditorSectionNav.vue`, `EditorStatusCard.vue`, `SideCard.vue` (new), `ReadinessList.vue`, `ActivateDialog.vue`, `TranslationsPanel.vue`, `ConflictDialog.vue`, `RemovedBar.vue`, `ReorderControls.vue`, `OtherSettings.vue`, `FilteredSelect.vue`, `SourcePairField.vue`, `undoRemove.ts`, `AiMarker.vue` | W0-B | nobody | - |
| `components/StatusChangeDialog.vue`, `SessionEndedDialog.vue`, `stores/sessionNotice.ts` | W0-B | nobody | - |
| `workspace/useResourceEditor.ts`, `useStickyStack.ts`, `activationHandoff.ts`, `formFields.ts`, `translationStatus.ts`, `referenceLinks.ts`, `listBack.ts` (new) | W0-B | nobody | - |
| `platform/completeness.ts`, `platform/readiness.ts`, `platform/assets.ts` (completeness function only) | W0-B | nobody (P2 and P7 read) | - |
| `components/list/*` (+ `FilterChip.vue` new), `TranslationDots.vue`, `TriggerChips.vue`, `useListLifecycle.ts`, `LifecycleDialogs.vue`, `listRows.ts`, `workspace/listFilters.ts`, `useReorder.ts`, `useCategoryFilter.ts`, `styles/list-table.css`, `e2e/content-lists.spec.ts` | - | P3-core | CLN (dead rules, `ListSelect`, `dropLineClass`) |
| `places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, `places/CreatePlaceDialog.vue`, `pois/CreatePoiDialog.vue`, `routes/CreateRouteDialog.vue`, `places/placeTree.ts` | - | P3a | - |
| `guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue`, `categories/RadioChips.vue` | - | P3b | - |
| `places/PlaceEditorView.vue`, `pois/PoiEditorView.vue`, `editor/TriggersCard.vue`, `QrCodePreview.vue`, `BackendQrCode.vue`, `components/media/MediaSlots.vue`, `platform/pois.ts`, `places.ts`, `triggers.ts`, `e2e/place-editor.spec.ts` | - | P4 | - |
| `routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `guides/guideElements.ts`, `editor/StoryEditor.vue`, `StoryEditor.ts`, `components/ResourcePickerDialog.vue`, `resourcePicker.ts`, `components/RouteMap.vue`, `platform/routes.ts`, `guides.ts`, `e2e/guide-reference.spec.ts` | - | P5a | - |
| `events/EventEditorView.vue`, `EntityCombobox.vue`, `eventDates.ts`, `categories/CategoryEditorView.vue`, `components/CategoryIcon.vue`, `platform/events.ts`, `categories.ts` | - | P5b | - |
| `maps/*` (7 files), `components/map/*`, `components/GeoPicker.vue`, `platform/maps.ts`, `floorPlans.ts`, `e2e/place-map-link.spec.ts` | - | P6 | - |
| `media/MediaView.vue`, `components/media/UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `DescribeNowDialog.vue`, `AssetThumb.vue`, `workspace/useAssetUpload.ts`, `e2e/media.spec.ts` | - | P7a | - |
| `media/AssetEditorView.vue`, `components/media/AssetPickerDialog.vue`, `AssetPreview.vue` | - | P7b | - |
| `DashboardView.vue`, `views/workspace/dashboard/*`, `platform/dashboardData.ts` | - | P2 | - |
| `views/HomeView.vue`, `SignInView.vue`, `SessionErrorView.vue`, `NotFoundView.vue`, `CreateProjectView.vue`, `views/createProject/*`, `components/ProjectList.vue`, `ProjectSwitcher.vue`, `AppHeader.vue`, `WorkspaceNav.vue`, `OfflineBanner.vue`, `PageFrame.vue`, `PageHead.vue`, `AppBreadcrumbs.vue`, `SectionTabs.vue`, `CapabilityNotice.vue`, `stores/connection.ts`, `stores/projects.ts`, `views/workspace/ProjectLayout.vue`, `platform/catalogue.ts`, `templates.ts`, `workspace/currentProject.ts`, `lastProject.ts` | - | P1 | CLN (`SignInView` one class) |
| `views/workspace/PreviewView.vue`, `views/AppPreviewView.vue`, `components/preview/*`, `editor/ResourcePreview.vue`, `editor/PreviewPanel.vue`, `workspace/preview.ts`, `previewData.ts`, `previewModels.ts`, `projectTheme.ts`, `e2e/editor-preview.spec.ts` | - | P8 | CLN (`PreviewPane` `.nums`) |
| `scripts/check-css-tokens.mjs`, `scripts/check-literals.mjs` (new), `Makefile`, `package.json` (scripts only) | - | nobody | CLN |
| Dead files listed in section 4 (`CategoryFilterSelect`, `FeaturedFilterChip`, `FilterChoiceGroup`, `ListFilterMenu`, `SearchLanguageSelect`, `useStatusActions`, unused barrels) | nobody | nobody | CLN |
| `DESIGN.md`, `.impeccable/design.json` | - | - | DOC |
| `DECISIONS.md` | D-100..D-106 W0-A, D-107..D-109 W0-B | D-110/111 P3-core, D-112 P2, D-113 P8, D-114 P6 | D-115 DOC, D-116 CLN |
| `QUESTIONS.md` (Q-021, Q-022), `GAPS.md` (G-043..G-046) | W0-A | nobody | - |
| Out of scope, untouched (one screenshot each after Wave 0, Wave 1 and CLN): `OverviewView.vue`, `LanguagesView.vue`, `SurfacesView.vue`, `TranslationsView.vue`, `navigation/NavigationView.vue`, `SectionView.vue`, `workspace/translationCatalog.ts`, `navigationMenu.ts`, `platform/overview.ts`, `settings.ts`, `projectSettings.ts`, `e2e/navigation-editor.spec.ts` | - | - | - |
| Read-only: specs folder, backend, generated API client, `public/config.js`, `silent-check-sso.html` | - | - | - |

Overlap check by file: `EditorShell` (W0-B only), `toastOffset.ts`/`AppToast` (W0-A only; it reads `#editor-side-column` from W0-B), `PreviewPanel`/`ResourcePreview` (P8 only; the shell's Expand/Close removed by W0-B in Wave 0), `triggers.ts` (P4 only; W0-B changes only `useResourceEditor.ts`), `readiness.ts` (W0-B in Wave 0, read by P2), `ProjectLayout.vue` and `stores/projects.ts` (P1 only; W0-A no longer edits them), `RouteMap.vue` (P5a, moved from P6), `SessionEndedDialog.vue`/`sessionNotice.ts` (W0-B, moved from P1), `platform/auth.ts` (W0-A, moved from P1), `FormDialog.vue` (W0-A, moved from P3-core). Files that change owner between waves move once and never inside a wave.

---

## 9. Orchestrator review (binding, 2026-11-17)

1. **Reports.** Every package returns `changes.md` in its reply (IMPL-BRIEF "Report"); the orchestrator saves it to `ux-audit/round-3/implementation/<package>/changes.md`. The paths `<package>.md`, `w0a.md` and `w0b.md` in §3 and §7 are replaced by this rule. Design-system additions go in a "System additions" section of the package's `changes.md`.
2. **Commands.** There is no `make` or `vp` here. "make typecheck", "make build" and "make check-css" mean the `cmd.exe … vue-tsc`, `vite build` (`node node_modules\vite\bin\vite.js build --outDir <tmp>`, then delete the output) and `node scripts\check-css-tokens.mjs` equivalents.
3. **D-116 / CLN.** Do not add the checks to `make build` or the Dockerfile build: that would change the owner's build pipeline. Add `check-css` (with `--all`) and `check-literals` as their own Make targets plus `package.json` scripts, and a `check` target that runs both. Whether they gate the build is the owner's choice; list it as a follow-up.
4. **Dependencies.** Remove `tailwindcss-animate` from `tailwind.config.js` only if nothing uses it (grep-proved); leave `package.json` dependencies untouched (no installs, no lockfile changes).
5. **Asset title blocker (D-107).** Drop it only after confirming in `src/` and the generated client that the backend readiness codes do not include a title-required code for assets. If unsure, keep it as a warning and record G-043.
6. **Wave 0 gate.** Typecheck, check-css, a production build, plus the screenshots listed in §2.
7. **List layout at desktop widths (ruling after P3-core, 2026-11-18).** P3-core's ListTable switches to cards when the Title would be under 15 rem. P3a and P3b must budget their columns (merge or narrow domain columns, Status 128, Updated 150, Translations 192, one domain column ≤ 144, or move a secondary fact under the title) so that **all six lists render as tables at 1280 and above**, measured with the Populated data. Cards remain the layout below 900 px; between 900 and 1279 cards are acceptable only where the table cannot fit. Report the mode per list at 1440, 1280, 1024 and 768.
