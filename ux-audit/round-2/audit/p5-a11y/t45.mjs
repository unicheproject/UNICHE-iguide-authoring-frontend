import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/pois"), 1200);
const mb = page.getByRole("button", { name: /^Actions for UX-R2-p5 Keyboard POI/ });
await mb.focus(); await k.press("Enter"); await page.waitForTimeout(300);
await page.getByRole("menuitem", { name: /Move to bottom/ }).focus(); await k.press("Enter"); await page.waitForTimeout(1500);
L.log("t45", "moved to bottom: focus", await L.focus(page));
await browser.close();
