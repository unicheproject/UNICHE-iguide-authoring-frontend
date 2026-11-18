// Tab stops across the POI Placement section: node tabs.mjs <tag> [viewport]
import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const tag = process.argv[2] ?? "after";
const vp = process.argv[3] ?? "1440";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/pois/${process.argv[4] ?? "546c5177-effd-49c8-acae-85d751f89bbe"}`);
await page.waitForTimeout(2500);
// from the header primary action (Save / Apply) to the end of the Placement section
await page.evaluate(() => (document.querySelector("[data-editor-primary]") ?? document.querySelector("h1"))?.focus());
let total = 0, inPlacement = 0, entered = false, left = false;
const seq = [];
for (let i = 0; i < 200 && !left; i++) {
  await page.keyboard.press("Tab");
  total++;
  const r = await page.evaluate(() => { const el = document.activeElement; const sec = el?.closest("#placement"); return { inSec: !!sec, d: `${el?.tagName}${el?.id ? "#" + el.id : ""}.${(el?.className?.baseVal ?? el?.className ?? "").toString().slice(0, 30)}` }; });
  if (r.inSec) { entered = true; inPlacement++; seq.push(r.d); }
  else if (entered) left = true;
}
const res = { tag, vp, tabsFromHeaderPrimaryToEndOfPlacement: total, inPlacement, seq };
writeFileSync(`${tag}/tabs-${tag}-${vp}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
