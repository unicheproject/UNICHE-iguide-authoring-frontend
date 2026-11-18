import { open, go, P, shot, log, alerts, focused } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
const url = `/projects/${P}/pois/${ids.poiA}`;
let dialogs = [];
page.on("dialog", async d => { dialogs.push(`${d.type()}: ${d.message()}`); await d.accept(); });
const dirty = async () => { await go(page, url); await page.waitForTimeout(800); await page.locator("#f-title").fill("UX-p6-edge POI A dirty " + Date.now()); await page.waitForTimeout(300); };
const state = async (label) => { await page.waitForTimeout(800); log(`[${label}] url=${page.url().replace(/.*5173/,"")} native=${JSON.stringify(dialogs)} dlg=`, await page.locator("[role=dialog],[role=alertdialog]").count(), "text=", (await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(()=>"")).replace(/\n+/g," | ").slice(0,300), "focus", await focused(page)); dialogs=[]; };
await dirty();
await page.evaluate(()=>history.pushState(null,"",location.href)); // ensure a history entry
await go(page, `/projects/${P}/pois`); dialogs=[]; // beforeunload accepted
await page.getByRole("link",{name:/UX-p6-edge POI A/}).first().click().catch(()=>log("no list link")); await page.waitForTimeout(1500);
await page.locator("#f-title").fill("UX-p6-edge POI A dirty back"); 
await page.evaluate(()=>history.back()); await state("browser back"); await shot(page,"nav-away__back__1440");
if (await page.getByRole("button",{name:"Leave without saving"}).count()) { log("back: dialog shown; url still editor?", page.url().includes("/pois/")); await page.getByRole("button",{name:"Leave without saving"}).click(); await state("after leave"); }
// reload
await dirty(); await page.reload().catch(()=>{}); await state("reload"); 
// tab close
await dirty(); dialogs=[]; await page.close({runBeforeUnload:true}); await new Promise(r=>setTimeout(r,1000)); log("native dialogs on tab close", dialogs);
await browser.close();
