import { start, go, P } from "./common.mjs";
const vp = process.argv[2]??"1440";
const s = await start(vp); const { page } = s;
const prob=(status,code,detail)=>({status, contentType:"application/problem+json", body:JSON.stringify({type:"about:blank",title:"x",status,code,detail,requestId:"req-s9-123"})});
const body = async()=> (await page.locator("main").first().innerText({timeout:5000}).catch(()=>"NO MAIN: "+page.url())).replace(/\n+/g," | ").slice(0,350);
for (const [k,status,code] of [["pois",503,"PLATFORM_UNAVAILABLE"],["places",500,"INTERNAL_ERROR"],["routes",403,"FORBIDDEN"],["guides",404,"NOT_FOUND"],["events",504,"PLATFORM_UNAVAILABLE"],["categories",401,"UNAUTHENTICATED"]]) {
  const re = new RegExp(`:8080/.*/projects/[^/]+/${k}(\\?.*)?$`);
  await page.route(re, r=>r.fulfill(prob(status,code,"Mocked "+status)));
  await go(page, `${P}/${k}`); await page.waitForTimeout(3500);
  console.log(k,status,"=>", page.url().replace(P,""), await body());
  await s.shot(`${k}__error-${status}`);
  await page.unroute(re);
}
// loading skeleton
await page.route(/:8080\/.*\/projects\/[^/]+\/pois(\?.*)?$/, async r=>{ await new Promise(x=>setTimeout(x,5000)); r.continue(); });
await go(page, `${P}/pois`); await page.waitForTimeout(1200);
console.log("LOADING:", await body());
await s.shot(`pois__loading-skeleton`);
await page.unrouteAll({behavior:"ignoreErrors"});
// empty places/pois mocked
for (const k of ["places","pois"]) {
  const re = new RegExp(`:8080/.*/projects/[^/]+/${k}(\\?.*)?$`);
  await page.route(re, r=>r.request().method()==="GET"? r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({items:[],page:0,size:200,totalElements:0,totalPages:0})}) : r.continue());
  await go(page, `${P}/${k}`); await page.waitForTimeout(2500);
  console.log(k,"MOCK-EMPTY:", await body());
  await s.shot(`${k}__empty-mocked`);
  await page.unroute(re);
}
// offline
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr");
await page.context().setOffline(true); await page.waitForTimeout(1500);
await page.getByRole("button",{name:/^Deactivate/i}).first().click().catch(()=>{});
await page.waitForTimeout(800);
await s.shot(`pois__offline`);
console.log("OFFLINE:", await body());
await s.browser.close();
