import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const EMPTY_B = "1d6971ce-6391-4da8-848e-8d7466d25128";
const s = await start(vp); const { page, context } = s;
const prob = (st,code,detail)=>({status:st,contentType:"application/problem+json",body:JSON.stringify({type:"urn:uniche:iguide:problem:"+code,title:code,status:st,detail,code,requestId:"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"})});
// empty B
await go(page, `/projects/${EMPTY_B}/media`); await page.waitForTimeout(3500); await s.shot("library__empty-B");
console.log("emptyB:", (await page.evaluate(()=>document.querySelector("main").innerText)).replace(/\n+/g," | ").slice(0,500));
// skeleton (slow)
await page.route(/\/projects\/[^/]+\/assets\?/, async r=>{ await new Promise(x=>setTimeout(x,5000)); r.continue(); });
await go(page, `${P}/media`); await page.waitForTimeout(1200); await s.shot("library__loading");
console.log("loading a11y:", await page.evaluate(()=>[...document.querySelectorAll("main [role=status]")].map(e=>e.getAttribute("aria-label")+":"+e.textContent.length).join()));
await page.unroute(/\/projects\/[^/]+\/assets\?/);
for (const [st,code,detail] of [[403,"FORBIDDEN","You may not view media."],[404,"NOT_FOUND","Not found."],[502,"BAD_GATEWAY","Upstream"],[503,"SERVICE_UNAVAILABLE","Down"],[401,"UNAUTHENTICATED","expired"]]) {
  const h = r=>r.fulfill(prob(st,code,detail));
  await page.route(/\/projects\/[^/]+\/assets\?/, h);
  await go(page, `${P}/media`); await page.waitForTimeout(2500); await s.shot("library__error-"+st);
  console.log(st, (await page.evaluate(()=>document.querySelector("main")?.innerText||document.body.innerText)).replace(/\n+/g," | ").slice(0,300));
  await page.unroute(/\/projects\/[^/]+\/assets\?/, h);
}
// offline
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
await context.setOffline(true); await page.waitForTimeout(1500);
await page.getByRole("button",{name:"Upload"}).click(); await page.waitForTimeout(500);
await page.locator("input[type=file]").setInputFiles(new URL("./files/UX-s13-media square.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")); await page.waitForTimeout(2500);
await s.shot("upload__offline");
console.log("offline:", (await page.evaluate(()=>document.querySelector("[role=dialog]").innerText)).replace(/\n+/g," | ").slice(-300));
await context.setOffline(false);
await s.browser.close();
