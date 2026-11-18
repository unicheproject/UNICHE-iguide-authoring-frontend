import { open, go, CMS, API, VIEWPORTS } from "../../../tools/session.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
export const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url)));
export const PID = seed.projects.populated.id;
export const P = `/projects/${PID}`;
const base = join(process.cwd(), "ux-audit", "round-1", "audit", "p5-a11y");
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
    const name = e.getAttribute("aria-label") || e.getAttribute("title") || (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)?.textContent) || e.textContent || e.getAttribute("placeholder") || "";
    const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ? `outline ${cs.outlineWidth} ${cs.outlineColor} off${cs.outlineOffset}` : (cs.boxShadow !== "none" ? "shadow " + cs.boxShadow.slice(0,50) : "NONE");
    return { tag: e.tagName.toLowerCase(), role: e.getAttribute("role") || "", type: e.getAttribute("type")||"", name: name.trim().replace(/\s+/g," ").slice(0,50), ring, w: Math.round(r.width), h: Math.round(r.height), vis: r.width>0 && r.bottom>0 && r.top<innerHeight, dialog: !!e.closest("[role=dialog]") };
  });
}
export async function tabWalk(page, n, key = "Tab") {
  const out = [];
  for (let i = 0; i < n; i++) { await page.keyboard.press(key); out.push(await focusInfo(page)); }
  return out;
}
export async function tabTo(page, re, max = 200, key = "Tab") {
  for (let i = 0; i < max; i++) { await page.keyboard.press(key); const f = await focusInfo(page); if (re.test(f.name)) return { ...f, presses: i + 1 }; }
  throw new Error("tabTo failed " + re);
}
export const live = (page) => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => (e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,200)));
export async function openPoi(page, s, title = "UX-p5-a11y Alpha") {
  await go(page, P + "/pois"); await page.waitForTimeout(1000);
  await page.getByRole("searchbox").focus(); await page.keyboard.type("UX-p5-a11y"); await page.waitForTimeout(1200);
  await page.getByRole("link",{name:title}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(2000);
}
