import { open, go, P, shot, log, alerts, focused } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
const url = `/projects/${P}/pois/${ids.poiA}`;
// slow save + double submit
await go(page, url); await page.waitForTimeout(1000);
let puts = 0;
await page.route("**/iguide/api/v1/**", async (route) => { if (route.request().method()==="PUT") { puts++; await new Promise(r=>setTimeout(r,8000)); } return route.continue(); });
await page.locator("#f-title").fill("UX-p6-edge POI A slow save");
const save = page.getByRole("button",{name:/^(Save|Saving)/}).first();
await save.click(); await page.waitForTimeout(300);
log("button during save:", (await page.getByRole("button",{name:/sav/i}).allTextContents()).map(s=>s.trim()), "disabled", await save.isDisabled().catch(()=>"?"));
await shot(page, "poi-editor__saving-slow__1440");
await page.keyboard.press("Control+s").catch(()=>{});
await save.click({force:true, timeout:1000}).catch(()=>log("second click blocked"));
log("alerts mid", await alerts(page), "focus", await focused(page));
// try navigating while saving
await page.waitForTimeout(9500);
log("PUT count", puts, "alerts after", await alerts(page));
// offline mid-save
await page.unrouteAll({behavior:"ignoreErrors"});
await page.locator("#f-title").fill("UX-p6-edge POI A offline save");
await context.setOffline(true);
await page.waitForTimeout(1500);
await shot(page, "poi-editor__offline-banner__1440");
log("offline alerts", await alerts(page), "save disabled", await page.getByRole("button",{name:"Save",exact:true}).first().isDisabled());
log("banner text", (await page.locator("body").innerText()).split("\n").slice(0,6).join(" | "));
await page.getByRole("button",{name:"Save",exact:true}).first().click({force:true,timeout:2000}).catch(e=>log("save click failed", e.message.slice(0,100)));
await page.waitForTimeout(2500);
log("offline after click alerts", await alerts(page)); await shot(page, "poi-editor__offline-after-save__1440");
await context.setOffline(false); await page.waitForTimeout(3000);
log("online alerts", await alerts(page)); await shot(page, "poi-editor__back-online__1440");
// offline then click Save while page thinks online (go offline only at request time)
await page.locator("#f-title").fill("UX-p6-edge POI A offline mid-save");
await page.route("**/iguide/api/v1/**", async (route) => { if (route.request().method()==="PUT") { await context.setOffline(true); return route.abort("internetdisconnected"); } return route.continue(); });
await page.getByRole("button",{name:"Save",exact:true}).first().click(); await page.waitForTimeout(2500);
log("midsave alerts", await alerts(page), "focus", await focused(page)); await shot(page, "poi-editor__offline-midsave__1440");
await context.setOffline(false); await page.unrouteAll({behavior:"ignoreErrors"}); await page.waitForTimeout(3000);
log("recovered alerts", await alerts(page)); await shot(page, "poi-editor__offline-recovered__1440");
await browser.close();
