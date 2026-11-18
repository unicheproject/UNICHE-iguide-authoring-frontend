# iGuide CMS design system (Round 1, W0 stage 0.1)

Authority: `ux-audit/round-1/plan/plan.md` sections 1, 2 and 6.2, DECISIONS.md D-069 to D-073, D-078, D-083. This file is
what Wave 1 packages import from. Stage 0.2 (editor shell) and 0.3 (list scaffold) append their sections at the end.

## 1. Tokens

All colours are `H S% L%` triplets in `src/style.css`; use them as Tailwind colours (alpha works: `bg-primary/90`).

| Role | Tailwind | Hex (review only) | Use |
|---|---|---|---|
| Canvas | `bg-background` | `#f4f5f7` | page |
| Surface | `bg-card`, `bg-popover` | `#ffffff` | cards, dialogs, inputs, header, nav |
| Sunken | `bg-muted` (also `bg-sunken`) | `#e9ebef` | table head, disabled field, neutral chip |
| Hover | `bg-surface-hover` | `#eef0f3` | row and menu hover |
| Line | `border-border` (`border-line`) | `#d9dce2` | decorative hairlines only, never a control edge |
| Control border | `border-input` | `#737b8b` | every field, secondary button, checkbox, switch |
| Ink / Ink 2 | `text-foreground` / `text-ink-2` | `#111827` / `#374151` | text, labels |
| Muted ink | `text-muted-foreground` | `#566070` | helper, metadata |
| Placeholder | `placeholder` (set globally) | `#5f6877` | placeholder only |
| Disabled ink | `text-disabled-ink` | `#8a91a0` | disabled text, always with a stated reason |
| Primary | `bg-primary`, `hover:bg-primary-hover`, `text-primary` | `#4c1d8b` / `#3a1469` | the one primary action, current item, links, focus |
| Brand tint | `bg-accent` (`bg-secondary`), `bg-accent-strong` | `#efe9f8` / `#e6dcf5` | selection |
| Status inks and tints | `text-success bg-success-tint`, `warning`, `destructive`, `info` | see style.css | text and icon in ink on the tint |
| Scrim | `bg-scrim` | 45 % ink | modal backdrop |

Type scale (fixed rem, 12 px floor): `text-xs` 12, `text-compact` 13, `text-sm` 14 (body), `text-base` 16 (titles), `text-lg` 20
(page title), `text-xl` 24 (display), `text-2xl` 28 (sign-in only). Weights 400 body, 500 nav and metadata, 600 labels and
buttons, 700 headings. Use `tabular`/`nums` on counts and dates, `mono` (13 px) only for slugs, codes, request ids.
Radii: `rounded-sm` 4, `rounded-md` 8 (controls), `rounded-lg` 12 (cards, dialogs), `rounded-full` (chips). Shadows
`shadow-1/2/3` (card / popover, toast, stuck bar / dialog). Z layers: `z-sticky` 10, `z-drawer` 30, `z-popover` 40,
`z-modal` 50, `z-modal-over` 51 (a confirmation over a dialog), `z-toast` 60, `z-skip` 70. Motion: `duration-1/2/3`
(120/180/240 ms), `ease-out`, `ease-std`, `transition-ui` (only colour, border, shadow, opacity, transform); animations
`animate-fade-in`, `animate-rise-in`, `animate-slide-in-left`, `animate-skeleton`. Density: `min-h-control` (40, 44 coarse),
`min-h-row` (52, 56 coarse), `h-header` 56, `w-nav` 232. Screens: `md` 768, `lg` 1024, `nav` 1100 (drawer below),
`edit` 1180 (editor side column from here), `max-nav:` for "below 1100". Base layer: one focus ring, `::selection`,
`accent-color`, link underline, reduced-motion and forced-colours blocks.

## 2. Primitives (`src/components/ui/<name>/`, import from the folder index)

| Component | Import | Props / slots | Notes |
|---|---|---|---|
| Button | `{ Button } from "@/components/ui/button"` | `variant` primary / secondary / ghost / danger / danger-outline / link (aliases default, brand, outline, destructive); `size` md / sm / icon (aliases default, lg); `loading`; `disabledReason`; `label` (icon-only name); `as-child` | one primary per region; `<Button variant="secondary" disabled-reason="Save first">`; blocked buttons stay focusable (`aria-disabled`) and swallow clicks |
| Chip | `{ Chip } from "@/components/ui/chip"` | `tone` neutral / outline / brand / success / warning / danger / info; `icon` (lucide component) | always text; 24 px |
| Input, Textarea, Select | `@/components/ui/input` (`Input`), `.../textarea`, `.../select` | `v-model`, `invalid`; Textarea `autogrow`, `minRows` 3, `maxRows` 20 | styled by `.ui-field`; give them a visible label |
| Checkbox, Switch | `@/components/ui/checkbox`, `.../switch` | `v-model`, `description`, `disabled`, default slot = label | switch has `role="switch"` |
| FormField | `{ FormField } from "@/components/ui/field"` | `label`, `hint`, `error`, `required`, `id`; scoped slot `{ id, describedBy, invalid }` | `<FormField label="Title" :error="e" v-slot="f"><Input :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid" v-model="t" /></FormField>` |
| FormErrorSummary | `{ FormErrorSummary } from "@/components/ui/field/FormErrorSummary.vue"` | `summary` (shape of `editor.summary`), emits `select(path)` | `role="alert"`, `data-error-summary`, focusable |
| Tabs, TabsList, TabsTrigger, TabsContent, LinkTabs | `@/components/ui/tabs` | Radix tabs (roving tabindex); `LinkTabs`: `tabs` `{ key, label, to, count? }[]`, `current`, `label` | `SectionTabs` uses `LinkTabs` |
| Popover(+Trigger, Content) | `@/components/ui/popover` | Radix; `v-model:open` | Esc returns focus to the trigger |
| DropdownMenu(+Trigger, Content, Item, Separator, Label) | `@/components/ui/dropdown-menu` | Radix; Item `danger`, `@select`, `as-child` for links | arrow-key model, type-ahead |
| Tooltip | `{ Tooltip } from "@/components/ui/tooltip"` | `text`, `side` | trigger is the default slot; never the only carrier of meaning |
| Alert | `{ Alert } from "@/components/ui/alert"` | `tone` info / success / warning / danger, `title`, `requestId`, `role`; slots default, `actions` | danger and warning are `role="alert"` |
| Skeleton | `@/components/ui/skeleton` | classes shape it | pulses only without reduced motion |
| EmptyState | `@/components/ui/empty-state` | `title`, `icon`; slots default (one sentence), `actions` | |
| StateCard | `@/components/ui/state-card` | `title` (the `h1`), `icon`, `requestId`; slots default, `actions`, `details` | request id has a copy button |
| Spinner | `@/components/ui/spinner/Spinner.vue` | none | decorative |
| HelpHint | `@/components/ui/help-hint` | `label`; default slot = explanation | "What is this?" popover; copy lives in `lib/glossary.ts` `hints` |

Shared layout (`src/components/`): `PageFrame` (the one `<main id="main">`; `narrow`, `busy`), `PageHead` (`title`, `subtitle`,
`status`, `pending`, `section`; slot `actions`; the `h1` takes focus after navigation), `CapabilityNotice` (used by
`PageHead section`), `SectionTabs`, `AppBreadcrumbs` (`items`), `AppDialog` (`title`, `size` sm / md / lg / xl or `width`,
`busy`, `hideClose`; slot `actions` = sticky footer; focus on the first field or the dialog; `popover` mode stays until stage
0.2 lands `PreviewPanel`), `ConfirmDialog` (mounted once; use `askConfirm`), `AppToast` (mounted once), `OfflineBanner`,
`StatusChip` (`status`, `label`), `SessionEndedDialog` (mounted once; P1 wires `markSessionEnded()`), `StatusChangeDialog`
(props unchanged).

Libraries and stores: `lib/announcer.ts` (`say(text, mode?)`, `useAnnouncer()`), `lib/focus.ts` (`restoreFocus`,
`focusHeading`, `focusFirstInvalid`, `useFocusOnErrors`), `lib/format.ts` (`statusInfo(status)`, `formatDate`,
`formatDateTime`, `formatRelative`, `formatNumber`; `statusChipStyle` and `statusGlyph` kept, deprecated), `lib/errors.ts`
(`describeError(error, action)`), `lib/glossary.ts` (`glossary`, `hints`, `statusWord`), `lib/routeAnnouncer.ts` (installed
by `router.ts`), `stores/toast.ts` (`showToast(title, body?, tone?, { requestId?, persist? })`), `stores/connection.ts`,
`stores/navDrawer.ts`, `stores/sessionNotice.ts` (`markSessionEnded`, `clearSessionEnded`), `workspace/sections.ts`
(`sectionIcon`, Media top level, `{ divider: true }` entry).

Route meta: `title` (page name for the document title and "<page> loaded") and `bare`. Editors take their page name from their
own `h1`. `document.title` is "<page> · <Project> · iGuide CMS".

## 3. Migration checklist (old to new)

- `text-[Npx]`: use `text-xs` (12), `text-compact` (13), `text-sm` (14), `text-base`, `text-lg`; anything under 12 becomes 12.
- Hex and `text-gray-*`, `border-gray-*`, `bg-[#...]`: use the token colours above.
- `rounded-[Npx]`: `rounded-md` (controls) or `rounded-lg` (cards); `shadow-[...]`: `shadow-1/2/3`; `z-[N]`: named layers;
  `tracking-[...]`: none.
- `uppercase`, `font-extrabold`, tracked caps labels: sentence case, `font-semibold`; no eyebrow labels.
- Glyph icons (`✓ ✕ ☰ ⚠ ↗ ▾ ▲ ▼ └ ↳`): lucide icons, 16 px in text, 20 px in nav and alerts.
- `border-l-[3px] border-l-...` stripes: `Alert`.
- Hand-rolled pills and buttons: `Button` / `Chip`; `.dialog-primary`, `.field-input`, `.field-label`: `Button`, `Input`, `FormField`.
- `<main class="relative min-w-0 flex-1 overflow-y-auto px-4 pb-16 pt-6 md:px-7">`: `<PageFrame>`.
- `statusChipStyle` and `statusGlyph`: `<StatusChip :status>`.
- A control that is disabled with no explanation: `disabled-reason`.
- Links in running text are underlined by default; navigation links opt out with `no-underline`.

## 4. Contracts for parallel work (plan 6.2)

`EditorShell`, `TranslationsPanel`, `ListTable` and friends, `GeoMapCanvas` and `ResourcePreview` contracts are those of plan
6.2; stage 0.2 and 0.3 publish their components. Stage 0.1 provides `Button` (`variant`, `size`, `loading`, `disabledReason`,
`as-child`), `Alert` (`tone`, `title`, `requestId`, slots `actions`, default), `StateCard` (`icon`, `title`, `requestId`, slots
`default`, `actions`, `details`), `FormErrorSummary` (`summary`), `showToast(title, body?, tone?, options?)`,
`useAnnouncer().say(text, mode?)`. `FormDialog` is stage 0.3.

## 5. Verification commands

- Types: `make typecheck` (`vp exec vue-tsc -b`). Where `vp` is not installed (the WSL checkout has no `vite-plus`), run
  `node node_modules/vue-tsc/bin/vue-tsc.js -b`; the only error then is the `vite-plus` import in `vite.config.ts`.
- Build: `make build`; without `vp`, Windows Node with a config that omits `vite-plus`:
  `cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node node_modules\vite\bin\vite.js build --config <temp config>"`.
- Screens and probes: `ux-audit/round-1/implementation/W0.1/capture.mjs` (modes `shots`, `probe`, `keys`, `rm`), run with Windows Node.
- Gates: `grep -rnE 'text-\[[0-9.]+px\]|rounded-\[|shadow-\[|z-\[|tracking-\[|uppercase'` over the files a package owns must be empty;
  `/home/mirto/.claude/skills/impeccable/scripts/impeccable detect --json <files>`.

## List scaffold (stage 0.3)

Import from `@/components/list/*`. `useListQuery` (state in the URL: `q status pending lang missing cat featured sort dir`),
`useScrollRestore(ready)`, `useResultAnnouncer(shown, total, ready)`, `statusCounts`, `matchesStatus`; `ListToolbar` (props
`query counts languages searchPlaceholder sortOptions`, slot `filters` for Category / Featured via `FilterChoiceGroup`,
`CategoryFilterSelect`, `FeaturedFilterChip`), `ListTable` (`columns rows label query reorder depth hasChildren rowLabel openable
loading`; slots `cell-<key>`, `menu`; event `open`), `RowMenu` (`title actions reorder item reorderReason`; event `select`; key
`restore-order` means call `query.restoreManualOrder()`), `SetPositionDialog` (inside `RowMenu`), `ListEmpty`, `ListFooter`.
Pass `names` to `TranslationDots` in new lists. Reorder: `useReorder({ items, title, canReorder: query.canReorder, visible: (r) =>
matchesStatus(r, query.status.value), save, reload })`. Tree lists: rows in tree order plus `depth` and `hasChildren`. Extra chips for
the view's own filters: `query.chips([categoryChip], languages)`. ListTable renders the reorder live region; add none. Full file:
`W0.3/scratch/ListDemo.vue` (type-checked). The ~60 lines that matter:

```vue
<script setup lang="ts">
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage } = useProjectLanguages(projectId);
const pois = ref<Poi[]>([]); const loading = ref(true); const error = ref<ApiError | null>(null);
async function load() { /* try listPois(projectId.value) catch ApiError -> error */ }
watch(projectId, load, { immediate: true });

const query = useListQuery();                                   // URL-backed
const title = (p: Poi) => poiTitle(p, defaultLanguage.value);
const rows = computed(() => sortRows(pois.value.filter((p) =>   // view owns filtering and sorting
  matchesStatus(p, query.status.value) && (!query.pending.value || p.hasWorkingCopy) &&
  (!query.q.value.trim() || title(p).toLowerCase().includes(query.q.value.trim().toLowerCase()))), query));
const reorder = useReorder<Poi>({ items: pois, title, canReorder: query.canReorder,
  visible: (p) => matchesStatus(p, query.status.value), save: (ids) => saveOrder(projectId.value, "pois", ids), reload: load });
const ready = computed(() => !loading.value);
useScrollRestore(ready);
useResultAnnouncer(computed(() => rows.value.length), computed(() => pois.value.length), ready);
const columns: ListColumn[] = [{ key: "title", label: "Title", tree: true, sortKey: "title", class: "w-[44%]" },
  { key: "status", label: "Status", class: "w-40" }, { key: "translations", label: "Translations" }];
</script>
<template>
  <PageFrame>
    <PageHead title="Points of interest" subtitle="..."><template #actions><Button>New point of interest</Button></template></PageHead>
    <Alert v-if="error" tone="danger" :request-id="error.requestId">{{ error.message }}<template #actions><Button @click="load">Try again</Button></template></Alert>
    <div v-else class="rounded-lg border border-border bg-card shadow-1">
      <ListToolbar :query :counts="statusCounts(pois)" :languages search-placeholder="Search title, slug or code" :sort-options="SORTS" />
      <ListTable :columns :rows :loading :query :reorder :row-label="title" label="Points of interest" openable @open="(p) => router.push(editorRoute(p))">
        <template #cell-title="{ row }"><RouterLink :to="editorRoute(row)">{{ title(row) }}</RouterLink><p class="mono">{{ row.slug }}</p></template>
        <template #cell-status="{ row }"><StatusChip :status="row.status" /><StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" /></template>
        <template #cell-translations="{ row }"><TranslationDots names :languages :completeness="(c) => poiCompleteness(row, c)" /></template>
        <template #menu="{ row }"><RowMenu :title="title(row)" :actions="actionsFor(row)" :reorder :item="row" :reorder-reason="query.reorderReason.value" @select="onSelect" /></template>
      </ListTable>
      <ListEmpty v-if="!loading && !rows.length" noun="points of interest" empty-title="No points of interest yet" :filtered="pois.length > 0" :filters="query.chips([], languages)" @clear="query.clear()">One sentence of purpose.<template #actions><Button>New point of interest</Button></template></ListEmpty>
      <ListFooter :shown="rows.length" :total="pois.length" noun="points of interest" :filtered="query.isFiltered.value" legend @clear="query.clear()" />
    </div>
  </PageFrame>
</template>
```

## Map engine contract (P6, published before implementation; additive, defaults keep today's behaviour)

`GeoMapCanvas` (`@/components/map/GeoMapCanvas.vue`), `GeoPicker` and `RouteMap` keep every existing prop and event. New, all optional:

| Prop / event | Type, default | Meaning |
|---|---|---|
| `showZoomControls` | `boolean`, `true` | The one set of zoom buttons (Leaflet's, 44 px on a coarse pointer). A page must not draw a second set; pass `false` only if it draws none. |
| `contextMarkersFocusable` | `boolean`, `false` | Markers that are not `draggable` (context markers: other Places, other stops) get no Tab stop. Draggable markers are always focusable (one Tab stop each) and move with the arrow keys. |
| `announce` | `(text: string) => void`, polite announcer | Called for every marker or bounds-handle move ("Acropolis moved to 37.97150, 23.72570"). Pass your own to route to a page live region; the default already speaks through `useAnnouncer`. |
| `tileErrorCard` | `boolean`, `true` | The canvas draws the "The map background could not be loaded. [Try again]" card over a failed base map (the markers, bounds and coordinate fields stay usable). Pass `false` to draw your own from `tileState`. |
| event `tileState` | `[state: "loading" \| "ready" \| "error"]` | Base-map state; `loading` on mount and after Retry, `ready` when tiles/style have drawn, `error` when the style or a tile request failed. |
| event `markerMove` | `[key, lat, lng]` (existing) | Also emitted by keyboard nudges (arrow keys = about 2 px of screen, Shift = ten times). |
| event `boundsChange` | `[Bounds]` (existing) | Also emitted by keyboard nudges on a bounds handle. |
| exposed `retryTiles()` | `() => void` | Reloads the base map (used by the built-in card). |

Bounds handles (when `editBounds`): four corner handles and the centre handle are focusable buttons named "South-west corner of the area, arrow keys move it" etc.; arrows nudge (Shift 10x) and announce. `CanvasMarker` gains optional `warn?: boolean` (drawn with a dashed warning rim plus "!" badge, name suffixed "(outside the map area)"). On a coarse pointer, pins and handles have a 44 px hit area (the visible pin stays 26 px). Click-to-place copy in a page must say "Tap" on coarse pointers (`window.matchMedia("(pointer: coarse)")`).

## FormDialog (P3a, create dialogs)

`@/components/ui/dialog/FormDialog.vue`, on `AppDialog`. Frame of every create dialog (plan 2.4): Title (first, takes initial focus), the kind's
fields, slug behind an "Edit slug" disclosure (label stays "Slug", derived from the title until typed over, opens itself on a slug error),
one `FormErrorSummary` ("3 things to fix", links focus the field, request id) that takes focus on every failed attempt, sticky footer
(Cancel secondary, "Create and open" primary, `busy` shows progress and blocks Cancel/Esc). Also added: `index.ts` for `ui/field`, `ui/input`,
`ui/select`, `ui/checkbox`; `ui/select` now puts `id` and other attrs on the native `<select>` (only `style` stays on the wrapper).

Props: `heading intro noun defaultLanguage busy formError requestId submitLabel labels disabledReason`. Models: `v-model:title`, `v-model:slug`,
`v-model:errors` (key to message; `""` for a message without a field). Emits `close`, `submit` (only after Title and slug pass the frame's checks).
Default slot gets `{ id, errors }`: `id(key)` is the DOM id the summary focuses; pass it as `FormField :id="id('placeId')"`, and list the key's
summary label in `labels` (`{ placeId: "Place" }`). The parent validates its own fields into `errors`, calls the API and writes the answer into
`errors` / `formError` / `requestId`. Minimal use:

```vue
<FormDialog v-model:title="title" v-model:slug="slug" v-model:errors="errors" heading="New route" noun="route" intro="It starts as a draft."
  :default-language="defaultLanguage" :busy="submitting" :form-error="formError" :request-id="requestId" :labels="{ type: 'Setting' }"
  @close="emit('close')" @submit="submit">
  <template #default="{ id }">
    <FormField label="Setting" required :error="errors.type" :id="id('type')" v-slot="f"><Select v-model="type" :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid">...</Select></FormField>
  </template>
</FormDialog>
```
In `submit()`: `errors.value = {}` first (the frame already set none), check own fields, set `errors.value = { type: "..." }` and return. On a
`DUPLICATE_VALUE` set `errors.value = { slug: "..." }`; on 422 map `e.fieldMessages()`; anything else goes to `formError` with `e.requestId`.
For a choice with a legend use a `<fieldset :id="id('type')" :aria-invalid="errors.type ? 'true' : undefined">`.
