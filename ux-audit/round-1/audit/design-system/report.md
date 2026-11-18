# design-system — Round 1 (cross-cutting design-system audit)

(Saved by the orchestrator from the agent's returned report: the agent's Write call was refused.
`proposal.md`, `inv.mjs`, `states.mjs`, `data/inventory.json`, `data/states.json`, `shots/` are in this folder.)

## Verdict
Consistent on the surface, weak underneath: tokens cover about half the palette, type is hand-set in px, buttons,
fields, tables and banners each exist in several forks, and several values fail WCAG. `impeccable detect --json src/`:
1 finding (`AppToast.vue:14`, `border-l-4` side stripe).
Area scores 44–75 (mean 59). Audit health 11/20. Nielsen 27/40 (3,3,3,2,3,3,2,3,3,2).
Findings: P0 0 · P1 7 · P2 9 · P3 4 (R1-ds-01 … -20).

## Context check
12 §2 Translator (Greek first-class); 14 §1 text scales to 200 % without loss of function; 03 §1 one working copy per
ACTIVE Resource → status roles DRAFT/ACTIVE/ARCHIVED/pending; D-053 brand gradient deepened for white text (dropping
the gradient button needs a new D-entry; D-004 superseded by BRIEF); PRODUCT.md desktop-first, tablets by touch.

## Scores per area (Clarity 25 / Hierarchy 20 / Consistency 15 / Copy 15 / A11y 15 / Resp 10)
| Area | Total |
|---|---|
| Colour and contrast tokens | 58 |
| Typography | 44 |
| Spacing, density, layout | 65 |
| Radii, borders, elevation, z-index | 65 |
| Buttons | 57 |
| Chips, badges, status | 61 |
| Form controls | 53 |
| Dialogs, popovers, menus | 75 |
| Tables and lists | 64 |
| Feedback (toast, banner, skeleton, empty, error) | 64 |
| Focus, forced colours, motion | 51 |
| Icons | 49 |
| Token plumbing (CSS vars, Tailwind, shadcn) | 54 |

## Findings
- **R1-ds-01 P1 (M)** Type in px, so browser text scaling does nothing. With `html{font-size:32px}` only header links,
  page title and brand button grow (`shots/pois__root-font-200pct__1440.png`; `data/states.json` rootScale: 10 px ×798,
  11 px ×373 … stay fixed). Source: `text-[11px]` ×281, `text-[13px]` ×258, `text-[10px]` ×122, `text-[12px]` ×26,
  `text-[9px]` ×25, `text-[15px]` ×16; `style.css:84-135`, `list-table.css`, 38 px font-size declarations in `<style>`
  blocks. Fails 14 §1/§4. Fix: rem scale in `tailwind.config.js`, then codemod.
- **R1-ds-02 P1 (M)** 61 % of 5,054 text elements are under 12 px (10 px ×1,881, 11 px ×913, 9 px ×265); the small text
  carries state (status chips, trigger chips, translation dots, table headers). `StatusChip.vue:15`, `TriggerChips.vue:25`,
  `TranslationDots.vue`, `style.css`, `list-table.css`. Fix: 12 px floor, sentence case.
- **R1-ds-03 P1 (S)** All 188 inputs: border `#e5e7eb` on white 1.24:1; 65 placeholders `#9ca3af` 2.54:1
  (`shots/pois__search-focused__1440.png`, `shots/places__create-dialog-error__1440.png`). Source `style.css:96-103`, 43
  `border-[1.5px]` inline inputs. Fix `--control-border #737b8b` (4.26:1), `--placeholder #5f6877` (5.63:1). WCAG 1.4.11/1.4.3.
- **R1-ds-04 P1 (S–M)** Google Fonts loaded at runtime (`index.html:7-10`; `src/platform/templates.ts:114` for Template
  fonts; 5 Montserrat faces incl. 800). Breaks "only API and IdP". Fix: self-host Montserrat variable woff2 with
  size-adjusted fallback. Also flag: OSM tiles (`map/basemap.ts:22`), Nominatim (`platform/maps.ts:235`).
- **R1-ds-05 P1 (S)** Forced colours drop primary/destructive fills: "Apply changes", "Deactivate" render as bare text
  (`shots/poi_editor__forced-colors__1440.png` vs default). `ui/button/index.ts:7`, `StatusChip.vue`. Fix: transparent
  1 px border on every button/chip + `forced-colors` block.
- **R1-ds-06 P1 (S)** Draft trigger chips `opacity-60`: Geo 2.70:1, Beacon 2.86:1, QR 3.13:1 at 9 px
  (`TriggerChips.vue:25-26`). Fix: outlined draft chip, no opacity on text.
- **R1-ds-07 P1 (M)** 930 targets under 24×24 on 15 screens: 10 px text buttons 38×16 (135), 52×16 (89); table-title
  links 16 px tall (~200); header "Manage members"/"Help" 16 px. `PlacesView.vue`, `PoisView.vue`, `RoutesView.vue`,
  `RouteEditorView.vue`, `AppHeader.vue:25`, `ReorderControls.vue`. WCAG 2.5.8. Fix: 32 px min, 40 px comfortable.
- **R1-ds-08 P1 systemic (L, mechanical)** Three button systems: `Button` cva 7 variants / 51 uses / 21 files (brand ×18,
  outline ×26); 216 raw `<button>`; 29 `.dialog-primary/.dialog-secondary` (`style.css:116-137`); 66 hand-rolled pills.
  Paddings `px-[18px] py-[7px]`, `px-5 py-2.5`, `px-[22px] py-[11px]`, `px-4 py-2`. Same verb, different look: "Deactivate"
  grey in list vs solid purple in editor; "Archive" magenta text in list vs outline pill in editor. Disabled `opacity-50`;
  "Save draft" disabled 2.12:1 with no reason shown.
- **R1-ds-09 P2 (M)** Uppercase + tracking default: 221 `uppercase`, 13 tracking values. Greek tab `ΕΛΛΗΝΙΚΑ` loses
  diacritics. Fix: sentence case, zero tracking.
- **R1-ds-10 P2 (M)** 40 hex literals in 37 chrome files (`#855400` ×49, `#4c1d8b` ×23, `#e5e7eb` ×21, `#374151` ×16);
  11 near-duplicate greys; `text-gray-700` ×129; danger as `#bf185d`/`#c0185e`/`#b4235a`; warning 15 alpha variants.
  Hard-coded in `AppToast.vue:5`, `lib/format.ts:2-18`, `TranslationDots.vue:16-18`, `WorkspaceNav.vue:97-122`,
  `TriggersCard.vue:352-365`, `Create*Dialog.vue`.
- **R1-ds-11 P2 (S)** DRAFT and ARCHIVED share one grey chip (`lib/format.ts:2-18`), differing only by a 10 px glyph;
  "pending" shares amber with readiness warnings. Fix: DRAFT dashed icon, ARCHIVED outline, pending violet.
- **R1-ds-12 P2 (S)** Reorder affordance contrast: drag handle `⠿` 2.54:1 (n=103), disabled ▲▼ 1.38:1, route-stop ↑
  1.54:1, tree connectors 1.47:1. `ReorderControls.vue:52`, `PlacesView.vue:296`, `CategoriesView.vue:230`, `RouteEditorView.vue:682`.
- **R1-ds-13 P2 (S)** `a:hover` `--highlight #f832a4` 3.51:1 (`style.css:54-57`), underline only on hover. Fix `#a3106a` (7.40:1).
- **R1-ds-14 P2 (M)** Toast/banners: coloured side stripe, hard-coded hex, one toast at a time, `✕` glyph dismiss,
  `aria-live` polite even for errors. Working-copy banner, readiness card, error card each draw their own stripe. Fix:
  one `Alert`, one `Toast`.
- **R1-ds-15 P2 (M)** Unicode glyphs as icons (`+` ×195, `⚠` ×96, `→` ×18, `✓` ×11, `✕` ×8, `⠿ ✎ ○ ▪ └ ↳ ▲ ▼`);
  lucide-vue-next installed but used in ~8 files; Montserrat lacks `⠿`/`✎` → fallback fonts, misaligned.
- **R1-ds-16 P2 (S)** Focus differs by control: global ring good, but 16 inputs use `focus:outline-none` + border tint
  (`style.css:100-103`): computed focus is a 1 px border change. Map markers (`FloorPlanEditorView.vue:260`),
  `GeoPicker.vue:198` use two further styles.
- **R1-ds-17 P2 (S)** Reduced motion honoured only in `AppDialog.vue:191`; `skelpulse` (`style.css:64-72`) always pulses;
  42 `transition`, 3 `transition-all`.
- **R1-ds-18 P3 (S)** 15 radii, 21 shadow strings, z-indexes 50/60/80/90/10/1/0; confirm dialog over dialog at same z-50.
- **R1-ds-19 P3 (M)** Arbitrary spacing (`px-[18px]` ×107, `py-[7px]` ×13, `gap-[7px]` ×13 …); no 4 px rhythm.
- **R1-ds-20 P3 (S)** Duplicated CSS: `.field-input` in 4 create dialogs; `.th/.td` in `list-table.css`, `EventsView.vue:386`,
  `EventEditorView.vue:591`; one-offs `.add-chip`, `.off-pill`; `darkMode: ["class"]` with 0 `dark:` classes; unstyled
  native select/checkbox in filter menu.

## Systemic patterns
1. Visual decisions at the call site in px and hex — introduce the token layer first.
2. State carried by tiny, low-contrast, uppercase text and glyphs.
3. Component forks: buttons ×3, fields ×3, tables ×3, banners ×4, tabs ×3.
4. Accessibility modes handled per component, not in the base layer.

## What works (keep)
shadcn-style variable names (swap values restyles the app); brand recognisable (`#4c1d8b` 11.32:1, grey canvas, white
cards); status uses text + icon + colour; global focus ring + skip link; `AppDialog` focus trap/return/Esc/busy;
skeletons match layout; error card shows requestId + retry; muted text `#5d636f`; clean cva `Button` to become the
single source; page zoom 200 % works.

## Proposal
See `proposal.md`: rem type scale with 12 px floor; 8 px-radius sentence-case buttons (no caps pills, no gradient
button); control border `#737b8b`, placeholder `#5f6877`; link hover `#a3106a`; self-hosted Montserrat 400–700; violet
"pending"; status roles; spacing, radii, 3 shadows, named z-layers, motion tokens, density rules, Tailwind/shadcn
mapping, keep/merge/drop component inventory.

## Unverified
Toast and 409 banners from source only; skeleton under reduced motion from source; hover/active measured on one button
and one nav item; no dark mode; text over tiles/thumbnails not measured; forced colours via Chromium emulation only.
