import { open, go, CMS, API, VIEWPORTS } from "../../../tools/session.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
export const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url)));
export const PID = seed.projects.populated.id;
export const P = `/projects/${PID}`;
const base = join(process.cwd(), "ux-audit", "round-1", "audit", "s14-preview");
export const shotDir = join(base, "shots") + "\\";
export const outDir = join(base, "out") + "\\";
const req = createRequire(join(process.cwd(), "package.json"));
export const { AxeBuilder } = req("@axe-core/playwright");
export async function start(viewport = "1440", opts = {}) {
  const s = await open("curator", { viewport, ...opts });
  s.page.on("pageerror", e => console.log("PAGEERROR", e.message));
  s.shot = (name) => s.page.screenshot({ path: shotDir + name + `__${viewport}.png` });
  s.save = (name, data) => writeFileSync(outDir + name, typeof data === "string" ? data : JSON.stringify(data, null, 1));
  return s;
}
export async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  return r.violations.map(v => ({ label, id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0,3).map(n => n.target.join(" ") + " :: " + (n.failureSummary||"").split("\n").slice(1,3).join(" ").slice(0,160)) }));
}
export { go, CMS, API, VIEWPORTS };
export async function focusInfo(page) {
  return page.evaluate(() => {
    const e = document.activeElement; if (!e || e === document.body) return { tag: "BODY" };
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    const name = e.getAttribute("aria-label") || e.getAttribute("title") || e.textContent || "";
    const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ? `outline ${cs.outlineWidth}` : (cs.boxShadow !== "none" ? "shadow" : "NONE");
    return { tag: e.tagName.toLowerCase(), role: e.getAttribute("role") || "", name: name.trim().replace(/\s+/g," ").slice(0,50), ring, w: Math.round(r.width), h: Math.round(r.height), inFrame: !!e.closest("[data-preview-frame]"), dialog: !!e.closest("[role=dialog]") };
  });
}
