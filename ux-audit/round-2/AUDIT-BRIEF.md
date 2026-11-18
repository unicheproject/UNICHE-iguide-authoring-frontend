# Round 2 — audit agent brief (shared by all audit agents)

Repo root (FE): `/mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend`.

Round 1 redesigned the CMS. Round 2 **verifies every round-1 fix in your remit first**, then walks the new design as
a fresh user and hunts for regressions, inconsistencies *between* redesigned screens, and issues the redesign
introduced. Emphasis: consistency, interaction details, states (loading, empty, error, conflict), keyboard and
screen-reader behaviour, microcopy, density, motion. Vary data states and viewports from round 1.

## Read first
1. `ux-audit/BRIEF.md` in full (scope, domain, hard constraints, tools, scoring and caps), the specs it lists
   (`12`, `14` §4, `03` §1), `PRODUCT.md`, and grep `DECISIONS.md` (D-069 … D-085 are the round-1 design decisions).
   **Never open `iGuide CMS.html`.**
2. The changelog: `ux-audit/round-1/review/review-pack.md` (what changed, deferred items, known gaps) and the
   `changes.md` of the round-1 packages covering your screens (`ux-audit/round-1/implementation/<pkg>/changes.md`:
   W0.1 tokens/shell, W0.2 editor shell, W0.3 list scaffold, W0-fixup, P1 sign-in/picker/Create Project, P2
   Dashboard, P3a/P3b lists, P4 Place/POI editors, P5a Route/Guide, P5b Event/Category, P6 maps, P7 media, P8 preview)
   and `ux-audit/round-1/implementation/system.md` (the design system as built).
3. The prior findings for your remit: `ux-audit/round-1/audit/consolidated.md` (clusters and `C1-nn` IDs). Do not
   read the round-1 agents' reports — judge the new app with fresh eyes; use only the findings list to verify fixes.
4. Owner's comments so far: `ux-audit/user-comments.md`.
5. Load the `impeccable` skill and actually read `reference/critique.md`, `reference/audit.md`,
   `reference/operate.md` (under `/home/mirto/.claude/skills/impeccable/`); cite one rule from each in your report.
   Mode is **Operate**. Skip its interview steps (subagent); say so in one line.

## Rules
- **Audit only.** Write only inside `ux-audit/round-2/audit/<your-agent-id>/`. Never edit source, never commit,
  never install packages, never start/stop servers (a Vite dev server runs on Windows at http://localhost:5173).
- Act in the UI only on records **you create**, named `UX-R2-<agent-id> …`, in `UX Audit – Populated`. You may open
  and start editing anything, but cancel/discard without saving pre-existing records. Never delete, apply, archive
  pre-existing records; never run destructive Project operations; do not create Projects unless your brief says so
  (and never submit Create Project step 1 otherwise — it creates a real Project in the Catalogue).
- Exercise everything in your remit (every control, dialog: open/Esc/empty/invalid/valid; keyboard paths incl.
  arrow keys and reorder alternatives; hover/focus/active/disabled; long and Greek text; loading/empty/error states
  via `page.route` (401/403/404/409/422/5xx with RFC 7807 bodies incl. `requestId`), offline, slow network;
  back/forward/reload/deep links; `zoom200`; forced-colors; reduced motion). Viewports: 1440, 1280, 1024, 768, zoom200.
- Screenshot each distinct state to `ux-audit/round-2/audit/<agent>/shots/<screen>__<state>__<viewport>.png` and
  **look at them** (Read tool) before judging.

## Report
`ux-audit/round-2/audit/<agent>/report.md` following `ux-audit/REPORT-TEMPLATE.md`, with IDs `R2-<agent>-nn`, plus
a section **"Round-1 fixes verified"**: a table of every `C1-nn` in your remit → `fixed` / `partly` / `not fixed` /
`regressed`, with evidence. Score strictly with the caps (open P1 → max 85, open P0 → max 60; 90+ needs
screenshots of every state and a clean keyboard run). If the Write tool refuses `report.md`, return the full report
text in your final reply instead (clearly delimited). Final reply otherwise ≤ 15 lines: verdict, score range,
P0/P1/P2/P3 counts, C1 fixes verified (fixed/partly/not/regressed counts), the 3 worst problems, report path.

## Tools and data
- Windows Node for browser scripts: `cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node <script>"`.
  `ux-audit/tools/session.mjs`: `open(account, {viewport, touch, reducedMotion, forcedColors})`, `go(page, path)`
  (re-signs in automatically if the identity provider session ended), `bearer(page)`, `VIEWPORTS`, `CMS`, `API`.
  Accounts `curator` (authoring) and `admin` (Project creation/manager flows). axe via `@axe-core/playwright`
  resolved with `createRequire` from the repo `package.json`.
- Projects: **Populated** `6958c18f-60d2-4140-a524-5a43f8a2f6b5` (full content, many `UX-…` records from round 1),
  **Empty D** `f56e8c75-94af-4c87-88c8-06cba46240a1` (never touched — first-run; only the agent whose brief says so
  may add content, and only at the end), **Empty B** `1d6971ce-6391-4da8-848e-8d7466d25128` (DRAFT content only),
  Empty C `ceee1b24-e7c4-474e-93ba-f77067ed8a72` (one DRAFT Place). Ids: `ux-audit/tools/seed.json`.
- Several agents run concurrently against one dev server and one identity provider: one browser at a time per
  agent; close it when done.

**Update (2026-11-16):** the `curator` account lost Catalogue access to the audit Projects (404). Use the
**`admin`** account for all authoring work from now on (same full rights; `open("admin", …)`). Project ids are
unchanged. `UX Audit – Populated` received a few duplicate seed records during a re-seed; ignore them.
