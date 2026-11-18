import { open, go, shot, log, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/new?resume=7bb83c0c-d080-4971-84dc-d01cc914a62b"); await page.waitForSelector("text=Pick a Template",{timeout:60000}); await page.waitForTimeout(2500);
await shot(page, "create__step2-resumed__1440", true);
await page.getByRole("button", { name: "Continue", exact: true }).click(); await page.waitForTimeout(800);
await shot(page, "create__step3-open__1440", true);
log("focus after continue", await focused(page));
// remove all langs? test summary & errors: remove default lang
for (const vp of ["1024","768","zoom200"]) { await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height}); await page.waitForTimeout(400); await shot(page, `create__step3__${vp}`, true); }
await page.setViewportSize({width:1440,height:900});
// remove every language
const rm = page.getByRole("button", { name: /^Remove / });
log("remove buttons", await rm.count());
while (await rm.count()) { await rm.first().click(); await page.waitForTimeout(150); }
await page.waitForTimeout(300);
await shot(page, "create__step3-no-languages__1440", true);
log("init disabled?", await page.getByRole("button",{name:/Initialize/}).isDisabled());
log("alerts", await page.locator("[role=alert]").allInnerTexts());
await browser.close();
