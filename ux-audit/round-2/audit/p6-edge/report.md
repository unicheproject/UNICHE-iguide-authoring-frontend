# p6-edge — Round 2
(Written by the orchestrator from the agent's returned summary: the agent reported a written report.md, but no file
exists. Evidence: 113 shots in shots/, scripts a1–a36.mjs in this folder. Details beyond this summary are in the shots.)

Persona: error and edge-case tester ("hostile day"), own `UX-R2-p6 …` records (POI Beta ARCHIVED, POI Gamma and the Route ACTIVE).

## Verdict
Round 1 fixed most hostile-day behaviours: silent 401 retry, session-ended dialog, per-field 409 on Save and Apply, 422 at
field plus summary, leave guard, offline disabling, no double submits, upload hold/duplicate/cancel/retry, Undo and
coordinate handling all hold up. Range 74–80 (capped by open P1s). P0 0, P1 2, P2 8, P3 10. C1: fixed 12, partly 9,
not fixed 1 (C1-65), regressed 0, not tested 2 (C1-64, C1-68).

## Findings
- **R2-p6-01 P1 403/404/500 on Save still reads "The X was not saved" + the server's own sentence;** no cause, no action, no full-page state; identical across editor kinds; echoes server `detail` verbatim incl. any rejected value. (→ C2-09, C2-10)
- **R2-p6-02 P1 One failed `/languages` request silently turns every list into "Add a language first"** ("New" disabled, rows show slugs, no error, no retry). (new → C2-46 family)
- **R2-p6-03 P2 Collection conflicts compare counts only** ("3 items / 2 items"). (→ C2-62)
- **R2-p6-04 P2 Apply after the Working Copy was already applied elsewhere** (real case): headline "changes were not applied: visitors would meet a problem" with "no pending changes"; editor stays stale with "Pending changes" and an enabled Apply; no reload prompt. (→ C2-56/C2-62)
- **R2-p6-05 P2 Garbled "Remove it from it first" reason on referenced items.** (→ C2-59)
- **R2-p6-06 P2 Upload dialog squeezes the file list.** (→ C2-79)
- **R2-p6-07 P2 Upload and Describe-now errors show raw server text.** (→ C2-09)
- **R2-p6-08 P2 Offline banner claims "offline" while the browser is online and stays after recovery.** (→ C2-11)
- **R2-p6-09 P2 Activate has no in-flight state; its failures appear as a toast outside the dialog.** (→ C2-35)
- **R2-p6-10 P2 Record 403/500 load errors show raw detail and leave focus on body.** (→ C2-09, C2-13)
- **R2-p6-11…20 P3** ten small items (see shots; not itemised in the returned summary).

## Scores
Error and edge-case states 74–80 (persona job success: most hostile-day jobs succeed; save-error recovery and the
`/languages` failure do not).
