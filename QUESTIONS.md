# QUESTIONS

An entry is resolved only by a DECISIONS.md entry that names it; it is then marked `Resolved by D-NNN` and
stays. Kinds: `question`, `spec-change-request`. `09` items are cited, not copied.

## Blocking

None. Backend dependencies are tracked in PLAN.md and the backend's PLAN.md.

## Open

### Q-001 — Default sort of Categories

- Kind: spec-change-request
- Source: `12` §3 Content library sorts "by `sortOrder` for Places, Points of Interest, Routes, Guides, and
  Events, and by `updatedAt` elsewhere" (Categories by `updatedAt`, as the prototype's "Sorted by last
  update"); `06` §16 sorts "Places, Points of Interest, Routes, Guides, Events, Categories, and Pages" by
  `sortOrder asc`; `07` §14 lists Places, POIs, Routes, Guides, and Events only.
- Proposed text: one list in all three places. Recommendation: Categories by `sortOrder`, because the
  author's order is what the visitor filter shows (`03` §10), and `07` §14 aligned with `06` §16.
- Consequence: shapes the Categories list in C3 and the backend default sort in Milestone 4.
- Resolved by D-011 (2026-10-02): `sortOrder`; `12` §3 and `07` §14 aligned with `06` §16.

### Q-002 — Contrast of the gradient primary action

- Kind: question
- Source: prototype primary action (white uppercase text on a pink-to-cyan gradient); `14` §1 and WCAG 2.1
  AA 1.4.3 (4.5:1 for text of this size).
- Question: keep the gradient with a darker end stop or a text treatment that passes 4.5:1 over its
  lightest point, or use the solid purple pill for primary actions?
- Consequence: the colour of every primary action; the axe check in C0c fails a non-conformant gradient.
- Resolved by D-012 (2026-10-02).

### Q-003 — Production tiles and geocoding

- Kind: question
- Source: `09` §22; GAPS.md G-016.
- Consequence: the map editors of C3 and the "New map" search.
- Assumption taken: public services during development only.

### Q-004 — Staging and production origins for `iguide-web`

- Kind: question
- Source: backend QUESTIONS.md Q-011.
- Question: which CMS origins are registered as redirect URIs and web origins beyond
  `http://localhost:5173`, and is the `UNICHEidp` realm export updated?
- Consequence: deployment of the CMS (G-015); nothing blocks development.

### Q-005 — Media of a Place

- Kind: spec-change-request
- Source: to-do A33 (2026-10-27); owner choice: not now, record it.
- Question: `12` §3 Place lists no media, and the CMS's Place editor has none; but `11` lines 181-183 give every
  Resource its own `assets`, and the kiosk attract loop uses the hero images of featured Resources (`13`
  line 232), so a featured Place contributes nothing there. Should a Place take a hero image and a gallery
  (as Guides do), or should `13` say the attract loop skips Places?
- Consequence: none for now; a featured Place shows no image in the attract loop.

### Q-006 — The Place setting is not asked

- Kind: spec-change-request
- Source: owner request 2026-11-11; DECISIONS.md D-057. `12` §3 Place: "creation is a dialog that asks, in order,
  `INDOOR` or `OUTDOOR`, top-level or sub-place with its parent, and the name" and the editor's "Place setup" "shows
  the same three choices"; `03` §5: "`environment` is chosen when the Place is created".
- Proposed text: `12` §3 Place: creation asks top-level or sub-place with its parent, and the name; `environment`
  follows the type (`BUILDING`, `FLOOR`, `ROOM` are `INDOOR`, `OTHER` keeps its value, the others are `OUTDOOR`), a
  sub-place starts with its parent's; "Place setup" shows the level and the map or floor plan link. `03` §5:
  "`environment` is set from the Place's type".
- Consequence until resolved: the CMS departs from `12` §3 as D-057 records.

### Q-007 — Lint and format: oxlint and oxfmt, or ESLint and Prettier

- Kind: question
- Source: PLAN.md C0d plans ESLint and Prettier; D-067 moved the build to Vite+, which bundles oxlint and
  oxfmt (`vp lint`, `vp fmt`, `vp check`) and Vitest (`vp test`).
- Question: adopt oxlint and oxfmt through Vite+ for C0d, or keep ESLint and Prettier beside it?
- Consequence: shapes C0d. Either way, formatting is applied once to the whole repository in its own commit,
  so feature diffs stay readable.

### Open decisions of `09` that shape CMS steps

| `09` | Shapes |
|---|---|
| §19 typography ownership | C1 Appearance tab, style presets |
| §20 region as a data dimension | C1 Template choice for the network Template |
| §27 Page component text localization | C4 page builder forms |
| §22 tiles and geocoding | C3 map editors (Q-003) |
| §25 floor plan labels | C3 floor plan editor |
| §2 asset processing | C2 upload limits, resumable upload |
| §1 package generation | C6 package screen |
| §16 AI gateway | MuseMind action in the translation workspace |
| §17 Portal integration | deep-link entry, platform theming |
| §28 surfaces of the first pilot | C1 surfaces, QR generation in C3 |

## Open: UX overhaul, Round 1 (raised 2026-11-12)

### Q-008 — One action bar for the editor header and the Working Copy banner

- Kind: spec-change-request
- Source: `12` §3 Resource editors: "the header carries only 'Apply changes'; 'Save draft' and 'Discard' sit in the
  Working Copy banner"; UX overhaul round 1 (C1-12, C1-22): authors lose sight of both when scrolling.
- Proposed text: "an editor has one action bar that stays visible while the form scrolls and carries Save draft,
  Discard changes and Apply changes together". Until decided, the CMS keeps the split and makes both the header and
  the banner sticky (D-074).
- Consequence: only the arrangement of three existing actions; no new behaviour.

### Q-009 — "Preview in app" as a docked pane

- Kind: spec-change-request
- Source: `12` §3: the preview "opens, below the action, a panel"; UX overhaul round 1 (C1-86).
- Proposed text: "on wide screens the panel may dock beside the form (and appear as a bottom sheet on tablets) so
  the author can type and watch". Until decided, the panel is inline below its action and pushes content (D-075).
- Consequence: shapes the editor layout in later rounds.

### Q-010 — ARCHIVED rows in the default content lists

- Kind: spec-change-request
- Source: `12` §3 Content library filters by `status` but is silent on the default; the archive confirmation says
  an archived Resource "leaves the default lists".
- Proposed text: "the default view of a content list shows DRAFT and ACTIVE Resources; ARCHIVED ones appear under an
  Archived filter". The CMS does this from Round 1 (D-076).
- Consequence: list default in all six kinds and Media.

### Q-011 — Place creation: INDOOR or OUTDOOR first

- Kind: question
- Source: `12` §3 Place: creation "asks, in order, INDOOR or OUTDOOR, top-level or sub-place with its parent, and the
  name"; the CMS dialog asks Level and the name and infers the environment from the Type.
- Question: which is canonical? Recommendation: the spec's order, because the choice decides the linked map or floor
  plan (`03` §5).
- Consequence: the Create Place dialog and the Place setup section.

### Q-012 — Common cards on Guides and Categories

- Kind: spec-change-request
- Source: `12` §3 lists "How visitors reach it" and "Preview in app" as common to every kind; D-065 removed triggers
  from the Guide editor and the Category editor has no preview.
- Proposed text: state which kinds carry a triggers card and a preview action (Guides: triggers yes or no;
  Categories: preview no).
- Consequence: Guide and Category editors.

### Q-013 — Guide paragraphs: rich text with inline images

- Kind: question
- Source: `12` §3 Guide: a paragraph block "inserts images through the Asset picker and shows them inline"; D-065
  makes images separate elements and paragraphs plain text.
- Question: is D-065 the accepted reading or should paragraphs be rich text with inline images?
- Consequence: the story editor and the `INLINE` bindings.

### Q-014 — What "ready" means on the Dashboard

- Kind: question
- Source: `12` §3 Dashboard "ready for a package"; the readiness endpoint reports `activatable` true for a Project
  with no ACTIVE content.
- Question: is "Ready" asserted only when at least one Resource is ACTIVE? Recommendation: yes. The CMS applies this
  from Round 1 using `status=ACTIVE` totals (D-077).
- Consequence: Dashboard status card; backend G-026.

### Q-015 — `OTHER` assets and upload types in the visitor-facing library

- Kind: question
- Source: UX overhaul round 1 (C1-113): an `.exe` and a `.txt` were accepted into the library.
- Question: which file types may an author upload, and is `OTHER` a permitted type? Until answered the UI lists the
  accepted formats and warns before uploading any other.
- Consequence: upload dialog; backend G-032.

### Q-016 — Bulk actions, Help destination, quick switcher

- Kind: question
- Source: UX overhaul round 1 (C1-16, C1-55, C1-76).
- Question: (1) are bulk Activate, Deactivate, Archive and Set Category wanted in lists (deferred to Round 2)?
  (2) what does "Help" in the header open (it has no destination and is removed)? (3) is a Ctrl+K Project and
  page switcher wanted?
- Consequence: lists, header.

### Q-017 — First-run guide persistence and a sixth step
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-26).
- Question: `12` §3 fixes a five-step guide for a Project without content. After the author creates a draft
  Place and Point of Interest the guide disappears while steps 3 to 5 and going live are still open. May the guide
  stay until the Project has ACTIVE content (or the author dismisses it), and may a sixth step "Activate and
  launch" be added? The CMS keeps the guide until step 5 or a per-viewer dismissal stored in the browser.
- Consequence: Dashboard first run.

### Q-018 — Sort on tree lists (Places, Categories)
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-36).
- Question: `12` §3 sorts Places and Categories by `sortOrder`. May the lists offer Title, Status and Updated,
  showing the parent as context when the tree is flattened? Until answered, tree lists show "Ordered by hierarchy
  and manual order" and offer no sort control.
- Consequence: Places and Categories lists.

### Q-019 — Does an empty Guide story block activation?
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-34).
- Question: A Guide with empty story blocks is "Complete" and activates with no blocking issue. Should it be a
  blocking issue, or a warning? The CMS shows a warning; the backend code is G-039.
- Consequence: Guide editor, readiness, Dashboard.

### Q-020 — Small clarifications: slug length and "Revision"
- Kind: spec-change-request
- Source: UX overhaul round 2 (C2-44, C2-65).
- Question: (1) What is the maximum slug length (a 328-character slug is accepted today; the CMS caps at 100)?
  (2) May authors see "Revision N" instead of "Version N" for the Working Copy and Resource `version`?
- Consequence: create dialogs, editor status card.

### Q-021 — Should a Route without stops, an Event without dates or a Guide without a story block activation?
- Kind: spec-change-request
- Source: UX overhaul round 3 (C3-16).
- Question: `12` §3 says "fewer than two stops is a warning" for a Route and lists no dates or story rule for an
  Event or a Guide; `12` §5 makes readiness the single source of what is missing. Today a Route with no stops, an Event
  with no dates and a Guide with an empty story activate with only translation warnings. May readiness
  report them as blocking issues (and the CMS show them as such), or must they stay warnings? Q-019 asks the
  same for the Guide story; this entry covers Route and Event. The CMS shows them as warnings, listed first and
  named in the activation confirm, until answered.
- Consequence: Route, Event and Guide editors, Activate confirm, Dashboard status card.

### Q-022 — Five-step guide while "Compose a Page" is not available
- Kind: spec-change-request
- Source: UX overhaul round 3 (C3-56).
- Question: `12` §3 fixes a five-step first-run guide whose third step is "compose a Page". Pages is a placeholder
  in this CMS, so step 3 opens a page that says "Not available yet" and used to be ticked by visiting it. May the
  guide say "Not available yet" on step 3, count progress as "n of 4" while Pages is missing, and end with
  "Next: activate the drafts that are ready"? The CMS does this and keeps five steps.
- Consequence: Dashboard first run.
