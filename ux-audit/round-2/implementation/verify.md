# Round 2 verification (verifier, admin account, 2026-11-16)

## Verdict
PASS with minor findings. Typecheck, CSS-token check and production build pass; axe (wcag2a/aa, 21a/aa) found 0 violations on every in-scope route and state tested (no serious/critical); no page errors, no Vite overlay, no blank page on any of 111 recorded states. Nine measured or observed items need a decision, none blocks (0 P0, 0 P1, 1 P2, 6 P3).

## Outputs (all in `ux-audit/round-2/implementation/verify/`)
`typecheck.txt`, `css-tokens.txt`, `build.txt` (dist deleted), `greps.txt`, `results.ndjson` (one row per state: url, title, h1, overlay, axe), `shots/` (123 PNG), `measure.json`, `errors-*.json`, scripts `a_routes.mjs b_states.mjs c_measure.mjs e_poi.mjs f_keys.mjs f2_keys.mjs g_toast.mjs h_route.mjs s_signin.mjs`, console logs `*.out`.
Caveat: the first 1440 run of `b_states` mocked 503/403/pristine-empty/project-403 with a regex that also matched the SPA document request (my script, not the app); those four rows in `results.ndjson` (document-title/html-has-lang) are superseded by the rerun in `b1440b.out` (all clean).
Records created (own): POI `UX-R2-verify Empty POI saved` (DRAFT), Route `UX-R2-verify Route` (DRAFT, unsaved stops; nothing deleted or changed on pre-existing records).

## 1. Typecheck, tokens, build
vue-tsc exit 0; `check-css`: ok (56 files); `vite build` ok in 14.5 s (largest chunk GeoMapCanvas 1.23 MB, unchanged class).

## 2. Constraint greps (`greps.txt`)
- Browser storage: sessionStorage = redirect timestamp (auth.ts); localStorage = first-run guide dismissal (guideState), Media view (`MediaView`), last project ids (`lastProject`), editor draft form state (`useResourceEditor`, Restore/Discard). No token, no secret stored. OK.
- Network: authoring API (`fetch`/XHR in `platform/api.ts`), Nominatim geocoder (`maps.ts`), OpenFreeMap tiles + OSM tile fallback (`basemap.ts`), Google Fonts for Project theme previews (`templates.ts`). All are recorded exceptions (D-071/D-045, D-081, Nominatim in DECISIONS line 1539). No other fetch/WebSocket/beacon.
- `any`: 0 hits. "publish": only code identifiers (`publishToastInset`, `--sticky-stack-h` docs) and the glossary note that it is never used; no user-facing string.
- Server `detail`: only `SessionErrorView` renders `error.detail` (a client-authored sentence from `platform/auth.ts`, not server text), `AppPreviewView` renders `ApiError.message` (a fixed sentence by code, `api.ts` L305-308). Out-of-scope Languages/Surfaces views still build text from `e.message/e.details` (not scored). Forced 409/503/403/404 responses carrying a canary `SECRET-SERVER-DETAIL` in `detail/message`: canary never appeared on the page (409 dialog, 503, 403, 404). Request ids shown (`req-verify-409`).
- In-scope `text-[Npx]`: 0 (only `SectionView.vue`, a placeholder page, has 2; out-of-scope files carry the other ~107). In-scope hex: 1, `DeviceFrame.vue` CSS-variable fallbacks `#fff/#030712` (preview theme). `z-[`/`shadow-[`: 0. One arbitrary px size in `PreviewView.vue`.

## 3. axe table (1440 unless noted; violations serious/critical = 0 everywhere)
| Area | States | Result |
|---|---|---|
| Sign-in (fresh context) | view | 0 |
| Home/picker, switcher open (dialog "Switch project"), Create Project step 1 (not submitted; steps 2-3 not reachable without creating) | 3 | 0 |
| Dashboard Populated, Empty D (first run), pristine empty POI list (mocked) | 3 | 0 |
| Six lists | list, filters popover, row menu, create dialog, `?create=1` | 0 (30 states) |
| Editors | POI DRAFT/ACTIVE/pending, Route draft, Place, Guide, Event, Category: loaded; Activate dialog (POI, Route, Place), Apply dialog (pending POI), forced 409 dialog, Preview in app + expanded, Greek tab on all seven kinds | 0 |
| Maps | list, editor, New map dialog; Floor plans list, editor, New floor plan dialog | 0 |
| Media | grid, list (`?view=list`), filters, upload dialog, Asset editor, Asset picker (from POI) | 0 |
| Preview | Web, Mobile, Kiosk, `?trigger=` unknown id, beacon id; app-preview bare route | 0 |
| Forced errors | POI list 503, 403; Project 404, 403 | 0 |
| 768 | Dashboard, POI list, POI editor (+ nav drawer open), Media, Preview, POI create dialog | 0 |
| zoom200 | POI editor, POI create dialog, POI list, DRAFT POI editor | 0 |
| Out of scope (1 shot each) | Overview, Languages, Surfaces, Translations, Navigation, Launch, Audit log, Pages, Features, App settings | render; 0 |
Not covered: session-expired, config-error, offline banner, Create Project steps 2-3, Greek tab of Asset/Map editors.

## 4. Console / page errors
`pageerror`: 0 on all runs. `console.error`: 0 except the browser's "Failed to load resource" for the 4 forced 403/404/503/409 mocks (expected).

## 5. Measurements (`measure.json`, `c.out`, `e.out`)
- Icon-only buttons, fine pointer, 1440: POI list 50, all >= 40 px. POI editor: 3, two are 32x32 (HelpHint "What is a Working Copy?", "Why is AR scan target not available?") -> R2-V-02. Coarse pointer (CDP): both screens all >= 44 px.
- Sticky stack (px from top incl. 56 px app header, `--sticky-stack-h` in brackets): POI list 1440x900 162 = 18 % [106]; 1280x720 166 = 23 % [110]; zoom200 0. POI editor 1440x900 154 = 17 % [103]; 1280x720 117 = 16 % [61]; zoom200 (640x360) 117 = 33 % [61].
- POI editor `main` scroll height at 1440: empty DRAFT 1,408 (target <= 1,450 met); populated pending 1,983, ACTIVE 1,965, populated DRAFT 1,536.
- Toast (Link-copy toast, 1440): stack right edge x=996, side column starts x=1012, form column ends x=992: toast stands left of "On this page" (no overlap) but covers the right 4 px of the form column and ~314 px of the form area above the footer (screenshot `1440-toast-save-first.png`). 1280: inset 388 px.
- Deep link `/pois/<frieze>` reloaded 3 times: header chip "UX Audit – Populated, App: Draft" and tab title "Parthenon Frieze ... · UX Audit – Populated · iGuide CMS" correct at 0.6 s and 4 s every time.
- Tab stops POI Placement: 12 from Save draft to Media's first control; 5 inside the Placement card (target <= 8 met).
- `/preview?trigger=432c66f3...` (beacon): Mobile surface selected, select value = the id, chip "Fired: Bluetooth beacon, Excavated Athenian Neighbourhood".

## 6. Keyboard (admin, own or read-only state)
- Route change (Places link): title "Places - ...", focus on h1, live region "Places loaded". OK.
- Skip link: first Tab = "Skip to content"; Enter focuses `main#main`. OK.
- Drawer at 768: "Menu" opens a dialog with focus inside; Esc returns focus to `#nav-toggle`. OK. (The editor's "On this page" is not a drawer at 768.)
- Row menu: Esc returns focus to the "Actions for ..." button. Set position: dialog opens on its input, Esc returns focus to the same row's action button. OK. Note the menu opens with focus on the first item "Deactivate" -> R2-V-05.
- Activate confirm: opens on its h2, Esc returns focus to "Activate". OK.
- Preview Esc order: Interact -> Esc#1 stops interacting (focus "Interact with the preview"), Esc#2 closes panel and focuses "Preview in app", Esc#3 stays. OK.
- Route stop Undo: remove stop -> focus on "Undo removing Stop 1 ... Ctrl+Z"; Ctrl+Z restores (1 -> 2 stops), focus on "Stop 1" link. OK.

## 7. Regressions and open items
| Id | Sev | Finding and evidence | Owning area (plan §6) |
|---|---|---|---|
| R2-V-01 | P2 | Draft Route whose only stop is a DRAFT POI: the editor shows a red "No active stop ... must be an active point of interest before the route can be activated" block, while the header, card and "Before you activate" say "3 warnings, nothing blocks" and offer "Save and activate". Blocker vs warning disagree (D-090 one model). `shots/1440-route-undo-bar.png` | W0-B (`completeness.ts`) with P5a (Route editor block) |
| R2-V-02 | P3 | HelpHint icon buttons are 32 px at fine pointer (brief asks >= 40; 44 coarse passes) | W0-A (ui primitives / HelpHint) |
| R2-V-03 | P3 | Sticky chrome incl. the 56 px app header is 23 % of 1280x720 on the POI list (162-166 px) and 33 % at zoom200 on the POI editor; only the part below the app header meets the 15 % rule (106-110 px) | W0-B (D-089 counting convention; P3-core toolbar) |
| R2-V-04 | P3 | Toast in a wide editor overlaps the form column's right edge (996 vs 992) and covers form content bottom-right; known caveat in R2-fixup | R2-fixup / W0-A (`AppToast`, `toastOffset.ts`) |
| R2-V-05 | P3 | Row menu opens with focus on its first item, which can be "Deactivate" (a state change); consider focusing the menu or placing Edit first | P3-core (`RowMenu`) |
| R2-V-06 | P3 | At 1440 the editor's sticky side column is clipped at the bottom of the viewport: the "What needs attention" card is cut with no bottom edge until scrolled (`1440-toast-save-first.png`) | W0-B (`EditorShell` side max-height) / P4s |
| R2-V-07 | P3 | Populated POI editors are still 1,965-1,983 px tall at 1440 (empty draft 1,408); R2-fixup quoted 2,300 for another record | P4 / P4s |
| R2-V-08 | info | `/projects/<id>/appearance` is "Page not found" (the Appearance tab lives under App settings); out of scope, no action | - |
Cross-screen consistency: status chips, Working Copy banner, page heads, empty/disabled "Apply changes" and list toolbars look consistent across Places/POIs/Routes/Guides/Events/Categories, Maps and Media; out-of-scope placeholder pages (Launch, Pages) have a 4 px different left inset than the in-scope heads (not scored).
