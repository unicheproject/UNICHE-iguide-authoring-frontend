import { open, go, shot, log, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/new?resume=7bb83c0c-d080-4971-84dc-d01cc914a62b"); await page.waitForSelector("text=Pick a Template",{timeout:60000}); await page.waitForTimeout(2500);
await page.getByRole("button", { name: "Continue", exact: true }).click(); await page.waitForTimeout(600);
const rm = page.getByRole("button", { name: /^Remove / });
while (await rm.count()) { await rm.first().click(); await page.waitForTimeout(150); }
await page.getByRole("button",{name:/^Initialize/}).click(); await page.waitForTimeout(2500);
await shot(page, "create__step3-init-zero-langs__1440", true);
log("alerts zero", await page.locator("[role=alert]").allInnerTexts());
log("focus", await focused(page));
// force 503 on initialize
await page.route(/\/initialize$/, r => r.fulfill(problem(503,"SERVICE_UNAVAILABLE")));
await page.getByRole("button",{name:/^Initialize/}).click(); await page.waitForTimeout(1500);
await shot(page, "create__step3-init-503__1440", true);
log("alerts 503", await page.locator("[role=alert]").allInnerTexts());
await page.unroute(/\/initialize$/);
// add languages back: choose via select
const sel = page.locator("#add-language");
const opts = await sel.locator("option").allInnerTexts(); log("options", opts.slice(0,6), opts.length);
await sel.selectOption({ index: 1 }); await page.getByRole("button",{name:"Add",exact:true}).click();
await page.waitForTimeout(300);
await shot(page, "create__step3-one-language__1440", true);
// summary line
log("summary", await page.locator("text=/ · /").last().innerText().catch(()=>""));
await page.getByRole("button",{name:/^Initialize/}).click();
await page.waitForTimeout(6000);
log("url", page.url());
await shot(page, "create__after-initialize__1440");
await page.waitForTimeout(3000);
await shot(page, "create__first-run-dashboard__1440", true);
log("toast", await page.locator("[aria-live=polite]").allInnerTexts());
await browser.close();
