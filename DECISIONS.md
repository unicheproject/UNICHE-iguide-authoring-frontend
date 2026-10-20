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
