import * as L from "./lib.mjs";
import { resolve } from "node:path";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
const POI = "35d91cba-d64a-43ce-9773-1e472226d028";
await L.nav(page, L.P("/pois/" + POI), 1500);
await L.watchLive(page);
await page.getByRole("button", { name: /Add primary image/ }).focus(); await k.press("Enter"); await page.waitForTimeout(1500);
// select a tile via keyboard
const tile = page.getByRole("button", { name: /^meander-border/ });
await tile.focus(); await k.press("Enter"); await page.waitForTimeout(500);
L.log("t14", "after select tile: focus", await L.focus(page), "pressed", await tile.getAttribute("aria-pressed"), "live", (await L.liveLog(page)).slice(-2));
L.log("t14", "footer", await page.locator("[role=dialog] [role=status]").allTextContents());
await L.shot(page, "asset-picker__tile-selected__1440");
const use = page.getByRole("button", { name: /^Use /i }); L.log("t14", "use btn", await use.allTextContents());
await use.first().focus(); await k.press("Enter"); await page.waitForTimeout(1500);
L.log("t14", "after attach: focus", await L.focus(page), "dialogs", await page.locator("[role=dialog]").count(), "live", (await L.liveLog(page)).slice(-3));
await L.shot(page, "poi-editor__image-attached__1440");
// Upload via picker
await page.getByRole("button", { name: /primary image|Change|Replace/i }).first().focus().catch(()=>{});
L.log("t14", "media section buttons", await page.locator("#media button").allTextContents());
await browser.close();
