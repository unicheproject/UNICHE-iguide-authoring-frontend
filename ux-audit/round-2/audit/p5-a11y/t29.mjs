import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/preview"), 2500);
await L.watchLive(page);
// skip preview
await page.getByRole("link", { name: "Skip preview" }).focus(); await k.press("Enter"); await page.waitForTimeout(400);
L.log("t29", "after Skip preview: focus", await L.focus(page), "hash", await page.evaluate(() => location.hash));
await page.getByRole("button", { name: "Interact with the preview" }).focus(); await k.press("Enter"); await page.waitForTimeout(600);
L.log("t29", "after Interact: focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
await L.shot(page, "preview__interact-on__1440");
const t = await L.tabs(page, 14); L.log("t29", "tabs inside", t);
// find the escape path: Esc? 
await k.press("Escape"); await page.waitForTimeout(400);
L.log("t29", "Esc: focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-1));
await page.getByRole("button", { name: /Stop interacting|Interact/i }).first().focus().catch(() => {});
L.log("t29", "interact btn now", await page.getByRole("button", { name: /interact/i }).allTextContents());
// Tab out of frame to chrome
await page.getByRole("button", { name: "Interact with the preview" }).first().focus().catch(()=>{});
// press Interact again then Shift+Tab out
await k.press("Enter"); await page.waitForTimeout(300);
const out = await L.tabs(page, 80);
const idx = out.findIndex((x) => /Skip to content|body/.test(x));
L.log("t29", "tabs until leaving frame to chrome at", idx + 1, out[idx], "last 3", out.slice(-3));
// Shift+Tab from first element inside
await browser.close();
