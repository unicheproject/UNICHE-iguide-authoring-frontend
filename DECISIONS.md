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
