import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const [k,id] of [["pois",IDS.poia],["routes",IDS.route],["guides",IDS.guide],["events",IDS.event],["categories",IDS.category]]){
  await go(page,url(k,id)); await settle(page,1200);
  await page.getByRole("tab",{name:/Ελληνικά/}).click(); await settle(page,400);
  console.log(k,"GREEK sections:", await page.evaluate(()=>[...document.querySelectorAll("section.editor-section")].map(s=>s.id+":"+(s.querySelector("h2")?.textContent.trim().slice(0,40))+" h="+Math.round(s.getBoundingClientRect().height)).join(" | ")));
}
// seeded route with placed stops (read only)
await go(page,`/projects/${P}/routes`); await settle(page,1000);
await page.getByRole("link",{name:/Acropolis Highlights/}).first().click(); await settle(page,2500);
await page.locator("#stops").scrollIntoViewIfNeeded(); await settle(page,800);
await shot(page,"route__seed-map__1440");
console.log("MAP:", await page.locator("#stops").innerText().then(s=>s.replace(/\n+/g," | ").slice(0,900)));
console.log(await page.evaluate(()=>{const m=document.querySelector(".route-map-pin"); const r=m.getBoundingClientRect(); const ps=getComputedStyle(m); return "map pin "+Math.round(r.width)+"x"+Math.round(r.height)+" pos="+ps.position+" top="+ps.top}));
await page.getByRole("button",{name:/Show as list/}).click().catch(()=>{}); await settle(page,400);
await shot(page,"route__seed-map-list__1440");
await browser.close();
