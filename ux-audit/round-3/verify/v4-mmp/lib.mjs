import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { appendFileSync } from "node:fs";
import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
export { open, go, VIEWPORTS };
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export const { AxeBuilder } = require("@axe-core/playwright");
export const POP = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const EMPTY_B = "1d6971ce-6391-4da8-848e-8d7466d25128";
export const SHOTS = join(here, "shots");
export const shot = (page, name, vp, full = false) => page.screenshot({ path: join(SHOTS, `${name}__${vp}.png`), fullPage: full });
export const log = (...a) => { const s = a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "); console.log(s); appendFileSync(join(here, "out.log"), s + "\n"); };
let __b=null;
export const run = async (fn) => { const t=setTimeout(()=>{console.log("TIMEOUT");process.exit(2)},150000); try { await fn(); } catch (e) { console.log("FAIL", e.message.slice(0, 800)); } finally { try{ await __b?.close(); }catch{} clearTimeout(t); process.exit(0); } };
export async function start(vp, opts = {}) {
  const r = await open("admin", { viewport: vp, ...opts });
  __b=r.browser; r.page.setDefaultTimeout(8000);
  r.page.on("pageerror", (e) => log("PAGEERROR", e.message.slice(0, 200)));
  return r;
}
export async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  log("AXE", label, r.violations.map((v) => `${v.id}(${v.impact}) x${v.nodes.length}`).join("; ") || "clean");
}
export const box = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right), b: Math.round(b.bottom) }; })()`;
export const focusDesc = (page) => page.evaluate(() => { const e = document.activeElement; return e ? `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""} role=${e.getAttribute("role")} "${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 50)}"` : "none"; });
export const nom = (rows) => ({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
export const RES = [
  { place_id: 1, display_name: "Kerameikos, Athens, Greece", addresstype: "suburb", type: "archaeological_site", osm_type: "way", osm_id: 1, boundingbox: ["37.976", "37.980", "23.708", "23.716"] },
  { place_id: 2, display_name: "London Heathrow Airport, England", addresstype: "aeroway", type: "aerodrome", osm_type: "way", osm_id: 2, boundingbox: ["51.45", "51.49", "-0.50", "-0.40"] }];
export const cmd = (f, ...a) => `cmd.exe /c "cd /d C:\\Users\\mirto\\IdeaProjects\\iguide\\uniche_iguide_frontend && node ux-audit\\round-3\\verify\\v4-mmp\\${f} ${a.join(" ")}"`;
export const PLAN = "375edf44-fff5-4ad8-9660-76913a5f74b1";
