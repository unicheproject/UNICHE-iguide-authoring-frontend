# DOC: DESIGN.md (D-115; C3-101)

## Done
- DESIGN.md composed in the official format (YAML frontmatter, then Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts). The format puts focus, state ladder and forced colours under Shapes and motion under Elevation & Depth, so those sections hold them. Content rules, accessibility rules, gates, Legacy, Known deviations and the Token verification appendix sit between and after those sections.
- Saved `.impeccable/design.json` (schemaVersion 2).
- Appended D-115 to `DECISIONS.md`. It was absent. The text: "DESIGN.md at the repo root (with `.impeccable/design.json`) describes the shipped CMS design system ... Every token and class it names exists: the Token verification appendix gives name, file and line ... A change to a token, a type size or a component variant updates DESIGN.md in the same slice. Why: C3-101, BRIEF §2 item 4."
- Edited no source file.

## Verified
- Every token and class named in DESIGN.md was found by `grep -nF`, 178 name-to-file:line entries, 0 missing. The appendix lists them.
- Colour hexes and 36 contrast pairs were computed from the HSL triplets in `style.css`. Values match the comments except two stale comments (below).
- Type sizes and line-heights are copied from `tailwind.config.js` (xs 1.4, compact 1.45, sm 1.5, base 1.4, lg 1.3, xl 1.25). Screens, radii and z layers match the config.
- Frontmatter YAML was not run through a parser.

## Corrections to the audit's source table
- Removed from the code and no longer documented: `2xl` font size, `line` colour, `--radius`, `--card-foreground`, `z-base`, `rounded-xl`, `darkMode`, `container`, the `tailwindcss-animate` plugin line.
- Added: `--primary-active`, `--surface-active`, `--destructive-active`, `--ring-inverse`, `--z-modal`, `z-popover-over`, `h-logo`, `h-stage`, `.on-dark`, `.forced-step-current`, `.nav-item:active`, `.list-flash`, `.list-row-skeleton`, `.list-card-skeleton`.
- Focus is now a 2 px ring with a 2 px offset and no 4 px halo (D-100).
- Half steps in use are 2, 6, 10 and 14 px, not only 6 and 10.
- Table/card switch: below 900 px wide, or when the Title would be under 15 rem (`MIN_TITLE` 240).
- Banner sticky from 960 px height and header from 700 px (D-108 supersedes D-089's 800 px).
- Dots are 32 px (44 coarse).
- Not shipped: themed scrollbar and caret (only `accent-color` and `::selection`).

## Deviations found (all in DESIGN.md "Known deviations")
1. Five raw `leading-*` in chrome: ResourcePreview 164, PreviewPane 96, StoryEditor 223, AssetPickerDialog 248 (`leading-[2.5rem]`), Stepper 58. `check-literals` does not scan `leading-`.
2. `sunken` alias still has 3 users (CreateProjectView 100, StepName 77, StepTemplate 82). `--secondary`/`secondary` still exists, identical to `accent`, with no class user. The plan listed both as removed.
3. Stale comment ratios in `style.css`: `--ring-inverse` says 12:1 (measured 14.94), `--destructive-active` says 8.6:1 (measured 10.13). The values are unchanged.
4. Hand-rolled ghost buttons, create-dialog failure sentence split, "not reachable" leftovers, toast without action, RemovedBar not docking, `tailwindcss-animate` still in `package.json`, gates not wired into build (all carried over from the package reports).

## Assumptions for the owner to correct
The North Star "The Quiet Workshop", the colour names, and the elevation sentence (PRODUCT.md gives none). Tonal ramps in `design.json` are synthesized.

## Not run
Typecheck, `check-css`, `check-literals`, e2e and screenshots; DOC edits no source. The Round 3 packages' recorded results are cited, not re-measured.
