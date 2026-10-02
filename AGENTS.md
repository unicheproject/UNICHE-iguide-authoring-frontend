# AGENTS.md — uniche_iguide_frontend

Entry point for every human or agent working in this repository: the iGuide CMS, the authoring SPA of
iGuide. It is the source of truth for how work is done here. The specification package at
`../uniche_iguide_specs` is the source of truth for what is built; `12-cms-experience.md` is the primary
spec of this repository. The visitor runtime (iGuide App, A0–A4) lives in another repository and is out
of scope, except where the CMS embeds it for preview.

## 1. Product

The CMS is the only authoring surface of iGuide: every mutation of Project Content passes through it and
the authoring API of `../uniche_iguide_backend` (`12` §1). It is a Vue.js single-page application served as
static files [ARC_4.3] and meets WCAG 2.1 AA (`14`).

Personas (`12` §2), all with full authoring rights once the Catalogue admits them [ARC_6.3]:

- content editor: creates Places, Points of Interest, Routes, Guides, Pages, Events, uploads media,
  decides what is `ACTIVE`;
- translator: works per language across the Project;
- project manager: an organization manager in the Catalogue; creates, renames, deletes Projects, chooses
  Template and surfaces, activates the Application, requests Deployment Packages;
- kiosk operator: surface configuration and package download.

Information architecture (`12` §3): a Project picker popover outside any Project, and the Project
workspace with Dashboard; Content (Places, Points of Interest, Routes, Guides, Events, Categories,
Maps & Floor Plans); Media; Visitor app (Overview, Pages, Navigation, App settings, Translations,
Preview, Launch); Project (Audit log). CMS steps C0–C6 follow the backend milestones (`08` §Companion
repositories).

## 2. Authority and reading order

Rules, identical to the backend's (`../uniche_iguide_backend/AGENTS.md` §2):

- specs win over code; code that contradicts a spec is a GAPS.md entry;
- statement status follows `STATUS.md`; `[ARC_x.y]` statements are D4.3 obligations;
- the specs are read-only from this repository; proposed changes are QUESTIONS.md
  `spec-change-request`s; a spec edit happens only on explicit owner instruction and is recorded in
  DECISIONS.md;
- a stated interpretation that lets work proceed is a DECISIONS.md `spec-interpretation`;
- a change touching a specs `CLAUDE.md` invariant or an `[ARC_x.y]` statement stops for owner approval;
- code resting on a working assumption names it in DECISIONS.md;
- the prototype `iGuide CMS.html` is part of the spec: `12` and `14` win on behavior, data, and flows; the
  prototype governs visual design, layout, and screen composition where the text is silent (DECISIONS.md
  D-004). Spec vocabulary (actions, codes, enums) is canonical over the prototype's (`source-notes`);
- the backend is read, never edited, from a frontend session. IDs are per repository; a cross-repository
  reference names the repo ("backend D-004", "backend G-012").

Session reading order: this file; PLAN.md and the `Now` item's spec references (`12` subsections first);
the GAPS, QUESTIONS, and DECISIONS entries it touches; the backend's PLAN.md and TRACEABILITY.md for the
milestone it depends on; then specs as cited.

## 3. Specs baseline

```text
baseline  a792ede3086068f24ffb2c07f608215bee4ec516  (2026-10-02 15:36 +0300)
```

Moved on 2026-10-02 from `1c982b6` to the commit holding the owner-instructed edits (DECISIONS.md D-013,
backend D-016).

Every session starts with:

```bash
git -C ../uniche_iguide_specs log --oneline a792ede3086068f24ffb2c07f608215bee4ec516..HEAD
git -C ../uniche_iguide_specs status --short
```

If either prints anything: read the diff, update PLAN.md, QUESTIONS.md, GAPS.md, and TRACEABILITY.md,
and move the baseline here with a DECISIONS.md entry.

## 4. Non-negotiable constraints

1. Keycloak authenticates, the Catalogue authorizes. `GET /me/authorization` only decides what is shown;
   it is loaded once per session and again after any `403`, and never authorizes anything. The backend
   checks access on every request — `02` §2, §10, specs `CLAUDE.md` inv. 3 [ARC_7.5].
2. Token handling: Authorization Code + PKCE `S256` with `check-sso` against the shared realm; tokens in
   memory only, never in browser storage; silent refresh before expiry; on `401` one forced refresh and one
   retry, then login; the user never sees a `401`; a token without audience `uniche-platform` stops with a
   configuration message — `02` §1, `07` §15, `12` §6.
3. The CMS talks only to the authoring API and Keycloak. It never calls the Catalogue, VIBE, or the AI
   gateway directly — `07` §2, `12` §7.
4. The API client is generated from the backend's committed OpenAPI contract. No new hand-written request
   or response types; generated code is never edited by hand (§7).
5. Errors are RFC 7807 problem details matched on `code`; field errors are shown at their `path` and
   summarized at the top of the form; `requestId` is shown on every error state; the rejected value is
   never echoed — `07` §15, `12` §5, §6, `14` §4 [ARC_7.9].
6. Lifecycle vocabulary: `DRAFT`, `ACTIVE`, `ARCHIVED`; `ACTIVE` is never called "published". An `ACTIVE`
   Resource is edited only through its Working Copy (save, apply, discard); transitions follow `03` §1 —
   specs `CLAUDE.md` inv. 9, `12` §4.
7. WCAG 2.1 AA is a gate: keyboard operable, screen-reader readable, 200 percent text scaling, a keyboard
   alternative for every reorder, state never by colour alone, labelled preview frame — `14` §1, §4
   [ARC_4.3].
8. No production default in runtime configuration: values come from `public/config.js`
   (`window.__UNICHE_CONFIG__`) or `VITE_*`; a missing value stops the CMS with a configuration error —
   specs `CLAUDE.md` inv. 17.
9. The CMS stores and sends no visitor analytics; preview sends no VIBE event — inv. 8, `05` §7, `13` §9.
10. Preview is the runtime reading `GET /runtime/v1/projects/{id}/manifest?preview=true` with the author's
    token, never cached, never shareable — `02` §13, `11` §2, `12` §3.
11. Unsaved form state is kept per Resource in browser storage and never sent before the author saves —
    `12` §5.

## 5. Architecture and stack

Found in the code (DECISIONS.md D-006, D-007):

- Vue 3.5 with `<script setup>`, TypeScript 6, Vite 8 (dev server fixed on port `5173`), vue-router 4;
- pnpm 9 with `pnpm-lock.yaml` as the only authoritative lockfile;
- Tailwind 3 with shadcn-vue conventions (`components.json`, radix-vue, class-variance-authority,
  tailwind-merge, lucide icons); palette as CSS variables in `src/style.css`;
- state: Vue `reactive` stores in `src/stores` and composables in `src/workspace`; no Pinia;
- `src/platform/`: `auth.ts` (keycloak-js), `config.ts` (runtime config), `api.ts` (fetch and XHR upload
  with bearer and `401` retry), and hand-written resource modules (GAPS.md G-001);
- Leaflet 1.9 with public OpenStreetMap tiles and Nominatim search, prototyping only (`09` §22);
- `dev/`: optional local Keycloak, Catalogue mock, and S3 mock (DECISIONS.md D-010).

Platform coordinates (verified 2026-10-02, backend D-008):

```text
Keycloak       https://idp.uniche-eccch.eu, realm uniche, client iguide-web (public, PKCE S256)
               redirect http://localhost:5173/*, web origin http://localhost:5173
Backend API    http://localhost:8080/iguide/api/v1   (dev box)
```

Layer sections are added below as slices land: session and API client, error states, editors, preview.

## 6. CMS design direction from the prototype

Inventory of `../uniche_iguide_specs/iGuide CMS.html` taken 2026-10-02 (1440 by 900). Rules a slice
applies where `12` is silent:

- typography: Montserrat for all UI text; monospace for slugs, codes, readiness `path` and `code`, and
  request ids; page titles bold around 24px; section labels small, uppercase, letter-spaced, grey;
- colour: canvas `#f3f4f6`, cards white with a `#e5e7eb` border, text `#030712`, muted `#6b7280`, UNICHE
  purple `#4c1d8b` for links, active navigation, and secondary buttons; destructive and blocking in
  crimson (`#c0185e`); pending changes in amber; status chips as pills with a dot (`ACTIVE` green, `DRAFT`
  grey, `ARCHIVED` grey, `LIVE` green, `SETUP` amber);
- layout: a fixed header (UNICHE wordmark, "IGUIDE CMS", Project switcher card with organization,
  Template, and status, then "Manage members ↗", Help, avatar with short name); a left sidebar with
  group labels (Content, Visitor app, Project), item counts right-aligned, "OFF" chips for disabled
  capabilities, the active item tinted with a left bar; content area with page title, one-line subtitle,
  and the page's primary action top right;
- controls: pill buttons, uppercase and letter-spaced; the page's primary action is the gradient pill
  (stops darkened to pass 4.5:1 with white text, DECISIONS.md D-012), secondary actions solid purple pills, destructive actions crimson
  text or outline; filter chips (`All`, `DRAFT`, `ACTIVE`, `ARCHIVED`) beside a search field that searches
  titles in all languages;
- lists: a white card holding a table with uppercase column heads (Title, Status, Translations,
  Actions); the title in purple with slug and timestamp beneath and trigger chips; translation dots per
  language, filled or hollow, with the language code as text;
- editors: back link to the list, title with status and pending chips, a meta line (kind, slug, version);
  the Working Copy banner (amber, "You are editing a working copy", Save draft, Discard changes) under the
  header; a main column of cards (language tabs, Placement, How visitors reach it, Media slots, Practical
  details collapsed with a filled count, Common fields) and a right column (Preview in app, Status and
  visibility, Translations, Used in);
- dashboard: one status card with a coloured left edge, then "Waiting for you to apply", content counts,
  translation bars per language, and the latest packages.

How to open it: in a browser at `file://…/uniche_iguide_specs/iGuide%20CMS.html`; it needs JavaScript and
takes a few seconds to unpack. Do not read the file as text (4 MB). For screenshots in a session, install
`playwright-core` in a scratch directory and launch a local Chromium against the file.

## 7. API contract

- the backend's committed `../uniche_iguide_backend/openapi/openapi.yaml` is the authority (backend D-004);
- this repository keeps a copy at `api/openapi.yaml` with `api/SOURCE` recording the backend commit it
  came from;
- one command, `make api-sync`, copies the file from `../uniche_iguide_backend`, records the commit, and
  regenerates the typed client into `src/api/generated/`;
- the generator is openapi-typescript (types) with openapi-fetch (client), whose middleware carries the
  bearer token, the `401` retry, and problem-details parsing from `src/platform` (DECISIONS.md D-005);
- CI regenerates from the copy and fails when `src/api/generated/` differs;
- generated code is never edited by hand;
- the existing hand-written types in `src/platform/*.ts` are a gap to replace (GAPS.md G-001), not a pattern
  to extend.

Status: the backend has no committed contract yet (backend G-004), so nothing here exists (GAPS.md G-002).

## 8. Accessibility

WCAG 2.1 AA per `14` §1 and the CMS requirements of `14` §4. Every slice that adds or changes a screen
adds an automated check (Playwright with axe-core) for that screen in its states, plus keyboard-only
checks for its interactions. Status: no automated check exists (GAPS.md G-012).

## 9. Cross-repository changes

A contract change lands in the backend first (its own slice and OpenAPI file), then a later frontend
slice runs `make api-sync` and adapts. Never edit the backend from a frontend session; record what the CMS
needs as a GAPS.md entry that names the backend item.

## 10. Commands

Only commands that ran on 2026-10-02. Prerequisites: Node 22 (22.12 verified), pnpm 9 (9.15.9 verified).

| Command | Result |
|---|---|
| `make setup` (`pnpm install --frozen-lockfile`) | about 2 s |
| `make typecheck` (`pnpm exec vue-tsc -b`) | passes, about 6 s |
| `make build` (`pnpm run build`) | passes, about 10 s, output in `dist/` |
| `make dev` (`pnpm dev`) | serves `http://localhost:5173` |

`npm ci` fails: `package-lock.json` is out of sync (GAPS.md G-010). Not available yet: lint (G-011),
accessibility checks (G-012), tests (G-013), CI (G-014), `api-sync` (G-002), and a container image (G-015).

## 11. Working method and definition of done

Same as the backend's AGENTS.md §7, adapted:

- one PLAN.md `Now` item at a time, as the smallest vertical slice;
- the specs `decision-template.md` is the task packet;
- tests in the same change: unit tests for logic, a Playwright test per screen state touched, and the axe
  check;
- never weaken, skip, or silently retry a test;
- file presence is never completion: a step is done when its screens of `12` exist against the real
  backend and pass the checks of `14` (`08` §Companion repositories), with evidence in TRACEABILITY.md.

## 12. Living documents

Same rules as the backend's AGENTS.md §9: PLAN.md (`Now` 1–3 items and `Next`, under 100 lines, never
history), DECISIONS.md (append-only `D-NNN`), GAPS.md (`G-NNN`, never reused), QUESTIONS.md (Blocking and
Open, resolved only by a DECISIONS.md entry), TRACEABILITY.md (status only from passing runs),
QUICKSTART.md, SESSION_BOOTSTRAP_PROMPT.md. Before a session ends, PLAN.md, GAPS.md, and TRACEABILITY.md
are truthful.

<!-- Layer sections are appended below as slices land. -->
