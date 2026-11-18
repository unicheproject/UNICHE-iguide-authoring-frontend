# W0-B addendum 3 (P5a requests)

Typecheck and `check-css-tokens` pass. Probes ran on the Route and Guide editors (admin, `UX-R3-W0B` records). Probe: `ux-audit/round-3/implementation/W0-B/probes/a3.mjs`.

| # | Fix | Probe result |
|---|---|---|
| 1 | `RemovedBar.vue`: the text is now `{{ label }}{{ " " }}removed.{{ more }}`, where `more` is a script `computed` with its leading space (a space written in the template was trimmed). The bar is in the Guide editor, with two blocks added and removed. | Guide with two removals: textContent is "Paragraph 1 removed. 1 more can be undone." (before: "removed.1 more"). |
| 1b | Bar position: it is `sticky bottom-2`. A sticky element docks only while its parent extends below the viewport. With a short list the parent ends inside the viewport, so the bar sits in flow at the end of its list (544–598 of 900 in the probe; 742–796 in P5a's). A true fixed dock would need caller changes in the Route, Guide and Event views, so I left it. | Not fixed. P5a/P5b can wrap the bar in a container that spans the form column if they want it pinned. |
| 2 | One announcement per removal: `role="status"` dropped from the bar's text (it is a labelled group), so `useUndoRemove`'s `say()` is the only one. | 0 `[role=status]` inside `[data-removed-bar]`. |
| 3 | `EditorStatusCard.vue`: the slug is cut after each hyphen with a `<wbr>`, plus `break-words` and a `title` (it was `break-all`). | Route slug renders `ux-<wbr>r3-<wbr>w0b-<wbr>route-<wbr>r2`, so it wraps only between words. |
| 4 | Verified: the shell skips `withGaps` whenever the editor passes its own `completeness`. This is the first addendum's fix and it covers the Route (`routeGaps`) and Guide (`storyGaps`) live models. | Route with 0 stops: 1 "no stops" line, not 2. Guide with an empty story: 1 "empty story" line, not 2. |

Not done: the header subtitle slug. The shell renders no visible subtitle, so there was nothing to change.

Files: `src/components/editor/RemovedBar.vue`, `src/components/editor/EditorStatusCard.vue`.
