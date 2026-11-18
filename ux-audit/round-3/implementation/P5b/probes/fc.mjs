import { session, go, P, ids, shot, sleep, LOG } from "./h.mjs";
const log = LOG("fc");
const { browser, page } = await session({ viewport: "1440", forcedColors: "active" });
await go(page, P(`/events/${ids.event}`));
await page.waitForSelector("[id^=occ-end-][id$=-day]", { timeout: 20000 }); await sleep(800);
const key = await page.evaluate(() => document.querySelector("[id^=occ-end-][id$=-day]").id.replace(/^occ-end-/, "").replace(/-day$/, ""));
await page.locator(`#occ-start-${key}-hour`).fill("25"); await page.locator(`#occ-start-${key}-minute`).focus(); await sleep(300);
await page.locator(`#occ-start-${key}-hour`).scrollIntoViewIfNeeded();
await shot(page, "event-hour25-forced-colors");
log("forced", await page.evaluate(() => matchMedia("(forced-colors: active)").matches));
await browser.close();
// keyboard run: Tab from Date 1 Start hour, type bad value, tab away, check focus path
const s = await session({ viewport: "1024" });
await go(s.page, P(`/events/${ids.event}`));
await s.page.waitForSelector("[id^=occ-end-][id$=-day]", { timeout: 20000 }); await sleep(600);
await s.page.locator(`#occ-start-${key}-hour`).focus();
await s.page.keyboard.press("Control+A"); await s.page.keyboard.type("25"); await s.page.keyboard.press("Tab"); await sleep(200);
log("kb: after tab from hour", await s.page.evaluate(() => document.activeElement.id), "hour aria-invalid", await s.page.locator(`#occ-start-${key}-hour`).getAttribute("aria-invalid"));
await s.page.keyboard.press("Shift+Tab"); await s.page.keyboard.press("Control+A"); await s.page.keyboard.type("15"); await s.page.keyboard.press("Tab"); await s.page.keyboard.press("Tab"); await sleep(200);
log("kb: after fix, focus", await s.page.evaluate(() => document.activeElement.id), "errors left", await s.page.locator(`[id^=occ-start-${key}-][id$=-error]`).count());
// combobox keyboard
await go(s.page, P(`/events/${ids.eventEmpty}`));
await s.page.waitForSelector("#f-poiId", { timeout: 20000 }); await sleep(600);
await s.page.locator("#f-poiId").focus(); await s.page.keyboard.type("parthenon"); await sleep(200); await s.page.keyboard.press("ArrowDown"); await s.page.keyboard.press("Enter"); await sleep(200);
log("kb combobox value", await s.page.locator("#f-poiId").inputValue(), "focus", await s.page.evaluate(() => document.activeElement.id));
await s.browser.close();
