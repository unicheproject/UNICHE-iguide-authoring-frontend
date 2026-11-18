import { open, go, shot, log, P, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
// force OFF capabilities
await page.route(new RegExp(`/projects/${P}/settings$`), async r => {
  const res = await r.fetch(); const j = await res.json();
  j.capabilities = j.capabilities.filter(c => c !== "EVENTS");
  j.featureConfiguration = { ...j.featureConfiguration, ROUTES: false, GUIDES: false };
  r.fulfill({ response: res, body: JSON.stringify(j) });
});
await go(page, `/projects/${P}/pois`); await page.waitForSelector("nav#workspace-nav",{timeout:60000}); await page.waitForTimeout(2500);
await shot(page, "nav__off-chips__1440");
log("off pills", await page.locator(".off-pill").allInnerTexts());
await page.locator("nav a", { hasText: "Routes" }).hover(); await page.waitForTimeout(300);
await shot(page, "nav__hover-off-item__1440");
await page.locator("nav a", { hasText: "Routes" }).click(); await page.waitForTimeout(1800);
await shot(page, "nav__off-item-opened__1440");
// keyboard tab order from top
await go(page, `/projects/${P}`); await page.waitForSelector("nav#workspace-nav",{timeout:60000}); await page.waitForTimeout(1500);
const order=[]; 
for (let i=0;i<14;i++){ await page.keyboard.press("Tab"); order.push(await focused(page)); }
log(order.join("\n"));
await shot(page, "chrome__tab-focus-nav__1440");
// header focus on user menu
await page.locator("header button[aria-haspopup=menu]").focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(300);
await shot(page, "header__user-menu__1440");
log("focus after open menu", await focused(page));
await page.keyboard.press("ArrowDown"); log("arrowdown", await focused(page));
await page.keyboard.press("Tab"); log("tab in menu", await focused(page));
await page.keyboard.press("Escape"); log("esc", await focused(page));
// Manage members & Help click
await page.getByRole("button",{name:/Manage members/}).click(); await page.waitForTimeout(500);
log("after manage members url", page.url(), "dialogs", await page.locator("[role=dialog]").count(), "pages", context.pages().length);
await page.getByRole("button",{name:"Help"}).click(); await page.waitForTimeout(500);
log("help dialogs", await page.locator("[role=dialog]").count(), "pages", context.pages().length);
await shot(page, "header__after-help-click__1440");
await browser.close();
