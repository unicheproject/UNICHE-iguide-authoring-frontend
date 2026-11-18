import { start, go, P } from "./common.mjs";
const EB = "/projects/1d6971ce-6391-4da8-848e-8d7466d25128";
const kinds = ["places","pois","routes","guides","events","categories"];
const vp = process.argv[2]??"1440";
const s = await start(vp); const { page } = s;
page.on("request", r=>{ if(r.url().includes("/api/") && !globalThis.seen){ globalThis.seen=1; console.log("API URL sample", r.url()); }});
for (const k of kinds) {
  await go(page, `${EB}/${k}`); await page.waitForTimeout(2500);
  console.log(k,"EMPTYB:", (await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,400));
  await s.shot(`${k}__empty-B`);
}
// error 503 + loading
for (const k of ["pois","places"]) {
  await page.route(new RegExp(`/projects/[^/]+/${k}(\\?.*)?$`), r=>r.fulfill({status:503, contentType:"application/problem+json", body:JSON.stringify({type:"about:blank",title:"Service Unavailable",status:503,code:"PLATFORM_UNAVAILABLE",detail:"UNICHE platform is down",requestId:"req-s9-123"})}));
  await go(page, `${P}/${k}`); await page.waitForTimeout(3000);
  console.log(k,"503:", (await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,300));
  await s.shot(`${k}__error-503`);
  await page.unroute(new RegExp(`/projects/[^/]+/${k}(\\?.*)?$`));
}
// loading skeleton
await page.route(/\/projects\/[^/]+\/pois(\?.*)?$/, async r=>{ await new Promise(x=>setTimeout(x,6000)); r.continue(); });
await go(page, `${P}/pois`); await page.waitForTimeout(1500);
console.log("LOADING:", (await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,300));
await s.shot(`pois__loading-skeleton`);
await s.browser.close();
