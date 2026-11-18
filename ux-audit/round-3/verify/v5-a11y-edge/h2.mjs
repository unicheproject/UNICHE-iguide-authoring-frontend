import { sleep, live, LOG, here, PID } from "./h.mjs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
export const AEd = (page) => page.evaluate(() => { const a = document.activeElement; if (!a) return null; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { tag: a.tagName.toLowerCase(), role: a.getAttribute("role"), id: a.id || undefined, name: (a.getAttribute("aria-label") || a.getAttribute("aria-labelledby") && document.getElementById(a.getAttribute("aria-labelledby"))?.textContent || a.textContent || a.getAttribute("placeholder") || a.value || "").trim().slice(0, 60), body: a === document.body, visible: r.width > 0 && r.height > 0, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor + " off " + cs.outlineOffset, shadow: cs.boxShadow.slice(0, 80) }; });
export const title = (page) => page.evaluate(() => ({ title: document.title, h1: document.querySelector("h1")?.textContent?.trim(), ae: document.activeElement?.tagName + (document.activeElement?.id ? "#" + document.activeElement.id : "") }));
export async function snap(page, name, sel = "body") { const t = await page.locator(sel).first().ariaSnapshot().catch((e) => "ERR " + e.message); writeFileSync(join(here, "aria-" + name + ".txt"), t); return t.length; }
export async function tab(page, n = 1, shift = false) { const out = []; for (let i = 0; i < n; i++) { await page.keyboard.press(shift ? "Shift+Tab" : "Tab"); out.push(await AEd(page)); } return out; }
export const brief = (a) => a ? `${a.tag}${a.role ? "[" + a.role + "]" : ""} "${a.name}" ${a.rect.join(",")} ${a.body ? "BODY!" : ""} ${a.outline.startsWith("none") ? "(no outline; shadow " + a.shadow.slice(0,50) + ")" : a.outline}` : "null";
export async function press(page, key, label, log, wait = 350) { await page.keyboard.press(key); await sleep(wait); const a = await AEd(page); const l = await live(page); log(`[${label}] ${key} -> ${brief(a)} | live=${JSON.stringify(l.map(x=>x.text))}`); return a; }
/** contrast of the focus indicator against the effective background */
export const ring = (page) => page.evaluate(() => {
  const a = document.activeElement; if (!a) return null;
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const cr = (x, y) => { const l1 = lum(x), l2 = lum(y); return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)); };
  const bgOf = (el) => { let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.9) return c; e = e.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const cs = getComputedStyle(a); const oc = parse(cs.outlineColor);
  // background directly outside the element: parent's bg
  const bg = bgOf(a.parentElement || a);
  const ownbg = bgOf(a);
  return { outlineW: cs.outlineWidth, off: cs.outlineOffset, style: cs.outlineStyle, ringVsOutside: oc ? +cr(oc, bg).toFixed(2) : null, ringVsOwnBg: oc ? +cr(oc, ownbg).toFixed(2) : null, bg: `${bg.r},${bg.g},${bg.b}`, ring: cs.outlineColor };
});
/** Full check of the focused element: ring contrast vs outside, clipped by scroll containers, obscured by sticky/fixed layers, offscreen. */
export const chk = (page) => page.evaluate(() => {
  const a = document.activeElement; if (!a || a === document.body) return { body: true };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const cr = (x, y) => { const l1 = lum(x), l2 = lum(y); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const bgOf = (el) => { let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.9) return c; e = e.parentElement; } return { r: 255, g: 255, b: 255 }; };
  // the ring may live on a wrapper (has-[:focus-visible]) -> find nearest ancestor/self with an outline
  let rg = a; let cs = getComputedStyle(a); let w = parseFloat(cs.outlineWidth) * (cs.outlineStyle === "none" ? 0 : 1);
  if (!w) { let p = a.parentElement; for (let i = 0; i < 3 && p; i++, p = p.parentElement) { const c2 = getComputedStyle(p); if (c2.outlineStyle !== "none" && parseFloat(c2.outlineWidth) > 0) { rg = p; cs = c2; w = parseFloat(c2.outlineWidth); break; } } }
  const oc = parse(cs.outlineColor); const bg = bgOf(rg.parentElement || rg);
  const r = rg.getBoundingClientRect(); const off = parseFloat(cs.outlineOffset) || 0; const pad = w + Math.max(off, 0);
  const box = { l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad };
  let clipped = null; let p = rg.parentElement;
  while (p && p !== document.documentElement) { const s = getComputedStyle(p); if (/(auto|hidden|scroll|clip)/.test(s.overflowX + s.overflowY)) { const pr = p.getBoundingClientRect(); const cl = []; if (box.l < pr.left - 0.5 && /(auto|hidden|scroll|clip)/.test(s.overflowX)) cl.push("L" + Math.round(pr.left - box.l)); if (box.r > pr.right + 0.5 && /(auto|hidden|scroll|clip)/.test(s.overflowX)) cl.push("R" + Math.round(box.r - pr.right)); if (box.t < pr.top - 0.5 && /(auto|hidden|scroll|clip)/.test(s.overflowY)) cl.push("T" + Math.round(pr.top - box.t)); if (box.b > pr.bottom + 0.5 && /(auto|hidden|scroll|clip)/.test(s.overflowY)) cl.push("B" + Math.round(box.b - pr.bottom)); if (cl.length) { clipped = (p.tagName + "." + (p.className || "").toString().slice(0, 40)) + " " + cl.join(","); break; } } p = p.parentElement; }
  const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
  const top = document.elementFromPoint(cx, cy); const obscured = top && !(a.contains(top) || top.contains(a)) ? (top.tagName + "." + (top.className || "").toString().slice(0, 40)) : null;
  const off_ = r.bottom < 0 || r.top > innerHeight;
  return { w, off, style: cs.outlineStyle, ring: cs.outlineColor, ringOnWrapper: rg !== a, vsOutside: oc ? +cr(oc, bg).toFixed(2) : null, bg: `${bg.r},${bg.g},${bg.b}`, clipped, obscured, offscreen: off_, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
});
export const flag = (c) => c && !c.body ? [c.vsOutside !== null && c.vsOutside < 3 ? "LOWRING " + c.vsOutside : "", c.w < 2 ? "THIN " + c.w : "", c.clipped ? "CLIPPED " + c.clipped : "", c.obscured ? "OBSCURED " + c.obscured : "", c.offscreen ? "OFFSCREEN" : ""].filter(Boolean).join("; ") : (c?.body ? "BODY" : "");
/** Tab through n stops logging only problems and a compact line. */
export async function sweep(page, n, label, log, opts = {}) { const seen = new Set(); let bad = 0; const lines = []; for (let i = 0; i < n; i++) { await page.keyboard.press("Tab"); const a = await AEd(page); const c = await chk(page); const f = flag(c); const key = a.tag + a.name + a.rect.join(); if (seen.has(key)) { lines.push(`[${label}] wrapped after ${i}`); break; } seen.add(key); if (f) { bad++; log(`[${label}] #${i + 1} ${a.tag} "${a.name}" -> ${f}`); } lines.push(`${i + 1} ${a.tag} "${a.name.slice(0,40)}"`); } log(`[${label}] ${seen.size} stops, ${bad} flagged`); return lines; }
/** Share of the viewport covered by the stack of sticky/fixed elements stuck at the top of <main> after scrolling `y`. */
export const stickyStack = (page, y = 600) => page.evaluate(async (y) => {
  const sc = document.querySelector("main") || document.scrollingElement;
  sc.scrollTo(0, y); await new Promise(r => setTimeout(r, 400));
  const app = document.querySelector("header"); const appB = app ? app.getBoundingClientRect().bottom : 0;
  const cand = [];
  for (const e of document.querySelectorAll("main *, header")) { const cs = getComputedStyle(e); if (!/(sticky|fixed)/.test(cs.position)) continue; const r = e.getBoundingClientRect(); if (r.height < 4 || r.width < 150 || r.height > innerHeight * 0.6) continue; if (r.bottom <= 0 || r.top > innerHeight * 0.6) continue; if (cs.visibility === "hidden" || +cs.opacity === 0) continue; cand.push({ tag: e.tagName + "." + (e.className || "").toString().slice(0, 28), top: Math.round(r.top), h: Math.round(r.height), bottom: Math.round(r.bottom) }); }
  cand.sort((a, b) => a.top - b.top); let cov = appB; const stack = [{ tag: "app-header", top: 0, h: Math.round(appB), bottom: Math.round(appB) }];
  for (const c of cand) { if (c.tag.startsWith("HEADER")) continue; if (c.top <= cov + 3 && c.bottom > cov) { stack.push(c); cov = c.bottom; } }
  return { vh: innerHeight, vw: innerWidth, appHeader: Math.round(appB), covered: Math.round(cov), pct: +(cov / innerHeight * 100).toFixed(1), belowAppPct: +((cov - appB) / innerHeight * 100).toFixed(1), items: stack, scrolled: sc.scrollTop };
}, y);
