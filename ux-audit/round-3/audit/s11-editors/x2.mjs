import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
for (const vp of ["1440","768"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page,`/projects/${P}/routes`); await settle(page,1000);
await page.getByRole("link",{name:/Acropolis Highlights/}).first().click(); await settle(page,2500);
await page.locator(".route-map-pin").scrollIntoViewIfNeeded(); await page.evaluate(()=>window.scrollBy(0,-160)); await settle(page,900);
await shot(page,`route__seed-map-v2__${vp}`);
console.log(vp, await page.evaluate(()=>{const pins=[...document.querySelectorAll(".leaflet-marker-icon")].map(e=>{const r=e.getBoundingClientRect();return e.textContent.trim()+"@"+Math.round(r.x)+","+Math.round(r.y)+" "+Math.round(r.width)+"x"+Math.round(r.height)}); const leg=document.querySelector(".route-map-pin")?.innerText.replace(/\n+/g," | ").slice(0,400); return {pins,leg}}));
await browser.close(); }
