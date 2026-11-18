import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const probe = () => page.evaluate(() => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const blend = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const bgOf = (el) => { let stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (const c of stack.reverse()) base = blend(c, base); return base; };
  const eff = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const out = []; const seen = new Set();
  const label = (el) => el.tagName.toLowerCase() + "." + [...el.classList].slice(0, 4).join(".");
  const consider = (el, kind, colorStr) => {
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return;
    const cs = getComputedStyle(el); let fg = parse(colorStr ?? cs.color); if (!fg) return;
    const o = eff(el); const bg = bgOf(el); fg = blend({ ...fg, a: fg.a * o }, bg);
    const ratioV = ratio(fg, bg); const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    const need = kind === "ui" ? 3 : large ? 3 : 4.5;
    const key = kind + label(el) + ratioV.toFixed(2);
    if (ratioV < need && !seen.has(key)) { seen.add(key); out.push({ kind, el: label(el), text: (el.textContent || el.getAttribute("placeholder") || "").trim().slice(0, 40), ratio: +ratioV.toFixed(2), need, size, fg: `rgb(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, disabled: el.matches(":disabled,[aria-disabled=true]") }); }
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest("canvas,svg,.leaflet-container,[inert]")) continue; consider(el, "text"); }
  document.querySelectorAll("input[placeholder],textarea[placeholder]").forEach((el) => { const ph = getComputedStyle(el, "::placeholder").color; if (el.value === "") consider(el, "placeholder", ph); });
  document.querySelectorAll("input:not([type=checkbox]):not([type=radio]),select,textarea").forEach((el) => { const cs = getComputedStyle(el); const c = parse(cs.borderTopColor); if (!c) return; const bg = bgOf(el.parentElement ?? el); const rr = ratio(blend(c, bg), bg); if (rr < 3 && parseFloat(cs.borderTopWidth) > 0) out.push({ kind: "ui-border", el: label(el), ratio: +rr.toFixed(2), need: 3 }); });
  return out;
});
const pages = [["dashboard", ""], ["pois", "/pois"], ["poi-editor-draft", "/pois/35d91cba-d64a-43ce-9773-1e472226d028"], ["routes", "/routes"], ["route-editor", "/routes/11d2dfe4-09fa-48b1-8b5b-494964cf3d52"], ["events", "/events"], ["event-editor", "/events/b01dc48d-a833-4dfd-af71-62f355ddb3e6"], ["media", "/media"], ["maps", "/maps"], ["places", "/places"], ["guides", "/guides"], ["categories", "/categories"], ["category-editor", "/categories/ca8a9d3c-85c8-4c3a-b522-2309120772ac"]];
for (const [n, p] of pages) { await L.nav(page, L.P(p), 1500); const r = await probe(); L.log("contrast", n, JSON.stringify(r)); console.log(n, r.length); }
await browser.close();
