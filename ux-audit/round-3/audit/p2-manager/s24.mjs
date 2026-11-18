import { open, go, CMS, API } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const POP="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const body=(s,c)=>JSON.stringify({type:"about:blank",title:"SECRET-TITLE",status:s,detail:"SECRET-DETAIL",code:c,requestId:"req-r3-"+s});
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page,"/"); await page.waitForTimeout(500);
for (const [s,c] of [[503,"SERVICE_UNAVAILABLE"],[403,"FORBIDDEN"]]) {
  await page.route(re=>re.toString().startsWith(API)&&/readiness|packages|pending|resources|\/pois|\/places/.test(re.toString())&&!re.toString().endsWith("/projects"), r=>r.fulfill({status:s,contentType:"application/problem+json",body:body(s,c)}));
  await page.goto(CMS+"/projects/"+POP); await page.waitForTimeout(3500);
  await shot(page,`dashboard-populated__error-${s}__1440`);
  console.log(s, (await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,700))).replace(/\n+/g," | "), "| secret leaked:", await page.evaluate(()=>/SECRET/.test(document.body.innerText)));
  await page.unroute(()=>true).catch(()=>{});
  await page.unrouteAll({behavior:"ignoreErrors"});
}
await page.context().setOffline(true);
await page.waitForTimeout(1500); await shot(page,"offline__banner__1440");
console.log("OFFLINE", (await page.evaluate(()=>document.body.innerText)).slice(0,200).replace(/\n+/g," | "));
await browser.close();
