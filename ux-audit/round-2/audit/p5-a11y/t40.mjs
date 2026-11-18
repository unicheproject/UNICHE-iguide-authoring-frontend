import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/maps/5eef6cab-a61e-419e-adff-053edfff9939"), 2500);
await L.watchLive(page);
const eb = page.getByRole("button", { name: "Edit bounds" }); await eb.focus(); await k.press("Enter"); await page.waitForTimeout(800);
L.log("t40", "edit bounds: focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
await L.shot(page, "map-editor__edit-bounds__1440");
const seq = []; for (let i = 0; i < 8; i++) { await k.press("Tab"); seq.push(await L.focus(page)); } L.log("t40", "tabs after Edit bounds", seq);
// find handle
const handle = page.locator("[role=button][aria-label*='corner']").first();
L.log("t40", "handles", await page.locator("[aria-label*='corner'], [aria-label*='centre']").evaluateAll((h) => h.map((x) => x.getAttribute("aria-label"))));
await handle.focus(); await k.press("ArrowUp"); await k.press("ArrowRight"); await page.waitForTimeout(400);
L.log("t40", "nudged: live", (await L.liveLog(page)).slice(-2));
L.log("t40", "bounds fields", await page.locator("input[inputmode=decimal], input[aria-label*='ounds'], input[id*=bound]").evaluateAll((i) => i.map((x) => (x.labels?.[0]?.textContent ?? x.getAttribute("aria-label")) + "=" + x.value)));
await L.shot(page, "map-editor__handle-nudged__1440");
// coordinates of a placed POI via marker arrows
const pin = page.locator("[role=button][aria-label^='1.']").first();
await pin.focus(); await k.press("ArrowDown"); await page.waitForTimeout(300);
L.log("t40", "pin nudge live", (await L.liveLog(page)).slice(-2));
// Not placed list: coordinate alternative for placement
L.log("t40", "not-placed first rows", (await L.snap(page, "map-notplaced", "section:has(h3:has-text('Not placed'))")).split("\n").slice(0, 14).join("\n"));
await browser.close();
