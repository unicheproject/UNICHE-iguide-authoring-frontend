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

## D-067 (2026-11-10) — Vite+ toolchain, Node 26, pnpm 11

- Type: implementation
- Decision:
  - the CMS builds with Vite+ 1.5.1 (`vp`), set up by `vp migrate --no-agent --no-editor --no-hooks`:
    `vite` is aliased to `voidzero-dev/vite-plus-core` through the catalog in `pnpm-workspace.yaml`,
    `vite.config.ts` imports from `vite-plus`, and the scripts call `vp dev`, `vp build`, `vp preview`;
  - Node 26.13.0 is pinned in `.node-version` and pnpm 11.1.1 in `packageManager`; `vp` (and mise, when it
    reads `.node-version`) installs exactly these, so a dev box, CI, and the container build use the same
    versions;
  - `package-lock.json` is removed, as planned by D-007; `pnpm-lock.yaml` stays the only lockfile;
  - pnpm 11 fails an install on a dependency build script that is neither allowed nor refused, so
    `pnpm-workspace.yaml` refuses `vue-demi`'s (`allowBuilds`): its default build already targets Vue 3;
  - `lucide-vue-next` is removed: nothing imports it, and the package is deprecated;
  - amended by the merge of 2026-11-12: `lucide-vue-next` is kept, since the breadcrumbs, the filter menu, the
    Route map and the Guide story (D-058, D-061, D-063, D-065) import it; this entry and D-068 were D-043 and D-044
    on their branch, renumbered because the main line had used those numbers (Q-007 was Q-006, F21-F29 were F7-F15);
  - Vite+ bundles oxlint, oxfmt, and Vitest, but lint and format are not switched on (`fmt: {}` only); the
    choice against the ESLint and Prettier planned in C0d is Q-007.
- Why: one pinned Node and pnpm for every environment, which the container image (G-015) needs; Vite+ wraps
  the same Vite 8 the CMS already used.
- Not done: `baseUrl` stays in `tsconfig.json` (deprecated in TypeScript 6, removed in 7); it only blocks
  oxlint's type-aware rules, which are off.
- Supersedes: the pnpm 9 version in D-007; the lockfile rule of D-007 stands.

## D-068 (2026-11-10) — Container image: Vite+ build, unprivileged nginx, config.js from the environment

- Type: implementation
- Decision:
  - `Dockerfile` builds on the Vite+ 1.5.1 image (`vp install --frozen-lockfile`, then `vp run build`, so
    `vue-tsc -b` runs in the image build) and serves `dist/` with `nginx-unprivileged` 1.30 as uid 101 on port
    8080; both base images are pinned by tag and digest;
  - `docker/docker-entrypoint.sh` writes `config.js` (`window.__UNICHE_CONFIG__`) at container start from
    `IDP_URL`, `API_BASE_URL`, `PORTAL_URL`, `REALM`, `CLIENT_ID`, `AUDIENCE`; `IDP_URL` and `API_BASE_URL`
    have no default, as in `src/platform/config.ts`; `REALM`, `CLIENT_ID`, `AUDIENCE` default to `uniche`,
    `iguide-web`, `uniche-platform`; `PORTAL_URL` stays optional (D-041);
  - the entrypoint stops the start on a missing value, on characters outside a URL or identifier (the values
    are written into a JavaScript string literal), on an `IDP_URL` or `PORTAL_URL` that is not a bare origin,
    and on an `API_BASE_URL` not ending in `/api/v1`;
  - `docker/nginx.conf`: SPA fallback to `index.html`; `index.html` `no-cache`, `config.js` `no-store`,
    `/assets/` immutable for a year, a missing asset is a 404;
  - `.dockerignore` keeps `.env*` out of the build context, so `.env.local` `VITE_*` values are never baked
    into the bundle.
- Why: one image for every environment (G-015), closing the gap without changing how `src/platform/config.ts`
  reads its configuration.
- Not done: the backend compose `cms` profile (backend repository, backend D-010).


## D-069 (2026-11-12) — UX overhaul: visual authority passes to the owner's brief

- Type: product
- Decision: for the three-round UX overhaul (owner brief of 2026-11-12, `ux-audit/BRIEF.md`) the running app's look
  is the incumbent, not the authority. This supersedes D-004's "the prototype governs visual design" and AGENTS.md §6
  for visual language only. Behaviour, data, flows, vocabulary and every statement of the specs `12` and `14` are
  unchanged. Every later decision of the overhaul names what it replaces.
- Why: the audit found the incumbent fails four WCAG gates and 61 % of its text is under 12 px.
- Not done: dark mode (no `dark:` class exists; the variable structure in `src/style.css` allows it later).
- Supersedes: D-004 and AGENTS.md §6 (visual language only).

## D-070 (2026-11-12) — Colour, status and focus tokens

- Type: design
- Decision: control border `#737b8b` (4.26:1 on white), placeholder `#5f6877`, muted ink `#566070`, link hover
  `#a3106a`, success, warning, danger and info inks each with a tint, and one status vocabulary: Draft (dashed circle
  on sunken grey), Archived (outline only, archive box), Active (check on success), Pending changes (pencil in the
  primary tint instead of amber, since amber means warning), translation state as icon plus language name. One focus
  ring for every control (2 px, 2 px offset, surface halo; fields included), plus forced-colours and reduced-motion
  rules in the base layer of `src/style.css`. Values are HSL triplets (`--primary`, `--input`, `--success` ...) so
  Tailwind can add an alpha; `tailwind.config.js` maps them.
- Why: C1-06 to C1-09 (1.24:1 field borders and a 2.54:1 placeholder were P0).
- Supersedes: the colours of D-042's chips and the `.field-input` border. D-042's rule that status is never colour
  alone stands and is strengthened.

## D-071 (2026-11-12) — Type system and fonts

- Type: design
- Decision: fixed rem scale 12 / 13 / 14 / 16 / 20 / 24 px (`text-xs`, `text-compact`, `text-sm`, `text-base`,
  `text-lg`, `text-xl`; 28 px only for the sign-in hero), 12 px floor, sentence case, weights 400 to 700, tabular
  numerals on counts. Montserrat is self-hosted as variable woff2 files (`wght` 400 to 700) in `public/fonts/`: latin,
  latin-ext and cyrillic, with `OFL.txt`, `font-display: swap` and a metric-matched fallback face. Google Fonts is
  removed from `index.html` and the shell. Template fonts for the Create Project and Appearance previews still load
  from Google Fonts per D-045 (previews only, a recorded exception to "authoring API and identity provider only").
  Montserrat contains no Greek glyphs, so no Greek file exists to ship; Greek text falls back to the system sans
  (`system-ui`, Segoe UI) with the same weights.
- Why: C1-01, C1-05, offline use.
- Not done: a Greek-capable webfont paired with Montserrat (needs the owner's choice of face; it would be a font
  asset, not an npm dependency).
- Supersedes: the px sizes and uppercase labels carried from the mockup. No new npm dependency.

## D-072 (2026-11-12) — One Button, one Chip, lucide icons, no gradient CTA

- Type: design
- Decision: one `Button` with variants primary, secondary, ghost, danger, danger-outline and link; 8 px radius,
  sentence case, 40 px tall (44 on a coarse pointer); `loading` and `disabledReason` (a stated reason, the button stays
  focusable with `aria-disabled`). One `Chip`. Unicode glyph icons are replaced by lucide icons (already a dependency).
  The brand gradient survives only in the logo and the sign-in hero. The old variant names (`default`, `brand`,
  `outline`, `destructive`) and classes (`.dialog-primary`, `.dialog-secondary`, `.field-input`, `.field-label`,
  `.small-label`) stay as restyled aliases until Round 3 so screens not yet migrated keep rendering.
- Why: C1-10 to C1-12, C1-04.
- Supersedes: D-053 (gradient primary and its contrast e2e check, replaced by `expectSolidFillContrast` in
  `e2e/support/a11y.ts`) and the pill buttons.

## D-073 (2026-11-12) — Shell and navigation model

- Type: design
- Decision: header 56 px in a single row; the workspace menu is 232 px from 1100 px and an off-canvas drawer below
  it (supersedes the `md:` disclosure of D-054's menu but keeps D-054's reflow guarantee and D-062's fixed shell);
  Media is a top-level item as `12` §3 lists it (it was nested under Content); menu items have 20 px icons; a switched
  off capability shows an "Off" chip with its reason and a notice under the page head; "Manage members" links to the
  Portal when `portalUrl` is configured and is absent otherwise; "Help" is removed until it has a destination; the
  UNICHE logo is a bundled asset; every route sets `document.title`, moves focus to the page `h1` and announces
  "<page> loaded"; `PageFrame` renders the single `<main>`. The field label stays "Slug" (spec `12` §3).
- Why: C1-58, C1-119, C1-122, C1-55, C1-76, C1-77.
- Supersedes: D-054's menu disclosure.

## D-078 (2026-11-12) — Feedback, dialogs, validation and offline rules

- Type: design
- Decision: one `Alert`, one toast stack (up to three, timers pause on hover and focus, errors persist and carry their
  `requestId`), one `StateCard`, one `FormErrorSummary` (focusable, links to fields), a sticky dialog footer, one named
  z-scale (`sticky`, `drawer`, `popover`, `modal`, `modal-over`, `toast`, `skip`), offline asserted only after
  `navigator.onLine` is false or two requests in a row got no response, `SessionEndedDialog` before a single capped
  redirect, `describeError` for plain-language failures (never the rejected value), two live regions fed by
  `lib/announcer.ts`. `showToast(title, body?, tone?, options?)` keeps its signature.
- Why: C1-59, C1-62 to C1-75.
- Supersedes: D-040's banner styling and the single-string live region of D-042; their behaviour (mutations
  disabled, announcements) stands.

## D-083 (2026-11-12) — Hit areas

- Type: design
- Decision: controls are 40 px (44 px on `pointer: coarse`), row actions at least 32 px on desktop, menu items 36 px
  (44 coarse); the drawer's items are 44 px; made with padding, not font size. WCAG 2.5.8 is not in the 2.1 gate and is
  applied by the kiosk persona's rule. Density toggle deferred (the `--control-h` and `--row-h` tokens exist so it can
  land later). Leaflet controls and pins reach the same floor in the map package (D-081).
- Why: C1-123.

## D-076 (2026-11-12) — Content list pattern

- Type: design
- Decision: one list scaffold (`src/components/list/*`) for the six Content kinds: sticky toolbar and table head,
  status segments with counts (Not archived by default, Active, Draft, Archived), "Pending changes" and "Needs
  translation" toggles, sort, filter state in the URL query (`q`, `status`, `pending`, `lang`, `missing`, `cat`,
  `featured`, `sort`, `dir`) with scroll restored on Back and the result count announced politely, one Tab stop per
  row plus a kebab (`RowMenu`: lifecycle actions, Move up / down, Move to position..., Move to top / bottom), whole-row
  open, disclosure trees, ARCHIVED hidden from the default segment, empty and filtered-empty states, card rows below
  900 px. `useReorder` gains `position`, `moveToPosition` and an optional `visible` filter (a move steps over rows the
  default segment hides). `ReorderControls`, `TranslationDots` (icon, language, `lang`, optional link) and
  `TriggerChips` (icons, outline for DRAFT) are rebuilt on tokens; old props stay valid so unmigrated views run.
- Why: C1-13 to C1-21, C1-35. Additive where `12` §3 is silent.
- Supersedes: amends D-017 (reorder stays Manual-order only, now with set position and an explained blocked state) and
  D-035. Bulk selection is deferred (Q-016).

## D-085 (2026-11-12) — Greek companion font

- Type: design
- Decision: Manrope (SIL OFL 1.1), Greek subset only (`public/fonts/manrope-greek-var.woff2`, licence in
  `public/fonts/OFL-Manrope.txt`), is declared in `src/style.css` under the family name "Montserrat Variable" with
  `unicode-range: U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF`, so Greek text uses it and
  Latin stays Montserrat. Greek Extended (polytonic, U+1F00-1FFF) is not in Manrope and still falls to the system sans.
- Why: D-071 left Greek on the system fallback although Greek is a first-class language here; Manrope is a geometric
  sans of similar width and weight. No npm dependency (an asset, self-hosted, no runtime request to a font host).
- Supersedes: the "no Greek file" note in D-071 and `src/style.css`.

## D-074 (2026-11-12) — Editor frame

- Type: design
- Decision: every Resource editor gets a sticky editor header (title, status and Pending chips, a polite state line
  "Unsaved changes" / "Saved 12:41" / "Saving…" / "Still saving…", a readiness badge, Apply changes on an ACTIVE
  Resource or Save on a DRAFT, and a "More actions" menu with Archive) and, for an ACTIVE Resource, a sticky Working
  Copy banner of reserved height under it holding Save draft and Discard changes (the `12` §3 split is kept; a merged
  bar is Q-008). From 1180 px a sticky side column holds Status, "Preview in app", the readiness list ("Before you
  activate" on a DRAFT, "What needs attention" on an ACTIVE Resource), the "On this page" rail, Translations and Used
  in; below 1180 px a single column with a non-sticky summary row that opens the same cards inline. Sections follow one
  order (Texts, the kind's core setup, Media, How visitors reach it, Details) through `EditorSection`, which registers
  itself in the rail. Ctrl or Cmd+S saves (draft, or the Working Copy); the summary of a failed save takes focus; an
  error clears when its field changes. Activate always confirms (`ActivateDialog`): it names the item, lists what the
  editor already knows grouped by language, offers "Save and activate" for a dirty DRAFT, shows the platform's `422`
  inside the dialog with each missing field as a link, and the toast says "Activated" or "Activated with N warnings",
  never "complete" with warnings. Deactivate and Archive are disabled up front, with the reason, while an ACTIVE item
  uses the Resource. Conflict choices (`ConflictDialog`) start unselected. Leaving with unsaved changes keeps them in
  this browser as a draft (the leave dialog says so) and the restore notice is offered once, when the editor opens.
  `EditorShell` keeps its props and slots (plan 6.2) and adds `sections`, `structuralInNonDefault`, slot `header-extra`.
- Why: C1-22 to C1-26, C1-29 to C1-33.
- Supersedes: D-023's column arrangement and D-060's 360 px column details; D-058 breadcrumbs stand. The editor's own
  `<main>` is replaced by `PageFrame` (D-073). Leaving without saving no longer clears the stored draft (the amber
  "Leave without saving" loss of D-024 becomes "stays in this browser").

## D-075 (2026-11-12) — "Preview in app" is an inline panel

- Type: design
- Decision: "Preview in app" opens a panel directly below its action (the side column on wide layouts, under the
  summary row on narrow ones) that pushes the content below it down and never covers the form. No focus trap and no
  inert background, so the CMS chrome stays operable; Escape (when no dialog or menu claims it) and the preview's Close
  return focus to the action; its height is capped at 70 % of the window with its own scroll. On wide layouts "Expand"
  moves it to a full-width strip above the form. The content is `ResourcePreview`, unchanged.
- Why: C1-86 and `12` §3 ("below the action"). The surface default, "Shown at 45 %" scale text and the real-size link
  are P8's (`ResourcePreview`).
- Supersedes: D-056, D-059 and D-066 (pop-up card, backdrop wheel forwarding); `AppDialog`'s `popover` mode loses its
  only caller. A docked split pane is Q-009 and is not built.

## D-079 (2026-11-12) — Translation work inside editors

- Type: design
- Decision: in a language that is not the default, every text field shows the default-language text read-only beside it
  (stacked when the card is narrower than 34 rem) with a "Copy source" button; the language tabs are a real tab pattern
  (roving tabindex, Left, Right, Home, End), each named in the language's own script with its `lang`, a completeness
  icon plus text ("Complete", "3 of 5", "Missing") and an error marker with text; the Translations card lists the same
  state and a "Next missing" button; structural controls (reorder, add, remove of blocks, stops, occurrences) show only
  in the default language through `TranslationsPanel`'s `structural` prop and the shell's `EDITOR_STRUCTURAL` (the
  Route, Guide and Asset editors honour it in their packages); `describePath` falls back to a readable name with the
  language. The language-aware date and number formatter (`lib/format.ts`) is stage 0.1's.
- Why: C1-34 to C1-40.

## D-077 (2026-11-12) — Dashboard rebuilt to `12` §3

- Type: design
- Decision: the Dashboard is a first-run five-step guide while nothing is live and there is no Place or no Point of interest (steps 1 and 2 tick from list totals,
  DRAFT included; 3 to 5 link without ticks) and otherwise a Status card with four states and one action ("Nothing is
  live yet" -> Activate content, "N things block going live" -> Fix the first issue, "Ready with N warnings" -> Review
  warnings, "Ready" -> Preview the app), where "Ready" needs at least one ACTIVE Resource (`status=ACTIVE` totals of the
  six kinds). Then "Waiting for you to apply" (`pending=true` per kind, newest first, Open), warnings grouped by kind
  and code, collapsed, one line per Resource and field with language names, one counts strip from list `totalElements`,
  Project details collapsed. `contentRevision` and "Visitor app: Draft/Live" come from `GET /settings`. No translation
  bars and no packages until the endpoints exist (G-023, G-024); no "who" column (G-025). `aria-live` only on the
  Status headline; errors are a danger Alert with the request id.
- Why: C1-41 to C1-52 (P0 C1-41, C1-42).
- Supersedes: D-022's single readiness card as the Dashboard; its readiness data and codes stand.

## D-082 (2026-11-13) — Preview pattern

- Type: design
- Decision: one `PreviewPane` (labelled `role="region"`, "Skip preview" link first, the stand-in `inert` until "Interact with
  the preview", headings and landmarks of the stand-in demoted to plain text inside the CMS) shared by the Preview page, the
  editors' "Preview in app" panel (`ResourcePreview`, props unchanged) and the stand-in in the new tab (real headings there).
  `DeviceFrame` draws real surface sizes with Fit, 100 % and 50 % and states the scale; a Kiosk turns portrait or landscape and
  has no browser dots. Working mode draws each active item's Working Copy in place of its live row (read through the Working
  Copy endpoint, `12` §3); when none can be read the page says "Drafts shown. Pending changes of active items ... are shown in
  each editor's preview" (G-034). The fire control is surface-aware (beacons only on Mobile), grouped by type, with a persistent
  "Fired:" chip and Reset; notes and the chip clear on surface, language or mode change. The new tab has a slim control bar,
  case-insensitive parameters, shown (not silent) invalid ones, a per-state title and a StateCard for not found. Stand-in chrome
  words follow the previewed language (Greek, Italian, French, German, Spanish). No analytics event is sent.
- Why: C1-81 to C1-90 (P0 C1-81).
- Supersedes: nothing; D-014 and D-015 (the stand-in) stand.

## D-084 (2026-11-13) — Project picker, Create Project and session states

- Type: design
- Decision: Home and the header switcher share one searchable `ProjectList` (Current and Recent first, organisations
  grouped, "Needs setup (n)" collapsed with a "Resume initialization" button, "App: Draft" status words, roving arrow-key
  model, search focused when the popover opens, popover closes before the unsaved-work confirmation). Browser storage
  keeps only up to five recently opened Project ids (`workspace/lastProject.ts`, never a token or a name); Home offers
  "Continue to <Project>" and sign-in still lands on the picker. The Project list no longer reads every Project on load:
  only the open, Recent and first 12 listed Projects are read (4 at a time) for their initialization state; the rest
  open their Dashboard unchecked until the Catalogue listing carries `initialized` (G-029). Create Project is a four-step
  wizard (Name, Template and style, Languages and surfaces, Review) with a real stepper, radio-group choices instead of
  "Style confirmed", one error pattern (field errors plus a focused `FormErrorSummary` with links, 422 mapped per field
  without echoing the rejected value), a sticky footer with one primary per step, and Initialize disabled with its
  reason when no language, default language or surface is chosen. Session end shows the session-ended dialog instead of
  a silent redirect; a second `401` within 30 s of a sign-in redirect ends on a "Your session keeps ending" page
  (time kept in sessionStorage). Full-page states (sign-in errors, Project 403, 404, platform unreachable) use one
  `StateCard` in author wording with technical details collapsed; each holds its own document title.
- Why: C1-53, C1-54, C1-56, C1-57, C1-59 (P0), C1-60, C1-62, C1-63, C1-64, C1-65 (messages), C1-66 (strings).
- Supersedes: D-045's step presentation (its flow and API use stand); the all-Projects read in `stores/projects.ts`.
- Not done: reading setup state for every Project (needs G-029), automatic return to the last Project after sign-in.

## D-080 (2026-11-13) — Media pattern

- Type: design
- Decision: the library is a Content-style list (sticky toolbar from the list scaffold, URL-stored state) with sort (Updated,
  Name, Type, Size, Used in), the status segments, a Type select and "Needs attention" filters (No alt text in the default
  language, Needs translation in a chosen language, Unused, Decorative), an always-visible "Showing N of M files", grid or
  list with one Tab stop per file, never-cropped thumbnails (`object-contain` in a fixed-ratio box) and drawn icons plus the
  type in words for audio, video, documents and 3D, and "Show more" (focus to the first new file, range announced) in place
  of paging. Upload states the accepted formats and the largest size per type up front (client allow-list: images, audio,
  video, PDF, 3D; anything else, and any file that looks like a copy by name and size, is held with "Upload anyway" and
  Skip, G-032, Q-015), shows one row per file with progress, Cancel, Retry only where a second try can help, and the request
  id of a failure, keeps every message in a `role="log"` (start, each result, "3 uploaded, 1 failed"), and offers
  "Describe now": a stepper over new images without alt text. The Asset editor leads its form with Decorative (effect
  stated) and Translations, keeps the image visible beside the form (the lead of the sticky side column from 1180 px, a
  sticky strip above the form below it), and keeps file facts, Replace (DRAFT only, D-032) and Download in the side column;
  Used in comes from the references list and says when the library's count differs (G-030). The picker opens with focus in
  Search, defaults to Active (hidden drafts counted and one click away), has tiles or a list with Play for audio, a "No alt
  text" cue before selection, folds its filters into a disclosure at small sizes, selects a single uploaded file, and
  announces the selection and the attach.
- Why: C1-107 to C1-118. D-032 stands (Replace only for DRAFT).

## D-081 (2026-11-13) — Maps and Floor plans pattern, and the map engine

- Type: design
- Decision: the Map editor leads with Name and the map, with the Bounds and Visitor start view fields directly under the
  map (never a screen below it), then Placed and Not placed, Visibility, Visitor filter (collapsed) and Linked Place; one
  set of zoom controls (Leaflet's, 44 px on a coarse pointer, `showZoomControls`); the map is at least 360 px high and
  full width at 1024 and 768. `GeoMapCanvas` gained, additively (contract in `implementation/system.md`): a base-map
  state (`tileState`: loading, ready, error) with an in-canvas "The map background could not be loaded. Try again" card
  (the editor stays usable by coordinates), focusable bounds handles (four corners and the centre) and focusable
  draggable pins that move with the arrow keys (about 2 px, Shift ten times) and announce every move, context markers
  without a Tab stop unless `contextMarkersFocusable`, a dashed warning rim and badge for placed items outside the bounds
  (with a warning above the map), 44 px hit areas on coarse pointers, and design tokens instead of hex. Markers are kept
  between redraws so a focused pin keeps focus while its coordinates change. Coordinates are parsed once
  (`components/map/coordinates.ts`): a decimal comma is accepted, words and out-of-range values give a field error and never
  reach Leaflet (no `Invalid LatLng`); typed bounds apply only when all four are valid and in order. New items fan out on a
  spiral instead of stacking. The floor plan editor shows numbered pins at one size (44 px on touch), "Place" arms a visible
  "Click/Tap the plan to place <name>" state (sticky, Cancel or Escape ends it, "Place near the centre" is the keyboard
  route), x and y are labelled "Across" and "Down" with a 0 to 1 range check, rotation is explained as the pin's facing, nudges
  are announced, and the Working Copy banner no longer moves the plan (its height is reserved by the shell). The New map
  dialog states the geocoder failure by cause (429 busy, 403 refused, 5xx service problem, unreachable), names result types in
  words, offers typed bounds and "Reset to search result"; the New floor plan dialog keeps Places that already have a plan,
  marked "(has a plan)", since a Place has one plan per floor. Both lists use the shared list scaffold; the tab strip shows
  counts and the floor plan list shows each plan's position among its Place's plans.
- Correction: D-064 names the OpenMapTiles "OSM Bright" vector style served by OpenFreeMap (MapLibre in Leaflet), not raw
  OpenStreetMap raster tiles; the raster tiles remain only as the no-WebGL fallback. The style and OpenFreeMap stay.
  The Nominatim geocoder and the tile host are recorded exceptions to "authoring API and IdP only" (Q-003 stays open for
  production hosting).
- Why: C1-93 to C1-100, C1-72 (map side), C1-80 (engine side), C1-123 (map controls).
- Supersedes: nothing; D-064 (style, OpenFreeMap) stands, with the correction above.

## D-086 (2026-11-16) — Hit areas and forced colours completed

- Type: design
- Decision: `size-control` is a real token (`spacing.control` in `tailwind.config.js`), so `Button size="icon"` and every
  icon-only control built on it is 40 px square (44 px on a coarse pointer through `--control-h`). A `.hit-44` utility
  (`src/style.css`) gives a text link or small control a 44 px target through a transparent `::after`, without moving
  layout. A build-time check (`scripts/check-css-tokens.mjs`, `make check-css`, `pnpm check:css`) builds the Tailwind
  CSS and fails when a `size-*`, `h-*`, `w-*`, `min-h-*`, `z-*`, `shadow-*` or `rounded-*` class used in
  `src/components/ui/**` (or `--all` of `src/`) has no rule. The forced-colours block gives dialogs, alert dialogs,
  menus, listboxes, tooltips, alerts, status banners and popover content a 1 px `CanvasText` border, filled buttons a 2 px
  frame, `[aria-selected=true]` and `aria-current` items `Highlight`/`HighlightText`, and disclosure and sort-header
  buttons padding inside their new border. Reduced motion keeps a 120 ms opacity fade for appearing surfaces and drops
  transform, slide, pulse and spin. New tokens: `z-raised` (5), `shadow-drop-before` and `shadow-drop-after`.
- Why: C2-01 left every icon button at 18 px because the class existed in no stylesheet; C2-02 left dialogs and menus
  borderless in forced colours; C2-04. Spec `14` §4 (44 x 44, state not by colour alone).
- Supersedes: the per-call `size-8` and coarse patches on icon buttons.

## D-087 (2026-11-16) — Errors are sentences chosen by code, never server text

- Type: design
- Decision: `describeError` (`src/lib/errors.ts`) and `ApiError.message` take their text from one table
  (`src/lib/problemText.ts`) keyed by `code` and status (403, 404, 409, 422, 429, 500, 502, 503, 504, network and
  offline) with the request id beside it. A problem's `detail`, `title` and `message` stay in `ApiError.body` for code
  that reads specific fields and are never rendered; the only server wording shown is the `message` of a 422 field error,
  at its field. For other statuses a field error's text is a fixed sentence chosen by its code. 503 reads "The platform is
  busy or down for maintenance"; "cannot reach the server" is said only for a network failure. One `ProblemAlert`
  (`ui/alert`) renders heading, sentence, request id with copy and an optional Try again in cards, dialogs and page
  states; toasts take the same text through `showErrorToast`.
- Why: C2-09 showed stack traces and a user name in the UI; the BRIEF hard constraint, `07` §15, AGENTS §4.5.
- Supersedes: the use of the server's `detail` as the error text in `toApiError` and `describeError`.

## D-088 (2026-11-16) — One date and time formatter

- Type: design
- Decision: `formatDate`, `formatTime`, `formatDateTime` and `formatDateTimeRange` in `src/lib/format.ts` are the only
  formatters: 24-hour clock, day, month name, year ("16 Nov 2026, 14:05"), in the interface language, in the Project's or
  Event's time zone where one is given (`{ timeZone }`), the author's otherwise. Native date and time inputs are
  replaced by `DateTimeFields` (`ui/field`): typed day, month by name, year, hour and minute with a visible legend, a
  format hint linked by `aria-describedby`, one label per part and an error linked to the group; its model is the
  `datetime-local`, `date` or `time` string, empty until the parts are a real value.
- Why: C2-52 and C1-39 (12-hour and 24-hour times and three formats on one page; the browser's region decided the
  order and clock of native inputs).
- Supersedes: `toLocaleString`/`toLocaleTimeString` calls with the browser's locale in shared files.

## D-089 (2026-11-16) — Sticky stacks are measured and short

- Type: design
- Decision: the editor header is one 56 px line (the title truncates inside it; status chip, state line and readiness
  count drop out below 640, 768 and 1024 px). The Working Copy banner is one 40 px line with fixed-length text and is
  sticky only when the viewport is at least 800 px tall; below that (and at zoom of 150 % and more, which shrinks the CSS
  height) it scrolls with the page, so at 640 x 360 only the 56 px header is stuck. `useStickyStack` publishes the height of
  what is really stuck as `--sticky-stack-h` on `<html>` (ResizeObserver plus resize; an element counts only while its
  computed `position` is `sticky`) and sets `scroll-padding-top` of `<main>` from it, so a focused field or an anchor lands
  under the bars. The editor's side column `top`/`max-height` and the rail's scroll-spy read it. On lists only the one-row
  toolbar (search, status segments from 1180 px, a "Filters" popover for the rest) and the table head stick (106 px at
  1280); the head's `top` is the toolbar height minus the 1.5 rem the page frame pads, so no sliver of rows shows above or
  between the bars; below 900 px only the head sticks. `--editor-sticky-h` stays on the shell root as an alias.
- Why: C2-05, C2-06; WCAG 1.4.10 and 2.4.7. Measured: banner + header 98 px (11 % of 900) at 1440 x 900; 56 px at
  1280 x 720, 1024 x 768 and 640 x 360; POI list 106 px at 1280 x 720 (was 255 px, 35 %).
- Supersedes: the fixed `--editor-sticky-h: 7rem` of D-074 and the always-sticky two-line banner; the list toolbar of
  D-076 as a two-row sticky block.

## D-090 (2026-11-16) — One readiness and completeness model

- Type: design
- Decision: `src/platform/completeness.ts` is the only place that counts things to fix. `completenessOf` takes the
  languages, the editor's counted texts (`base`), individual text slots (Route stop texts, image alternative text) and
  gaps (a Guide without TEXT blocks) and returns blockers, warnings, per-language marks and the counts; `issueSentence`
  is the one sentence ("3 to fix before activating, 4 warnings", "4 warnings, nothing blocks", "Nothing to fix"; an
  ACTIVE Resource reads "3 to fix"). The header count, the readiness card, the Activate confirm, the toast after
  activation, the language tab marks and the Translations card all read it (`EditorShell` provides it to
  `TranslationsPanel`); the platform's readiness adds only what the browser cannot know and its text items are dropped
  so nothing is counted twice. Without an editor-supplied `completeness`, the shell builds it from `translations` and the
  saved Resource. A Resource's own triggers are never "used by" blockers: the sentence names the other users ("Used by 1
  route. Choose another category in that route first."), and a DRAFT image without alt text cannot be activated ("Add alt
  text in English first").
- Why: C2-33, C2-34, C2-59. The platform still refuses Deactivate while a non-archived trigger points at the item (verified
  on a POI with a QR code): the dialog then says to deactivate the codes first and links to them; the backend should
  deactivate a Resource's own triggers with it (G-037).
- Supersedes: per-screen counts in `EditorShell` (`clientLines`, `progress`), `TranslationsPanel`'s own tab count and the
  "Activated with N warnings" toast built from the platform's list alone.

## D-092 (2026-11-16) — The Dashboard says how the visitor app goes live

- Type: design
- Decision: The Status card is the one next step. With no blockers, at least one ACTIVE Resource and the visitor app
  still a Draft, the primary action is "Go to Launch" and the sentence says visitors cannot open the app until you go live
  in Launch; "Preview the app" is the secondary action. ACTIVE = 0 reads "N items are drafts, so visitors see nothing" with
  "Show drafts" (first list that has drafts, filtered to DRAFT). Blockers list at most three rows with field names and "and N
  more" expands in place. The Project status chip leaves the h1; the one status line below it is "Visitor app: Draft/Live"
  with a HelpHint and "Content revision N" (the Project's own lifecycle is not shown on the Dashboard). The first-run guide
  stays until step 5 (Preview) is opened or this viewer dismisses it (browser storage per Project, wrapped in try/catch)
  while nothing is live or a Place or Point of interest is missing; with live content the Status card already says what to
  do. Steps 1 and 2 tick from list totals, step 4 from the main menu having an item, steps 3 and 5 once this viewer opened
  them from the guide (the API has no data). Its buttons open the create dialog with `?create=1` on the list.
  Pending changes: every page of every kind is read, newest saved first, the title is the link, "Showing 10 of 15" and
  per-kind "See all" links to the `pending=1` lists. Warnings: one row per Resource with field names ("Italian: Description,
  Summary"), kind prefix dropped, `PENDING_WORKING_COPY` and duplicates removed, counted in those rows everywhere on the
  page (`issueSentence`). Counts read "10 active · 8 draft" with zeros muted. Requests run in one round; errors use
  `ProblemAlert`; the skeleton mirrors the layout and announces "Loading dashboard".
- Why: C2-24, C2-25, C2-26, C2-27, C2-28, C2-29, C2-30, C2-31, C2-32, C2-21, C2-73. `12` §3 stays: five steps, one action,
  at most three items, pending only when present.
- Supersedes: "Activate content", the Active chip in the Dashboard head, the guide that vanished after two drafts.

## D-094 (2026-11-16) — The Media worklist names what is missing

- Type: design
- Decision: Every Media row, grid and list, says what is missing in the language in force ("Italiano: alt text, title
  missing"). The language is Needs translation, else Search in, else the Project default; the "No alt text in <language>"
  filter uses the same one. `missingTextNames` (`platform/assets.ts`) uses the same two checks as `missingTextIn` and
  the completeness model (title, plus alternative text of an image that is not decorative). The list view has five columns
  (Name, Type and size, Status, Used in, Updated); Status holds the Decorative chip, so no cell overprints another at 1024
  px. `view=grid|list` is in the URL. There is one count line ("Showing 48 of 87 files (1 archived)") and one "Clear
  filters": the toolbar's, which also resets Type and Needs attention and moves focus to the search field. The toolbar is
  hidden while the library is empty. In the upload dialog the formats table folds into a disclosure once files are added,
  the log is visually hidden (read by screen readers), "Done" is "Close", a skipped file offers "Undo skip", button names
  begin with their visible text ("Upload anyway, tool.exe"), focus moves to the next held file after a decision, and a
  server failure shows `ProblemAlert` instead of server text.
- Why: C2-51, C2-75, C2-77, C2-79, C2-82, C2-83.

## D-097 (2026-11-16) — Session, picker and loading states

- Type: design
- Decision: Create Project has no silent defaults: with one Template it is the only choice and says so; with several the
  author chooses (Continue says "Choose a Template first"); the preselected style reads "Recommended" (not "Suggested")
  and the Surfaces step says all are on as recommended; surfaces use the same words (Web, Mobile, Kiosk) everywhere;
  step 1 says it creates a real Catalogue record; "style" has a HelpHint; placeholders start with "e.g.". Loading
  states mirror the page and announce "Loading <page>" (Dashboard, list, editor skeletons); the workspace menu is
  `inert` until the Project is confirmed; the header chip's skeleton shows only while the Project read is pending (3 s
  at most) and never on an error page. The authorization code leaves the address bar (`history.replaceState`, one
  entry). The session-ended dialog is dismissible (Escape, close, "Stay on this page"). The offline notice floats under
  the header (no row, no layout shift, one `role="alert"`) and Create Project controls are `aria-disabled` with the
  reason while offline. The picker lists "Needs setup" before the organisations, marks rows not yet read "Setup not
  checked" and counts "n+" while some are unread (G-029); the switcher list uses the height of the window. "Off" menu
  items are one line with the reason read through `aria-describedby`. One logo: the sign-in card no longer repeats the
  header's, and the start-up splash uses the same asset and says "Signing you in...".
- Why: C2-08, C2-11, C2-14, C2-15, C2-19, C2-21, C2-22, C2-23, C2-25.

## D-096 (2026-11-16) — Maps: keyboard and touch model

- Type: design
- Decision: On a coarse pointer a map starts at rest: one finger scrolls the page (Leaflet's panning and pinch are off,
  so the container no longer declares `touch-action: none`), pins and handles still drag (they declare it themselves)
  and the zoom buttons zoom. A "Move map" toggle (`aria-pressed`, 44 px, top-right of the map) turns one-finger pan and
  two-finger zoom on, and a line under the map says which mode is on (`mapGestures.ts`, `MapMoveButton.vue`; used by the
  canvas and the GeoPicker). Non-draggable layers stay out of the Tab order (W0-B). The map editor's "Try the visitor
  filter" is one disclosure with a Type and a Category radio group (two Tab stops, arrow keys inside), not about 40 chip
  buttons. Coordinate fields check on leaving the field with the New map dialog's sentences, `aria-invalid` and a polite
  announcement; Save still checks all. Floor plan "Place" buttons are named by their item ("Place Acropolis"); the
  armed bar sits under the plan (sticky at the bottom of the viewport), never over its top. Placed numbers keep their
  order across a save. The tile-failure card is drawn under the map, not over its pins. The New floor plan dialog shows
  the shared "N things to fix" summary. Routes drawn on the map editor have a legend line.
- Why: C2-58, C2-69, C2-84, C2-85, C2-86, C2-87; `14` §4 (coordinate fields remain the accessible alternative to dragging).
- Supersedes: `touch-action: none` on the whole map; the visitor-filter chip row.

## D-095 (2026-11-16) — Editor save, conflict and restore model

- Type: design
- Decision: In an ACTIVE item with a Working Copy, a dirty form makes "Save draft" the header's primary action and "Save
  and apply" the secondary one (in the More menu below 768 px); "Apply changes" is primary only when the form is clean,
  and is truly disabled ("Nothing to apply: there are no pending changes") when no copy exists. Apply and Activate
  confirm by naming what changes ("Changes: Summary (English), Title (Greek). ... Still open: 6 warnings, nothing blocks.").
  A refused Save with 409 is a three-way merge against the snapshot taken at load or last save: only fields the author
  changed and the other person changed too are a choice (nothing preselected; lists show "Mine: 1 added. Current: 2
  removed."); fields only they changed keep their value, fields only the author changed keep theirs. The primary action
  is "Keep my changes"; the other is "Reload their version (discards your N changes)"; the request id is shown. Save errors
  are a floating card under the sticky bars (`data-summary-slot`, `z-raised`, no layout shift) that takes focus for
  5xx, offline, 403 and 404 (403/404: "You no longer have access" / "was removed", with one action "Back to <list>");
  the header state line ("Saved 14:52") is the one Save announcement, so a successful Save has no toast (an ACTIVE item
  without a Working Copy still says visitors see the change). The Restore-draft notice is one compact row ("Restore
  (2 fields)", "Discard"), gone after Restore, Discard or any successful save, and focus goes to the first restored
  field. An Activate refusal other than missing fields (503, 403, offline) stays inside the dialog as "Not activated"
  with Try again; focus after Activate, Apply and Archive is the Status card heading, after Restore the first field.
  The Status card shows "Revision N" (only for a live or archived item) or "Not saved yet", never "Version 0". Undo of a
  removed row is a bar that stays at the bottom of the viewport while its list is on screen (`RemovedBar anchor`) and
  Ctrl or Cmd+Z undoes the last removal until the author types. `TranslationsPanel` draws a "Texts" heading, the Title
  grows to its text, and "Next missing: Italiano" sits beside the tabs below 1180 px. `?lang=it` opens the editor on that
  language. "Preview in app" is as wide as the editor content area, with Expand at every width. Independent trigger and
  media writes of a save run together (`runIndependentWrites`) and a failure is one sentence (`partialSentence`,
  `reportPartial`).
- Why: C2-10, C2-11, C2-12, C2-50, C2-54, C2-56, C2-57, C2-62, C2-63, C2-64, C2-65, C2-67, C2-68, C2-70, C2-73; `12` §3 (Save
  draft and Discard in the banner, header Apply), `12` §5 (409), `14` §4.
- Supersedes: "Apply changes" always primary; the two-way list of every differing field in the 409 dialog; the large
  Restore-draft alert; "Version N"; the Undo bar below the list outside the viewport.

## D-091 (2026-11-16) — List paging, sort direction and honest counts

- Type: design
- Decision: The list loaders keep reading every page of the API (`size=200`, loop to `totalPages`), so search across
  languages, segment counts, the translation worklist, trees and manual order see every row; the table renders 50 rows
  per page (`ListTable`, `pageSize`) with a pager ("Showing 51–100 of 184", Previous / Next that stay focusable) and
  `page` in the URL, which falls back to the last page when it is too high and returns to 1 whenever the search, a
  filter or the sort changes. Server-side paging and filters are recorded as G-041. A sort carries a direction that
  starts as the sort's own (`defaultDirFor`: Updated newest first, the others ascending); `dir` is in the URL only when
  it differs, the control says it in words ("Newest first", "A to Z"). Denominators are the active status segment
  (`segmentTotal`), segment counts respect the search and the other filters, and a count that is not known yet is left
  out instead of showing 0. The live region names the noun and announces sorts and pages. The toolbar carries the one
  "Clear filters"; the footer and the empty state have none. Back from an editor restores the scroll (read in a
  route-leave guard) and focuses the row's link, on its page. Each translation dot is a link with `?lang=<code>`
  and a language never breaks inside a word. A hit that came through another language says "Matches Ελληνικά: …".
  "Needs translation" starts on the Search-in language, else the first non-default one. `FormDialog` validates every
  field in one pass (`validate`), lists problems in form order, never shows an unmapped key, caps the slug at 100,
  asks "Discard what you typed?" before Esc, the backdrop or the close button lose text, and gives its height to the body
  in a short window. `?create=1` opens the create dialog once the languages are known and removes itself
  (`useCreateParam`). "/" focuses the list search.
- Why: C2-35, C2-36, C2-37, C2-39, C2-40, C2-41, C2-42, C2-44, C2-45, C2-47, C2-48, C2-49, C2-74, C2-94.
- Supersedes: "Updated" sorting oldest first; the footer's "Showing N of M" over all statuses; a second and third "Clear
  filters".

## D-093 (2026-11-16) — Preview in app is a full-width panel with fit-width

- Type: design
- Decision: the editor's "Preview in app" panel opens below the action across the editor content area (P4s owns the
  container; the pane inside it is the Preview pane). "Fit width" is the default size for every surface and never
  scales above real size, so a Kiosk is no longer shrunk to 33 % by the window's height; a Kiosk screen, 1920 px tall,
  scrolls inside an area as high as the window leaves room for (a labelled "Preview screen, scrolls" group). Size choices
  that give the same picture are not offered: no "100 %" when the room is as wide as the screen, and a phone says "Fits at
  real size". Where 100 % does scroll sideways the caption says so. The Preview page has one compact toolbar (Surface,
  Language, Content; then the trigger choice with a filter field above eight choices, sticky in windows 760 px or higher)
  and the picture starts above y 480 at 1440 x 900; the Size choice sits beside the picture's caption, and the content and
  missing-title lines sit under it, each kind of missing title linking to its list filtered by "Needs translation".
  `/preview?trigger=<id>` shows the surface the trigger reaches (a beacon: Mobile), chooses it, fires it and shows the
  "Fired:" chip, or says why it is not offered. The stand-in is `inert` and `aria-hidden` until "Interact"; Esc inside the
  frame stops interacting and returns focus to "Interact", the next Esc is the host's (the editor panel closes). Reset
  returns focus to the trigger choice. Stand-in glyphs (arrow, menu, chevrons, play) are lucide icons and the missing-text
  outline and note colours are tokens.
- Why: C2-61, C2-88 to C2-92; `12` §3 ("below the action"), `14` §4.
- Supersedes: D-082's Fit/100 %/50 % with Kiosk fitted by window height; the five-group control card.

## D-098 (2026-11-16) — Removing a stop or block is undoable where you are

- Type: design
- Decision: Removing a Route stop or a Guide/story block moves focus to "Undo" in the bar under the list (one Tab from
  the removed row; the bar stays at the viewport bottom while its list is on screen), and Ctrl or Cmd+Z undoes while
  nothing has been typed since. After Undo, focus returns to the restored row. The Route map card states what the stops
  say: guidance only at no stops; with stops but none placed, a card says the map cannot draw the route and links each
  stop's point of interest; with some placed, "Stops 1-3 and 5 have no position, so they are not on the map" with links.
  Pins at the same position are fanned out on a small circle (about 25 m) and say so; "Show as list" opens the stops
  with their positions as text. A stop card shows its description; walking instructions, title and narrative are behind
  "More stop texts". The Route and Guide editors pass the live form to the completeness model (stop texts, empty story
  as a warning until G-039). The picker's search moves into the results with ArrowDown, and Enter picks the first
  choosable row.
- Why: C2-70, C2-71, C2-72, C2-34; `12` §3 Route and Guide, `14` §4.

## D-099 (2026-11-16) — Place and POI editors: one Media card, folded other settings, partial trigger saves

- Type: design
- Decision: The audio narration is one visible group inside the Media card ("Audio narration": a row per language that
  has a file with Replace and Clear, one dashed chip per language without one, "All languages" last), no longer under
  each language tab (supersedes the per-language-tab placement in D-079 for media only). Empty single and gallery
  slots are one "Add" row of short buttons; the recommended slot is named in the card's count, not in the button. While a
  language other than the default is open, the language-independent cards (Placement or Place setup, Media, How visitors
  reach it, Details) fold into one collapsed "Other settings (all languages)" disclosure; they stay mounted and the rail,
  error links and trigger links open it. The POI Placement card shows Place, Category, Latitude and Longitude and opens
  the map on "Set position on the map"; coordinates are checked when the field is left (and announced), and the trigger
  rows are checked before any request: an empty beacon (UUID, Major, Minor) or area (latitude, longitude, radius) row is
  named in the summary as "Beacon 1, UUID". Place and Category choices with 25 or more options get a filter field above
  the native select (no `ui/` combobox exists). Placeholders are "e.g." examples. After a file is chosen focus lands on
  its Replace button. Trigger rows save in parallel (removals, then creations and updates); on a DRAFT POI or Place the
  item is saved even when a row is refused, the form keeps the rows, and one sentence names what failed; working-copy
  saves stay all-or-nothing (the shell cannot take a partial result there) but write in parallel too.
- Why: C2-60, C2-66, C2-67, C2-69, C2-23, C2-55, C2-57, C2-73, C2-93; `12` §3 POI, `14` §4. Spec check: `12` §3 lists the
  media slots and the Placement card without fixing where audio is chosen or whether the map is always open.

## D-100 (2026-11-17) — One focus ring, no clipping

- Type: design
- Decision: Focus is `outline: 2px solid hsl(var(--ring)); outline-offset: 2px` on every focusable control, including
  `[data-variant=primary|danger]`. The white ring, the `#fff` and the 4 px coloured halo are gone; the 2 px gap between
  control and ring shows the surface, so the ring reads on the canvas and on a filled button alike. Tab strips
  (`TabsList`, `LinkTabs`; both scroll sideways) get a 4 px inset (`p-1 -m-1`) so the ring is never clipped. A
  programmatic focus on a heading, `<main>` or a dialog panel (`tabindex="-1"`) draws no ring: it is not a control and
  the route announcer names it. Inside the dark preview stand-in the ring uses `--ring-inverse` (class `.on-dark` on the
  stand-in root; P8 applies it). Forced colours: `Highlight`.
- Why: C3-01, C3-02, C3-04, C3-06; `14` §4 "focus is visible at all times".

## D-101 (2026-11-17) — State ladder and menu highlight

- Type: design
- Decision: Pressed is its own step: `--primary-active` for primary, `--destructive-active` for danger and a
  `destructive/20` tint for danger-outline, `--surface-active` (one grey step under hover) for ghost, secondary, tab,
  nav (`.nav-item:active`, adopted by P1), kebab and row controls. Menu items (row menu, user menu, More actions):
  highlighted = `bg-accent-strong` plus a 2 px inset `--ring` outline (the fill alone is 1.14:1). In forced colours only
  the highlighted item is outlined (`Highlight`); other rows lose the per-item border. Popovers, menus and tooltips use
  `z-popover-over` (`calc(var(--z-modal) + 1)`), so a HelpHint opened in a dialog is above it. The `Select` is the native
  `<select>`, so its list highlight belongs to the platform.
- Why: C3-03, C3-05, C3-100.

## D-102 (2026-11-17) — Toasts dock beside the form, success is a check

- Type: design
- Decision: In a wide editor (from `edit`, 1180 px) the stack is anchored bottom-right, as wide as the side column and
  with its right edge (measured from `#editor-side-column` by `useToastDock`), so it never covers the form column.
  Below 1180 px an editor gets a full-width stack with the 16 px gutter; outside editors the stack is unchanged
  (bottom-right, `--toast-inset-right` if a page sets it). "Link copied" is one line. Neutral confirmations (Changes
  discarded, Archived, Restored, Link copied) use a check and ink colour (`neutral` tone), never the warning triangle; a
  toast that carries an instruction ("copy it by hand") stays until dismissed; a route change clears toasts older than
  1.5 s; the request id is the shared `RequestIdRow`. Callers that still pass `warning` for a neutral confirmation are
  mapped by title in the store until they change (listed in `requests.md`).
- Why: C3-26, C3-27 (R2-V-04).

## D-103 (2026-11-17) — Focus has a successor; route announcements follow the committed route

- Type: design
- Decision: `lib/focus.ts` gains `focusSuccessor(removed, candidates)`: when focus is inside the element about to go it
  moves to the next sibling action, else the previous, else the listed candidates, else the nearest labelled region,
  else the page `h1`, else `<main>`; never `<body>`. Toast dismiss uses it; `StateCard` hands focus on after "Try again"
  replaces it; the confirm store remembers the opener at the time of the question and `AppDialog` returns to it, so Esc on
  the leave guard lands on the control that was used. The announcer, `document.title` and focus all run in
  `router.afterEach` (committed routes only), and in an editor the title follows the heading, so a saved rename updates it.
  The sign-in response is removed from the address bar by one `router.replace` before the app mounts (no extra history
  entry); `/app-preview` receives `orientation`, `real`, `surface`, `lang`, `mode` and `t` through a whitelist parser.
- Why: C3-09, C3-11, C3-84, C3-64.

## D-104 (2026-11-17) — Date and time fields validate field by field

- Type: design
- Decision: `DateTimeFields` checks each part when it is left: hour 0 to 23, minute 0 to 59, year four digits, day against
  the chosen month and year (31 February is wrong). Each wrong part has its own sentence under the group with an error
  icon, linked to its input by `aria-describedby`, `aria-invalid` on the input, and one polite announcement. A blank part
  is "not entered", not wrong. While a part is wrong the model is "" and never another value, so a parent cannot derive an
  End from it; a `validity` event reports it. The optional `ended` prop mutes the legend and adds "(ended)" without opacity.
- Why: C3-38 (WCAG 3.3.1, 3.3.3), `14` §4 errors linked and announced.

## D-105 (2026-11-17) — One sentence per failure, one request-id row

- Type: design
- Decision: `problemText.ts` stays the only table (503 reads "busy or down for maintenance"; "cannot reach the server" only
  for network failures). `RequestIdRow` (label, id, Copy request id) is the one request-id row; `Alert` (and so
  `ProblemAlert`), `FormErrorSummary`, `StateCard` and toasts all use it. A failure that belongs to no field never has an
  "N things to fix" title: `FormErrorSummary` says "This could not be completed" and `FormDialog` "The <noun> was not
  created". In a dialog with an error summary the field messages are not alerts (`QUIET_FIELD_ERRORS`), so one error is one
  announcement. Surfaces that still print "not reachable" for a 503 are listed in `requests.md`.
- Why: C3-85, C3-93; extends D-087.

## D-106 (2026-11-17) — Hit areas, dialog frame and HelpHint

- Type: design
- Decision: `HelpHint` is a 40 px hit area with a 16 px icon (44 coarse); checkbox rows are 44 px high under
  `pointer: coarse`; `.hit-44` stays the rule for text links. `formatBytes`, `formatDistance` and `formatPercent` in
  `lib/format.ts` join number and unit with a no-break space. `Input` and `Textarea` are `dir="auto"` unless the caller
  passes `dir`. `Select` has `size="sm"` (32 px, 44 coarse). `AppDialog`: Close is the first Tab stop (placed last on
  the line by `order`), the panel's top edge is anchored so an error summary does not move it, and in a short window the
  footer is sticky at the foot of the body so the primary action is on screen at 200 % zoom.
- Why: C3-49 (R2-V-02), C3-48, C3-44, C3-92, C3-93, C3-94; `14` §4 44x44.

## D-107 (2026-11-17) — One readiness list before and after activation

- Type: design
- Decision: The platform's readiness items are merged into the completeness model by code and path (`coveredByModel`): a missing translation, accessibility information or an image's alternative text that the model already counts is dropped, so one problem is one line before and after activation and the header badge, card, Activate confirm and toast say the same number. The sentence is said once in the confirm; a DRAFT adds "plus checks run on activation" while the platform cannot return readiness for a DRAFT (G-044). Structural gaps (Route without stops, Event without dates, Guide with an empty story) stay warnings (`12` §3), are listed first in their own "Structure" group and named in the confirm ("This Route has no stops. Visitors will see an empty route."); whether they block is Q-021. Every line of the confirm is a link that closes it, opens the section and focuses the field. An Asset is no longer blocked by a missing title: the backend's asset readiness has only `MISSING_ALTERNATIVE_TEXT` and `MISSING_TRANSCRIPT` (`completenessOf` `baseBlocks`, default off when alt slots exist). `issueRowText` (Dashboard) gives "Title is missing in English".
- Why: C3-14, C3-15, C3-16, C3-58.

## D-108 (2026-11-17) — One Save draft at a time

- Type: design
- Decision: While the Working Copy banner is in sight it holds Save draft and Discard (`12` §3) and the header carries Apply only ("Apply changes", or "Save and apply" once dirty, whose confirm names the changed fields). The banner is sticky only from 960 px of viewport height and the header only from 700 px; below that the header shows one compact Save draft once the banner is out of sight, and the banner's Save steps aside. Measured chrome (app header included): 11.7 % at 1440x900, 14.6 % at 1280x720, 56 px at 200 % zoom. The error summary floats only from 900 px of height (30 dvh cap, form column width) and is in the flow below. A session that ends mid-save releases the busy flags: "Not saved: session ended. Sign in again", a Sign in again button, Save and Ctrl+S live again.
- Why: C3-21, C3-23, C3-24, C3-25, C3-83.

## D-109 (2026-11-17) — Side cards are one component

- Type: design
- Decision: `SideCard` (one `h2` `text-sm font-bold`, `p-4`, `rounded-lg border bg-card shadow-1`) is the only side-column card (Status, readiness, On this page, Translations, Used in). The column's height is the viewport less the app header and the sticky stack, with a fade on each edge that has more.
- Why: C3-31.

## D-112 (2026-11-17) — The Dashboard headline tells the truth and the guide ticks from data

- Type: design
- Decision: The Status card says "Live" only when `applicationStatus` is `LIVE`. SUSPENDED ("The visitor app is suspended", visitors cannot open it, the platform controls this) and an unreadable or unknown status ("The visitor app status is unknown", reload) have their own headlines and sentences, take precedence over blockers (which stay listed beneath), and the status line never prints the server's word for an unknown status. While Launch is a placeholder the headline is "Content is ready; going live is not available yet", and "About Launch" and "Review warnings" are text links beside the one primary action. Blocked rows give the cause from `issueRowParts` ("Title is missing in Greek"), no kind prefix, names in `<bdi>`. The first-run guide ticks only what data proves (a Place, a point of interest, a menu item); a visit ticks nothing. Step 3 reads "Not available yet", has no link and is not counted, so progress is "n of 4" (Q-022); step 5 (Preview) has no data and stays open, so it is the last step and never ticks. Once a Place and a point of interest exist the guide ends with "Next: activate the drafts that are ready" and a secondary "Show drafts"; the Status card's "Show drafts" is secondary while the guide is open (one primary). A dismissed guide returns through "Show the guide again" in Project details. Layout: from 1100 px two columns, below it one column with the counts second and the blocks in DOM order, so Tab follows what is seen; counts are compact tiles (one line each from 1024 px). A failed Working Copies read keeps the Status card and shows its own alert with Try again; 403, 404 and 422 offer "Choose another Project" and no Try again.
- Why: C3-54, C3-55, C3-56, C3-57, C3-58, C3-59, C3-60, C3-61, C3-62, C3-63, C3-91. Supersedes the "opened counts as done" rule of D-092.

## D-110 (2026-11-18) — List row anatomy and the Filters popover

- Type: design
- Decision: One row rule for the six lists. The Title column takes what the others leave (its own width class is ignored) and is never narrower than 15 rem: when the table would squeeze it below that, the rows become the two-line cards of the narrow layout until the table fits again (measured, with the width it needs as hysteresis). Title text wraps anywhere inside its cell and sits in `<bdi>` (`ListRowTitle`, which also carries `hit-44`, `back` and the worklist `lang`). One header height (48 px), one Order width (48 px), one tree step (24 px, the guide drawn inside it). Trigger chips are on their own line, at most two plus "+N". The Filters popover is a named dialog ("Filters and sort"), has a visible Done, the button reads "Filters 1" (visible text first), the popover is at most the available height with its own scroll, every field is a label above a full-width control (`FilterField`), and there is one Language control for the search language and the worklist. Below 1180 px the status in force is a chip beside the button. A third click on a sorted header returns to the list's own order. The filter chip is one component (`FilterChip`); an empty filtered list says what the other statuses hold ("1 match in Archived"); a list whose header carries New passes `header-action` so the empty state does not repeat it.
- Why: C3-40 to C3-47, C3-51, C3-99, C3-101. `14` §4: reflow, label in name.

## D-111 (2026-11-18) — A move is visible and undoable

- Type: design
- Decision: After a saved move (menu, Move to position, drop) the list shows a bar "Moved X to position N of M" with Undo (Ctrl or Cmd+Z) and, when the row left the page, "Show it"; the row flashes for 1.5 s (a static outline under reduced motion); focus goes to the row's kebab, or to the kebab of the row now standing where it stood. The live string uses at most 40 characters of the title. Changing page moves focus to the table and scrolls its head under the toolbar. The bar is a sticky group in `ListTable` because the toast store has no action button; the single announcement is the table's live region, the bar text is not live. The Undo bar of Archive, Restore and dismissals hand focus on (`focusSuccessor`, the neighbour's kebab).
- Why: C3-08, C3-09, C3-10. `14` §4 keyboard alternatives and feedback.

## D-113 — Preview controls live in the panel header; the new tab honours the options
"Preview in app" shows the Surface tabs (with a hint), Expand and Close in one sticky header row of `PreviewPanel`, at most 70 px above the picture. Expand lines the panel up under the sticky bars (the picture stays in view), caps its height to the window from there, and is hidden when the panel already fits or would grow by less than 48 px. `/app-preview` reads `orientation` and `real` from route props (verified: Kiosk landscape is 1920 px wide, `real=1` scale 1.000) and states the scale in its bar. Invalid or malformed parameters get fixed sentences that never echo the value; `<html lang>` follows the content language (the CMS bar says `lang="en"`). The empty-Project state sits outside the frame with links to Places and points of interest and the Working/Live explanation. The Preview page keeps its picture still when the surface changes (both Size and Orientation groups are always laid out, the caption row is reserved, the trigger chip has its own reserved row). Why: C3-64, C3-65, C3-66, C3-68, C3-70; `12` §3 "below the action".

## D-114 (2026-11-18) — The armed floor-plan prompt docks
The "Placing X" prompt sits directly above the plan image, in the flow and not sticky, so it never covers the plan at any height (it covered 116 px of the plan at 1024x768 before). Arming scrolls the prompt and the plan into view together under the sticky bars. A tap or click on a spot that is already taken is not a silent no-op: the prompt shows, and the live region announces, "That spot is taken by <pin>. Click (Tap) an empty spot." (a drag that ends in a click does not count). The prompt is not a live region of its own, so the sentence is announced once. Also in this package: the bounds handles keep 16 px (40 px below, clear of the attribution strip) round the area when editing starts, the tile-failure card is drawn over the top of the map and "Try again" moves focus to the map region, and the basemap now attaches its MapLibre listeners on the layer's `add` event (it read the MapLibre map before it existed, threw, and fell back to raster tiles every time). Why: C3-71, C3-72, C3-73, C3-09, C3-76.

## D-116 (2026-11-18) — Dead code removed; gates wired
The dead files, rules, exports and config of the round-3 cleanup list are deleted, each after a zero-hit grep (recorded in `ux-audit/round-3/implementation/CLN/changes.md`): five unused filter components, `useStatusActions`, `list/ListSelect` (its six callers use `ui/select` at `size="sm"`), `dropLineClass` (the Route and Guide drop lines get a `Highlight` counterpart in forced colours), `statusGlyph`, `.small-label`, `.table-head`, `.table-row`, `.nums`, the dead `.th`/`.td` rules, five unused barrels, and in `tailwind.config.js` `darkMode`, `container`, the `tailwindcss-animate` plugin line (nothing uses it; the package stays in `package.json` for the owner to remove), the `line` colour, `card.foreground`, `text-2xl`, `rounded-xl` and `z-base`. The six local accent-folding copies are replaced by `fold` from `lib/utils`; `StatusChip` has a `wrap` prop for "Pending changes" in a narrow column. `scripts/check-css-tokens.mjs` covers every Tailwind family and the custom screens and never splits inside `[...]`; `scripts/check-literals.mjs` is the literal gate over CMS chrome. Make targets `check-css` (`--all`), `check-literals` and `check`, and `package.json` scripts `check:css`, `check:literals`, `check`, exist; they are not part of `make build` or the Dockerfile (the owner decides whether they gate the build). The legacy visitor-app screens (Overview, Languages, Surfaces, Translations, Navigation, a section page) keep `.field-input`, `.field-label`, `.dialog-primary`/`.dialog-secondary`, the Button aliases and `statusChipStyle`; DESIGN.md lists them as legacy. Why: C3-97, C3-98, C3-99.

## D-115 (2026-11-18) — DESIGN.md is the system of record

- Type: design
- Decision: `DESIGN.md` at the repo root (with `.impeccable/design.json`) describes the shipped CMS design system: tokens with roles and measured contrast, type scale (one line-height per size), spacing (4 px base with half steps), radii, elevation, z layers, motion, the focus ring and state ladder (D-100, D-101), the components as used, the layout patterns, content and accessibility rules, the gates (`check-css --all`, `check-literals`), the legacy section for the out-of-scope visitor-app screens, and the deviations still open. `PRODUCT.md` stays the product source; `DESIGN.md` does not repeat it. Every token and class it names exists: the "Token verification" appendix gives name, file and line, each found by grep. A change to a token, a type size or a component variant updates `DESIGN.md` in the same slice.
- Why: C3-101, `ux-audit/BRIEF.md` §2 item 4.
