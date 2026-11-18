import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const base = `/projects/${P}`;
const out = {};
const FP = ["backgroundColor","color","borderTopColor","outlineStyle","outlineColor","boxShadow","opacity"];
const sty = (loc, props=FP) => loc.evaluate((el, props) => { const cs = getComputedStyle(el); const o = {}; for (const p of props) o[p] = cs[p]; const r = el.getBoundingClientRect(); o.rect=[r.x,r.y,r.width,r.height].map(v=>+v.toFixed(1)); return o; }, props);
// ---- A. normal session: hover states with delay, toast, error alert, skeleton
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `${base}/places`); await page.waitForTimeout(1800);
  // hover colours (after transition)
  const probes = { primary: page.getByRole("button", { name: /^New place/i }).first(), secondary: page.locator("main button[data-variant=secondary]").first(), ghost: page.locator("main button[data-variant=ghost]").first() };
  out.hover = {};
  for (const [n, loc] of Object.entries(probes)) { if (!(await loc.count())) { out.hover[n] = "none"; continue; } const rest = await sty(loc); await loc.hover(); await page.waitForTimeout(350); const hov = await sty(loc); await page.mouse.down(); await page.waitForTimeout(350); const act = await sty(loc); await page.mouse.move(2,2); await page.mouse.up(); await page.keyboard.press("Escape"); await page.waitForTimeout(300); out.hover[n] = { rest: rest.backgroundColor, hover: hov.backgroundColor, active: act.backgroundColor }; }
  // create a place to get a success toast
  await go(page, `${base}/places?create=1`); await page.waitForTimeout(1500);
  const dlg = page.locator('[role=dialog]').first();
  await dlg.locator("input").first().fill("UX-R3-design-system place");
  await page.screenshot({ path: "shots/places__create-filled__1440.png" });
  await dlg.getByRole("button", { name: /create and open/i }).click();
  await page.waitForTimeout(700);
  const toasts = page.locator('[class*="z-toast"] > div');
  out.toastCount = await toasts.count();
  if (out.toastCount) { out.toast = await toasts.first().evaluate((e) => { const cs=getComputedStyle(e); const r=e.getBoundingClientRect(); const strong=e.querySelector("strong"); const sv=e.querySelector("svg"); return { role:e.getAttribute("role"), text:e.textContent.trim().slice(0,80), icon:(sv?.getAttribute("class")||"").slice(0,80), svgClass: sv?.outerHTML.slice(0,120), titleColor:getComputedStyle(strong).color, titleSize:getComputedStyle(strong).fontSize, bg:cs.backgroundColor, border:cs.borderTopColor, shadow:cs.boxShadow, rect:[r.x,r.y,r.width,r.height], z:getComputedStyle(e.parentElement).zIndex, animation:cs.animationName+" "+cs.animationDuration }; }); }
  await page.screenshot({ path: "shots/placeEditor__created-toast__1440.png" });
  out.afterCreateUrl = page.url();
  await page.waitForTimeout(1500);
  // sticky stack measurements in editor
  out.editorStack = await page.evaluate(() => [...document.querySelectorAll("*")].filter((e) => { const cs=getComputedStyle(e); return (cs.position==="sticky"||cs.position==="fixed") && e.getBoundingClientRect().width>0; }).map((e) => { const cs=getComputedStyle(e), r=e.getBoundingClientRect(); return { el:e.tagName+"."+(e.className+"").slice(0,50), pos:cs.position, z:cs.zIndex, top:cs.top, rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)], shadow: cs.boxShadow==="none"?"": "shadow" }; }));
  // error alert: places list 500
  await page.route(`**/projects/${P}/places*`, (r) => r.request().method()==="GET" && r.request().resourceType()!=="document" ? r.fulfill({ status: 500, contentType: "application/problem+json", body: JSON.stringify({ type:"about:blank", title:"Internal Server Error", status:500, detail:"SECRET", code:"INTERNAL", requestId:"req-r3-ds-0001" }) }) : r.continue());
  await go(page, `${base}/places`); await page.waitForTimeout(2200);
  out.errorAlert = await page.evaluate(() => { const a=document.querySelector('main [role=alert]'); if(!a) return null; const cs=getComputedStyle(a); return { text:a.textContent.trim().slice(0,160), bg:cs.backgroundColor, border:cs.borderTopColor, radius:cs.borderRadius, pad:cs.padding, cls:(a.className+"").slice(0,80) }; });
  await page.screenshot({ path: "shots/places__error-500__1440.png" });
  await page.unroute(`**/projects/${P}/places*`);
  // skeleton: delay
  await page.route(`**/projects/${P}/places*`, async (r) => { if (r.request().resourceType()==="document") return r.continue(); await new Promise((x)=>setTimeout(x,4000)); r.continue(); });
  await go(page, `${base}/places`).catch(()=>{}); await page.waitForTimeout(700);
  out.skeleton = await page.evaluate(() => [...document.querySelectorAll('[class*=skeleton],[class*=animate-skeleton]')].slice(0,4).map((e)=>{ const cs=getComputedStyle(e); return {cls:(e.className+"").slice(0,60), bg:cs.backgroundColor, anim:cs.animationName+" "+cs.animationDuration, radius:cs.borderRadius}; }));
  await page.screenshot({ path: "shots/places__loading__1440.png" });
  await browser.close();
}
// ---- B. reduced motion: dialog animations
{
  const { browser, page } = await open("admin", { viewport: "1440", reducedMotion: "reduce" });
  await go(page, `${base}/places?create=1`); await page.waitForTimeout(150);
  out.reduced = await page.evaluate(() => document.getAnimations().map((a)=>({n:a.animationName||a.transitionProperty, d:a.effect?.getTiming().duration, it:a.effect?.getTiming().iterations})));
  out.reducedPanel = await page.evaluate(() => { const d=document.querySelector('[role=dialog]'); const cs=getComputedStyle(d); return { name: cs.animationName, dur: cs.animationDuration, overlay: getComputedStyle(d.parentElement).animationName + " " + getComputedStyle(d.parentElement).animationDuration }; });
  await go(page, `${base}/places`); await page.waitForTimeout(1500);
  out.reducedList = await page.evaluate(() => ({ anims: document.getAnimations().length, transitionsOnButton: getComputedStyle(document.querySelector("main button")).transitionDuration }));
  await browser.close();
}
// ---- C. forced colours
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `${base}/places`); await page.waitForTimeout(1800);
  await page.screenshot({ path: "shots/places__forced-colors__1440.png" });
  try { const t = page.locator("tbody tr").first().getByRole("button", { name: /actions|menu|more/i }).first(); await t.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(400); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(200); await page.screenshot({ path: "shots/places__forced-colors-menu__1440.png" });
    out.fcMenu = await page.locator("[role=menu]").first().evaluate((e)=>({border:getComputedStyle(e).borderTopColor+" "+getComputedStyle(e).borderTopWidth})); await page.keyboard.press("Escape"); } catch(e){ out.fcMenu=String(e).slice(0,100); }
  await go(page, `${base}/places?create=1`); await page.waitForTimeout(1500);
  out.fcDialog = await page.locator("[role=dialog]").first().evaluate((e)=>({border:getComputedStyle(e).borderTopColor+" "+getComputedStyle(e).borderTopWidth}));
  await page.screenshot({ path: "shots/places__forced-colors-dialog__1440.png" });
  await browser.close();
}
// ---- D. narrow viewports: places list + editor
for (const vp of ["768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const [n, p] of [["places", `${base}/places`], ["dashboard", base]]) { await go(page, p); await page.waitForTimeout(1800); out[`${n}_${vp}`] = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, mainSw: document.querySelector("main")?.scrollWidth, mainCw: document.querySelector("main")?.clientWidth, small: [...document.querySelectorAll("button,a[href],input,select")].filter((e)=>{const r=e.getBoundingClientRect(); return r.width>0&&(r.height<32||r.width<32)&&!e.closest(".sr-only");}).length })); await page.screenshot({ path: `shots/${n}__default__${vp}.png` }); }
  await browser.close();
}
writeFileSync("states2.json", JSON.stringify(out, null, 1)); console.log("ok");
