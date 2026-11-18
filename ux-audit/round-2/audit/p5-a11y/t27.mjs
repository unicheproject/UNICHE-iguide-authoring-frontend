import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/events/b01dc48d-a833-4dfd-af71-62f355ddb3e6"), 1500);
await L.watchLive(page);
await page.getByRole("button", { name: "Add a date" }).focus(); await k.press("Enter"); await page.waitForTimeout(500);
// set end date before start: fill End date
const end = page.getByRole("textbox", { name: "End date" });
await end.fill("2026-11-10"); await page.getByRole("textbox", { name: "Start time" }).focus(); await page.waitForTimeout(500);
L.log("t27", "end<start: end invalid", await end.getAttribute("aria-invalid"), "desc", await end.evaluate((e) => (e.getAttribute("aria-describedby") ?? "").split(" ").map((i) => document.getElementById(i)?.textContent)), "alerts", await page.locator("[role=alert]").allTextContents(), "live", (await L.liveLog(page)).slice(-2));
await L.shot(page, "event-editor__end-before-start__1440");
await end.fill("2026-11-14");
// Switch Cancelled
const sw = page.getByRole("switch", { name: "Cancelled" }); await sw.focus(); await k.press("Space"); await page.waitForTimeout(300);
L.log("t27", "switch", await sw.getAttribute("aria-checked"), (await L.liveLog(page)).slice(-1));
await k.press("Space");
// Repeat weekly
await page.getByRole("button", { name: "Repeat weekly" }).focus(); await k.press("Enter"); await page.waitForTimeout(500);
L.log("t27", "repeat: focus", await L.focus(page), (await L.snap(page, "event-repeat", "section:has(h2:has-text('Dates'))")).split("\n").slice(-25).join("\n"));
await L.shot(page, "event-editor__repeat-weekly__1440");
await k.type("3"); 
await browser.close();
