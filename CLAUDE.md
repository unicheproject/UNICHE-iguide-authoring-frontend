# CLAUDE.md

Read `AGENTS.md` first. It is authoritative for this repository; this file only adds Claude Code
specifics.

- Use plan mode for any slice that touches more than a couple of files, routing, auth handling, or the
  API sync.
- Cite spec sections in plans and decisions as `NN` §N (for example `12` §3, `08` §Companion
  repositories). The specs live at `../uniche_iguide_specs`.
- Never edit `../uniche_iguide_specs` or `../uniche_iguide_backend`. Proposed spec changes go to
  `QUESTIONS.md` as `spec-change-request`; what the CMS needs from the backend goes to `GAPS.md`.
- Never commit unless asked. Commit messages carry no AI attribution: no `Co-Authored-By`, no
  "Generated with" lines.
- Commit title is `TASK-ID: outcome` (for example `C0a: dev-box sign-in against the live realm`),
  followed by a body grouped by area (auth, API, screens, tests, docs) and ending with a `Verification:`
  section listing the commands run and their results.
- Before ending a session, make `PLAN.md`, `GAPS.md`, and `TRACEABILITY.md` truthful.
