# Design-system proposal for the iGuide CMS (Operate mode)

Author: `design-system` audit agent, Round 1. Basis: `report.md` in this folder (inventory of `src/` and 15 live screens).
Every contrast ratio below was computed (WCAG relative luminance), not estimated. Hex values are final candidates;
the implementer may nudge a value only if the stated ratio still holds.

## 0. Direction in one paragraph

A calm, institutional tool: **white work surfaces on a cool-grey canvas, one brand purple used only for the primary action,
the current selection and focus, and a small semantic palette that is always paired with a word and an icon.**
Keep what makes it UNICHE: the logo, Montserrat, the purple `#4c1d8b`, the soft lilac selection tint, the grey canvas.
Depart from the incumbent in six places, each argued below and each needing a `DECISIONS.md` entry (BRIEF "Visual design"):

| # | Departure | Why |
|---|---|---|
| 1 | Type sizes in `rem`, floor 12 px (0.75 rem), no 9/10/11 px | 61 % of all text elements are 9-11 px and none of it scales with the browser text-size setting (report R1-ds-01/02) |
| 2 | Buttons: 8 px radius, sentence case, 13-14 px / 600; the pill and the UPPERCASE 11 px go | 221 uppercase sites, 13 tracking values, 10-11 px caps; Greek capitals lose their tonos (`ΕΛΛΗΝΙΚΑ` for `Ελληνικά`) and are harder to read; pills of three heights sit next to rectangles |
| 3 | The three-colour `brand` gradient button goes; solid purple is the only primary | One gradient CTA per list page vs solid purple in editors makes "the" primary action two different things (18 `variant="brand"` uses). The gradient survives in the logo and the sign-in view only |
| 4 | Control borders 1 px `#737b8b` (4.26:1) instead of `#e5e7eb` (1.24:1); placeholder `#5f6877` (5.63:1) | WCAG 1.4.11 / 1.4.3; earlier audit finding confirmed on 188 inputs |
| 5 | Pink hover `#f832a4` (3.51:1) replaced by deep magenta `#a3106a` (7.40:1) | contrast on hover; magenta stays as the only "highlight" |
| 6 | Self-hosted Montserrat (variable font, 400-700), no Google Fonts | BRIEF hard constraint: the CMS talks only to the authoring API and the IdP; also offline and FOUT (R1-ds-04) |

Weight 800 (565 elements) is dropped: with Montserrat's wide letterforms 700 is the heaviest step the UI needs.

## 1. Colour roles

All colours are CSS variables on `:root` in the shadcn-vue triplet format (`--name: H S% L%`, used as `hsl(var(--name))`),
so `bg-card`, `text-muted-foreground`, `border-border` etc. keep working. Hex is given for review; the implementer converts.

### 1.1 Neutral ramp (cool grey, hue 220)

| Token (CSS var) | Tailwind | Hex | Use | Contrast |
|---|---|---|---|---|
| `--canvas` (= `--background`) | `bg-background` | `#f4f5f7` | page background behind cards | text `#111827` 16.26:1 |
| `--surface` (= `--card`, `--popover`) | `bg-card` | `#ffffff` | cards, dialogs, popovers, inputs, header, sidebar | text 17.74:1 |
| `--surface-sunken` (= `--muted`) | `bg-muted` | `#e9ebef` | table header, disabled field, neutral chip, track of bars | text `#111827` 14.86:1, muted text 5.33:1 |
| `--surface-hover` | `hover:bg-surface-hover` | `#eef0f3` | row / menu hover | |
| `--line` (= `--border`) | `border-border` | `#d9dce2` | **decorative** hairlines: card edge, row dividers, header rule | 1.37:1 on white. Allowed only because every card also has a shadow-xs or a fill change; never for a control |
| `--control-border` (= `--input`) | `border-input` | `#737b8b` | border of every input, select, textarea, checkbox, radio, toggle off-state, outline button | 4.26:1 on white, 3.90:1 on canvas, 3:1 floor met |
| `--ink` (= `--foreground`) | `text-foreground` | `#111827` | titles, body, values | 17.74 / 16.26 / 14.86 |
| `--ink-2` | `text-ink-2` | `#374151` | labels, table cell secondary, nav item | 10.31 on white |
| `--ink-muted` (= `--muted-foreground`) | `text-muted-foreground` | `#566070` | helper text, metadata, slug, timestamps | 6.36 white, 5.83 canvas, 5.33 muted, 5.35 lilac |
| `--placeholder` | `placeholder:text-placeholder` | `#5f6877` | placeholder only | 5.63 white, 5.16 canvas (incumbent `#9ca3af` = 2.54) |
| `--disabled-ink` | `disabled:text-disabled` | `#8a91a0` | disabled text only (exempt from 1.4.3) | 2.90 on canvas, so **always pair with a reason in text** |

Retire: `#6b7280`, `#9ca3af`, `#d1d5db`, `#4b5563`, `#dcdde2`, `#e2e3e7`, `#e6e7eb`, `#eceef1`, `#ececef`, `#f5f5f7`, `#f9fafb`
(11 near-duplicate greys in code today) and Tailwind's `text-gray-700/500/300` and `border-gray-100/200` (230 uses). `text-gray-700` becomes
`text-ink-2`; `border-gray-100/200` becomes `border-border`.

### 1.2 Brand

| Token | Tailwind | Hex | Use | Contrast |
|---|---|---|---|---|
| `--primary` | `bg-primary` / `text-primary` | `#4c1d8b` | primary button, current nav item text, selected tab, links, focus ring | white on it 11.32; on white 11.32; on canvas 10.37; on lilac 9.53 |
| `--primary-hover` | `hover:bg-primary-hover` | `#3a1469` | primary hover/active | white on it 14.15 |
| `--primary-foreground` | | `#ffffff` | text on primary | |
| `--brand-tint` (= `--secondary`, `--accent`) | `bg-secondary` | `#efe9f8` | selected nav item, selected row, selected chip, hover of ghost/outline button | primary text 9.53 |
| `--brand-tint-strong` | | `#e6dcf5` | pressed state of tint | primary 8.58 |
| `--highlight` | `text-highlight` | `#a3106a` | link hover, nothing else | 7.40 white, 6.78 canvas, 6.23 lilac |
| gradient `#b3156f -> #7b3aa8 -> #0b6f7c` | | | logo, sign-in hero only. Not a button | |

Links: `--primary`, underlined on hover **and** underlined by default inside running text (colour is not the only cue, WCAG 1.4.1). Table title links: ink colour, underline on hover (the incumbent is already this).

### 1.3 Semantic

Each role is a trio: **ink** (text and icon), **tint** (background of chips and banners), **solid** (button fill, only for danger and success actions).
Chips and banners never rely on colour: they carry the icon and the word (`14` §4).

| Role | Ink | Tint | Ink on tint | Ink on white | Solid (white text on it) |
|---|---|---|---|---|---|
| `success` | `#0b6a5f` | `#e3f3ee` | 5.65 | 6.48 | `#0b6a5f` 6.48 |
| `warning` | `#7a4b00` | `#fdf0d5` | 6.56 | 7.41 | not used (never a button) |
| `danger` (= `--destructive`) | `#b4135a` | `#fbe6ef` | 5.55 | 6.60 | `#b4135a` 6.60 |
| `info` | `#1f4e8c` | `#e4edf8` | 7.03 | 8.31 | not used |

Incumbent equivalents collapsed here: success `#0c6d62`/`#17643f`/`#e1f3ea`, warning `#855400`/`#6b4500`/`#9a6200 @ 7-10 %`, danger `#c0185e`/`#b91c1c`/`#dc2626`/`#bf185d`/`#b4235a`, info `#2d5aa0`/`#1f4e8c`. Today `#855400` alone is hard-coded in 49 places (32 `text-[#855400]`).

### 1.4 Status roles (domain)

One mapping, one component. Status is a *domain* state, not a severity, so DRAFT, ARCHIVED and "pending changes" do **not** reuse the warning/danger colours.

| Status | Icon (lucide) | Label | Ink / tint | Notes |
|---|---|---|---|---|
| `ACTIVE` | `circle-check` | "Active" | success ink / success tint | |
| `DRAFT` | `circle-dashed` | "Draft" | `--ink-2` `#374151` / `--surface-sunken` `#e9ebef` (8.64) | dashed icon, neutral |
| `ARCHIVED` | `archive` | "Archived" | `#4b5563` / transparent with 1 px `--control-border`, no fill (6.33 on white) | outline chip: visibly different from DRAFT without colour. Today both are the same grey and differ by a 10 px glyph |
| `PENDING` (Working Copy exists) | `pencil` | "Pending changes" | primary ink `#4c1d8b` / brand tint `#efe9f8` (9.53) | violet, not amber: amber is reserved for warnings/readiness, so "pending" stops looking like a problem |
| `TRANSLATION` complete / partial / missing | `check` / `contrast` / `circle` | "en complete" etc. | success / warning / ink-muted ink, no tint | dots stay text+icon; sized 14 px icons, 12 px text |
| `READY` / `LIVE` / `SUCCESS` | `circle-check` | | = success | |
| `SUSPENDED` | `pause` | | = warning | |
| `FAILED` / `DENIED` | `circle-alert` | | = danger | |
| Trigger chips (QR, Geo, Beacon) | `qr-code`, `map-pin`, `bluetooth` | | all neutral ink on `--surface-sunken`; draft triggers use the DRAFT outline treatment, **not `opacity-60`** (which gives 2.7-3.1:1 today) | the colour per trigger type carried no meaning |
| `WARNING` / `BLOCKING` (readiness) | `triangle-alert` / `octagon-x` | | warning / danger | |

### 1.5 Focus

| Token | Value | Rule |
|---|---|---|
| `--ring` | `#4c1d8b` | 2 px solid ring, **offset 2 px**, plus a 2 px white halo (`box-shadow: 0 0 0 2px #fff`) so it reads on tinted and purple surfaces; 11.32 on white, 10.37 on canvas, 9.53 on lilac |
| ring on purple fills | `#ffffff` ring + purple halo | for `bg-primary` buttons and the avatar |
| inputs | the ring replaces the border colour change; the border also goes to `--primary` | a colour-only focus cue (today) is weak and invisible in forced colours |
| forced colours | `outline-color: Highlight`; never `outline: none` or `transparent` unless a `forced-colors` rule restores it | |

## 2. Type scale (rem, Montserrat only)

Root stays `16px`; `html { font-size: 100% }`, **no** px font sizes in components. Ratio about 1.125-1.2 as Operate wants. Seven steps replace 19 computed sizes (9, 10, 11, 11.2, 12, 12.8, 13, 13.6, 14, 14.4, 15, 16, 18, 22, 24, 26, 30.4...).

| Token | Tailwind class | rem / px | Line-height | Weight | Tracking | Use (replaces) |
|---|---|---|---|---|---|---|
| caption | `text-xs` | 0.75 / 12 | 1.4 | 500; 600 in chips | 0.01em | chips, counts, helper text, table header, timestamps (every 9, 10, 11 and 12 px today) |
| compact | `text-compact` (custom) | 0.8125 / 13 | 1.45 | 400 / 500 | 0 | dense table cells, nav items, secondary values (today `text-[13px]` x 258) |
| body | `text-sm` | 0.875 / 14 | 1.5 | 400; 600 for labels and buttons | 0 | default body, inputs, buttons, field labels, dialog text |
| title-sm | `text-lg` | 1.0625 / 17 | 1.35 | 700 | -0.005em | card and dialog titles (today `text-[17px] font-extrabold`) |
| title | `text-xl` | 1.375 / 22 | 1.25 | 700 | -0.01em | page title (`PageHead` h1) |
| display | `text-2xl` | 1.75 / 28 | 1.2 | 700 | -0.015em | sign-in and empty-Project first-run only |

Body is 0.875 rem (14 px). Six steps (12, 13, 14, 17, 22, 28) plus mono replace 19 computed sizes (9, 10, 11, 11.2, 12, 12.8, 13, 13.6, 14, 14.4, 15, 16, 18, 22, 24, 26, 30.4 ...).

- Wrap: `tailwind.config.js` `theme.extend.fontSize` overrides `xs/sm/base/lg/xl/2xl` with the table (tuples with line-height). Remove `text-[Npx]`; add an ESLint/`grep` gate in the Round-1 checklist: zero `text-\[[0-9.]+px\]`.
- Weights: 400 body, 500 nav and metadata, 600 labels / buttons / titles in tables, 700 headings. Four weights, 800 removed. Load `Montserrat` variable `wght 400..700` as a self-hosted `woff2` (latin + greek + latin-ext subsets, about 60 KB), `font-display: swap`, `size-adjust` fallback to `system-ui` so the swap does not shift layout. Greek is first-class: Montserrat includes it; test `ά ή ΐ` metrics.
- Case: sentence case everywhere. UPPERCASE only for the 3-letter lifecycle abbreviations inside chips if desired; no tracked caps labels ("SEARCH", "TITLE", "ACTIONS", "CONTENT"). Section labels in the nav become 12 px / 600 / ink-muted, not caps. This removes 221 `uppercase` sites and 13 tracking values; tracking is `0` except headings (`-0.01em`).
- Mono: `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` at `0.8125rem` for slugs and codes only (today also 8 px mono in places).
- Measure: prose blocks (descriptions, story paragraphs) cap at `max-w-[68ch]`; tables and forms are not capped.
- Numerals: `font-variant-numeric: tabular-nums` on counts, versions, coordinates and dates in tables.

## 3. Spacing, sizing, density

4 px base. Scale: **4, 8, 12, 16, 24, 32, 48** (Tailwind `1, 2, 3, 4, 6, 8, 12`). Half-steps `0.5` (2 px) allowed inside chips only. Retire the arbitrary `18px` (107 `px-[18px]`, 13 `py-[18px]`, 10 `mb-[18px]`, 7 `gap-[18px]`), `13px`, `7px`, `9px`, `11px`, `26px`, `22px` values (about 330 uses) by snapping to 16 or 24 and 8 or 12.

| Token | px | Use |
|---|---|---|
| `--space-1` | 4 | icon to label, chip inner |
| `--space-2` | 8 | between related controls, table cell vertical in compact |
| `--space-3` | 12 | field to its hint, card padding compact, table cell vertical in comfortable |
| `--space-4` | 16 | card padding, page gutter below 1024, gap between fields |
| `--space-6` | 24 | between cards, page gutter at 1024+ , dialog padding |
| `--space-8` | 32 | between page sections, page head bottom |
| `--space-12` | 48 | empty-state vertical padding |

Control heights (min hit area), both densities meet the AA 24 px minimum; touch primary is 44:

| Control | Comfortable (default; touch, tablets) | Compact (opt-in per list, desktop) |
|---|---|---|
| Button / input / select / chip-filter | **40** px | 32 px (never smaller) |
| Icon button | 40 x 40 | 32 x 32 (icon 16) |
| Table row | min 56 (two-line title) | min 44 |
| Nav item | 36 px | 32 px |
| Text-link in a row (today 16 px tall, 930 under-24 px targets on the 15 screens) | becomes a 32 px-tall ghost button or gets `py-1.5 -my-1.5` hit slop | |

Density rule: Operate screens ship **Comfortable** by default for < 1280 or touch (`pointer: coarse`); **Compact** is a per-user toggle (stored in browser storage) for editors who maintain 40+ rows. Density changes row height, padding and control height only, never type size.

Layout widths: page content max `1280 px` for lists and dashboards, forms `max-w-[44rem]`, dialogs `28rem / 36rem / 52rem / 64rem` (sm / md / lg / xl; the five ad-hoc dialog widths 460, 560, 640, 820, 960 snap to these). Header 56 px (not 60 + wrap), sidebar 232 px.

## 4. Radii, borders, elevation, z-index

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--radius-sm` | 4 px | `rounded-sm` | checkbox, inline code, small tags |
| `--radius` (md) | **8 px** | `rounded-md` | buttons, inputs, selects, popovers, menu items, small cards |
| `--radius-lg` | 12 px | `rounded-lg` | cards, dialogs, table container |
| `--radius-full` | 9999 | `rounded-full` | chips, avatar, toggle, count badge, step number |

Replaces 15 computed radii (4, 6, 6.72, 7, 8, 9, 9.6, 10, 12, 50 %, 999, 9999...) and `rounded-[10px]` x 23, `rounded-xl` x 3. shadcn's `--radius: 0.5rem` stays; `lg = var(--radius)+4px` changes in `tailwind.config.js` (`lg: calc(var(--radius)+0.25rem)`, `md: var(--radius)`, `sm: calc(var(--radius)-0.25rem)`).

Borders: 1 px everywhere (retire `border-[1.5px]` x 43, which also renders as 1 px at 1x and 2 px at 2x). Table dividers `--line`. Selected row: tint fill plus 2 px inset primary on the first cell (never a coloured side stripe on cards or toasts; the `border-l-4` toast and the 4 px readiness-card stripe go).

Elevation (3 levels, all offset + blur, neutral-blue-black at low alpha; replaces 21 ad-hoc strings):

| Token | Value | Use |
|---|---|---|
| `--shadow-0` | none | flat: table rows, inputs, chips |
| `--shadow-1` | `0 1px 2px rgb(17 24 39 / .06), 0 1px 3px rgb(17 24 39 / .08)` | cards on canvas (card edge `--line` is only 1.26:1 on canvas, the shadow carries the edge) |
| `--shadow-2` | `0 4px 12px rgb(17 24 39 / .10), 0 2px 4px rgb(17 24 39 / .06)` | popovers, menus, toasts |
| `--shadow-3` | `0 16px 40px rgb(17 24 39 / .18)` | dialogs |
| scrim | `rgb(17 24 39 / .45)` | modal backdrop |

Z-index layers (named, one place, `tailwind.config.js` `zIndex`): `base 0`, `sticky 10` (page head, table header, editor action bar), `popover 40` (project switcher, filter menu, combobox), `modal 50` (dialog + scrim), `toast 60` (above modals: errors must be seen), `skip 70` (skip link). The map libraries keep their internal 100-1200 inside an `isolation: isolate` wrapper so they cannot reach `popover`. Nested confirm over dialog: portal order plus `modal 50` and `modal+1` explicit (today both `z-50`, ordering by DOM luck). Replaces 50/60/80/90/10/1/0 magic numbers.

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120 ms | hover, focus, press colour changes |
| `--dur-base` | 180 ms | popover, menu, chip toggle, accordion |
| `--dur-slow` | 240 ms | dialog enter, toast enter |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | all entrances (already used by the popover) |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | colour and size |

Rules: transitions only on `color, background-color, border-color, box-shadow, opacity, transform`; never `transition-all` (3 today). No page-load choreography. **Reduced motion**: `@media (prefers-reduced-motion: reduce)` removes transforms and slides but keeps a 0 ms **state change**: skeleton shimmer becomes a static `--surface-sunken` block (no pulse), dialogs and toasts appear without slide (opacity step only), drag-reorder drop still shows its insertion line. Today only the popover entrance honours it; `skelpulse` (22 uses) and 42 `transition` classes do not.

## 6. Icons

One set: **lucide-vue-next** (already a dependency, used in about 8 files) at `1.5` stroke, sizes **16** (inline, in buttons and chips), **20** (nav, header, icon buttons), **24** (empty states). `aria-hidden` unless it is the only content (then `aria-label`). Replace the unicode stand-ins: `⚠` x 96, `+` x 195 (as "add" icon), `✓ ✕ × ▲ ▼ ↑ ↓ ← → ⠿ ✎ ○ ▪` (about 60), the `└ ↳` tree connectors, and the status glyph function `statusGlyph()` (`src/lib/format.ts:23`). Icons mapped: warning `triangle-alert`, add `plus`, drag `grip-vertical`, move `chevron-up/down`, close `x`, dismiss toast `x`, done `check`, edit `pencil`. Icon colour = text colour; decorative drag handle `--ink-muted` (5.8:1), not `#9ca3af` (2.54).

## 7. Component inventory

Keep / merge / drop. "Today" cites the audit counts.

### Buttons

Single `Button` (`src/components/ui/button`) and **nothing hand-rolled**. 216 raw `<button>` and 66 hand-rolled pill classes migrate, and `.dialog-primary` / `.dialog-secondary` (29 uses in `style.css`) are deleted.

| Variant | Spec | Today | Verdict |
|---|---|---|---|
| `primary` | `bg-primary` white text, hover `--primary-hover`, 40 h, 8 px radius, 14/600 | `default` + `brand` + `.dialog-primary` | **merge three into one**; drop the gradient |
| `secondary` | white fill, 1 px `--control-border`, ink text | `outline` + `.dialog-secondary` (grey fill) | **merge**; the grey-filled "Cancel/Deactivate" and the outlined "Archive" become the same style |
| `ghost` | no fill, ink-2 text, hover `--surface-hover`; for toolbar and row actions | `ghost`, raw 10 px text buttons | keep; replaces 10 px caps text-buttons (135 + 89 under 24 px tall) |
| `danger` | `bg-destructive` white text; outline-danger variant `danger-outline` (border + ink `#b4135a`) for "Archive" in a row | `destructive` (6 uses), `text-destructive` text buttons (13) | keep both; **always** behind a confirm dialog |
| `link` | inline in running text only | `link` | keep, rarely used |
| `icon` | 40 / 32 square, ghost look, needs `aria-label` | `icon` (h-9) | keep |

Sizes: `md` (40, default) and `sm` (32, compact density only). Drop `lg`. States all present: hover, focus-visible ring, active (darker), disabled (`opacity-100`, `--surface-sunken` fill, `--disabled-ink` text **and** a visible reason via `aria-describedby`/tooltip on the Apply/Activate buttons), loading (spinner left of label, width fixed, `aria-busy`). One primary per view region; in the editor action bar the order is `Discard` (ghost) `Save draft` (secondary) `Apply changes` (primary).

### Chips and badges

| Component | Verdict |
|---|---|
| `StatusChip` (26 uses) | **Keep, rewrite** on the 1.4 table: 12 px / 600 / sentence case, 16 px lucide icon, `rounded-full`, 24 px tall; two sizes `row`/`page` collapse into one (page title uses 28 px tall variant `lg`) |
| `TriggerChips`, `TRIGGER_CHIP_CLASS` | **Merge into `Chip` neutral** + icon per type (lucide `qr-code`, `map-pin`, `bluetooth`) |
| `TranslationDots` | keep; icons `check` / `contrast` / `circle`, 12 px text |
| 10 hand-rolled `rounded-full text-[9px] uppercase` spans (kind chip SITE/ROOM, `.off-pill`, count "103") | **merge into `Chip`** (`neutral`, `count`) |
| `FeaturedFilterChip`, `FilterChoiceGroup` chips | keep as **toggle chip** (outline, selected = brand tint + check icon), 32 px h |
| `add-chip` (`TriggersCard.vue:351`) | becomes `Button secondary sm` with `plus` icon |

### Form controls

- One `field` kit: `FormField` (label above, 14/600 sentence case, optional "(optional)" text instead of asterisks for required-only fields, hint 12/400 `--ink-muted`, error 13/400 `--destructive` with `circle-alert` icon, `aria-describedby`, `aria-invalid`), `TextInput`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Radio card` (the Top-level / Sub-place cards). Replaces `.field-input` (122 uses) and its **four local copies** (`CreateEventDialog.vue:132`, `CreateGuideDialog`, `CreatePlaceDialog`, `CreatePoiDialog`) and the 16 inline `border-[1.5px] ... focus:outline-none` inputs.
- Spec: 40 px (32 compact), 1 px `--control-border`, 8 px radius, white fill, 14 px text, padding 0 12; hover border `--ink-muted`; focus ring 1.5 above; invalid border `--destructive` + icon + text; disabled `--surface-sunken` + `--disabled-ink`; read-only: no border, `--surface-sunken`.
- Native `<select>` and checkbox stay native-looking (consistent with the OS, accessible) but get `accent-color: #4c1d8b` and the 40 px height; do not hand-draw custom selects.
- `.field-label` (12 px caps) and `.small-label` (10 px caps 800, 52 uses) go; labels are 14/600 sentence case, group headings 12/600 `--ink-muted`.

### Dialogs, popovers, menus

| Pattern | Today | Verdict |
|---|---|---|
| `AppDialog` modal (17 users) | 5 ad-hoc widths, `rounded-xl`, own shadow, title 17 px extrabold | **Keep** (focus trap and return are good); widths to `sm/md/lg/xl`; header row with title + close icon button; footer actions right-aligned `secondary` then `primary`; scrim token |
| `ConfirmDialog` | uses `.dialog-*`; `bg-destructive` on primary class | keep; danger variant uses `Button danger`; body states the consequence and where-used count |
| `StatusChangeDialog` | own layout | align to `AppDialog` |
| `AppDialog popover` ("Preview in app", custom positioning code) | hand-rolled | **drop** custom positioning, use Radix `Popover` like `ListFilterMenu` (Radix already a dependency) |
| `ListFilterMenu` (Radix Popover, modal) | z-50, 340 px | keep; z `popover`, `--shadow-2` |
| `ProjectSwitcher` | z-80 | keep; z `popover` |
| Toast `AppToast` | left stripe, one at a time, hard-coded hex, `✕` glyph, white bg | **rewrite**: neutral white card `--shadow-2`, 20 px lucide status icon (check / triangle-alert / circle-alert / info) in the role ink, role-coloured **title text**, dismiss icon button, queue (stack of up to 3), `role="status"` for success/info and `role="alert"` for errors, stays until dismissed when it carries an error or a `requestId`, 5 s otherwise; bottom-right at 24 px; no side stripe |
| Banners (`OfflineBanner`, working-copy banner, readiness card) | each own layout and a 4 px left stripe | **one `Alert`** (tint background, 1 px border in role ink at 30 %, 20 px icon, title + body + actions); no side stripe |

### Tables and lists

- One `DataTable` pattern in CSS: replace `list-table.css` (`.th`, `.td` with hard-coded hex) and the **two local duplicates** (`EventsView.vue:386`, `EventEditorView.vue:591`) and the 43 `class="th"` / 43 `class="td"` by tokenized classes. Header: 12/600 sentence case, `--ink-muted`, `--surface-sunken` fill, no caps, sticky. Row: `--line` divider, hover `--surface-hover`, min 56 / 44. Cell text 13-14. Actions column right-aligned: one primary row action as `secondary sm`, the rest in a `...` menu (today: Deactivate + Archive as two differently styled buttons in every row).
- Reorder handle: `grip-vertical` 20 px `--ink-muted`, Move up / down as `chevron` icon buttons 32 px, disabled shown at `--disabled-ink` with `aria-disabled` and still in the DOM. Today ▲▼ disabled colour is 1.38:1 and 24 x 24.
- Tree indentation: 24 px per level and a 1 px `--line` guide line; no `└ ↳` glyphs.

### Feedback and states

- **Skeleton**: one `Skeleton` block (`--surface-sunken`, radius 4, static under reduced motion, pulse 1.4 s 1 -> .6 otherwise). Keep skeletons shaped like the final layout (the existing ones are good).
- **Empty state** (5 dashed boxes today, varying): `EmptyState` = 24 px icon, title 17/700, one sentence, one primary action, optional secondary link; filtered-empty shows "Clear filters".
- **Error state**: `Alert danger` with `requestId` in mono and `Try again` (matches today's card; drop the left stripe).
- **Progress / busy**: inline spinner 16 px in buttons; live region for uploads (existing).

### Page chrome

`PageHead` (title 22/700, subtitle 14/400 muted, actions right), `SectionTabs` (same `Tabs` component as editors' language tabs and `ResourcePreview` tabs: today 3 different tab implementations and 5 `border-b-2` variants; use Radix `Tabs`, underline 2 px primary, 14/600 sentence case), `WorkspaceNav` (item 36 px, selected = brand tint + 3 px primary inset-left + 600 weight + `aria-current`; groups as 12/600 muted labels; `off` chip -> `Chip neutral` "Off"), `AppHeader` (56 px).

## 8. How it maps to Tailwind and shadcn-vue

- **CSS variables** (`src/style.css :root`): keep every existing shadcn name (`--background --foreground --card --popover --primary --secondary --muted --accent --destructive --border --input --ring --radius`) and **change their values** (so every `bg-card`, `text-muted-foreground`, `border-input` in the 700+ token-class uses switches over with no markup change). Add the new names: `--surface-sunken`(= `--muted`), `--ink-2`, `--placeholder`, `--disabled-ink`, `--primary-hover`, `--highlight` (value changes), `--success`, `--success-tint`, `--warning`, `--warning-tint`, `--danger`(= `--destructive`), `--danger-tint`, `--info`, `--info-tint`, `--line`, `--control-border`, shadows `--shadow-1..3`, durations `--dur-*`, easings.
- **Tailwind** (`tailwind.config.js`): map the new vars into `theme.extend.colors` (`success`, `warning`, `info`, each `{ DEFAULT, tint }`; `ink2`; `placeholder`), `fontSize` (table 2), `spacing` untouched (4-px scale already default), `borderRadius` (table 4), `boxShadow` (`1,2,3`), `zIndex` (named layers), `transitionDuration`, `transitionTimingFunction`, `fontFamily.sans = ["Montserrat Variable", "Montserrat", "system-ui", "sans-serif"]`. Switch `border-border` default and `* { @apply border-border }` unchanged.
- **shadcn-vue**: keep `components.json` (`baseColor: slate` only affects generation). The `ui/button` cva is the only shadcn component today; add `ui/chip`, `ui/alert`, `ui/field` (input, select, textarea, label), `ui/tabs`, `ui/skeleton`, `ui/empty-state`, `ui/toast`, `ui/data-table` classes in the same cva + `cn()` convention. Radix-vue stays as the primitive layer (no new dependency).
- **Dark mode**: `darkMode: ["class"]` is configured but no `dark:` class exists (0) and no dark values. Out of scope for Operate on kiosks and offices; **do not ship dark mode in this overhaul**; keep the variable structure so a dark set can be added; remove the dead config in a later round.
- **Forced colours**: add a small `@media (forced-colors: active)` block: `.btn-primary, .btn-danger { border: 1px solid ButtonText; }`, chips `border: 1px solid CanvasText`, selected nav item `outline: 2px solid Highlight`, `a.nav-item[aria-current]` `forced-color-adjust: none` is **not** used; icons use `currentColor`. Today `bg-primary` buttons render as bare text with no boundary (R1-ds-03).
- **Guard rails** (cheap, mechanical, add to the implementation checklist): no `text-[Npx]`, no `#hex` outside `style.css` and the preview stand-in, no `rounded-[`, no `shadow-[`, no `z-[`, no `tracking-[`, no `uppercase` outside chips; the `impeccable detect` run must stay at zero findings (one today, `AppToast.vue:14` `border-l-4`).

## 9. Migration order (smallest blast radius first)

1. Variables and Tailwind config values (colours, radius, shadows, z, font sizes) - restyles the whole app at once; fix the three P1 token issues (control border, placeholder, muted).
2. Font self-hosting (`index.html`, `src/style.css @font-face`, `public/fonts/`) and the `rem` type scale; remove `text-[Npx]` (about 760 sites; mechanical codemod: 9/10/11 -> `text-xs`, 12 -> `text-xs`, 13 -> `text-compact`, 14 -> `text-sm`, 15 -> `text-sm`, 17 -> `text-lg`).
3. `Button` consolidation (delete `.dialog-*`, brand gradient), `Chip`/`StatusChip`, `Alert`/`Toast`.
4. Form kit, `DataTable` classes (delete local `.th/.td/.field-input` copies).
5. Icons: replace glyphs; add `forced-colors` and `reduced-motion` blocks.
6. Density toggle.

Round-1 acceptance for the system: zero contrast failures in the computed-style probe (`design-system/inv.mjs`), all text >= 12 px and in `rem`, root-font 200 % screenshot scales every text, forced-colours screenshot shows every button with a boundary, detector clean.
