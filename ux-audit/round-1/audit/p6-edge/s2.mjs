import { open, go, P, shot, log, alerts, focused } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${ids.poiA}`); await page.waitForTimeout(1500);
await shot(page, "poi-editor__draft__1440", true);
log("buttons", (await page.getByRole("button").allTextContents()).map(s=>s.trim()).filter(Boolean));
log("inputs", await page.locator("input:visible,textarea:visible,select:visible").evaluateAll(e=>e.map(x=>`${x.tagName}#${x.id}|${x.getAttribute('aria-label')||''}|${x.type}`)));
await browser.close();
