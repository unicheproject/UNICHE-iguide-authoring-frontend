import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp, forcedColors: process.argv[3]==="fc" ? "active":"none" });
await go(page, `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await page.waitForTimeout(3000);
const act = () => page.evaluate(() => { const a=document.activeElement; return a.tagName+"|"+(a.getAttribute("role")||"")+"|"+(a.getAttribute("aria-label")||a.textContent).trim().slice(0,45)+"|sel:"+a.getAttribute("aria-selected")+a.getAttribute("aria-checked")+a.getAttribute("aria-pressed"); });
const btn = page.getByRole("button", { name: /Add Primary image/ }).first(); await btn.scrollIntoViewIfNeeded(); await btn.click(); await page.waitForTimeout(1500);
console.log("open", await act());
if (vp==="zoom200"||vp==="1280") { const dm = await page.evaluate(()=>{const dl=document.querySelector("[role=dialog]"); const body=[...dl.querySelectorAll("*")].find(e=>e.scrollHeight>e.clientHeight+2&&getComputedStyle(e).overflowY!=="visible"); const f=e=>e&&(r=>[Math.round(r.y),Math.round(r.height)])(e.getBoundingClientRect()); return {vh:innerHeight, dlg:f(dl), body:f(body), viewCls: dl.querySelector("summary")?.textContent}}); console.log("dims", JSON.stringify(dm)); }
await shot(page, `picker__open${process.argv[3]==="fc"?"-forced-colors":""}__${vp}`);
if (process.argv[3]==="fc") { await browser.close(); process.exit(0); }
const keys=[]; for (let i=0;i<3;i++){ await page.keyboard.press("Tab"); keys.push(await act()); } console.log("tabs", keys);
await shot(page, `picker__focus-ring__${vp}`);
for (const k of ["ArrowRight","ArrowDown","End","Home"]) { await page.keyboard.press(k); console.log(k, await act()); }
await page.keyboard.press("ArrowRight"); await page.keyboard.press("Space"); console.log("space", await act()); await page.waitForTimeout(500);
console.log("after Enter", await act(), await page.evaluate(()=>document.querySelector("[role=dialog]").innerText.match(/Selected[^\n]*|Nothing selected|[^\n]*selected[^\n]*/i)?.[0]));
await shot(page, `picker__selected__${vp}`);
await page.getByRole("button", { name: "Use this image" }).click(); await page.waitForTimeout(1200);
console.log("after use", await act());
await shot(page, `picker__after-use__${vp}`);
await go(page, `/projects/${P}/media`);
await browser.close();
