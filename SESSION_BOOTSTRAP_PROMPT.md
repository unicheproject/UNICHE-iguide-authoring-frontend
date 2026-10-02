# Session bootstrap prompts

Paste one of these to start a session in `uniche_iguide_frontend`.

## 1. Implement the current `Now` item

```text
Work in uniche_iguide_frontend. Read AGENTS.md, then PLAN.md.
First run the specs baseline check of AGENTS.md §3; if it prints anything, update PLAN, QUESTIONS, GAPS,
and TRACEABILITY and move the baseline with a DECISIONS entry before anything else.
Check the backend dependency of the item in ../uniche_iguide_backend/PLAN.md and TRACEABILITY.md; if it is
not done, stop and say so. Then implement the first unfinished PLAN.md `Now` item as one vertical slice:
fill the specs decision-template.md in your plan, use plan mode, follow 12 and 14 for behavior and the
prototype (AGENTS.md §6) for visuals, write the tests with the code (Playwright per screen state, axe),
and meet every acceptance criterion against the real backend with `make typecheck` and `make build` green.
Never edit the backend or the specs. Record decisions, gaps, questions, and dated evidence in the living
documents and leave PLAN.md truthful. Do not commit unless I ask.
```

## 2. Bounded review of a finished slice

```text
Work in uniche_iguide_frontend. Read AGENTS.md. Review the slice <TASK-ID> (diff: <commit range or
working tree>) against its PLAN.md acceptance criteria and the 12 and 14 sections it cites. Change
nothing; report findings with file:line and the spec section, in four separate passes:
1. correctness against 12 and the acceptance criteria, including lifecycle vocabulary and Working Copy
   behavior;
2. Project isolation and security: no authorization decision from local data or token claims, the
   Catalogue denial states (404, 403), tokens only in memory, single 401 retry, no Catalogue calls from
   the browser, no rejected values or secrets shown or logged;
3. tests and accessibility: every criterion has a test that would fail without the change; axe and
   keyboard checks for every screen state touched; no weakened, skipped, or retried test;
4. API contract: only the generated client is used, api/SOURCE matches the backend commit, no
   hand-written request or response types added.
End with a verdict per pass and the GAPS.md entries the review would add.
```

## 3. Prepare the questions blocking a CMS step

```text
Work in uniche_iguide_frontend. Read AGENTS.md, QUESTIONS.md, PLAN.md, and the backend's PLAN.md. For
CMS step <ID>, list every QUESTIONS.md entry, every 09-open-decisions.md item, every prototype conflict,
and every backend item that blocks or shapes it. For each, give the plausible answers, their
consequences for screens, API, and accessibility, and a recommendation with spec citations; draft any
spec-change-request text. Implement nothing and edit no file other than QUESTIONS.md.
```
