# W0-fixup changes

Files: AppHeader.vue, ProjectSwitcher.vue (aria-label removed; visible text first, sr-only suffix ", account menu" / ". Switch project"; the account name shows as sr-only below md instead of display:none), ui/dialog/FormDialog.vue (props titleLabel, slugLabel, slugHint), categories/CreateCategoryDialog.vue (Name/Code), lib/format.ts (UI_LOCALE, formatDayInZone, formatTimeInZone, formatOccurrenceSpan), platform/events.ts (formatOccurrence delegates), ui barrels (textarea, switch, spinner, dialog), AppDialog.vue (popover mode removed, no callers), HelpHint.vue (class), PreviewPanel.vue (redundant group label removed), style.css (app-shell height lock from 300 px viewport height, was 420, so #main scrolls at zoom200 = 640x360), index.html (branded inline splash, no requests).
Select id/aria-describedby: already done by P3a. Helpers useListLifecycle/LifecycleDialogs/listRows: no type errors.

Results: vue-tsc passes (0 errors). axe (wcag2a/aa/21aa + best-practice) at 1440 on picker, Dashboard, POIs list, POI editor, Asset editor, Preview: no serious/critical (label-content-name-mismatch gone). Zoom200 after scroll 500: #main is the scroller on POI and Asset editors; sticky header and Asset preview stay in view (screenshots in after/ at 1440, 768, zoom200, plus *-scrolled__zoom200).
impeccable detect: 2 warnings on index.html (splash header padding is by design with fixed height; Montserrat is the brand face) - accepted.
Not done: forced-colors and 1024 shots; no e2e selector changes (none reference the removed aria-labels? not re-run, e2e cannot run here). NavigationView PreviewPane wrap out of scope. No D/Q entries added.

## Verification fixes
- R1-V-01: `ui/dropdown-menu/DropdownMenu.vue` is non-modal by default (`:modal="props.modal ?? false"`). axe (wcag2a/aa/21aa) on the POI list with a row kebab open: no violations; menu opens and Esc closes it. Covers every Radix dropdown (More actions, user menu) that uses this wrapper. Script: kebab.mjs.
- R1-V-10: `src/workspace/useReorder.ts` drop line uses `hsl(var(--primary))` instead of `#4c1d8b`.
- R1-V-12 (header): ProjectSwitcher reserves the chip's space with a skeleton chip while the Project's detail loads (`animate-skeleton`, md and up); another agent added the same skeleton at the same moment, I kept one copy. vue-tsc: 0 errors.
