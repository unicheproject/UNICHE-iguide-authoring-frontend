import { open, go, P, shot, log, alerts, focused } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const a = await open("curator", { viewport: "1440" });
const b = await open("curator", { viewport: "1440" });
for (const [seg,id,k] of [["routes",ids.route,"route"],["guides",ids.guide,"guide"]]) {
  const url = `/projects/${P}/${seg}/${id}`;
  await go(a.page, url); await go(b.page, url); await a.page.waitForTimeout(1500); await b.page.waitForTimeout(1500);
  await a.page.locator("#f-title").fill(`UX-p6-edge ${k} from A`);
  await a.page.getByRole("button",{name:/^save/i}).first().click(); await a.page.waitForTimeout(2000);
  await b.page.locator("#f-title").fill(`UX-p6-edge ${k} from B`);
  await b.page.getByRole("button",{name:/^save/i}).first().click(); await b.page.waitForTimeout(2500);
  log(`[${k}] dialog:`, (await b.page.locator("[role=dialog]").first().innerText().catch(()=>"(none)")).replace(/\n+/g," | ").slice(0,600), "focus", await focused(b.page));
  await shot(b.page, `${k}-editor__409-real__1440`);
}
await a.browser.close(); await b.browser.close();
