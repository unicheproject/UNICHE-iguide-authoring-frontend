import { start, goEd, go, P, poi, place, MINE } from "./common.mjs";
const s = await start("1440"); const { page, context } = s;
const txt = async () => (await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,300);
const id = poi("pediment").id;
for (const st of [404, 403, 503]) {
  await page.route("**/iguide/api/v1/projects/*/pois/"+id, r => r.request().method()==="GET" ? r.fulfill({status: st, contentType:"application/problem+json", body: JSON.stringify({code:"X", title:"t", detail:"d", status: st, requestId:"rq-"+st})}) : r.continue());
  await go(page, P+"/pois/"+id); await page.waitForTimeout(2500); console.log(st, await txt()); await s.shot("load-error__"+st);
  await page.unroute("**/iguide/api/v1/projects/*/pois/"+id);
}
// slow load skeleton
await page.route("**/iguide/api/v1/projects/*/pois/"+id, async r => { await new Promise(res=>setTimeout(res,4000)); r.continue(); });
await go(page, P+"/pois/"+id).catch(()=>{}); await page.waitForTimeout(600); await s.shot("loading-skeleton"); console.log("skeleton:", await txt());
await page.unroute("**/iguide/api/v1/projects/*/pois/"+id);
// archived
await goEd(page, "/pois/"+poi("copies").id); await s.shot("poi-archived__top"); console.log("archived:", await txt());
console.log("archived inputs disabled:", await page.evaluate(()=>[...document.querySelectorAll("main input,main textarea,main select")].filter(e=>e.disabled||e.readOnly).length+"/"+document.querySelectorAll("main input,main textarea,main select").length));
// offline
await goEd(page, "/pois/"+MINE.poi2);
await page.getByLabel("Summary",{exact:false}).first().fill("offline test");
await context.setOffline(true); await page.waitForTimeout(1500); await s.shot("offline__dirty"); 
console.log("offline Save disabled:", await page.getByRole("button",{name:/^save$/i}).isDisabled(), "banner:", (await page.locator("[role=status],[role=alert]").allInnerTexts()).join("|").slice(0,200));
await context.setOffline(false);
await s.browser.close();
