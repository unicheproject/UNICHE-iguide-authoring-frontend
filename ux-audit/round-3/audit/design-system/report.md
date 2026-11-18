# Round 3 audit: design-system (cross-cutting design-system auditor)

Date 2026-11-17. Account `admin`, Project `UX Audit – Populated`. Viewports 1440, 768 and zoom200 (spot checks), plus forced colours and reduced motion.

Mode: Operate. impeccable's interview steps are skipped because I am a subagent.

Rules cited, one per reference:
- `critique.md` (Hard Invariants): detector evidence is required and viewable targets need browser inspection. `impeccable detect --json src/` returned 5 hits, all "overused font" on Montserrat. Montserrat is the owner-approved face (D-071), so that is a false positive.
- `audit.md` (Theming and Accessibility): hard-coded colours are flagged, and a global `0.01ms` motion kill is flagged.
- `polish.md` section 1 (classify each drift: missing token, one-off, conceptual mismatch, local defect): used for the findings below.
- `operate.md` (every interactive component has default, hover, focus, active, disabled, loading, error): used for pressed equals hover.
- `craft-floor.md` (Browser surfaces, focus rings): used for the ring findings.

Method:
- 15 CMS screens plus 7 editors at 1440 via `measure.mjs`: computed type, colour pairs with alpha compositing, spacing, radii, shadows, z-index, transitions, small targets.
- `states.mjs` / `states2.mjs`: hover, pressed and focus values, row menu, create dialog, forced colours, reduced motion, 500 alert, toast.
- `clip.mjs`: a keyboard tour of 70 Tab stops on 7 screens, checking for clipped rings and ring-less controls.
- Static greps and importer proofs over `src/`.

Side effect: I created one Place, `UX-R3-design-system place` (id `e16ebf50-de0f-46d8-8f72-47d10e9a1324`), to obtain the success toast. It is left as DRAFT.

## Scores (final-round scale; an open P1 caps a screen at 85)

| Area | Score | Why |
|---|---|---|
| Colour and contrast tokens | 90 | All 31 distinct text/background pairs on 15 screens measure 4.66:1 or better, so there is no failing text pair (lowest 4.66, `#0078a8` on `#f8f8f8`, Leaflet attribution, third party). `muted-foreground` on sunken is 5.33. Alias duplicates remain (`secondary`=`accent`, `sunken`=`muted`, `line`=`border`). Out-of-scope screens still carry grays, hex and `#855400`. |
| Typography | 84 | Scale holds in CMS chrome. Line-height drift: 13 px has three values (18.2, 18.85, 19.5), 12 px has 16.8/18/12, 16 px has 22.4/24. The side-card heading is 16 px against 14 px on its siblings. The 28 px `text-2xl` token is unused. |
| Spacing, density, layout | 85 | Gutter and page frame are consistent. There is no documented spacing scale. 6 px and 10 px half-steps dominate (1397 and 1035 uses). Side-card padding is p-4 except "On this page" at p-3. |
| Radii, borders, elevation, z-index | 86 | Only 4/8/12/full radii and shadow-1/2/3 in chrome. `FloorPlanEditorView.vue:516` has a literal shadow. Popover z 40 is below modal z 50 (latent). Four sticky bars share z 10. |
| Buttons | 78 | Primary pressed equals hover. The primary focus ring is white. Hand-rolled button forks remain, and one `!min-h-8` override. |
| Chips, badges, status | 88 | One `Chip` and `StatusChip`, measured tints 5.55 to 7.03. Two duplicated removable-filter chips (R3-ds-13). `TranslationDots` chips are 24 px tall. |
| Form controls | 84 | Input, Textarea and Select share `.ui-field`. The legacy `.field-input` twin has 10 users, and `ListSelect` is a fork. Text controls have outline only (no halo), unlike buttons. |
| Dialogs, popovers, menus | 76 | The menu item highlight is 1.14:1 with no ring (P1). Dialog and menu forced-colours borders are fixed. All 15 dialogs share one Close button. |
| Tables and lists | 88 | Drop line, sticky head and row tokens are consistent. `.th`/`.td` in `list-table.css` are dead (scoped). |
| Feedback (toast, alert) | 86 | Toast and `ProblemAlert` are on tokens. Tone drift: "Changes discarded" uses a warning icon for a successful action. |
| Focus, forced colours, motion | 74 | Tab ring clipped (P1). Forced colours and reduced motion are good. |
| Icons | 90 | lucide everywhere in the CMS chrome. The `✓` glyph survives in `lib/format.ts:69`, and `⠿`/`⚠` remain out of scope. |
| Token plumbing | 80 | `check:css` works but covers about 56 files and only 6 class families. The literal gate is not wired. 5 dead component files, 1 dead hook and legacy CSS remain. Dead config: `darkMode`, `container`, `tailwindcss-animate`. |

## Findings

### P1
**R3-ds-01 · Language tab strip clips its focus ring on every editor and on Maps/Floor-plan tabs**
- Measured by `clip.mjs`: on the POI editor, the English tab (`DIV.flex min-w-0 flex-1 overflow-x-auto`) clips sides L, T and B. On Maps, both `LinkTabs` links are clipped (`NAV.mb-5 flex overflow-x-auto`, sides LTB/TB).
- The outline is 2 px solid purple with offset 2, but the tab rect equals the scroller rect, so the ring is invisible (screenshot `shots/placeEditor__tab-focus__1440.png`: only the underline shows).
- Cause: `overflow-x:auto` forces `overflow-y:auto`.
- Fix: give the scroller `p-1 -m-1` room, or `focus-visible:outline-offset:-2px` on tabs.
- Files: `TabsList.vue` / `EditorShell` tab strip, `ui/tabs/LinkTabs.vue:25`.

**R3-ds-02 · Menu item highlight is 1.14:1 and has no ring**
- `DropdownMenuItem.vue:21` sets `outline-none data-[highlighted]:bg-surface-hover`.
- Measured: highlighted item `#eef0f3` on `#ffffff` is 1.14:1, `outlineStyle: none`. See `shots/places__rowmenu-open__1440.png` ("Move to position…" barely shows).
- Fails 1.4.11 and 2.4.7. Forced colours has a rule (outline Highlight), the default theme does not.
- Fix: `data-[highlighted]:bg-accent-strong data-[highlighted]:outline data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 outline-ring` (accent-strong with primary ink is 8.58:1).

### P2
**R3-ds-03 · Primary and danger focus ring is white**
- `style.css:186-194` uses `outline-color:#fff` with a 4 px primary `box-shadow`.
- Measured: ring `#fff` on page `#fff`/`#f4f5f7` is 1.00 to 1.09:1. The box-shadow covers the first 2 px, so only a 2 px purple growth remains (screenshot `shots/places__btn-primary-focus__1440.png`).
- Fix: for `[data-variant=primary]` use `outline-color: hsl(var(--ring))`, offset 2, no shadow (10.4:1 on canvas).
- Also remove the hard-coded `#fff` at `style.css:189` and `style.css:391`.
- Textareas, selects and inputs show no halo (`boxShadow 0`) while buttons and links do, so the ring is not uniform.

**R3-ds-04 · Primary pressed state equals hover**
- `button/index.ts:26`: `hover:bg-primary-hover … active:bg-primary-hover`.
- Measured after 350 ms: rest `rgb(76,29,139)`, hover `rgb(58,20,105)`, active `rgb(58,20,105)`. `danger-outline` has the same pair (`hover:bg-destructive-tint active:bg-destructive-tint`).
- Secondary and ghost are distinct (hover `#eef0f3`, active `#e9ebef`).
- Fix: add a `--primary-active` token (about L 19%) or an inset shadow, and a `danger-outline` active tint.

**R3-ds-05 · Popover, menu and tooltip layers sit below modals (latent)**
- `z-popover` is 40 and `z-modal` is 50. Radix copies the content's z-index to the popper wrapper.
- No dialog contains a popover, menu or HelpHint today (I checked all 15 `AppDialog`/`FormDialog` users), so nothing is hidden yet.
- Any future select, HelpHint or menu in a dialog would render under the scrim.
- Fix: make the Popover/Dropdown/Tooltip content z-index `calc(var(--z-modal)+1)` when inside a dialog, or add a `z-popover-over` token (52).

**R3-ds-06 · Dead component chain and legacy CSS from round-2 cleanup B still present**
- Items: 5 filter components, `useStatusActions.ts`, `.small-label`, `.table-head`, `.table-row`, `.nums`, `.on-primary`, `.th`, `.td`, `dropLineClass`.
- Full list with proofs in cleanup.md.

**R3-ds-07 · `check:css` coverage gaps**
- The default run checks only `ui/**` plus 4 files. `--all` reports one false positive (`max-h-[calc(100dvh-var(--sticky-stack-h,3.5rem)-1rem)]`) because the tokenizer splits on `,`.
- It covers only size/h/w/min/max/z/shadow/rounded. It misses `text-*` (typo `text-compat`), `leading`, `duration`, `ease`, `animate`, `p/m/gap`, colours and custom screens (`edit:`, `nav:`).
- It is not in CI or the build (`package.json` has `check:css` but `build` does not call it).
- The literal gate (`text-[Npx]`, hex, `rounded-[`, `shadow-[`, `uppercase`) from round-2 cleanup F is not wired anywhere.

**R3-ds-08 · Side-card inconsistency**
- Measured in the place editor: Status card h2 is 16/700 with p-4. The cards "What needs attention", "Translations" and "Used in" are 14/700 with p-4. "On this page" is 14/700 with p-3.
- Sources: `EditorStatusCard`, `ReadinessList`, `EditorSectionNav`.
- Fix: one `SideCard` rule (h2 `text-sm font-bold`, `p-4`).

**R3-ds-09 · Mixed button implementations in in-scope files**
- Raw `<button>` with hand-copied classes: `ListEmpty.vue:33` and `MediaView.vue:415` (identical removable-filter chip, `min-h-8 rounded-full border-input … text-xs`), `ReadinessList.vue:137`, `MapEditorView.vue:608`, `EditorShell.vue:547,607,755`, `AppHeader.vue:51`.
- Create `Button variant=ghost size=sm` or a `FilterChip` primitive.
- `ReorderControls.vue:64` still fights `Select` with `!min-h-8 !py-1 !pl-2`.

**R3-ds-10 · `useReorder.dropLineClass` is dead code carrying the legacy `shadow-[inset…]` literals**
- `useReorder.ts:194-198`. `ListTable` uses `.list-drop-*` instead.
- `shadow-drop-before/after` are live in `RouteEditorView.vue:696` and `GuideEditorView.vue:593`, but they have no forced-colours counterpart, so the inset line vanishes in forced colours. `list-table.css:114-118` handles this for lists only.

### P3
- **R3-ds-11 Toast tone drift:** `useResourceEditor.ts:802` shows "Changes discarded" with a warning icon (8 s) for a successful action. `CreatePoiDialog.vue:68` is a mixed success and warning case. Success toasts themselves are correct (`CircleCheck`, `text-success`, `role=status`; shot `placeEditor__created-toast__1440.png`).
- **R3-ds-12 Line-height drift:** per-size values listed in the Typography row. Pick one line-height per size in DESIGN.md.
- **R3-ds-13 `TranslationDots` chips are 24 px tall** (about 70 px wide, three per row, on every list). This meets WCAG 2.5.8 (24) but is below the 32 px floor in use elsewhere.
- **R3-ds-14 `HelpHint` is `size-8`** (32 px; 44 px coarse). Measured 32x32 (`What is a Working Copy?`). This matches the `sm` button, so it is documented rather than a defect.
- **R3-ds-15 Leaflet zoom control glyph is 22 px, 700** (Leaflet default font, `Lucida Console` family) outside the type scale. `GeoMapCanvas.vue:581` sets 22 px for coarse.
- **R3-ds-16 Literals left in in-scope files:** see the cleanup list section D. They are `AppHeader` `h-[1.625rem]` x2, `PreviewView` `h-[520px]`, `ReorderControls` `w-[4.75rem]`, `FloorPlanEditorView.vue:516` shadow and `border-black/10` x4 in `StepTemplate`.
- **R3-ds-17 Unused tokens:** `--radius`, `z-base`, `border-line`, `text-2xl`, `duration-3` (as a class), `bg-secondary` (identical to accent), `card-foreground`, `popover-foreground`. `rounded-xl` is identical to `rounded-lg` (2 users).
- **R3-ds-18 Browser surfaces:** `::selection` and `accent-color` are themed, but scrollbars and `caret-color` are default. Low priority.
- **R3-ds-19 Spacing is undocumented:** no scale exists in `system.md`. It is a 4 px base with 6 px and 10 px half-steps. A few fractional values come from em-based preview shells.

### Out-of-scope literals (Visitor-app screens, flag only)
- `text-[Npx]`:

  | File | Count |
  |---|---|
  | `TranslationsView` | 54 |
  | `NavigationView` | 17 |
  | `LanguagesView` | 15 |
  | `OverviewView` | 11 |
  | `SurfacesView` | 10 |
  | `SectionView` | 2 |
  | Total | 109 |

- 10 to 11 px text renders on those screens (measured: 10/11 px on Translations, Languages, Overview, Surfaces; 10.5/11/12.75/15/17.25/28.5 px on Navigation).
- uppercase and tracking: Translations (7), Languages (7), Surfaces (2), Navigation (2), Overview (1).
- 800 weight, hex and `gray-*`: Translations (6 hex, 17 gray), Languages (9 gray), Surfaces (6 gray) and `#855400` literals.
- The Preview shells (`PreviewApp`, `ResourceContent`) use em, uppercase and `font-extrabold` to simulate the visitor app. That is themed content, not CMS chrome; I treat it as intentional (D-082) and the hex literals that were there are gone.

## Measured system (as built)

Type pairs in CMS chrome, 15 screens, size / weight / line-height (counts in parentheses):
- 12: 400 (224), 500 (113), 600 (667), 700 (56)
- 13: 400 (615), 500 (1376), 600 (42)
- 14: 400 (513), 500 (227), 600 (799), 700 (58)
- 16 / 700 / 22.4 (42)
- 20 / 700 / 26 (18)
- 22 / 700 (Leaflet, 2)

Focus ring and motion:
- Focus ring: 2 px solid `--ring`, offset 2 px, plus a 4 px `--card` halo. Primary and danger swap to a white outline and a coloured halo (R3-ds-03).
- Motion durations seen: 0.12 s (1132 uses), 0.15 s, 0.18 s, all `cubic-bezier(.4,0,.2,1)`. Appearing surfaces: dialog 0.24 s `ui-rise-in`, scrim 0.18 s fade.

Spacing in use (px, count): 2 (369), 4 (5123), 6 (1397), 8 (5656), 10 (1035), 12 (2986), 16 (2810), 20 (145), 24 (308), 36 (84), 44 (7), 48, 72, 96. Off-scale values (5 px, 13.2, 16.6 and similar) come only from em-based preview shells.

Radii, shadows, z-index:
- Radii: 4 px (838), 8 px (1327), 12 px (161), full (611), 50% (63).
- Shadows: `--shadow-1` (128), `--shadow-2` (menus, toasts), `--shadow-3` (dialog), nav `inset 3px` (17), plus one literal at `FloorPlanEditorView.vue:516`.
- z layers: skip 70, toast 60, modal-over 51, modal 50, popover 40, drawer 30, sticky 10 (header, list toolbar, editor header, row), raised 5 (error summary, route map pin). Leaflet panes run 100 to 1000 inside `isolate`.

Contrast: all 31 measured text pairs pass. Token pairs I computed:
- Muted ink on sunken 5.33; on accent 5.35.
- Placeholder on white 5.63.
- Status inks on their tints 5.55 to 7.03.
- Control border on white 4.26, on canvas 3.90.
- Disabled ink on white 3.16 (exempt, always with a reason).
- `surface-hover` against white is 1.14, so hover is never the only cue.

Forced colours: dialog and menu now carry a 1 px CanvasText border (measured `rgb(0,0,0) 1px`). Menu items get boxes and a Highlight outline (`shots/places__forced-colors-menu__1440.png`).

Reduced motion: appearing surfaces keep a 120 ms fade, measured on the dialog panel and scrim. Other transitions are 1 ms, and a skeleton becomes static.

Narrow viewports: no horizontal scroll at 768 or zoom200 (`scrollWidth` equals `clientWidth` on Places and Dashboard).

Icon-only buttons are 40 px (44 coarse), e.g. "More actions" is 40x40. None of them is below 32 px on the 22 screens.

## DESIGN.md source table (as built)

**Colours (HSL source, hex for review)**

| Role | Token | Value |
|---|---|---|
| Canvas | `--background` | `#f4f5f7` |
| Surface | `--card` / `--popover` | `#ffffff` |
| Sunken / neutral chip | `--muted` | `#e9ebef` |
| Hover | `--surface-hover` | `#eef0f3` |
| Hairline (decorative) | `--border` | `#d9dce2` |
| Control border | `--input` | `#737b8b` |
| Ink / Ink-2 / Muted / Placeholder / Disabled | `--foreground` / `--ink-2` / `--muted-foreground` / `--placeholder` / `--disabled-ink` | `#111827` / `#374151` / `#566070` / `#5f6877` / `#8a91a0` |
| Primary (action, link, current, ring) | `--primary` (hover `#3a1469`) | `#4c1d8b` |
| Brand tint / strong | `--accent` / `--accent-strong` | `#efe9f8` / `#e6dcf5` |
| Link hover | `--highlight` | `#a3106a` |
| Success / Warning / Destructive / Info ink | | `#0b6a5f` / `#7a4b00` / `#b4135a` / `#1f4e8c` |
| Status tints | | `#e3f3ee` / `#fdf0d5` / `#fbe6ef` / `#e4edf8` |
| Scrim | `--scrim` | ink at 45% |

- Aliases to drop: `secondary`=`accent`, `sunken`=`muted`, `line`=`border`.

**Type** (Montserrat Variable; Greek companion Manrope; system sans fallback; mono is the `ui-monospace` stack at 13 px):

| Token | Size | Line-height | Use |
|---|---|---|---|
| xs | 12 | 1.4 | labels, chips, meta |
| compact | 13 | 1.45 | nav, table, mono |
| sm | 14 | 1.5 | body, controls |
| base | 16 | 1.4 | dialog and card titles |
| lg | 20 | 1.3 | page title |
| xl | 24 | 1.25 | state and sign-in titles |
| 2xl | 28 | 1.2 | unused, drop |

- Weights 400, 500, 600, 700 only. No uppercase or tracking in chrome.

**Spacing**
- Tailwind 4 px base with 6 and 10 half-steps. Gutter `--gutter` is 16 px, 24 px from the `nav` breakpoint (1100).
- Control height `--control-h` is 40 (44 coarse). Row `--row-h` is 52 (56). Header 56. Nav 232.
- Breakpoints: md 768, lg 1024, nav 1100, edit 1180, xl 1280.

**Radii:** sm 4 (checkbox, nav item, menu item), md 8 (controls, popover), lg 12 (card, dialog, alert, toast), full (chips).

**Elevation:** `shadow-1` (0 1 2 + 0 1 3, card), `shadow-2` (0 4 12 + 0 1 3, popover, menu, toast, stuck bar), `shadow-3` (0 16 40 + 0 2 8, dialog). Tints are cool (`220 30% 12%`).

**z layers:** raised 5, sticky 10, drawer 30, popover 40, modal 50, modal-over 51, toast 60, skip 70.

**Motion:** durations 120 / 180 / 240 ms, `ease-out` (0.16,1,0.3,1) for appearing, `ease-std` (0.4,0,0.2,1) for state. Reduced motion keeps a 120 ms fade, no transforms.

**Focus:** 2 px `--ring`, offset 2 px, 4 px card halo (fix primary per R3-ds-03). Forced colours use `Highlight`.

**Components and variants actually used**
- Button: primary, secondary, ghost, danger, danger-outline, link. Sizes md 40, sm 32 (both 44 coarse), icon 40. The aliases are used only by out-of-scope views (`variant="outline"` x8).
- Chip tones: neutral, outline, brand, success, warning, danger, info. `StatusChip` wraps Chip.
- Alert tones: info, success, warning, danger. `ProblemAlert` for errors.
- Toast tones: success, warning, error, info (max 3, 5/8 s, errors persist).
- Dialog: `AppDialog` (sm to xl) with `FormDialog` and `ConfirmDialog`; one Close button 40 px at top right (`-mr-2`), footer actions right-aligned.
- Fields: `FormField`, Input/Textarea/Select (`.ui-field`), Checkbox, Switch, `DateTimeFields`, `FilteredSelect`.
- Tabs: Radix tabs, `LinkTabs`. HelpHint 32 px popover trigger. Skeleton, Spinner, StateCard, EmptyState.

**Layout patterns:**
- Page head: `PageHead` (h1 20/700, subtitle 14 muted, actions right, `mb-6`) inside `PageFrame` (`pt-6`, gutter, `pb-24`).
- List: toolbar (sticky, z 10) over a card holding `ListTable` with a sticky head, then a footer.
- Editor shell: sticky header (min 56 px, z 10) with title, status chip, readiness button and one primary; below it a grid of 46 rem form plus a 21.5 rem side column from `edit` (1180).
- Side column: cards of `rounded-lg border bg-card p-4 shadow-1`.
- Dialog: scrim, panel `rounded-lg shadow-3 max-h calc(100dvh-2rem)`, sticky footer.

**Deviations to fix first:** R3-ds-01, 02, 03, 04, 08, then delete dead code per cleanup.md.

## Round-2 fixes verified

| ID | Status | Evidence |
|---|---|---|
| C2-01 `size-control` never generated (icon buttons 18x18) | fixed | `tailwind.config.js` has `spacing.control`. Measured icon buttons 40x40 ("More actions"). No icon-only control under 32 px on 22 screens. `check:css` exists and passes. Leftover: `ReorderControls.vue:64` `!min-h-8` override; `RemovedBar` and `MediaSlots` patches removed. |
| C2-01 sub: `WorkspaceNav` `min-h-header` | fixed | `WorkspaceNav.vue:100` now `h-header`. |
| C2-02 forced-colours boundaries | fixed | dialog and menu measure `1px CanvasText`. Rule at `style.css:476-484` covers dialog, alertdialog, menu, listbox, tooltip, alert, status, popper content. Partly open: `shadow-drop-*` lines on Route/Guide editors vanish (R3-ds-10). |
| C2-03 dead components, aliases, literals | partly | Fixed: duplicate `ReorderControls.vue`, `shadow-drop-*` and `z-raised` tokens, preview-shell glyphs, preview hex, `GeoPicker` 260 px, `RouteEditorView` z-index. Not fixed: sections B and C of the old cleanup (see below). |
| C2-04 reduced motion blunt 1 ms | fixed | appearing surfaces keep a 120 ms fade (measured), skeletons are static. |

Round-2 cleanup.md items:
- A1 spacing token: fixed.
- A2 `min-h-header`: fixed.
- A3 forced-colours borders: fixed.
- A4 per-call patches: partly.
- B (dead files): 5 filter components, `useStatusActions.ts`, `.small-label`, `.table-head`, `.table-row`, `.nums`, `statusChipStyle`, `statusGlyph` all still present; the duplicate `ReorderControls.vue` is gone.
- C: `ListSelect` fork, `.field-input` twin (10 users, was 11), `.dialog-*` (1 user), Button aliases (only `outline` x8, all out of scope) still present.
- D: partly. Done: shadows, z-index, hex, glyphs. Open: `border-black/10`, GeoMap glyph, small `h-[..]` literals.
- E (visitor-app screens): untouched, as expected.
- F: `check:css` added; the grep gate and the e2e (icon 32/44, forced-colours shot) are not wired (a `touch-and-forced-colours.spec.ts` exists).

## Notes and uncertainty
- Dialog Close position inconsistency (reported by other agents): not reproduced in code. All 15 `AppDialog`/`FormDialog` users share one implementation (40 px, `-mr-2`, top right). `ListFilterMenu` has its own Close but is dead.
- Warning icon on success toasts: reproduced only as the tone choices listed in R3-ds-11. A normal success toast shows `CircleCheck`.
- The skeleton state was not captured. My delayed-route probe did not delay the list, so skeleton colours and animation are unmeasured (the code is `animate-skeleton`, 15 uses).
- Not measured: `DateTimeFields` and `FormField` states beyond static code, because they were not on the 15 screens.

## Evidence index (`shots/`)
`<screen>__default__1440.png` for 24 screens. Key shots:
- `places__btn-primary-focus__1440.png`
- `places__btn-secondary-focus__1440.png`
- `placeEditor__tab-focus__1440.png`
- `places__rowmenu-open__1440.png`
- `places__create-dialog__1440.png`
- `places__create-filled__1440.png`
- `placeEditor__created-toast__1440.png`
- `places__error-500__1440.png`
- `places__forced-colors__1440.png`
- `places__forced-colors-menu__1440.png`
- `places__forced-colors-dialog__1440.png`
- `places__default__768.png`, `places__default__zoom200.png`, `dashboard__default__768.png`, `dashboard__default__zoom200.png`
