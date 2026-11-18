# design-system cleanup list for round 3 (file:line, as of 2026-11-16)

## A. Fix a defect (not just cleanup)
1. `tailwind.config.js` (theme.extend, ~L129-143): `control` is under `height`/`minHeight` only. Add `spacing`/`size` entry `control: "var(--control-h)"`, or change `src/components/ui/button/index.ts:48` `size-control` to `h-control w-control` (+ keep `p-0`). Icon buttons are 18x18 today.
2. `src/components/WorkspaceNav.vue:96` `min-h-header` generates nothing (`header` only in `height`). Use `h-header` or `min-h-[var(--header-h)]`.
3. `src/style.css` forced-colours block (~L418-448): add a 1 px `CanvasText` border for `[role="dialog"]`, `[role="alertdialog"]`, `[role="menu"]`, popover content, toast and `Alert`; or give `src/components/AppDialog.vue:108` panel `border border-transparent`.
4. `src/components/editor/ReorderControls.vue:70-79`, `src/components/editor/RemovedBar.vue:24`, `src/components/media/MediaSlots.vue:222-224`: after fix 1 remove the per-call `size-8` / `min-h-8` / `[@media(pointer:coarse)]:size-11` patches.

## B. Dead code to delete (no importer)
- `src/components/ReorderControls.vue` (whole file, 105 lines; superseded by `src/components/editor/ReorderControls.vue`).
- `src/components/CategoryFilterSelect.vue`, `FeaturedFilterChip.vue`, `FilterChoiceGroup.vue`, `ListFilterMenu.vue` (109 lines), `SearchLanguageSelect.vue`: only importers are each other and `list/ListSelect.vue`.
- `src/workspace/useStatusActions.ts` (88 lines).
- `src/style.css`: `.small-label` (~L267-271), `.table-head` (~L377-382), `.table-row` (~L383-391): zero users. `.nums` (~L392): replace 2 users (`src/components/ui/tabs/LinkTabs.vue:30`, `src/components/preview/PreviewPane.vue:82`) with `tabular-nums`, then delete.
- `src/lib/format.ts:44` `statusChipStyle` and `:63` `statusGlyph` (+ glyph returns at 69, 77): delete after `TranslationsView.vue:16,667-668` moves to `<StatusChip>`.

## C. Fork and alias consolidation
- `src/components/list/ListSelect.vue` vs `src/components/ui/select`: fold into one (users: `ListToolbar.vue:15`, `SortSelect.vue:9`, `categories/CategoriesView.vue:14`, `media/MediaView.vue:14`).
- `src/style.css` `.field-input` (~L272-305) is a twin of `.ui-field` (~L306-337): delete after migrating the 11 users: `SurfacesView.vue:199`; `TranslationsView.vue:789,799,867,912,920`; `NavigationView.vue:451,524,597,701`. `.field-label` (~L262): `NavigationView.vue:588,696`.
- `.dialog-primary` / `.dialog-secondary` (`src/style.css` ~L338-373 and the forced-colours selector list ~L423-428): only `NavigationView.vue:711-712`; replace with `Button`.
- `src/components/ui/button/index.ts` aliases `default`, `brand`, `outline`, `destructive`, `lg` (L~14-28, 45): grep callers, migrate to `primary`/`secondary`/`danger`/`md`, delete (D-072 says Round 3).

## D. Remaining literals, in-scope components
- Shadows: `src/workspace/useReorder.ts:195-196`, `src/views/workspace/routes/RouteEditorView.vue:595-596`, `src/views/workspace/guides/GuideEditorView.vue:579-580`: `shadow-[inset_0_+-2px_0_0_hsl(var(--primary))]` -> define `shadow-drop-before/after` in `tailwind.config.js` boxShadow.
- z-index: `src/views/workspace/routes/RouteEditorView.vue:787` `z-index: 10` (ties with `z-sticky`; use a new `z-raised` token below sticky or `calc`), `src/components/preview/PreviewApp.vue:240,275,302` `z-10` (inside the device frame, fine, but name it).
- Hex: `src/components/preview/ResourceContent.vue:52,103,150,158` (`#b91c1c`, `#dc2626`) and `src/components/preview/PreviewApp.vue:408,455` (`#e1f3ea`, `#17643f`, `#dc2626`): use `--destructive` / `--success` tokens (the missing-content highlight is CMS chrome, not themed content). `src/components/preview/DeviceFrame.vue:89` fallbacks `#fff`, `#030712` acceptable (theme fallbacks) but could read `projectTheme.ts` defaults.
- `src/components/editor/QrCodePreview.vue:38` `bg-white` (QR needs white: keep, add comment); `src/views/createProject/StepTemplate.vue:96,97,117,128` `border-black/10` -> `border-border`.
- Glyphs in preview shells: `src/components/editor/ResourcePreview.vue:121,135,149`, `src/components/preview/PreviewApp.vue:216,236,270,420` (`☰ ▾`): lucide `Menu`, `ChevronDown` (keep em-sizing).
- Arbitrary px spacing in in-scope files (1 each): `src/components/AppHeader.vue`, `ProjectSwitcher.vue`, `GeoPicker.vue` (`h-[260px]` L205), `editor/EditorShell.vue`, `editor/ReorderControls.vue`, `media/UploadEntryRow.vue`, `views/workspace/maps/MapEditorView.vue`, `maps/FloorPlanEditorView.vue`, `categories/CategoryEditorView.vue`, `dashboard/PendingChanges.vue`, `PreviewView.vue`: convert to scale or a named token.
- Scoped CSS font sizes in px: `src/components/map/GeoMapCanvas.vue:559` (22px), `src/views/workspace/maps/FloorPlanEditorView.vue:480` is rem (ok).

## E. Visitor-app screens (out of the Content scope: do only when the owner opens it)
Per file, migrate `text-[Npx]`, `uppercase`, `tracking-[`, `font-extrabold`, hex, `gray-*`, `rounded-[10px]`, glyphs:
- `src/views/workspace/TranslationsView.vue`: 54 `text-[Npx]` (e.g. 176, 627, 646, 684, 748, 758, 804), `bg-[#b26be3]` L176 (3.44:1 dot), `bg-gray-100 text-gray-500` L684/748 (4.39:1), `#855400` L627/684/748/758, `⚠` L873, `statusChipStyle` L16/667-668.
- `src/views/workspace/navigation/NavigationView.vue`: 17 `text-[Npx]`, `⠿` L489, `⚠` L498, hex in scoped CSS L720-725, `font-size: 12px/11px` L723/732, `.field-input` users, `.dialog-*` L711-712, `#855400` L492/498.
- `src/views/workspace/LanguagesView.vue`: 15 `text-[Npx]`, 7 uppercase, skeleton hex L102-103.
- `src/views/workspace/OverviewView.vue`: 11 `text-[Npx]`, `rounded-[10px]` L118,120,125,148,170, `grid-cols-[...170px...]` L129.
- `src/views/workspace/SurfacesView.vue`: 10 `text-[Npx]`, `#855400` L140/208, skeleton hex L147, `shadow` bare L183, `field-input` L199.
- `src/views/workspace/SectionView.vue:20-22`: `rounded-[10px]`, `text-[13px]`.
- `src/views/workspace/ProjectLayout.vue:116-119`: skeleton widths in `w-[min(...)]` (fine, but name them).

## F. Tests to add so it stays clean
- Unit/CI: build Tailwind CSS and assert every `size-*|h-*|w-*|min-h-*|z-*|shadow-*|rounded-*` token appearing in `src/components/ui/**` has a rule (catches `size-control`, `min-h-header`).
- CI gate: `grep -rnE 'text-\[[0-9.]+px\]|rounded-\[|shadow-\[|z-\[|tracking-\[|uppercase|#[0-9a-fA-F]{6}' src --include=*.vue` limited to Content paths must be empty (system.md §5 already states it; wire it up).
- e2e: every icon-only `button` >= 32 px (44 on coarse); forced-colours screenshot of one dialog.
