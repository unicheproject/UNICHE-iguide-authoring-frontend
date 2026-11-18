# Round 1 implementation plan: iGuide CMS UX overhaul

Planner output. Inputs: `BRIEF.md`, `PRODUCT.md`, `round-1/audit/consolidated.md` (125 findings, 5 P0), `scoreboard.md` (41 screens, mean 59.6, 0 at 90+), `design-system/proposal.md`, `AGENTS.md` §4, spec `12` §3-§6, `14` §4, the impeccable Operate and craft-floor references, and the code in `src/`. Round 1 is foundation plus structural redesign. Nothing here edits source; implementers do.

Mode: **Operate** (an authenticated authoring tool). Familiar patterns, scanability, density where it earns it, brand in precise details. No display fonts in labels, no decorative motion, no nested cards, no eyebrow labels, no side-stripe borders, no gradient text, no hero-metric tiles, no modal where an inline panel works.

Contents: 0 Orchestrator rulings applied and corrections; 1 Design direction; 2 Pattern specifications; 3 DECISIONS.md entries to add; 4 Wave 0; 5 Wave 1 packages; 6 Execution protocol and definition of done; 7 Deferred and rejected; 8 QUESTIONS.md and GAPS.md text; 9 File-ownership table.

---

## 0. Rulings applied, and two corrections to the premises

- Severities stand (P0: C1-06, C1-41, C1-42, C1-59, C1-81).
- Map tiles and Nominatim stay. Correction to record in D-081: D-064 specifies the OpenMapTiles "OSM Bright" vector style served by OpenFreeMap, not raw OSM raster tiles. Template fonts for the preview stay as D-045 says (a runtime Google Fonts request in `platform/templates.ts` for Template previews only). The CMS's own Montserrat is self-hosted. Both exceptions to "only the authoring API and the IdP" are named in D-071 and D-081 so the next audit does not rediscover them.
- Header carries only Apply changes; Save draft and Discard stay in the Working Copy banner; both become sticky. Merged action bar goes to QUESTIONS (Q-008).
- "Preview in app": inline panel below the action that pushes content, never covers the form, Esc and Close, focus return. Docked split pane goes to QUESTIONS (Q-009).
- Additive items planned (spec silent): extra filters including "Needs translation", sort, URL-stored filter state, set position in lists, return to last Project after sign-in, Project picker search and Recent, Activate confirmation with readiness. Bulk lifecycle actions deferred to Round 2.
- Backend needs go to GAPS.md (section 8); the UI is designed on existing data: Dashboard counts from list `totalElements` (existing `platform/overview.ts` `fetchContentCounts`, ACTIVE and DRAFT per kind), no translation bars, "Ready" never asserted without at least one ACTIVE Resource (`status=ACTIVE` totals).
- Scope note for the owner: the project memory says "work only in the Content menu group"; BRIEF §1 (2026-11-12, later and explicit) puts sign-in, picker, Create Project, Dashboard, chrome, Media, Maps and Preview in scope. This plan follows the BRIEF. Out-of-scope screens (Overview, App settings, Languages, Surfaces, Features, Translations, Navigation, Pages, Launch, Audit log, placeholders) get no edits; they inherit tokens and shared components and are screenshot-checked only.

---

## 1. Design direction

### 1.1 In three lines

A calm institutional workbench: cool-grey canvas, white work surfaces, UNICHE purple (`#4c1d8b`) only for the one primary action, current selection, links and focus. State is always a word plus a drawn icon plus (where useful) a colour, from one status vocabulary. Montserrat self-hosted, sentence case, rem scale, 14 px body, 8 px controls, 40 px (44 on touch) hit areas, and the work (the form, the list, the visitor result) leads while the chrome (sticky bars, side column, drawer nav) stays out of the way.

### 1.2 What is kept and what departs

Kept (UNICHE identity): the logo, Montserrat, purple `#4c1d8b`, lilac selection tint, the grey canvas, the lifecycle vocabulary. Departs (D-069 to D-073): pill and UPPERCASE buttons, the gradient CTA, 9 to 11 px tracked-caps labels, px type, 1.24:1 field borders, pink hover, unicode-glyph icons, one-at-a-time left-striped toast, ad-hoc dialog and shadow and z-index values, Google Fonts for the shell.

Refinements to `proposal.md` where the findings argue:

| Proposal | Round 1 decision | Why |
|---|---|---|
| Type steps 12/13/14/17/22/28 | 12 / 13 / 14 / 16 / 20 / 24 (+28 for sign-in only) | Clean rem steps (0.75, 0.8125, 0.875, 1, 1.25, 1.5), ratio about 1.14 to 1.25, closer to Operate's 1.125-1.2; 17 px was a one-off |
| Density toggle in step 6 | Deferred (token `--row-h` and `--control-h` exist so it can land later) | Needs a per-user setting and a list per-density review; not needed to lift any Round 1 finding |
| Second neutral layer for nav and toolbars | Not used: nav, header, toolbars white, canvas grey, sunken for table head | Contrast of white against canvas is carried by `--shadow-1` and the 1 px `--line`; one fewer grey to keep consistent. Deliberate departure from the Operate suggestion |
| Toast bottom right, stacked 3 | Keep, plus pause on hover and focus, errors persist, and errors that matter are also shown inline (Alert) so a toast is never the only carrier | C1-68; toast covers list footers, so `scroll-padding-bottom` is reserved on `PageFrame` |
| Action order Discard, Save draft, Apply | Keep, but the split follows the spec: Apply in header, Save draft and Discard in the sticky banner | Orchestrator ruling |
| Edit/lifecycle buttons in card | Activate/Deactivate/Restore in the side Status card; Archive only in the header "More actions" menu | C1-11: lifecycle must not outweigh editing |

### 1.3 Type

Fixed rem scale, no fluid sizes, no `text-[Npx]` anywhere (gate: zero matches). Root stays 100 %. One family. Weights 400 body, 500 nav and metadata, 600 labels, buttons and table titles, 700 headings; 800 retired. Sentence case everywhere (Greek keeps tonos; no `uppercase` outside the three-letter status abbreviations, which are not used; chips use words).

| Token | Class | rem / px | Line height | Weight | Use |
|---|---|---|---|---|---|
| caption | `text-xs` | 0.75 / 12 (floor) | 1.4 | 500, chips 600 | chips, counts, helper, table head, timestamps, kbd hints |
| compact | `text-compact` | 0.8125 / 13 | 1.45 | 400/500 | dense table cells, nav items, secondary values |
| body | `text-sm` | 0.875 / 14 | 1.5 | 400, labels and buttons 600 | everything else, inputs, buttons |
| title | `text-base` | 1 / 16 | 1.4 | 700 | card and dialog titles, status card headline |
| page | `text-lg` | 1.25 / 20 | 1.3 | 700 | page title (h1), editor title |
| display | `text-xl` | 1.5 / 24 | 1.25 | 700 | first-run guide heading, sign-in, state cards |

`tailwind.config.js` overrides `fontSize` xs..xl with this table (tuples with line height); `2xl` = 1.75 rem kept for the sign-in hero only. Tracking 0 except page/display (-0.01em). `font-variant-numeric: tabular-nums` on counts, versions, coordinates, dates. Prose measure `max-w-[68ch]`. Monospace (`ui-monospace`, 13 px) only for slugs, codes, request ids, coordinates.

Self-hosted font: `public/fonts/montserrat-{latin,latin-ext,greek,cyrillic}-var.woff2` (variable `wght` 400..700, `font-display: swap`), `@font-face` with `unicode-range` in `src/style.css`, `size-adjust` fallback face over `system-ui` so the swap does not shift layout, preload of the latin and greek files in `index.html`, `public/fonts/OFL.txt`. The implementer downloads the four files once from the Google Fonts CSS API (fonts.gstatic.com, dev-time only, never at runtime), commits them, and does not add an npm dependency. Test `ά ή ΐ ΰ` and capitals with tonos.

### 1.4 Colour roles (shadcn variable names kept; values change so the whole app restyles)

Format `--name: H S% L%`. Hex shown for review. Computed ratios are from `proposal.md` and must still hold; an implementer may nudge a value only if the stated ratio holds.

| Role | CSS var (Tailwind) | Hex | Rule |
|---|---|---|---|
| Canvas | `--background` | `#f4f5f7` | page background |
| Surface | `--card`, `--popover` | `#ffffff` | cards, dialogs, popovers, inputs, header, nav, toolbars |
| Sunken | `--muted` | `#e9ebef` | table head, disabled field, neutral chip fill, bar tracks |
| Hover | `--surface-hover` | `#eef0f3` | row, menu hover |
| Line | `--border` | `#d9dce2` | decorative hairlines only (card edge, row dividers); never a control edge |
| Control border | `--input` | `#737b8b` (4.26:1) | every input, select, textarea, checkbox, radio, switch off-state, secondary button |
| Ink | `--foreground` | `#111827` | text |
| Ink 2 | `--ink-2` | `#374151` | labels, nav item |
| Muted ink | `--muted-foreground` | `#566070` (5.3 to 6.4:1 on every surface) | helper, metadata |
| Placeholder | `--placeholder` | `#5f6877` (5.63:1) | placeholder only; never the only label |
| Disabled ink | `--disabled-ink` | `#8a91a0` | disabled text only; always paired with a stated reason in text |
| Primary | `--primary` / `--primary-hover` | `#4c1d8b` / `#3a1469` | primary button, current nav, selected tab, links, focus |
| Brand tint | `--secondary`, `--accent` | `#efe9f8` (strong `#e6dcf5`) | selected nav item and row, toggled chip, ghost hover |
| Link hover | `--highlight` | `#a3106a` (7.4:1) | link hover only. Links in running text are underlined by default (1.4.1) |
| Success / warning / danger / info | `--success`, `--warning`, `--destructive`, `--info`, each with `-tint` | ink `#0b6a5f` `#7a4b00` `#b4135a` `#1f4e8c`; tint `#e3f3ee` `#fdf0d5` `#fbe6ef` `#e4edf8` | text and icon in ink, background tint; solid fill only for danger and success buttons |
| Scrim | `--scrim` | `rgb(17 24 39 / .45)` | modal backdrop |

Hard-coded hex outside `style.css` and the preview stand-in (`components/preview/*`, `workspace/projectTheme.ts`) is a defect; retire the 11 near-duplicate greys and `text-gray-*`/`border-gray-*`.

### 1.5 Status roles (domain state is not severity; one `StatusChip`, one `Chip`)

Every status shows icon (lucide, 16 px) plus word, sentence case, 12 px/600, 24 px tall, `rounded-full`.

| State | Icon | Word | Treatment |
|---|---|---|---|
| ACTIVE | `circle-check` | Active | success ink on success tint |
| DRAFT | `circle-dashed` | Draft | ink-2 on sunken, dashed icon |
| ARCHIVED | `archive` | Archived | no fill, 1 px `--input` outline, ink-2 (visibly different from Draft without colour) |
| Pending (Working Copy) | `pencil` | Pending changes | primary ink on brand tint (not amber: amber means warning) |
| Translation complete / partial / missing | `check` / `contrast` / `circle` | "Italiano: complete", "partial 3 of 5", "missing" | icon 14 px, text 12 px, success / warning / muted ink, no tint; always the language's display name and `lang` attribute, never a bare code |
| Readiness blocking / warning | `octagon-x` / `triangle-alert` | Blocks / Warning | danger / warning |
| Trigger chips (QR, Geo, Beacon, AR) | `qr-code`, `map-pin`, `bluetooth`, `scan` | type name | neutral; a DRAFT trigger uses the outline treatment, never `opacity` |
| Application status (Project) | as Resource status | "App: Draft" etc. | labelled so it is not confused with a Resource status (C1-54) |

### 1.6 Spacing, radii, elevation, z-layers, density

- Spacing: 4 px base; scale 4, 8, 12, 16, 24, 32, 48 (`1,2,3,4,6,8,12`); 2 px half-steps inside chips only. Retire every arbitrary `[18px]`, `[13px]`, `[22px]`, `[26px]` and similar. Page gutter 16 (below 1100) / 24 (at 1100 and above); between cards 16; between page sections 32; card padding 16 (compact cards) or 24.
- Radii: 4 (checkbox, tag), 8 (button, input, menu, popover, small card), 12 (card, dialog, table container), full (chip, avatar, switch, count). Tailwind `sm/md/lg` remapped; zero `rounded-[`.
- Borders: 1 px everywhere. A selected row gets brand tint plus a 2 px inset primary on the first cell. No coloured side stripes on cards, toasts, alerts or banners (the current `border-l-[3px]` pattern is removed everywhere).
- Elevation (offset plus blur, cool low-alpha): `--shadow-1` cards on canvas, `--shadow-2` popovers, menus, toasts, stuck toolbars, `--shadow-3` dialogs. Zero ad-hoc shadows.
- Z-layers (named in `tailwind.config.js`): `base 0`, `sticky 10`, `drawer 30`, `popover 40`, `modal 50` (confirm over dialog `modal+1`), `toast 60`, `skip 70`. Map libraries live inside an `isolation: isolate` wrapper.
- Density: Comfortable only in Round 1. `--control-h` 40 px, 44 px under `@media (pointer: coarse)`; icon button 40 / 44; table row min 52, 56 on coarse; nav item 36 / 44. Hit slop (padding, never font size) so no interactive element is under 32 px on desktop or 44 px on touch; the Leaflet controls and pins are enlarged to the same floor. Compact density is deferred.

### 1.7 Focus, motion, forced colours

- Focus: one ring for every control, including fields: 2 px solid `--ring` with 2 px offset plus a 2 px `--card` halo so it reads on tint and on purple fills; on `bg-primary` the ring is white with a purple halo. Inputs also move their border to `--primary` on focus. `outline: none` is allowed only with a replacing ring.
- Motion: 120 ms (hover, press), 180 ms (popover, menu, toggle, accordion), 240 ms (dialog, toast, drawer); `cubic-bezier(0.16, 1, 0.3, 1)` for entrances, `cubic-bezier(0.4, 0, 0.2, 1)` for colour and size. Only `color, background-color, border-color, box-shadow, opacity, transform` transition; no `transition-all`. Motion conveys state only; there is no page-load choreography. The single authored moment is the sticky bar gaining `--shadow-2` when it sticks and the inline Preview panel expanding (height 180 ms).
- Reduced motion (base layer, applies everywhere, not per component): transforms and slides removed, shimmer becomes a static `--muted` block, dialogs, toasts and drawer appear by opacity step only, the drag insertion line stays, smooth scrolling off.
- Forced colours (`@media (forced-colors: active)`): every button, chip, tab, nav-current item and menu item keeps a 1 px `ButtonText`/`CanvasText` border; selected tab gets a 2 px `Highlight` underline; current nav item a `Highlight` outline; focus uses `Highlight`; icons use `currentColor`; map markers and floor-plan pins get a 2 px `CanvasText` ring; no `forced-color-adjust: none` except the preview stand-in.

### 1.8 Button hierarchy (one `Button`, nothing hand-rolled)

Variants: `primary` (solid purple), `secondary` (white, 1 px `--input`), `ghost` (toolbar and row actions), `danger` (solid, only inside a confirm), `danger-outline` (Archive), `link` (inside running text only). Sizes `md` 40 and `sm` 32 (sm never on touch layouts; coarse pointer lifts to 44), `icon` (needs `label`, 40/44 square). Radius 8, 14 px/600, sentence case, icon 16 px left of the label. States all present: hover, focus ring, active, disabled, loading (spinner left of the label, width held, `aria-busy`). Disabled state uses `aria-disabled="true"` (stays focusable) plus a visible reason: `disabledReason` prop renders text or a tooltip and `aria-describedby`. The deprecated variants `brand`, `outline`, `destructive`, `default` and the classes `.dialog-primary`, `.dialog-secondary`, `.field-input`, `.field-label`, `.small-label`, `.th`, `.td` stay as aliases restyled to the new look so out-of-scope screens keep rendering without edits.

Rule: one primary per view region. List page: "New <kind>". Editor DRAFT: "Save" is primary while dirty, otherwise Activate becomes primary (when dirty it reads "Save and activate" and is secondary). Editor ACTIVE: "Apply changes" is the header primary; banner buttons secondary/ghost. Dialog: the confirming action is primary on the right, Cancel secondary on its left. Dashboard: the status card's one action.

---

## 2. Pattern specifications

### 2.1 Application shell, header, navigation

- Shell: `100dvh`, header and nav fixed, only `<main>` scrolls (D-062 stays). `<main id="main" tabindex="-1">` is rendered by one `PageFrame` (every in-scope view uses it; out-of-scope views keep their own `<main>` classes unchanged).
- Header 56 px, single row at every width. Left: nav toggle (below 1100 only), bundled UNICHE logo (local asset in `src/assets`, linked to Home, replaces the remote logo URL), "iGuide CMS" in 12/600 muted (not tracked caps). Centre-left: Project switcher button showing the current Project name (truncating) plus App status chip. Right: user menu (avatar, name at 768+). "Manage members" becomes a link to the Catalogue/Portal for this Project inside the user menu and the Project switcher footer if `portalUrl` is configured (spec `12` §4), and is absent otherwise; "Help" is removed until a destination exists (Q-016). No inert controls.
- Left nav 232 px at 1100 and above, an off-canvas drawer (z `drawer`, scrim, focus trap, Esc, focus return, 44 px items) below 1100, opened from the header button. Order per spec `12` §3: Dashboard; Content group (Places, Points of Interest, Routes, Guides, Events, Categories, Maps & Floor Plans); Media (top level, conforming to spec; today it is nested under Content); Visitor app group; Project group. Each item has a 20 px lucide icon. Group labels 12/600 muted, not caps. Current item: brand tint, 3 px inset primary on the left edge inside the item (not a stripe on a card), weight 600, `aria-current="page"`; an editor keeps its list highlighted. Capability OFF: item stays, greyed, with an "Off" `Chip` (text, not aria-hidden) and the reason as visible second line text on wide nav and in the accessible name; the page itself shows an info Alert under the page head ("Events are switched off for this Project. [Turn on in Features]") via `PageHead` `section` prop. Counts in nav are deferred (needs the statistics endpoint; 18 requests per load otherwise).
- Page head (`PageHead`): h1 20/700, optional status chip and Pending chip on the same line, subtitle 14 muted capped at 68ch, actions right-aligned (wrap below). Breadcrumb above on editors only.
- Section tabs (`SectionTabs`): Radix-style link tabs, 2 px primary underline, 14/600, optional count slot, 44 px tall on touch.
- Route change (W0, `router.afterEach` plus `App.vue`): `document.title` = "<page> · <Project> · iGuide CMS" from route meta and the loaded Project, move focus to the page h1 (programmatic, `tabindex="-1"`) unless only the query or a tab changed, write "<page> loaded" to the polite live region (`useAnnouncer`), scroll `main` to top. Skip link ("Skip to content") is the first tab stop, styled as a primary button.
- Project switch: skeleton is opaque (spec `12` §6); the nav and the page skeleton render as soon as the route has a `projectId` so nothing jumps 232 px; focus goes to the new page h1.

### 2.2 List pattern (all six Content kinds; Maps, Floor plans and Media share the table classes)

One scaffold (W0 stage 0.3) with per-kind column config; the six `*View.vue` become a header, a config and row slots (about 2,100 duplicated lines removed).

- Sticky toolbar (z `sticky`, white, `--shadow-2` when stuck) holding: search (labelled, 14/400, placeholder says what is searched: "Search title, slug, code or trigger"), search-language select as a visible control next to it, **status segments** with counts (Not archived (default) · Active · Draft · Archived; counts from the loaded list), toggles "Pending changes" and "Needs translation" (with language select when on), Category and Featured where the kind has them, sort select (Manual order [default where spec says `sortOrder`], Title, Status, Updated, Translations), "Clear filters". Filter state lives in the URL query (`q`, `status`, `pending`, `lang`, `missing`, `cat`, `featured`, `sort`, `dir`), restored on Back, scroll position restored. Result count announced (polite) after filter and search changes ("2 of 55 shown").
- Sticky table head (12/600 muted on `--muted`, sentence case, sortable columns as buttons with `aria-sort`).
- Row: 52 px min, whole row opens the editor (title is the link; the row is also clickable, with the link as the keyboard target), one Tab stop per row plus one kebab (`DropdownMenu`) per row: Activate / Deactivate, Archive / Restore, Move up, Move down, "Move to position...", Move to top, Move to bottom. Title line 14/600, beneath it slug (mono 13) and "Updated 4 Sep" 12/400 muted; status chip and Pending chip on one line; translation state as icon plus language name (legend in the head tooltip and in the footer); trigger chips under the slug ("No trigger, only reachable by browsing" per spec). Places and Categories indent 24 px per level with a 1 px guide and a real disclosure button (`aria-expanded`) to collapse a subtree; no `└`/`↳`/`▼` glyphs. The drag handle (`grip-vertical`, 20 px, `--muted-foreground`) stays as an addition beside the always-present keyboard path.
- Reorder: handle plus kebab "Move to position..." (small dialog with a numeric field and the current range) so far moves take one step; active whenever sort is Manual and no filter hides rows, otherwise the controls carry the reason ("Clear filters and use Manual order to reorder" with a one-click action). Announce moves ("Moved Acropolis to position 3 of 55").
- Footer: "Showing 55 of 55", legend for translation icons, Clear filters when filtered.
- Empty (kind has no rows): `EmptyState` with the kind's one-sentence purpose and the create button; no toolbar, no reorder hint. Filtered-empty: "No Points of Interest match" plus the active filters as removable chips plus "Clear filters". Loading: skeleton rows shaped like the table. Error: `Alert` danger with message, `requestId`, "Try again".
- Activation from a row opens the same confirm as the editor (2.3): refusal stays on the list inside the dialog with the blockers as links; the author is not navigated away.
- Below 900 px: rows become two-line cards (title, chips, kebab 44 px); the table never exceeds its container; no clipped Actions column.
- ARCHIVED rows are hidden from the default segment and shown under Archived (Q-010 records the spec question; the confirm text already promised this).

### 2.3 Editor pattern

- Frame (W0 `EditorShell`): breadcrumb (D-058) above; then **sticky editor header** (z `sticky`): title (h1, 20/700, truncates with full title in `title`), status chip, Pending chip, a one-line state ("Unsaved changes" / "Saved 12:41" / "Saving...", polite live region), readiness badge ("2 to fix", `button` that focuses the side readiness card or opens it on tablet), the header action (ACTIVE: **Apply changes**; DRAFT: **Save**), and a "More actions" menu (Archive; Deactivate when not shown elsewhere; Restore). Ctrl/Cmd+S saves (draft or working copy) with the hint visible in the button's tooltip. Version, created, updated and slug move out of the header into the Status card (no "version 0" on unsaved records; no repeated name as subtitle).
- **Sticky Working Copy banner** (spec: Save draft and Discard live here) directly under the header, offset by a measured CSS variable, with **reserved height** so it never inserts mid-typing: for ACTIVE Resources the banner is always present. States: idle ("No pending changes. Visitors see this version."), dirty ("Unsaved changes. Visitors see the live version until you apply."), saved copy ("Pending changes saved 12:41 by you..."). Buttons `Save draft` (secondary) and `Discard changes` (ghost danger) are real buttons with stated disabled reasons. A "different order" note appears once after Apply, not stale. DRAFT editors show no banner. The browser-stored-draft restore notice is a one-time `Alert` above the form (Restore primary, Discard secondary, full date and time), never after a save in the same session. Archived: read-only `Alert` (no pencil), one Restore control, fields at readable contrast with a stated reason, no disabled Save.
- Layout at 1180 and above: form column `minmax(0,1fr)` capped at 46 rem beside a 340-360 px **side column** that is sticky below the header and banner with its own overflow: (1) Status card (chip, one status sentence, Activate / Deactivate / Restore button, version, updated, created, slug), (2) readiness list ("Before you activate" on DRAFT, "What needs attention" on ACTIVE), grouped by kind of problem with counts, each item a link that focuses the field or Resource (`14` §4), warnings collapsed after three per group, one line per issue not one per language per block ("Italiano: 4 texts missing"), (3) "On this page" section rail (links with state marks such as "Texts: Italiano missing", scroll-spy `aria-current="location"`), (4) Translations card (language name, state text and icon, "Next missing" button, rows are buttons that switch the language tab), (5) Used in. Below 1180: a single column; under the header sits a non-sticky summary row ("Draft · 2 things to fix · Activate") that expands the same cards inline; the Translations and Used in cards follow the form; the sticky header and banner stay.
- Section order (all kinds; the kind package fills the slots): **1 Texts** (language tabs, translation pair view), **2 the kind's core setup** (POI: Placement; Place: Place setup; Route: Route settings and Stops; Event: Dates; Category: Applies to, Level, Icon; Guide: Story), **3 Media** (compact slots, empty slots are one-line buttons not 440 px grids), **4 How visitors reach it**, **5 Details** (collapsed, with a filled count). Textareas auto-grow (min 3 rows, max 20 rows, then scroll).
- Translation tabs (W0 `TranslationsPanel`): real tab pattern (roving tabindex, arrow keys, Home/End), each tab labelled in the language's own script with its `lang`, a completeness icon plus text ("complete", "3 of 5", "missing"), an error marker as an icon with text. In a non-default tab every field shows the **default-language text read-only beside (stacked below 1180) the editable field** with a "Copy source" button; structural controls (reorder, add, remove of blocks, stops, occurrences) are hidden in non-default tabs by a `structural` prop the Route, Guide and Asset editors honour.
- Validation: errors at the field (linked by `aria-describedby`, `aria-invalid`, cleared on input, icon plus text), summarised in a `FormErrorSummary` ("3 things to fix", links that focus fields, request id, never the rejected value) which takes focus on submit; paths without a field fall back to labels via `describePath`; the first invalid field gets focus when there is no summary. 409: per-field mine/current dialog for Save and for Apply, nothing preselected, collection fields chosen as a whole with ordered previews, author and time when the API supplies them. 403/404 on save: the same full-page StateCard states, draft kept, never "not saved + server detail".
- Activation: always a confirm dialog naming the item; lists client-known blockers and warnings grouped by language (translation completeness per language, missing Placement or primary image where the editor knows), says what visitors will see on their next refresh; the platform's 422 renders inside the dialog with each missing field a link that closes the dialog and focuses it. Dirty DRAFT offers "Save and activate". After activation the toast says "Activated" or "Activated with N warnings", never "complete" unless N is 0, and the readiness card recomputes immediately. Deactivate and Archive: the where-used list that "Used in" already holds decides the button state up front (disabled with the reason "Used by 3 items. Remove it from them first", linking to the list); own triggers are not blockers.
- Save feedback: a visible "Saving..." state after 300 ms, "Still saving" after 3 s, independent calls run in parallel, a partial failure says what was saved and what was not, completion is both a toast and the state line, focus returns to the Save button (kept enabled with `aria-disabled`) or the first invalid field.
- "Preview in app": a button under the Status card on wide layouts and in the sticky header "More" row on narrow ones. It opens an **inline panel directly below the action** that pushes the content below it down (never overlays), region `aria-label="Preview: Mobile, Greek, unsaved form"`, Close button and Esc close it and return focus to the action, no focus trap and no inert background so the CMS chrome stays operable, height capped at 70 dvh with its own scroll, sized so the Mobile screen is real size (390 wide) and Web or Kiosk is drawn "Fit" with the scale stated ("Shown at 45 %") and an "Open at real size" link to the new-tab preview. On wide layouts it opens in the side column and offers "Expand" to a full-width inline strip above the form; the surface defaults to the Project's first enabled surface. Content is P8's `ResourcePreview`; the container, push-down layout, Esc and focus return are W0's `PreviewPanel`.

### 2.4 Dialog, popover, menu, toast, alert, empty and error states

- `AppDialog` modal: sizes sm 28 rem, md 36, lg 52, xl 64; header with title and a close icon button; body scrolls; **footer is sticky** (so Cancel and Create are reachable at 200 % zoom); focus moves to the first field (or to the dialog for a confirm), Esc and backdrop close unless busy, focus returns to the opener, only the top dialog answers Esc, open popovers close first. The popover mode of `AppDialog` is removed (D-059 replaced).
- Create dialogs (all six kinds, W0 `FormDialog` plus the kind's fields): Title plus the single kind-specific choice, address (slug) under "Edit address" disclosure with derived value shown, shared error summary, "Create and open" primary, Create Place asks Level after the title (and explains the greyed Sub-place option with its reason), POI gets a Category select, initial focus on Title for all.
- Menus and popovers: Radix `DropdownMenu`/`Popover` wrappers (arrow-key model, `aria-haspopup`, Esc returns focus, initial focus).
- Toast: white card, `--shadow-2`, 20 px role icon, role-coloured title text, optional body, optional `requestId` with copy, dismiss icon button; stack of up to 3; success and info 5 s; warnings 8 s; errors persist until dismissed; timers pause on hover and focus; success and info use `role="status"`, errors `role="alert"`; no left stripe. `showToast(title, body, tone)` keeps its signature and gains an optional fourth `options` argument.
- `Alert` (banners, readiness, restore notice, offline banner, error cards): tint fill, 1 px border at 30 % ink, 20 px icon, title, body, actions, optional request id. One component, no stripes.
- `StateCard` (full-page and section errors: session ended, configuration, 403, 404, platform unreachable, record not found): icon, h1, cause in plain language, next step, request id with copy, primary and secondary action. Copy never speaks to operators ("Keycloak clients, mappers") in the author view; operator detail goes into a collapsed "Technical details" with the request id.
- `EmptyState`: 24 px icon, 16/700 title, one sentence of purpose, one primary action, optional link. `Skeleton`: static `--muted` blocks, 1.4 s opacity pulse only without reduced motion, shaped like the final layout.
- Offline: banner only when `navigator.onLine === false` or two consecutive requests fail (not one aborted fetch); mutating controls become `aria-disabled` with the reason; "Back online" announced; banner reserves its height (no layout shift).
- Session expiry: a `SessionEndedDialog` ("Your session ended. Your unsaved edits are kept in this browser. [Sign in again]") before a single redirect; capped so a persistent 401 cannot loop (at most one redirect per 30 s, otherwise the StateCard).

### 2.5 Dashboard

- First run (Project has no content: zero Places, POIs, Routes, Guides, Events, Categories in any non-archived status): a five-step guide replaces everything else (spec `12` §3): add a Place, add Points of Interest, compose a Page, build the Navigation, preview. Ordered list; the next step is expanded with one primary button, the others are one-line links; steps 1 and 2 tick from list totals including DRAFT (a DRAFT Place counts); steps 3 to 5 link to their screens without ticks (no data to tick them), and the next step is the first unticked among 1 and 2, then 3. Capability warnings are not shown. Not initialised Project: an Alert with "Finish setting up" (Resume) first.
- Otherwise a two-column grid (main, 360 px side; single column below 1100): **Status card** with exactly four states and one action, at most three items listed: *Nothing is live yet* (content exists, zero ACTIVE; action "Activate content" opens the Places list filtered to Draft), *N things block going live* (action "Fix the first issue", three links), *Ready with N warnings* (action "Review warnings"), *Ready* (blocking 0, warnings 0, at least one ACTIVE; action "Preview the app"). "Ready" is asserted only with `status=ACTIVE` total above 0. The current `contentRevision` and "App: Draft/Live" are one muted line inside it. Then **Waiting for you to apply** (only when Working Copies exist: table of title, kind, saved time; Apply and Discard live in the editor, the row's action is "Open"; "who" is absent until the API supplies it, G-025). Then **Warnings**, grouped by kind then code with counts and collapsed (one disclosure per group, each item a link, no 296 tab stops, no `aria-live` on the section). Side column: **Content counts** as one compact link strip per kind (Places 12, "3 draft" muted; zero greyed but still text), then **Project details** in a collapsed disclosure (organisation, slug, template, dates). Translation bars and latest packages are absent (no endpoints, G-023 and G-024); the layout leaves their slots out rather than faking them.
- Error: danger Alert with request id and "Try again"; never a green border on error.

### 2.6 Responsive rules (structural, not fluid type)

- 1440 and 1280: nav 232, editor two columns. 1100 to 1179: nav 232, editor single column with summary row. Below 1100: nav drawer, header single row, switcher stays visible as a name button. 768: lists as cards below 900, dialogs full width minus 16, side cards inline. 200 % zoom at 1280x720: behaves as 640 CSS px: same as 768 rules; sticky bars total at most 112 px; dialog footer sticky; no horizontal page scroll (`14` §1).
- `@media (pointer: coarse)` raises every control to 44 px; Leaflet controls and map pins to 44 px hit areas; the on-screen keyboard cannot hide the primary action because the editor header is sticky at the top, not the bottom.

### 2.7 Copy and vocabulary

One glossary (`lib/glossary.ts`, W0): lifecycle words DRAFT/ACTIVE/ARCHIVED (never "published"), "Working Copy" appears to authors as "pending changes", "readiness" appears as "What needs attention" / "Before you activate" / "Ready", "Application" as "Visitor app", "Slug" as "Address" with the slug in mono beneath, "Internal name", "Exhibit code" explained once via a `What is this?` popover pattern (`HelpHint`), British "organisation" throughout. Greek and other non-English text never upper-cased.

---

## 3. DECISIONS.md entries to add (D-069 onward, append-only)

Numbers are reserved per owner so agents never collide. **Append with a single shell heredoc (`cat >> DECISIONS.md`), never by rewriting the file.** Each entry uses the existing format (Type, Decision, Why, Supersedes, Not done).

| ID | Owner | Title and content |
|---|---|---|
| D-069 | W0 | **UX overhaul: visual authority passes to the owner's brief.** For the three-round overhaul (owner brief 2026-11-12, `ux-audit/BRIEF.md`) the running app's look is the incumbent, not the authority: this supersedes D-004's "the prototype governs visual design" and AGENTS.md §6 for visual language only. Behaviour, data, flows, vocabulary and every spec statement in `12` and `14` are unchanged. Why: the audit found the incumbent fails 4 WCAG gates and 61 % of text is under 12 px. Every later D-entry of this overhaul names what it replaces. Not done: dark mode (no `dark:` class exists; the variable structure allows it later). |
| D-070 | W0 | **Colour, status and focus tokens.** Control border `#737b8b`, placeholder `#5f6877`, muted ink `#566070`, link hover `#a3106a`, semantic trios, one status vocabulary (Draft dashed icon on sunken, Archived outline, Pending in primary tint instead of amber, translation state as icon plus language name), one focus ring (2 px, 2 px offset, halo; fields included), forced-colours and reduced-motion rules in the base layer. Why: C1-06 to C1-09 (P0 1.24:1 borders, 2.54:1 placeholder). Supersedes the colours of D-042 chips and the `.field-input` border; D-042's rule that status is never colour alone stands and is strengthened. |
| D-071 | W0 | **Type system and fonts.** Fixed rem scale 12/13/14/16/20/24, 12 px floor, sentence case, weights 400 to 700, tabular numerals; Montserrat variable self-hosted from `public/fonts` (latin, latin-ext, greek, cyrillic), Google Fonts removed from `index.html` and the shell. Template fonts for the Create Project and Appearance previews still load from Google Fonts per D-045 (previews only, recorded exception to "authoring API and IdP only"). Why: C1-01, C1-05; offline use. Supersedes the px sizes and uppercase labels of the mockup carried since C0; no new npm dependency (font files are assets). |
| D-072 | W0 | **One Button, one Chip, lucide icons, no gradient CTA.** Variants primary, secondary, ghost, danger, danger-outline, link; 8 px radius, sentence case; disabled controls carry a reason; the brand gradient survives only in the logo and sign-in hero. Unicode glyph icons are replaced by lucide (already a dependency). Why: C1-10 to C1-12, C1-04, ds-08. Supersedes D-053 (gradient primary and its contrast e2e check, replaced by a solid-purple contrast check) and the pill buttons. Old class names stay as restyled aliases until Round 3 so out-of-scope screens render. |
| D-073 | W0 | **Shell and navigation model.** Header 56 px single row; nav 232 px at 1100 and above, off-canvas drawer below (supersedes the `md:` disclosure of D-054's menu but keeps D-054's reflow guarantee and D-062's fixed shell); Media is a top-level item as `12` §3 lists it (it was nested under Content); nav items have icons; OFF capabilities show an "Off" chip and a page notice; "Manage members" links to the Portal when `portalUrl` is set, "Help" removed until it has a destination; every route sets `document.title`, moves focus to the h1 and announces "<page> loaded"; `PageFrame` is the single `<main>`. Why: C1-58, C1-119, C1-122, C1-55, C1-76, C1-77. |
| D-074 | W0 | **Editor frame.** Sticky editor header (title, status, state line, readiness badge, Apply changes or Save, More actions) and sticky, height-reserved Working Copy banner holding Save draft and Discard (the `12` §3 split is kept; a merged bar is Q-008); sticky side column (Status, readiness, section rail, Translations, Used in); common section order Texts, core setup, Media, How visitors reach it, Details; Ctrl/Cmd+S; Activate always confirms, shows client-known readiness, offers Save and activate, and never says "complete" with warnings; lifecycle actions demoted (Archive in More actions). Why: C1-22 to C1-26, C1-29 to C1-33. Supersedes D-023's column arrangement and D-060's 360 px column details; D-058 breadcrumbs stand. |
| D-075 | W0 | **"Preview in app" is an inline panel.** Opens directly below its action, pushes content, never covers the form, no focus trap, chrome operable, Esc and Close return focus, height-capped, real-size Mobile and stated-scale Web and Kiosk. Why: C1-86 and `12` §3 ("below the action"). Supersedes D-056, D-059, D-066 (pop-up card, backdrop wheel forwarding). A docked split pane is Q-009 and not built. |
| D-076 | W0 | **Content list pattern.** One list scaffold for the six kinds: sticky toolbar and head, status segments with counts, Pending and Needs translation toggles, sort, URL-stored filters, one Tab stop per row plus a kebab, whole-row open, set position (and top/bottom), disclosure trees, ARCHIVED hidden from the default segment, empty and filtered-empty states, card rows below 900 px. Additive where `12` §3 is silent. Why: C1-13 to C1-21, C1-35. Amends D-017 (reorder stays Manual-order only, now with set position and explained disabled state) and D-035. Bulk selection deferred (Q-016). |
| D-077 | P2 | **Dashboard rebuilt to `12` §3.** First-run five-step guide, four-state status card with one action and "Ready" only with at least one ACTIVE Resource, "Waiting for you to apply", grouped collapsed warnings, one counts strip from list `totalElements`, Project details demoted, no translation bars or packages until endpoints exist (G-023, G-024). Why: C1-41 to C1-52 (P0). Supersedes D-022's single readiness card as the Dashboard; D-022's readiness data and codes stand. |
| D-078 | W0 | **Feedback, dialogs, validation and offline rules.** One Alert, one Toast (queue, pause, errors persist, `requestId`), one StateCard, one FormErrorSummary (focused, links), sticky dialog footer, one z-scale, offline only after `onLine` false or two failures with disabled-with-reason controls, session-ended dialog with capped redirect, `describePath` fallback and `aria-describedby` everywhere. Why: C1-59, C1-62 to C1-75. Supersedes D-040's banner styling and the single-string live region of D-042; their behaviour (mutations disabled, announce) stands. |
| D-079 | W0 (P5, P7 apply) | **Translation work inside editors.** Source text beside target with Copy source, structural controls hidden in non-default tabs, completeness on tabs with roving-tabindex tab pattern, Translations card names missing fields with Next missing, one language-aware date and number formatter (`lib/format.ts`), `lang` and `<bdi>` on language labels. Why: C1-34 to C1-40. |
| D-080 | P7 | **Media pattern.** Library sort and Needs attention filters (no alt text, missing translation, unused, decorative), aspect-correct thumbnails and type icons, Asset editor two-column with sticky preview and Translations first, upload with accepted formats, duplicate warning, queued live-region log and a "Describe now" stepper, picker with Search focus, default ACTIVE and list mode. Why: C1-107 to C1-118. D-032 (Replace only DRAFT) stands. |
| D-081 | P6 | **Maps and Floor plans pattern.** Tile-failure state with Retry (D-064 style and OpenFreeMap stay; correction: D-064 names the OpenMapTiles "OSM Bright" vector style, not raw OSM raster tiles), focusable bounds handles with arrow nudging, numbered pins and arm-to-place state, fan-out placement, out-of-bounds warnings, 44 px controls, coordinate range validation. The Nominatim geocoder and tile host are recorded exceptions to "authoring API and IdP only" (Q-003 stays open for production hosting). Why: C1-93 to C1-100, C1-72. |
| D-082 | P8 | **Preview pattern.** One `PreviewPane` shared by the Preview page, the editor panel and the new tab: labelled region, stand-in headings demoted and inert until "Interact", "Skip preview" link, true device sizes with Fit/100 %/50 % and stated scale, Working mode includes Working Copies where the data allows (else honest copy, G-034), surface-aware grouped Fire trigger with a persistent "Fired:" chip and Reset, new tab with a slim control bar and per-state title. Why: C1-81 to C1-90 (P0). D-014/D-015 (stand-in) stand. |
| D-083 | W0 | **Hit areas.** 40 px controls (44 on `pointer: coarse`), 32 px minimum on desktop rows, enlarged Leaflet controls and pins; padding not font size. WCAG 2.5.8 is not in the 2.1 gate and is applied by the kiosk persona's rule. Why: C1-123. Density toggle deferred. |
| D-084 | P1 | **Project picker, Create Project and session states.** Picker and Home share one searchable list (Recent and Current first, "Needs setup (n)" collapsed, arrow-key model); the last opened Project id (never a token) is kept in browser storage and offered on return (additive; sign-in still lands on the picker unless a last Project exists and the author confirms via a "Continue to <Project>" button); Create Project gets a real stepper, one form-error pattern with summary and focus, a review step, Initialize disabled with no language; one Project-status vocabulary ("App: Draft"). Why: C1-53, C1-54, C1-59, C1-60, C1-62. Supersedes D-045's step presentation (its flow and API use stand). |

---

## 4. Wave 0: foundation (one agent, runs first, three ordered stages)

Owner: W0. Stages merge in order; Wave 1 may start when stage 0.3 is done (stage 0.1 alone is enough for P2, P6 and P8 to start reading; do not start editing before 0.3 because they import its components). If the orchestrator prefers, stages 0.2 and 0.3 touch disjoint files and can be two agents after 0.1.

### Stage 0.1 Tokens, primitives, shell (closes C1-01 to C1-09, C1-10, C1-58, C1-61 partly, C1-63 to C1-68, C1-75, C1-76 to C1-78, C1-119, C1-122, C1-123, C1-124, C1-09)

Files and work:
- `src/style.css`: tokens (section 1), `@font-face`, base layer (focus, selection, caret `accent-color`, scrollbars left native, `::selection` in brand tint, link underline offset), reduced-motion and forced-colours blocks, aliases `.field-input`, `.field-label`, `.small-label`, `.dialog-primary`, `.dialog-secondary` restyled to the new look, `.table-head`/`.table-row` classes, shadows, durations, `skelpulse` made reduced-motion safe.
- `tailwind.config.js`: colour map (success, warning, info, ink2, placeholder, line, sunken, tints), `fontSize`, `fontFamily.sans = ["Montserrat Variable", "Montserrat", system fallback]`, `borderRadius`, `boxShadow`, `zIndex`, `transitionDuration`, `transitionTimingFunction`, screens `nav: 1100px`, `edit: 1180px`.
- `index.html`: remove Google Fonts links, update the pre-mount placeholder to tokens, preload fonts. `public/fonts/*` and `OFL.txt` (new).
- `src/styles/list-table.css`: tokenised, kept (CategoriesView and MediaView import it until they adopt the scaffold; remove in Round 2).
- `src/components/ui/**` (new unless noted): `button/` (rewrite: variants, sizes, `loading`, `disabledReason`), `chip/Chip.vue`, `input/Input.vue`, `textarea/Textarea.vue`, `select/Select.vue` (native styled), `checkbox/Checkbox.vue`, `switch/Switch.vue`, `field/FormField.vue`, `field/FormErrorSummary.vue`, `tabs/` (Radix tabs wrappers and a link-tab variant), `popover/`, `dropdown-menu/`, `tooltip/`, `alert/Alert.vue`, `skeleton/Skeleton.vue`, `empty-state/EmptyState.vue`, `state-card/StateCard.vue`, `spinner/Spinner.vue`, `help-hint/HelpHint.vue`.
- Shared layout: `AppHeader.vue`, `WorkspaceNav.vue` (drawer, icons, Off chip, sections), `PageFrame.vue` (new, the `<main>`), `PageHead.vue` (`section` prop for the capability notice, back-compatible props), `SectionTabs.vue`, `AppBreadcrumbs.vue`, `AppDialog.vue` (sizes, header close, sticky footer, `modal+1` nesting, popover mode removed after 0.2 lands `PreviewPanel`), `ConfirmDialog.vue`, `AppToast.vue`, `OfflineBanner.vue`, `StatusChip.vue`, `SessionEndedDialog.vue` (new), `src/App.vue` (announcer, skip link, mounts), `src/router.ts` (route meta titles, `afterEach` title, focus h1, announcement, scroll), `src/workspace/sections.ts` (Media top level, icons, titles per spec, glossary-aligned subtitles), `src/stores/toast.ts`, `connection.ts`, `confirm.ts`, `src/stores/sessionNotice.ts` (new), `src/lib/format.ts` (lucide-based status data replaces `statusGlyph`; `formatDate`, new `formatDateTime`, `formatRelative`, language-aware), `src/lib/focus.ts` (`restoreFocus`, `focusHeading`), `src/lib/announcer.ts` (new `useAnnouncer`), `src/lib/errors.ts` (new `describeError(error)` mapping status and code to plain sentences with `requestId`, never the rejected value, no developer text), `src/lib/glossary.ts` (new), `src/workspace/formFields.ts`.
- `ux-audit/round-1/implementation/system.md`: every primitive (import path, props, example, states), tokens table, the migration checklist (how to replace `text-[Npx]`, hex, `rounded-[`, glyphs), the contract section 6.2 below, and the verification commands.

Acceptance (checkable):
1. Computed-style probe on every screen: zero text under 12 px, all sizes in rem (root 200 % screenshot scales every text), zero `uppercase` computed on labels, input border contrast at least 3:1, placeholder at least 4.5:1, all text at least 4.5:1, no `outline: none` without a ring. axe clean on the picker, Dashboard, one list, one editor.
2. `grep` gates: zero `text-\[[0-9.]+px\]` in `src/components/ui`, shell files and style; no hex outside `style.css` and the preview stand-in in files W0 owns; `impeccable detect` zero findings on W0 files.
3. Keyboard: Tab order begins with Skip link; after any route change focus is on the h1 and "<page> loaded" is in the live region; title reads "<page> · <Project> · iGuide CMS"; Esc closes popover and drawer and returns focus; the user menu and drawer have arrow-key models.
4. Screenshots at 1440, 1280, 1024, 768, zoom200: header one row everywhere; nav drawer below 1100 with 44 px items; forced-colours screenshot shows every button, chip, tab and current nav item with a boundary; reduced-motion shows no running animation with a skeleton on screen (`document.getAnimations()` empty).
5. The out-of-scope screens (Overview, Languages, Surfaces, Translations, Navigation, a placeholder) each render and pass axe with one screenshot each.
6. `make typecheck` and `make build` pass; e2e specs `screens`, `zoom-and-structure`, `content-lists` updated for new selectors (the D-053 gradient check becomes a solid-primary contrast check at least as strict), none deleted or weakened.

### Stage 0.2 Editor shell (closes C1-11, C1-12, C1-22, C1-23 partly, C1-24 shell part, C1-25 to C1-27, C1-29 to C1-33, C1-34 shell part, C1-36 to C1-38, C1-40, C1-69 to C1-71, C1-73, C1-74, C1-86 container, C1-77)

Files: `src/components/editor/EditorShell.vue` (rewrite to 2.3; keeps its prop and slot contract, section 6.2), `src/components/editor/TranslationsPanel.vue` (pair view, tabs, completeness, `structural` prop, `aria-describedby`, error marker), new `src/components/editor/EditorSectionNav.vue`, `WorkingCopyBanner.vue`, `ReadinessList.vue`, `EditorStatusCard.vue`, `PreviewPanel.vue`, `ActivateDialog.vue`, `ConflictDialog.vue` (Save and Apply), `src/components/StatusChangeDialog.vue`, `src/components/editor/AiMarker.vue` (tokens only), `src/workspace/useResourceEditor.ts` (state line, Ctrl+S, `focusAfterSave`, `describePath` label fallback, error-clear-on-input, focus summary or first invalid, `requestActivate` with dirty handling and "Save and activate", parallel-safe save status, leave-guard copy "stays in this browser as a draft", restore banner only on first open), `src/workspace/useStatusActions.ts`, `src/workspace/activationHandoff.ts`, `src/workspace/referenceLinks.ts` (read mostly), `src/workspace/translationStatus.ts`.

Acceptance: a Place and a POI editor (as proxies) show: sticky header and banner stay visible after scrolling 1,500 px, Save and Apply reachable without scrolling; Ctrl+S saves; banner never shifts the form (measure y of the first field before and after typing, delta 0); activation always confirms and the toast never says "complete" with warnings; DRAFT shows "Before you activate"; a non-default tab shows source text beside the field with Copy source; tab keys work (Left, Right, Home, End); "Preview in app" opens inline below its action, pushes the form down (form y increases, nothing overlaps), Esc closes and focus returns, header Save still reachable while open; axe clean in DRAFT, ACTIVE with pending changes, ARCHIVED, 409 and 422 states; at 1024 and 768 the status and readiness are reachable without scrolling 3,000 px; 200 % zoom shows no clipped Save.

### Stage 0.3 List scaffold (closes C1-13 to C1-21, C1-35 shell part, C1-14, C1-37, C1-78, C1-120)

Files (all new unless noted): `src/components/list/ListToolbar.vue`, `StatusSegments.vue`, `SortSelect.vue`, `RowMenu.vue`, `ListFooter.vue`, `ListEmpty.vue`, `ListTable.vue` (table or card rows by width, sticky head, `aria-sort`, tree disclosure), `SetPositionDialog.vue`; rewritten `src/components/ReorderControls.vue` (set position, top/bottom, announcements; existing props stay valid), `ListFilterMenu.vue`, `FilterChoiceGroup.vue`, `SearchLanguageSelect.vue`, `FeaturedFilterChip.vue`, `CategoryFilterSelect.vue`, `TranslationDots.vue` (icon, language name, `lang`, legend, optional link), `TriggerChips.vue` (icons, outline for DRAFT); `src/workspace/useListQuery.ts` (new, URL-backed filters, scroll restore), `listFilters.ts`, `useReorder.ts` (set position, announce), `useCategoryFilter.ts`, `src/components/ui/dialog/FormDialog.vue` (new, create-dialog frame with summary).

Acceptance: `vue-tsc` passes; `system.md` carries a complete minimal list view (about 60 lines) built on the scaffold, which P3a and P3b adopt first; every existing prop of the old list components keeps working (additive changes only) so the six old views run unchanged until P3a/P3b land; `DropdownMenu` row menu is arrow-key operable and returns focus on Esc.

Closes by ID: C1-01 to C1-10, C1-11 and C1-12 (shell side), C1-22, C1-25 to C1-27, C1-29 to C1-33, C1-36 to C1-38, C1-40, C1-58, C1-63 (components), C1-67, C1-68, C1-69 to C1-71 (components), C1-73 to C1-78, C1-86 (container), C1-119, C1-122, C1-123, C1-124. P0 closed: C1-06.

---

## 5. Wave 1 work packages

All packages: import W0 primitives only (no local copies of `.field-input`, `.th`, chips, buttons); every screen state screenshot at 1440, 1280, 1024, 768, zoom200 plus forced-colours and reduced-motion for the principal state; axe clean; keyboard run recorded; report at `ux-audit/round-1/implementation/<package>.md`. Packages must not edit a file owned elsewhere (section 9); if a needed change sits in another owner's file, write it as a request in the report and use the documented contract. Order below starts from the lowest-scoring screens (scoreboard baselines in brackets).

Dependencies: all Wave 1 packages depend on W0 stage 0.3. P6 publishes the map-engine contract (6.2) in its first commit; P4 and P5 wire map props last. P8's `ResourcePreview` keeps its current props (`model`, `dirty`, `close`) so W0's `PreviewPanel` can mount it before P8 lands.

### P1 Sign-in, session, error states, picker, Create Project, header switcher (size L)

Screens and baselines: Session-expired [35], Dashboard-adjacent landing after Initialize, Create Project [51], Project switch [54], Project picker [57], 403 [59], Config error [61], SSO landing [62], 404 [65], 502-504 [67], Offline [70], Sign-in [81], Header [60 partly W0].
Closes: C1-59 (P0), C1-62, C1-53, C1-54, C1-55 (with W0 header), C1-56, C1-57, C1-60, C1-61, C1-63, C1-64, C1-65 (full-page states for save 403/404 use the StateCard from W0; wiring in editors is each editor package's, via `describeError`), C1-66 (message strings), C1-67 (logic with W0 store), C1-125 part (layout skeleton).
Files owned: `src/views/SignInView.vue`, `src/views/SessionErrorView.vue`, `src/views/HomeView.vue`, `src/views/CreateProjectView.vue` (split into new `src/views/createProject/*.vue`: `StepName.vue`, `StepTemplate.vue`, `StepLanguages.vue`, `StepReview.vue`, `Stepper.vue`), `src/components/ProjectSwitcher.vue`, `src/views/workspace/ProjectLayout.vue`, `src/stores/projects.ts`, `src/workspace/currentProject.ts`, `src/workspace/lastProject.ts` (new), `src/platform/auth.ts` (flag and capped redirect only), `src/platform/api.ts` (`defaultMessage` strings, session-notice hook only), `src/platform/catalogue.ts` (thin additions only), `src/platform/templates.ts` (unchanged except tokens if any; Google Fonts request stays).
Changes: Session ended dialog wired (sets `sessionNotice`, one capped redirect, edits kept message; after sign-in a "Welcome back, your edits were restored" is handled by editors' restore notice). StateCards for session expired, configuration (author wording, technical details collapsed), 403 ("You no longer have access to this Project"; fixes the wrong "only managers"), 404 (honest: it is still in the picker until refreshed, "Remove from list" or refreshed list), platform unreachable (request id, retry), each with a title, h1 and the right next step and one layout. Sign-in: one brand, "Sign in with UNICHE", a one-line help, SSO landing a branded skeleton with "Checking your UNICHE session". Picker (Home and header popover share `ProjectList`): search (autofocus in popover), Recent and Current first, organisations grouped, "Needs setup (n)" collapsed with a Resume button, status word "App: Draft" not a bare ACTIVE, current Project scrolled into view, arrow-key model (Radix), close before opening the unsaved-work confirm, z-order fixed (confirm over popover removed), Manage members link or absent, "Continue to <last Project>" on Home, stop firing `GET /projects/{id}` per Project for the list (G-029 for the real fix; until then fetch lazily for the visible and current Projects only). Create Project: real stepper with step names and state, Close, sticky footer with one primary per step, errors per field plus summary with focus and 422 per-field mapping, slug error shown at a field the author sees, "Style confirmed" becomes a normal selected state, review step shows name, Template, style, languages, surfaces in readable rows, Initialize disabled with no default language and says why, plain-language help for Template (irreversible), Slug, Surface; landing after Initialize goes to the Dashboard first-run guide.
Acceptance: forced 401 persists: at most one redirect and the dialog, edits kept; 403, 404, 503 states each have h1, document title, request id, one next action, no developer words; Create Project step 1 with empty name: summary announced (`role=alert`), focus on summary, each error linked and described, 422 from a mocked response shows per-field errors; picker search filters 37 Projects, Esc returns focus to the opener, Arrow keys move, Enter opens; Project switch with unsaved work shows one dialog only; every state at 1440/768/zoom200 screenshot; axe clean on all.
Constraints: no token to storage (only the last Project id), no change to the generated client, Catalogue never called directly, `requestId` shown, rejected value not echoed.

### P2 Dashboard and first run (size M)

Screens: Dashboard empty [40], populated [47]. Closes C1-41 (P0), C1-42 (P0), C1-43 to C1-46, C1-49, C1-50, C1-51, C1-52 (do not use pending for assets), C1-47/C1-48 as documented absences.
Files owned: `src/views/workspace/DashboardView.vue`, new `src/views/workspace/dashboard/FirstRunGuide.vue`, `StatusCard.vue`, `PendingChanges.vue`, `ReadinessGroups.vue`, `ContentCounts.vue`, `ProjectDetails.vue`, `src/platform/readiness.ts` (sentences, grouping helpers, no endpoint change), new `src/platform/dashboardData.ts` (thin: counts wrapper over `fetchContentCounts`, `status=ACTIVE` total, `pending=true` page-size-1 lists for the six Resource kinds, `contentRevision` and application status via `platform/settings.ts` read-only). Read-only imports: `platform/overview.ts`, `platform/settings.ts`.
Changes: section 2.5 exactly. Copy fixes: "deserve" grammar, "(el)" becomes the language name, "active content" becomes "live content", "organisation" British, "Application" becomes "visitor app". `aria-live` only on the status headline, whole page inside `PageFrame` landmarks. Status card never shows a green border on error.
Acceptance: Empty Project (use a freshly created never-touched Project): five-step guide, step 1 highlighted with one button, no status card, no warnings; after creating a DRAFT Place, step 1 ticks and step 2 is next. Project with DRAFT-only content: "Nothing is live yet" with action to the Draft list, never "Ready". Populated: Status card, Waiting for you to apply lists the 10 Working Copies, counts strip with links, Warnings collapsed with group counts, tab stops before first content fewer than 8, axe `region` clean. Mock readiness failure: danger Alert with request id. Screenshots for each of the four status states (forced by `page.route`).
Constraints: counts from `totalElements` only; no translation bars; no fabricated packages.

### P3a Content lists, part 1: Places, Points of Interest, Routes, and their create dialogs (size L)

Screens: Places, POI, Routes lists [60 each], their create dialogs [60]. Closes C1-13 to C1-21 for these kinds, C1-28 (create-dialog part), C1-69, C1-70, C1-71 for these dialogs, C1-123 rows, C1-120.
Files owned: `src/views/workspace/places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, `places/CreatePlaceDialog.vue`, `pois/CreatePoiDialog.vue`, `routes/CreateRouteDialog.vue`, `places/placeTree.ts`.
Changes: rebuild each view on the W0 scaffold (section 2.2) with this kind's columns: Places (title with tree disclosure, type INDOOR/OUTDOOR chip, linked map or floor plan state, status, translations), POIs (title, Place, Category, triggers, status, translations; Category and Featured filters), Routes (title, mode and difficulty, stops count, status, translations). Activation through W0 `ActivateDialog`; refusal stays on the list. Create dialogs on `FormDialog`: Place (title first, then Level, Sub-place explained), POI (title, Place, Category), Route (title, INDOOR/OUTDOOR), shared summary and focus, "Create and open". Remove local `.field-input` copies and the hand-rolled pills.
Acceptance: at 55 POIs: toolbar and head sticky, sort works and is in the URL, Back from an editor restores filters and scroll, Tab crosses the table in about 2 stops per row (row link and kebab), "Move to position" takes a POI from row 3 to row 40 in one step and announces it, filtered-empty shows chips and Clear, 768 shows card rows with 44 px kebab and no clipped actions, status and pending and translation never colour-only, axe clean, create dialogs reachable (Cancel/Create) at zoom200.
Constraints: spec `12` §3 columns kept (title, slug, updatedAt, status, pending, translation dots, trigger chips, "No trigger..." text, Places indented).

### P3b Content lists, part 2: Guides, Events, Categories, and their create dialogs (size M-L)

Screens: Guides, Events, Categories lists [60 each], their create dialogs. Same closes as P3a for these kinds plus C1-20 (Categories rows no longer truncate or wrap actions), C1-70 (Category dialog), C1-71.
Files owned: `src/views/workspace/guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue`.
Changes: as P3a. Events: next occurrence in the user's language-aware format (shared formatter), no Event activation special cases in the UI (G-033 recorded). Categories: icon, scope (POI or Route) chip, subcategory tree with disclosure, usage count not available (omit). Remove the local `.th/.td` copies, drop the `list-table.css` import.
Acceptance and constraints: as P3a, with Categories tree collapse proven by keyboard and Events at 768.

### P4 Place and POI editors, TriggersCard, media slots (size L)

Screens: Place editor [60], POI editor [60], Triggers card (all kinds consume it), media slots. Closes C1-24 (these editors), C1-28, C1-80 (with P6 engine), C1-91, C1-92, C1-23 (parallel save of these editors), C1-33, C1-116 part none, C1-121 for these editors (via shell).
Files owned: `src/views/workspace/places/PlaceEditorView.vue`, `pois/PoiEditorView.vue`, `src/components/editor/TriggersCard.vue`, `QrCodePreview.vue`, `BackendQrCode.vue`, `src/components/media/MediaSlots.vue`, `src/platform/pois.ts`, `places.ts`, `triggers.ts`, plus `e2e/place-editor.spec.ts` and `e2e/place-map-link.spec.ts` (selector updates only).
Changes: slot the section order of 2.3. POI: Texts, Placement (Place, Category, map or coordinates; hollow pins for others; coordinate fields with client range check -90..90 and -180..180, decimal comma accepted or rejected with a message, never throws), Media as compact slots (image, audio per language inside the language tab, video), How visitors reach it, Practical details collapsed with filled count. Place: Texts, Place setup (Indoors/Outdoors choice editable, linked map or floor plan; for INDOOR a floor-plan x/y path and no outdoor map; "Inside this place" children card), Media, How visitors reach it. One coordinate set (typed fields and the pin in sync). Triggers card: QR block always rendered (disabled frame, reason, "Set the web address" link, "Test in preview" always offered), beacon UUID on its own row, real labels for Major, Minor, Radius, Wait, per-row "Test in preview", named "Remove QR code" with confirm (focus to next row, announced), one "No QR image" warning per card, AR note shown once as a `HelpHint`. Context markers on maps are not tab stops (engine contract), the editable pin only; four audio "Choose" buttons named per language. DRAFT assets attached to an ACTIVE item raise a readiness warning in the card ("Image X is still a draft") feeding the shell's client-known list (C1-33).
Acceptance: Placement reachable within the first viewport scroll at 1280x720 via the section rail; Tab count from the field above the map to Save at most 8; 'abc' or 999 in a coordinate field shows the field error and no console error; QR block present with and without a public address; section rail marks missing parts; save of 9 independent requests runs concurrently (timing under 1.5 s on the dev stack) and a partial failure names what failed; axe clean in DRAFT and ACTIVE states; 1024 and 768 screenshots show Placement and readiness without a 3,000 px scroll.
Constraints: triggers semantics unchanged (`11` §9, D-039), no analytics, API client untouched beyond the three hand-written resource files.

### P5a Route and Guide editors, StoryEditor, Resource picker (size L)

Screens: Route editor [60], Guide editor [58]. Closes C1-34 (structure hidden in non-default tabs for these), C1-101, C1-103 (Route stop picker), C1-79, C1-106, C1-24 for these editors, C1-23 for these.
Files owned: `src/views/workspace/routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `src/components/editor/StoryEditor.vue`, `StoryEditor.ts`, `src/views/workspace/guides/guideElements.ts`, `src/components/ResourcePickerDialog.vue`, `src/components/resourcePicker.ts`, `src/platform/routes.ts`, `guides.ts`, `e2e/guide-reference.spec.ts` (selector updates only).
Changes: Route: Texts, Route settings (mode, difficulty, distance, duration), Stops (map pinned above on wide layouts, numbered stops, legend for the line), Category, How visitors reach it. Stops add through a searchable multi-select picker (stay open, filter by status and Place, DRAFT POIs visibly labelled, add several then Done). Remove of a stop, block or occurrence is Confirm-or-Undo ("Stop removed. Undo") with a live-region message and focus to the next row; remove is separated from the move arrows. Guide: story editor with heading-level buttons named "Heading 2" matching the visible "H2" (accessible name contains the visible label), per-block controls, structural controls hidden in non-default tabs, per-language tabs show source beside target for each paragraph, "Text is not translated" shown once per language not per block. Guide and Category parity with spec `12` §3 ("How visitors reach it", "Preview in app") is Q-012, not built; the Guide editor does keep "Preview in app" as present today.
Acceptance: remove-with-undo works by keyboard; Guide at the Greek tab shows the Italian-style pair view without 16 empty blocks; axe has no `aria-label`/label-in-name violation on heading buttons; Route picker adds 6 stops in one open; Route at 768 keeps the map and list usable; sticky header and banner behave as 2.3.

### P5b Event and Category editors (size M)

Screens: Event editor [60], Category editor [60]. Closes C1-102, C1-103 (Event pickers), C1-104, C1-39, C1-71 (end before start inline), C1-106 (repeat weekly count).
Files owned: `src/views/workspace/events/EventEditorView.vue`, `src/views/workspace/categories/CategoryEditorView.vue`, `src/components/CategoryIcon.vue`, `src/platform/events.ts`, `categories.ts`.
Changes: Event: occurrences stack as cards below 900 px (Cancelled toggle and Remove always reachable at 200 % zoom), date and time as paired labelled fields with the shared language-aware formatter, end-before-start error inline as typed, Place/POI/Route as searchable comboboxes (no 60-option native select), "Repeat weekly" gets count or end date and a plain preview of the generated dates. Category: "Applies to", "Level", parent, icon grid as a labelled `radiogroup` with arrow keys (one tab stop) and a visible text and check mark for the selected icon plus "None".
Acceptance: Event occurrence row at zoom200 shows Cancelled and Remove; the icon grid is one Tab stop with arrows; axe clean; shell behaviour as P5a.

### P6 Maps and Floor plans, and the map engine (size L)

Screens: Map editor [57], Floor plan editor [60], New map dialog [60], New floor plan dialog [60], Maps list [76], Floor plans list [74]. Closes C1-93 to C1-100, C1-72 (map side), C1-80 (engine side), C1-99, C1-97, C1-123 (map controls).
Files owned: `src/views/workspace/maps/MapsView.vue`, `MapEditorView.vue`, `NewMapDialog.vue`, `FloorPlansView.vue`, `FloorPlanEditorView.vue`, `NewFloorPlanDialog.vue`, `src/components/map/GeoMapCanvas.vue`, `src/components/map/basemap.ts`, `src/components/GeoPicker.vue`, `src/components/RouteMap.vue`, `src/platform/maps.ts`, `floorPlans.ts`.
Engine contract (published first, additive, defaults preserve today's behaviour): `GeoMapCanvas` gains `tileState` events (`loading`, `ready`, `error` with Retry), `contextMarkersFocusable` (default false), `announce` callback for marker and handle moves, focusable bounds corner and centre handles with arrow nudging (Shift for 10x) when bounds are editable, 44 px controls and pin hit areas on coarse pointer, `showZoomControls` single set. `GeoPicker` and `RouteMap` keep their props.
Changes: Map editor page order: name, bounds and the map adjacent (bounds fields next to the map, "Set as visitor start view"), then visibility, visitor filter (collapsible), linked Place; one set of zoom controls; tile error card ("The map background could not be loaded. [Try again]", the editor stays usable by coordinates); warning when placed items fall outside bounds; coordinates validated client-side (decimal comma handled, no `Invalid LatLng`); at 1024 the map is full width 360+ px above the cards and never starts below the fold; route line legend. Floor plan editor: banner space reserved (no 85 px shift mid-drag), numbered pins at one size (44 on touch), "Place" arms a visible "Tap the plan to place <name>. [Cancel]" state, new placements fan out (not 0.5/0.5), search above the Unplaced list, names per item in buttons ("Place Acropolis"), x/y range validation, rotation explained, nudge announced. New map dialog: geocoder errors per status (429 and others not "check the connection"), human names for result types, "Reset to search result". Floor plans list: per-Place order visible, Places that already have a plan stay in the picker marked "has a plan". Both lists use the W0 table classes and tabs with counts.
Acceptance: block tile hosts (route abort): the tile error card appears and Retry works, no blank grey box; keyboard: Tab reaches each bounds handle, arrows nudge and announce; Map editor at 1024 shows map and bounds above the fold; enter "abc", "12,5", "999": field error, no exception; floor plan "Place" shows armed state and Esc cancels; ACTIVE floor plan first pointer move shifts nothing; axe clean; map controls at least 44 px in coarse emulation.
Constraints: D-064 style and OpenFreeMap stay; Nominatim stays; no new dependency.

### P7 Media (size L)

Screens: Media library [60], Asset editor [60], Upload dialog [60], Asset picker [60]. Closes C1-107 to C1-118, C1-34 and C1-35 (Asset), C1-19 (library), C1-109 partly (show the number that matches the editor's references list and note G-030).
Files owned: `src/views/workspace/media/MediaView.vue`, `AssetEditorView.vue`, `src/components/media/AssetThumb.vue`, `UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `AssetPickerDialog.vue`, `src/workspace/useAssetUpload.ts`, `src/platform/assets.ts`, `e2e/media.spec.ts` (selector updates only).
Changes: Library: toolbar and sticky head from W0, sort (Updated, Name, Type, Size, Used in), "Needs attention" filters: no alt text, missing translation in <language>, unused, decorative (from loaded rows), aspect-correct thumbnails (`object-contain` on a fixed ratio box), type icons for audio, video, 3D, document (no 9 px text labels), always-visible count above the grid, grid and list toggle both with one Tab stop per item, paging moves focus to the first item and announces the range (the 200 in memory are shown with "Show more" instead of hidden). Asset editor: two columns, sticky preview (at most 40 dvh), Translations first with alt text beside the image and the Decorative checkbox above it (effect stated: "No alternative text is needed. Screen readers skip it"), where-used list and Replace in the side column, filename, size and duration (when the API gives it) for audio, video, PDF; translation structure honours `structural`; no duplicate "Nothing needs attention"; no "version 0". Upload: accepted formats listed (client allow-list: images, audio, video, PDF, 3D, and a warning for others, G-032), duplicate detection by name and size with "This looks like a copy of X", queue shown as a list with a live-region log (start, each result, final summary "5 uploaded, 1 failed"), failed rows retry only when retry can help and show `requestId`, result rows link to the asset, "Describe now" opens a stepper over the new assets for alt text, close X in the header. Picker: initial focus on Search, taller dialog (at least 560 px at 1280x720, scroll inside), two-line titles, default status ACTIVE, list mode for audio with play and language, attach announced, a single uploaded file auto-selected, a "No alt text" cue visible before selection.
Acceptance: alt text field visible in the first viewport at 1280x720 and the preview stays visible while typing; library filter "No alt text" lists exactly the matching assets; upload of one image and one `.txt`: the log is announced in order and the summary; picker at zoom200 shows tiles not only the filter rail; axe clean; D-032 respected (Replace only DRAFT).

### P8 Preview page, DeviceFrame, stand-in, ResourcePreview, new tab (size L)

Screens: Preview in app panel [48], Preview page [60], new tab [60]. Closes C1-81 (P0), C1-82 to C1-85, C1-87 to C1-90, C1-86 content, C1-89.
Files owned: `src/views/workspace/PreviewView.vue`, `src/views/AppPreviewView.vue`, `src/components/preview/DeviceFrame.vue`, `PreviewApp.vue`, `ResourceContent.vue`, `strings.ts`, `surfaces.ts`, new `src/components/preview/PreviewPane.vue`, `FireTrigger.vue`, `PreviewControls.vue`, `src/components/editor/ResourcePreview.vue`, `src/workspace/preview.ts`, `previewData.ts`, `previewModels.ts`, `projectTheme.ts`, `e2e/editor-preview.spec.ts`.
Changes: `PreviewPane` (labelled `role="region"` `aria-label="Preview: Kiosk, Ελληνικά, working content"`, stand-in headings demoted to `div role` text and the stand-in made `inert` until the author chooses "Interact with the preview", a "Skip preview" link before it, no second h1, tab stops inside the frame removed by default). Device frames at true size with Fit (default), 100 % and 50 % and the scale stated ("Shown at 37 %") and a portrait/landscape switch for Kiosk; no fake browser dots on Kiosk; caption at least 12 px. Controls bar: one row at 1024 (wraps to a labelled second group at 768), labelled groups using the W0 tabs for Surface, Language, Content (Live and Working), changes announced politely. Fire trigger: surface-aware (beacon not offered on WEB and KIOSK), grouped by type, short labels (type plus target name), a persistent "Fired: QR code, Acropolis" chip with Reset, notes cleared on surface, language or mode change, Live mode explains why DRAFT triggers are not listed ("3 draft triggers are hidden in Live"). Working mode includes Working Copies if the list data carries them; otherwise the page says honestly "Drafts shown. Pending changes of active items are shown in each editor's preview" and G-034 is recorded. Page copy: subtitle "A stand-in drawn from your content, per surface and language. Preview never changes what visitors see." (not "unpublished"); disclaimer above the frame. Stand-in chrome strings follow `lang` (`strings.ts` completed for Greek and the Project's languages, "Visit 5 min" localised); list missing titles by name. `ResourcePreview` content for W0's `PreviewPanel`: surface defaults to the first enabled surface, Mobile real size, Web and Kiosk fit with scale and "Open at real size". New tab: slim control bar (surface, language, mode, "Open at real size" off by default), real surface size, case-insensitive params, invalid params shown not silently ignored, per-state `document.title`, a proper not-found StateCard.
Acceptance: Preview page: one h1 in the document, preview region named, 5 or fewer tab stops before the first CMS control after the frame, Tab bypass works, `inert` released by "Interact"; at 768 the Web frame uses Fit width with a stated scale of at least 60 % (or the Fit chooser says why not) and Kiosk portrait fits; fire a QR trigger on MOBILE and see the chip; editor panel verified with W0 acceptance (inline, pushes, Esc, focus). axe clean on the page, the panel and the new tab.
Constraints: no analytics event from the preview; D-014/D-015 stand-in unchanged in nature; preview reads with the author's token only.

---

## 6. Execution protocol and definition of done

### 6.1 Order and parallelism

1. W0 stage 0.1, then 0.2 and 0.3 (sequential for one agent, parallel for two).
2. Wave 1: P1, P2, P3a, P3b, P4, P5a, P5b, P6, P7, P8 in parallel; P6 first publishes the engine contract; P4 and P5a wire map props last; nobody edits W0 files (request changes in the report; W0 owner or the orchestrator integrates).
3. Review gate per `BRIEF.md`; Round 1 scores recorded in `scoreboard.md` by the verification agents.

### 6.2 Cross-package contracts (stable so packages can code in parallel)

- `EditorShell` props as today (`editor`, `backLabel`, `backTo`, `title`, `subtitle`, `activationHint`, `referenceLink`, `pending`, `tabbed`, `preview`, `translations`), plus optional `sections: { id; label; state? }[]` (rail), `structuralInNonDefault?: boolean`, and slots `default` (form sections, each wrapped in `<section id>` using `EditorSection`), `aside`, `header-extra`. `EditorSection` (new, W0, `components/editor/EditorSection.vue`): title, id, optional filled count, `collapsible`, state mark.
- `TranslationsPanel` keeps all props, adds optional `structural` (boolean, default true) passed down; it exposes `activeLanguage` and the default-language source for editors through `defineModel`.
- `ListTable` and friends: `columns` config, `rows`, row slot `#cell-<key>`, `#empty`, `reorder` object from `useReorder`, `query` from `useListQuery`.
- `Button`: `variant`, `size`, `loading`, `disabledReason`, `as-child`. `Alert`: `tone`, `title`, `requestId`, slots `actions`, default. `StateCard`: `icon`, `title`, `requestId`, slots `default`, `actions`, `details`. `FormErrorSummary`: `summary` shaped as `editor.summary`. `FormDialog`: `title`, `size`, `busy`, `errors`, slots `default`, `actions`.
- `showToast(title, body?, tone?, options?: { requestId?: string; persist?: boolean })`; `useAnnouncer().say(text, mode?)`.
- `GeoMapCanvas` additive props and events in P6 above.
- `ResourcePreview` keeps `model`, `dirty`, `close` event.

### 6.3 Definition of done (every package and W0)

- `make typecheck` and `make build` pass; TypeScript strict, no `any`; JSDoc on every exported function, component and composable; Vue 3 `<script setup>`; no new npm dependency (the font files are assets); no change to generated API client code; thin hand-written wrappers only.
- No `text-[Npx]`, no hex outside `style.css` and the preview stand-in, no `rounded-[`, `shadow-[`, `z-[`, `tracking-[`, no `uppercase` on labels, no glyph icons in the package's files; `impeccable detect` clean.
- Per screen and state: screenshots at 1440, 1280, 1024, 768, zoom200; forced-colours and reduced-motion screenshots of the principal state; a recorded keyboard run (Tab order, Esc, focus return, announcements); axe zero violations; loading, empty, error, offline states captured.
- Behaviour preserved: spec `12`/`14` statements, lifecycle vocabulary, Working Copy split, `409`/`422` handling, tokens in memory, no analytics, `requestId` on every error, rejected value never echoed. Tests only updated for selectors, never weakened or deleted.
- DECISIONS.md/QUESTIONS.md/GAPS.md: append reserved entries with `cat >>`; QUESTIONS and GAPS entries listed in section 8 are appended by the package named there.
- Report per package at `ux-audit/round-1/implementation/<package>.md` with the finding IDs closed, anything not closed and why, and the score evidence.

---

## 7. Deferred and rejected

| Item | Decision | Reason |
|---|---|---|
| Bulk selection and bulk Activate, Deactivate, Archive, Set Category (C1-16) | Deferred to Round 2 | Orchestrator ruling; needs a selection model across the scaffold and per-item error reporting; Q-016 recorded |
| Nav counts (C1-58 part) | Deferred | 18 list requests per page load without the statistics endpoint (G-023) |
| Translation bars on Dashboard, per-language progress (C1-47) | Deferred | No statistics endpoint; no fake bars |
| Latest packages (C1-48) | Deferred | No endpoint (G-024); the spec says only after the first request |
| "Edited by" / who last edited (C1-45, C1-13 part) | Deferred | `workingCopyUpdatedBy` absent (G-025); time only shown |
| DRAFT readiness from the platform (C1-31 full) | Partial | Client-known readiness only (translation completeness, placement and image known to the editor); G-027 |
| Density toggle (compact rows) | Deferred to Round 2 | Not needed to lift any Round 1 finding; tokens prepared |
| Dark mode | Rejected | No dark values, kiosk and office use scene is light; dead `darkMode` config removal in Round 3 |
| Merged single action bar | Rejected (spec) | Q-008 |
| Docked split-pane preview and tablet bottom sheet | Rejected (spec) | Q-009 |
| Ctrl+K quick switcher | Deferred | Optional addition (C1-76); the Project picker search covers the need |
| Self-hosting map tiles or a geocoder proxy | Rejected | Recorded decision D-064 and Q-003; tile-failure state added instead |
| Guide "How visitors reach it" and Category "Preview in app" (C1-105) | Not built | Needs a spec decision, Q-012 |
| Guide paragraphs as rich text with inline images (C1-106 part) | Not built | Check against D-065; Q-013 |
| Thumbnail renditions (C1-111 part, C1-125 part) | UI only | Aspect-correct and lazy-loaded thumbnails; real renditions need G-031 |
| Stale-while-revalidate list cache and virtual rows (C1-125) | Partly | Skeletons and nav render early (P1, W0); the cache and virtualization wait for Round 2 once the scaffold exists |
| `Real SR` pass, touch drag of lists and pins, dark mode, asset Replace, 3D | Carried to Round 2 | `consolidated.md` "Not verified" |

---

## 8. QUESTIONS.md and GAPS.md text (ready to paste; next ids Q-008 and G-023)

Append with `cat >> QUESTIONS.md` or `GAPS.md`. The owner package appends its own. Entries follow the file's format (`### Q-NNN — title`, Kind, Source, Proposed text or Question, Consequence).

### QUESTIONS.md

```
### Q-008 — One action bar for the editor header and the Working Copy banner

- Kind: spec-change-request
- Source: `12` §3 Resource editors: "the header carries only 'Apply changes'; 'Save draft' and 'Discard' sit in the
  Working Copy banner"; UX overhaul round 1 (C1-12, C1-22): authors lose sight of both when scrolling.
- Proposed text: "an editor has one action bar that stays visible while the form scrolls and carries Save draft,
  Discard changes and Apply changes together". Until decided, the CMS keeps the split and makes both the header and
  the banner sticky (D-074).
- Consequence: only the arrangement of three existing actions; no new behaviour.

### Q-009 — "Preview in app" as a docked pane

- Kind: spec-change-request
- Source: `12` §3: the preview "opens, below the action, a panel"; UX overhaul round 1 (C1-86).
- Proposed text: "on wide screens the panel may dock beside the form (and appear as a bottom sheet on tablets) so
  the author can type and watch". Until decided, the panel is inline below its action and pushes content (D-075).
- Consequence: shapes the editor layout in later rounds.

### Q-010 — ARCHIVED rows in the default content lists

- Kind: spec-change-request
- Source: `12` §3 Content library filters by `status` but is silent on the default; the archive confirmation says
  an archived Resource "leaves the default lists".
- Proposed text: "the default view of a content list shows DRAFT and ACTIVE Resources; ARCHIVED ones appear under an
  Archived filter". The CMS does this from Round 1 (D-076).
- Consequence: list default in all six kinds and Media.

### Q-011 — Place creation: INDOOR or OUTDOOR first

- Kind: question
- Source: `12` §3 Place: creation "asks, in order, INDOOR or OUTDOOR, top-level or sub-place with its parent, and the
  name"; the CMS dialog asks Level and the name and infers the environment from the Type.
- Question: which is canonical? Recommendation: the spec's order, because the choice decides the linked map or floor
  plan (`03` §5).
- Consequence: the Create Place dialog and the Place setup section.

### Q-012 — Common cards on Guides and Categories

- Kind: spec-change-request
- Source: `12` §3 lists "How visitors reach it" and "Preview in app" as common to every kind; D-065 removed triggers
  from the Guide editor and the Category editor has no preview.
- Proposed text: state which kinds carry a triggers card and a preview action (Guides: triggers yes or no;
  Categories: preview no).
- Consequence: Guide and Category editors.

### Q-013 — Guide paragraphs: rich text with inline images

- Kind: question
- Source: `12` §3 Guide: a paragraph block "inserts images through the Asset picker and shows them inline"; D-065
  makes images separate elements and paragraphs plain text.
- Question: is D-065 the accepted reading or should paragraphs be rich text with inline images?
- Consequence: the story editor and the `INLINE` bindings.

### Q-014 — What "ready" means on the Dashboard

- Kind: question
- Source: `12` §3 Dashboard "ready for a package"; the readiness endpoint reports `activatable` true for a Project
  with no ACTIVE content.
- Question: is "Ready" asserted only when at least one Resource is ACTIVE? Recommendation: yes. The CMS applies this
  from Round 1 using `status=ACTIVE` totals (D-077).
- Consequence: Dashboard status card; backend G-026.

### Q-015 — `OTHER` assets and upload types in the visitor-facing library

- Kind: question
- Source: UX overhaul round 1 (C1-113): an `.exe` and a `.txt` were accepted into the library.
- Question: which file types may an author upload, and is `OTHER` a permitted type? Until answered the UI lists the
  accepted formats and warns before uploading any other.
- Consequence: upload dialog; backend G-032.

### Q-016 — Bulk actions, Help destination, quick switcher

- Kind: question
- Source: UX overhaul round 1 (C1-16, C1-55, C1-76).
- Question: (1) are bulk Activate, Deactivate, Archive and Set Category wanted in lists (deferred to Round 2)?
  (2) what does "Help" in the header open (it has no destination and is removed)? (3) is a Ctrl+K Project and
  page switcher wanted?
- Consequence: lists, header.
```

### GAPS.md

```
### G-023 — Project statistics endpoint
- Found: `GET /projects/{id}/statistics` returns 404. The Dashboard counts content from list `totalElements`
  with `status` filters (two requests per kind).
- Consequence: no per-language translation bars, no navigation counts; no approximate bars are drawn.

### G-024 — Deployment Package list
- Found: no endpoint for packages with status, `stale`, `contentRevision`, `createdAt`; ICAgent ingestion status
  (Milestone 12) is also absent.
- Consequence: the Dashboard has no "latest packages" slot.

### G-025 — Last editor of a Working Copy
- Found: list rows carry `workingCopyUpdatedAt` but no `workingCopyUpdatedBy`.
- Consequence: "Waiting for you to apply" and "edited by me" show time only.

### G-026 — Readiness on a Project without ACTIVE content
- Found: readiness reports `activatable: true` for a Project with no ACTIVE Resource.
- Consequence: the CMS derives "ready" from `status=ACTIVE` totals; wanted: `activeResourceCount` or an `empty` flag.

### G-027 — Readiness for DRAFT Resources
- Found: readiness covers ACTIVE rows only; missing Place, Category, coordinates or primary image are never flagged,
  and a DRAFT has no "before you activate" list.
- Consequence: the editor shows client-known checks only; wanted: a per-Resource readiness read for DRAFT.

### G-028 — `pending=true` on assets
- Found: `GET /assets?pending=true` is ignored and returns every asset.
- Consequence: no pending count for Media.

### G-029 — `initialized` on the Project list
- Found: the picker issues one `GET /projects/{id}` per Project to learn `initialized`.
- Consequence: slow picker; the CMS fetches lazily until the list carries the flag.

### G-030 — Asset `usageCount` disagrees with references
- Found: library shows 3, the editor lists 4 (inline Guide bindings not counted).
- Consequence: the CMS shows the editor's references number.

### G-031 — Thumbnail renditions
- Found: thumbnails are presigned originals (up to 1.5 MB each).
- Consequence: heavy library grid.

### G-032 — Upload type policy
- Found: any file type is accepted (`.exe`, `.txt`); `OTHER` allowed.
- Consequence: see Q-015.

### G-033 — Event activation without dates
- Found: an Event with no occurrences activates.
- Question for the backend: are dates required?

### G-034 — Working Copy content for the Preview
- Found: list endpoints used by the Preview page may not return Working Copy rows, so "Working" content cannot show
  pending edits of ACTIVE items.
- Consequence: honest copy on the page; the editor preview shows the unsaved form.

### G-035 — Conflict bodies
- Found: a `409` may not carry the author and time of `currentVersion` nor `conflictingFields` for Apply.
- Consequence: the conflict dialogs show values only.

### G-036 — Duration and transcript status
- Found: some audio and video assets return no duration; transcript status is not in asset rows.
- Consequence: Asset editor shows what exists.
```

---

## 9. File-ownership table

Each file has one owner. "Read-only" means no package edits it. `DECISIONS.md`, `QUESTIONS.md` and `GAPS.md` are append-only for everyone, with the reserved ids above.

| File | Owner |
|---|---|
| `src/style.css`, `tailwind.config.js`, `index.html`, `public/fonts/*` | W0 |
| `src/styles/list-table.css` | W0 (CategoriesView and MediaView drop their import in P3b and P7) |
| `src/App.vue`, `src/router.ts`, `src/main.ts` | W0 |
| `src/components/ui/**` (button, chip, input, textarea, select, checkbox, switch, field, tabs, popover, dropdown-menu, tooltip, alert, skeleton, empty-state, state-card, spinner, help-hint, dialog/FormDialog) | W0 |
| `src/components/AppHeader.vue`, `WorkspaceNav.vue`, `PageFrame.vue`, `PageHead.vue`, `SectionTabs.vue`, `AppBreadcrumbs.vue`, `AppDialog.vue`, `ConfirmDialog.vue`, `AppToast.vue`, `OfflineBanner.vue`, `StatusChip.vue`, `SessionEndedDialog.vue`, `StatusChangeDialog.vue` | W0 |
| `src/components/ReorderControls.vue`, `ListFilterMenu.vue`, `FilterChoiceGroup.vue`, `SearchLanguageSelect.vue`, `FeaturedFilterChip.vue`, `CategoryFilterSelect.vue`, `TranslationDots.vue`, `TriggerChips.vue`, `src/components/list/*` | W0 |
| `src/components/editor/EditorShell.vue`, `TranslationsPanel.vue`, `EditorSectionNav.vue`, `EditorSection.vue`, `WorkingCopyBanner.vue`, `ReadinessList.vue`, `EditorStatusCard.vue`, `PreviewPanel.vue`, `ActivateDialog.vue`, `ConflictDialog.vue`, `AiMarker.vue` | W0 |
| `src/workspace/useResourceEditor.ts`, `useStatusActions.ts`, `activationHandoff.ts`, `useListQuery.ts`, `listFilters.ts`, `useReorder.ts`, `useCategoryFilter.ts`, `sections.ts`, `formFields.ts`, `translationStatus.ts`, `referenceLinks.ts` | W0 |
| `src/lib/format.ts`, `focus.ts`, `announcer.ts`, `errors.ts`, `glossary.ts`, `utils.ts` | W0 |
| `src/stores/toast.ts`, `connection.ts`, `confirm.ts`, `sessionNotice.ts` | W0 |
| `e2e/screens.spec.ts`, `e2e/zoom-and-structure.spec.ts`, `e2e/content-lists.spec.ts`, `e2e/sign-in.setup.ts`, `e2e/support/*`, `e2e/README.md` | W0 |
| `ux-audit/round-1/implementation/system.md` | W0 |
| `src/views/SignInView.vue`, `SessionErrorView.vue`, `HomeView.vue`, `CreateProjectView.vue`, `src/views/createProject/*` | P1 |
| `src/components/ProjectSwitcher.vue`, `src/views/workspace/ProjectLayout.vue` | P1 |
| `src/stores/projects.ts`, `src/workspace/currentProject.ts`, `lastProject.ts` | P1 |
| `src/platform/auth.ts`, `api.ts`, `catalogue.ts`, `templates.ts` | P1 (thin: flags, message strings only) |
| `src/views/workspace/DashboardView.vue`, `src/views/workspace/dashboard/*`, `src/platform/readiness.ts`, `src/platform/dashboardData.ts` | P2 |
| `src/views/workspace/places/PlacesView.vue`, `pois/PoisView.vue`, `routes/RoutesView.vue`, `places/CreatePlaceDialog.vue`, `pois/CreatePoiDialog.vue`, `routes/CreateRouteDialog.vue`, `places/placeTree.ts` | P3a |
| `src/views/workspace/guides/GuidesView.vue`, `events/EventsView.vue`, `categories/CategoriesView.vue`, `guides/CreateGuideDialog.vue`, `events/CreateEventDialog.vue`, `categories/CreateCategoryDialog.vue` | P3b |
| `src/views/workspace/places/PlaceEditorView.vue`, `pois/PoiEditorView.vue` | P4 |
| `src/components/editor/TriggersCard.vue`, `QrCodePreview.vue`, `BackendQrCode.vue`, `src/components/media/MediaSlots.vue` | P4 |
| `src/platform/pois.ts`, `places.ts`, `triggers.ts`, `e2e/place-editor.spec.ts`, `e2e/place-map-link.spec.ts` | P4 |
| `src/views/workspace/routes/RouteEditorView.vue`, `guides/GuideEditorView.vue`, `guides/guideElements.ts` | P5a |
| `src/components/editor/StoryEditor.vue`, `StoryEditor.ts`, `src/components/ResourcePickerDialog.vue`, `resourcePicker.ts` | P5a |
| `src/platform/routes.ts`, `guides.ts`, `e2e/guide-reference.spec.ts` | P5a |
| `src/views/workspace/events/EventEditorView.vue`, `categories/CategoryEditorView.vue`, `src/components/CategoryIcon.vue`, `src/platform/events.ts`, `categories.ts` | P5b |
| `src/views/workspace/maps/MapsView.vue`, `MapEditorView.vue`, `NewMapDialog.vue`, `FloorPlansView.vue`, `FloorPlanEditorView.vue`, `NewFloorPlanDialog.vue` | P6 |
| `src/components/map/GeoMapCanvas.vue`, `basemap.ts`, `src/components/GeoPicker.vue`, `RouteMap.vue`, `src/platform/maps.ts`, `floorPlans.ts` | P6 |
| `src/views/workspace/media/MediaView.vue`, `AssetEditorView.vue`, `src/components/media/AssetThumb.vue`, `UploadDialog.vue`, `UploadEntryRow.vue`, `UploadLimits.vue`, `AssetPickerDialog.vue` | P7 |
| `src/workspace/useAssetUpload.ts`, `src/platform/assets.ts`, `e2e/media.spec.ts` | P7 |
| `src/views/workspace/PreviewView.vue`, `src/views/AppPreviewView.vue` | P8 |
| `src/components/preview/DeviceFrame.vue`, `PreviewApp.vue`, `ResourceContent.vue`, `strings.ts`, `surfaces.ts`, `PreviewPane.vue`, `FireTrigger.vue`, `PreviewControls.vue` | P8 |
| `src/components/editor/ResourcePreview.vue`, `src/workspace/preview.ts`, `previewData.ts`, `previewModels.ts`, `projectTheme.ts`, `e2e/editor-preview.spec.ts` | P8 |
| `DECISIONS.md` D-069..D-076, D-078, D-079, D-083 | W0 (append) |
| `DECISIONS.md` D-077 | P2; D-080 P7; D-081 P6; D-082 P8; D-084 P1 (append) |
| `QUESTIONS.md` Q-008..Q-016 | W0 appends all nine in one heredoc (they are owner-level questions), GAPS.md G-023..G-036 appended by P2 in one heredoc |
| Read-only, no owner edits | `src/platform/overview.ts`, `settings.ts`, `workspace/projectSettings.ts`, `useProjectLanguages.ts`, `workspace/navigationMenu.ts`, `projectTheme` consumers outside P8, generated API client, `public/config.js`, `silent-check-sso.html`, specs folder |
| Out of scope, untouched (screenshot only) | `src/views/workspace/OverviewView.vue`, `LanguagesView.vue`, `SurfacesView.vue`, `TranslationsView.vue`, `navigation/NavigationView.vue`, `SectionView.vue`, `src/workspace/translationCatalog.ts`, `e2e/navigation-editor.spec.ts` |

Notes on shared items: `src/platform/templates.ts` keeps the Google Fonts request for Template previews (D-045) and is P1's only to avoid it being "fixed" by mistake; `TriggerChips` and `TranslationDots` are W0's even though lists use them; `MediaSlots` is P4's and P5 editors that use it (none currently, Guide images are StoryEditor elements) call it through its existing props; `placeTree.ts` is P3a's and imported read-only by P4 and P3b.

---

## 10. Orchestrator review (binding amendments, 2026-11-12)

1. **Vocabulary.** The field label stays **"Slug"** (spec `12` §3 and §4 name the field `slug`); a hint line may explain it ("Part of the item's web address"). Section 2.7's "Slug as Address" is withdrawn. "Pending changes" is fine as author-facing wording for a Working Copy (spec `12` §3 uses both); the banner's `HelpHint` explains the term "Working Copy" once. Lifecycle words stay DRAFT / ACTIVE / ARCHIVED (displayed "Draft", "Active", "Archived" in sentence case is fine; never "published").
2. **Wave 0 runs as three agents:** stage 0.1 alone first; after the orchestrator verifies it (typecheck, build, two screenshots), stages 0.2 (editor shell) and 0.3 (list scaffold) run in parallel as two agents on their disjoint files. Then Wave 1.
3. **Wave 1 batches** (at most 6 concurrent): batch A = P1, P2, P3a, P4, P6, P8; batch B = P3b, P5a, P5b, P7 as slots free.
4. **e2e specs** cannot run in this environment (they need the local Keycloak); update selectors where markup changes so they stay correct, never weaken or delete; say in your changes file that they were not run.
5. **DECISIONS.md / QUESTIONS.md / GAPS.md** are appended with a single `cat >> FILE <<'EOF'` per entry, using only the ids reserved to you. QUESTIONS (Q-008 to Q-016) and GAPS (G-023 to G-036) are appended by W0 stage 0.1 in one go from section 8.
