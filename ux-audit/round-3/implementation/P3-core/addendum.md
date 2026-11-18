## P3-core addendum

- `ListToolbar` has a new optional prop `extraActive?: number`, default 0. It is added to the Filters badge count, so the button name reads "Filters N" (visible text first). The other lists are unchanged, and I changed no other `ListToolbar` API.
- `src/views/workspace/media/MediaView.vue`: the only edit is `:extra-active="extraFilters.length"` on the `ListToolbar`.
- Probe on `/media?alt=1&type=AUDIO` (admin): the button reads "Filters 2". `/media` with no filter reads "Filters".
- `vue-tsc` passes.
- Files: `src/components/list/ListToolbar.vue`, `src/views/workspace/media/MediaView.vue`, probe `ux-audit/round-3/implementation/P3-core/probes/media.mjs`.
