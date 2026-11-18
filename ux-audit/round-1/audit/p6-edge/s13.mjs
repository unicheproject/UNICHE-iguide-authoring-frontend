import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
const dlgText = async () => (await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(()=>"(no dialog)")).replace(/\n+/g," | ").slice(0,900);
await go(page, `/projects/${P}/pois/${ids.poiC}`); await page.waitForTimeout(1200);
log("used in:", (await page.locator("main").innerText()).match(/USED IN[\s\S]{0,200}/i)?.[0].replace(/\n+/g," | "));
await shot(page, "poi-editor__used-in-route__1440");
// Archive
await page.getByRole("button",{name:"Archive",exact:true}).first().click(); await page.waitForTimeout(1500);
log("ARCHIVE dialog:", await dlgText(), "focus", await focused(page));
await shot(page, "poi-archive__referenced__1440");
log("buttons in dlg", (await page.locator("[role=dialog] button, [role=dialog] a").allTextContents()).map(s=>s.trim()));
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
log("focus after esc", await focused(page));
// Activate POI C (draft with title) -> then Deactivate
await page.getByRole("button",{name:"Activate",exact:true}).first().click(); await page.waitForTimeout(1500);
log("ACTIVATE dialog:", await dlgText(), "alerts", await alerts(page));
await shot(page, "poi-activate__dialog__1440");
await browser.close();
