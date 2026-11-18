import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
const dlgText = async () => (await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(()=>"(no dialog)")).replace(/\n+/g," | ").slice(0,900);
const url = `/projects/${P}/pois/${ids.poiC}`;
await go(page, url); await page.waitForTimeout(1200);
log("buttons", (await page.getByRole("button").allTextContents()).map(s=>s.trim()).filter(x=>/apply|save|discard|deactiv|archive|draft/i.test(x)));
// edit -> working copy
await page.locator("#f-title").fill("UX-p6-edge POI C working copy");
await page.getByRole("button",{name:/apply changes/i}).first().isEnabled().then(v=>log("apply enabled after edit", v));
// Save draft?
const labels = (await page.getByRole("button").allTextContents()).map(s=>s.trim()).filter(Boolean).slice(3,8); log("header buttons", labels);
await shot(page, "poi-editor__active-edited__1440");
// slow apply double click
let n = 0;
await page.route("**/iguide/api/v1/**", async (route) => { if (route.request().method()!=="GET") { n++; await new Promise(r=>setTimeout(r,5000)); } return route.continue(); });
const apply = page.getByRole("button",{name:/apply changes|save draft|save/i}).first();
log("primary button text", await apply.textContent());
await apply.click(); await page.waitForTimeout(300); log("dialog after click", await dlgText());
await shot(page, "poi-apply__click__1440");
await apply.click({force:true,timeout:500}).catch(()=>{});
await page.waitForTimeout(6500); log("non-GET count", n, "alerts", await alerts(page), "dialog", await dlgText());
await page.unrouteAll({behavior:"ignoreErrors"});
// Deactivate with forced 409 RESOURCE_IN_USE
await go(page, url); await page.waitForTimeout(1000);
await page.route("**/iguide/api/v1/**", (route) => route.request().method()==="POST" && /status/.test(route.request().url()) ? route.fulfill(problem(409,"RESOURCE_IN_USE",{references:[{resourceType:"ROUTE",resourceId:ids.route,title:"UX-p6-edge Route"}]})) : route.continue());
await page.getByRole("button",{name:"Deactivate",exact:true}).first().click(); await page.waitForTimeout(1500);
log("DEACTIVATE dialog:", await dlgText(), "alerts", await alerts(page), "focus", await focused(page));
await shot(page, "poi-deactivate__dialog__1440");
for (const nm of [/confirm|deactivate$/i]) { const b = page.locator("[role=dialog] button").filter({hasText:/deactivate/i}).first(); if (await b.count()) { await b.click(); await page.waitForTimeout(1500); log("after confirm", await dlgText(), await alerts(page)); await shot(page,"poi-deactivate__409-in-use__1440"); } }
await browser.close();
