import { open, go, P, shot, log, alerts, focused } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const a = await open("curator", { viewport: "1440" });
const b = await open("curator", { viewport: "1440" });
const url = `/projects/${P}/pois/${ids.poiB}`;
await go(a.page, url); await go(b.page, url); await a.page.waitForTimeout(1000); await b.page.waitForTimeout(1000);
await a.page.locator("#f-summary").fill("Summary from A2");
await a.page.getByRole("button",{name:"Save",exact:true}).first().click(); await a.page.waitForTimeout(2000);
await b.page.locator("#f-summary").fill("Summary from B2");
await b.page.getByRole("button",{name:"Save",exact:true}).first().click(); await b.page.waitForTimeout(2000);
const d = b.page.locator("[role=dialog],[role=alertdialog],dialog").first();
log("dialog role", await d.evaluate(e=>`${e.tagName} role=${e.getAttribute('role')} modal=${e.getAttribute('aria-modal')} labelledby=${e.getAttribute('aria-labelledby')} describedby=${e.getAttribute('aria-describedby')}`));
// esc
await b.page.keyboard.press("Escape"); await b.page.waitForTimeout(600);
log("after esc dialog count", await d.count().catch(()=>0), "focus", await focused(b.page), "alerts", await alerts(b.page));
await shot(b.page, "poi-editor__409-after-esc__1440");
// save again -> conflict again? (version is stale)
await b.page.getByRole("button",{name:"Save",exact:true}).first().click(); await b.page.waitForTimeout(2000);
log("reopened?", await b.page.getByText("Someone else changed").count());
// choose current for summary and save my choices
await b.page.getByLabel(/Current/).first().check().catch(e=>log("check fail", e.message.slice(0,80)));
await b.page.getByRole("button",{name:"Save my choices"}).click(); await b.page.waitForTimeout(2500);
log("after resolve alerts", await alerts(b.page), "focus", await focused(b.page), "summary", await b.page.locator("#f-summary").inputValue(), "version", (await b.page.locator("main").innerText()).match(/version \d+/g));
await shot(b.page, "poi-editor__409-resolved__1440");
await a.browser.close(); await b.browser.close();
