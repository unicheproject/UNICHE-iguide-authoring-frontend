import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/pois"));
await L.watchLive(page);
L.log("t3", "POI list title", await page.title(), "focus", await L.focus(page));
await L.shot(page, "poi-list__initial__1440");
const s = await L.snap(page, "poi-list", "main");
L.log("t3", s.split("\n").slice(0, 110).join("\n"));
L.log("t3", "axe", await L.axe(page, "poi-list"));
// skip link
await page.evaluate(() => document.activeElement.blur());
await k.press("Tab"); L.log("t3", "tab1", await L.focus(page));
await k.press("Enter"); await page.waitForTimeout(300);
L.log("t3", "after skip", await L.focus(page));
await k.press("Tab"); L.log("t3", "tab after skip", await L.focus(page));
// primary button focus ring
await page.getByRole("button", { name: /new point of interest/i }).focus();
await L.shot(page, "poi-list__new-button-focus__1440");
const el = await page.getByRole("button", { name: /new point of interest/i }).evaluate((e) => { const c = getComputedStyle(e); return { outline: c.outline, offset: c.outlineOffset, shadow: c.boxShadow, bg: c.backgroundColor }; });
L.log("t3", "primary focus style", el);
await browser.close();
