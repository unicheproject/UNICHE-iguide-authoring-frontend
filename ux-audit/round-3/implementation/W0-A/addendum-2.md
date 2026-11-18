# W0-A addendum 2

## Changes
- `src/components/AppDialog.vue`
  - The header is now `items-center`, and the title is `py-1` instead of `pt-2`, so the Close centre equals the title centre.
  - Body padding is `pt-2 pb-4` (before: `py-2`), so the bottom padding is 16 px. The short-window inline footer compensates with `-mb-4`.
- `src/components/ui/dialog/FormDialog.vue`
  - The short-window body rule now has `padding-bottom: 1rem` (before: `0.25rem`).
  - The busy label is now "Creating…" with one ellipsis character.
- No other API changed.

## Probe
Dev server, account admin, POI and Category create dialogs. The probe is `probes/dialogs2.mjs`, and screenshots are in `after/dialog2-*.png`.

| Dialog | Viewport | Close centre | Title centre | Body padding-bottom | Primary visible |
|---|---|---|---|---|---|
| POI | 1440 | 129 | 128.99 | 16 px | yes |
| POI, "Edit slug" open | 1440 | 129 | 128.99 | 16 px | yes |
| Category | 1440 | 129 | 128.99 | 16 px | yes |
| POI | zoom200 (640x360) | 53 | 52.99 | 16 px | yes |
| POI, "Edit slug" open | zoom200 (640x360) | 53 | 52.99 | 16 px | yes |
| Category | zoom200 (640x360) | 53 | 52.99 | 16 px | yes |

- Before: Close was 5 px lower than the title (129 vs 124.2 at 1440, 53 vs 48.2 at zoom200), and the body bottom padding was 8 px at 1440 and 4 px at zoom200.
- At 1440 the gap from the end of the form to the footer rule is now 16 px (before: 8 px), with and without "Edit slug" open.
- At zoom200 the sticky footer keeps "Create and open" inside the 360 px viewport.
