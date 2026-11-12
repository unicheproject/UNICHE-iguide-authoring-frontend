# End-to-end tests

Playwright with axe-core against a running stack (AGENTS.md §8, §11). Each test file creates and initializes a
Project of its own through the backend API, so the tests do not depend on what the stack already holds; the
Catalogue stand-in forgets those Projects when it restarts.

## What they cover

| File | Checks |
|---|---|
| `content-lists.spec.ts` | the eight Content lists, empty: heading, axe and the gradient contrast check (D-053) on the list, axe on its create dialog, the dialog from the keyboard (focus inside, Escape closes, focus back on the button) |
| `place-editor.spec.ts` | a Place created through its dialog, saved as a DRAFT, activated, changed through pending changes, applied; axe on each state |
| `media.spec.ts` | a recording uploaded through the upload dialog shows its duration in the Asset editor (backend D-043, D-050) |
| `screens.spec.ts` | axe on the Project picker and on Overview, Languages, Surfaces, Translations, Preview, Navigation once loaded; axe on the loading state of every Content list and those five screens, with the backend's reads held back (D-052) |
| `navigation-editor.spec.ts` | the main menu built from the keyboard (heading, links moved under it, reordered), a label per language with the title fallback, the preview drawing the menu, a footer link, removal with confirmation; axe on each state (D-055) |
| `editor-preview.spec.ts` | "Preview in app" of an editor opens as a pop-up card below its button with the unsaved form, switches surface, passes axe, and returns focus on Escape and Close (D-056, D-059) |
| `guide-reference.spec.ts` | a Guide story references a Point of Interest through the shared Resource picker |
| `zoom-and-structure.spec.ts` | every Content list and editor at 200% zoom (700 × 450) and at 320 px: no sideways page scrolling, title and main action reachable; landmarks, one level-1 heading, no skipped level (D-054) |
| `place-map-link.spec.ts` | an ACTIVE map linked and unlinked from the Place editor, refused while it has pending changes (backend D-044, D-050) |

## Run

1. Start the stand-ins: `docker compose -f dev/docker-compose.yml up -d` (Keycloak, Catalogue, S3).
2. Start the backend against them (`dev/README.md`, "Point the backend at it").
3. Start the CMS with `VITE_IDP_URL=http://localhost:8180`: `pnpm dev`.
4. Once per machine: `pnpm exec playwright install chromium`.
5. `make e2e` (or `pnpm test:e2e`). The HTML report lands in `playwright-report/`.

Settings, all optional:

| Variable | Default |
|---|---|
| `CMS_URL` | `http://localhost:5173` |
| `API_URL` | `http://localhost:8080/iguide/api/v1` |
| `IDP_URL` | `http://localhost:8180` |
| `E2E_USER`, `E2E_PASSWORD` | `curator`, `curator` (the `dev/keycloak` test user) |
| `E2E_ORGANISATION` | the Museum of Cycladic Art of `dev/catalogue-mock/fixture.json` |

The tests never use the live UNICHE realm: they sign in with a password grant that only the local Keycloak allows.
