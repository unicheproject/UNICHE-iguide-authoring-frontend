# CLN: final cleanup (D-116; C3-97, C3-98, C3-99; cleanup.md B, in-scope C, D, F)

Status: done. Typecheck (`vue-tsc --noEmit -p tsconfig.app.json`): 0 errors. `check-css --all`: ok (269 files). `check-literals`: ok (162 files, 6 out-of-scope screens skipped). Production build with `.tmp-dev.config.mjs`: ok. JS 3,066,094 B and CSS 159,916 B in total; I have no pre-cleanup build to compare, because `dist/` is from 11 Nov. The output folder is deleted. Render of all 20 workspace routes (`probes/render.mjs`): h1 on each, 0 overlays, **0 page errors**; shots in `CLN/after/`.

The build caught one defect `vue-tsc` missed: double quotes inside an attribute in `CategoriesView.vue`. It is fixed.

## cleanup.md A (verified, not redone)
- A1 to A4 are in place: DropdownMenuItem highlight, `--ring` focus ring, a distinct pressed step, tab scrollers padded, `z-popover-over`.
- `#fff` is gone from the focus rules, and `.on-primary` has 0 hits in `src/style.css`.

## Deletions and proof
All greps were `grep -rnE "\bName\b" src e2e` from the repo root. "0" means no hit outside the deleted file.

| Deleted | Proof (hits before deleting) |
|---|---|
| `components/CategoryFilterSelect.vue`, `FeaturedFilterChip.vue`, `SearchLanguageSelect.vue` | 0 each |
| `components/FilterChoiceGroup.vue` | 1, a doc comment inside `ListFilterMenu.vue` (also deleted) |
| `components/ListFilterMenu.vue` | 0 |
| `workspace/useStatusActions.ts` | 1, its own declaration |
| `components/list/ListSelect.vue` | Still imported by 6 files (Wave 1 had not migrated them). I moved all 6 to `ui/select` `size="sm"`, then 0 hits. |
| `workspace/useReorder.ts` `dropLineClass` | 1, its own definition. Route and Guide `shadow-drop-before/after` now have a forced-colours `Highlight` rule in `style.css` (added first, per C3-97). |
| `lib/format.ts` `statusGlyph` | 1, its own definition (`TranslationsView` does not use it) |
| `style.css` `.small-label`, `.table-head`, `.table-row` (+`:hover`) | `grep -rnE "small-label\|table-head\|table-row" src e2e` gives 0 outside `style.css` |
| `style.css` `.nums` | 2 users (`LinkTabs.vue`, `PreviewPane.vue`) switched to `tabular-nums`, then 0 |
| `style.css` `--radius` | 0 `var(--radius)` users (`--t-radius` is a different token) |
| `style.css` `--card-foreground` | 0 users (`text-card-foreground` and `card-foreground` have no hits) |
| `styles/list-table.css` `.th`, `.th.text-right`, `.td` | Dead: the file is scoped CSS in `ListTable.vue`; the only `th`/`td` classes are in `TranslationsView`, which scoped CSS never reaches. `.list-th-translations` and `.list-guide` are used by `ListTable.vue`, so they stay. |
| Barrels `ui/dialog/index.ts`, `ui/empty-state/index.ts`, `ui/spinner/index.ts`, `ui/switch/index.ts`, `ui/textarea/index.ts` | `grep -rnE "ui/<name>['\"]\|ui/<name>/index"` gives 0. Callers import the `.vue` files. |
| `tailwind.config.js` `darkMode` | `grep -rnE "\bdark:\|\.dark\b" src` gives 0 |
| `tailwind.config.js` `container` | `grep 'class="[^"]*\bcontainer\b'` gives 0 |
| `tailwind.config.js` `tailwindcss-animate` import and plugin | `grep -rnE "animate-in\|animate-out\|fade-in-0\|zoom-in\|zoom-out\|slide-in-from\|slide-out-to\|fade-out\|accordion-\|collapsible-" src index.html` gives 0. Only `package.json:39` still names the package. |
| Colour `line`, font size `2xl` | 0 users (`text-2xl`, `border-line`, `bg-line`, `text-line`, `ring-line`) |
| `card.foreground` colour key | 0 users (`card` is now a plain token) |
| `z-base` | 0 users (`z-0` is Tailwind's own) |
| `rounded-xl` key | 2 users (`StateCard.vue`, `SignInView.vue`) became `rounded-lg`, then 0 |
| 6 local NFD fold copies | `ProjectList.vue`, `platform/assets.ts`, `listRows.ts` (`normalizeText`), `TranslationsView.vue`, `EntityCombobox.vue` and `resourcePicker.ts` (`foldText`) all use `fold` from `@/lib/utils`. The 9 list views that imported `normalizeText` now import `fold`. |
| `platform/assets.ts` local `formatBytes` | Now imported from `@/lib/format` (NBSP, "20 MB"), so `assetMeta` is NBSP-safe. |
| `MediaView.vue` local `metaText` | Replaced by `assetMeta`, which is identical to it. |

## Kept on purpose
- **`ui/empty-state/EmptyState.vue`:** the component stays and only its barrel is gone. It has one non-ui user, `list/ListEmpty`, which wraps it (list empty states). `ui/state-card` is the full-page pattern. I did not inline it.
- **`FilterChip`:** already extracted by P3-core; no duplicate remains.
- **Legacy classes and exports** (all users are out-of-scope screens, grep-proved): `.field-input`, `.field-label`, `.dialog-primary`, `.dialog-secondary`, the Button aliases `default`, `brand`, `outline`, `destructive`, `lg`, and `statusChipStyle`. The files are `LanguagesView`, `OverviewView`, `SurfacesView`, `TranslationsView`, `NavigationView`, plus the definition in `format.ts`. List them as legacy in DESIGN.md.
- **Not done:** the hand-rolled ghost buttons (`ReadinessList`, `MapEditorView`, `EditorShell`, `AppHeader`) and `ReorderControls`' `!min-h-8` override. They sit in other packages' files, and moving them to `Button variant=ghost` or `Select size="sm"` changes visible chrome. C3-36 asks for the 40 px select there, so `size="sm"` would be wrong anyway.
- **P3b create dialogs and `createFailure.ts`:** not switched. Guide, Event and Category use `describeError(...).body`, which ends "Nothing was changed."; `createFailure` says "Nothing was created." and has its own 400/422 sentence, so the sentences would not stay identical.

## Other changes
- **`StatusChip` `wrap` prop:** replaces the two different class strings ("max-w-full whitespace-normal rounded-lg py-0.5" in P3b, and "max-w-full !whitespace-normal text-left" in P3a). All six lists now pass `wrap`. P3a's lists now show the P3b rounded two-line pill. Seen at 1440 on `/pois`.
- **D literals:**
  - Changed: PreviewApp `z-10` (3 uses) to `z-raised`; PreviewView `h-[520px]` to `h-stage` (new `32.5rem` height token); FloorPlanEditor pin shadow to `var(--shadow-2)` and 28 px to `1.75rem`; StepTemplate `border-black/10` to `border-border`; WorkspaceNav `@apply text-compact`.
  - Documented by comment: GeoMapCanvas 22 px coarse zoom glyph; EditorShell mask `#000`; QrCodePreview `bg-white`.
  - Already done by Wave 1 (verified): `h-logo`, ReorderControls width.
  - Left alone: NavigationView `12px/11px` (out of scope).
- **Header Project switcher:**
  - Cause: the trigger was `w-full max-w-[22rem]` and the name needed 153 px of a 148 px slot.
  - Fix: `w-auto max-w-[26rem]`; the "Visitor app: Draft" chip now shows from `lg` (1024) up instead of `md`.
  - Measured before and after in `probes/switcher.mjs` (name `clientWidth` against `scrollWidth`):

    | Viewport | Before | After |
    |---|---|---|
    | 1440 | 148 of 153, truncated | 153 of 153, "UX Audit – Populated" in full, trigger 357 px |
    | 1280 | truncated | full |
    | 1100 | truncated | full |
    | 1024 | truncated | full |
    | 768 | truncated | full (chip hidden, trigger 203 px) |

  - Shots: `CLN/switcher-before-*.png` and `switcher-after-*.png`.
- **Filters popover selects:** measured on pois, media, categories and routes after the `ListSelect` move; all are 32 px as before (`probes/filters.mjs`). The media Type select is 144 px wide, the min-w-36 it had before.

## F gates
- **`scripts/check-css-tokens.mjs`:**
  - Tokenizer never splits inside `[...]`, so the `max-h-[calc(...,3.5rem...)]` false positive is gone. Commas in `min(a,b)` match Tailwind's `\2c ` escape.
  - Families now: size, h, w, min/max, z, shadow, rounded, text, leading, duration, ease, animate, p/m/gap/space, bg, border, ring, outline, fill, stroke, divide, placeholder, caret, decoration. Plus any class under the custom screens `nav:` and `edit:`.
  - `!`-prefixed classes are checked as written.
  - A temp file with 9 bad classes was reported (9 of 9), then removed.
- **`scripts/check-literals.mjs` (new):**
  - Scans `.vue` and `.css` under `src` with comments stripped, for `text-[Npx]`, `rounded-[`, `shadow-[`, `z-[`, `tracking-[`, `uppercase`, hex colours, and `bg/text/border-white/black/gray-N`.
  - Exceptions are documented in the file header: out-of-scope legacy screens (list), the preview stand-in (`components/preview/**` and `editor/ResourcePreview.vue`; allowed `uppercase`, `tracking-[`, `rounded-[` and hex fallbacks), `QrCodePreview` `bg-white`, and `mask-image` lines.
  - A temp file with 5 literals was reported (5 of 5), then removed.
- **Make and npm:**
  - `Makefile` has `check-css` (now `--all`), `check-literals` and `check`, all added to `.PHONY`.
  - `package.json` scripts: `check:css` (now `--all`), `check:literals`, `check`. Scripts only.
  - Not added to `make build` or the Dockerfile (plan §9 item 3).
- **`e2e/README.md`:** it now lists `focus-and-gates.spec.ts` and `touch-and-forced-colours.spec.ts`, and has a "Static gates" section.

## Files changed
- **Deleted (12):** `src/components/CategoryFilterSelect.vue`, `FeaturedFilterChip.vue`, `FilterChoiceGroup.vue`, `ListFilterMenu.vue`, `SearchLanguageSelect.vue`; `src/workspace/useStatusActions.ts`; `src/components/list/ListSelect.vue`; the five barrels `src/components/ui/{dialog,empty-state,spinner,switch,textarea}/index.ts`.
- **Edited:**
  - Config and styles: `src/style.css`, `src/styles/list-table.css`, `tailwind.config.js`, `Makefile`, `package.json` (scripts only), `DECISIONS.md` (D-116).
  - Scripts: `scripts/check-css-tokens.mjs`; new `scripts/check-literals.mjs`.
  - Docs: `e2e/README.md`.
  - Shared code: `lib/format.ts`, `workspace/useReorder.ts`, `platform/assets.ts`, `components/resourcePicker.ts`, `views/workspace/listRows.ts`.
  - Components: `StatusChip`, `ProjectSwitcher`, `ProjectList`, `ResourcePickerDialog`, `StateCard`, `LinkTabs`, `PreviewPane`, `PreviewApp`, `WorkspaceNav`, `EditorShell` (comment only), `QrCodePreview` (comment only), `GeoMapCanvas` (comment only), `ListToolbar`, `SortSelect`.
  - Views: `SignInView`, `StepTemplate`, `PreviewView`, `FloorPlanEditorView`, `MediaView`, `CategoriesView`, `PoisView`, `RoutesView`, `PlacesView`, `EventsView`, `GuidesView`, `FloorPlansView`, `MapsView`, `EntityCombobox`, `TranslationsView` (fold only).
- **Probes:** `ux-audit/round-3/implementation/CLN/probes/{switcher,render,filters}.mjs`.
- **Dependencies:** none changed. `package.json` and the lockfile are untouched.

## Notes
- **Owner follow-ups:**
  - Remove `tailwindcss-animate` from `package.json` (and the lockfile) with an install; nothing imports it.
  - Decide whether `make check` gates `make build` or CI.
- **Dev server:** it must restart to pick up the `tailwind.config.js` changes (`h-stage`, removed keys). The 20-route render ran against the live server and shows no breakage; the production build compiles them.
- **Not run:** e2e (needs Keycloak). No spec selector changed.
- **`TranslationsView` fold:** the shared `fold` also maps the final sigma ς to σ and strips all combining marks. It is applied to both query and title, so matches can only widen.
- **Out-of-scope screens:** untouched except that fold line. Overview, Languages, Surfaces, Translations, Navigation render with no error in `CLN/after/` (Languages and Surfaces show the "App settings" h1, as in the gate-1 render).
- **Detector:** `impeccable detect --json` over the changed components gives `[]`.
