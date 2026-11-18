import { open, go, shot, log, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/new"); await page.waitForSelector("#project-name",{timeout:60000}); await page.waitForTimeout(1000);
await page.fill("#project-name", "UX-s7-chrome Project");
await page.getByRole("button", { name: "Create Project", exact: true }).click();
await page.waitForTimeout(3500);
log("url", page.url());
await shot(page, "create__step2-open__1440", true);
log("focus after create", await focused(page));
log("toast", await page.locator("[aria-live=polite]").allInnerTexts());
await shot(page, "create__toast-project-created__1440");
// step 2 details
await page.waitForTimeout(500);
await shot(page, "create__step2-detail__1440", true);
const btns = await page.locator("button:visible").allInnerTexts(); log("buttons", btns.map(s=>s.replace(/\s+/g," ").slice(0,40)).join(" | "));
await browser.close();
