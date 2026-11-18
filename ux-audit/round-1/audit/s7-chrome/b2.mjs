import { open, go, shot, log, P, focused, VIEWPORTS } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.waitForSelector("nav#workspace-nav",{timeout:60000}); await page.waitForTimeout(2500);
const nb = page.getByRole("button",{name:/New Point of Interest/i});
await nb.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(600);
await shot(page, "dialog__new-poi-open__1440");
log("focus in dialog", await focused(page));
log("dialog attrs", await page.evaluate(()=>{const d=document.querySelector("[role=dialog]"); return d? `aria-modal=${d.getAttribute("aria-modal")} labelledby=${d.getAttribute("aria-labelledby")} `: "none"}));
for (let i=0;i<8;i++){ await page.keyboard.press("Tab"); log("tab", await focused(page)); }
// nested header reachable?
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
log("after esc", await focused(page), "dialogs", await page.locator("[role=dialog]").count());
// open again, submit empty
await nb.click(); await page.waitForTimeout(500);
const primary = page.locator("[role=dialog] button.dialog-primary, [role=dialog] button:has-text('Create')").first();
log("primary", await primary.innerText());
await primary.click(); await page.waitForTimeout(600);
await shot(page, "dialog__new-poi-empty-submit__1440");
log("alerts", await page.locator("[role=dialog] [role=alert]").allInnerTexts(), "focus", await focused(page));
// click backdrop
await page.mouse.click(10, 500); await page.waitForTimeout(400);
log("after backdrop", await page.locator("[role=dialog]").count());
// zoom/768 of dialog
await nb.click(); await page.waitForTimeout(400);
for (const vp of ["768","zoom200"]) { await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height}); await page.waitForTimeout(400); await shot(page, `dialog__new-poi-open__${vp}`); }
await browser.close();
