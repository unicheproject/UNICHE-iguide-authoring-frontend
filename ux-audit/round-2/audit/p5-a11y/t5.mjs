import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/pois"));
await L.watchLive(page);
const nb = page.getByRole("button", { name: /new point of interest/i });
await nb.focus(); await k.press("Enter"); await page.waitForTimeout(600);
L.log("t5", "dialog open focus:", await L.focus(page));
L.log("t5", "dialog aria", await L.snap(page, "poi-create-dialog", "[role=dialog]"));
await L.shot(page, "poi-create__open__1440");
L.log("t5", "axe dialog", await L.axe(page, "poi-create-dialog"));
// Tab cycle
const t = await L.tabs(page, 14); L.log("t5", "dialog tabs", t);
// Esc empty
await k.press("Escape"); await page.waitForTimeout(400);
L.log("t5", "Esc ->", await L.focus(page), "dialog count", await page.locator("[role=dialog]").count());
// reopen, submit empty
await k.press("Enter"); await page.waitForTimeout(500);
const create = page.getByRole("button", { name: /^create/i });
L.log("t5", "create buttons", await create.allTextContents());
await create.last().focus(); await k.press("Enter"); await page.waitForTimeout(600);
L.log("t5", "empty submit: focus", await L.focus(page));
L.log("t5", "alerts", await page.locator("[role=alert]").allTextContents());
L.log("t5", "live", (await L.liveLog(page)).slice(-3));
await L.shot(page, "poi-create__empty-submit__1440");
L.log("t5", "summary aria", await L.snap(page, "poi-create-errors", "[role=dialog]"));
await browser.close();
