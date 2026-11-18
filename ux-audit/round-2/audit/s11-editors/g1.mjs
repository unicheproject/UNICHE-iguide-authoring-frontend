import { open, go, rec, P, ready, shot } from "./h.mjs";
const S="ux-audit/round-2/audit/s11-editors/shots/";
// forced colors
{ const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
  for (const [k,p] of [["category",`categories/${rec.category}`],["event",`events/${rec.event}`],["guide",`guides/${rec.guide}`],["route",`routes/${rec.route}`]]) { await go(page,`/projects/${P}/${p}`); await ready(page,1200); await page.screenshot({path:S+`${k}-editor__forced-colors__1440.png`}); }
  await browser.close(); }
// error states on event
const { browser, page } = await open("curator", { viewport: "1440" });
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[aria-live],[role=alert]")].map(e=>e.textContent.trim()).filter(Boolean));
await go(page,`/projects/${P}/events/${rec.event}`); await ready(page,1200);
let mode="422";
await page.route(/\/events\/[0-9a-f-]+(\/occurrences.*)?$/, async (route)=>{
  const m=route.request().method(); if (m==="GET") return route.continue();
  if (mode==="422") return route.fulfill({status:422,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Validation failed",status:422,code:"VALIDATION_FAILED",requestId:"req-r2s11-422",errors:[{field:"translations.en.title",code:"TOO_LONG",message:"Title is too long"}]})});
  if (mode==="409") return route.fulfill({status:409,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Conflict",status:409,code:"VERSION_CONFLICT",requestId:"req-r2s11-409"})});
  return route.fulfill({status:503,contentType:"application/problem+json",body:JSON.stringify({title:"Unavailable",status:503,code:"UNAVAILABLE",requestId:"req-r2s11-503"})});
});
await page.getByLabel("Title").first().fill("UX-R2-s11 Event edited");
for (mode of ["422","409","503"]) {
  await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
  console.log(mode, "dialogs", await page.getByRole("dialog").count(), JSON.stringify((await live()).slice(0,6)));
  console.log(" focus:", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,110)));
  await page.screenshot({path:S+`event-editor__save-${mode}__1440.png`});
  if (await page.getByRole("dialog").count()) { console.log((await page.getByRole("dialog").innerText()).replace(/\n+/g," / ").slice(0,400)); await page.keyboard.press("Escape"); await page.waitForTimeout(300); }
}
await page.context().setOffline(true); await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
console.log("offline", JSON.stringify((await live()).slice(0,6)));
await page.screenshot({path:S+`event-editor__save-offline__1440.png`});
await browser.close();
