# Round 1 — audit agent brief (shared by all audit agents)

Repo root (FE): `/mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend`.

1. Read `ux-audit/BRIEF.md` in full (scope, domain, hard constraints, tools, scoring). Then read the spec
   files it lists (12, 14 §4, 03 §1), `PRODUCT.md`, and grep `DECISIONS.md` for your screens. **Never open
   `iGuide CMS.html`.**
2. Load the `impeccable` skill (Skill tool, skill "impeccable"); read its `reference/critique.md` and
   `reference/audit.md` and `reference/operate.md` (under `/home/mirto/.claude/skills/impeccable/`). Mode for
   every screen is **Operate**. Skip its interview steps (you are a subagent; the brief answers them) and say
   so in one line of your report. You may run `/home/mirto/.claude/skills/impeccable/scripts/impeccable detect --json <files>`
   on source files of your screens.
3. **You audit only. Do not edit any file outside your own folder** `ux-audit/round-1/audit/<your-agent-id>/`
   (scripts, shots, report all go there). Never commit. Never run package installs.
4. "Making changes" means acting in the UI as a user would, on records **you create yourself**, named
   `UX-<your-agent-id> …`, in Project `UX Audit – Populated` (or `UX Audit – Empty` where the job is
   first-run; if you need to fill the Empty Project for a first-run job, keep what you create minimal and
   name it `UX-<agent-id> …`). Never delete, apply, archive or edit pre-existing records; never run
   destructive Project operations. For flows that need existing ACTIVE content, create and activate your own.
   Exception: you may *open* any record and *start* editing pre-existing records to observe states, as long
   as you discard/cancel without saving.
5. Exercise everything in your remit: every button, tab, menu, filter chip, sort, dialog (open, Esc, submit
   empty, invalid, valid), keyboard path (Tab order, focus ring, Enter/Space/Esc, arrows, reorder keyboard
   alternatives), hover/focus/active/disabled, long and Greek text, loading/empty/error states (use
   `page.route` to force `401/403/404/409/422/502/503/504`, `context.setOffline(true)`, slow responses),
   back/forward/reload, deep links, text zoom (`zoom200`). Use viewports from `session.mjs`.
6. Screenshot each distinct state to `ux-audit/round-1/audit/<agent>/shots/<screen>__<state>__<viewport>.png`
   and **look at them** (Read tool) before you judge. Keep screenshots purposeful (aim 30–80).
7. Write `ux-audit/round-1/audit/<agent>/report.md` following `ux-audit/REPORT-TEMPLATE.md` exactly. Score
   strictly with the caps. Findings need evidence (screenshot path or reproduction steps). Be exhaustive and
   nit-picky; drastic recommendations are welcome when they make the tool easier to use.
8. Your final reply to the orchestrator: ≤ 15 lines — verdict, score range, count of P0/P1/P2/P3, the 3 worst
   problems in one line each, report path.

Data: `ux-audit/tools/seed.json` (Project ids: Populated `6958c18f-60d2-4140-a524-5a43f8a2f6b5`, Empty
`65f8958a-144a-46fe-851b-f1176b2a597e`). Routes: `src/router.ts`, menu: `src/workspace/sections.ts`.
Several agents run concurrently against one dev server and one IdP: keep one browser at a time per agent and
close it when done. If the saved session expired, run `node ux-audit\tools\session.mjs curator` (Windows Node).

**Update:** `UX Audit – Empty` now contains a few `UX-p2-manager` records. For first-run / empty states use
**`UX Audit – Empty B`** (`1d6971ce-6391-4da8-848e-8d7466d25128`), and do not add content to it unless your brief
says so. The Populated Project now has a WEB public base URL, so QR codes render.
