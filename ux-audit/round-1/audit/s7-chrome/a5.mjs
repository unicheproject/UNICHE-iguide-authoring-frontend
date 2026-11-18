import { open, go, shot, log, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/"); await page.waitForTimeout(1500);
await shot(page, "home__admin__1440");
await go(page, "/projects/new"); await page.waitForSelector("#project-name",{timeout:60000}); await page.waitForTimeout(1500);
await shot(page, "create__step1-initial__1440", true);
log("focus", await focused(page));
log("org options", await page.locator("#project-org option").allInnerTexts().catch(()=>"?"));
// empty submit
await page.getByRole("button", { name: "Create Project", exact: true }).click().catch(e=>log("no submit btn", e.message.slice(0,80)));
await page.waitForTimeout(500);
await shot(page, "create__step1-empty-submit__1440", true);
log("focus after empty", await focused(page));
log("alerts", await page.locator("[role=alert]").allInnerTexts());
// invalid slug
await page.fill("#project-name", "UX-s7-chrome Project");
log("slug autofill", await page.inputValue("#project-slug"));
await page.fill("#project-slug", "Bad Slug!");
await page.getByRole("button", { name: "Create Project", exact: true }).click();
await page.waitForTimeout(500);
await shot(page, "create__step1-invalid-slug__1440");
log("focus after invalid", await focused(page));
// 409
await page.fill("#project-slug", "ux-audit-empty");
await page.getByRole("button", { name: "Create Project", exact: true }).click();
await page.waitForTimeout(2500);
await shot(page, "create__step1-409__1440");
log("alerts409", await page.locator("[role=alert]").allInnerTexts());
// 503 forced
await page.route(/\/organizations\/[^/]+\/projects$/, r => r.request().method()==="POST" ? r.fulfill(problem(503,"SERVICE_UNAVAILABLE")) : r.continue());
await page.fill("#project-slug", "ux-s7-chrome-project");
await page.getByRole("button", { name: "Create Project", exact: true }).click();
await page.waitForTimeout(1500);
await shot(page, "create__step1-503__1440");
log("alerts503", await page.locator("[role=alert]").allInnerTexts());
await page.unroute(/\/organizations\/[^/]+\/projects$/);
for (const vp of ["1024","768","zoom200"]) { await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height}); await page.waitForTimeout(300); await shot(page, `create__step1__${vp}`, true); }
await page.setViewportSize({width:1440,height:900});
await browser.close();
