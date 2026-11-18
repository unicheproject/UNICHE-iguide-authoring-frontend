#!/usr/bin/env node
/**
 * Builds the Tailwind CSS the app ships and fails when a design-token class used in the sources has no rule (round 2,
 * C2-01: `size-control` and `min-h-header` were used but never generated, so icon buttons were 18 px). Round 3 widened
 * the families to size, z-index, shadow, radius, type size (`text-`), `leading`, `duration`, `ease`, `animate`, spacing
 * (`p`/`m`/`gap`/`space`), colours (`bg`, `text`, `border`, `ring`, ...) and the custom screens (`nav:`, `edit:`).
 *
 *   node scripts/check-css-tokens.mjs [--all]
 *
 * By default only `src/components/ui/**` and the files named in `ux-audit/round-2/audit/design-system/cleanup.md` section A
 * are checked; `--all` checks every file under `src/`. Needs no install: it runs the repo's own `tailwindcss` CLI.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");
const all = process.argv.includes("--all");

/** Class families whose utilities depend on a theme key that can be missing. */
const FAMILY = new RegExp(
  "^-?(?:size|h|w|min-h|min-w|max-h|max-w|z|shadow|rounded(?:-[trbl]{1,2}|-[se]{1,2})?" +
    "|text|leading|duration|ease|animate" +
    "|p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]" +
    "|bg|border(?:-[xytrblse])?|ring|outline|fill|stroke|divide|placeholder|caret|decoration)" +
    "-[A-Za-z0-9._/%-]+$",
);
/** Variants that are the project's own screens: any class under them must exist, whatever its family. */
const CUSTOM_SCREEN = /^(?:nav|edit):/;
const CLASS_SHAPE = /^-?[a-z][A-Za-z0-9-]*(?:\/[0-9]+)?$/;
const EXTRA_FILES = [
  "src/components/WorkspaceNav.vue",
  "src/components/editor/ReorderControls.vue",
  "src/components/editor/RemovedBar.vue",
  "src/components/media/MediaSlots.vue",
];

/** Tokens that appear in prose or code but are not classes. */
const IGNORE = new Set([
  "h-0",
  // Readiness keys of the editor ("gap-story", "gap-stops"), SVG attributes and `:`-bound props are not classes.
  "gap-story",
  "gap-stops",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(vue|ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

const files = all
  ? walk(join(root, "src"))
  : [...walk(join(root, "src/components/ui")), ...EXTRA_FILES.map((f) => join(root, f))];

const tmp = mkdtempSync(join(tmpdir(), "check-css-"));
const outFile = join(tmp, "out.css");
let css;
try {
  execFileSync(
    process.execPath,
    [join(root, "node_modules/tailwindcss/lib/cli.js"), "-c", join(root, "tailwind.config.js"), "-i", join(root, "src/style.css"), "-o", outFile],
    { cwd: root, stdio: ["ignore", "ignore", "pipe"] },
  );
  css = readFileSync(outFile, "utf8");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

/** The selector text Tailwind writes for a class name (CSS.escape equivalent for the characters classes use). */
const escapeClass = (name) => name.replace(/[^A-Za-z0-9_-]/g, (c) => `\\${c}`);
/** The same with a comma written as Tailwind writes it (`\2c `, the hex escape) inside `min(a,b)`. */
const escapeClassHex = (name) => name.replace(/[^A-Za-z0-9_-]/g, (c) => (c === "," ? "\\2c " : `\\${c}`));

/**
 * Splits source text into candidate class names. Class lists break at whitespace, quotes and punctuation, but never inside
 * an arbitrary value (`max-h-[calc(100dvh-var(--sticky-stack-h,3.5rem)-1rem)]` holds a comma and stays whole).
 */
function* tokens(text) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (c === "[") depth++;
    else if (c === "]" && depth > 0) depth--;
    if (i === text.length || (depth === 0 && /[\s"'`<=,;{}()]/.test(c))) {
      if (i > start) yield text.slice(start, i);
      start = i + 1;
    }
  }
}

/** Index of the colon that ends the last variant of a class, ignoring colons inside `[...]` (`[&:hover]:x`). */
function lastVariant(name) {
  let depth = 0;
  let found = -1;
  for (let i = 0; i < name.length; i++) {
    if (name[i] === "[") depth++;
    else if (name[i] === "]") depth--;
    else if (name[i] === ":" && depth === 0) found = i;
  }
  return found;
}

const dead = new Map();
for (const file of files) {
  // Comments name classes in prose; only code and templates count.
  const text = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/^\s*\/\/.*$/gm, " ");
  for (const raw of tokens(text)) {
    // `$`-prefixed or interpolated fragments are not whole classes.
    if (!raw || raw.startsWith(":") || raw.includes("${") || raw.includes("$")) continue;
    const name = raw.replace(/^!/, "");
    const base = name.slice(lastVariant(name) + 1).replace(/^!/, "");
    const family = FAMILY.test(base.replace(/\[.*$/, "")) || /^-?(?:size|h|w|min-h|min-w|max-h|max-w|z|shadow|rounded|text|leading|duration|ease|animate|p[xytrblse]?|m[xytrblse]?|gap|bg|border|ring)-\[/.test(base);
    const screen = CUSTOM_SCREEN.test(name) && CLASS_SHAPE.test(base);
    if (!family && !screen) continue;
    if (IGNORE.has(base)) continue;
    // A bare `shadow-x` used as a `data-` or JS identifier is rare; a class is dead when its escaped selector is absent.
    if (css.includes(`.${escapeClass(raw)}`) || css.includes(`.${escapeClassHex(raw)}`)) continue;
    if (!dead.has(name)) dead.set(name, new Set());
    dead.get(name).add(relative(root, file));
  }
}

if (dead.size) {
  console.error(`check-css: ${dead.size} class(es) used in the sources have no CSS rule:`);
  for (const [name, where] of dead) console.error(`  ${name}  (${[...where].slice(0, 3).join(", ")})`);
  process.exit(1);
}
console.log(`check-css: ok (${files.length} files, every token class has a rule)`);
