import { open, go, shot, POP, EMPTY_D, axe, t, AP, problem } from "./lib.mjs";
for (const vp of ["1280","1024","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${POP}/media`);
  await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2500);
  await shot(page,"library__grid-default",vp);
  await page.getByRole("button",{name:/^List/}).click(); await page.waitForTimeout(600);
  const m = await page.evaluate(()=>({ hs: document.documentElement.scrollWidth>innerWidth || [...document.querySelectorAll("main *")].some(e=>e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX!=="visible"), cols:[...document.querySelectorAll("th")].map(e=>e.textContent.trim().slice(0,12)+":"+Math.round(e.getBoundingClientRect().width)).join(" ")}));
  console.log(vp, JSON.stringify(m));
  await shot(page,"library__list-default",vp);
  await page.getByRole("button",{name:/^Grid/}).click();
  await browser.close();
}
// empty, loading, 503, forced colors, offline
{ const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${EMPTY_D}/media`);
  await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2500);
  console.log("EMPTY", (await t(page,"main")).replace(/\n+/g," | ").slice(0,700));
  await shot(page,"library__empty-D","1440"); await axe(page,"empty");
  await page.getByRole("button",{name:"Upload files"}).last().click(); await page.waitForTimeout(600);
  console.log("empty upload focus ok"); await page.keyboard.press("Escape");
  // loading
  await page.route(/\/assets(\?|$)/, async r => { if(r.request().method()==="GET"){ await new Promise(x=>setTimeout(x,5000)); } return r.continue(); });
  await go(page, `/projects/${POP}/media`);
  await page.waitForTimeout(1500);
  await shot(page,"library__loading","1440");
  console.log("LOADING", (await t(page,"main")).replace(/\n+/g," | ").slice(0,300));
  await page.unroute(/\/assets(\?|$)/);
  await page.route(/\/assets(\?|$)/, r => r.request().method()==="GET" ? r.fulfill(problem(503,"SERVICE_UNAVAILABLE")) : r.continue());
  await go(page, `/projects/${POP}/media`); await page.waitForTimeout(2500);
  console.log("503", (await t(page,"main")).replace(/\n+/g," | ").slice(0,600));
  await shot(page,"library__error-503","1440"); await axe(page,"503");
  await page.unroute(/\/assets(\?|$)/);
  const rb = page.getByRole("button",{name:/try again|retry|reload/i}); console.log("retry btn", await rb.count());
  await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1280", forcedColors: "active" });
  await go(page, `/projects/${POP}/media`); await page.waitForTimeout(3000);
  await shot(page,"library__forced-colors","1280");
  await page.getByRole("button",{name:/^List/}).click(); await page.waitForTimeout(500);
  await shot(page,"library__list-forced-colors","1280");
  await go(page, `/projects/${POP}/media/ef5b3867-eb1a-4ded-b8f2-89d829d9d041`); await page.waitForTimeout(2500);
  await shot(page,"asset-editor__forced-colors","1280");
  await browser.close(); }
