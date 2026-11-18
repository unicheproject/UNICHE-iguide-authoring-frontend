# Round 1 — implementation agent brief (shared by all Wave 1 packages)

Repo root (FE): `/mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend`.

## Read first
1. `ux-audit/BRIEF.md` — hard constraints are binding (tokens in memory, API client unchanged, RFC 7807 with
   requestId, DRAFT/ACTIVE/ARCHIVED never "published", WCAG 2.1 AA gate, no spec changes, no commits, no installs).
2. `AGENTS.md` §4, `PRODUCT.md`.
3. `ux-audit/round-1/plan/plan.md`: §0–§2 (direction and patterns), §3 (your D-entries), §5 (your package),
   §6 (contracts, definition of done), §9 (file ownership), **§10 (binding amendments)**.
4. `ux-audit/round-1/implementation/system.md` (tokens, `ui/` primitives, shell, list scaffold — use them; never
   re-create local copies of buttons, chips, fields, tables) and the W0 changes files in
   `ux-audit/round-1/implementation/W0.1/`, `W0.3/` (and `W0.2/` once it exists).
5. Your findings in `ux-audit/round-1/audit/consolidated.md` (IDs listed in your package) and the original
   agent reports they cite, for evidence. Never open `iGuide CMS.html`.
6. Load the `impeccable` skill. Read `reference/craft-floor.md` immediately before your first edit, and
   `reference/operate.md`; use its commands (`layout`, `typeset`, `clarify`, `harden`, `adapt`, `onboard`,
   `distill`, `polish`; `animate` only restrained, respecting reduced motion) as the work needs. Skip its
   interview steps (this brief answers them).

## Rules
- Edit **only the files your package owns** (plan §9). Need a change elsewhere? Write it to
  `ux-audit/round-1/implementation/requests.md` (append with `cat >> … <<'EOF'`, name the file, the change and
  why) and work around it; do not edit the file.
- TypeScript strict, never `any`, fail early on invalid conditions, JSDoc on exported
  functions/components/composables, Vue 3 `<script setup>`, Tailwind + shadcn-vue conventions, lucide icons.
- No new API types by hand; keep behaviour and API usage intact unless the plan says otherwise.
- Append your reserved D-entries (plan §3) to `DECISIONS.md` with one `cat >> DECISIONS.md <<'EOF'` each,
  matching the existing entry format. Spec ideas that need a spec change are not built: append to
  `QUESTIONS.md` as `spec-change-request` (next free Q id after Q-016 — check the file first).
- Never commit. Never run pnpm/npm installs. Do not start or stop dev servers: a Vite dev server already runs on
  Windows at http://localhost:5173 with hot reload.
- Mutate only records you create, named `UX-<package> …`, in `UX Audit – Populated` (or the empty Project
  your package names). Never delete/apply/archive pre-existing records.

## Verify by looking (required)
- Typecheck: `cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node node_modules\vue-tsc\bin\vue-tsc.js --noEmit -p tsconfig.app.json"` must pass. (There is no `make`/`vp` here.)
  Other agents edit other files in parallel: if an error is in a file you do not own, note it and move on.
- Screenshots with Windows Node and `ux-audit/tools/session.mjs` (see BRIEF "Tools and environment") into
  `ux-audit/round-1/implementation/<package>/after/`: every screen you changed at 1440, 1024, 768 and zoom200, in
  the states you changed (empty, populated, loading, error, long text, Greek, keyboard focus), plus forced-colors
  for the principal state. Read them, compare with `ux-audit/round-0/shots/` (see `INDEX.md`), fix before
  reporting. Keyboard run of your flows. axe (`@axe-core/playwright`) on your screens: no serious/critical.
- Update e2e specs whose selectors your markup changes (never weaken or delete); they cannot run here — say so.
- Run `/home/mirto/.claude/skills/impeccable/scripts/impeccable detect --json <your changed files>` once at the end.

## Report
`ux-audit/round-1/implementation/<package>/changes.md`: consolidated IDs fixed (and partially), files changed,
D/Q entries added, acceptance results with numbers, deferred items and why, notes for other packages. If the
Write tool refuses a file under `ux-audit/`, return its content in your reply instead. Final reply ≤ 12 lines.

## Test data
`ux-audit/tools/seed.json`. Populated `6958c18f-60d2-4140-a524-5a43f8a2f6b5`. Never-touched empty Project
**`UX Audit – Empty C` `ceee1b24-e7c4-474e-93ba-f77067ed8a72`** (only P2 may add content to it, and only at the
end of its checks). `UX Audit – Empty` and `Empty B` hold a few agent records.
