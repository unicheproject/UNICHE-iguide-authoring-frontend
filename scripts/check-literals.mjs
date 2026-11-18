#!/usr/bin/env node
/**
 * The literal gate (round 3, D-116, C3-98): fails when CMS-chrome markup uses a literal where a design token exists.
 *
 *   node scripts/check-literals.mjs
 *
 * Scans every `.vue` and `.css` file under `src/` (comments are ignored) for
 *   - `text-[Npx]`: use the type scale (`text-xs`, `text-compact`, `text-sm`, ...);
 *   - `rounded-[`, `shadow-[`, `z-[`, `tracking-[`: use the radius, shadow, z-index tokens; no letter-spacing;
 *   - `uppercase`: the CMS sets labels in sentence case;
 *   - hex colours (`#rgb`, `#rrggbb`, `#rrggbbaa`) and `bg-white`, `text-black`, `border-black`, `gray-N` classes: use the
 *     colour tokens (`bg-card`, `text-foreground`, `border-border`).
 *
 * Needs no install. Exit code 1 lists each hit as `file:line  text`.
 *
 * Out of scope (not CMS chrome, listed so the gate says so instead of silently skipping): the legacy visitor-app screens
 * of the Project (Overview, Languages, Surfaces, Translations, Navigation, a section page). They keep their old literals
 * until the owner opens that scope (`ux-audit/round-3/audit/design-system/cleanup.md` section E).
 *
 * Documented exceptions, each by file and rule:
 *   - The preview stand-in (`components/preview/**`, `editor/ResourcePreview.vue`) simulates the visitor app: its type is in
 *     `em`, its radius and colours come from the Project theme (`var(--t-*)`), and the visitor app sets small labels in
 *     capitals. It may use `uppercase`, `tracking-[`, `rounded-[` and the hex fallbacks inside `var(--t-*, #fff)`.
 *   - `editor/QrCodePreview.vue`: `bg-white` is deliberate, a QR code needs a white quiet zone for scanners in any theme.
 *   - Any line with `mask-image`: `#000` there is an alpha mask, not a colour.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");

/** Legacy visitor-app screens, outside the round-3 scope (cleanup.md E). */
const OUT_OF_SCOPE = [
  "src/views/workspace/OverviewView.vue",
  "src/views/workspace/LanguagesView.vue",
  "src/views/workspace/SurfacesView.vue",
  "src/views/workspace/TranslationsView.vue",
  "src/views/workspace/navigation/NavigationView.vue",
  "src/views/workspace/SectionView.vue",
];

/** The preview stand-in: em-based and themed by the Project, by design. */
const STAND_IN = [/^src\/components\/preview\//, /^src\/components\/editor\/ResourcePreview\.vue$/];

/** Each rule: a name, the pattern, and the files or lines where it is allowed. */
const RULES = [
  { name: "text-[Npx]", pattern: /\btext-\[[0-9.]+px\]/g },
  { name: "rounded-[", pattern: /\brounded(?:-[a-z]{1,2})?-\[/g, allow: { files: STAND_IN } },
  { name: "shadow-[", pattern: /\bshadow-\[/g },
  { name: "z-[", pattern: /(?<![-\w])-?z-\[/g },
  { name: "tracking-[", pattern: /\btracking-\[/g, allow: { files: STAND_IN } },
  { name: "uppercase", pattern: /\buppercase\b/g, allow: { files: STAND_IN } },
  {
    name: "hex colour",
    pattern: /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g,
    // `#000` in a mask gradient is an alpha mask; a hex fallback inside the stand-in's `var(--t-*, #fff)` is the theme default.
    allow: { files: STAND_IN, line: /mask-image/ },
  },
  { name: "white, black or gray utility", pattern: /\b(?:bg|text|border|ring|fill|stroke)-(?:white|black|gray-\d+)\b/g, allow: { files: [/^src\/components\/editor\/QrCodePreview\.vue$/] } },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(vue|css)$/.test(name)) out.push(path);
  }
  return out;
}

/** Blanks comments but keeps every newline, so line numbers stay true. */
function stripComments(text) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank).replace(/^\s*\/\/.*$/gm, blank);
}

const hits = [];
let scanned = 0;
for (const file of walk(join(root, "src"))) {
  const rel = relative(root, file).split("\\").join("/");
  if (OUT_OF_SCOPE.includes(rel)) continue;
  scanned++;
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.allow?.files?.some((f) => f.test(rel))) continue;
      if (rule.allow?.line?.test(line)) continue;
      rule.pattern.lastIndex = 0;
      for (const m of line.matchAll(rule.pattern)) hits.push(`${rel}:${i + 1}  ${rule.name}  ${m[0]}`);
    }
  });
}

if (hits.length) {
  console.error(`check-literals: ${hits.length} literal(s) in CMS chrome:`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`check-literals: ok (${scanned} files, ${OUT_OF_SCOPE.length} out-of-scope screens skipped)`);
