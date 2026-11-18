import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const s = await start(vp); const { page } = s;
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
await page.fill("#media-search","UX-s13-media square"); await page.waitForTimeout(400);
await page.locator("main ul li a").first().click(); await page.waitForSelector("h1"); await page.waitForTimeout(2200);
const url = page.url();
await s.shot("editor__image-draft");
console.log(vp, JSON.stringify(await page.evaluate(()=>{const m=document.querySelector("main"); const t=document.querySelector("textarea"); const r=t?.getBoundingClientRect(); return {sw:m.scrollWidth, cw:m.clientWidth, altTop: r&&Math.round(r.top), vh:innerHeight, save:(()=>{const b=[...document.querySelectorAll("button")].find(b=>/^save$/i.test(b.innerText.trim())); const q=b?.getBoundingClientRect(); return q&&[Math.round(q.top),Math.round(q.width)]})()}})));
if (vp==="1440") {
  // empty name, save
  await page.getByLabel("Name").fill(""); await page.getByRole("button",{name:/^Save$/}).click(); await page.waitForTimeout(800);
  await s.shot("editor__empty-name");
  console.log("empty name:", await page.evaluate(()=>[...document.querySelectorAll("[role=alert]")].map(e=>e.textContent.trim().slice(0,200)).join("~")), "focus", await page.evaluate(()=>document.activeElement.id));
  await page.reload(); await page.waitForTimeout(2500);
  // 409
  await page.route(/\/assets\/[0-9a-f-]+$/, async r=>{ if (r.request().method()==="PUT") return r.fulfill({status:409,contentType:"application/problem+json",body:JSON.stringify({type:"urn:uniche:iguide:problem:VERSION_CONFLICT",title:"Conflict",status:409,detail:"The asset changed.",code:"VERSION_CONFLICT",requestId:"cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee"})}); r.continue(); });
  await page.getByLabel("Title").first().fill("conflict test"); await page.getByRole("button",{name:/^Save$/}).click(); await page.waitForTimeout(1200);
  await page.evaluate(()=>{document.querySelector("main").scrollTop=0}); await s.shot("editor__409");
  console.log("409:", await page.evaluate(()=>[...document.querySelectorAll("[role=alert]")].map(e=>e.textContent.trim().slice(0,300)).join("~")));
  await page.unroute(/\/assets\/[0-9a-f-]+$/);
  // 404
  await go(page, `${P}/media/00000000-0000-0000-0000-000000000000`); await page.waitForTimeout(3000); await s.shot("editor__404");
  console.log("404:", (await page.evaluate(()=>document.querySelector("main").innerText)).replace(/\n+/g," | ").slice(0,300));
}
await s.browser.close();
