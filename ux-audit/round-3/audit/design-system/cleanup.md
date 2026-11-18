# design-system cleanup list for the end of round 3 (file:line, as of 2026-11-17)

How "dead" was proved: `grep -rlE "\bName\b" src e2e` (and the path forms `/Name'`/`/Name"`) over `.vue` and `.ts`, excluding the file itself. "0" means no other file refers to it. A module scan over every `.vue` and `.ts` in `src` also listed these as unimported.

## A. Fix a defect (not only cleanup)
1. `src/components/ui/dropdown-menu/DropdownMenuItem.vue:21` has `outline-none data-[highlighted]:bg-surface-hover`: the highlighted item is 1.14:1 with no ring (R3-ds-02). Add an accent-strong fill plus a 2 px inset outline.
2. `src/style.css:186-194` primary and danger focus ring is white-on-light (R3-ds-03). Use `--ring` for the outline and drop the coloured halo. The `#fff` at `src/style.css:189` and `src/style.css:391` goes with it.
3. `src/components/ui/button/index.ts:26,34` `active:bg-primary-hover` equals hover; `danger-outline` `active:bg-destructive-tint` equals hover. Add a distinct pressed token.
4. `src/components/ui/tabs/LinkTabs.vue:25` (`overflow-x-auto`) and the editor language tab strip (`TabsList`, `DIV.flex min-w-0 flex-1 overflow-x-auto` in `EditorShell`/`TranslationsPanel`) clip the focus ring (R3-ds-01). Add padding or an inset offset.
5. `src/components/ui/popover/PopoverContent.vue:25`, `ui/dropdown-menu/DropdownMenuContent.vue:31`, `ui/tooltip/Tooltip.vue:19` use `z-popover` (40), below `z-modal` (50) (R3-ds-05, latent).

## B. Dead code to delete (no importer)
- `src/components/CategoryFilterSelect.vue` (21 lines), `src/components/FeaturedFilterChip.vue` (19), `src/components/FilterChoiceGroup.vue` (30), `src/components/ListFilterMenu.vue` (109), `src/components/SearchLanguageSelect.vue` (21). Proof: 0 importers each; they only reference each other and `list/ListSelect.vue`. Delete together.
- `src/workspace/useStatusActions.ts` (88 lines): `grep useStatusActions` finds only its own declaration at `:12`. It also holds a stale warning-tone toast (`:47`, `:60`).
- `src/workspace/useReorder.ts:194-198` `dropLineClass`: only the definition exists. `ListTable` uses `.list-drop-*`. It also carries the last `shadow-[inset…]` literals.
- `src/style.css`: `.small-label` (`:293`), `.table-head` (`:403`), `.table-row` (`:409-413`): zero users. `.on-primary` selector in `:186` has zero users (keep the `[data-variant]` selectors). `.nums` (`:418`): replace the 2 users (`ui/tabs/LinkTabs.vue:30`, `preview/PreviewPane.vue:95`) with `tabular-nums`, then delete.
- `src/styles/list-table.css:2,11,14` `.th`, `.th.text-right`, `.td`: the file is `<style scoped>` inside `ListTable.vue:321`; only `TranslationsView.vue:655,656,663,671` use `th`/`td` classes, and scoped CSS never reaches them. Dead rules. Also check `.list-th-translations` and `.list-guide` before the final sweep.
- `src/lib/format.ts:44` `statusChipStyle` and `:63` `statusGlyph` (returns `✓` at `:69`): the only users are `TranslationsView.vue:16,667,668,729` (out of scope); delete after that screen moves to `<StatusChip>`.
- Unused barrels: `src/components/ui/dialog/index.ts`, `ui/empty-state/index.ts`, `ui/spinner/index.ts`, `ui/switch/index.ts`, `ui/textarea/index.ts` have 0 importers by barrel path (callers import the `.vue` directly). Either use the barrels (as `ui/button`, `chip`, `alert` do) or delete them, so the import style is one.
- Dead config and dependency: `tailwind.config.js:8` `darkMode` (no `.dark` or `dark:` anywhere in `src`), `:11-16` `container` (no `container` class), `tailwindcss-animate` plugin (`package.json:39`, no `animate-in`/`fade-in-0`/`zoom-in` use). Unused tokens: `--radius` (`style.css:80`), `z-base`, `border-line` (`line` colour), `text-2xl` (`tailwind.config.js:36`), `card-foreground` and `popover-foreground`, `rounded-xl` (2 users, same as `lg`: `StateCard.vue:38`, `SignInView.vue:24`).

## C. Fork and alias consolidation
- `src/components/list/ListSelect.vue` (22 lines) vs `ui/select`: fold into one. Users: `ListToolbar.vue`, `SortSelect.vue`, `CategoriesView.vue`, `MediaView.vue`, `PoisView.vue`, `RoutesView.vue`. Two of the dead B components also import it.
- `src/style.css` `.field-input` (`:298-330`) is a twin of `.ui-field` (`:332-360`): 10 users: `SurfacesView.vue:199`; `TranslationsView.vue:789,799,867,912,920`; `NavigationView.vue:451,524,597,701`. `.field-label` (`:288`): `NavigationView.vue:588,696`.
- `.dialog-primary` / `.dialog-secondary` (`style.css:364-400` and forced-colours list `:459-460`): only `NavigationView.vue:711-712`; replace with `Button`.
- `src/components/ui/button/index.ts` aliases `default`, `brand`, `outline`, `destructive`, `lg` (`:30-37`, `:45-47`): the only user is `variant="outline"` x8 (`LanguagesView.vue:117`, `OverviewView.vue:114`, `TranslationsView.vue:638,704`, `SurfacesView.vue:155`, `NavigationView.vue:426,612,619`); `data-variant` mapping at `Button.vue:54` can then be simplified.
- Duplicate removable-filter chip: `src/components/list/ListEmpty.vue:33` and `src/views/workspace/media/MediaView.vue:415` (identical classes). Extract a `FilterChip`.
- Hand-rolled ghost buttons that should use `Button variant=ghost`: `ReadinessList.vue:137`, `MapEditorView.vue:608`, `EditorShell.vue:547,607,755`, `AppHeader.vue:51`.
- `src/components/editor/ReorderControls.vue:64` `!min-h-8 !py-1 !pl-2` override on `Select`: add a `size="sm"` to `ui/select`.
- Three empty-state patterns: `ui/empty-state` (1 non-ui user), `list/ListEmpty`, `ui/state-card`. Decide which survive.

## D. Remaining literals, in-scope
- `src/components/AppHeader.vue:37,39` `h-[1.625rem]` (logo): name it `h-logo`.
- `src/components/editor/ReorderControls.vue:60` `w-[4.75rem]`, `src/views/workspace/PreviewView.vue:278` `h-[520px]` (skeleton): name or scale.
- `src/views/workspace/maps/FloorPlanEditorView.vue:516` `box-shadow: 0 2px 8px rgb(0 0 0 / 0.25)` and `:508-513` fixed px sizes: use `--shadow-2` and rem.
- `src/components/map/GeoMapCanvas.vue:581` `font-size: 22px` (coarse Leaflet zoom glyph; outside the scale).
- `src/views/createProject/StepTemplate.vue:104,105,125,136` `border-black/10`: use `border-border`.
- `src/components/preview/PreviewApp.vue:241,276,303` `z-10` inside the device frame: name it `z-raised`.
- `src/components/editor/QrCodePreview.vue:46` `bg-white` (a QR needs white: keep, add a comment).
- `src/views/workspace/navigation/NavigationView.vue:723,732` scoped `font-size: 12px/11px` (out of scope screen).
- `src/components/WorkspaceNav.vue:152` `font-size: 0.8125rem`: use `@apply text-compact`.
- `src/components/editor/EditorShell.vue:831` `#000` in a mask gradient (a mask, not a colour): leave, add a comment.

## E. Visitor-app screens (do only if the owner opens that scope)
Per-file counts of literals (`text-[Npx]`, uppercase, tracking, `font-extrabold`, hex, `gray-*`, `rounded-[10px]`, glyphs):
- `TranslationsView.vue`: 54 `text-[Npx]`; hex at `:176`, `:627`, `:646`, `:684`, `:748`, `:758`; `bg-gray-100 text-gray-500`; `border-l-[3px]` stripe at `:758`; `statusChipStyle`.
- `NavigationView.vue`: 17 `text-[Npx]`; glyphs `⠿` and `⚠`; scoped hex and px.
- `LanguagesView.vue`: 15 `text-[Npx]`, 7 uppercase, skeleton hex `:102-103`, `px-[18px]` x6.
- `OverviewView.vue`: 11 `text-[Npx]`, `rounded-[10px]` x5, `grid-cols-[…170px…]`.
- `SurfacesView.vue`: 10 `text-[Npx]`, `#855400` `:140,208`, skeleton hex `:147`, bare `shadow` `:183`, `field-input` `:199`.
- `SectionView.vue:20-22`: `rounded-[10px]`, `text-[13px]`.
- Preview shells (`PreviewApp.vue`, `ResourceContent.vue`): em-based and themed by design (simulating the visitor app); uppercase and `font-extrabold` there are intentional. Leave.

## F. Tests and gates to add so it stays clean
- Widen `scripts/check-css-tokens.mjs`: do not split on commas inside `[...]` (the `--all` false positive at `EditorShell.vue` `max-h-[calc(100dvh-var(--sticky-stack-h,3.5rem)-1rem)]`), add families `text`, `leading`, `duration`, `ease`, `animate`, `p/m/gap`, colours, and the custom screens; run it with `--all` on the build or CI.
- Wire the literal gate: `grep -rnE 'text-\[[0-9.]+px\]|rounded-\[|shadow-\[|z-\[|tracking-\[|uppercase|#[0-9a-fA-F]{6}' src --include=*.vue` limited to CMS-chrome paths must be empty. Nothing runs it today.
- e2e: every icon-only button is at least 32 px (44 on coarse); a forced-colours screenshot of one dialog and one open menu; a keyboard-focus ring visibility check for a tab strip and a menu item.
