# DECISIONS

Append-only. An entry is never edited or removed; a later entry supersedes it by id. Types:
`implementation`, `spec-interpretation`, `adr`. ADR entries carry `Owner approval`. Conventions follow
the backend's DECISIONS.md.

## D-001 (2026-10-02) — Bootstrap regime

- Type: implementation
- Decision: the living documents of this repository are created from `../bootstrap-frontend-prompt.md`.
  The bootstrap session changed no source, build, configuration, or test file here. `node_modules/` and
  `dist/` were produced by `pnpm install` and `pnpm run build`; both are gitignored.
- Why: every later session continues from one short prompt against truthful documents.
- Alternatives: fixing gaps during the bootstrap; rejected.
- Affected specs: none.

## D-002 (2026-10-02) — Specs and backend are read-only from this repository

- Type: implementation
- Decision: no frontend session creates, edits, or deletes files in `../uniche_iguide_specs` or
  `../uniche_iguide_backend`. Spec changes are QUESTIONS.md `spec-change-request`s; backend needs are
  GAPS.md entries naming the backend item. Spec edits made on owner instruction are recorded where they
  were made (backend D-008, D-014 on 2026-10-02).
- Why: one design of record, one owner of the API contract.
- Alternatives: none.
- Affected specs: all.

## D-003 (2026-10-02) — Specs baseline

- Type: implementation
- Decision: the same baseline as the backend: `1c982b656bef9fd0470485f02401abdae56e0f61` of 2026-10-01,
  plus the uncommitted owner edits of 2026-10-02 to `02`, `07`, `08`, `10`, `12`, and specs `CLAUDE.md`
  (backend D-008, D-014). The next session moves it once those edits are committed.
- Why: both repositories must measure against the same specs.
- Alternatives: none.
- Affected specs: all.

## D-004 (2026-10-02) — Prototype precedence and the conflicts found

- Type: spec-interpretation
- Decision: `12` and `14` win on behavior, data, and flows; `iGuide CMS.html` governs visual design,
  layout, and screen composition where the text is silent; spec vocabulary is canonical over the
  prototype's (`source-notes` §CMS prototype review, 2026-10-01). `MOCKUP_PROMPTS.md` is older context and
  yields to the prototype (Montserrat and gradient actions over Inter and "no gradients"). Conflicts found
  on 2026-10-02 and resolved by this rule:
  - P1 Navigation: the prototype's "Kiosk menu" (`PRIMARY · KIOSK`), `FOOTER · WEB`, `UTILITY` context, and
    surface selector give way to one `PRIMARY` and one `FOOTER` shared by every surface (`03` §13, `12` §3);
  - P2 audit actions `APPLICATION_STATUS_CHANGED`, `WORKING_COPY_APPLIED`, `RESOURCE_STATUS_CHANGED`,
    `PACKAGE_REQUESTED` give way to the `05` §3 enum;
  - P3 package versions `v1.3.0` give way to the integer `version` of `04` §13;
  - P4 a `FAILED` package with `TEMPLATE_VALIDATION_FAILED`: that condition rejects the request with `422`
    and is not a `failureReason` (`07` §11);
  - P5 the Dashboard's "recalculated automatically, 2 hours ago" line is dropped (`12` §3);
  - P6 `ARCHIVED` rows offering Activate and Archive give way to Restore only (`03` §1);
  - P8 the theme's "On primary" colour does not exist (`04` §9);
  - P9 the Preview text "Nothing here is published until a Deployment Package is generated" gives way to
    `01` §5: Content reaches visitors when the Application is `LIVE`, without a package;
  - P11 the MuseMind action is hidden until the gateway exists (`12` §3, backend Milestone 13).

  P7 and P10 are open (QUESTIONS.md Q-001, Q-002).
- Why: the bootstrap rule; `STATUS.md` records `12` as validated against the prototype on 2026-10-01.
- Alternatives: prototype first; rejected, because the prototype predates the 2026-10-01 spec decisions.
- Affected specs: `12`, `14`, `source-notes`.

## D-005 (2026-10-02) — API sync mechanism and generator

- Type: implementation
- Decision: copy of the backend contract at `api/openapi.yaml`, with `api/SOURCE` holding the backend
  commit; `make api-sync` copies it from `../uniche_iguide_backend/openapi/openapi.yaml` and regenerates
  `src/api/generated/` with openapi-typescript; requests go through openapi-fetch with middleware for the
  bearer token, the single `401` retry, and RFC 7807 parsing, reusing `src/platform/auth.ts`; CI
  regenerates and fails on a diff; generated files are never edited. Built by PLAN.md C0b.
- Why: types only plus a thin fetch client keep the existing session code, add no runtime framework, and
  make drift a compile error.
- Alternatives: openapi-generator `typescript-fetch` (large generated runtime, Java toolchain); orval
  (couples to a query library the CMS does not use); hand-written types (current gap).
- Affected specs: `07` §14, `10` §8; backend D-004.

## D-006 (2026-10-02) — Tooling found in place

- Type: implementation
- Decision, as found in commits `e43b01e` and `4c6789c`: Vue 3.5, TypeScript 6, Vite 8 on port `5173`
  (`strictPort`), vue-router 4, vue-tsc; Tailwind 3 with shadcn-vue configuration, radix-vue,
  class-variance-authority, tailwind-merge, lucide-vue-next; @vueuse/core; keycloak-js 26 with
  `check-sso`, PKCE `S256`, `checkLoginIframe: false`, tokens in memory; runtime configuration through
  `window.__UNICHE_CONFIG__` in `public/config.js` with `VITE_*` fallback and no defaults; reactive stores
  without Pinia; `fetch` for requests and XHR for upload progress; Leaflet 1.9 with OpenStreetMap tiles and
  Nominatim; Montserrat and the prototype palette in `src/style.css`.
- Why: recorded retroactively; the specs leave these open.
- Alternatives: none evaluated.
- Affected specs: `01` §1, `12`.

## D-007 (2026-10-02) — pnpm is the package manager

- Type: implementation
- Decision: `pnpm-lock.yaml` is the only authoritative lockfile; installs use
  `pnpm install --frozen-lockfile`. `package-lock.json` is out of sync and is removed by PLAN.md C0d.
- Why: verified 2026-10-02: `npm ci` refuses the stale `package-lock.json`; pnpm installs from its
  lockfile, and typecheck and build pass.
- Alternatives: regenerate `package-lock.json` and use npm.
- Affected specs: none.

## D-008 (2026-10-02) — The CMS calls only the authoring API and Keycloak

- Type: spec-interpretation
- Decision: organization names, `/me/authorization`, and Project data come through the backend
  (`GET /api/v1/organizations`, `/me/authorization`, `/organizations/{orgId}/projects`); the CMS never
  calls the Catalogue. This differs from the Media Editor reference frontend, which calls the Catalogue
  for `/me/authorization` and organization names.
- Why: `07` §2 ("It talks to `/api/v1/**`") and `12` §7; one origin to configure and one error model.
- Alternatives: direct Catalogue calls, which need Catalogue CORS for the CMS origin.
- Affected specs: `02` §10, §11, `07` §2, `12` §7.

## D-009 (2026-10-02) — First goal: platform integration on the dev box

- Type: implementation
- Decision: owner priority of 2026-10-02 (backend D-015). `Now` is C0a (dev-box wiring and live sign-in),
  C0b (API sync), and C0c (C0 screens against the backend); quality gates follow as C0d.
- Why: every later step stands on sign-in, authorization, and the picker.
- Alternatives: quality gates first.
- Affected specs: `08` §Companion repositories C0.

## D-010 (2026-10-02) — Dev box uses the live platform; `dev/` stand-ins are optional

- Type: implementation
- Decision: the default local setup signs in to the live realm (`https://idp.uniche-eccch.eu`, client
  `iguide-web`) and the backend calls the live Catalogue. `dev/docker-compose.yml` (local Keycloak,
  Catalogue mock, S3 mock) stays for offline work; its tokens are not accepted by the live Catalogue.
  Its tool slug is corrected to `iguide` by C0a.
- Why: verified 2026-10-02: `iguide-web` exists on the live realm with the `localhost:5173` redirect and
  web origin, and the backend works against the live Catalogue (backend TRACEABILITY.md R3).
- Alternatives: stand-ins as default.
- Affected specs: `10` §4, §6.

## D-011 (2026-10-02) — Categories are ordered by `sortOrder`

- Type: implementation
- Decision: the Categories list sorts by `sortOrder` with manual reordering, like Places, Points of
  Interest, Routes, Guides, and Events. On owner instruction `12` §3 and `07` §14 were aligned with `06` §16
  in the specs commit `a792ede`. The prototype's "Sorted by last update" gives way. Resolves QUESTIONS.md
  Q-001.
- Why: the author's order is the order of the visitor's Category filter (`03` §10).
- Alternatives: `updatedAt`, as the prototype and the earlier `12` §3.
- Affected specs: `06` §16, `07` §14, `12` §3.

## D-012 (2026-10-02) — Primary action keeps the gradient only where it passes 4.5:1

- Type: implementation
- Decision: the page's primary action keeps the prototype's gradient pill, with colour stops darkened so
  that white text reaches at least 4.5:1 at every point of the gradient (WCAG 2.1 AA 1.4.3), verified by the
  axe check and a contrast test over the lightest stop. If no stop set keeps the look and passes, the
  primary action falls back to the solid UNICHE purple pill (`#4c1d8b`, about 11:1 with white). Resolves
  QUESTIONS.md Q-002.
- Why: the prototype governs visuals (D-004) but WCAG 2.1 AA is a gate (`14` §1); the light cyan end of the
  current gradient cannot carry white text at 4.5:1.
- Alternatives: the gradient as drawn (fails); solid purple everywhere (loses the prototype's hierarchy).
- Affected specs: `14` §1, prototype.

## D-013 (2026-10-02) — Specs baseline moved to `a792ede`

- Type: implementation
- Decision: the specs baseline is `a792ede3086068f24ffb2c07f608215bee4ec516` (2026-10-02 15:36 +0300).
  Supersedes the baseline of D-003; same as backend D-016.
- Why: the owner committed the edits on 2026-10-02.
- Alternatives: none.
- Affected specs: `02`, `07`, `08`, `10`, `12`, specs `CLAUDE.md`.

## D-014 (2026-10-19) — "Preview" in the resource editors is drawn by the CMS until the runtime exists

- Type: owner decision (2026-10-19) and spec-interpretation
- Decision: the Place, Point of Interest, Route, Guide, and Event editors have a "Preview" button beside
  Save (owner's placement). It opens, at the top of the right column, a panel that draws the Resource in a
  visitor shell on a Mobile, Web, or Kiosk screen, scaled to the panel (`components/editor/ResourcePreview.vue`,
  `workspace/preview.ts`). It renders the live form, unsaved changes included, in the language of the
  active tab; a text missing in that language shows the default-language value, as the manifest fills it
  (`11` §3), outlined and labelled in red. Media follow the runtime's choice: the binding of the previewed
  language, else the one for every language (`11` §3).
- Why: `12` §3 asks for the Resource "rendered in the effective theme on the enabled surfaces", which
  means the web runtime in an iframe fed by `manifest?preview=true` (`12` §3 Preview); neither the runtime
  nor the backend preview API exists yet. The owner chose a stand-in now over waiting.
- Consequences: it is an approximation in the default UNICHE theme, shows all three surfaces (no
  surfaces or theme exist yet), and has no fire-trigger control (GAPS.md G-020). Replaced by the runtime
  iframe with C5.
- Alternatives: wait for the runtime; preview the saved version only.
- Affected specs: `11` §3; `12` §3 Resource editors, Preview.

## D-015 (2026-10-19) — Visitor app → Preview is a navigable stand-in app

- Type: owner decision (2026-10-19) and spec-interpretation
- Decision: the Preview section (`12` §3 Preview, mockup screen 14) is a CMS-drawn visitor app built on the
  editors' preview (D-014): surface chips (Web, Mobile, Kiosk), language chips, "Working content" (drafts
  and active) or "Live content" (active only), a status line counting titles missing in the language, a
  "Fire trigger" control, and "Open in new tab" (`/projects/{id}/app-preview`, no CMS chrome, the
  author's own session, nothing shareable). Inside: a shell with a default menu (Home and one item per
  content kind) standing in for the PRIMARY Navigation, a bottom bar on Mobile, Home (highlights from
  `featured`, then a row per kind), a list per kind, search over titles, summaries, and exhibit numbers,
  and detail screens linked to each other (route stops, guide items, event links, sub-places, POIs of a
  place). A fired QR trigger opens its target with a note; a beacon or geo-proximity trigger only shows a
  "Nearby" suggestion, as `03` §14 and `13` §7 require. Data comes from the authoring endpoints
  (`workspace/previewData.ts`), not `manifest?preview=true`.
- Why: the owner chose the stand-in over waiting for the runtime and the backend manifest.
- Consequences: no Pages, Navigation, theme, or surfaces are reflected (GAPS.md G-020); the content is
  loaded once per visit to the screen and reloads with it.
- Alternatives: the real runtime in an iframe; the backend manifest first.
- Affected specs: `03` §14; `11` §3, §9; `12` §3 Preview; `13` §7.

## D-016 (2026-10-21) — Editing ACTIVE Resources through their working copy

- Type: spec-interpretation and owner decision (2026-10-20: all eight content kinds, with backend D-027)
- Decision: the Place, POI, Route, Guide, Event, Category, map, and floor plan editors edit an `ACTIVE` Resource
  through its working copy (`12` §3 Resource editors, §4 Edit an ACTIVE Resource):
  - `useResourceEditor` loads the copy when the Resource has one and fills the form from `resource`, the
    backend's rendering of the copy; saves of an ACTIVE Resource go to `PUT .../working-copy` with the whole
    state (`platform/workingCopies.ts`; each adapter builds the payload from the same input as its DRAFT
    save); "Apply changes" in the header saves pending edits first, then applies after a confirmation naming
    the Resource; "Save draft" and "Discard changes" sit in the amber banner;
  - after an apply `409` the CMS reads the live row and lists the fields that differ, scalar fields by name
    and translated fields as `translations.<lang>.<field>`, anything else (lists, rich text) as a whole, each
    with "Mine" or "Current"; "Save my choices" reopens the copy on the current version (backend D-027), and
    the author applies again. The CMS computes the paths itself, since the backend sends no
    `conflictingFields` yet (backend G-034);
  - the banner names the last editor "you" or "another author" from the copy's subject until Audit Events
    give a display name;
  - POI triggers stay rows of their own (backend D-026): a "Save draft" of an ACTIVE POI saves trigger changes
    live, as before;
  - lists show a "Pending changes" badge and a "Pending changes" filter chip from `hasWorkingCopy`.
- Why: AGENTS.md §4 rule 6; owner priority.
- Consequences: deactivating or archiving discards the copy, and the confirmation says so; the editors'
  preview stand-in (D-014) shows the form, which is the copy.
- Alternatives: per-field merge in the backend (`07` §15 leaves it to the CMS); read-only ACTIVE editors until
  the generated client (rejected by the owner).
- Affected specs: `03` §1; `07` §14–15; `12` §3, §4, §5.

## D-017 (2026-10-21) — Manual reordering in the content lists

- Type: spec-interpretation (owner request 2026-10-21)
- Decision: the Places, Points of Interest, Routes, Guides, Events, Categories, and Floor plans lists reorder by
  drag and drop on a handle, persisted through `PUT .../{kind}:order` (`12` §3 Content library), in
  `workspace/useReorder.ts`, `components/ReorderControls.vue`, and `platform/ordering.ts`:
  - a row moves only among its siblings: the same parent in the Place and Category trees (Categories also per
    scope), the same Place for floor plans (the order of its floor switcher, `12` §3 Maps & Floor Plans), and
    every row in the flat lists; the siblings take back the positions they held, so no other row moves and the
    request lists every id of the Project, as the backend requires;
  - "Move up" and "Move down" buttons on every row are the keyboard path (AGENTS.md §4 rule 7); a polite live
    region announces the new position;
  - reordering is off while a search, a status chip other than All, or a Category filter is active, since a
    move among the visible rows would not say where hidden rows go; the list says so;
  - the new order shows at once and is saved; a failed save restores it, and `INCOMPLETE_ORDER` (a row added or
    removed meanwhile) reloads the list;
  - `sortOrder` changes never touch `version` (backend D-019), so reordering works on ACTIVE Resources and their
    working copies alike.
- Why: `12` §3 names drag and drop and the order endpoint but not trees, filters, or the keyboard path.
- Alternatives: moving across parents by drag (rejected: changing the parent is an edit with its own rules, done
  in the editor); a reorder mode with its own Save (rejected: one action per move is simpler to undo).
- Affected specs: `12` §3; `14` §4.

## D-018 (2026-10-22) — Triggers on every content kind

- Type: spec-interpretation (owner request 2026-10-22, with backend D-028)
- Decision: the "How visitors reach it" card and the list chips cover Places, Routes, Guides, and Events as well as
  Points of Interest (`12` §3 lists the card under "Common to every kind"):
  - `platform/triggers.ts` takes the target kind (`listTargetTriggers`, `syncTriggers`, `groupTriggersByTarget`);
    triggers stay rows of their own, saved live before a DRAFT save and with "Save draft" of an ACTIVE Resource,
    never in its working copy (D-016, backend D-026);
  - the geo-proximity default is the Resource's position where it has one: a POI's own, a Place's stored
    coordinates, a Route's first stop's POI, an Event's chosen POI else its Place; a Guide has none;
  - the lists show chips under the slug; only the POI list says "No trigger, only reachable by browsing", since
    `12` §3 asks it of Points of Interest only;
  - the preview stand-in (D-015) fires a trigger on its own target kind, not only on POIs.
- Why: the backend accepts these targets since backend D-028; `12` §3 and `03` §14 set no kind limit.
- Consequences: an active trigger keeps its target in use, so deactivating or archiving it shows the where-used
  block naming the trigger. A Route Stop has no trigger of its own; it is reached by its POI's triggers (`03` §14).
- Alternatives: a trigger screen of its own (rejected by `12` §3); the "No trigger" text on every list (not asked).
- Affected specs: `03` §14; `11` §9; `12` §3.

## D-019 (2026-10-22) — The QR image is drawn by the CMS until the app has its public web address

- Superseded 2026-10-30 by D-039: no stand-in; without the address the card says the QR cannot be produced.

- Type: owner decision (2026-10-22) and stand-in, like D-014 and D-015
- Decision: every QR code row of the "How visitors reach it" card shows a QR image, the link it encodes, and
  "Copy link", "Download PNG", and "Open" (`components/editor/QrCodePreview.vue`, the `qrcode` 1.5.4 package):
  - the link is the CMS's stand-in visitor app, `/projects/{id}/app-preview?t={code}`, with the `?t=` of the
    runtime URL scheme (`11` §9); `AppPreviewView` fires the QR trigger with that code once the content is loaded,
    so the stand-in app opens its target, or says no such code exists;
  - the image follows the code as typed; a new row without a code says that saving generates one.
- Why: the backend's `qr.png` answers `422 NO_PUBLIC_BASE_URL` until App settings → Surfaces exists (backend
  G-033), the visitor app does not exist yet, and the owner wants to see and try the QR now.
- Consequences: the image is not the one to print for visitors: it opens the CMS, for signed-in authors on a device
  that reaches it (GAPS.md G-021). The card states this.
- Alternatives: a configured temporary base URL in the backend's `qr.png` (rejected: it would print codes for an
  address that does not exist yet); waiting for Milestone 2.
- Affected specs: `03` §14; `11` §9; `12` §3 Resource editors, Preview; §4 Generate a QR code.

## D-020 (2026-10-22) — Surfaces tab and the backend's QR image

- Type: owner decision (2026-10-22, with backend D-029); supersedes D-019 where the Project has a public web address
- Decision:
  - App settings → Surfaces (`views/workspace/SurfacesView.vue`, `platform/surfaces.ts`) lists Web, Mobile, and
    Kiosk with an enable switch each and the Web surface's public web address, saved together with
    `PUT .../surfaces` (`12` §4 Change surfaces); all three are offered while Templates do not exist (backend
    M2a), and the address rules are the backend's (https origin, http only for localhost);
  - a saved QR code whose trigger has a `runtimeUrl` shows the backend's `qr.png`, fetched with the author's
    token as a blob (`apiBlob`, `components/editor/BackendQrCode.vue`), with the runtime URL, Copy link, Download
    PNG, and Open (`12` §4 Generate a QR code); an unsaved or changed code says to save first;
  - without an address the stand-in of D-019 stays, with a link to App settings → Surfaces.
- Why: the backend renders the real QR once the WEB surface has `publicBaseUrl` (`03` §2, `07` §14, `11` §9).
- Consequences: the address decides every printed QR, so the tab warns that changing it breaks printed codes.
- Alternatives: keep drawing in the CMS with the real URL (rejected: one image source, the backend's, for print).
- Affected specs: `03` §2, §14; `07` §14; `11` §9; `12` §3 App settings, §4 Change surfaces, Generate a QR code.

## D-021 (2026-10-23) — The Translation workspace

- Type: spec-interpretation and owner decision (2026-10-23: every kind, the Guide story, and Route stops)
- Decision: Visitor app → Translations (`views/workspace/TranslationsView.vue`, `workspace/translationCatalog.ts`,
  `platform/translations.ts`) implements the Translation workspace of `12` §3 over the per-language endpoints of
  backend D-031 and D-032:
  - a matrix of every non-archived Place, Point of Interest, Route, Guide, Event, Category, and media item by
    enabled language; each cell shows a dot and its state in words (Complete, "n of m", Missing), counting the
    fields the lists' dots count, plus a Guide's story; for media: the title, alternative text for a
    non-decorative image, and the transcript of audio and video; filters by kind, by state in the target
    language, and by title;
  - the editor shows the default language read-only beside the target language, field by field; the Guide story
    in the rich-text editor, saved through its TEXT block; each Route stop's texts as a sub-card; "Save" sends
    one request per changed part; "Next missing" opens the next listed resource whose target language is not
    complete; the editor of one resource stands for "across one Resource or a whole kind" by stepping through
    the kind with "Next missing";
  - an ACTIVE Resource is translated through its working copy: pending texts are shown, the saves carry the copy's
    version from `X-Working-Copy-Version`, and a banner says the changes are applied in its editor; a version
    conflict reloads the resource with a toast; leaving or switching with unsaved text asks first;
  - "Translate with MuseMind" and the "Unreviewed AI output" filter are shown disabled with the reason: the UNICHE
    AI gateway is not connected (`09` §16, backend M13).
- Why: owner priority; the backend endpoints exist (backend D-031, D-032).
- Consequences: a Guide without a story and a stop added only in pending changes cannot be translated here; the
  page says so and links to the editor. Archived resources are not listed.
- Alternatives: saving through each kind's whole update body (rejected: it would rebuild every kind's payload).
- Affected specs: `12` §3 Translation workspace, §5; `14` §4.

## D-022 (2026-10-23) — Readiness on the Dashboard and the Resource form

- Type: spec-interpretation (owner request 2026-10-23, with backend D-033)
- Decision: the CMS reads `GET /projects/{id}/readiness` (`platform/readiness.ts`, hand-written types, G-001) and
  shows the same codes in two places (`12` §5: "the same codes appear in the Dashboard, in activation, and on the
  Resource form"):
  - Dashboard: one status card at the top: "Ready for visitors" or "N things block going live", one sentence on
    the consequence, at most three blocking items with links to the editor that fixes them ("Show all" for the
    rest), and the warnings in a disclosure; computed on every visit, no recompute button (`12` §3);
  - Resource form: in the Status panel of an ACTIVE Resource, "What needs attention" lists its own items (blocking
    or warning, in words, with the language); a click opens that language's tab and focuses the field;
    `PENDING_WORKING_COPY` is left out there, since the pending-changes banner says it; DRAFT Resources are not
    evaluated by readiness, so their panel keeps the activation hint;
  - after any save or activation `422` the editor focuses the first field in error (`data-path` on the translated
    fields, the `f-<field>` ids elsewhere), falling back to the error summary;
  - every readiness code of `07` §14 has one plain-language sentence, the not-yet-produced ones included, plus the
    two Route codes of backend Q-017.
- Why: `12` §3 Dashboard and §5; the to-do item "Readiness codes".
- Consequences: a field inside a collapsed group (such as a POI's "Practical details") is not focused until the
  group is opened; focus then falls back to the error summary.
- Alternatives: a separate readiness screen (the Launch screen of `12` §3 will hold the full list once it exists).
- Affected specs: `07` §14; `12` §3 Dashboard, Resource editors, §5; `14` §4.

## D-023 (2026-10-23) — Resource editors arranged as the prototype

- Type: owner decision (2026-10-23, from a side-by-side comparison with the prototype)
- Decision: `EditorShell.vue`, shared by every Resource editor, follows the prototype's arrangement (AGENTS.md §2, §6):
  - a 760px form column beside a 310px side column, within 1090px, instead of a form stretched across the screen
    with the side column at the far edge;
  - the head carries the status chip and, while a working copy exists, a "Pending changes · edited by …" chip on the
    title's line, and the meta line ends with the version;
  - the side column holds, in order: a "Preview in app" button with the preview below it (was a header button),
    "Status and visibility" (Status, Slug, Version, Last updated, Created; full-width Activate/Deactivate/Restore
    and an Archive outline button; the readiness list of D-022), Translations, and "Used in (n)" from the same
    `GET .../references` as the archive check, linking to each referrer.
- Consequences: the prototype's "By" row is left out: the read DTOs carry no last editor and names wait for Audit
  Events (backend G-034). No editor's fields or behaviour change.
- Affected specs: `12` §3 Resource editors; prototype `iGuide CMS.html`.

## D-024 (2026-10-26) — Unsaved form state kept in browser storage

- Type: spec-interpretation (owner request 2026-10-26; `12` §5, §6 session expired; AGENTS.md §4 rule 11 [ARC_5.8])
- Decision: `useResourceEditor` keeps an editor's unsaved form in `localStorage`, for every Resource editor:
  - the key is `iguide:draft:<author's subject>:<editor path>`, so a draft belongs to one author and one Resource;
    the value is the form state, the time, and the Resource's version it started from; nothing is sent to the
    backend before the author saves, and no token or other session data is stored;
  - it is written 0.6 s after typing stops and again when the page is hidden or unloaded (a reload, a closed tab,
    the login redirect after a failed refresh);
  - opening the same editor with a stored draft that differs from what was loaded shows "Unsaved changes from
    <time> are kept in this browser" with Restore and Discard; when the Resource's version changed meanwhile, the
    banner says so, and saving then meets the usual version conflict;
  - the draft is removed when the form is saved, applied, discarded, or back to its saved state, when the author
    discards it, and when the author confirms "Leave without saving";
  - storage that is full or blocked is ignored; the leave guard still protects the form.
- Why: "a lost session does not lose an hour of writing" (`12` §5).
- Alternatives: `sessionStorage` (rejected: lost with the tab, which is what the rule guards against).
- Affected specs: `12` §5, §6.

## D-025 (2026-10-26) — Problem details read as specified, and a field-by-field DRAFT save conflict

- Type: spec-interpretation (owner request 2026-10-26, with backend D-034; `07` §15, `12` §5)
- Decision:
  - `ApiError` reads RFC 7807 problem details: `code` from `code`, else the suffix of the URN `type`
    (`urn:uniche:iguide:problem:<CODE>`), else an earlier bare `type`; the message from `detail`, then `title`;
    `errors[{path, code, message}]` kept with their codes as `fieldErrors` beside the "path: message" `details`
    the forms and adapters already use; `requestId` from the body, else `X-UNICHE-Request-Id`, else
    `X-Request-Id`. Requests accept `application/problem+json`. Both the earlier envelope and the new one read
    the same, so the CMS works before and after the backend change;
  - a `409 VERSION_CONFLICT` on a DRAFT save opens the same field-by-field choice as an apply conflict (D-016):
    the CMS reads the current row, compares its form state with the author's (scalar fields by name,
    `translations.<lang>.<field>` per field, lists and rich text whole), and "Save my choices" saves the merged
    form on the current version; "Reload their version" stays. The working-copy save conflict keeps its own path.
- Why: G-006; `12` §5 asks for "mine" or "current" per conflicting field and no automatic merge.
- Consequences: the paths are computed by the CMS, since the backend sends no `conflictingFields` yet, and the
  dialog names no last editor until Audit Events exist (backend G-034).
- Affected specs: `07` §15; `12` §5, §6.


## D-026 (2026-10-26) — MuseMind translation, AI markers, and "mark reviewed"

- Type: spec-interpretation (owner choice 2026-10-26: all of it, on a mock gateway; with backend D-035; `12` §3
  Translation workspace, `03` §1 Content provenance)
- Decision:
  - the CMS never calls the AI gateway: `src/platform/ai.ts` calls the backend's `GET /ai/status`,
    `POST …/translations/{lang}:translate`, `POST …/translations/{lang}:mark-reviewed`, and
    `GET /projects/{p}/ai-provenance`;
  - "Translate with MuseMind" works on the open Resource and target language when the status is `MOCK` or
    `AVAILABLE`; `MOCK` shows a "Mock" badge and says so in the toast, `DISABLED` (or an unreadable status) keeps
    the button off with the reason, and media items say they are not machine-translated yet. When the target
    language has text, or the form has unsaved changes, the author confirms first. The response is applied as a
    save is (versions, `X-Working-Copy-Version`, pending changes for an ACTIVE Resource). Only the plain fields are
    translated; the Guide story, Route stops, and media items stay by hand (since D-027 they are translated too);
  - markers come from the provenance list, keyed by kind, Resource, and language: "AI · unreviewed" (amber) or
    "AI · reviewed" (grey), with "· pending" when the text is only in the pending changes, as text in the matrix
    cells and the editor, never colour alone. The editor shows the open language's service, source language,
    generation and review times, and the citations ("No citations returned." when there are none), plus the
    other languages' markers by name;
  - "Mark reviewed" records the review without changing the text; saving changed text of an AI language counts
    as a review on the backend, so the CMS re-reads the provenance after such a save;
  - the "Unreviewed AI output" filter lists Resources with any unreviewed AI language, pending ones included;
    the chip shows how many;
  - the status and the provenance load beside the matrix; if either fails the workspace still works without them.
- Why: `12` §3 asks for the action, the marker with citations, "mark reviewed", and the filter; AGENTS.md §4 keeps
  the gateway behind the backend; the gateway API does not exist yet (`08` Milestone 13), hence the mock.
- Consequences: the `CONTENT_REVIEWED` Audit Event waits for backend Milestone 7; the Resource editors show no AI
  markers yet; the real gateway adapter follows (to-do list); children, Assets, and the story came with D-027.
- Affected specs: `03` §1; `12` §3.

## D-027 (2026-10-26) — MuseMind for Route stops, the Guide story, and media items

- Type: spec-interpretation (to-do follow-up of D-026; with backend D-036; `12` §3 Translation workspace, `03` §1)
- Decision:
  - "Translate with MuseMind" translates the whole open item into the target language, part by part: the
    Resource's own texts, then each stop that exists live (`POST …/routes/{r}/stops/{s}/translations/{lang}:translate`),
    then the story's block (`POST …/guides/{g}/blocks/{b}/translations/{lang}:translate`, the rich text with its
    headings and images kept); a media item through `POST …/assets/{a}/translations/{lang}:translate` (in place, by
    its version). Each part is saved as it returns, so the versions chain as in a save;
  - a part whose default language is empty (`NOTHING_TO_TRANSLATE`) is skipped and named in the toast; the first
    other failure stops the rest, keeps what was done, and the error summary names the part it stopped at and
    what was translated before it; a version conflict reloads as a save conflict does;
  - the confirmation asks before overwriting whenever any part of the target language has text, or the form has
    unsaved changes;
  - markers are keyed by item, part, and language (`entryLocation` in `platform/ai.ts` reads `parentType` and
    `parentId` of stop and block entries); the matrix cell and the "Other languages" line summarise every part of
    a language ("unreviewed" while any part is, "pending" while any part is), and the "Unreviewed AI output" filter
    counts an item when any part is unreviewed;
  - the editor shows a marker with its own "Mark reviewed" for the Resource's texts (at the top), for each stop
    (under its title), and for the story (above it), in `components/editor/AiMarker.vue`.
- Why: `12` §3 offers MuseMind "per cell or Resource"; the parts are the Resource's in the matrix, so one action
  per item keeps the cell and the action aligned.
- Consequences: stops that exist only in the pending changes are not translated (they cannot be edited here
  either, D-021); a stop or block replaced when its pending changes are applied loses its marker (backend D-036).
- Affected specs: `03` §1; `12` §3.

## D-028 (2026-10-27) — Content screens stop offering what the specs removed

- Type: spec-alignment (owner request 2026-10-27, "Content" quick fixes A1, A3, A4, A8, A9, A13 of the to-do list,
  after a full re-read of the specs)
- Decision:
  - Route stops have no "Optional" checkbox; `RouteStop` loses `optional` (`03` §9: optional stops, per-stop
    duration, and stop triggers were removed on 2026-10-01; the backend never stored them, D-021 refused them);
  - POI, Route, and Guide editors have no "Search and sharing" (SEO) fields; `PoiTranslation`,
    `RouteTranslation`, and `GuideTranslation` lose `seoTitle`/`seoDescription`, and the clients send and read the
    backend's translations as they are (`12` §3 Page builder: SEO fields do not exist; `03` §6, §9, §11 list none);
  - the Floor plan editor has no "Connections" card and `FloorPlan` no `connections` (`03` §8, removed
    2026-10-01; floors switch by `sortOrder`); the Floor plans list no longer counts them;
  - the POI's instructions and accessibility information sit in a collapsed "Practical details" group with its
    filled count (`12` §3 Point of Interest); a field in it with an error or a readiness target still opens it
    (D-022);
  - the Route editor warns, without blocking, when the Route has fewer than two stops (`12` §3 Route, `03` §9;
    backend `ROUTE_FEW_STOPS`), and the Route map lists by name the stops it cannot draw (`12` §3 Route);
  - the Place creation dialog points to the editor's Place setup for the map or floor plan link.
- Why: the specs removed these fields and the backend refused them, so the CMS offered inputs it could never save.
- Consequences: the local "cannot be saved in iGuide yet" refusals for SEO texts and optional stops are gone; the
  Guide's refusal of Page items stays (until Pages exist).
- Affected specs: `03` §6, §8, §9, §11; `12` §3.

## D-029 (2026-10-27) — Route stops: drag and drop, position, and warnings

- Type: spec-interpretation (owner request 2026-10-27, "finish Route": to-do A2, A30, A31, A32)
- Decision:
  - stops reorder by drag and drop on a handle, by Move up / Move down, and by a position list per stop, the
    keyboard way `14` lines 179-181 ask for; each move is announced in a polite live region. Stops are part of the
    form, so the order is saved with the Route (DRAFT) or its working copy (ACTIVE), not on drop as in the lists
    (D-017);
  - each stop whose point of interest is not ACTIVE says so under its row: a draft is not seen until activated, an
    archived or missing one should be removed (`DANGLING_REFERENCE`, `07` §14);
  - on an ACTIVE Route, when the stops' order differs from what visitors see now, a warning says that stop links
    follow the position (`/routes/{slug}/stops/{n}`, `11` line 292), so links and QR codes to a stop number lead
    elsewhere after apply; a stop added at the end or the last one removed moves no other link and does not warn;
  - the walking instructions get a visible label with "shown to visitors who cannot use the map" (`14` lines
    174, 225), and the narration hint adds "stays under three minutes" (`14` lines 225-227).
- Why: `12` §3 Route asks for drag-and-drop stops; `14` asks for keyboard alternatives and visible labels.
- Consequences: the backend refuses an apply that would leave new blocking issues, such as a Route without an
  ACTIVE stop (backend D-037, 2026-10-27); the editor then heads its error summary "The changes were not applied"
  and keeps the pending changes.
- Affected specs: `11` line 292; `12` §3; `14`.

## D-030 (2026-10-27) — Place setup editable: setting, level, and the map or floor plan

- Type: spec-alignment (owner choice 2026-10-27, replacing the owner decision of 2026-10-16 that fixed the setting
  and level after creation; to-do A6, A7)
- Decision:
  - the Place editor's "Place setup" card shows the creation dialog's steps, editable: 1 · Setting (Indoor or
    Outdoor), 2 · Level (top-level, or sub-place with its parent), 3 · the map or floor plan link (`12` §3 Place);
  - a sub-place picks its own setting (`03` §5); the parent list leaves out the Place itself, the Places inside
    it, and archived Places, so no cycle can be chosen; choosing "Sub-place" without a parent is refused at the
    field;
  - the setting cannot change while a map or floor plan is linked: the other choice is disabled with "unlink the
    map / floor plan below first" (the backend refuses it with `LINKED` at `environment`, shown at the setting);
  - the link step follows the saved setting, because linking applies at once: after the setting changes, the link
    is disabled until the Place is saved;
  - a linked Place offers "Open map" or "Open floor plan" (`12` §3 Place); before, an outdoor Place had none;
  - on an ACTIVE Place the changes go into its working copy like every other field.
- Why: `12` §3 says the setup shows the three choices editable; the backend already accepted both changes.
- Alternatives: keep them fixed (the 2026-10-16 choice), which made a wrong setting cost an archive and a re-create.
- Consequences: Place media stay out (QUESTIONS.md Q-005).
- Affected specs: `03` §5; `12` §3.

## D-031 (2026-10-27) — The Guide story as ordered blocks of text and references

- Type: spec-alignment (owner request 2026-10-27, to-do A10, A11; `12` §3 Guide, `03` §11; replaces the bridge of
  2026-10-15, GAPS.md G-004)
- Decision:
  - the Guide editor's "Story" card lists the Guide's blocks as the backend stores them (backend D-022): TEXT blocks
    (rich text per language) and REFERENCE blocks (a POI, Route, Place, or Event with an optional caption per
    language), freely interleaved, several TEXT blocks allowed, the same target allowed in several blocks; the
    separate "Related" list is gone;
  - blocks reorder by a drag handle, Move up / Move down, and a position list, announced in a live region (the Route
    stop pattern, D-029); "+ Text" and "+ Reference" add at the end, "+ after" inserts after a block; a reference
    whose target is a draft, archived, or gone says so; "Change" picks another target;
  - a DRAFT saves through the block endpoints (deleted, updated, created, then `:order` with every id); an ACTIVE
    Guide sends every block in order in its working copy; each block carries every enabled language, `null` clearing
    one. This fixes two bridge losses: extra TEXT blocks moved to the end on a DRAFT save and dropped from a working
    copy. Errors land at `blocks[i]…` (a DRAFT block's own request is prefixed by the client), focus reaches them
    (`data-path`), and a nested `translations.<lang>` opens its language tab;
  - A11: the spec's "paragraph block" is the TEXT block; its rich text holds images inline as before. The text
    editor now inserts a node after any node, shows each image's alternative text in the language (or "decorative",
    or the missing warning), and offers headings at levels 2 and 3 only (`14` lines 82-83);
  - the preview renders the blocks in the order written: text with heading levels, a reference as a card with its
    caption, a text block or caption missing in the previewed language marked and shown in the default language;
  - the Translation workspace lists every block (text through the text editor, reference through its caption),
    saves changed blocks one by one, and MuseMind translates them as one part each; the story counts towards
    completeness when the Guide has TEXT blocks, as "every TEXT block written" (also in the lists' dots);
  - Page references stay refused at their field until Pages exist (backend M6).
- Why: `12` §3 asks for "a story editor of ordered blocks: a paragraph block, or a reference block … with an optional
  caption"; the backend already had the model.
- Consequences: the backend's readiness still warns `MISSING_TRANSLATION` only for the first TEXT block and never for
  captions, and an image-only TEXT block fails activation (GAPS.md G-004).
- Affected specs: `03` §11; `12` §3; `14`.

## D-032 (2026-10-27) — One upload behaviour everywhere; a visible Category scope lock

- Type: spec-alignment (owner request 2026-10-27, to-do A12, A26-A29, A37; `12` §3 Media library and §5, `14` §2-§3,
  `03` §1)
- Decision:
  - every upload path (the upload dialog, the Asset picker's "Upload new", and "Replace file") goes through
    `useAssetUpload`: the size limits come from `GET /upload-limits` and are checked before any bytes leave the
    browser, against the type's own limit and the global `maxUploadBytes` (`sizeProblem`); while the limits cannot be
    loaded nothing is sent and the file fails with a Retry; every result (done, failed, cancelled) is announced in a
    polite live region; each file shows one `UploadEntryRow` (state, progress bar, reason, Retry — disabled when the
    file is too large — and Cancel); `UploadLimits` shows the per-type limits and the global one before upload;
  - the Asset picker takes several files, by the file chooser or dropped onto the dialog, selects the first one that
    fits the field, uploads images as floor plans when the field takes floor plans, and its tiles show the type and
    "Used in n" (mockup C-04);
  - "Replace file" is offered only for a DRAFT Asset: for an ACTIVE one it is disabled with "Visitors may be seeing
    this file … upload a new file and use it instead" (`03` §1, which the backend enforces too);
  - the media detail page keeps one "Used in" card, the shell's from `GET .../assets/{id}/references` (the spec's
    endpoint, `07` §14); the `/usages` card and its client call are gone;
  - a floor-plan image takes alternative text and the decorative flag like an image, with the hint that its text
    summarises the plan (`14` §2); the picker and the media lists warn when it has none; only an IMAGE requires the
    text before activation, as the backend checks;
  - ticking "Decorative" asks for confirmation (`14` §2: a primary image of an exhibit is never decorative); the
    alternative-text and transcript helpers carry the `14` §2 guidelines;
  - a Category in use shows the other "Applies to" choice disabled, with "Used by n … Remove it from them before
    changing what it applies to." under the chips (`12` §3 Category).
- Why: `12` §5 rejects an over-limit upload before any bytes leave the browser and asks for progress and retry on
  every upload; `14` §3 announces long operations; the picker was single-file without retry, and Replace had neither
  a limit check nor progress.
- Consequences: the backend neither requires nor reports missing alternative text on FLOOR_PLAN Assets
  (`AssetReadiness` checks IMAGE only), so for plans it stays a CMS warning.
- Affected specs: `03` §1, §4; `07` §14; `12` §3, §5; `14` §2, §3.

## D-033 (2026-10-27) — A 3D model with its poster on Points of Interest; media for all languages

- Type: spec-alignment (to-do A34, A35)
- Decision:
  - the POI editor's media gain "3D model" (a THREE_D_MODEL Asset, GLB, view only) and "3D model poster" (an image
    whose alternative text describes the object): a model without a poster is refused at the model's slot before
    saving, and the model slot warns while the poster is empty (`03` lines 521-531, kept by the MVP review; the
    backend binds the poster first and refuses `MODEL_POSTER_REQUIRED` otherwise); the picker offers `.glb` files;
  - a per-language slot, such as the audio narration, has an "All languages" row first: a binding without a
    language, which visitors get when their language has none of its own (`03` lines 510-512, `11` lines 169-171).
- Why: the spec keeps the 3D viewer and the language fallback; the backend already supports both.
- Consequences: only Points of Interest offer a model, as exhibits do; other kinds can add the same slots later.
- Affected specs: `03` §4; `11` §5.

## D-034 (2026-10-27) — Pan and zoom set a map's initial view

- Type: spec-alignment (to-do A14; `12` §3 Maps: "pan and zoom update the initial view")
- Decision: in the map editor, a move the author makes (drag, mouse wheel, keys, the zoom buttons) writes the map's
  centre and zoom into its initial view, which visitors open the map at; moves the map makes itself, such as fitting
  the bounds when it loads, change nothing. The "Set initial view" button is gone; the Latitude, Longitude, and
  Zoom fields stay, so the view can be typed without pointing (`14` lines 184-185). While the bounds are edited,
  the view is left alone.
- Why: the spec asks for it; the button step was easy to forget before saving.
- Affected specs: `12` §3; `14`.

## D-035 (2026-10-29) — "Featured" and search-language filters in the Content lists

- Type: spec-alignment (to-do A16, A17; `12` §3 Content library: search "across the title columns of all enabled
  languages, with an optional language filter"; filters by status, Category, `featured`, and `pending`)
- Decision:
  - next to the search, a "in all languages / in <language>" choice narrows what the search looks at to the titles
    (Categories: names) in that language; slug, exhibit code, and Category code are searched in any case;
  - a "★ Featured" chip shows only featured rows in the Places, Points of Interest, Routes, Guides, and Events lists
    (`03`: only those kinds have `featured`); Categories have no such chip;
  - both filter in the browser like status and Category, since the lists hold every row for reordering
    (D-017); while "Featured" is on, reordering is off, as for the other filters. Shared by
    `workspace/listFilters.ts`, `components/SearchLanguageSelect.vue`, and `components/FeaturedFilterChip.vue`.
- Why: the spec names both filters; the backend has them (D-030) but the CMS lists filter locally.
- Affected specs: `12` §3.


## D-036 (2026-10-29) — A refused activation from a list opens the editor at the first missing field

- Type: spec-alignment (to-do A18; `12` §3 Activate a Resource: "a `422` lists the missing required fields and the
  CMS jumps to the first"; `12` §5: `422` errors shown at the field and summarized at the top of the form)
- Decision:
  - when "Activate" in a Content list (Places, Points of Interest, Routes, Guides, Events, Categories, Maps, Floor
    plans) answers `MISSING_REQUIRED_FIELDS`, the list hands the field errors to the editor
    (`workspace/activationHandoff.ts`, kept in memory, read once) and opens it; a toast says so;
  - the editor (`useResourceEditor`), once loaded, switches to the default language and shows them as it does
    for its own Activate: at each field, in the "Cannot activate yet" summary, focus on the first;
  - `useStatusActions` takes an `open` callback for this.
- Why: the toast listed messages without field names or a way to reach them; the editor already knows how to
  name and focus every path.
- Affected specs: `12` §3, §5.

## D-037 (2026-10-29) — Where-used entries link to where they are edited; a failed check keeps the action off

- Type: spec-alignment (to-do A19; `12` §3 Archive or deactivate: the action "first loads" the references, is
  disabled while they are not empty, "each entry linking to the referencing Resource")
- Decision:
  - `workspace/referenceLinks.ts` links every kind the where-used list can hold: Resource editors as before,
    Media to the asset editor, a trigger to the "How visitors reach it" card (`#triggers`) of the Resource it
    opens, Navigation, Pages, and the Theme to their sections (no per-row editor exists yet, M6); one label set
    (`referenceKindLabel`) serves the dialog and the editors' "Used in" card;
  - `StatusChangeDialog`: when the references cannot be loaded, for any reason, the action stays disabled with
    "Try again"; before, it stayed enabled and relied on the backend's `409`;
  - the backend today returns CATEGORY, EVENT, FLOOR_PLAN, GUIDE, MAP, POI, ROUTE, and TRIGGER; the other kinds
    are linked ahead of their modules.
- Why: a trigger row had no link and a failed check let an author archive without seeing what uses it.
- Affected specs: `12` §3.

## D-038 (2026-10-30) — Trigger types offered by surface, and a "Runs on" choice per trigger

- Type: spec-alignment (to-do A20; `03` §14 `supportedSurfaces`; `13` §1 capability matrix and its rules; `08`
  Milestone 5 "a trigger type is rejected for a surface that does not support it")
- Decision:
  - `platform/triggers.ts` holds the matrix's ceiling as the backend's `TriggerType` does: QR code on Web, Mobile
    app, and Kiosk; geo-proximity on Web and Mobile app; beacon on Mobile app only;
  - the "How visitors reach it" card reads the Project's surfaces; an "Add" chip whose type no enabled surface can
    run is disabled, and a line under the chips names the surface it needs with a link to App settings →
    Surfaces; while the surfaces cannot be read nothing is greyed (the backend still checks);
  - every row shows "Runs on": ticks for the type's surfaces (all ticked is saved as `supportedSurfaces: null`,
    every surface; the last tick cannot be removed), "(not enabled)" next to a surface that is off, and a warning
    when none of its surfaces is enabled; a `supportedSurfaces` error shows at the row;
  - a beacon says the app offers it as an ordinary link until a beacon plugin is chosen (`13` §1); camera
    recognition stays greyed as deferred; MANUAL is not offered, since every Resource is reachable by browsing
    and the backend refuses a MANUAL row (backend D-026).
- Why: every type was offered whatever the Project's surfaces, and a trigger's surfaces could not be set.
- Open: the capability half (Template capabilities and `LOCATION_TRIGGERS`/`QR_TRIGGERS` feature switches,
  `03` §2, `04` §6) waits for to-do B2.
- Affected specs: `03` §14; `13` §1.

## D-039 (2026-10-30) — QR codes come only from the public web address; no stand-in

- Type: spec-alignment (to-do A21; `11` §9 the QR image encodes the target's runtime URL with `?t=`; `03` §14
  `qr.png`; backend `qr.png` answers `422 NO_PUBLIC_BASE_URL` without the address); supersedes D-019
- Decision:
  - the "How visitors reach it" card reads the address from App settings → Surfaces (`publicBaseUrlOf`, WEB
    enabled with its `publicBaseUrl`) instead of guessing it from the saved triggers' `runtimeUrl`;
  - with an address, a saved QR code shows the backend's `qr.png` and the link it encodes, as before;
  - without one, the row says there is no QR image because the visitor app has no public web address, links to
    App settings → Surfaces, and the code is still saved; the CMS no longer draws a stand-in QR of its own
    preview, which only signed-in authors could open and which could have been printed by mistake;
  - a `qr.png` refused for the missing address says so in the same words; `QrCodePreview` only shows the
    backend's image. The `?t=` handling of the app preview stays (the Preview's "fire trigger").
- Why: a printed stand-in QR led visitors to a sign-in page.
- Affected specs: `11` §9; `03` §14.

## D-040 (2026-10-30) — Offline: changes refused before sending, a banner, cleared by the next answered request

- Type: spec-alignment (to-do A24; `12` §6 "offline CMS": mutations are disabled with a banner; reads come from what
  is already loaded; the banner clears when a request succeeds again)
- Decision:
  - `stores/connection.ts` holds `offline`: set when a request gets no response at all (network gone or backend
    down) or the browser fires `offline`; cleared by any answered request, whatever its status;
  - while offline, `platform/api.ts` refuses every non-GET request and every upload with `ApiError` `OFFLINE`
    ("You are offline, so nothing was saved…") before anything is sent; GETs still go out, so the first one
    answered clears the state;
  - `components/OfflineBanner.vue`, under the header for a signed-in author, says changes are disabled and loaded
    content stays readable, with "Check again" (`GET /me/authorization`), which also runs when the browser fires
    `online`;
  - in the editors, Save, Save draft, Apply changes, Discard changes, and the status buttons are disabled while
    offline; list actions are refused by the API layer and say so in their toast. Unsaved form state stays in the
    form and in this browser (D-024).
- Why: an author kept typing and saving into a dead connection; each save failed on its own with a generic message.
- Affected specs: `12` §6.

## D-041 (2026-10-30) — Lost access: a 404 under the open Project re-checks it; 403 is a manager-only refusal

- Type: spec-alignment (to-do A25; `07` §15: a non-member receives `404` on every path under a Project and the CMS
  shows "not found" and removes it from any cached list; a member gets `403` only for operations restricted to
  organization managers, whose controls the CMS hides from `/me/authorization`; `12` §6 Project soft-deleted)
- Decision:
  - `platform/api.ts` reports every `404` on a path under `/projects/{id}/…`; the workspace (`ProjectLayout`) then
    reads the Project once more, and only when that is `404` too it closes the workspace with "This Project is not
    available", removes the Project from the picker's list, and points to the UNICHE Platform Portal for restore
    or membership; a Resource that is merely missing keeps its editor's own "does not exist" message;
  - the Portal is linked through an optional `PORTAL_URL` (`public/config.js`) or `VITE_PORTAL_URL`; without it
    the Portal is named, not linked;
  - a `403` no longer removes the Project from the list and reads as a refusal for organization managers only;
    the CMS has no manager-only controls in the Project workspace today (Project creation is already offered
    only to managers, from `/me/authorization`).
- Why: the earlier handling had `403` and `404` the wrong way round, and losing a Project while inside it showed
  only scattered "not found" errors.
- Affected specs: `07` §15; `12` §6.

## D-042 (2026-10-30) — Accessibility pass over the Content screens

- Type: spec-alignment (to-do A40; `14` §1 the CMS is operable by keyboard alone, readable by a screen reader, usable
  at 200 percent text; `14` §4 CMS requirements)
- Decision, by requirement of `14` §4:
  - visible labels: every list search has a visible "Search" label; the shared filters read "Search in" and
    "Category"; status, type, and kind chip groups have visible labels wired with `aria-labelledby`; story blocks
    are labelled "Paragraph n" / "Heading n, level 2" with `<label for>`; trigger fields (UUID, major, minor,
    latitude, longitude, code), parent selects, stop and block positions, occurrence start/end/status, map
    placement coordinates, Linked Place, and the dialog searches got visible labels;
  - errors: each invalid field carries `aria-invalid` and `aria-describedby` to its message (also in
    `TranslationsPanel`, story blocks, triggers, and every create dialog); fields that were marked only by a red
    border now show their message (map name, initial view, all four bounds; floor plan name); the editor's error
    summary lists each error as a button that moves focus to its field (`ErrorSummaryItem.path`); create dialogs
    move focus to the first invalid field (`lib/focus.ts`);
  - not by colour alone: `StatusChip` puts a symbol before every status word (✓ active, ○ draft, ▪ archived,
    ✎ pending changes); `TranslationDots` shows ✓ / ◐ / ○ beside each language code; selected option cards show
    a ✓; map markers hidden from visitors carry a ⊘ badge and "hidden from visitors" in the Placed list;
  - keyboard: `AppDialog` keeps Tab inside the open dialog; the reorder ▲/▼ buttons are 24×24 px; floor plan
    markers show a focus ring; the asset picker is a list of `aria-pressed` buttons instead of a half-built
    listbox; a readiness item whose field is not on the page says so instead of doing nothing;
  - rich text: heading level buttons are named "Level 2/3" and a level change or a block move is announced;
  - preview: labelled "Preview: <surface>, <language>", a `tabpanel` tied to the surface tabs, with `lang` set
    and no longer hidden from screen readers;
  - live regions: save and apply progress, and the readiness list after every recomputation, are read out.
- Checked and already met: keyboard alternatives for every reorder (move up/down and position), coordinate
  fields for map and floor plan placements, upload progress bars and announcements, toasts in a live region.
- Not verified with a screen reader or at 200 percent text in a browser; to-do A43.
- Affected specs: `14` §1, §4.

## D-043 (2026-11-02) — End-to-end check of the Content screens, and what it fixed

- Type: verification (owner request "make checks everywhere in the app until now")
- Run: the current backend (285 tests green) on port 8090 against the local stand-ins of `dev/` (Keycloak, Catalogue
  mock, S3 mock) and a fresh PostgreSQL; this build served on port 5180; a scripted Chromium (Playwright) signed in
  as the test curator and drove every Content screen, editor, and create dialog, with axe-core (WCAG 2.2 A/AA) on
  each. Scripts are outside the repository (G-013 stays open).
- Worked as designed: create dialogs with field errors and a duplicate slug; activation with readiness; archive and
  restore; Working Copy save draft, apply confirmation, and apply; triggers offered by surface, QR from the public web
  address with image, link and download; uploads with limits and progress; alternative text required before an image
  activates; map from an area search, placement, keyboard-reachable marker; floor plan from the picker; Guide story
  with text and reference blocks and captions; Route stops; Event dates; Category scope lock; list search, status and
  category filters, keyboard reorder kept after reload; Translations matrix and MuseMind (mock) with the AI marker;
  Preview and Preview in app; offline banner, refused changes and kept form; lost access closes the workspace.
- Fixed:
  - activation refused from a list never opened the editor (D-036): the CMS matched `MISSING_REQUIRED_FIELDS` on the
    problem, but the backend sends `422 VALIDATION_ERROR` and puts that code on the field errors (`07` §15). New
    `ApiError.hasCode()` looks at both; used for `MISSING_REQUIRED_FIELDS`, `DEFAULT_LANGUAGE_INCOMPLETE`,
    `NOTHING_TO_TRANSLATE`, and `RESOURCE_NOT_EDITABLE`, which had the same mismatch;
  - focus on the first missing field waits up to a second for the form, which may still wait for the languages;
    the Route "Stops" card is a focus target (`data-path="stops"`);
  - keyboard reorder: list ▲/▼ buttons are disabled while the order saves, which dropped focus; focus returns to the
    moved row's button, or its counterpart at the end of the list; the same for Route stops, Guide blocks, and
    paragraphs in a story;
  - contrast (`14` §4, 4.5:1): muted text `#6b7280` → `#5d636f` (4.39 → 5.49 on the canvas); amber `#9a6200` →
    `#855400`; teal `#0f7a6e` → `#0c6d62`; list row details and menu group headings one grey darker; links inside the
    trigger notes underlined;
  - the hidden file inputs of upload, picker, and Replace are named; the deferred "AR scan target" chip states its
    reason in text instead of a tooltip; "· editing" in the Translations card no longer wraps.
- Left open (to-do list): the UNICHE gradient on "New …" buttons gives white text 1.3–3.9:1, a design decision;
  outside Content, the project picker and Dashboard show "Organisation 5d1e7a52" and "—" for the dates, and the
  Surfaces error lists the raw path `surfaces[0].configuration.publicBaseUrl`.
- Noted, unchanged: triggers save before their Resource so a refused trigger stops the save; when the Resource is
  then refused (an archived Place, for example), the triggers are already saved, and saving again does not
  duplicate them.
- Affected specs: `07` §15, `12` §3–§5, `14` §4.

## D-044 (2026-11-03) — Organisation names and Project dates; Surfaces errors by label; triggers put back on a refused save

- Type: fix (owner request "fix A47, A48, A50", to-do list)
- Organisation names (A47): the picker and Dashboard read `GET /api/v1/organizations`, the backend's relay of the
  Catalogue (`02` §11, `07` §14; backend D-039), instead of showing `Organisation <id prefix>`; an
  organisation the relay does not name, or a relay that fails, still shows the placeholder so the picker opens.
  The Project's `createdAt` and `updatedAt` come from the Catalogue through `ProjectResponse` and fill "Created",
  "Last updated", and "updated …" in the picker. The `dev/` Catalogue mock serves `GET /api/v1/organisations`.
- Surfaces (A48): the error summary names the field ("Public web address: …") instead of the API path
  `surfaces[0].configuration.publicBaseUrl`; the message at the field is unchanged.
- Triggers (A50, owner decision "fix"): the editors of Places, POIs, Routes, Guides, and Events save through
  `saveWithTriggers`. The triggers still go first, so a refused trigger stops the save; when the Resource, or its
  working copy, is then refused, the triggers are put back as they were: new ones archived, removed ones restored
  to their status, edited ones given their settings again. A save that failed changes nothing, matching the "not
  saved" message. Putting back is best effort; when it fails too (connection lost), the next save repairs the rows,
  as before. The working-copy path uses a new `around` hook of `useResourceEditor`.
- Affected specs: `02` §11, `03` §14, `07` §14–§15, `12` §3–§4.

## D-045 (2026-11-04) — Create a Project steps 2–3, initialization, and resume

- Type: feature (owner request "do whatever is needed", to-do A51; outside the Content menu)
- Context: Create a Project stopped after step 1 because the backend had no Templates and no `POST /initialize`;
  backend D-040 added them (Templates with style presets, initialization, theme, settings).
- Decision, following `12` §4 and the mockup:
  - step 1 creates the Project in the Catalogue as before, then the page stays open at step 2 with `?resume=<id>`;
  - step 2 offers the ACTIVE Template versions (name, version, description, surfaces) and the style presets as
    tiles drawn in their heading font on their primary colour, with background and ink dots and their corner
    shape; the Template's `defaultStylePreset` is "Suggested" and the selection follows the Template until the
    author picks a style; a small preview shows the Home Page with the Project name; "Continue" confirms;
  - step 3 is a disabled fieldset until then: languages (the Template's defaults, add from the known list, make
    default, remove) and the surfaces among the Template's `supportedSurfaces`; a summary precedes "Initialize";
    empty languages or surfaces are refused before sending; field errors of `initialize` are listed by label;
  - "resume initialization": the picker and the header switcher read each listed Project with
    `GET /projects/{id}` (the listing relays the Catalogue and carries no local state, backend D-040, Q-020) and
    lead a Project with `initialized` false to step 2 with its current languages and surfaces; the Dashboard of
    such a Project says so with the same link; a resumed Project already initialized opens its Dashboard;
  - the ink on a preset's primary colour is chosen by the CMS by contrast (backend Q-022); preset fonts load from
    the same font service as the CMS.
- Also: the Languages screen called its count "places and points of interest"; the backend counts every content
  kind, now including the Template's Categories, so it reads "content items".
- Not done: the theme editor (App settings → Appearance), Pages and Navigation (backend M6), activation (backend
  M2b).
- Affected specs: `04` §3–9, `12` §3 Project picker, §4 Create a Project.

## D-046 (2026-11-04) — Previews in the Project's theme

- Type: implementation (owner request 2026-11-04, the mockup's themed preview)
- Decision: "Preview in app" of the Resource editors and Visitor app → Preview (also "Open in new tab") draw in the
  Project's theme: `GET /projects/{id}/theme` (backend D-040) gives the effective values (the Template's defaults
  overridden by the Project's), the shell choices, and the logos; font keys resolve to families through
  `GET /templates` and load from the same font service as the style tiles (D-045). `workspace/projectTheme.ts`
  turns them into CSS variables on the device frame (primary and its ink, accent for small headings only where the
  primary reads as text on the background at 4.5:1, a tint, muted text kept at 4.5:1, border, background, text,
  heading and body fonts, corner radius, density as a spacing factor) and caches a Project's theme for 30 seconds.
  The shell follows `04` §11: search in the header or off, the language switcher in the header, the footer, or off,
  a bottom bar or a burger menu on mobile, tiles or a header menu on a kiosk's Home. The default menu's labels
  follow the previewed language (Greek and English, English otherwise) until Navigation exists (M6). A Project
  that is not initialized has no theme (`409`) and keeps the CMS default; the footnote names the style.
- Why: the mockup shows the preview in the Project's style; the theme exists since D-045, its editor does not
  (to-do A52, outside Content).
- Alternatives: wait for the visitor runtime (`11`), which will draw the theme itself.
- Affected specs: `04` §9–11; `12` §3 Preview; `14` §2.


## D-047 (2026-11-05) — A save that stops after the Resource's own fields keeps their new version

- Decision: a DRAFT save of a Place, Point of Interest, Route, Guide, or Event writes its own fields first and then,
  in further requests, its Category, stops, blocks, occurrences, and media. When one of those later requests fails,
  `completeSave` (`platform/api.ts`) reads the Resource back and throws `PartlySavedError`; the editor takes the new
  version, keeps the form as it is ("Unsaved changes"), and shows "The <kind> was saved only in part" with the
  reason. Saving again sends the rest on the new version.
- Why: the editor kept the old version, so the next save met the author's own earlier write as "Someone else changed
  this place" (owner report 2026-11-05: a backend without Place media, D-041, refused the images after the fields
  were saved).
- Alternatives: one request per save, which needs the backend to take every child list in the update body (as the
  working copy does); rolling the fields back, which can itself fail.
- Affected specs: `03` §1 (version and optimistic locking); `12` §3 editors.

## D-048 (2026-11-09) — The Place editor crops an ACTIVE linked map through its pending changes

- Decision: "Edit map area" in the Place editor works on an ACTIVE map too. The crop is saved into the map's working
  copy, on top of what is already pending there (the copy's `version` and `baseVersion`), never onto the live map.
  While the map has pending changes the Place editor shows the map as it would read after apply, says that visitors
  still see it as it was, and offers "Apply map changes"; discarding stays in the map editor. An ARCHIVED map is
  not cropped here.
- Why: owner request (A56, 2026-11-04) after D-041's in-place crop of DRAFT maps; an ACTIVE Resource changes only
  through its one working copy (`03` §1).
- Alternatives: apply at once on save, which would also make live whatever else was pending on the map; send the
  author to the map editor (the previous behaviour).
- Affected specs: `03` §1 and §7; `12` §3 Place ("Open map"), Maps editor.

## D-049 (2026-11-09) — Content follows the Project settings: switched-off kinds, trigger types, Event timezone

- Decision: the CMS reads `GET /projects/{id}/settings` (backend D-040; `workspace/projectSettings.ts`, cached for
  30 seconds). A content kind whose capability is off stays in the menu, greyed with an "off" pill and the reason
  ("Events: disabled in App settings → Features", or "not offered by this Project's Template"), as the mockup's nav
  does: Points of Interest `POI_EXPLORATION`, Routes `ROUTES`, Guides `GUIDES`, Events `EVENTS`, Maps & Floor Plans
  when both `MAPS` and `FLOOR_PLANS` are off; Places and Categories have no capability. In "How visitors reach it",
  QR code is greyed while `QR_TRIGGERS` is off and Bluetooth beacon and geo-proximity while `LOCATION_TRIGGERS` is
  off, with the reason and a link to App settings → Features; an existing trigger of such a type says visitors
  cannot use it. Event times are typed, listed, and previewed in the Project timezone; without one, the browser's,
  and the editor says which. Without readable settings (a Project not initialized) nothing is greyed.
- Why: `12` §3 (lines 103-104, 157), `03` §2 and §15; to-do B2, unblocked by backend D-040.
- Alternatives: hiding switched-off kinds (the spec says greyed, not hidden); blocking their screens (authors may
  prepare content before switching a capability on).
- Affected specs: `03` §2, §14, §15; `12` §3.

## D-050 (2026-11-10) — The Place editor links an ACTIVE map or floor plan through its working copy

- Decision: choosing an ACTIVE map or floor plan in the Place editor's "Map" / "Floor plan" field, or unlinking an
  ACTIVE one, saves the change of `placeId` into that map's or plan's working copy (its live fields and children,
  with the new Place) and applies it at once, as the field promises ("linking applies at once") and as a DRAFT one
  is re-saved. One that already has pending changes is refused before anything is touched, naming it: applying
  would make those changes live too. If the apply is refused (for example by the readiness check, backend D-037),
  the copy that held only the link is discarded again and the reason is shown.
- Why: owner request 2026-11-10 (to-do B8); an ACTIVE Resource changes only through its working copy (`03` §1),
  and the Place editor refused ACTIVE maps and plans with "open the map, change its place, and apply the changes".
- Alternatives: leave the link pending with an "Apply" button like the crop (D-048), which would leave the field
  showing the old link until applied; apply on top of other pending changes (makes someone's unfinished edit live).
- Also: durations (filled in by the backend since its D-043) are shown as whole seconds played, as the browser's
  player counts them, instead of rounded (a 3.5 s file read 00:04 beside a player at 0:03).
- Affected specs: `03` §1, §7, §8; `12` §3 Place.

## D-051 (2026-11-10) — The first Playwright and axe tests

- Decision: `@playwright/test` 1.65.0 and `@axe-core/playwright` 4.14.0 (dev dependencies, added through Windows
  pnpm), `playwright.config.ts`, and `e2e/` with the first tests, from the scripts behind F9 and F10:
  - they run against a stack started by hand (the `dev/` stand-ins, the backend, the CMS; `e2e/README.md`),
    configured by `CMS_URL`, `API_URL`, and `IDP_URL`; one worker, no retries (AGENTS.md §11: never silently
    retry);
  - one sign-in through the local Keycloak's login page, whose session the tests reuse; test data through the
    backend API with a password grant of the local `iguide-web` client, never the live realm. Each file creates
    and initializes its own Project (Greek default, English, web), so a test never depends on earlier data;
  - axe with the WCAG 2.0 and 2.1 A and AA rules on every state a test reaches, once nothing on the page is
    `aria-busy`; a violation fails the test with its rule and elements;
  - coverage: the eight Content lists with their create dialogs from the keyboard; the Place editor from creation
    through pending changes and apply; a recording's duration; linking an ACTIVE map (D-050);
  - `make e2e` and `pnpm test:e2e` run them; the TypeScript of the tests is checked by `vue-tsc -b`
    (`tsconfig.node.json`). `e2e/.auth/`, `test-results/`, and `playwright-report/` are not committed.
- Found by the first run: every Content list's loading skeleton, the workspace's, and the editor's carried an
  `aria-label` on a plain `div`, which ARIA does not allow (`aria-prohibited-attr`). They are now `role="status"`
  regions, so a screen reader also hears "Loading places". The same skeletons outside Content (Home, Translations,
  Languages, Surfaces, Overview, Preview) are left for their own item (to-do A58).
- Why: owner request 2026-11-10 (to-do A49); AGENTS.md §8, §11; GAPS G-012, G-013.
- Alternatives: Vitest component tests first (they do not see the real backend or axe on a real page); starting the
  stack from Playwright's `webServer` (the stack is three services and Docker; a later CI item, G-014).
- Affected specs: `14` §1, §4; `12` §3; `08` §Companion repositories.

## D-052 (2026-11-10) — Loading placeholders and the Project picker pass axe

- Decision: the labelled loading placeholders of Home, Translations, Surfaces, Overview, and Preview get
  `role="status"`, like the Content ones of D-051; those of Languages, the Project switcher, and Create a Project
  carry no label and needed nothing. The Project picker's organisation headings move from `text-gray-400` (about
  2.5:1 on white, found by the new test) to the muted text colour (about 6:1). `e2e/screens.spec.ts` adds axe on
  the picker and the five screens once loaded, and on the loading state of every Content list and those five
  screens, with the backend's reads held back until axe has run.
- Why: owner request 2026-11-10 (to-do A58, from D-051); `14` §2 (4.5:1), §4.
- Alternatives: dropping the labels (a screen reader would then hear nothing while a screen loads).
- Affected specs: `14` §2, §4; `12` §3.

## D-053 (2026-11-10) — The brand gradient deepened for white text

- Decision: the `brand` button (every "New …" and "Upload" call to action) keeps the UNICHE pink, purple, teal
  gradient with deeper stops, `#b3156f` → `#7b3aa8` → `#0b6f7c`, so white text has 5.9:1 to 7.0:1 on every part
  of it (before: `#f832a4` → `#b05fd6` → `#29f8fd`, 1.3:1 to 3.9:1). The text shadow that tried to compensate is
  gone. `expectGradientTextContrast` in `e2e/support/a11y.ts` samples every text-bearing gradient on a page, at its
  stops and halfway between them, because axe does not measure gradients; it runs on every Content list.
- Why: owner decision 2026-11-10 (to-do A46: darker gradient over dark text or a solid button); `14` §1 (WCAG 2.1 AA,
  1.4.3), §4.
- Alternatives: near-black text on the bright gradient (5.2:1 and up, less like the mockup); the solid primary
  colour (11.3:1, loses the brand look).
- Affected specs: `14` §1, §4; `12` §3.

## D-054 (2026-11-10) — The CMS reflows at 200% zoom and at 320 CSS pixels

- Decision: the application shell no longer has a minimum width of 820 CSS pixels, which made every screen scroll
  sideways at 200% zoom on a laptop and at 320 pixels:
  - the header wraps; below 768 pixels the user's name is read by screen readers only, next to the initials;
  - below 768 pixels the workspace menu is a "Menu" disclosure button (`aria-expanded`, `aria-controls`) above the
    page, closed again when a section opens, instead of the fixed 236-pixel column;
  - the page padding narrows from 28 to 16 pixels on small screens;
  - data tables keep their columns and scroll inside their own box, the two-dimensional exception of 1.4.10.
- Tests (`e2e/zoom-and-structure.spec.ts`, the automatable half of to-do A43): every Content list and editor at
  700 × 450 (200% of 1400 × 900) and at 320 × 256 keeps its title and main action reachable without the page
  scrolling sideways, naming the element that sticks out when it does; every Content list and editor has one main
  landmark, the navigation, one level-1 heading, and no skipped heading level. The test that found the overflow
  failed on all sixteen screens before the change and passes after it.
- Not automated: listening with NVDA and checking reading order and announcements by ear stays with the owner
  (A43).
- Why: `14` §1 (CMS conforms to WCAG 2.1 AA, "usable at 200 percent text scaling"; 1.4.4, 1.4.10); to-do A43.
- Alternatives: a minimum width with a "use a wider window" notice (fails 1.4.10); a hamburger menu at every width
  (hides the menu on desktop for no gain).
- Affected specs: `14` §1, §4; `12` §3 (workspace navigation).

## D-055 (2026-11-11) — The Navigation editor and the menus in the previews

- Decision: Visitor app → Navigation is a screen of its own (`views/workspace/navigation/NavigationView.vue`) over
  the backend's `/navigations` (backend D-046), as `12` §3 "Navigation editor" describes:
  - two tabs, "Main menu" (PRIMARY) and "Footer links" (FOOTER), each with its item count; a menu that does not
    exist yet is created with the first item added to it;
  - the main menu is a tree, rows indented by depth, the level read out to screen readers; footer links are flat;
  - "+ Link" opens the Resource picker (Places, Points of Interest, Routes, Guides, Events; kinds whose capability
    is off are listed, disabled, with the reason, D-049); "+ Heading" (main menu only) asks for the
    default-language label a heading needs (backend D-046);
  - each row shows the label in the chosen language ("Labels in"), or notes that it uses the target's title; the
    target, its status, and a warning when visitors will not see the item (target not active, capability off,
    heading without a default label);
  - per row, keyboard first (`14` §4): move up and down, set the position among the siblings, move under the item
    above and out one level (main menu); drag and drop among siblings as an addition; "Labels" opens one field
    per language inside the row; "Change target"; "Remove", which asks first when items sit under it;
  - every action saves at once (menus have no lifecycle or pending changes) and is announced; a stale view reloads
    with a warning;
  - a preview on the right draws the menus in the Project's theme, mobile first (bottom bar or burger, as the
    shell says) with the web frame next to it.
- The Guide editor's inline reference picker became `components/ResourcePickerDialog.vue`, used by both editors.
- `PreviewApp` takes optional `menu` and `footer` entries (`workspace/navigationMenu.ts` builds them, labels in the
  previewed language, else the target's title, `03` §13): once the main menu has items it replaces the default
  menu in the header, the burger, and the bottom bar, an item with items under it opens them, and footer links show
  above the footer. Visitor app → Preview, its new-tab view, and the Navigation editor pass them; an entry whose
  target the mode does not show is left out, as the runtime leaves out dead entries. Without a main menu the
  default menu still stands in.
- The Overview's Navigation step shows the item counts and links to the screen.
- Tests: `e2e/navigation-editor.spec.ts` (a heading, two links moved under it and reordered by keyboard, a label per
  language with the title fallback, the preview drawing the menu, a footer link, a heading removed with what is
  under it, axe on each state), `e2e/guide-reference.spec.ts` (the shared picker in the Guide editor), and the
  Navigation screen in `screens.spec.ts` and `zoom-and-structure.spec.ts`. The structure test leaves out the
  stand-in app inside a preview frame (`data-preview-frame`), which has its own page outline as the iframe of `12`
  §3 will; its `settle` now waits for the title before it checks that nothing is loading.
- Why: owner request 2026-11-11 (to-do B15); `12` §3, `03` §13, `13` "Moving through content", `14` §4.
- Alternatives: editing the whole tree in a form with one Save (every other live-saved screen saves per action, and
  a save of the whole tree would conflict with any concurrent edit); a tree widget with `role="tree"` (arrow-key
  semantics that buttons per row make unnecessary).
- Affected specs: `03` §13; `12` §3; `13`; `14` §4.

## D-056 (2026-11-11) — "Preview in app" opens as a pop-up

- Decision: in every Resource editor, "Preview in app" opens the preview (D-014) in a pop-up over the editor
  ("Preview in app: <title>", closed by Close, Escape, or the backdrop, focus back on the button) instead of expanding
  in the side column. It still draws the live form, unsaved changes included, on Mobile, Web, or Kiosk.
- Amended the same day (owner request): the pop-up fills the window (`AppDialog` `fullscreen`), Close sits at the top
  right next to the title, and nothing in the dialog scrolls. It was then polished in an /impeccable critique loop
  (screenshots of the owner's data at 1400, 1920, 1024, and 390 wide; independent reviews scored it 24, 30, 29, 29,
  31 of 40 over the rounds):
  - the screen is never drawn above 100% (a larger drawing misleads about legibility), and the toolbar says what is
    judged ("Phone 390 px · 82%");
  - "Fit" shows the whole device, "Fit width" draws it at the stage's width (at most 100%) with its own screen the only
    thing that scrolls; a phone starts in Fit, a browser or kiosk in Fit width, and each keeps its choice while the
    pop-up is open;
  - the devices read as devices: a phone and a kiosk (now 1080 x 1920) bezel, the browser bar, a shadow kept clear of
    the stage edge;
  - a fade and a "Scroll the screen for more" button (outside the scaled screen, so legible at any zoom) say the screen
    continues; the screen itself is focusable and scrolls by keyboard;
  - the surface tabs are 12-pixel, 30-pixel-tall controls with arrow-key, Home, and End movement and a focus ring; the
    pop-up opens on the chosen tab, not on Close; "Shows unsaved changes" is a badge in the toolbar; the toolbar keeps
    its rows when switching screens on a narrow window;
  - the footnote says the language follows the editor's language tab, and names the red dashed outlines only when a
    text is missing; "Play" and "Play video" follow the previewed language; the back arrow flips for right-to-left.
- Found by the e2e suite while checking it: the start-up screen's "Checking your UNICHE session…" was grey text below
  4.5:1 on its background (now `#4b5563`), and `media.spec.ts` waited for any "uploaded" text, which the counter
  shows as "0 of 1 uploaded" while the file is still on its way (it now waits for "1 of 1 uploaded").
- Why: owner request 2026-11-11; the side column was too narrow to read the Web and Kiosk screens.
- Alternatives: a wider side column (squeezes the form); a separate tab (the new-tab view of Visitor app → Preview
  already exists and shows saved content only).
- Affected specs: `12` §3 Resource editors, Preview; `14` §4.


## D-057 (2026-11-11) — The Place setting follows the type and is no longer shown

- Type: spec-deviation (owner request 2026-11-11: "I shouldn't be given the option to switch between indoor and
  outdoor"; QUESTIONS.md Q-006; amends D-030)
- Decision:
  - the "New place" dialog and the Place editor's "Place setup" no longer show the Indoor / Outdoor cards; the steps
    are renumbered (dialog: 1 · Level, 2 · Title; setup: 1 · Level, 2 · Map or Floor plan); the editor subtitle and
    the Places list badge show the type only;
  - the API still takes `environment` (`03` §5), so the CMS derives it: Building, Floor, and Room are `INDOOR`
    (floor plan), Region, Destination, Site, and Area are `OUTDOOR` (map), Other keeps the setting it has
    (`settingForType` in `views/workspace/places/placeTree.ts`); an unchanged type keeps the saved setting, so older
    Places save unchanged;
  - a new top-level Place is `OUTDOOR` with type Area; a new sub-place takes its parent's setting (an indoor parent
    gives a Room); changing the type in Details changes the setting on save, after which the link step follows it;
  - while a map or floor plan is linked the type list offers only the types of the saved setting, with "unlink the
    map / floor plan first" under it; a refused `environment` is shown at the type.
- Why: the owner wants the choice off the screen; the type already says whether a place is indoors.
- Alternatives: derive it from the link (needs the setting saved before a link can apply, so it cannot be the
  source); a fixed `OUTDOOR` (indoor places could never use a floor plan).
- Affected specs: `12` §3 Place; `03` §5.

## D-058 (2026-11-11) — Breadcrumbs replace the editors' back link

- Decision: every Resource editor (`EditorShell.vue`) opens with a breadcrumb trail, "Places › Acropolis", instead of
  the prototype's "← Places" link. `AppBreadcrumbs.vue` is a `nav` "Breadcrumb" with an ordered list; the section
  keeps the link's purple bold 12px look, a drawn chevron separates the crumbs (flipped for right-to-left, hidden
  from screen readers), and the current Resource is muted, `aria-current="page"`, and truncated with an ellipsis
  (full title in a tooltip) so the trail stays on one line at 320 CSS pixels. The Resource's crumb appears once it
  loads; while loading or on error only the section link shows.
- No parent Place in the trail: the sidebar sections, not the Place tree, are the CMS's hierarchy, and a POI's Place
  is a field it can change in the same form.
- Why: owner request 2026-11-11 ("make the back button look prettier, maybe with breadcrumbs").
- Affected specs: `12` §3 Resource editors; prototype `iGuide CMS.html` (D-004, D-023).

## D-059 (2026-11-11) — "Preview in app" is the prototype's pop-up card

- Decision: replaces the full-window pop-up of D-056 (its unsaved-form, surface-switch, focus, and labelling rules
  stay). As in the prototype, "Preview in app" opens a card below its button, right edges aligned, at most 560px wide
  and as tall as the window allows (`AppDialog` `popover`): a sticky header ("In the app", Mobile / Web / Kiosk as one
  segmented pill, Close ✕), the screen on a grey stage, and a note on what it shows (unsaved changes, language,
  approximation). The backdrop is clear; a click outside, Escape, or Close shuts it, and focus returns to the button.
- Departs from D-056: the screen is drawn unscaled at the card's width (a phone at most 390px) and as tall as its
  content, the card scrolling, as the prototype does; so Web and Kiosk show their wide layout at the card's width, not
  a 1280 or 1080 screen scaled down, and the Fit / Fit width zoom, the size line, the browser bar, and the bezels are
  gone. The new-tab Visitor app → Preview still draws the real screen sizes.
- Why: owner request 2026-11-11 ("'preview in app' as pop up. Make it look like the one in the cms.html").
- Affected specs: `12` §3 Resource editors, Preview; `14` §4; prototype `iGuide CMS.html` (D-004).

## D-060 (2026-11-11) — Workspace pages fill the main area

- Decision: every workspace page's frame fills the main content area, as the list pages do. The Resource editors drop
  the 1090px cap and their form column grows (`minmax(0,1fr)` beside the 360px side column); the Dashboard readiness
  and setup cards, App settings → Languages and Surfaces, and the "Not available yet" section card drop their
  760/860/640px caps. Reading measures stay inside pages: page subtitles (760px), help text, and single short inputs
  (the Surfaces web address, 560px); error alerts keep 640px; device frames in Preview and Navigation keep their sizes.
- Departs from the prototype's 760px form column and 760–900px content caps (D-004).
- Why: owner request 2026-11-11 ("Some pages aren't displaying in full width. Please fix this.").
- Affected specs: prototype `iGuide CMS.html` (D-004); `12` §3 Resource editors.

## D-061 (2026-11-11) — Content list filters sit in a "Filters" menu

- Decision: every Content list with filters (Places, Points of Interest, Routes, Guides, Events, Categories, Media)
  keeps only its search field (and Media's Grid/List switch) in the toolbar. Status, Category, Featured, "Search in",
  Applies to, and Media type move into a shared "Filters" popover (`ListFilterMenu`, radix-vue Popover, modal: focus
  moves in, Tab stays inside, Escape or outside click closes it and focus returns to the button). The button counts
  the filters in force; each shows beside it as a removable chip ("Status: DRAFT ×"), with "Clear all" beside two or
  more and "Clear filters" in the popover, so no filter is ever hidden. Single-choice filters are radio groups drawn
  as pills with a check mark (`FilterChoiceGroup`); Featured is a checkbox. Maps & Floor Plans has no filters and is
  unchanged. The reorder note stays in the toolbar.
- Departs from the prototype's filter chips beside the search field (AGENTS.md §6, D-004).
- Why: owner request 2026-11-11 ("The filters need to be 'tucked away a bit.' Let's put them inside a dropdown menu.").
- Affected specs: `12` §3 Content library; `14` §4; prototype `iGuide CMS.html` (D-004).

## D-062 (2026-11-11) — Fixed header and menu, only the page scrolls

- Decision: the shell fills the viewport (`100dvh`); the header and the workspace menu stay put and only the page's
  `<main>` scrolls (the menu scrolls on its own when its items overflow). A route to another path starts the new page
  at its top; a query-only change (list filters) keeps the position. A "Skip to content" link, first in the tab
  order, focuses `<main>`. Below 768 pixels the Project switcher takes its own row and "Manage members" and "Help"
  move into the avatar menu, so the fixed header stays two rows; the opened "Menu" disclosure is at most 55% of the
  viewport height and scrolls itself. A viewport lower than 420 CSS pixels (phone held sideways, the 320 by 256
  reflow check) scrolls as one document, header included, so the header never takes most of the screen.
- Departs from: nothing in `12`; the prototype's fixed header (AGENTS.md §6) now also holds when the page scrolls.
- Why: owner request 2026-11-11 ("The top bar and navigation should be static, and only the content should be
  scrollable.").
- Affected specs: `12` §3; `14` §1, §4 (1.4.10 reflow, 2.4.1 bypass blocks).

## D-063 (2026-11-11) — The Route editor draws its stops on the map of their Place

- Decision: the Stops card of an outdoor Route shows the geographic Map of the Place its stops belong to, on
  OpenStreetMap tiles, with the stops as numbered pins joined in stop order (back to the first for a loop). The Map
  is found through the stops' Points of Interest: of their Places and those Places' ancestors, the one with a
  non-archived Map covering the most stops, the closest Place on a tie, an ACTIVE Map before a DRAFT one. The Map's
  area stays clear and the rest is lightly dimmed; the view fits the area and every stop, and stops outside the area
  are listed. Without such a Map the tiles are framed on the stops; without stops an empty state says the map opens
  with the first stop. An indoor Route keeps the schematic drawing. `GeoMapCanvas` gained an optional `frame`.
- Departs from: the prototype's schematic grid drawing of the Route (`RouteMap`, D-004).
- Why: owner request 2026-11-11 ("In the Routes section, display a map of the place and, on top of it, the points
  selected by the user, along with their connections.").
- Affected specs: `12` §3 Route; `09` §22 (public OpenStreetMap tiles, prototyping only).

## D-064 (2026-11-11) — CMS maps use the OpenMapTiles "OSM Bright" style

- Decision: every CMS map (Map editor, new-map dialog, location picker, Route map, preview maps) draws the
  OpenMapTiles "OSM Bright" style, served without a key by OpenFreeMap (`https://tiles.openfreemap.org/styles/bright`)
  and rendered as vector tiles by MapLibre GL inside Leaflet (`maplibre-gl` 6.17.0, `@maplibre/maplibre-gl-leaflet`
  0.1.4, both pinned). One module, `src/components/map/basemap.ts`, adds it; the MapLibre worker is bundled by Vite
  (`?worker&url`). Without WebGL the map falls back to the OpenStreetMap raster tiles. Markers, lines and areas stay
  Leaflet layers above it.
- Departs from: the public OpenStreetMap raster tiles of AGENTS.md §5.
- Why: owner request 2026-11-11 ("use bright theme from openmaptiles for the maps"). OpenFreeMap needs no API key, so
  no new runtime configuration; MapTiler's hosted Bright would need one.
- Affected specs: `09` §22 (tiles remain a prototyping choice; production tiles are still open there).

## D-065 (2026-11-12) — Guide story as one list of elements; no summary, media or triggers on the Guide editor

- Decision: the Guide editor's story is one ordered list of elements: paragraph, heading (H2/H3), image, and
  reference. Each is added at the end or after any element ("+" on its row), and moved by drag, the arrows, or its
  position select. The list is shared by every language (texts and captions per language, an image the same asset in
  all). The API shape stays as D-031: loading spreads every TEXT block into its nodes, aligning the languages node by
  node; saving joins each run of consecutive non-reference elements into one TEXT block, a language with nothing in
  the run sending no text, otherwise every element keeping its place (untranslated as blank text, which the backend
  accepts, D-038) so the languages line up when read back. `src/views/workspace/guides/guideElements.ts` holds both
  directions. The Guide editor no longer shows the Summary field, the "How visitors reach it" card, or the media slots
  (primary image, gallery); a Guide's existing summary, triggers and media bindings are kept as loaded and saved
  unchanged, and the preview still draws the media visitors see. Triggers stay reachable from the Points of Interest
  side. The Translations panel counts the title and the story only.
- Departs from: `12` §3 Guide (summary, media slots and triggers in the Guide editor); D-031's two-level editor
  (TEXT blocks holding their own paragraph list).
- Why: owner request 2026-11-12 ("the selection of text and references should be handled along with the other
  elements … insert them anywhere in the guide and move them around … remove 'How visitors reach it' … remove the
  summary below the title and the option to add media. This applies only to the Guides page.").
- Affected specs: `12` §3 Guide; `03` §11 (unchanged API).

## D-066 (2026-11-12) — The mouse wheel outside the "Preview in app" card scrolls the editor

- Decision: the pop-up card's clear backdrop (D-059) still closes the card on a click, but the mouse wheel over it
  scrolls what lies underneath: the nearest scrollable area that can still move that way, skipping text fields, so
  the editor's page moves while the card stays open, kept on screen, and the wheel inside the card scrolls only the
  card. Controls under the backdrop stay unreachable while the card is open, as before.
- Departs from: D-059 (the backdrop held every pointer event).
- Why: owner request 2026-11-12 ("When I click 'Preview in App', I want to be able to scroll to the previous page if
  I move the mouse outside the dialog box.").
- Affected specs: `12` §3 (Preview in app); `14` §4 (the card keeps its focus trap and Escape).
