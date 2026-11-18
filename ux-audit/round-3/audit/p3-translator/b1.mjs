import { open, go, base, shot } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
const out = {};
const names = { pois: "UX-R3-p3 Poi Παρθενώνας test", routes: "UX-R3-p3 Route", guides: "UX-R3-p3 Guide", events: "UX-R3-p3 Event", categories: "UX-R3-p3 Category" };
for (const k of Object.keys(names)) {
  await go(page, base + "/" + k + "?create=1");
  await page.waitForSelector("[role=dialog] input[type=text]");
  await page.waitForTimeout(500);
  await page.locator("[role=dialog] input[type=text]").first().fill(names[k]);
  if (k === "routes") { const s = page.locator("[role=dialog] select").first(); const opts = await s.locator("option").allInnerTexts(); console.log("route settings", opts); await s.selectOption({ index: 1 }); }
  await page.locator("[role=dialog] button[type=submit]").click();
  await page.waitForURL(new RegExp(`/${k}/[0-9a-f-]{36}`), { timeout: 20000 }).catch(e => console.log(k, "no nav", page.url()));
  await page.waitForTimeout(1500);
  out[k] = page.url().replace("http://localhost:5173", "");
  console.log(k, out[k]);
}
writeFileSync("records.json", JSON.stringify(out, null, 1));
await browser.close();
