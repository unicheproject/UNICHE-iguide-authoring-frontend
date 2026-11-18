import { open, go, shot, log, P, E, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
const projRe = new RegExp(`/iguide/api/v1/projects/${P}$`);
for (const [st, code] of [[403,"FORBIDDEN"],[404,"NOT_FOUND"],[502,"BAD_GATEWAY"],[503,"SERVICE_UNAVAILABLE"],[504,"GATEWAY_TIMEOUT"],[500,"INTERNAL_ERROR"]]) {
  await page.route(projRe, r => r.fulfill(problem(st, code)));
  await go(page, `/projects/${P}/places`);
  await page.waitForTimeout(1200);
  await shot(page, `project-error__${st}__1440`);
  log(st, (await page.locator("main [role=alert]").innerText().catch(()=>"none")).replace(/\n+/g," | "), "| title:", await page.title());
  await page.unroute(projRe);
}
// 404 at other viewports
await page.route(projRe, r => r.fulfill(problem(404,"NOT_FOUND")));
for (const vp of ["768","zoom200"]) { await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height}); await go(page, `/projects/${P}`); await page.waitForTimeout(800); await shot(page, `project-error__404__${vp}`); }
await page.unroute(projRe);
await page.setViewportSize({width:1440,height:900});
// the picker after 404 (project forgotten)
await go(page, "/"); await page.waitForTimeout(600);
log("projects after forget", await page.locator("main ul li").count());
// slow: loading skeleton
await page.route(projRe, async r => { await new Promise(s=>setTimeout(s,5000)); r.continue(); });
await page.goto(CMS + `/projects/${P}/pois`); await page.waitForTimeout(1500);
await shot(page, "project-loading__skeleton__1440");
await page.waitForTimeout(5000);
await page.unroute(projRe);
// projects list error
const orgRe = /\/iguide\/api\/v1\/organizations/;
await page.route(orgRe, r => r.fulfill(problem(503,"SERVICE_UNAVAILABLE")));
await go(page, "/"); await page.waitForTimeout(1000);
await shot(page, "home__platform-503__1440");
await page.locator("header button[aria-controls=project-switcher-menu]").click(); await page.waitForTimeout(300);
await shot(page, "picker__503__1440");
await page.keyboard.press("Escape");
await page.unroute(orgRe);
await browser.close();
