---
name: iGuide CMS
description: The authoring tool for heritage visitor guides. Calm, light, institutional-but-friendly; one purple that means action, status told by an icon and a word.
colors:
  canvas: "#f4f5f7"
  surface: "#ffffff"
  sunken: "#e9ebef"
  surface-hover: "#eef0f3"
  surface-active: "#dde1e6"
  hairline: "#d9dce2"
  control-border: "#737b8b"
  ink: "#111827"
  ink-2: "#374151"
  ink-muted: "#566070"
  placeholder: "#5f6877"
  disabled-ink: "#8a91a0"
  primary: "#4c1d8b"
  primary-hover: "#3a1469"
  primary-active: "#2d0f52"
  on-primary: "#ffffff"
  brand-tint: "#efe9f8"
  brand-tint-strong: "#e6dcf5"
  link-hover: "#a3106a"
  ring: "#4c1d8b"
  ring-inverse: "#efe9f8"
  success: "#0b6a5f"
  success-tint: "#e3f3ee"
  warning: "#7a4b00"
  warning-tint: "#fdf0d5"
  danger: "#b4135a"
  danger-tint: "#fbe6ef"
  danger-active: "#810e41"
  info: "#1f4e8c"
  info-tint: "#e4edf8"
typography:
  page-title:
    fontFamily: "Montserrat Variable, Montserrat, Montserrat Fallback, system-ui, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  state-title:
    fontFamily: "Montserrat Variable, Montserrat, Montserrat Fallback, system-ui, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Montserrat Variable, Montserrat, Montserrat Fallback, system-ui, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Montserrat Variable, Montserrat, Montserrat Fallback, system-ui, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  compact:
    fontFamily: "Montserrat Variable, Montserrat, Montserrat Fallback, system-ui, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Montserrat Variable, Montserrat, Montserrat Fallback, system-ui, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  unit: "4px"
  half-step-2: "2px"
  half-step-6: "6px"
  half-step-10: "10px"
  half-step-14: "14px"
  control-h: "40px"
  control-h-coarse: "44px"
  control-h-sm: "32px"
  row-h: "52px"
  row-h-coarse: "56px"
  header-h: "56px"
  nav-w: "232px"
  gutter: "16px"
  gutter-wide: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  chip-neutral:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-brand:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-success:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-warning:
    backgroundColor: "{colors.warning-tint}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-danger:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  chip-info:
    backgroundColor: "{colors.info-tint}"
    textColor: "{colors.info}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
---

# Design System: iGuide CMS

This file describes the system as shipped at the end of Round 3 (D-115). Where it and the code disagree, the code is right and this file is stale. `PRODUCT.md` is the product source (users, purpose, principles, WCAG 2.1 AA as a gate); this file is only visual and does not repeat it. Token values live in `src/style.css` (colours, shadows, motion, density) and `tailwind.config.js` (type, screens, radii, z layers). Names below are Tailwind names unless they start with `--`.

## Overview

**Creative North Star: "The Quiet Workshop"** (assumed wording; the owner may rename it)

A tool for people who maintain heritage guides every day, often on a tablet on site. It is light only: a cool grey canvas, white surfaces, one purple (UNICHE) that means action, the current item, links and the focus ring. Calm precision over decoration: the content and the visitor result lead, the chrome recedes. Anti-references: generic SaaS dashboards and a developer-console feel (from `PRODUCT.md`).

Density is comfortable: rows are 52 px, controls 40 px (44 px on a coarse pointer), the header 56 px. Structure comes from hairlines and white-on-grey surfaces, not shadow. State is a word plus an icon before it is a colour.

**Key Characteristics:**
- Light, cool neutrals; one purple accent; status inks on pale tints.
- Hairline for structure (`--border`), a stronger control border (`--input`, 3:1 or better) for every control edge.
- 4 px base spacing with half steps; one line-height per type size.
- Montserrat, with Manrope for Greek, no uppercase and no tracking in chrome.
- Three cool shadow steps; flat at rest.
- One focus ring everywhere; a rest, hover, pressed ladder.
- Forced colours keep a boundary on every control and floating surface.

Round-3 rules that bind new work: (1) one primitive per job, never a local copy; (2) tokens only, the literal gate is a release check; (3) one sentence per failure with one request-id row; (4) every removed thing has a focus successor; (5) every control is reachable at 44 px on touch and at 200 % zoom; (6) a blocked control says why and stays focusable.

## Colors

Light only (there is no `dark:` variant; `darkMode` was removed in D-116). Colours are `H S% L%` triplets in `src/style.css`, so alpha works (`bg-primary/90`). Hex below is for review.

### Primary
- **UNICHE Purple** (#4c1d8b, `--primary`): the primary button, the current nav item, links, focus ring, checked controls. 11.32:1 on white, 10.37:1 on the canvas.
- **Pressed/hover purple** (#3a1469 `--primary-hover`, #2d0f52 `--primary-active`): the state ladder of the primary button. White text on them is 14.15:1 and 16.13:1.
- **Link hover magenta** (#a3106a, `--highlight`): link hover only, 7.40:1 on white.

### Secondary
- **Brand tint** (#efe9f8, `--accent`; strong #e6dcf5, `--accent-strong`): selected nav item, toggled chip, `brand` chip, highlighted menu item (strong plus a ring outline). `--secondary` is an identical alias (see Known deviations).

### Tertiary (status inks on tints, always with an icon and a word)
- **Success teal** #0b6a5f on #e3f3ee (5.65:1).
- **Warning ochre** #7a4b00 on #fdf0d5 (6.56:1).
- **Danger berry** #b4135a on #fbe6ef (5.55:1); solid danger fill carries white text at 6.60:1 (pressed #810e41 at 10.13:1).
- **Info slate blue** #1f4e8c on #e4edf8 (7.03:1).

### Neutral
- **Canvas** (#f4f5f7, `--background`) is the page; **Surface** (#ffffff, `--card`, `--popover`) is cards, dialogs, inputs, header, nav; **Sunken** (#e9ebef, `--muted`, class `sunken`) is table head, disabled field, neutral chip, bar track.
- **Hover** (#eef0f3, `--surface-hover`) and **Pressed** (#dde1e6, `--surface-active`, one grey step under hover): rows, ghost and secondary buttons, tabs, nav items, menus.
- **Hairline** (#d9dce2, `--border`): card edges and row dividers only, 1.37:1 on white. Never a control edge.
- **Control border** (#737b8b, `--input`): 4.26:1 on white, 3.90:1 on the canvas.
- **Ink** (#111827, `--foreground`) 17.74:1 on white and 16.26:1 on the canvas; **Ink-2** (#374151) 10.31:1; **Muted** (#566070, `--muted-foreground`) 6.36:1 on white, 5.83:1 on the canvas, 5.33:1 on sunken; **Placeholder** (#5f6877) 5.63:1, never the only label; **Disabled ink** (#8a91a0) 3.16:1 on white, disabled text only (exempt under WCAG 1.4.3), always beside a stated reason.
- **Scrim** (`--scrim`): ink at 45 % behind dialogs and the drawer.
- **Ring** (#4c1d8b) 10.37:1 on the canvas, 11.32:1 on white; **Ring inverse** (#efe9f8, `--ring-inverse`) 14.94:1 on ink, used only inside the dark preview stand-in (`.on-dark`).

### Named Rules
**The One Voice Rule.** Purple is the action, the current item, links and focus. One primary button per region; nothing else is purple-filled.
**The Hairline Is Not an Edge Rule.** `--border` is decoration. A control's edge is `--input`.
**The Words Before Colour Rule.** A status is an icon plus a word; colour is the third cue (`14` §4).

## Typography

**Font:** Montserrat Variable (self-hosted, weights 400 to 700, D-071), fallback "Montserrat Fallback" (Arial metrics, `size-adjust` 113.5 %), system-ui. **Greek:** Montserrat has no Greek glyphs, so Manrope (Greek subset, self-hosted, D-085) is declared under the same family name and Greek text uses it. Polytonic Greek (U+1F00-1FFF) falls to the system sans. **Mono:** the `ui-monospace` stack at 13 px (`code`, `kbd`, `samp`, `.mono`), only for slugs, codes and request ids.

**Character:** Even, humane, geometric. Fixed rem sizes, no fluid type, 12 px floor. Weights 400 body, 500 nav and metadata, 600 labels and buttons, 700 headings.

### Hierarchy (one line-height per size, from `tailwind.config.js`)
| Token | Size | Line-height | Use |
|---|---|---|---|
| `text-xs` | 12 px | 1.4 | chips, hints, field errors, column heads, meta |
| `text-compact` | 13 px | 1.45 | nav items, table cells, list footer, mono |
| `text-sm` | 14 px (body) | 1.5 | controls, body, labels (600), side-card h2 (700) |
| `text-base` | 16 px | 1.4 | dialog and empty-state titles (700) |
| `text-lg` | 20 px | 1.3, -0.01em | page title `h1` (700) |
| `text-xl` | 24 px | 1.25, -0.01em | state and sign-in titles (700) |

Counts, dates and sizes use `tabular-nums` (or `.tabular`). Headings use `text-wrap: balance`. Long running text is capped at `max-w-prose` (68ch). Greek and other long text wraps anywhere inside its cell (`overflow-wrap:anywhere` on titles, `<bdi>` around titles in rows).

### Named Rules
**The One Height Rule.** The size token sets the line-height. Do not add `leading-*` in chrome (the five drifts are listed under Known deviations).
**The Quiet Case Rule.** No uppercase, no tracking, no eyebrow labels in chrome. The preview stand-in may use them because it imitates the visitor app.

## Layout

**Spacing.** A 4 px base (Tailwind's scale) with half steps at 2, 6, 10 and 14 px (`0.5`, `1.5`, `2.5`, `3.5`; `gap-1.5` is the most used). Vertical rhythm: 8 inside a group, 16 between groups, 24 between regions (`gap-4`, `gap-6`, `mb-6` page head).

**Density tokens.** `--control-h` 40 px (`h-control`, `min-h-control`, `size-control`), `--row-h` 52 px (`min-h-row`), `--header-h` 56 px (`h-header`), `--nav-w` 232 px (`w-nav`). Under `pointer: coarse` the control becomes 44 px and the row 56 px. Compact controls (`Button size="sm"`, `Select size="sm"`, `FilterChip`, translation dots) are 32 px and 44 px on a coarse pointer. `--gutter` is 16 px, 24 px from 1100 px.

**Breakpoints** (`screen`): `sm` 640, `md` 768, `lg` 1024, `nav` 1100 (workspace menu becomes a column; below it a drawer), `edit` 1180 (editor side column), `xl` 1280, `2xl` 1536. `max-nav:` means below 1100.

**Page frame.** `AppHeader` (56 px, `z-sticky`) over a row of `WorkspaceNav` (232 px from `nav`) and one `<main id="main">` per page, drawn by `PageFrame` (`pt-6`, gutter, `pb-24` so toasts never cover the last row; `narrow` caps at `max-w-3xl`). The shell is `.app-shell` (100dvh, only `<main>` scrolls, but a viewport under 300 px high scrolls as one document). `PageHead` is `h1` 20/700, status chips on the same line, a muted subtitle capped at 68ch, actions on the right (they wrap below on a narrow page), `mb-6`.

**List page.** `PageHead`, optional `ListSourceNotice`, `ListToolbar` (one row, sticky from 900 px wide, `shadow-2` only while stuck: labelled search, status segments from 1180 px, a "Filters N" button that opens the named popover "Filters and sort" with Done), then a card holding `ListTable`, then `ListFooter`. Table vs card switch: below 900 px wide, or whenever the Title column would be under 15 rem (`MIN_TITLE` 240 px, measured, with the width it needs as hysteresis), the rows are two-line cards; otherwise a real `<table>` with a 48 px sticky head (under the toolbar), 52 px rows, Order column 48 px, tree step 24 px. Each list's Title is `ListRowTitle`. Trigger chips sit on their own line, at most two plus "+N".

**Editor shell.** `EditorShell`: breadcrumb; a sticky one-line header (min 48 px, `z-sticky`; title, status chip, readiness, one primary) that sticks from 700 px of viewport height (D-108); the Working Copy banner (one line, 40 px) that sticks only from 960 px height and holds Save draft and Discard, so the header carries Apply only (D-108); the error summary floats only from 900 px height, below that it is in the flow (D-108). The measured height of what is stuck is published as `--sticky-stack-h` on `<html>` and drives `scroll-padding-top` of `<main>`, the side column offset and the scroll-spy (D-089). Below the bars a grid `minmax(0,46rem)` form column and a 21.5 rem side column from `edit`, `gap-6`; the side column (`#editor-side-column`) sticks, scrolls on its own, and fades on each edge with more. Below 1180 px the side cards stack under the form inside a summary card (`SideCard flat`). Form sections wrap in `EditorSection`.

**Dialog.** `AppDialog`: scrim, a panel `rounded-lg shadow-3`, top edge anchored at `min(8dvh, 4rem)` so an error summary does not move it, header (title 16/700 and a Close button 40 px, first Tab stop), scrolling body (`px-6`), footer right-aligned with a rule. Sizes `sm` 28 rem, `md` 36, `lg` 52, `xl` 64. Under 600 px high (200 % zoom) the footer is sticky at the foot of the body and the primary action stays on screen.

**Preview panel.** "Preview in app" is a full-width panel (`PreviewPanel`, `#editor-preview`) above the form grid with one sticky header row (Surface tabs with a hint, Expand, Close, at most 70 px above the picture, D-113). Expand is hidden when it would gain under 48 px. The stand-in simulates the visitor app: `em` type and `var(--t-*)` theme colours, with `.on-dark` where the stand-in is dark (the scoped `.stand-in-header` ring is used instead where the theme colour varies).

## Elevation & Depth

Hybrid, mostly tonal: white surfaces on a grey canvas separated by hairlines. Shadows are cool (`220 30% 12%`), low alpha, always with an offset and a blur, and appear only on surfaces that float or are stuck.

### Shadow Vocabulary
- **shadow-1** (`0 1px 2px hsl(220 30% 12% / 0.06), 0 1px 3px hsl(220 30% 12% / 0.05)`): cards, state cards, side cards.
- **shadow-2** (`0 4px 12px hsl(220 30% 12% / 0.1), 0 1px 3px hsl(220 30% 12% / 0.08)`): popovers, menus, tooltips, toasts, the stuck list toolbar.
- **shadow-3** (`0 16px 40px hsl(220 30% 12% / 0.18), 0 2px 8px hsl(220 30% 12% / 0.1)`): dialogs.
- **shadow-drop-before / shadow-drop-after**: the 2 px inset drop line of the Route and Guide reorder lists (lists have `.list-drop-*`). Forced colours redraw both in `Highlight`.

### z layers (`tailwind.config.js`)
`z-raised` 5, `z-sticky` 10 (header, toolbar, editor bars), `z-drawer` 30, `z-popover` 40, `z-modal` 50, `z-modal-over` 51 (a confirmation over a dialog), `z-popover-over` = `--z-modal` + 1 (popovers, menus and tooltips; a HelpHint inside a dialog is above it), `z-toast` 60, `z-skip` 70.

### Motion
Durations `duration-1/2/3` = 120 / 180 / 240 ms; `ease-out` (0.16,1,0.3,1) for things that appear, `ease-std` (0.4,0,0.2,1) for state changes; `transition-ui` limits transitions to colour, border, shadow, opacity, transform. Animations: `animate-fade-in` (180 ms, popovers, scrim), `animate-rise-in` (240 ms, dialogs, toasts), `animate-slide-in-left` (drawer), `animate-skeleton` (1.4 s), `animate-spin`. Only state changes move. Reduced motion: durations drop to 1 ms, skeletons and the spinner are static, and appearing surfaces keep a 120 ms opacity fade with no transform or slide (D-086).

### Named Rules
**The Flat-At-Rest Rule.** Hairline and shadow-1 at rest; shadow-2 and shadow-3 mean "this floats".

## Shapes

Gently rounded and consistent: `rounded-sm` 4 px (checkbox, nav item hover, menu item), `rounded-md` 8 px (every control, popover, menu, skeleton), `rounded-lg` 12 px (card, dialog, alert, toast, state card, table card), `rounded-full` (chips, avatar, filter chip, help hint). No `rounded-xl` (removed in D-116). Control edges are 1 px `--input`; structural edges 1 px `--border`. No coloured side stripe on any card or alert.

### Focus ring model (D-100)
One ring for every focusable control: `outline: 2px solid hsl(var(--ring))` with `outline-offset: 2px`, so the gap shows the surface and the ring reads on the canvas and on a filled button alike (10.37:1 and 11.32:1). No white ring, no halo. Fields also move their border to `--primary` on focus. Programmatic focus targets (`tabindex="-1"`: the page heading, `<main>`, a dialog heading) show no ring. Tab strips pad 4 px inset (`p-1 -m-1`) so the ring is never clipped. On the dark stand-in `.on-dark` swaps the ring to `--ring-inverse`.

### State ladder (D-101)
rest, hover, pressed, never the same fill twice. Primary `--primary` -> `--primary-hover` -> `--primary-active`; danger `destructive` -> `/90` -> `--destructive-active`; danger-outline hover tint -> `destructive/20`; ghost, secondary, tab, nav item (`.nav-item:active`), row and kebab: `surface-hover` -> `--surface-active`. Menu highlight: `bg-accent-strong` plus a 2 px inset ring outline (the fill alone is 1.32:1). Disabled: `aria-disabled` or `disabled` at 60 % opacity with `cursor-not-allowed`, plus a stated reason (`disabled-reason`); a blocked button stays focusable.

### Forced colours (`@media (forced-colors: active)`)
Every control (`button`, tabs, chips, nav items) gets a 1 px `ButtonText` border; primary and danger buttons 2 px; dialogs, menus, listboxes, tooltips, alerts and toasts a 1 px `CanvasText` border. Selected and current items (`[aria-selected="true"]`, `[aria-current]`, active tabs) fill with `Highlight` / `HighlightText`. Focus is a 2 px `Highlight` outline. Only the highlighted menu item is outlined. `.forced-step-current` draws a stepper's current step as a 4 px `ButtonText` ring on `Canvas`, keeping its number (put `aria-current` on the label, not an ancestor of the circle). The Route and Guide drop lines are redrawn in `Highlight`. Map pins get a `CanvasText` outline.

## Components

Primitives live in `src/components/ui/<name>/` (import the `.vue`; barrels remain only for button, chip, alert, field, tabs, input, select, checkbox, skeleton, state-card, tooltip, popover, dropdown-menu, help-hint). Never rebuild them locally.

### Buttons
- **Shape:** 8 px radius, 600 weight at 14 px, 16 px icons, `gap-2`, no wrap, never underlined.
- **Variants:** `primary` (solid purple; one per region), `secondary` (white, control border), `ghost` (toolbar, row and menu actions), `danger` (solid; only inside a confirmation), `danger-outline` (Archive and similar), `link` (inside running text). Sizes `md` 40 px, `sm` 32 px (both 44 px coarse), `icon` 40 px square (`size-control`, 44 coarse).
- **Props:** `loading`, `disabledReason`, `label` (name of an icon-only button), `as-child`. Aliases `default`, `brand`, `outline`, `destructive` and size `lg` exist only for legacy screens (see Legacy).

### Chip and StatusChip
- **Chip:** a 24 px pill (`min-h-6`, `px-2.5`, 12/600, 16 px icon, text always). Tones `neutral` (sunken), `outline`, `brand`, `success`, `warning`, `danger`, `info`.
- **StatusChip:** `statusInfo` maps `ACTIVE` (check, success), `DRAFT` (dashed circle, neutral), `ARCHIVED` (archive, outline), `PENDING` (pencil, brand, "Pending changes"), `SUSPENDED` (warning), `FAILED`/`DENIED` (danger). `wrap` lets a long label ("Pending changes" in a narrow Status column) break onto two lines as a rounded pill; all six lists pass it.
- **FilterChip:** a 32 px removable pill (44 coarse) whose whole body is the "Remove filter <label>" button.

### Alert, ProblemAlert, RequestIdRow
- **Alert:** the one banner. Tint fill, 1 px border at 30 % of the ink, 20 px role icon, optional bold title, body, `actions` slot; tones `info`, `success`, `warning`, `danger`; danger and warning are `role="alert"`, the others `status`; `rounded-lg px-4 py-3`.
- **ProblemAlert:** a failed request as an Alert: heading and one fixed sentence from `describeError` (`problemText.ts`), the request-id row, and a secondary sm "Try again" when the parent listens to `retry`. Server `detail` is never shown.
- **RequestIdRow:** the one row (label, id in mono, "Copy request id" ghost sm button; `compact` for toasts). Used by Alert, `FormErrorSummary`, `StateCard`, toasts.

### Toast (`AppToast`)
White card, `rounded-lg`, `shadow-2`, `animate-rise-in`, 20 px role icon, bold role-coloured title, optional body and request-id row, a dismiss button. Max three, identical ones collapse ("x3"), errors stay until dismissed, timers pause on hover and focus. Tones `success`, `neutral` (check and ink colour; Discarded, Archived, Restored, Link copied), `warning`, `error`, `info`. Dock rule (D-102): in an editor from `edit` the stack takes the side column's right edge and width (`useToastDock` measures `#editor-side-column`) so it never covers the form; below 1180 it is full width with a 16 px gutter; elsewhere bottom right. `--toast-offset-bottom` lifts it above a sticky footer. A title-only toast is one line. Dismissing a focused toast hands focus on with `focusSuccessor`. The store has no action button.

### AppDialog, FormDialog, ConfirmDialog
`AppDialog` (see Layout) restores focus to its opener, or to the trigger of the menu it came from; `returnFocusTo` overrides. `FormDialog` is the frame of every create dialog: Title, a slug behind "Edit slug", one `FormErrorSummary` that takes focus, a sticky footer with "Create and open", discard confirmation, busy label "Creating…". `ConfirmDialog` is mounted once, used through `askConfirm`: the confirming action is primary on the right (danger when it loses work), Cancel secondary on its left.

### Fields
- **FormField:** a 600-weight 14 px label, optional 12 px hint, the control through a scoped slot `{ id, describedBy, invalid }`, an error with a 16 px icon at 12/500 in danger ink; `required` prints "(required)". In a dialog with an error summary the field message is not an alert (`QUIET_FIELD_ERRORS`).
- **Input, Textarea, Select** share `.ui-field`: 40 px, 8 px radius, `--input` border, hover border `--foreground`, focus border `--primary`, invalid border danger, disabled on sunken. `dir="auto"` by default on Input and Textarea. Textarea `autogrow` (3 to 20 rows). Select is the native `<select>`; `size="sm"` is 32 px (44 coarse).
- **Checkbox:** a 20 px box (24 coarse) inside a 40 px (44) row; **Switch** `role="switch"`, 44 x 24 px track.
- **DateTimeFields:** typed day, month by name, year, hour, minute with one label per part, validated on blur (hour 0 to 23, minute 0 to 59, 31 February is wrong), one sentence per wrong part linked by `aria-describedby`, the model is empty until the parts form a real value.
- **FilteredSelect:** native select plus a filter field from 25 options.

### Tabs and LinkTabs
Bottom-border strip, items `min-h-control`, 14/600, current is purple with a 2 px purple border, others muted; counts are a pill. `TabsList` and `LinkTabs` scroll sideways with a 4 px inset so the ring is not clipped. `LinkTabs` are links with `aria-current="page"`.

### HelpHint
A 40 px (44 coarse) round hit area with a 16 px icon opening a popover (`w-72`) with a short explanation; copy lives in `lib/glossary.ts`.

### SideCard
The only card of the editor side column: `rounded-lg border bg-card p-4 shadow-1`, one `h2` at 14/700 (`tabindex="-1"` so focus can move to it), nothing inside opens another `h2`; `flat` drops the chrome for the narrow layout.

### StateCard, EmptyState, skeletons
- **StateCard:** full-page state (session ended, 403, 404, 503, config error): `max-w-xl rounded-lg` card with `shadow-1`, 32 px icon, `h1` 24/700 that takes focus, cause in plain words, actions, one request-id row, "Technical details" collapsed.
- **EmptyState:** dashed `--input` border, 24 px icon, a 16/700 `h2`, one sentence, one primary action. `ListEmpty` wraps it for list empties; with active filters it shows removable `FilterChip`s and "N matches in Archived".
- **Skeleton:** `animate-skeleton rounded-md bg-muted`, static under reduced motion; a skeleton row is as tall as a real two-line row (`.list-row-skeleton` 72 px).

### Navigation
`AppHeader` (56 px, `z-sticky`, logo `h-logo` 26 px with a 44 px hit area, project switcher, user menu). `WorkspaceNav`: `.nav-item` 13/500 ink-2, 36 px high (44 below 1100 px or on touch), hover `surface-hover`, pressed `surface-active`, current is `accent` fill with a 3 px inset purple bar, 600 weight; an off capability stays in the list greyed with an "Off" chip.

### List core
`ListTable` (table or cards, sortable header buttons with `aria-sort`, pager of 50 rows, move bar with Undo, reorder live region), `ListToolbar`, `FilterChip`, `FilterField` (label above a full-width control, for the popover), `ListRowTitle` (`<bdi>`, `hit-44`, carries `back` and the worklist `lang`), `ListEmpty`, `ListFooter` (count sentence and the translation legend; keep it mounted while loading), `ListLoadError` (a `ProblemAlert` that focuses the page heading), `ListSourceNotice` (optional reads that failed, Try again per source), `TranslationDots` (32 px units, 44 coarse, language name, icon and sr-only state), `TriggerChips`.

## Content rules

- **Vocabulary:** lifecycle is `DRAFT`, `ACTIVE`, `ARCHIVED` (sentence case on screen: Draft, Active, Archived). "Published" is never used. An ACTIVE item is edited through a Working Copy (Save draft, Apply changes, Discard).
- **Failures:** one sentence chosen by status and `code` (`src/lib/problemText.ts`, D-087, D-105), never the server's `detail`; 503 is "The platform is busy or down for maintenance"; "cannot reach the server" is for a network failure only. A failure that belongs to no field says "This could not be completed" or "The <noun> was not created". Patterns: `The CMS could not <action>. <what happens to the data>.` plus the request-id row; say what was kept ("Nothing was changed.", "Your changes are still in the form.").
- **Dates (D-088):** `formatDate`, `formatTime`, `formatDateTime`, `formatDateTimeRange` in `src/lib/format.ts`: 24-hour clock, day, month name, year ("16 Nov 2026, 14:05"), in the Project's or Event's time zone when given.
- **Units (D-106):** a number and its unit are joined by a no-break space (`NBSP`, `withUnit`, `formatBytes` "159 KB", `formatDistance`, `formatPercent`).
- **Labels:** sentence case, visible labels, no placeholder-as-label, no uppercase, verbs on buttons ("Create and open"), ellipsis is the single character in busy labels ("Creating…").
- **Announcements:** one per event, through `say()` or one live region, never both a bar and a toast.

## Accessibility rules

WCAG 2.1 AA is a release gate. Text 4.5:1 and UI 3:1 (the values above are measured). Targets are 44 px on a coarse pointer and for text links in dense rows (`hit-44`, a transparent `::after`). Every state is text plus an icon. Focus has a successor (D-103): when the focused thing goes away, `focusSuccessor(removed, candidates)` moves focus to the next sibling action, else the previous, else the listed candidates, else the nearest labelled region, else the `h1`, else `<main>`; never `<body>`. Routes announce and set the title only after the route commits. Dialogs trap focus, Close is the first Tab stop, Esc closes the top one only. A removal or move is undoable where you are, with Ctrl or Cmd+Z. The reflow check is 320 x 256 and 200 % zoom (640 x 360); the sticky stack is short at both (56 px at zoom 200 %).

## The gates

- `make check` runs `check-css` and `check-literals` (also `npm run check`). Neither is part of `make build`; wiring them into build or CI is the owner's choice.
- `check-css --all` (`scripts/check-css-tokens.mjs`): every design-token class (size, h/w, z, shadow, rounded, text, leading, duration, ease, animate, spacing, colour families, `nav:` and `edit:`) in any source file must have a generated rule.
- `check-literals` (`scripts/check-literals.mjs`): no `text-[Npx]`, `rounded-[`, `shadow-[`, `z-[`, `tracking-[`, `uppercase`, hex colour, or `bg|text|border-white|black|gray-N` in CMS chrome. Exceptions, documented in the script header: the preview stand-in (`components/preview/**`, `editor/ResourcePreview.vue`: `uppercase`, `tracking-[`, `rounded-[`, hex fallbacks inside `var(--t-*)`), `QrCodePreview` `bg-white` (QR quiet zone), `mask-image` lines, and six out-of-scope screens.
- Also: typecheck (`vue-tsc`), `impeccable detect`, axe (wcag2a/aa and 21a/aa, no serious or critical), a keyboard run, and screenshots at 1440, 1024, 768 and zoom 200 %.

## Do's and Don'ts

### Do:
- **Do** use the `ui/` primitives and the tokens; one primary button per region.
- **Do** state status as an icon plus a word; use Chip and StatusChip.
- **Do** give every blocked control a reason (`disabled-reason`) and keep it focusable.
- **Do** write one sentence per failure with one request-id row (`ProblemAlert`, `RequestIdRow`).
- **Do** give list rows `ListRowTitle` and cards `SideCard`; put row slugs on one line and chips on their own.
- **Do** keep the gutter (`--gutter`), the 40 px control and 52 px row rhythm, and 44 px under `pointer: coarse`.
- **Do** put `aria-current` on a stepper's label, not on an ancestor of its circle.
- **Do** add a forced-colours counterpart for anything drawn by shadow or tint alone.
- **Do** update this file in the same slice as a token, type size or component variant change.

### Don't:
- **Don't** use `text-[Npx]`, hex, `rounded-[`, `shadow-[`, `z-[`, `tracking-[`, `uppercase` in chrome (gate), or `leading-*` on a sized text.
- **Don't** add a coloured side stripe, a gradient CTA, glassmorphism, a gradient text, an eyebrow label, or a card inside a card.
- **Don't** remove a focus ring; replace it only on a control that draws its own focus state.
- **Don't** show the server's `detail`, a stack trace, or "published".
- **Don't** use colour alone for state, and don't let placeholder text be the label.
- **Don't** use `.field-input`, `.field-label`, `.dialog-primary`, `.dialog-secondary`, the Button aliases or `statusChipStyle` in new screens.
- **Don't** hand-roll a ghost button, pill, table or field that a primitive already covers.

## Legacy (out-of-scope visitor-app screens)

Six screens were not part of the overhaul and still use older classes: `OverviewView`, `LanguagesView`, `SurfacesView`, `TranslationsView`, `NavigationView` (`views/workspace/navigation/`) and the section view. They render with the new tokens through aliases. Do not copy their patterns.
- `.field-input` and `.field-label` (`src/style.css`): used by `TranslationsView`, `SurfacesView`, `NavigationView`. New code uses `Input` and `FormField`.
- `.dialog-primary` and `.dialog-secondary` (`src/style.css`): used by `NavigationView`. New code uses `Button` in a dialog footer.
- Button aliases `default`, `brand` (as primary), `outline` (as secondary), `destructive` (as danger) and size `lg`: used by `LanguagesView`, `OverviewView`, `TranslationsView`, `SurfacesView`, `NavigationView`.
- `statusChipStyle` (`lib/format.ts`): used by `TranslationsView`. New code uses `StatusChip`.
- `check-literals` skips these screens; `check-css --all` does not.

## Known deviations still open

1. **Raw line-heights in chrome** (breaks The One Height Rule; `check-literals` does not scan `leading-`): `editor/ResourcePreview.vue:164` and `preview/PreviewPane.vue:96` (`text-xs leading-normal`, 1.5 instead of 1.4), `editor/StoryEditor.vue:223` (`leading-relaxed`), `media/AssetPickerDialog.vue:248` (`leading-[2.5rem]`), `createProject/Stepper.vue:58` (`leading-7`). The `ResourceContent` stand-in `leading-*` are inside the preview exception.
2. **Alias tokens kept:** colour `sunken` (`tailwind.config.js:42`, same as `muted`) still has three users (`CreateProjectView.vue:100`, `createProject/StepName.vue:77`, `createProject/StepTemplate.vue:82`); `--secondary`/`secondary` (`style.css:68`, `tailwind.config.js:53`) duplicates `--accent` with no class user found. Prefer `muted` and `accent`.
3. **Stale numbers in `style.css` comments:** `--ring-inverse` says 12:1 on ink (measured 14.94:1) and `--destructive-active` says 8.6:1 (measured 10.13:1). The values are fine.
4. **Hand-rolled ghost buttons** remain in `ReadinessList`, `MapEditorView`, `EditorShell` and `AppHeader`, and `ReorderControls` overrides with `!min-h-8`; moving them to `Button variant="ghost"` changes visible chrome.
5. **Create-dialog failures:** Guide, Event and Category create dialogs use `describeError(...).body` ("Nothing was changed.") rather than `createFailure` ("Nothing was created."), so the sentence differs by kind.
6. **Surfaces that say "not reachable"** for a 503 may remain on views owned by older code; `problemText(503)` is the one wording (D-105, requests.md).
7. **Toast has no action button**, so a move is confirmed by the bar in `ListTable`, not a toast (D-111 wording says "toast").
8. **`RemovedBar` is `sticky bottom-2`**: it docks only while its parent extends below the viewport; with a short list it sits at the end of the list.
9. **Native Select list highlight** belongs to the platform; only the closed control is styled.
10. **Dashboard guide progress** tops out at 3 of 4 until drafts are activated (Q-022, step 5 has no data).
11. **Dependencies:** `tailwindcss-animate` is still in `package.json` (unused; removal needs an install). `DateTimeFields` Event End rewriting depends on `EventEditorView` honouring the empty value.
12. **Not shipped:** themed scrollbars and caret colour (only `accent-color` and `::selection` are themed), a dark theme, compact density (the tokens exist, only comfortable ships).
13. **Gates are not wired** into `make build` or CI.
14. **Assumed wording** in this file, for the owner to confirm: the North Star "The Quiet Workshop", the colour names (UNICHE Purple, Heritage Teal and so on), and the elevation philosophy sentence.

## Token verification

Each name was found by `grep -nF` in the stated file (name -> file:line of the first definition or use).

**CSS tokens (`src/style.css`):** `--background` 56; `--foreground` 57; `--card` 59; `--popover` 60; `--popover-foreground` 61; `--primary` 63; `--primary-hover` 64; `--primary-active` 65; `--primary-foreground` 66; `--secondary` 68; `--secondary-foreground` 69; `--accent` 70; `--accent-strong` 71; `--accent-foreground` 72; `--muted` 74; `--muted-foreground` 75; `--surface-hover` 76; `--surface-active` 77; `--ink-2` 79; `--placeholder` 80; `--disabled-ink` 81; `--highlight` 83; `--border` 85; `--input` 86; `--ring` 87; `--ring-inverse` 88; `--success` 90; `--success-tint` 91; `--warning` 92; `--warning-tint` 93; `--destructive` 94; `--destructive-tint` 95; `--destructive-active` 96; `--destructive-foreground` 97; `--info` 98; `--info-tint` 99; `--scrim` 101; `--shadow-1` 104; `--shadow-2` 105; `--shadow-3` 106; `--dur-1` 109; `--dur-2` 110; `--dur-3` 111; `--ease-out` 112; `--ease-std` 113; `--control-h` 116; `--row-h` 117; `--header-h` 118; `--nav-w` 119; `--gutter` 120; `--z-modal` 121.

**CSS rules and blocks (`src/style.css`):** gutter 24 px at 1100 123; coarse density 128; `::selection` 146; `:focus-visible` 180; `.on-dark` 191; `.mono` 168; `.tabular` 172; `@keyframes skelpulse` 207; `ui-fade-in` 216; reduced-motion block 238; `.ui-spinner` 252; `.hit-44` 269; `.field-label` 288; `.field-input` 293; `.ui-field` 327; `.dialog-secondary` 359; `.dialog-primary` 360; `.nav-item:active` 398; `.app-shell` 411; `main` scroll-padding with `--sticky-stack-h` 422; forced-colours block 431; dialog and menu border rule 448; `.forced-step-current` 470; `.shadow-drop-before` 522.

**Tailwind (`tailwind.config.js`):** screens `sm` 10, `md` 11, `lg` 12, `nav` 13, `edit` 14, `xl` 15; font sizes `xs` 20, `compact` 21, `sm` 22, `base` 23, `lg` 24, `xl` 25; fonts `sans` 29, `mono` 30; colour `sunken` 42, `secondary` 53; animations 81 (`skeleton`, `fade-in`, `rise-in`, `slide-in-left`, `spin`); radii `sm` 90, `md` 91, `lg` 92; `spacing.control` 96; `shadow-drop-before` 100, `-after` 101; z-index `popover` 110, `modal` 111, `modal-over` 112, `popover-over` 114, `raised` 107, `sticky` 108, `drawer` 109, `toast` 115, `skip` 116; `duration-1` 119; `ease-out` 124; `transition-ui` 128; `h-header` 132; `h-logo` 133; `h-stage` 135; `min-h-row` 139; `w-nav` 142; `max-w-prose` 145.

**List CSS (`src/styles/list-table.css`):** `.list-scope` 3; `.list-th` 6; `.list-sort` 21; `.list-row` 37; `.list-row-skeleton` 41; `.list-card-skeleton` 44; `.list-th-order` 61; `.list-th-translations` 70; `.list-card` 95; `.list-guide` 103; `.list-drop-before` 109; `.list-flash` 135.

**Component facts:** `.ui-chip` and chip `min-h-6` `ui/chip/index.ts` 7; `.ui-tab` `ui/tabs/LinkTabs.vue` 26; Tabs `min-h-control` `ui/tabs/TabsTrigger.vue` 15; `.nav-item` base `WorkspaceNav.vue` 145; `MIN_TITLE = 240` `list/ListTable.vue` 97; `--list-toolbar-h` `list/ListToolbar.vue` 9; toolbar `min-[900px]:sticky` `ListToolbar.vue` 191; `--sticky-stack-h` `workspace/useStickyStack.ts` 4; `--toast-offset-bottom` `AppToast.vue` 6; `toastDock` `lib/toastOffset.ts` 56; `useToastDock` 67; Button primary `ui/button/index.ts` 24; `danger-outline` 31; size `sm` 47; size `icon` 48; `StatusChip` `wrap` `StatusChip.vue` 13; `RequestIdRow` `data-request-id` `ui/alert/RequestIdRow.vue` 27; `ProblemAlert` `ui/alert/ProblemAlert.vue` 4; `QUIET_FIELD_ERRORS` `ui/field/FormField.vue` 8; `DateTimeFields` part error ids `ui/field/DateTimeFields.vue` 23; `Select size="sm"` `ui/select/Select.vue` 25; `Checkbox size-5` `ui/checkbox/Checkbox.vue` 17; `HelpHint size-10` `ui/help-hint/HelpHint.vue` 21; `Skeleton` `ui/skeleton/Skeleton.vue` 10; `SideCard` `editor/SideCard.vue` 24; `FilteredSelect` `editor/FilteredSelect.vue` 1; editor grid `minmax(0,46rem)_21.5rem` `editor/EditorShell.vue` 821; `#editor-side-column` 836; `AppDialog` sizes `AppDialog.vue` 57; `PageFrame` `pb-24 pt-6` `PageFrame.vue` 15; `PageHead` `text-lg` 63; `AppHeader` `h-header` 23; `TranslationDots` `min-h-8` 61; `FilterChip` `min-h-8` `list/FilterChip.vue` 25.

**Libraries:** `focusSuccessor` `lib/focus.ts` 76; `restoreFocus` 47; `formatBytes` `lib/format.ts` 187; `NBSP` 179; `withUnit` 182; `formatDateTime` 113; `statusChipStyle` 44; `describeError` `lib/errors.ts` 18; `problemText` `lib/problemText.ts` 53; `fold` `lib/utils.ts` 16.

**Gates:** `check-css --all` `scripts/check-css-tokens.mjs` 8; `check-literals` exceptions header `scripts/check-literals.mjs` 20; `check: check-css check-literals` `Makefile` 27.
