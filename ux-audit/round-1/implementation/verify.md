# Round 1 verification (verifier agent)

Artifacts: `verify/` (scripts `a_routes.mjs`, `b_dialogs.mjs`, `c_admin.mjs`, `d_keys.mjs`, `lib.mjs`; `results.ndjson` = axe per state;
`shots/` = 81 PNG at 1440 and 768; `greps.txt`; `typecheck.txt`; `build.txt`). No source file was edited. The temporary build output was deleted.

## Verdict
**Pass with minor findings.** Typecheck and production build pass. axe (wcag2a/aa, 21a/aa) found **1 serious, 0 critical** across 81 recorded
states (the open row kebab menu; see R1-V-01). No P0 or P1 regressions. 2 P2, 10 P3. Every in-scope screen renders with no console error and no `pageerror`.
The exit gate "no serious/critical" is **not met by one state**; fix R1-V-01 first.

**Side effect to know about:** my wizard walk clicked the step-1 button ("Create Project and continue"). By design that button creates the Project
in the Catalogue (toast "Project created"). The record **"UX-verify do not submit"** (slug `ux-verify-do-not-submit`, org Test Museum, as admin)
now exists and can be resumed from the picker. I did not delete it (destructive Project operations are forbidden). The owner may delete it in the Catalogue.

## 1. Typecheck and build
- `vue-tsc --noEmit -p tsconfig.app.json` (Windows Node): no output, exit 0.
- Plain Vite 8.3.1 build with a temporary config outside the repo (`verify/build.config.mjs`: vue plugin + `@` alias, root = repo): `built in 24.11s`, exit 0.
  Largest chunk `GeoMapCanvas` 1,226 kB (gzip 337 kB; the map engine, lazy-loaded). Not a failure.

## 2. Constraint greps (`verify/greps.txt`)
- **Storage.** No token is written to browser storage.
  - `sessionStorage` (`platform/auth.ts:139,202`): a timestamp for the redirect-loop guard.
  - `localStorage`:
    - `iguide.media.view`: grid or list.
    - `iguide.recentProjects`: up to 5 Project ids, UUID-validated (`workspace/lastProject.ts`).
    - `iguide:draft:<subject>:<path>`: unsaved form state (`useResourceEditor.ts`, the allowed Restore/Discard draft).
  - No `indexedDB`.
- **Network destinations.** Only the recorded exceptions appear:
  - OpenFreeMap style and OSM raster tiles (`components/map/basemap.ts`)
  - Nominatim (`platform/maps.ts:314`)
  - Google Fonts for Template previews (`platform/templates.ts:114`)
  - `https://guide.museum.gr` and `http://localhost` appear only as placeholder or example text (`surfaces.ts`, `SurfacesView.vue`)
  - `http://.` is a regex/help fragment in `EventEditorView.vue:246`
  - `index.html` has no external URL.
- **`any`:** no `: any`, `as any` or `<any>` in `src/` (0 hits).
- **"publish":** 0 user-facing strings. 3 code comments only (`EditorShell.vue`, `ListToolbar.vue`: "publishes its height"; `glossary.ts`: states "published is never used").
- **Generated API client:** the repo has no `src/api/` directory (the client has not been synced yet, per the workspace rule), so there is nothing to touch.
  The only change in the wrapper layer is `src/platform/api.ts` (P1: default messages, "backend unreachable" strings, +8/-6), which is the allowed thin layer.
- **`text-[Npx]` by file** (all out of scope): TranslationsView 54, NavigationView 17, LanguagesView 15, OverviewView 11, SurfacesView 10, SectionView 2. **In-scope files: 0.**
- **Raw hex by file:**
  - `style.css` 25 (token definitions)
  - `TranslationsView` 6, `NavigationView` 5, `LanguagesView` 2, `SurfacesView` 3 (all out of scope)
  - `projectTheme.ts` 4, `preview/ResourceContent.vue` 4, `PreviewApp.vue` 2, `DeviceFrame.vue` 1 (stand-in theme fallbacks; acceptable)
  - `templates.ts` 1 (contrast helper)
  - `useReorder.ts` 2: the drop indicator hard-codes `#4c1d8b` (R1-V-10)

## 3. axe results (tags wcag2a, wcag2aa, wcag21a, wcag21aa)
All states below had **0 violations** at the stated viewport unless a count is shown. "ok" = zero violations.

| Route or state | 1440 | 768 |
|---|---|---|
| Sign-in (fresh context), sign-in offline | ok | ok |
| Home/picker (curator and admin) | ok | |
| Header switcher open | ok | |
| Create Project steps 1, 1-with-errors, 2, 3, 4 (admin) | ok | step 4 ok |
| Dashboard: Populated, Empty C, Empty B | ok | Populated ok |
| Lists: Places, POI, Routes, Guides, Events, Categories | ok | POI ok |
| Create dialogs: Place, POI, Route, Guide, Event, Category, Map, Floor plan | ok | |
| POI list: filtered-empty (search) | ok | |
| **POI list: row kebab open** | **1 serious: `aria-hidden-focus` (6 nodes)** | |
| POI list: set-position dialog | ok | |
| Editors: POI ACTIVE, ACTIVE with pending, DRAFT | ok | pending ok |
| Place, Route (ACTIVE and DRAFT), Guide, Event, Category editors | ok | |
| Activate dialog, Preview in app open (draft POI), Greek tab (draft and pending) | ok | |
| Maps list, Map editor | ok | |
| Floor plans list, Floor plan editor | ok | |
| Media library (grid and list), upload dialog, Asset editor, Asset picker | ok | Media ok |
| Preview page (Web, Mobile, Kiosk), app-preview new tab | ok | Preview ok |
| Forced 403, 404, 503 Project states; forced list 503; offline banner | ok | |

Not axe-scanned: other dropdowns (editor "More actions", user menu), which probably share R1-V-01. The 200 % zoom viewport was not re-run (it was covered per package).

## 4. Console and page errors
0 `pageerror` and 0 console errors across all walks (routes at 1440 and 768, dialogs, admin create, sign-in).
The only console errors were the 403/404/503 "Failed to load resource" entries I deliberately forced. No Vite error overlay on any page.
No horizontal scroll on any recorded page. The sign-in page (pre-auth) had no errors.

## 5. Keyboard spot checks
- Route change moves focus to the `H1` and sets `document.title` ("Routes · UX Audit – Populated · iGuide CMS"). Pass.
- Skip link: it is the first Tab stop. Enter moves focus to `main#main`. Pass.
- Row kebab: opens by Enter, focus lands on the first item, the items are Deactivate / Archive / Move up / Move down / Move to position... / Move to top / Move to bottom. Esc returns focus to the trigger. Pass.
- Set-position dialog: focus lands on its input. Esc closes it and returns focus to the kebab trigger. Pass.
- Activate confirm: focus lands in the dialog, Esc closes it and focus returns to the "Activate" button. Pass.
- Preview in app: opens with focus in the panel, Esc closes it and focus returns to the "Preview in app" button. Pass. The case "CMS chrome operable while the frame has focus" was not exercised.
- Asset picker: focus lands on the search field, Esc closes it and focus returns to the slot's Replace button. Pass.
- Drawer at 768: opens with focus on the current item, Tab moves within it, Esc closes it and focus returns to `#nav-toggle`. Pass.
- Project switcher: focus lands on the search field, Esc returns focus to the trigger. Pass.

## 6. Regressions and findings
| ID | Sev | Screen | Evidence | Owner |
|---|---|---|---|---|
| R1-V-01 | **P2** (axe serious) | Every row kebab menu (POI list shown; likely all lists and other dropdowns) | `shots/1440-pois-kebab-open.png`. With the menu open the modal dropdown sets `aria-hidden` on header, nav, search bar, table and the skip link while they are still focusable: `aria-hidden-focus`, 6 nodes. Fix by making the surrounding content inert, or by using a non-modal menu. | W0 (`ui/dropdown-menu`) |
| R1-V-02 | P2 | Create Project step 3 | `shots/1440-create-step3.png`, `-step4.png`. A fresh Project preselects **Ελληνικά as the default language** and English is second, probably because the Greek-aware sort made the first row the default. Authors can change it, but the review shows "Ελληνικά (default)" without a prompt. The default should be English or the Template's own default. | P1 (`useCreateProject`, `StepLanguages`) |
| R1-V-03 | P3 | Create Project steps 1 and 2 | `shots/1440-create-step1-errors.png`, `-step2.png`. The sticky footer floats mid-card over the form (it overlays the Slug input and the Style swatches). Blank card area and content show below it. | P1 |
| R1-V-04 | P3 | New map dialog | `shots/1440-maps-create-dialog.png`. The map pane is a fixed ~640 px column pushed to the right, leaving an empty left half. | P6 (`NewMapDialog`) |
| R1-V-05 | P3 | Maps list | `shots/1440-maps.png` against `-floor-plans.png`. The Maps list offers "Manual order" sort but has no drag handle, while the Floor plans list does. Two row anatomies in one screen. | P6 (or W0 list scaffold) |
| R1-V-06 | P3 | POI and Route lists, filter bar | `shots/1440-pois.png`, `-routes.png`, `768-pois.png`. The Category select wraps to a second row with a different baseline to the checkboxes, and "Featured only" sits alone on a third row. Guides, Events and Places fit on one row. The three lists lay out filters differently. | P3a (with W0 `ListToolbar`) |
| R1-V-07 | P3 | Guide editor story vs lists | `shots/1440-guide-editor.png`. Reorder is a handle + position select + inline up/down arrows, while lists use handle + kebab menu with Move up/down/position. Both are accessible, but the visual language differs. | P5a (`StoryEditor`) / W0 `ReorderControls` |
| R1-V-08 | P3 | Preview page head | `shots/1440-preview.png`. Two long paragraphs (about 6 lines) sit above the controls and push the frame below the fold at 1440 x 900. | P8 |
| R1-V-09 | P3 | Preview in app panel | `shots/1440-poi-draft-preview-in-app.png`. "Close preview" and the panel's own X both close it. The side panel at "24 %" is tiny, with scale text taking more room than the frame. | P8 (`ResourcePreview`) |
| R1-V-10 | P3 | List drag drop-indicator | `useReorder.ts:195-196` hard-codes `#4c1d8b` in the shadow class instead of a token. | W0 (`useReorder.ts`) |
| R1-V-11 | P3 | Floor plan editor | `shots/1440-floor-plan-editor.png`. The coordinates hint breaks mid-slug ("plan-" / "parthenon-gallery"), and the hint and "Replace image" button compete in one row. | P6 |
| R1-V-12 | P3 | Header | `shots/1440-dashboard-populated.png` vs `-maps.png`. The "App: Draft" chip in the switcher appears late after load (absent in the Dashboard capture, present elsewhere), causing a content shift inside the button. | P1 (`ProjectSwitcher`) / W0 `AppHeader` |

Consistency otherwise holds: the six content lists and Floor plans share one toolbar, one table header and one status-chip, translation-dots and kebab anatomy. The five editors share the header + Working Copy bar + Status/What-needs-attention rail. The dialogs share one frame.

## 7. Out-of-scope render table (1440, one screenshot each)
Shared chrome (header, nav) is the new one. The page bodies keep their legacy styling (uppercase tracked chips, tighter padding). Not scored.

| Screen | Renders | Console/page errors | Screenshot |
|---|---|---|---|
| Overview | yes | 0 | `shots/1440-oos-overview.png` |
| App settings (route `/app-settings` default tab) | yes | 0 | `1440-oos-appsettings.png`, `1440-oos-appearance.png` |
| App settings: Languages | yes | 0 | `1440-oos-languages.png` |
| App settings: Surfaces | yes | 0 | `1440-oos-surfaces.png` |
| App settings: Features | yes | 0 | `1440-oos-features.png` |
| Pages (not available yet) | yes | 0 | `1440-oos-pages.png` |
| Navigation | yes | 0 | `1440-oos-navigation.png` |
| Translations | yes | 0 | `1440-oos-translations.png` |
| Launch | yes | 0 | `1440-oos-launch.png` |
| Audit log | yes | 0 | `1440-oos-audit-log.png` |

I used `/appearance` as a guess for the Appearance tab and it redirected to the Dashboard (`1440-oos-appearance.png`, that is a mis-guessed route, not a bug).
`1440-oos-appsettings.png` shows the App settings page with the Appearance tab.
