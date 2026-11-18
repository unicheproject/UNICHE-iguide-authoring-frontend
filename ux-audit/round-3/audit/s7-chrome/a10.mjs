import { open, go, P, D, shot, settle } from "./h.mjs";
const vp = process.argv[2] || "1440";
const { browser, page } = await open("admin", { viewport: vp });
// Dashboard + status slot
await go(page, `/projects/${P}`); await settle(page, 2500);
const head = await page.evaluate(() => { const h = document.querySelector("main h1"); const p = h.parentElement; const r = e => { const b = e.getBoundingClientRect(); return [b.left,b.top,b.width,b.height].map(x=>Math.round(x*10)/10); }; return { h1: r(h), kids: [...p.parentElement.children].map(c => [c.tagName, c.className.slice(0,40), r(c), c.innerText.replace(/\n/g," | ").slice(0,160)]), sub: [...document.querySelectorAll("main p")].slice(0,2).map(e=>[e.textContent.slice(0,100), r(e), getComputedStyle(e).fontSize]) }; });
console.log("DASH head", JSON.stringify(head));
await shot(page, `dashboard__head__${vp}`);
// helphints
async function hints(label) {
  const hs = await page.locator("button[aria-label^='What is'], button[aria-label^='Why'], button[aria-label^='What does'], button[aria-label^='How']").evaluateAll(es => es.map(e => { const b = e.getBoundingClientRect(); return [e.getAttribute("aria-label"), Math.round(b.width), Math.round(b.height), Math.round(b.left), Math.round(b.top)]; }));
  console.log("HINTS", label, JSON.stringify(hs));
  return hs.length;
}
await hints("dashboard");
const first = page.locator("button[aria-label^='What is'], button[aria-label^='Why'], button[aria-label^='What does'], button[aria-label^='How']");
const n = await first.count();
for (let i = 0; i < Math.min(n, 4); i++) {
  const b = first.nth(i); await b.scrollIntoViewIfNeeded(); await b.click(); await settle(page, 400);
  const pop = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); if (!d) return null; const b = d.getBoundingClientRect(); const cs = getComputedStyle(d); return { text: d.innerText.replace(/\n+/g, " | "), box: [b.left,b.top,b.width,b.height].map(Math.round), side: d.getAttribute("data-side"), rad: cs.borderRadius, pad: cs.padding, fs: cs.fontSize, inVp: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight, focus: document.activeElement.tagName + ":" + document.activeElement.textContent.trim().slice(0,20) }; });
  console.log("HINT", i, await b.getAttribute("aria-label"), JSON.stringify(pop));
  await shot(page, `helphint__dash-${i}__${vp}`);
  await page.keyboard.press("Escape"); await settle(page, 200);
  console.log("  esc focus ->", await page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.tagName));
}
// Dashboard loading skeleton shift on slow net
await page.route("**/iguide/api/v1/**", async r => { if (r.request().resourceType()==="document") return r.continue(); await new Promise(s => setTimeout(s, 2500)); r.continue(); });
await page.evaluate(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
await page.goto(`http://localhost:5173/projects/${P}/pois`);
await page.waitForTimeout(1000);
const sk = await page.evaluate(() => ({ h1: document.querySelector("h1")?.textContent, h1top: document.querySelector("h1")?.getBoundingClientRect().top, status: [...document.querySelectorAll("[role=status]")].map(e=>e.textContent.trim().slice(0,60)), navInert: document.querySelector("nav")?.closest("[inert]") ? "inert" : "live", skeletons: document.querySelectorAll("[class*=skeleton],[class*=animate-pulse],[aria-busy=true]").length, hdrChip: document.querySelector("header")?.innerText.replace(/\n/g," | ").slice(0,80), title: document.title }));
console.log("SKELETON@1s", JSON.stringify(sk)); await shot(page, `loading__poi-skeleton__${vp}`);
await page.waitForTimeout(6000);
console.log("loaded h1top", await page.evaluate(() => [document.querySelector("h1")?.getBoundingClientRect().top, window.__cls]));
await shot(page, `loading__poi-loaded__${vp}`);
await browser.close();
