# P2 Dashboard and first run: changes

Typecheck (`vue-tsc -p tsconfig.app.json`) passes after the last edit (the earlier `DashboardView.vue` error was an unused function ref, fixed). `check-css-tokens` passes. `impeccable detect --json` on all changed files returns `[]`. The literal-gate grep over the owned files returns nothing. No commit, no install. Probes are in `implementation/P2/probes/`, shots in `after/`.

## C3 ids
- Fixed: C3-54, 55, 56 (with a deviation, see Deferred), 57, 58, 59, 60, 61, 62 (h1, thousands, one primary, guide copy; the header chip name belongs to P1), 63 (guide; the disclosure padding is `style.css`, not mine), 91 (Dashboard skeleton; Media and lists belong to others), and Q-022 handling.
- Partly: C3-48. All Dashboard links have a 44 px hit area (`.hit-44` ::after), but a bounding-rect check still reads under 44 px for 47 of 73 controls because the ::after box is not in the rect. Logo, lists and sort headers belong to others.

## Files changed
- `views/workspace/DashboardView.vue`
- `views/workspace/dashboard/`: `StatusCard.vue`, `FirstRunGuide.vue`, `guideState.ts`, `ContentCounts.vue`, `ProjectDetails.vue`, `PendingChanges.vue`, `ReadinessGroups.vue`
- `platform/dashboardData.ts`: new field `pendingError`. A failed Working Copies read no longer rejects the whole load.
- `DECISIONS.md`: D-112 appended. No new Q or G (Q-022 already exists).
- `ReadinessGroups` and the pending list wrap titles in `<bdi>`.
- No e2e spec referenced the Dashboard, so none changed (they cannot run here anyway).

## Acceptance, measured (admin; before = round-3 audit)
| Item | Before | After |
|---|---|---|
| SUSPENDED (mocked) | headline "Live, with N warnings" | "The visitor app is suspended"; no "Live" or "Ready"; chip "Suspended" |
| Settings 503, or an unknown status such as ARCHIVED (mocked) | "Live" | "The visitor app status is unknown"; line "could not be read"; the server's word is never printed |
| Launch placeholder | "Ready to go live, with 113 warnings" over "Launch is not available" | "Content is ready; going live is not available yet"; the HelpHint says the platform controls going live; "About Launch" and "Review warnings" are links |
| Tab order at 1024, Populated | counts card 4th in Tab order, jumps | 36 stops, 0 backtracks. The same at 768 (0 backtracks). At 1440 the Tab order is the left column, then the right column (as laid out). |
| Counts card at 1024 | 525 px tall | 191 px (limit 220); tiles are 3 per row |
| Pending card top at 1024 | y 917 | y 556 (limit 560). The Status sentence no longer repeats the pending count. |
| Status card secondary actions | filled, underlined link and bold ghost | one style (link) |
| Guide visits | steps 3 and 5 ticked after visiting Pages and Preview | After visiting pages, preview, navigation and launch on Trail, the steps are unchanged: places done, pois done, pages "Not available yet", navigation next, preview open |
| Guide progress | "n of 5" | Pristine "0 of 4 done"; Trail "2 of 4 done". Only one primary button on screen in each. Ends with "Next: activate the drafts that are ready" plus a secondary "Show drafts". |
| Dismiss and restore | no way back | Dismiss moves focus to the h1. "Show the guide again" appears in Project details and moves focus to the guide heading. The button is gone after use. |
| Blocked rows (mocked NAVIGATION, PROJECT, ROUTE with Arabic title, POI with two languages) | "PROJECT:" prefix, field name only | "Project settings: No surface is enabled…", "Ναός του Ποσειδώνα: Title is missing in Greek; Title is missing in English", "Main menu: Target points at something archived or deleted"; names in `<bdi>` |
| Errors | 403 offered "Try again"; 422 mentioned a form; one failed list blanked all | 403, 404 and 422: own sentence, request id, "Choose another Project", 0 retry buttons. 503: "busy or down for maintenance" with Try again. A pending-list 500 keeps the Status card and adds its own alert with Try again (1 retry). |
| h1 y | 3 px lower than other pages | Dashboard 80, Places 80, POIs 80 |
| Forced colours (1280, Trail) | current step number invisible | circle is Canvas with a 4 px ButtonText border, number visible (colour rgb(0,0,0)) |
| Skeleton | no status row, heights differ | The head row and the first card sit at the same positions while loading and loaded (h1 y 80, head 51 px, first block y 155 at 1440 and 1024). It mirrors the one- and two-column layouts and says "Loading dashboard". |
| axe (wcag2a/aa, 21a/aa) | n/a | none at 1440, 1024, 768 and zoom200 on Populated, Trail and Empty B |
| Hit areas at 1024 touch | 49 of 77 under 44 px | 1 of 73 left by ::after measure (the "Translations" link, since fixed with `hit-44`; not re-measured). Rect-only count 47 of 73 (see C3-48 above). |

Keyboard run: Tab at 1024, 768 and 1440 through the whole Dashboard, plus dismiss and restore by keyboard-activated buttons.

## System additions
No new tokens. `.forced-step-current` is applied to the guide's current-step circle. `aria-current="step"` moved from the `<li>` to the step title: the global forced-colours rule `[aria-current] *` forced white text onto the circle and beat `.forced-step-current` (a note for P1's Stepper, see below). `useGuideMemory` now exposes `dismissed`, `dismiss` and `restore`. `StatusCard` has prop `guideOpen`. `DashboardData.pendingError` is new.

## Deferred and deviations
- Q-022 asks for "n of 4". Step 5 (Preview) has no data, so by "never a visit" it never ticks. Progress therefore tops out at 3 of 4 until the drafts are activated, and then the guide hides. I kept the literal Q-022 wording. The orchestrator may prefer "n of 3" or ticking step 5.
- The layout uses a `matchMedia(min-width:1100px)` flag and two column wrappers, not named grid areas. The DOM order is then the visual order in both layouts, and there is no duplicated markup.
- Launch page subtitle and the "Disclosure padding" (C3-63 part) are outside my files.

## Notes for others
- P1: if the Stepper puts `aria-current` on an ancestor of the circle, forced colours will hide the number as it did here. Put it on the title text, as the guide now does.
- The Status card no longer repeats the pending count (the card below says it).
