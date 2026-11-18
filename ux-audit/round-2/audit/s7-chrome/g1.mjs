import { open, go, shot, axe, run, CMS, t, focusDesc, AP } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await open("admin", { viewport: "1440" });
  const writes=[]; page.on("request",r=>{ if(r.method()!=="GET" && /localhost:8080|catalogue/.test(r.url())) writes.push(r.method()+" "+r.url().replace(/.*v1/,"")); });
  // block any write as a safety net
  await page.route(/\/(iguide\/api\/v1|api)\/.*/, (r)=> r.request().method()==="GET" ? r.continue() : (writes.push("BLOCKED "+r.request().method()+" "+r.request().url().slice(-60)), r.abort("failed")));
  await go(page, "/projects/new"); await page.waitForTimeout(1500);
  console.log("title", await page.title(), "focus", await focusDesc(page)); console.log((await t(page,"main")).slice(0,900));
  await shot(page,"wizard__step1","1440"); await axe(page,"wizard1");
  for (const vp of []) {}
  console.log("writes", writes);
  await browser.close();
});
