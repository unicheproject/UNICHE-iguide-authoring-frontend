# Round 3 — implementation agent brief (shared by all packages)

Repo root (FE): `/mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend`.

Round 3 is the last round. Its implementation emphasis is **polish of every remaining P1–P3**, then `DESIGN.md`
and a final cleanup. Mode Operate: refine, do not redirect.

## Read first
1. `ux-audit/BRIEF.md`. Its hard constraints are binding:
   - tokens stay in memory;
   - the API client is unchanged;
   - errors are RFC 7807 with requestId;
   - DRAFT/ACTIVE/ARCHIVED, never "published";
   - WCAG 2.1 AA is a gate;
   - no spec changes, no commits, no installs.
2. `AGENTS.md` §4 and `PRODUCT.md`.
3. `ux-audit/round-3/plan/plan.md`. You need:
   - the direction refinements and your D-entries;
   - your package (files owned, C3 ids, acceptance);
   - the execution protocol;
   - the file-ownership table;
   - any "Orchestrator review" section, which is binding.
4. The design system as built: `ux-audit/round-1/implementation/system.md` and
   `ux-audit/round-2/implementation/system.md`, plus the Wave 0 `changes.md` files in
   `ux-audit/round-3/implementation/W0-*/` once they exist. Use the primitives; never re-create local copies of
   buttons, chips, fields, tables.
5. Your findings in `ux-audit/round-3/audit/consolidated.md` (`C3-nn` ids). Read the original round-3 reports they
   cite for evidence, measurements and repro steps; they are in `ux-audit/round-3/audit/<agent>/`. Never open
   `iGuide CMS.html`.
6. Load the `impeccable` skill. Read `reference/craft-floor.md` immediately before your first edit, and also
   `reference/polish.md` and `reference/operate.md`. Use its commands as the work needs (`polish`, `harden`,
   `clarify`, `layout`, `typeset`, `adapt`; `animate` only restrained and respecting reduced motion). Skip its
   interview steps: this brief answers them.

## Rules
- **File ownership:** edit **only the files your package owns** (plan file-ownership table). If you need a change
  elsewhere, append it to `ux-audit/round-3/implementation/requests.md` with `cat >> … <<'EOF'`, naming the file,
  the change and why. Work around it; do not edit the file.
- **Code style:**
  - TypeScript strict, never `any`;
  - fail early on invalid conditions;
  - JSDoc on exported functions, components and composables;
  - Vue 3 `<script setup>`, Tailwind + shadcn-vue conventions, lucide icons;
  - tokens only: no `text-[Npx]`, hex, `z-[N]` or `shadow-[`.
- **API:** no new API types by hand. Keep behaviour and API usage intact unless the plan says otherwise.
- **DECISIONS.md:** append your reserved D-entries (plan) with one `cat >> DECISIONS.md <<'EOF'` each, matching
  the existing format.
- **QUESTIONS.md and GAPS.md:** a spec change is not built. Write it as a `spec-change-request` in `QUESTIONS.md`
  (use the Q id the plan reserves, or check the file for the next free one). Backend needs go to `GAPS.md` the
  same way.
- **Off limits:** never commit, never install, never start or stop dev servers. A Vite dev server already runs on
  Windows at http://localhost:5173 with hot reload.
- **Records:** mutate only records you create, named `UX-R3-<package> …`, in `UX Audit – Populated`. Never delete,
  apply or archive pre-existing records. Do not create Projects.

## Verify by looking (required)
- **Typecheck:** `cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node node_modules\vue-tsc\bin\vue-tsc.js --noEmit -p tsconfig.app.json"`
  must pass. Also run `node scripts\check-css-tokens.mjs` the same way. There is no `make` or `vp` here. Other
  agents edit other files in parallel: if an error is in a file you do not own, note it and move on.
- **Screenshots:** take them with Windows Node and `ux-audit/tools/session.mjs` (account **`admin`**) into
  `ux-audit/round-3/implementation/<package>/after/`.
  - Cover every screen you changed at 1440, 1024, 768 and zoom200, in the states you changed: empty, populated,
    loading, error, long Greek text, keyboard focus.
  - Add forced colours for the principal state.
  - Read the shots, compare them with the round-3 audit shots of the same state, and fix before reporting.
- **Measure what the finding measured:** the same `getBoundingClientRect`, contrast, `document.activeElement` or
  announcement check, with before and after numbers.
- **Keyboard and axe:** do a keyboard run of your flows. Run axe (`@axe-core/playwright`, wcag2a/aa and 21a/aa) on
  your screens; there must be no serious or critical violations.
- **e2e specs:** update specs whose selectors your markup changes; never weaken or delete them. They cannot run
  here; say so.
- **Detector:** run `/home/mirto/.claude/skills/impeccable/scripts/impeccable detect --json <your changed files>`
  once at the end.

## Report
The Write tool refuses `.md` report files for subagents in this environment.
- **Your report:** return `changes.md` in your final reply between `===== BEGIN changes.md =====` and
  `===== END changes.md =====`. The orchestrator saves it to `ux-audit/round-3/implementation/<package>/changes.md`.
- **Contents:** C3 ids fixed (and partly), files changed, D/Q/G entries added, acceptance results with numbers,
  deferred items and why, notes for other packages.
- **After the markers:** at most 12 lines.

## Test data
- **Projects:**
  - Populated `6958c18f-60d2-4140-a524-5a43f8a2f6b5`: contains many `UX-R2-…` and `UX-R3-…` records and some
    duplicate seed records.
  - Empty D `f56e8c75-94af-4c87-88c8-06cba46240a1`: one DRAFT Place and one DRAFT POI.
  - Empty B `1d6971ce-6391-4da8-848e-8d7466d25128`: drafts only.
  - `UX-R3-p2 Trail` `600c4311-3e81-4235-91b0-5b3e336918fc`: new, one DRAFT Place and one DRAFT POI.
- **Pristine-empty state:** use `page.route` with `totalElements: 0` in the real response shape.
