import { open, go, P, shot, settle } from "./h.mjs";
const { browser, context, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await settle(page, 2000);
// geometry
const g = await page.evaluate(() => {
  const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(x => Math.round(x*10)/10); };
  const hdr = document.querySelector("header"); 
  const out = { header: r(hdr), hs: getComputedStyle(hdr).boxShadow, hb: getComputedStyle(hdr).borderBottomWidth };
  out.hdrKids = [...hdr.querySelectorAll("a,button,img,svg")].slice(0, 12).map(e => [e.tagName, (e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,25), r(e), "cy=" + Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height/2)*10)/10]);
  const nav = document.querySelector("nav[aria-label], aside nav") || document.querySelector("nav");
  out.nav = r(nav);
  out.navItems = [...nav.querySelectorAll("a")].map(a => { const ic = a.querySelector("svg"); const sp = [...a.querySelectorAll("span")].pop(); const cs = getComputedStyle(a); return { t: a.textContent.trim(), a: r(a), ic: ic && r(ic), icCy: ic && Math.round((ic.getBoundingClientRect().top+ic.getBoundingClientRect().height/2)*10)/10, aCy: Math.round((a.getBoundingClientRect().top+a.getBoundingClientRect().height/2)*10)/10, fs: cs.fontSize, fw: cs.fontWeight, cur: a.getAttribute("aria-current"), bg: cs.backgroundColor, color: cs.color, box: cs.boxShadow !== "none" ? cs.boxShadow : cs.borderLeft, pad: cs.padding, rad: cs.borderRadius }; });
  out.groupLabels = [...nav.querySelectorAll("h2,h3,p,div")].filter(e => e.children.length===0 && /Content|Visitor app|Project/.test(e.textContent) && e.textContent.length<20).map(e => [e.textContent, r(e), getComputedStyle(e).fontSize, getComputedStyle(e).textTransform, getComputedStyle(e).color]);
  return out;
});
console.log(JSON.stringify(g, null, 0).slice(0, 6000));
await shot(page, "chrome__default__1440");
// tab sweep
const ring = [];
await page.evaluate(() => document.body.focus());
for (let i = 0; i < 28; i++) {
  await page.keyboard.press("Tab");
  const d = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); const b = a.getBoundingClientRect(); return { el: a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 28), ow: cs.outlineWidth, os: cs.outlineStyle, oc: cs.outlineColor, oo: cs.outlineOffset, sh: cs.boxShadow.slice(0, 80), vis: b.width>0, size: [Math.round(b.width), Math.round(b.height)], inView: b.top>=0 && b.bottom<=innerHeight }; });
  ring.push(d);
  if (i < 12 || i % 6 === 0) await page.screenshot({ path: `${new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")}focus_${String(i).padStart(2,"0")}__1440.png`, clip: { x: 0, y: 0, width: 760, height: 480 } });
}
for (const r of ring) console.log(JSON.stringify(r));
await browser.close();
