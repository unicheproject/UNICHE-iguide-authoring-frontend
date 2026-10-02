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
