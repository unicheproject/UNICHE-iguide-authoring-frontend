import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const screens = {
  home: "/",
  dashboard: `/projects/${P}`,
  places: `/projects/${P}/places`,
  pois: `/projects/${P}/pois`,
  poi_editor: `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`,
  route_editor: `/projects/${P}/routes/9743e460-8351-4897-8ee5-eecc13fcbf19`,
  guide_editor: `/projects/${P}/guides/bcc7d2be-50ef-46cb-85e2-ced86c6559a3`,
  categories: `/projects/${P}/categories`,
  media: `/projects/${P}/media`,
  asset_editor: `/projects/${P}/media/484a6bb2-d08c-41df-aa7c-d8cf2a2f1823`,
  maps: `/projects/${P}/maps`,
  map_editor: `/projects/${P}/maps/5eef6cab-a61e-419e-adff-053edfff9939`,
  floorplan_editor: `/projects/${P}/floor-plans/d40864d1-684a-466f-819d-68fa651b7146`,
  preview: `/projects/${P}/preview`,
  create_project: `/projects/new`,
};
const probe = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const bgOf = (el) => { const stack = []; let n = el; let img = false; while (n) { const cs = getComputedStyle(n); if (cs.backgroundImage !== "none") img = true; const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } n = n.parentElement; } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return { c: base, img }; };
  const sel = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "");
  const text = {}, misc = { radius: {}, shadow: {}, z: {}, borderW: {}, trans: {}, font: {}, anim: {} }, borders = [], targets = [];
  const bump = (o, k, s) => { (o[k] ??= { n: 0, s }).n++; };
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || r.height === 0) continue;
    if (el.closest("[data-dialog-body]") === null && false) continue;
    const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (direct) {
      const fg0 = parse(cs.color); const { c: bg, img } = bgOf(el); const fg = over({ ...fg0, a: fg0.a * (parseFloat(cs.opacity) || 1) }, bg);
      const key = [hex(fg), hex(bg), cs.fontSize, cs.fontWeight, cs.letterSpacing, cs.lineHeight, cs.textTransform, cs.fontFamily.split(",")[0]].join("|");
      const t = (text[key] ??= { n: 0, s: sel(el), t: el.textContent.trim().slice(0, 30), fg: hex(fg), bg: hex(bg), img, fs: cs.fontSize, fw: cs.fontWeight, ls: cs.letterSpacing, lh: cs.lineHeight, tt: cs.textTransform, ff: cs.fontFamily.split(",")[0], ratio: +ratio(fg, bg).toFixed(2) });
      t.n++;
    }
    if (cs.borderRadius !== "0px") bump(misc.radius, cs.borderRadius, sel(el));
    if (cs.boxShadow !== "none") bump(misc.shadow, cs.boxShadow, sel(el));
    if (cs.position !== "static" && cs.zIndex !== "auto") bump(misc.z, cs.zIndex, sel(el));
    if (cs.transitionDuration !== "0s") bump(misc.trans, cs.transitionProperty + " " + cs.transitionDuration + " " + cs.transitionTimingFunction, sel(el));
    if (cs.animationName !== "none") bump(misc.anim, cs.animationName + " " + cs.animationDuration, sel(el));
    for (const side of ["Top", "Right", "Bottom", "Left"]) { const w = parseFloat(cs["border" + side + "Width"]); if (w > 0 && cs["border" + side + "Style"] !== "none") { const bc = parse(cs["border" + side + "Color"]); const { c: bg } = bgOf(el.parentElement ?? el); const b = over(bc, bg); bump(misc.borderW, w + "px " + hex(b) + " on " + hex(bg) + " r=" + ratio(b, bg).toFixed(2), sel(el)); } }
    const tag = el.tagName;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag) && el.type !== "hidden" && el.type !== "checkbox" && el.type !== "radio") {
      const bc = parse(cs.borderTopColor); const { c: bg } = bgOf(el.parentElement); const bgc = parse(cs.backgroundColor); const surf = bgc.a ? over(bgc, bg) : bg;
      borders.push({ el: sel(el), bw: cs.borderTopWidth, border: hex(over(bc, surf)), bg: hex(surf), ratio: +ratio(over(bc, surf), surf).toFixed(2), ph: el.placeholder || null, h: Math.round(r.height), fs: cs.fontSize, outline: cs.outlineStyle + " " + cs.outlineWidth });
      if (el.placeholder) { const ph = getComputedStyle(el, "::placeholder"); const pc = parse(ph.color); borders[borders.length - 1].phColor = hex(over(pc, surf)); borders[borders.length - 1].phRatio = +ratio(over(pc, surf), surf).toFixed(2); }
    }
    if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(tag) || el.getAttribute("role") === "button" || el.getAttribute("role") === "tab") { if (r.width < 24 || r.height < 24) targets.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height), t: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 25) }); }
  }
  misc.font = { loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family + " " + f.weight), all: [...document.fonts].length };
  return { text: Object.values(text), misc, borders, targets, bodyFont: getComputedStyle(document.body).fontFamily, htmlFs: getComputedStyle(document.documentElement).fontSize };
};
const { browser, page } = await open("curator", { viewport: "1440" });
const out = {};
for (const [name, path] of Object.entries(screens)) {
  try {
    await go(page, path); await page.waitForTimeout(2200);
    await page.screenshot({ path: join(here, "shots", `${name}__default__1440.png`), fullPage: false });
    out[name] = await page.evaluate(probe);
    console.log(name, out[name].text.length, "text styles", out[name].borders.length, "inputs");
  } catch (e) { console.log(name, "ERR", e.message.slice(0, 120)); }
}
writeFileSync(join(here, "data", "inventory.json"), JSON.stringify(out, null, 1));
await browser.close();
