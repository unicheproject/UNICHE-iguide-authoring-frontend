# Round 2 consolidated audit findings

Date: 2026-11-16. Consolidator of 14 round-2 reports (p1-editor, p2-manager, p3-translator, p4-kiosk, p5-a11y, s7-chrome, s8-dashboard, s9-lists, s10-poi-place, s11-editors, s12-maps partial, s13-media, s14-preview, design-system + `design-system/cleanup.md`). **p6-edge has scripts and 113 shots but no report**, so the error/edge-case persona is not represented. Most agents' Write calls were refused; their reports were saved by the orchestrator (some condensed). Original IDs are `R2-<agent>-NN` (p1 is `R2-p1-editor-NN`, s7 is `R2-s7-chrome-NN`). Every one of the 234 original findings is mapped to exactly one `C2-nn` (checked by script: 0 missing, 0 duplicated, cluster severity = highest member severity).

## Totals

| | Unique (de-duplicated C2) | Original reports |
|---|---|---|
| P0 | **0** | 0 |
| P1 | **30** | 47 |
| P2 | **55** | 117 |
| P3 | **8** | 70 |
| Total | **93** | 234 |

Open P1 clusters: C2-01, 02, 05, 06, 07, 09, 16, 24, 25, 26, 27, 28, 33, 34, 36, 37, 38, 51, 57, 58, 59, 60, 61, 62, 75, 76, 77, 84, 88, 89. All five round-1 P0s (C1-06, 41, 42, 59, 81) are closed (C1-41 fixed by p2, partly by s8: C2-26). **10 root causes** are marked ROOT below: C2-01, 02, 05, 07, 09, 33 (with sibling C2-34), 52, 57, 58, 59.

### The 10 most impactful problems

1. `size-control` is never generated, so every icon-only button (row kebab, editor "More actions", sort, reorder) is 18×18 px on every list and editor, and the main route to Activate/Archive/Move on a tablet is untappable (C2-01, ROOT, one-line config fix).
2. The editor's sticky header + Working Copy banner takes 43-66 % of a 200 % zoom or short screen and covers the focused field and controls (C2-05, ROOT; lists 26-43 % in C2-06).
3. The Dashboard still cannot say how the visitor app goes live: no next step, a green "Active" chip beside "App: Draft", and the first-run guide vanishes after two drafts (C2-24, C2-25, C2-26).
4. Focus falls to `<body>` after Activate, attaching an image, Restore/Discard, Archive, Upload anyway and Reset (C2-57, ROOT; C1-77 still open).
5. Readiness is counted four ways, and completeness ignores Route stop texts, Guide story blocks and a DRAFT image's missing alt text (C2-33 ROOT, C2-34).
6. The header "App: Draft" chip stays a skeleton after any reload, and the tab title loses the Project name on deep links (C2-07, ROOT: projects-store race).
7. Raw server `detail` is echoed in error cards and toasts, and a 503 is called "platform not reachable" (C2-09, ROOT; BRIEF hard constraint; 403/404 on save still has no cause, C2-10).
8. A POI's own QR/geo trigger counts as "used by" and blocks Deactivate, with the garbled sentence "Remove it from it first" (C2-59, ROOT).
9. "Test in preview" fires nothing; "Preview in app" is drawn at 24-29 % and its Expand bar covers Apply changes (C2-61, C2-89, C2-88).
10. The POI/Place map adds ~40-47 unnamed Tab stops, 70 Shift+Tabs from Save (C2-58, ROOT). Runners-up: Updated sort oldest-first (C2-36), Media list overprint (C2-75), two create dialogs silently creating the wrong record (C2-38).

## Round-1 fix status

One row per `C1-nn` rated by any round-2 agent (all 125 were rated by at least one). Final status = worst credible rating; where agents differ the table says so. Agents: p1 editor, p2 manager, p3 translator, p4 kiosk, p5 a11y, s7 chrome, s8 dashboard, s9 lists, s10 POI/Place, s11 editors, s12 maps (partial), s13 media, s14 preview, ds design-system. "not verified" in the ratings column means that agent did not exercise it.

**Counts: fixed 39, partly 72, not fixed 13, regressed 1, not verified 0** (of 125). Every P0 is fixed or partly; the 13 not fixed are C1-11, 16, 21, 27, 39, 47, 48, 65, 77, 80, 99, 122, 123; regressed: C1-111.

| C1 | Final status | Agent ratings | Note |
|---|---|---|---|
| C1-01 | **fixed** | ds fixed |  |
| C1-02 | **partly** | ds partly |  |
| C1-03 | **fixed** | ds fixed |  |
| C1-04 | **fixed** | ds fixed |  |
| C1-05 | **fixed** | ds fixed |  |
| C1-06 | **fixed** | p5 fixed, ds fixed |  |
| C1-07 | **fixed** | p5 fixed, ds fixed |  |
| C1-08 | **partly** | p5 fixed, s10 partly, ds partly | Agents differ: p5 fixed, s10 partly, ds partly; worst credible taken. |
| C1-09 | **fixed** | p5 fixed, ds fixed |  |
| C1-10 | **partly** | p1 partly, ds partly |  |
| C1-11 | **not fixed** | p1 not fixed, s10 partly, s11 partly, ds fixed | Visual weight fixed (outline Deactivate); own triggers still count as 'used by' and block Deactivate. p1 not fixed; s10, s11 partly; ds fixed (visual). C2-59. |
| C1-12 | **partly** | p1 partly, s10 partly, s11 partly, ds fixed | Agents differ: p1 partly, s10 partly, s11 partly, ds fixed; worst credible taken. |
| C1-13 | **partly** | p1 partly, s9 partly |  |
| C1-14 | **partly** | p1 partly, s9 fixed | Agents differ: p1 partly, s9 fixed; worst credible taken. |
| C1-15 | **fixed** | p1 fixed, s9 fixed |  |
| C1-16 | **not fixed** | p1 not fixed, s9 not fixed | Deferred (Q-016 area); no bulk selection. |
| C1-17 | **partly** | p1 fixed, s9 partly | Agents differ: p1 fixed, s9 partly; worst credible taken. |
| C1-18 | **partly** | p1 fixed, s9 partly | Agents differ: p1 fixed, s9 partly; worst credible taken. |
| C1-19 | **partly** | p1 fixed, s9 partly | Agents differ: p1 fixed, s9 partly; worst credible taken. |
| C1-20 | **partly** | p1 partly, s9 partly |  |
| C1-21 | **not fixed** | p1 partly, p3 partly, s9 not fixed | Cross-language match invisible. s9 not fixed; p1, p3 partly. C2-48. |
| C1-22 | **partly** | p1 fixed, p4 partly, p5 fixed, s10 fixed, s11 fixed | Bar stays, typing does not shift. p4 partly (short screens 54 % of 400 px); p1, s10, s11, p5 fixed. New zoom200 P1 C2-05. |
| C1-23 | **partly** | p1 partly, s10 not verified | Others: not verified. |
| C1-24 | **partly** | p1 partly, s10 partly, s11 fixed | Agents differ: p1 partly, s10 partly, s11 fixed; worst credible taken. |
| C1-25 | **partly** | p1 fixed, s10 partly | Agents differ: p1 fixed, s10 partly; worst credible taken. |
| C1-26 | **partly** | p1 partly, s10 partly, s11 partly |  |
| C1-27 | **not fixed** | s10 not fixed | Two Restore buttons, stale hint. s10 only. C2-64. |
| C1-28 | **partly** | s9 partly, s10 fixed | Agents differ: s9 partly, s10 fixed; worst credible taken. |
| C1-29 | **partly** | p1 partly, s10 partly, s11 fixed | Agents differ: p1 partly, s10 partly, s11 fixed; worst credible taken. |
| C1-30 | **fixed** | p1 fixed, s10 fixed |  |
| C1-31 | **partly** | p1 fixed, s10 partly | Agents differ: p1 fixed, s10 partly; worst credible taken. |
| C1-32 | **partly** | p1 partly, s10 partly, s11 partly |  |
| C1-33 | **fixed** | p1 fixed, s10 not verified | Others: not verified. |
| C1-34 | **partly** | p1 fixed, p3 fixed, s10 fixed, s11 partly | Source beside target works. s11 partly (Event tab exposes structural fields), others fixed. C2-55. |
| C1-35 | **partly** | p1 fixed, p3 partly | Worklist works in six lists; Media rows silent, no Asset Translations card (p3 partly; p1, s13 fixed). C2-51. |
| C1-36 | **partly** | p1 fixed, p3 partly, s10 partly | Agents differ: p1 fixed, p3 partly, s10 partly; worst credible taken. |
| C1-37 | **partly** | p1 fixed, p3 partly, s9 partly | Agents differ: p1 fixed, p3 partly, s9 partly; worst credible taken. |
| C1-38 | **fixed** | p1 fixed, p3 fixed, p5 fixed, s10 fixed |  |
| C1-39 | **not fixed** | p1 partly, p3 not fixed, s11 partly | p3 not fixed (three formats on a page); p1, s11 partly. C2-52. |
| C1-40 | **partly** | p3 partly, p5 fixed, s10 fixed | Agents differ: p3 partly, p5 fixed, s10 fixed; worst credible taken. |
| C1-41 | **partly** | p2 fixed, s8 partly | Agents differ: p2 fixed, s8 partly; worst credible taken. |
| C1-42 | **fixed** | p2 fixed, s8 fixed |  |
| C1-43 | **partly** | p2 fixed, s8 partly | Agents differ: p2 fixed, s8 partly; worst credible taken. |
| C1-44 | **partly** | p2 partly, s8 fixed | Agents differ: p2 partly, s8 fixed; worst credible taken. |
| C1-45 | **partly** | p2 fixed, s8 partly | Agents differ: p2 fixed, s8 partly; worst credible taken. |
| C1-46 | **fixed** | p2 fixed, s8 fixed |  |
| C1-47 | **not fixed** | p2 not fixed, s8 not fixed | Documented absence (G-023). |
| C1-48 | **not fixed** | p2 not fixed, s8 not fixed | Documented absence (G-024). |
| C1-49 | **partly** | p2 partly, s8 partly |  |
| C1-50 | **partly** | p2 partly, s8 partly |  |
| C1-51 | **fixed** | p2 fixed, s8 fixed |  |
| C1-52 | **fixed** | p2 not verified, s8 fixed | Others: not verified. |
| C1-53 | **partly** | p2 fixed, s7 partly | Agents differ: p2 fixed, s7 partly; worst credible taken. |
| C1-54 | **partly** | p2 partly, s7 partly |  |
| C1-55 | **partly** | p2 partly, s7 partly |  |
| C1-56 | **fixed** | p2 fixed, s7 fixed |  |
| C1-57 | **partly** | p2 fixed, p5 partly, s7 partly | Agents differ: p2 fixed, p5 partly, s7 partly; worst credible taken. |
| C1-58 | **partly** | p2 not verified, s7 partly | Others: not verified. |
| C1-59 | **fixed** | p2 fixed, s7 not verified | Others: not verified. |
| C1-60 | **partly** | p2 partly, s7 fixed | Agents differ: p2 partly, s7 fixed; worst credible taken. |
| C1-61 | **partly** | p2 partly, s7 partly |  |
| C1-62 | **fixed** | p2 fixed, s7 fixed |  |
| C1-63 | **partly** | p2 partly, s7 partly |  |
| C1-64 | **partly** | p2 not verified, s7 partly | Others: not verified. |
| C1-65 | **not fixed** | p2 not fixed, s7 not verified, s10 not fixed | p2 and s10 not fixed; raw detail, no cause/action. C2-09, C2-10. |
| C1-66 | **partly** | p2 partly, s7 partly |  |
| C1-67 | **partly** | p2 partly, p5 fixed, s7 partly | Agents differ: p2 partly, p5 fixed, s7 partly; worst credible taken. |
| C1-68 | **partly** | p2 not verified, s7 partly | Others: not verified. |
| C1-69 | **fixed** | p5 fixed, s9 fixed |  |
| C1-70 | **partly** | p5 fixed, s9 partly | Agents differ: p5 fixed, s9 partly; worst credible taken. |
| C1-71 | **partly** | p5 partly, s9 fixed, s10 partly, s11 partly | Agents differ: p5 partly, s9 fixed, s10 partly, s11 partly; worst credible taken. |
| C1-72 | **partly** | p5 partly, s10 not verified, s12 fixed | Agents differ: p5 partly, s10 not verified, s12 fixed; worst credible taken. |
| C1-73 | **partly** | s10 partly |  |
| C1-74 | **partly** | s10 partly |  |
| C1-75 | **partly** | p5 fixed | p5 fixed; s9-17: at zoom200 create dialog body shows about 2 lines. C2-44. |
| C1-76 | **partly** | p1 fixed, p5 fixed, s7 partly | Agents differ: p1 fixed, p5 fixed, s7 partly; worst credible taken. |
| C1-77 | **not fixed** | p1 partly, p5 partly, s7 partly, s10 not fixed | s10 not fixed (Activate, attach, Restore, Archive); p1, p5, s7 partly. C2-57. |
| C1-78 | **partly** | p5 fixed, s7 not verified, s9 partly | Agents differ: p5 fixed, s7 not verified, s9 partly; worst credible taken. |
| C1-79 | **fixed** | p5 fixed, s11 fixed |  |
| C1-80 | **not fixed** | p1 fixed, p5 partly, s10 not fixed, s12 not verified | Names fixed; ~40-47 unnamed map Tab stops remain (p5 partly, s10 not fixed, p1 fixed 'limited'). C2-58. |
| C1-81 | **fixed** | p4 fixed, p5 fixed, s14 fixed |  |
| C1-82 | **fixed** | p4 fixed, s14 fixed |  |
| C1-83 | **partly** | p4 partly, s14 partly |  |
| C1-84 | **fixed** | p4 fixed, s14 fixed |  |
| C1-85 | **fixed** | p4 fixed, p5 fixed, s14 fixed |  |
| C1-86 | **partly** | p3 fixed, p4 partly, p5 fixed, s10 fixed, s14 partly | p3, p5, s10 fixed; p4, s14 partly (24-29 % at desktop, no Expand on tablet, Expand covers header). C2-88, C2-89. |
| C1-87 | **fixed** | p4 fixed, s14 fixed |  |
| C1-88 | **partly** | p4 fixed, p5 fixed, s14 partly | Agents differ: p4 fixed, p5 fixed, s14 partly; worst credible taken. |
| C1-89 | **fixed** | p4 fixed, s14 fixed |  |
| C1-90 | **partly** | p4 partly, s14 partly |  |
| C1-91 | **partly** | p4 partly, s10 fixed | Agents differ: p4 partly, s10 fixed; worst credible taken. |
| C1-92 | **fixed** | p4 fixed, s10 fixed |  |
| C1-93 | **fixed** | s12 fixed |  |
| C1-94 | **fixed** | p5 fixed, s12 fixed |  |
| C1-95 | **fixed** | s12 fixed |  |
| C1-96 | **partly** | p4 partly, s12 partly |  |
| C1-97 | **fixed** | p4 fixed, s12 not verified | Others: not verified. |
| C1-98 | **partly** | p4 partly, p5 fixed, s12 not verified | Agents differ: p4 partly, p5 fixed, s12 not verified; worst credible taken. |
| C1-99 | **not fixed** | p4 partly, s12 not fixed | Copy, pin and zoom 44 px fixed; swipe over the map still pans, page cannot scroll. s12 not fixed, p4 partly. C2-84. |
| C1-100 | **fixed** | s12 fixed |  |
| C1-101 | **partly** | p5 partly, s11 fixed | Agents differ: p5 partly, s11 fixed; worst credible taken. |
| C1-102 | **fixed** | p5 fixed, s11 fixed |  |
| C1-103 | **fixed** | s11 fixed |  |
| C1-104 | **fixed** | p5 fixed, s11 fixed |  |
| C1-105 | **partly** | s11 partly |  |
| C1-106 | **partly** | s11 partly |  |
| C1-107 | **partly** | s13 partly |  |
| C1-108 | **partly** | p1 fixed, p3 partly, s13 fixed | Agents differ: p1 fixed, p3 partly, s13 fixed; worst credible taken. |
| C1-109 | **partly** | s13 partly |  |
| C1-110 | **partly** | p1 partly, s13 fixed | Agents differ: p1 partly, s13 fixed; worst credible taken. |
| C1-111 | **regressed** | p1 regressed, s13 fixed | p1 regressed (list view overprints); s13 rates thumbnails fixed but files the overprint as P1 (R2-s13-01, under C1-118). C2-75. |
| C1-112 | **partly** | p1 partly, s13 fixed | Agents differ: p1 partly, s13 fixed; worst credible taken. |
| C1-113 | **fixed** | p1 fixed, s13 fixed |  |
| C1-114 | **fixed** | p1 fixed, p5 fixed, s13 fixed |  |
| C1-115 | **fixed** | s13 fixed |  |
| C1-116 | **partly** | s13 partly |  |
| C1-117 | **partly** | p1 fixed, p5 partly, s13 partly | Agents differ: p1 fixed, p5 partly, s13 partly; worst credible taken. |
| C1-118 | **partly** | s13 partly |  |
| C1-119 | **fixed** | p1 fixed, p4 fixed, s7 fixed, s11 fixed |  |
| C1-120 | **partly** | p1 fixed, p4 partly, s9 fixed | Agents differ: p1 fixed, p4 partly, s9 fixed; worst credible taken. |
| C1-121 | **partly** | p1 partly, p4 fixed, s10 partly | Agents differ: p1 partly, p4 fixed, s10 partly; worst credible taken. |
| C1-122 | **not fixed** | p1 not fixed, p4 fixed, s7 fixed, s10 not fixed | p1, s10 not fixed (zoom200 sticky stack); p4, s7 fixed at 1024/768. C2-05. |
| C1-123 | **not fixed** | p4 partly, s7 fixed, s9 not fixed, s11 partly, s12 partly, ds partly | s9 not fixed (icon buttons 18 px); p4, s11, s12, ds partly; s7 fixed (chrome). Root C2-01. |
| C1-124 | **partly** | p2 partly, s7 partly |  |
| C1-125 | **partly** | p1 partly, s7 partly |  |

## De-duplicated findings (C2)

Each entry: highest severity, ROOT where one defect explains several findings, screens in the first bullet, `Merged` = original IDs, then the consolidated fix, likely files, spec or constraint notes and effort. Agents are readable from the merged IDs (p1-editor = p1, s7-chrome = s7).

## A. Design-system and CSS root causes

### C2-01 · P1 · ROOT · `size-control` is never generated: every icon-only button is 18×18
- Screens: every list row ⋮, editor "More actions" ⋮, sort headers, reorder arrows, Maps, Dashboard links; 1440 and touch.
- Merged: R2-ds-01, R2-ds-04, R2-s9-01, R2-p4-02, R2-s12-04
- Fix: add `spacing.control` (or `size.control`) in `tailwind.config.js`, or use `h-control w-control p-0` in the `icon` variant; remove per-call `size-8`/`min-h-8` patches; `min-h-header` in WorkspaceNav is the same class of bug (`h-header`). Extend with the non-icon touch targets p4 measured under 44 px (row title links 21 px, Dashboard item links 18 px, visibility checkboxes 20 px, Leaflet attribution 14 px): 44 px hit area via padding or `::after`. Add a CSS-build test (every `size-*|h-*|w-*|min-h-*|z-*` token in `ui/**` has a rule) and an e2e (icon-only button >= 32 px, 44 px coarse).
- Files: `tailwind.config.js` 130-140, `src/components/ui/button/index.ts:48`, `WorkspaceNav.vue:96`, `editor/ReorderControls.vue`, `editor/RemovedBar.vue`, `media/MediaSlots.vue`, list row menu components, `EditorShell.vue`, `src/style.css` coarse block.
- Spec/constraint: `14` line 119 (44×44 touch), D-072, D-083, PRODUCT.md tablets. Effort: S for the root, M for the other targets.

### C2-02 · P1 · ROOT · Forced-colours block is incomplete: dialogs, popovers, menus, toasts and alerts have no boundary; primary and selected states are weak
- Screens: every dialog (create, upload, Describe now, confirm), popovers, Preview tabs, POI editor Apply/Save, Practical details row, sort headers.
- Merged: R2-ds-02, R2-ds-11, R2-s7-chrome-08, R2-s10-17, R2-p4-07, R2-s14-08, R2-p5-14, R2-s9-25
- Fix: one 1 px `CanvasText` border for `[role=dialog]`, `alertdialog`, `menu`, popover, toast, Alert; filled buttons keep a 2 px `Highlight` border or ButtonText/Highlight fill; `[aria-selected=true]` gets `Highlight` background + `HighlightText` (or a leading check) for every TabsTrigger group; padding on the disclosure and sort-header boxes.
- Files: `src/style.css` forced-colours block (~L418-448), `AppDialog.vue:108`, `ui/tabs`, `ui/button`, `ListTable` header.
- Spec/constraint: `14` §4 state not by colour alone; C1-08 (partly). Effort: S.

### C2-03 · P2 · Out-of-scope vocabulary, dead components, legacy aliases and literals still present
- Screens: Visitor-app screens (flag only, out of scope), preview shells, `ReorderControls` duplicate, dead filter chain.
- Merged: R2-ds-03, R2-ds-05, R2-ds-06, R2-ds-07, R2-ds-09, R2-s11-12
- Fix: follow `design-system/cleanup.md` sections B-D now (delete dead files and aliases, `ListSelect` as a variant of `ui/select`, `shadow-drop-*` and `z-raised` tokens, lucide for the preview-shell glyphs, hex to `--destructive`/`--success`); section E (Translations, Navigation, Languages, Overview, Surfaces) only when the owner opens that scope; section F gates in CI.
- Files: see `cleanup.md` (file:line). Spec/constraint: Content scope memory (flag items outside it); D-072. Effort: S per item, M for the mechanical migration.

### C2-04 · P3 · Reduced motion is a blunt 1 ms global kill
- Merged: R2-ds-08
- Fix: keep 120 ms opacity fades, drop only transform/spin; recheck the 3 px dark outline sampled under reduce on the first Tab stop.
- Files: `src/style.css`. Effort: S.

## B. Sticky chrome and zoom

### C2-05 · P1 · ROOT · Editor sticky stack (header + Working Copy banner) takes 20 % at 1440 and 43-66 % at zoom 200 or short screens, hides the focused field and sticky controls
- Screens: all six editors, POI editor at 1280×720, 1024×768, 768×400, zoom200; Asset editor; picker task at 200 %.
- Merged: R2-p1-editor-06, R2-p4-05, R2-p5-04, R2-s10-05, R2-s11-01, R2-s13-20, R2-ds-10
- Fix: one rule: below ~700 px height or zoom >= 150 % the Working Copy banner is non-sticky (or merged into the header, the Q-008 idea, no spec change needed for the collapse) and one line ("Working Copy · saved 16:11 · Save draft · Discard"); `scroll-padding-top`/`scroll-mt` from the measured stack height (the `--editor-sticky-h` 96 px constant is wrong); stop the 56 -> 63 px jump when the banner text wraps; add `z-raised` below `z-sticky` (Route editor `z-index: 10`, PreviewApp `z-10` tie).
- Files: `EditorShell.vue`, `WorkingCopyBanner.vue`, `src/style.css`, `RouteEditorView.vue:787`.
- Spec/constraint: `14` §4 200 % scaling, WCAG 1.4.10/2.4.7; C1-22/C1-122. Effort: S-M.

### C2-06 · P1 · List sticky toolbar plus header takes 26-43 % of the viewport and leaves a sliver of the previous row
- Screens: six lists at 1440 and 1280×720 (POI list worst, ~4 rows visible).
- Merged: R2-p1-editor-15, R2-s9-04
- Fix: stick only the title row + thead (~100 px) at top 56; filters in one row or a popover; fix the 24 px offset sliver.
- Files: `ListToolbar.vue`, `list-table.css`. Spec: PRODUCT.md speed. Effort: M.

## C. Projects store race and picker state

### C2-07 · P1 · ROOT · Projects store race: header "App: Draft" chip stays a skeleton after reload/deep link, and the tab title loses the Project name
- Screens: every route after reload or deep link (also 403/404/5xx pages, lists, editors, Media); Empty B/C/D 4 of 4, Populated 3 of 4.
- Merged: R2-p2-01, R2-s7-chrome-01, R2-s7-chrome-02, R2-p4-10, R2-s13-14, R2-s9-24
- Fix: `loadProjects()` (started in App.vue) finishes after `ProjectLayout.load()` and replaces `state.groups` with the undetailed listing; merge detailed entries in `doLoad` or call `ensureDetailed([currentId])`; take chip and title from the Project detail the layout already holds; time-box the skeleton (accessible "Loading app status"), show nothing on read failure or error pages; fix `routeAnnouncer` so the title never drops the Project name.
- Files: `stores/projects.ts`, `ProjectLayout.vue`, `ProjectSwitcher.vue`, `lib/routeAnnouncer.ts`. Spec/constraint: WCAG 2.4.2; C1-61 sub-item regressed. Effort: S-M.

### C2-08 · P2 · Picker grouping, "Needs setup" counts and status chips depend on lazy reads
- Screens: Home, switcher.
- Merged: R2-p2-06, R2-p2-17, R2-s7-chrome-07
- Fix: provisional count or read before grouping; em dash or "Setup not checked" for unknown status; chips mean "known", not status, so label them; abandoned Project must appear in "Needs setup" consistently (G-029 limits it).
- Files: `ProjectList.vue`, `stores/projects.ts`. Spec: backend `initialized` (G-029, existing). Effort: M.

## D. Errors, session, offline and chrome

### C2-09 · P1 · ROOT · Raw server `detail`/problem title echoed in error UI; 503 diagnosed as "platform not reachable" (BRIEF hard constraint)
- Screens: Dashboard error card, library 503, upload 503, Preview 503, toasts, 403 on lists ("could not be loaded | no"), save errors.
- Merged: R2-p2-04, R2-s8-10, R2-s13-10, R2-s13-22, R2-p4-12
- Fix: `describeError` maps by `code`/status to fixed sentences plus `requestId`; show `detail` only for 422 field errors; 503 = "The platform is busy or down for maintenance", "not reachable" only for network failures; drop the stale "still loading" announcement on 503. (Examples seen: "NullPointerException at ReadinessReport.java:88", "Not allowed for secret-user-123".)
- Files: `platform/api.ts` describeError, `DashboardView.vue errorText`, `PreviewView.vue`, `MediaView.vue`, `UploadDialog.vue`, list views, editor save handlers, shared problem card. Spec/constraint: BRIEF "errors matched on code, requestId shown, rejected value never echoed". Effort: M.

### C2-10 · P2 · 403/404 on save and refused activation give no cause and no action; wrong verb
- Merged: R2-s10-15
- Fix: map 403/404 on write to "You no longer have access / this record was removed" + one action; an activation refusal shows inside the dialog (D-074) and says "not activated", not "not saved"; carried-over C1-65 (P1 in round 1) is still not fixed.
- Files: `useResourceEditor.ts`, `ActivateDialog.vue`, `StatusChangeDialog.vue`. Effort: S-M.

### C2-11 · P2 · Offline: banner shifts layout, claims controls are disabled while they stay live, stale and triple alerts
- Merged: R2-s7-chrome-05, R2-p2-11, R2-s10-16, R2-p5-13
- Fix: reserve the banner slot; `aria-disabled` on mutating controls from the connection store (Ctrl+S too); one alert; clear "not saved" on "Back online".
- Files: `OfflineBanner.vue`, `PageFrame.vue`, connection store, `EditorShell.vue`. Effort: S-M.

### C2-12 · P2 · Toasts: identical errors stack, contradictory pairs, double announcement, cover side cards and footers
- Merged: R2-s7-chrome-12, R2-p1-editor-09, R2-s10-11
- Fix: collapse identical toasts with a count; offset above sticky footers; one announcement (not role=alert plus assertive say()); one Save = header state + live region, toast only for errors; no 12 h time; body never server `detail`.
- Files: `AppToast.vue`, `stores/toast.ts`, `EditorShell.vue`. Effort: M.

### C2-13 · P2 · Error and unknown-route states: focus on body, stale header, invalid id shows 500
- Merged: R2-s7-chrome-10, R2-s7-chrome-19, R2-s14-11
- Fix: focus the StateCard h1; clear Project label/chip on 404; `/projects/not-a-uuid` -> 404; unknown routes and `/app-preview/nothing` show not-found; announcer must not say "Places loaded" over the "keeps ending" page; 404 copy links the Portal.
- Files: `StateCard`, `ProjectLayout.vue`, router. Effort: S.

### C2-14 · P2 · Authorization code and state stay in the address bar after sign-in
- Merged: R2-p2-05, R2-s7-chrome-04
- Fix: `history.replaceState` after keycloak init (hash 266 chars, 4 history entries, Back returns to it).
- Files: `platform/auth.ts`. Spec/constraint: auth hard constraint (tokens in memory). Effort: S.

### C2-15 · P3 · Session and chrome small items
- Merged: R2-p2-14, R2-p2-18, R2-s7-chrome-15, R2-s7-chrome-17
- Fix: return to last Project automatically or one click; session-ended dialog dismissible with Esc and a secondary action; Home repeats the Project three times; switcher shows ~4 of 37 rows (`max-height: calc(100dvh - 8rem)`).
- Files: `ProjectList.vue`, `SessionEndedDialog`. Effort: S.

### C2-16 · P1 · Switcher dialog has no accessible name (axe `aria-dialog-name`, serious); empty `aria-controls`
- Merged: R2-s7-chrome-03, R2-p5-10
- Fix: `aria-labelledby` reaching the `role=dialog` through PopoverContent; remove empty `aria-controls`.
- Files: `ui/popover/*`, `ProjectSwitcher.vue`. Spec: `14` §4. Effort: S.

### C2-17 · P2 · User menu has no keyboard model
- Merged: R2-p5-05
- Fix: Radix dropdown pattern (ArrowDown/Esc, focus return).
- Files: `UserMenu.vue`. Effort: S.

### C2-18 · P2 · Leave-confirm opened from the switcher: focus stays outside the dialog; Esc returns to the editor h1
- Merged: R2-s7-chrome-06
- Fix: ConfirmDialog claims focus after the popover's focus return; Esc returns to the opener.
- Files: `ProjectSwitcher.vue`, `ConfirmDialog.vue`. Effort: S.

### C2-19 · P2 · "Off" nav items grow to 4-9 lines and repeat their name
- Merged: R2-s7-chrome-11
- Fix: one line + chip, reason on the destination page and in `aria-describedby`.
- Files: `WorkspaceNav.vue`. Effort: S.

### C2-20 · P2 · Every dialog adds duplicate landmarks (`<header>` in AppDialog)
- Merged: R2-s7-chrome-13, R2-s13-15
- Fix: use a `div` in AppDialog/user menu (axe `landmark-no-duplicate-banner`, `landmark-unique`).
- Files: `AppDialog.vue`, `UserMenu.vue`. Effort: S.

### C2-21 · P2 · Loading states: skeletons not mirrored or announced, false zeros, nav clickable before the Project is confirmed, splash mismatch
- Merged: R2-s8-11, R2-s7-chrome-09, R2-p2-12, R2-s9-09, R2-s7-chrome-14
- Fix: hidden "Loading X" status; route-aware skeleton that mirrors the final layout; hide counts until loaded; inert nav until the Project is confirmed; one logo asset; logo twice on sign-in; header logo link reloads the page; IdP-down shows the splash 8-10 s; list loading shows thead and no live toolbar.
- Files: `ProjectLayout.vue`, `DashboardView.vue`, `ListToolbar.vue`, splash/sign-in views. Effort: M.

### C2-22 · P2 · Create Project wizard: silent defaults and copy
- Merged: R2-p2-07, R2-s7-chrome-16
- Fix: no preselection (or one "Recommended"); same surface words everywhere; HelpHint for "style"; step 1 says it creates a real record; native select for "Add a language"; zoom200 head + stepper fill the fold; wording of title/h1/button.
- Files: `StepTemplate.vue`, `useCreateProject.ts`, `StepName.vue`. Effort: S.

### C2-23 · P2 · Placeholders that look like values (slug, Latitude/Longitude, beacon UUID)
- Merged: R2-p2-13, R2-s10-19, R2-p5-08
- Fix: pale "e.g." example or none; never the map centre as a placeholder.
- Files: `StepName.vue`, `GeoPicker.vue`/Placement card, `TriggersCard.vue`. Spec: `14` §4 (placeholder never the label; also never a value). Effort: S.

## E. Dashboard

### C2-24 · P1 · Status card never says how the visitor app goes live
- Screens: Dashboard Populated ("Ready with 366-410 warnings", only "Review warnings"), drafts-only.
- Merged: R2-s8-01, R2-p2-02
- Fix: no blockers and ACTIVE > 0 -> primary "Go to Launch" with one sentence "Visitors still see nothing: the visitor app is in Draft"; warnings secondary; "Ready" offers Preview too.
- Files: `dashboard/StatusCard.vue`. Spec: `12` §3 (one action). Effort: S.

### C2-25 · P1 · "Active" means three things: Project "Active" chip beside the h1 contradicts "App: Draft" / "Nothing is live yet"
- Merged: R2-s8-02, R2-p2-03, R2-s7-chrome-20
- Fix: drop the Catalogue Project status chip from the Dashboard h1; show "Visitor app: Draft/Live · Content revision N" with a HelpHint; a new Project is not "Active".
- Files: `DashboardView.vue`, `PageHead.vue`, `ProjectSwitcher.vue`. Spec: C1-54 still partly. Effort: S.

### C2-26 · P1 · First-run guide: vanishes once a DRAFT Place and POI exist, buttons open the list not the dialog, "Activate content" is a filter
- Merged: R2-s8-04, R2-s8-05, R2-p2-08, R2-s8-06
- Fix: keep the guide until step 5 or dismissed, tick 3-5 from data; buttons open the create dialog (`?create=1`); default POI Place to the only Place; rename "Activate content" to "Show drafts" or open an "Activate drafts" dialog.
- Files: `FirstRunGuide.vue`, `DashboardView.vue`, list views, create dialogs. Spec: `12` §3 five-step guide; D-077; a step 6 "Go live" is a spec-change candidate (below). Effort: S-M.

### C2-27 · P1 · "Waiting for you to apply" omits recent items and its numbers do not add up
- Merged: R2-p1-editor-02, R2-s8-07
- Fix: cause is `?pending=true&size=10` per kind in manual order merged client-side; fetch sorted by save time or all pages; "Showing 10 of 15" + link to the pending-filtered list; title-only link text.
- Files: `dashboardData.ts`, `PendingChanges.vue`. Spec: `12` §3. Backend: proposed G-038. Effort: M.

### C2-28 · P1 · Warnings list is repetitive and unactionable (396-410 lines, group title from its first issue)
- Merged: R2-s8-03, R2-p2-10
- Fix: one row per Resource ("Italian: Description, Summary"), name the field, drop kind prefix and `PENDING_WORKING_COPY` warnings, de-duplicate, link Project warnings to the setting (no public address).
- Files: `platform/readiness.ts` (`groupIssues`), `ReadinessGroups.vue`. Effort: M.

### C2-29 · P2 · Counts strip and layout
- Merged: R2-s8-08, R2-s8-13, R2-p2-15
- Fix: "10 active · 8 draft", fully grey zeros, strip above pending/warnings on empty/drafts-only; below 1100 px counts above the 10-row table; guide 770 px of 1180.
- Files: `ContentCounts.vue`, `DashboardView.vue`. Effort: S.

### C2-30 · P2 · Blocked card copy and missing `NAVIGATION` resource type
- Merged: R2-s8-09
- Fix: "Fixed in the live content" -> plain wording; "and 3 more" a link; add `NAVIGATION` to `ReadinessResourceType` (sync from the backend contract) so `issueLink` works and "Fix the first issue" is not disabled.
- Files: `platform/readiness.ts`. Effort: S.

### C2-31 · P2 · Jargon without HelpHints; Dashboard copy
- Merged: R2-p2-09, R2-s8-12
- Fix: HelpHints on Dashboard chips, "Content revision", Pending changes filter, Preview surface/trigger controls, Geo-proximity, Beacon; "visitor app" vs "app" vs "Application"; "Everything you have written is still a draft" is false in some states.
- Files: `lib/glossary.ts`, `StatusCard.vue`, `PreviewView.vue`. Effort: S-M.

### C2-32 · P3 · Dashboard keyboard run and state coverage
- Merged: R2-s8-14, R2-s8-15
- Fix: pending capped at 5 shortens the 29-stop run; settings 409 silently drops the footer line; offline reload shows the browser error page.
- Files: `DashboardView.vue`. Effort: S.

## F. Readiness and activation

### C2-33 · P1 · ROOT · Readiness is counted four ways and DRAFT/ACTIVE disagree (one model needed)
- Merged: R2-p1-editor-07, R2-s10-04
- Fix: one `countIssues` function and one sentence template for header, side card, Activate confirm and toast, same grouping before and after activation, same list on DRAFT; "No position yet" and "Primary image missing" become warnings. (Seen: confirm "3 things", toast "7 warnings", header "5", card "5"; list-row "partly translated" vs "3 texts missing".)
- Files: `ReadinessList.vue`, `ActivateDialog.vue`, `EditorShell.vue`, `platform/readiness.ts`. Effort: M.

### C2-34 · P1 · Completeness ignores structural content (Route stop texts, Guide story blocks, DRAFT asset alt text)
- Merged: R2-p3-01, R2-s11-06, R2-s13-16
- Fix: cause is tab marks counting only fields with `data-path` (`goToNextMissing` looks only for `input[data-path]`); one completeness function for tab, card, list dots and readiness counting stops/blocks; Guide with empty story is not "Complete"; compute the missing-alt blocker client-side in "Before you activate" and disable Activate with the reason (platform message stays as backstop).
- Files: `EditorShell.vue`, `TranslationsPanel.vue`, `StoryEditor.vue`, route/guide status builders, `AssetEditorView.vue`, `StatusChangeDialog.vue`. Spec: `14` §4; blocking rule for empty story needs a backend readiness code (proposed G-039). Effort: M.

### C2-35 · P2 · List-row activation confirm shows warnings but no way to fix them; refusal order and enum text
- Merged: R2-p1-editor-08, R2-s9-18
- Fix: "Review in editor" link; blocking before warnings; no raw enum "ACTIVE".
- Files: `useListLifecycle.ts`, row confirm dialog. Effort: S.

## G. Lists and create dialogs

### C2-36 · P1 · "Sort by Updated" is oldest first with no direction; Places and Categories cannot sort
- Merged: R2-p1-editor-01, R2-s9-05
- Fix: shared sort control with direction; Updated newest first (rows show time); Title/Status sorts on the tree lists.
- Files: `SortSelect.vue`, `useListQuery.ts`. Spec: `12` §3 lists sort by sortOrder (tree sort is a spec-change candidate). Effort: S-M.

### C2-37 · P1 · No paging: 84 POIs = 9,158 px; request capped at `size=200`
- Merged: R2-s9-06
- Fix: paginate or window, notice above the cap, compact POI row (~64 px).
- Files: `PoisView.vue`, `ListTable.vue`. Effort: M.

### C2-38 · P1 · Two create dialogs silently create the wrong record (Sub-place without Parent becomes top-level; Subcategory preselects the first parent)
- Merged: R2-s9-02, R2-s9-03
- Fix: validate Parent (required) in both; empty "Choose a parent" option.
- Files: `CreatePlaceDialog.vue`, `CreateCategoryDialog.vue`. Effort: S.

### C2-39 · P2 · Counts disagree: footer denominators include archived, segment counts ignore search, sort not announced
- Merged: R2-s9-07, R2-p3-14, R2-p5-09
- Fix: denominators match the segment; live region names the noun; announce sort changes.
- Files: `ListFooter.vue`, `useResultAnnouncer`. Effort: S.

### C2-40 · P2 · "Clear filters" appears two or three times
- Merged: R2-s9-08, R2-s13-05, R2-p2-16
- Fix: filtered-empty keeps the message plus one button; footer chips hidden when empty.
- Files: `ListToolbar.vue`, `ListFooter.vue`, `MediaView.vue`. Effort: S.

### C2-41 · P2 · Back from an editor does not restore scroll; focus goes to h1, not the row
- Merged: R2-s9-13
- Fix: restore scroll and focus the row link/kebab (see conflict 1).
- Files: `useListQuery.ts`. Effort: S.

### C2-42 · P2 · At 1024 the Translations column breaks words mid-letter ("Englis/h"), rows ~140 px
- Merged: R2-s9-10
- Fix: `list-table.css`, `TranslationDots.vue` min width / wrap at spaces. Effort: S.

### C2-43 · P2 · Residual drift across the six lists and editors
- Merged: R2-p1-editor-14, R2-s9-19, R2-s11-02, R2-p3-11
- Fix: one sort component; collapse "Used in" after 5; one required marker; "Texts" section on every kind; header heights 35 vs 49; "Dates" vs "Next date"; Categories "Name"/"Applies to"/no Featured; blank Order header; "trigger" in placeholders where the kind has none.
- Files: list views, `EditorSection`, editor views. Effort: M.

### C2-44 · P2 · Create dialogs: two-pass validation, mixed required markers, Esc loses typed text, summary order, zoom 200
- Merged: R2-s9-11, R2-s9-12, R2-s9-17, R2-s9-20, R2-s9-21, R2-s7-chrome-18, R2-p5-12
- Fix: validate all fields in one pass; one required marker and control type (Route Setting select vs radio cards); confirm or keep text on Esc/backdrop; summary in form order; unmapped 422 key not shown raw; slug length cap (328 chars accepted); body scrolls at zoom200 (2 lines visible).
- Files: `FormDialog.vue`, create dialogs. Effort: S-M.

### C2-45 · P2 · Row-action feedback and lifecycle dialogs
- Merged: R2-s9-16, R2-s9-23, R2-s10-24
- Fix: warning toasts persist, focus the neighbour kebab, Undo for Archive; blocked Archive dialog titled "Archive Sculpture?" offers only Close -> retitle; single-item More menu; Archive confirm repeats a 160-char title.
- Files: `useListLifecycle.ts`, `EditorShell.vue`. Effort: S.

### C2-46 · P2 · POI list hides a failed Categories call; a Places 403 fails the whole POI list
- Merged: R2-s9-15
- Fix: degrade gracefully with a notice. Files: `PoisView.vue`. Effort: S.

### C2-47 · P3 · Lists small items
- Merged: R2-s9-22, R2-s9-26
- Fix: "Add sub-place" in Places ⋮; Move-to-position error with `role=alert` and `aria-describedby`.
- Files: `PlacesView.vue`, move dialog. Effort: S.

## H. Translation workflow

### C2-48 · P2 · A row matched through another language never says so (C1-21 not fixed)
- Merged: R2-p3-04, R2-s9-14
- Fix: "Matches Ελληνικά: …" line (bdi, lang); placeholder names slug/code searched.
- Files: `listRows.ts`, list views. Effort: S-M.

### C2-49 · P2 · "Needs translation" defaults to the source language and is separate from "Search in"
- Merged: R2-p3-03, R2-s13-06
- Fix: default to the Search-in language or first non-default; label "Needs translation in", one Language control; Media select name is just "in".
- Files: `ListToolbar.vue:60`, `MediaView.vue`. Effort: S.

### C2-50 · P2 · Translation navigation: dots are not links, worklist loses the language, Next missing skips the current language, missing titles only counted
- Merged: R2-p3-05, R2-p3-06, R2-s14-10
- Fix: dots link to `?lang=it`, editor seeds the language; finish current language first (expand and focus), label "Next missing: Italiano", announce; Preview "71 missing titles" links to the filtered list.
- Files: `PoisView.vue:274` etc., `EditorShell.vue:293`, `PreviewView.vue`. Effort: S.

### C2-51 · P1 · Media worklist cannot say what is missing; "complete" has two meanings
- Merged: R2-p3-02
- Fix: per-row "Italiano: alt text, title missing" in grid and list; one definition (`missingTextIn` checks title+alt, the tab counts four fields); language-aware alt filter; Translations card and Next missing on the Asset editor; one count line.
- Files: `MediaView.vue`, `platform/assets.ts:301`, `AssetEditorView.vue`. Backend: language-aware filter at scale (proposed G-040). Effort: M.

### C2-52 · P2 · ROOT · Dates and times: no single formatter (12 h and 24 h, en-US and UK, English words under Greek)
- Merged: R2-p3-08, R2-p4-11, R2-s10-10, R2-s11-05
- Fix: one `formatDate/formatTime` (24 h) used by header chip, banner, card, toast; summary in the target language; label native datetime inputs or replace them with typed day/month-name/24 h fields (C1-39 not fixed).
- Files: `lib/format.ts`, `AppToast.vue`, `EditorShell.vue`, Event editor. Effort: S-M.

### C2-53 · P2 · RTL: `dir` applied in editors only (inferred, not observed with a real RTL language)
- Merged: R2-p3-09
- Fix: `dir="auto"` on list search, row titles, header title; lang/dir on non-default-language titles; `<html>` dir.
- Files: `SourcePairField.vue`, `TranslationsPanel.vue`, `StoryEditor.vue`, `FormDialog.vue`, `ResourcePreview.vue`. Effort: S.

### C2-54 · P2 · Long titles: single-line inputs clip, header truncates and its chip wraps (form shifts)
- Merged: R2-p3-10, R2-s10-22
- Fix: auto-growing Title textarea in default and translation tabs; header h1 wraps to two lines; full title available.
- Files: `EditorShell.vue`, `SourcePairField.vue`. Effort: S-M.

### C2-55 · P2 · Language-independent controls stay editable under a language tab (Event Place/POI/Route/Booking URL, Decorative, Placement, triggers)
- Merged: R2-s11-07, R2-p3-13
- Fix: non-default tabs show only translatable fields + read-only dates; "Other settings (all languages)" collapsed (D-079).
- Files: Event/Asset/POI editors. Effort: S.

## I. Editor behaviour

### C2-56 · P2 · Apply stays primary while edits are unsaved; Apply and Activate confirms name no change
- Merged: R2-p1-editor-11, R2-s10-08, R2-s10-09, R2-s11-09, R2-p3-12
- Fix: dirty -> Save draft primary, Apply secondary or "Save and apply"; list changed fields and "N warnings remain"; truly disable Apply with a reason when nothing is pending; one cancel wording; one "Unsaved changes" message.
- Files: `EditorShell.vue`, `ApplyDialog`. Effort: S-M.

### C2-57 · P1 · ROOT · Focus drops to `<body>` after Activate, attach image, Restore/Discard, Archive, Upload anyway/Skip and Reset
- Merged: R2-p1-editor-10, R2-p5-02, R2-s10-03, R2-s13-04, R2-s13-17, R2-p5-15, R2-s14-09
- Fix: `lib/focus.ts restoreFocus` must handle an unmounted opener; then focus the new Replace/Clear button, the new state's heading, the next held row, the search field after Clear filters, the select after Reset, the first restored field after Restore; leave guard returns to the trigger.
- Files: `lib/focus.ts`, `EditorShell.vue`, `ActivateDialog.vue`, `ResourcePickerDialog.vue`, `MediaSlots.vue`, `UploadEntryRow.vue`, `FireTrigger.vue`. Spec: `14` §4; C1-77 still open. Effort: S.

### C2-58 · P1 · ROOT · POI/Place map adds ~40-47 unnamed Tab stops (Leaflet `leaflet-interactive` paths of other POIs)
- Merged: R2-p5-01, R2-s10-01
- Fix: non-draggable layers `keyboard:false`/non-interactive, nearby POIs as a list, one stop for the pin group, "Skip map"; the Maps editor has none (use it as the pattern).
- Files: `map/GeoPicker.vue`, `map/GeoMapCanvas.vue`, `CanvasMarker`. Spec: `14` §4; C1-80. Effort: S.

### C2-59 · P1 · ROOT · A resource's own triggers count as "used by" and block Deactivate; the sentence is garbled ("Remove it from it first")
- Merged: R2-p1-editor-03, R2-s10-02, R2-s11-08
- Fix: exclude own triggers from usage (deactivate them with the resource) or say "Deactivate the QR code first" with a link; fix the template for POI and Category ("Used by 1 route. Choose another category in that route first."); show "Used in" once.
- Files: `useResourceEditor.ts` where-used, `EditorStatusCard.vue`, `CategoryEditorView.vue`. Spec: `03` §1, `12` where-used; backend rule unverified (proposed G-037). Effort: S-M.

### C2-60 · P1 · Empty beacon/geo rows fail only at the server with three identical, field-less summary links
- Merged: R2-s10-06
- Fix: client-side `checkTriggers` flags empty required fields before the request; summary entries name the field ("Beacon 1, UUID").
- Files: `platform/triggers.ts`, `TriggersCard.vue`. Spec: `14` §4. Effort: S.

### C2-61 · P1 · "Test in preview" navigates to `/preview?trigger=<id>` but selects and fires nothing
- Merged: R2-p4-01, R2-s14-02, R2-s10-21
- Fix: read `?trigger=`; pick the surface (beacon -> Mobile, QR/geo -> its "Runs on"), select and fire, show the chip, or say why not.
- Files: `PreviewView.vue`, `FireTrigger.vue`, `TriggersCard.vue:182`. Spec: `12` §3. Effort: S.

### C2-62 · P1 · 409 dialog: one-button impression, no request id, lists unchanged fields, does not say what Reload discards
- Merged: R2-p1-editor-05, R2-s10-14
- Fix: three-way merge (only fields I changed conflict); "Reload their version (discards your 1 change)"; request id; stray space "editing ."; one-line diff for list fields (see conflict 3).
- Files: `ConflictDialog.vue`, `useResourceEditor.ts`. Backend: conflict bodies (existing gap). Effort: M.

### C2-63 · P2 · Restore-draft notice is oversized, shifts the form ~110 px, outlives the save
- Merged: R2-s10-12
- Fix: compact row inside the banner area ("Restore (2 fields)"), dismiss on save, focus the first restored field.
- Files: `EditorShell.vue`. Effort: S-M.

### C2-64 · P2 · Archived editor: two "Restore as draft" buttons, stale Title hint, success toast with a warning triangle
- Merged: R2-s10-13
- Fix: one Restore (card), drop the hint when not DRAFT, banner not full-width over the side column. Files: `EditorShell.vue`, `EditorStatusCard.vue`. Effort: S.

### C2-65 · P2 · Version number shown as "Version 0" and jumps (0 -> 1 -> 3 -> 6)
- Merged: R2-s10-20, R2-s11-14, R2-p1-editor-19
- Fix: "Not saved yet / Revision N" or hide; also Place/Category native selects with 25+ options, readiness/Translations/Used in ~2,550 px down at 1024. Files: `EditorStatusCard.vue`. Effort: S.

### C2-66 · P2 · Audio narration rows sit under the collapsed "Practical details" bar but outside its disclosure
- Merged: R2-p1-editor-12, R2-s10-18
- Fix: one "Audio narration" row with per-language chips inside the Media card, or its own heading. Files: `MediaSlots.vue`, POI editor. Effort: S-M.

### C2-67 · P2 · Editor height 1,854-2,245 px against the ~1,450 target; Translations/Next missing ~1,900 px down at 1024
- Merged: R2-s10-07, R2-s10-25, R2-p3-07
- Fix: two-column Summary/Description or 56 px growing rows; Placement map 200 px or behind "Edit position"; fold empty Media/Triggers into one "Add…" row; Next missing beside the tabs at <= 1100 px; Place setup readiness hint.
- Files: `PoiEditorView.vue`, `PlaceEditorView.vue`, `EditorShell.vue`. Effort: M-L.

### C2-68 · P2 · Save errors shift the form and 5xx drops focus; forced 422 without field link
- Merged: R2-s11-10, R2-p1-editor-18
- Fix: stable summary area; focus summary/toast for 5xx and offline; re-test a real 422 (`summary.en` mock showed no link).
- Files: `EditorShell.vue`, `ConflictDialog.vue`. Effort: M.

### C2-69 · P2 · Coordinate and date errors appear only on Save (not announced); map editor validates differently from the New map dialog
- Merged: R2-p5-06, R2-s12-03
- Fix: validate on blur, `aria-invalid`, polite announcement; Event end-before-start announced.
- Files: `GeoPicker.vue`, `MapEditorView.vue`, Event editor. Spec: `14` §4. Effort: S.

### C2-70 · P2 · Removing a stop/block: Undo bar is off-screen and 22 Tab stops away
- Merged: R2-p5-03, R2-s11-04
- Fix: anchor Undo to the list head or viewport bottom, focus it briefly, accept Ctrl/Cmd+Z; collapse optional walking-instruction field.
- Files: `RemovedBar.vue`, `undoRemove.ts`. Effort: S.

### C2-71 · P2 · Route map card contradicts the stop list; pins overlap
- Merged: R2-s11-03
- Fix: guidance only at 0 stops; "Stops 1-5 have no position" with links; fan out pins; list behind "Show as list". Files: `RouteEditorView.vue`. Effort: S-M.

### C2-72 · P3 · Event/Route/Category small items
- Merged: R2-s11-11, R2-s11-13
- Fix: comboboxes look like native selects; picker search ArrowDown/Enter do nothing; Repeat weekly 99 silently becomes 52; icon grid ArrowDown moves along the sequence; scope switch not announced. Effort: S.

### C2-73 · P2 · Slow save and slow loads
- Merged: R2-p1-editor-13, R2-p2-19
- Fix: parallelise trigger and asset writes (8 sequential requests, 1.6-2.1 s, create -> editor 5.0 s); Dashboard ~5 s as admin because the status card waits for pending queries (dev server, unverified in production).
- Files: `useResourceEditor.ts`, `dashboardData.ts`. Effort: M.

### C2-74 · P2 · Moving between kinds is Tab-only (8 Tabs to Routes, 12 to the first row, no shortcuts)
- Merged: R2-p1-editor-16
- Fix: `/` focuses search, jump keys or a quick switcher (Q-016 covers the switcher). Files: shell. Effort: M.

## J. Media

### C2-75 · P1 · Media list view: "Needs attention" column 0-76 px wide, chips overprint "Used in" (1440/1280/1024)
- Merged: R2-p1-editor-04, R2-s13-01
- Fix: min width about 9rem or merge chips into the Status cell; drop fixed widths on Name.
- Files: `MediaView.vue` (~L234-240, L353). Effort: S.

### C2-76 · P1 · Upload dialog opens with focus on the hidden file input
- Merged: R2-s13-02
- Fix: focus the dialog heading or "Choose files". Files: `UploadDialog.vue`, `AppDialog` autofocus. Spec: `14` §4. Effort: S.

### C2-77 · P1 · "Upload anyway" buttons fail WCAG 2.5.3 (label in name)
- Merged: R2-s13-03
- Fix: accessible name starts with the visible text ("Upload anyway, tool.exe") or `aria-describedby`. Files: `UploadEntryRow.vue`. Effort: S.

### C2-78 · P2 · Asset picker: tiles are not roving (9 Tabs to the first), zoom200 is mostly chrome, no alt cue on tiles
- Merged: R2-s13-18, R2-s13-19, R2-p5-11
- Fix: one Tab stop with arrow/Home/End roving; remove the unnamed hidden input before "Upload new"; sticky footer only on short viewports; view toggle into Filters; "No alt text" chip on tiles.
- Files: `AssetPicker`, `ResourcePickerDialog.vue`. Effort: M.

### C2-79 · P2 · Upload dialog density and wording
- Merged: R2-s13-09, R2-s13-23
- Fix: collapse the formats table after files are added, log sr-only, "Done" -> "Close", Skipped row "Undo skip" not "Retry"; Decorative effect visible before the confirm. Files: `UploadDialog.vue`. Effort: S.

### C2-80 · P2 · Asset editor at <= 1024: alt field below the fold; sticky preview covers 45 % at zoom200
- Merged: R2-s13-08
- Fix: preview <= 25 vh or thumbnail row below 1100 px; Decorative into the alt-text card; readiness accordion labelled just "Active". Files: `AssetEditorView.vue`. Effort: S-M.

### C2-81 · P2 · Library vs editor "Used in" still disagree (8 vs 7)
- Merged: R2-s13-07
- Fix: label "Used in 8" with tooltip; sort by the references count when known. Backend: G-030 (existing, no new gap). Effort: S.

### C2-82 · P2 · Media URL state, layout jump and counts
- Merged: R2-s13-12, R2-s13-13, R2-p1-editor-17
- Fix: `view=list` in the URL; "(1 archived)" wording for "Showing 48 of 61 (62 in the library)"; reserve space for "in [language]"; hidden input removal. Files: `MediaView.vue`. Effort: S.

### C2-83 · P3 · Media minor
- Merged: R2-s13-11, R2-s13-21
- Fix: "More texts: All filled" while Caption is empty -> "Credits: filled"; duplicate "Used by 7 items" lines; hide the toolbar when the library has zero files. Files: `AssetEditorView.vue`, `MediaView.vue`. Effort: S.

## K. Maps and floor plans (s12 partial: floor plan editor, GeoPicker, Route map covered by p4, p5, s10 only)

### C2-84 · P1 · `touch-action: none` on maps: a swipe over the map does not scroll the page
- Merged: R2-s12-01, R2-p4-06
- Fix: Leaflet gesture handling ("use two fingers") or a "Move map" toggle on coarse pointers; keep pin drag. Map editor 686×573 at 768, POI editor 463×260.
- Files: `GeoPicker`, `MapEditorView.vue`, map components. Spec: C1-99 remnant. Effort: S-M.

### C2-85 · P2 · Visitor-filter bar puts ~39 chips into the Tab order (~40 Tabs from the map to "Placed on this map")
- Merged: R2-s12-02
- Fix: one grouped control (checkbox list in a disclosure); visibility checkboxes 20 px. Files: `MapEditorView.vue`. Effort: S.

### C2-86 · P2 · Floor plan: 85 identical "Place" buttons; the armed bar covers the top of the plan
- Merged: R2-p4-09
- Fix: item name in each button's accessible name; anchor the armed bar below the sticky header or at the plan's bottom edge on short screens. Files: `FloorPlanEditorView.vue`. Effort: S.

### C2-87 · P3 · Maps minor
- Merged: R2-s12-05, R2-s12-06, R2-s12-07
- Fix: placed numbering reorders after save; half-clipped bounds handles at the edge; tile-failure card covers pin 2; route lines without legend; success toasts cover "On this page"; New map dialog jumps when results appear; New floor plan dialog has no error summary; image picker defaults to Type "All"; seam lines on raster tiles (unconfirmed). Effort: S.

## L. Preview

### C2-88 · P1 · Expanded "Preview in app" sticky tab bar covers the editor header and "Apply changes"
- Merged: R2-s14-01, R2-p4-04
- Fix: stick the panel bar below header + banner (offset) or drop sticky. Files: `PreviewPanel.vue`. Spec: `14` §4 chrome operable. Effort: S.

### C2-89 · P1 · Preview in app is drawn at 24-29 % (Web, Kiosk) in the side column; no Expand below 1025 px
- Merged: R2-s14-03, R2-p4-03, R2-s10-23
- Fix: panel opens below the action across the full editor width (still "below the action, a panel", no spec change); Expand at every width; Kiosk default fit-width with inner scroll; keep Size 100 %/50 %; "Open at real size" stays.
- Files: `ResourcePreview.vue`, `PreviewPane.vue`, `PreviewPanel.vue`. Spec: `12` §3, D-075; docked pane stays Q-009. Effort: M.

### C2-90 · P2 · Kiosk "Fit" fits the height only (33 % at 1440, 5 px text); Web 100 % scrolls sideways; duplicate size choices
- Merged: R2-p4-08, R2-s14-05, R2-s14-07
- Fix: add "Fit width" (default for Kiosk); hide or disable options that give the same result ("Fits at real size"). Files: `DeviceFrame.vue`, `PreviewControls.vue`. Effort: S.

### C2-91 · P2 · Esc does not stop interacting; inert stand-in may expose ~40 buttons to AT (see conflict 4)
- Merged: R2-p5-07, R2-s14-04
- Fix: Esc inside the frame stops interacting and returns focus to Interact; `aria-hidden`/`inert` until Interact (verify with the real Chrome AX tree). Files: `PreviewPane.vue`. Spec: `14` §4. Effort: S.

### C2-92 · P2 · Preview page: picture starts below the fold (y 585-661), wraps to 3 rows at 768, 30-option select, 32 px Interact
- Merged: R2-s14-06, R2-p4-13, R2-s14-12
- Fix: one-line subtitle, single compact (sticky) toolbar, status lines into the frame caption, searchable trigger combobox, 40/44 px Interact, 12 px+ scale caption. Files: `PreviewView.vue`, `PreviewControls.vue`. Effort: M.

### C2-93 · P3 · QR drawn at 128 px with a 12 px monospace link; print size unstated
- Merged: R2-p4-14
- Fix: caption the PNG size if true (unverified). Files: `QrCodePreview.vue`. Effort: S.

## Conflicts between agents

1. **Back from an editor restores scroll?** p1: Back and reload restore controls, rows and scroll. s9: scroll 3000 -> 512 and 2500 -> 1416, focus on h1 not the row. **Stronger: s9** (numeric before/after on deep scrolls); p1 probably tested short scrolls. Filters and sort are restored (both agree). C2-41.
2. **C1-111 and the Media list view.** p1 rates C1-111 regressed (list view overprints "Used in"); s13 rates C1-111 (thumbnails/type chips) fixed but files the same overprint as P1 R2-s13-01 under C1-118 partly. Both saw the same collision (column 0 px at 1280/1024, 76 px at 1440). **Taken: regressed**; thumbnails are fine. C2-75.
3. **409 dialog.** p1-05: one button "Reload their version", no "mine"; s10-14, p3 and p5: per-field mine/current, nothing preselected. **Stronger: s10** (real 409 produced by changing the record through the API); p1 used a forced mock without a `current` payload (it says so). Kept as P1 because s10 confirms lists unchanged fields and does not say what Reload discards. C2-62.
4. **Preview stand-in and AT.** p5-07: ~40 inert buttons exposed in `ariaSnapshot()`; s14: AX tree 5 buttons idle vs 50 interacting (stand-in truly inert); p4 agrees with s14. Playwright's `ariaSnapshot` does not necessarily honour `inert`, but p5's own log shows the buttons listed. **Unresolved**; cheap to settle with a CDP `Accessibility.getFullAXTree` run in round 3. Rated P2 (worst credible) in C2-91.
5. **C1-22 sticky bar.** p1, s10, s11, p5 fixed; p4 partly (54 % of a 400 px screen). All agree on the mechanism; the zoom200/short-screen effect is the new P1 C2-05. Final: partly.
6. **Dashboard Populated score.** p2 76, s8 64. **Stronger: s8** (read the warnings list: 396 lines, 6 unique under a group of 151, misnamed fields). R1 = 64.
7. **C1-123 touch targets.** s7 fixed (chrome only), p4/s11/s12/ds partly, s9 not fixed. **Stronger: s9 and ds** (class not generated, probes of 174-179 of 185 controls under 44 px). Final: not fixed. C2-01.
8. **C1-80 map tab stops.** p1 fixed ("limited"); p5 partly (~47 stops); s10 not fixed (~40). Walked focus orders in p5 and s10. Final: not fixed. C2-58.
9. **C1-122 header at 768/zoom200.** p4 and s7 fixed (one row at 1024/768; zoom200 not re-run by p4); p1 and s10 not fixed (zoom200 stack 43-60 %). The header row is fixed, the sticky stack is not. Final: not fixed. C2-05.
10. **Count of P1 in s8.** The report header says 4, the findings list 5 (R2-s8-01...05). Five used.
11. **"Complete" for the Asset editor.** s13-11 reports "More texts: All filled" while Caption is empty; p3-02 reports the tab counts four fields but the worklist two. Same root (two definitions); merged in C2-34/C2-51.

## Backend (GAPS) and spec-change candidates new in round 2

Not repeated: G-023...G-036, Q-008...Q-016. Proposed numbers are provisional for the owner or the next implementer to assign.

**Proposed GAPS (backend):**
- **G-037 (verify)** Deactivate/archive where-used rule: does the backend count a resource's own triggers as users? The UI shows "Used by 1/2 items" for a POI whose only users are its own QR/geo trigger (p1-03, s10-02); only the UI refusal was observed. If the backend refuses, change it; otherwise fix the frontend count. C2-59.
- **G-038** Cross-kind pending Working Copies sorted by last save (or a single endpoint): the Dashboard uses `pending=true&size=10` per kind in manual order and merges client-side, so the newest item can be missing (p1-02, s8-07). C2-27.
- **G-039** Readiness code for a Guide with an empty story (and DRAFT asset without alt text if not already covered by the existing DRAFT-readiness gap): a Guide with five empty blocks is "Complete" and activates with "0 blocking" (s11-06, s13-16). C2-34.
- **G-040 (low)** Language-aware missing-text filter for assets (`missingTextIn` is client-side and checks title+alt only; fine at 85 assets, not at scale) (p3-02, s13-06). C2-51.
- **To verify (no gap yet):** list `size` above 200 is silently capped client-side (s9-06, unverified against the API); Event "Repeat weekly 99" becomes 52 (client or server?) (s11-13).
- **Frontend contract sync, not a gap:** backend `NAVIGATION` readiness resource type is missing in the frontend `ReadinessResourceType` (s8-09).
- No new evidence for G-029 (project list `initialized`, p2-06) or G-030 (asset usage 8 vs 7, 9 vs 9; the editor now explains it).

**Spec-change candidates (`QUESTIONS.md` as `spec-change-request`, not to be implemented):**
- **First-run guide persistence and a sixth step** ("Activate and launch"): `12` §3 fixes a five-step guide for a content-less Project; the guide disappearing after two drafts and steps 3-5 unreachable is a behaviour question (s8-04, p2-08). C2-26.
- **Sort on tree lists:** `12` §3 lists sort by `sortOrder` only; Title/Status/Updated on Places and Categories needs the spec to allow it (p1-01, s9-05). C2-36.
- **Empty Guide readiness:** should an empty story block activation or only warn? (s11-06). Pairs with G-039.
- **Slug maximum length** (328 characters accepted, s9-21) and **"Revision" vs "Version" wording for authors** (s10-20) are small clarifications, not behaviour changes.
- The "Preview in app" full-width panel and "Ready" definition need no new request: s14 shows `12` §3 allows a full-width panel below the action; the docked pane and "what Ready means" remain Q-009/Q-014-area.

## Environment notes

- **`curator` lost Catalogue access mid-round** (the audit Projects were not deleted). Later runs used `admin`: s13 re-ran the library with `admin`, s14 continued as `admin`, p2 used `admin` for Project flows. Findings from curator-only runs and admin-only runs may differ in permission-dependent states (e.g. Dashboard load ~5 s as admin vs 1.5-1.9 s curator, p2-19).
- **s12-maps is partial**: it stopped about half way, and `admin` sign-in was denied twice by the permission system. Floor plan editor interactions, GeoPicker, Route map, forced colours and the keyboard pass at 1024/768 were not run by it; p4 (touch placement, floor plan armed flow), p5 (keyboard pass, map handles) and s10 (GeoPicker tab stops) cover those. Maps screens' scores are provisional.
- **A re-seed added duplicate records in Populated.** Counts drift between agents and runs (warnings 366 / 396 / 410; library 78 vs 85 files; "of 72" vs 66) and are not comparable across agents. Test records named `UX-R2-<agent> ...` remain (several ACTIVE; two POIs of p1 cannot be deactivated because of C2-59).
- **p6-edge produced no report.** The error/edge-case persona column in the scoreboard is empty.
- Dev-server timings (save 1.6-2.1 s, create -> editor 5 s, list cold 4.7 s) were measured on the Vite dev server and are not production numbers.

## Addendum (orchestrator): p6-edge
The p6-edge agent reported a written report.md but none existed; the orchestrator wrote `p6-edge/report.md` from its
returned summary. Its findings map onto existing clusters: R2-p6-01 → C2-09/C2-10; -03 → C2-62; -04 → C2-56/C2-62;
-05 → C2-59; -06 → C2-79; -07 → C2-09; -08 → C2-11; -09 → C2-35; -10 → C2-09/C2-13. One new P1:
**C2-94 · P1 · One failed `/languages` request silently turns every list into "Add a language first"** (New disabled,
rows show slugs, no error or retry) — show an error Alert with request id and Try again; never infer "no languages" from
a failed read. Files: list views / `useListQuery.ts` / languages loader. Effort S.
Totals become: 94 unique (P0 0, P1 31). Persona "error and edge-case": R1 = 74 (range 74–80), job success: most jobs
succeed; save-error recovery and the languages failure do not.
