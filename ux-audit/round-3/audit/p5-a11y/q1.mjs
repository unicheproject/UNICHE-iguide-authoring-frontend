import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("q1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const contrastProbe = (page) => page.evaluate(() => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const cr = (x, y) => { const l1 = lum(x), l2 = lum(y); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const blend = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) });
  const bgOf = (el) => { const stack = []; let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) stack.push(c); if (c && c.a >= 1) break; e = e.parentElement; } let base = { r: 255, g: 255, b: 255 }; for (const c of stack.reverse()) base = blend(c, base); return base; };
  const opac = (el) => { let o = 1, e = el; while (e) { o *= +getComputedStyle(e).opacity; e = e.parentElement; } return o; };
  const out = [];
  const add = (kind, el, colorStr, extra = "") => { const fg = parse(colorStr); if (!fg) return; const bg = bgOf(el); const o = opac(el); const f2 = blend({ ...fg, a: fg.a * o }, bg); const cs = getComputedStyle(el); out.push({ kind, ratio: +cr(f2, bg).toFixed(2), fs: cs.fontSize, fw: cs.fontWeight, txt: (el.getAttribute("placeholder") || el.textContent || "").trim().slice(0, 30), fg: `${Math.round(f2.r)},${Math.round(f2.g)},${Math.round(f2.b)}`, bg: `${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}`, extra }); };
  for (const el of document.querySelectorAll("input[placeholder],textarea[placeholder]")) { if (el.offsetParent === null) continue; const ph = getComputedStyle(el, "::placeholder"); add("placeholder", el, ph.color); }
  for (const el of document.querySelectorAll("button:disabled,[aria-disabled=true],input:disabled,select:disabled")) { if (el.offsetParent === null) continue; add("disabled", el, getComputedStyle(el).color, "op=" + opac(el)); }
  for (const el of document.querySelectorAll(".text-muted-foreground,.text-ink-2,.text-ink-3,[class*=text-muted],[class*=text-ink-]")) { if (el.offsetParent === null || !el.textContent.trim() || el.children.length > 2) continue; add("muted", el, getComputedStyle(el).color); }
  for (const el of document.querySelectorAll("table tbody tr:first-child span,[class*=chip],[class*=badge]")) { if (el.offsetParent === null || !el.textContent.trim()) continue; add("chip", el, getComputedStyle(el).color); }
  const worst = {}; for (const o of out) { const k = o.kind; (worst[k] = worst[k] || []).push(o); }
  const res = {}; for (const k in worst) { const arr = worst[k].sort((a, b) => a.ratio - b.ratio); const seen = new Set(); res[k] = arr.filter(o => { const kk = o.fg + "/" + o.bg + "/" + o.fs; if (seen.has(kk)) return false; seen.add(kk); return true; }).slice(0, 5); }
  return res;
});
const { browser, page } = await H.session();
try {
  for (const [label, path] of [["poi-list", "/pois"], ["poi-editor", "/pois/" + ids.poi], ["event-editor", "/events/" + ids.event], ["media", "/media"], ["dashboard", "/"], ["preview", "/preview"], ["map-new", "/maps?create=1"], ["route-editor", "/routes/" + ids.route]]) {
    await H.go(page, H.P(path)); await H.sleep(1200);
    const r = await contrastProbe(page); log("CONTRAST", label, JSON.stringify(r));
  }
  // disabled / hover / active states sample on POI editor: Save (disabled when clean)
  await H.go(page, H.P("/pois/" + ids.poi)); await H.sleep(1000);
  log("states", await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Save/.test(x.textContent.trim())); const cs = getComputedStyle(b); return { disabledAttr: b.disabled, ariaDisabled: b.getAttribute("aria-disabled"), color: cs.color, bg: cs.backgroundColor, op: cs.opacity, cursor: cs.cursor, text: b.textContent.trim() }; }));
  log("Save focusable when no changes:", await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Save/.test(x.textContent.trim())); b.focus(); return document.activeElement === b; }));
} finally { await browser.close(); }
