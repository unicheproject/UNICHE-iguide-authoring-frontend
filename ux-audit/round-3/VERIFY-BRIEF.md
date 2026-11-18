# Round 3 — final verification brief (shared by all verification agents)

Repo root (FE): `/mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend`.

Round 3's implementation is finished: Wave 0, Wave 1 and the cleanup. You are a **fresh verifier**. Your scores are
the **R3 column** of the scoreboard, the final measurement before the owner's review.

Three jobs, in this order:
1. **Check fixes.** For every `C3-nn` cluster in your remit, decide whether the round-3 fix holds. Mark each one
   `fixed`, `partly`, `not fixed` or `regressed`, with measured evidence.
2. **Hunt regressions.** Look for anything the round-3 changes broke: layout, focus, announcements, wording,
   consistency between screens.
3. **Score.** Score each scoreboard row in your remit with the rubric and caps in `ux-audit/BRIEF.md`:
   - an open P1 caps the screen at 85;
   - an open P0 caps it at 60;
   - 90+ needs screenshots of every state **and** a clean keyboard run;
   - 90+ means a design director would ship the screen unchanged. Do not inflate.

## Read first
1. **Brief and product:** `ux-audit/BRIEF.md` (hard constraints, rubric, caps) and `PRODUCT.md`. **Never open
   `iGuide CMS.html`.**
2. **Findings:** `ux-audit/round-3/audit/consolidated.md`, for the C3 clusters in your remit and their evidence.
   Read the original round-3 reports only for repro steps and before numbers.
3. **What changed:** `ux-audit/round-3/plan/plan.md` §1 and §9, and the change reports in
   `ux-audit/round-3/implementation/*/changes.md` (plus `addendum*.md`) for your screens.
4. **Scoreboard:** `ux-audit/scoreboard.md`, rows 1–41 and the R2 column.
5. **impeccable:** load the skill and read `reference/critique.md`, `reference/audit.md` and `reference/polish.md`.
   Mode Operate; skip the interview steps.

## Rules
- **Verify only.** Write only inside `ux-audit/round-3/verify/<your-agent-id>/`. Never edit source, never commit,
  never install, never start or stop servers. The dev server runs at http://localhost:5173.
- **Account and records:** use `admin` through `ux-audit/tools/session.mjs`. Mutate only records you create, named
  `UX-R3V-<agent-id> …`, in `UX Audit – Populated`. Never delete, apply or archive pre-existing records, and never
  create Projects.
- **Measure, don't eyeball:** use rects, computed styles, `document.activeElement`, live-region logs and axe
  (`@axe-core/playwright`, wcag2a/aa and 21a/aa). Force errors with `page.route` and RFC 7807 bodies. Put a canary
  `SECRET-SERVER-DETAIL` in `detail` and `title`: it must never appear on screen.
- **Viewports:** 1440, 1280, 1024, 768, zoom200, plus forced colours and reduced motion where relevant.
- **Screenshots:** save each distinct state to `ux-audit/round-3/verify/<agent>/shots/<screen>__<state>__<viewport>.png`
  and look at it before you judge.

## Report
The Write tool refuses `.md` report files for subagents here. Return `report.md` in your final reply between
`===== BEGIN report.md =====` and `===== END report.md =====`.

Sections:
1. **Verdict.**
2. **Scores.** A table with one row per scoreboard row in your remit: row #, screen, the six rubric parts, total,
   cap applied, evidence for 90+.
3. **C3 verification.** A table: every C3 id in your remit → status → evidence.
4. **Regressions and new findings.** Use ids `R3V-<agent>-nn` with severity P0–P3, screen, viewport, evidence,
   repro and likely file.
5. **Job walk** (persona agents only).
6. **Not verified.**

After the markers, at most 10 lines: score range, how many rows reach 90+, open P0/P1, the worst three problems.

## Data
- Populated `6958c18f-60d2-4140-a524-5a43f8a2f6b5`.
- Empty B `1d6971ce-6391-4da8-848e-8d7466d25128`.
- `UX-R3-p2 Trail` `600c4311-3e81-4235-91b0-5b3e336918fc`.
- Empty D `f56e8c75-94af-4c87-88c8-06cba46240a1`.
- **Pristine-empty state:** mock it with `page.route` (`totalElements: 0`).
- **Concurrency:** several agents share one dev server and one identity provider. Use one browser at a time.
