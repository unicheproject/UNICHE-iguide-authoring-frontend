import { start, go, P, focusInfo, tabWalk, tabTo, live, axe, seed } from "./common.mjs";
const contrastFn = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r:p[0], g:p[1], b:p[2], a: p[3] ?? 1 }; };
  const lum = ({r,g,b}) => { const f = v => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const over = (top, bot) => ({ r: top.r*top.a+bot.r*(1-top.a), g: top.g*top.a+bot.g*(1-top.a), b: top.b*top.a+bot.b*(1-top.a), a:1 });
  const bgOf = (el) => { let layers=[]; let e = el; while (e) { const cs = getComputedStyle(e); if (cs.backgroundImage !== "none" && !cs.backgroundImage.startsWith("url")) return null; const c = parse(cs.backgroundColor); if (c && c.a>0) { layers.push(c); if (c.a===1) break; } e = e.parentElement; } let base = {r:255,g:255,b:255,a:1}; for (const l of layers.reverse()) base = over(l, base); return base; };
  const out = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || !el.getClientRects().length) continue;
    const cs = getComputedStyle(el); if (cs.visibility==="hidden") continue;
    let fg = parse(cs.color); if (!fg) continue; const bg = bgOf(el); if (!bg) continue;
    let op = 1; let e = el; while (e) { op *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; }
    fg = { ...fg, a: fg.a * op }; const f = over(fg, bg);
    const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const disabled = !!el.closest("[disabled],[aria-disabled=true]");
    if (ratio < need) { const key = cs.color + "|" + `${bg.r|0},${bg.g|0},${bg.b|0}` + "|" + size; const o = out.get(key) || { ratio: +ratio.toFixed(2), need, size, bold, fg: cs.color, bg: `${bg.r|0},${bg.g|0},${bg.b|0}`, disabled, n: 0, sample: n.textContent.trim().slice(0,40) }; o.n++; out.set(key, o); }
  }
  return [...out.values()];
};
const s = await start("1440"); const { page } = s;
const res = {};
for (const [k, pth] of Object.entries({ pois: "/pois", "poi-editor": "/pois/22ba8181-7028-4c14-9cb2-ee091893190b", dashboard: "", places: "/places", routes:"/routes", guides:"/guides", events:"/events", categories:"/categories", media:"/media", maps:"/maps", floorplans:"/floor-plans", preview:"/preview", translations:"/translations", navigation:"/navigation" })) {
  await go(page, P + pth); await page.getByRole("heading",{level:1}).first().waitFor({timeout:15000}).catch(()=>{}); await page.waitForTimeout(2500);
  res[k] = await page.evaluate(contrastFn);
  console.log(k, res[k].length, JSON.stringify(res[k].slice(0,12).map(x=>`${x.ratio}/${x.need} ${x.fg} on ${x.bg} ${x.size}px${x.bold?"b":""}${x.disabled?" DIS":""} x${x.n} "${x.sample}"`), null, 0));
}
s.save("contrast.json", res);
await s.browser.close();
