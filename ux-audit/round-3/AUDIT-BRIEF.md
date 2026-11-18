# Round 3 — audit agent brief (shared by all audit agents)

Repo root (FE): `/mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend`.

Round 3 is the last round, and its audit is **nit-and-grit**. First, **verify every round-2 fix in your remit**. Then
hunt the fine detail:
- **Visual:** pixel alignment, optical spacing, truncation and wrapping, focus rings.
- **Control states:** hover, active, disabled and loading on every control.
- **Motion:** animation timing and reduced motion.
- **Every** string, icon, tooltip/HelpHint, toast, empty state and error sentence.
- **Viewports and modes:** 200 % zoom, forced colours, long Greek and RTL text, and 768 px.

Persona agents then do a **full regression walk of their jobs end to end** (`BRIEF.md` / orchestration §4.2-A), with
a pass or fail per job. Scores are final-round scores: 90+ means a design director would ship the screen unchanged,
with every state screenshotted and a clean keyboard run as evidence.

## Read first
1. **Brief and specs:** read `ux-audit/BRIEF.md` in full. It covers scope, domain, hard constraints, tools, and
   scoring with caps. Also read the specs it lists (`12`, `14` §4, `03` §1) and `PRODUCT.md`. Grep `DECISIONS.md`:
   D-069 … D-085 are the round-1 decisions and D-086 … D-099 the round-2 ones. **Never open `iGuide CMS.html`.**
2. **The round-2 changelog:**
   - `ux-audit/round-2/review/review-pack.md`
   - the `changes.md` of the round-2 packages covering your screens
     (`ux-audit/round-2/implementation/<pkg>/changes.md`): W0-A foundations/errors/dates, W0-B sticky
     stacks/completeness, P1 chrome/session/picker/Create Project, P2 Dashboard, P3-core list core, P3a
     Places/POIs/Routes lists, P3b Guides/Events/Categories lists, P4 Place/POI editors, P4s editor shell, P5a
     Route/Guide, P5b Event/Category, P6 maps, P7a Media library/upload, P7b Asset editor/picker, P8 Preview,
     R2-fixup shared files
   - `ux-audit/round-2/implementation/verify.md` (open items R2-V-02/03/04/07)
   - `ux-audit/round-1/implementation/system.md` and `ux-audit/round-2/implementation/system.md` (the design system
     as built)
3. **Prior findings for your remit:** `ux-audit/round-2/audit/consolidated.md` (`C2-nn` IDs). Do not read the
   round-2 agents' reports. Judge with fresh eyes, and use the findings list only to verify fixes.
4. **Owner's comments:** `ux-audit/user-comments.md`. Round 2 was approved as is, and the owner asked for round 3.
5. **impeccable:** load the skill and read `reference/critique.md`, `reference/audit.md`, `reference/polish.md` (or
   the closest polish reference that exists) and `reference/operate.md`, under `/home/mirto/.claude/skills/impeccable/`.
   Cite one rule from each in your report. Mode is **Operate**. Skip its interview steps (you are a subagent) and
   say so in one line.

## Rules
- **Audit only.** Write only inside `ux-audit/round-3/audit/<your-agent-id>/`. Never edit source, never commit,
  never install packages, never start/stop servers. A Vite dev server runs on Windows at http://localhost:5173.
- **Records:** act in the UI only on records **you create**, named `UX-R3-<agent-id> …`, in
  `UX Audit – Populated`.
  - You may open and start editing anything, but cancel or discard without saving on pre-existing records.
  - Never delete, apply or archive pre-existing records, and never run destructive Project operations.
  - Do not create Projects unless your brief says so. Never submit Create Project step 1 otherwise: it creates a
    real Project in the Catalogue.
- **Exercise everything in your remit:**
  - every control in hover, focus, active, disabled and loading states;
  - every dialog: open, Esc, empty, invalid and valid;
  - keyboard paths, including arrow keys and reorder alternatives;
  - long and Greek text, and an RTL string;
  - loading, empty and error states via `page.route`: 401/403/404/409/422/5xx with RFC 7807 bodies including
    `requestId`, plus offline and slow network;
  - back, forward, reload and deep links;
  - `zoom200`, forced colours and reduced motion.

  Viewports: 1440, 1280, 1024, 768 and zoom200.
- **Nit-and-grit evidence:** measure, don't eyeball. Use `getBoundingClientRect` for alignment and spacing, computed
  styles for type/colour/contrast, and `document.getAnimations()` for motion. Use `scrollWidth > clientWidth` and
  `-webkit-line-clamp` for truncation. A nit needs a screenshot plus the measured value.
- **Screenshots:** save each distinct state to `ux-audit/round-3/audit/<agent>/shots/<screen>__<state>__<viewport>.png`.
  **Look at them** (Read tool) before judging.

## Report
Write `ux-audit/round-3/audit/<agent>/report.md` following `ux-audit/REPORT-TEMPLATE.md`, with IDs `R3-<agent>-nn`.
Add two sections:
- **"Round-2 fixes verified":** a table of every `C2-nn` in your remit (plus R2-V-02/03/04/07 where relevant) →
  `fixed` / `partly` / `not fixed` / `regressed`, with evidence.
- Persona agents only, **"Job walk":** each job → pass / partial / fail, with time and the step where it hesitated.

Score strictly with the caps: an open P1 caps a screen at 85, an open P0 at 60. 90+ needs screenshots of every
state and a clean keyboard run.

The Write tool refuses `report.md` for subagents in this environment, so do not try to write it. Instead, return the
full report in your final reply between the exact lines `===== BEGIN report.md =====` and `===== END report.md =====`.
The orchestrator saves it. Scripts, JSON and screenshots can still be written to your folder.
Otherwise keep the final reply to 15 lines or fewer:
- verdict;
- score range;
- P0/P1/P2/P3 counts;
- C2 fixes verified (fixed/partly/not/regressed counts);
- the 3 worst problems;
- the report path.

## Tools and data
- **Browser scripts:** run them with Windows Node:
  `cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node <script>"`.
  - `ux-audit/tools/session.mjs` provides `open(account, {viewport, touch, reducedMotion, forcedColors})`,
    `go(page, path)` (it re-signs in automatically if the identity provider session ended), `bearer(page)`,
    `VIEWPORTS`, `CMS` and `API`.
  - Use the **`admin`** account for everything. `curator` has lost Catalogue access to the audit Projects.
  - Resolve axe via `@axe-core/playwright` with `createRequire` from the repo `package.json`.
- **Projects** (ids also in `ux-audit/tools/seed.json`):

  | Project | Id | Content |
  |---|---|---|
  | **Populated** | `6958c18f-60d2-4140-a524-5a43f8a2f6b5` | full content, plus many `UX-…` records from rounds 1-2, some duplicate seed records (ignore them) |
  | **Empty D** | `f56e8c75-94af-4c87-88c8-06cba46240a1` | one DRAFT Place and one DRAFT POI; simulate a pristine Project with `page.route` (`totalElements: 0`, real response shapes) |
  | **Empty B** | `1d6971ce-6391-4da8-848e-8d7466d25128` | DRAFT content only |
  | **Empty C** | `ceee1b24-e7c4-474e-93ba-f77067ed8a72` | one DRAFT Place |
- **Concurrency:** several agents run at once against one dev server and one identity provider. Use one browser at a
  time per agent, and close it when done.
