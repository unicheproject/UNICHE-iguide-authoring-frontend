import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "768" });
const k = page.keyboard;
await L.nav(page, L.P("/pois"), 1500);
await L.watchLive(page);
L.log("t30", "768 landmarks/nav visible?", await page.evaluate(() => [...document.querySelectorAll("nav")].map((n) => n.getAttribute("aria-label") + ":" + (n.getBoundingClientRect().width > 0))));
await L.shot(page, "poi-list__768__768");
L.log("t30", "first tabs", await L.tabs(page, 6));
const menu = page.getByRole("button", { name: /^menu|navigation|open menu/i }).first();
L.log("t30", "menu btn", await menu.evaluate((e) => [...e.attributes].map((a) => a.name + "=" + a.value.slice(0, 40)).join(" ")));
await menu.focus(); await k.press("Enter"); await page.waitForTimeout(600);
L.log("t30", "drawer open: focus", await L.focus(page));
await L.shot(page, "drawer__open__768");
L.log("t30", "drawer aria", (await L.snap(page, "drawer", "[role=dialog]")).split("\n").slice(0, 30).join("\n"));
L.log("t30", "tabs in drawer", await L.tabs(page, 24));
await k.press("Escape"); await page.waitForTimeout(500);
L.log("t30", "Esc: focus", await L.focus(page), "dialog count", await page.locator("[role=dialog]").count());
// open and choose link by keyboard
await k.press("Enter"); await page.waitForTimeout(500);
await page.getByRole("link", { name: "Routes" }).focus(); await k.press("Enter"); await page.waitForTimeout(1500);
L.log("t30", "after nav via drawer: url", page.url().split("/").pop(), "title", await page.title(), "focus", await L.focus(page), "drawer closed", await page.locator("[role=dialog]").count() === 0, "live", (await L.liveLog(page)).slice(-2));
// POI list at 768 axe
await L.nav(page, L.P("/pois"), 800);
L.log("t30", "axe 768", await L.axe(page, "poi-list-768"));
await browser.close();
