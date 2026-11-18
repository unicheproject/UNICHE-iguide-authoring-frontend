import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
const url = `/projects/${P}/pois/${ids.poiA}`;
// A: single 401 on PUT then pass
let n = 0; const seen=[];
await go(page, url); await page.waitForTimeout(1000);
await page.route("**/iguide/api/v1/**", (route) => { const r=route.request(); if (r.method()==="PUT") { n++; seen.push("PUT#"+n); if (n===1) return route.fulfill({status:401, contentType:"application/problem+json", body: JSON.stringify({status:401,code:"UNAUTHORIZED",title:"Unauthorized"})}); } return route.continue(); });
await page.locator("#f-title").fill("UX-p6-edge POI A one-401");
await page.getByRole("button",{name:"Save",exact:true}).first().click(); await page.waitForTimeout(3000);
log("A seen", seen, "alerts", await alerts(page), "url", page.url());
await shot(page, "poi-editor__401-once__1440");
log("title now", await page.locator("#f-title").inputValue(), "version text", await page.locator("main").innerText().then(t=>t.match(/version \d+/g)));
// B: always 401 on PUT
await page.unrouteAll({behavior:"ignoreErrors"});
await go(page, url); await page.waitForTimeout(1000);
await page.route("**/iguide/api/v1/**", (route) => { const r=route.request(); if (r.method()==="PUT") return route.fulfill({status:401, contentType:"application/problem+json", body: JSON.stringify({status:401,code:"UNAUTHORIZED",title:"Unauthorized"})}); return route.continue(); });
await page.locator("#f-title").fill("UX-p6-edge POI A draft after expiry");
await page.locator("#f-summary").fill("A long summary I typed for an hour.");
await page.getByRole("button",{name:"Save",exact:true}).first().click();
for (let i=0;i<8;i++){ await page.waitForTimeout(1500); log("B url", page.url().slice(0,100)); }
await shot(page, "poi-editor__401-twice-after__1440");
log("body", (await page.locator("body").innerText()).replace(/\n+/g," | ").slice(0,500));
await page.unrouteAll({behavior:"ignoreErrors"});
await page.waitForTimeout(3000); log("B2 url", page.url().slice(0,100));
if (page.url().includes("/realms/")) { log("at login"); await shot(page,"session-expired__keycloak__1440"); }
else { await go(page, url); await page.waitForTimeout(1500); }
log("alerts", await alerts(page));
log("title", await page.locator("#f-title").inputValue().catch(()=>"n/a"));
await shot(page, "poi-editor__after-reauth__1440");
log("restore banner?", await page.getByText("Unsaved changes from").count());
await browser.close();
