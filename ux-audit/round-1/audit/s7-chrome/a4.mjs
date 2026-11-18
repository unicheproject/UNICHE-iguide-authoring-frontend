import { open, go, shot, log, P, E, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.waitForSelector("nav#workspace-nav",{timeout:60000}); await page.waitForTimeout(2500);
await shot(page, "workspace__pois-list__1440");
// offline
await context.setOffline(true);
await page.locator("nav#workspace-nav").getByRole("link", { name: "Places", exact: true }).click();
await page.waitForTimeout(1500);
await shot(page, "offline__banner__1440");
log("alert", await page.locator("[role=alert]").allInnerTexts());
for (const vp of ["1024","768","zoom200"]) { await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height}); await page.waitForTimeout(300); await shot(page, `offline__banner__${vp}`); }
await page.setViewportSize({width:1440,height:900});
// sticky? scroll
log("banner pos", await page.locator("[role=alert]").first().boundingBox());
await context.setOffline(false);
await page.getByRole("button",{name:/Check again/}).click().catch(()=>log("no check btn"));
await page.waitForTimeout(1500);
log("banner after", await page.locator("[role=alert]").count());
// open the first place for editor, check unsaved + project switch
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1200);
const first = page.locator("main a[href*='/pois/']").first();
log("first poi", await first.innerText().catch(()=>"?"));
await first.click(); await page.waitForTimeout(1500);
await shot(page, "workspace__poi-editor__1440");
const input = page.locator("main input[type=text], main input:not([type])").first();
await input.click(); await page.keyboard.type(" UNSAVED"); 
await page.waitForTimeout(300);
// switch project through the picker
await page.locator("header button[aria-controls=project-switcher-menu]").click(); await page.waitForTimeout(300);
await page.locator("#project-switcher-menu a", { hasText: "UX Audit – Empty B" }).click();
await page.waitForTimeout(1500);
await shot(page, "project-switch__with-unsaved__1440");
log("url after switch", page.url(), "dialogs", await page.locator("[role=dialog],[role=alertdialog]").count());
await browser.close();
