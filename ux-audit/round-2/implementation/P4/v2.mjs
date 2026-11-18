import { open, go } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const r = JSON.parse(readFileSync("records.json", "utf8"));
const log = (...a) => console.log(...a);
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${r.poi}`);
await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2000);
// live region watcher
await page.evaluate(() => { window.__said = []; const live = [...document.querySelectorAll("[aria-live]")]; live.forEach((el) => new MutationObserver(() => window.__said.push(el.textContent)).observe(el, { childList: true, subtree: true, characterData: true })); });
// coordinates on blur
const lat = page.getByLabel("Latitude").first();
await lat.fill("abc"); await lat.press("Tab"); await page.waitForTimeout(300);
log("lat invalid:", await lat.getAttribute("aria-invalid"), "| error text:", await page.locator("#f-lat-error").innerText().catch(() => "none"));
log("announced:", JSON.stringify(await page.evaluate(() => window.__said.slice(-3))));
await lat.fill("95"); await lat.press("Tab"); await page.waitForTimeout(200);
log("95:", await page.locator("#f-lat-error").innerText().catch(() => "none"));
await lat.fill("37,9715"); await lat.press("Tab"); await page.waitForTimeout(200);
log("37,9715 ->", await lat.inputValue(), "invalid:", await lat.getAttribute("aria-invalid"), "| lng error:", await page.locator("#f-lng-error").innerText().catch(() => "none"));
await page.screenshot({ path: "after/coord-blur-1440.png" });
await lat.fill(""); await page.locator("#f-lng").fill(""); await page.locator("#f-lng").blur(); await page.waitForTimeout(400);
// attach primary image
await page.getByRole("button", { name: /Add primary image/i }).click();
await page.waitForTimeout(1500); await page.screenshot({ path: "after/dbg.png" }); log("dialogs:", await page.locator('[role="dialog"]').count());
await page.waitForSelector('[role="dialog"]');
await page.waitForTimeout(1500);
await page.locator('[role="dialog"] [data-asset-id]').first().click();
await page.getByRole("dialog").getByRole("button", { name: /^Use this/ }).click();
await page.waitForTimeout(800);
log("focus after attach:", await page.evaluate(() => { const a = document.activeElement; return a?.tagName + " " + a?.textContent?.trim().slice(0, 40) + " data-replace=" + a?.getAttribute("data-replace"); }));
await page.screenshot({ path: "after/attached-1440.png" });
// tab count Save -> end of placement
await page.evaluate(() => document.querySelector("[data-editor-primary]")?.focus());
let n = 0; const stops = [];
for (; n < 40; n++) { await page.keyboard.press("Tab"); const d = await page.evaluate(() => { const a = document.activeElement; return (a?.getAttribute("aria-label") || a?.textContent || a?.id || a?.tagName).trim().slice(0, 30); }); stops.push(d); if (/Set position|Edit position|Hide the map/.test(d)) break; }
log("tab stops from primary to placement end:", n + 1, JSON.stringify(stops));
// language tab folding
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(500);
log("other settings button:", await page.getByRole("button", { name: /Other settings/ }).count(), "placement visible:", await page.locator("#placement").isVisible());
await page.screenshot({ path: "after/folded-1440.png" });
await page.getByRole("button", { name: /Other settings/ }).click(); await page.waitForTimeout(300);
log("after open placement visible:", await page.locator("#placement").isVisible());
await page.getByRole("tab", { name: /English/ }).click(); await page.waitForTimeout(300);
log("english: heading present", await page.getByRole("button", { name: /Other settings/ }).count(), "placement visible:", await page.locator("#placement").isVisible());
await browser.close();
