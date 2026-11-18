import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
import fs from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
async function create(title){
  await go(page, `/projects/${P}/pois`); await settle(page);
  await page.getByRole("button",{name:/^New point/}).first().click(); await settle(page,400);
  const d = page.getByRole("dialog"); await d.locator("input[type=text]").first().fill(title);
  await d.getByRole("button",{name:/Create/}).click();
  await page.waitForURL(/\/pois\/[0-9a-f-]{36}/,{timeout:15000}); await settle(page,1000);
  return page.url().split("/").pop();
}
IDS.poie = await create("UX-R3-s11 Stop Echo"); IDS.poif = await create("UX-R3-s11 Stop Foxtrot"); IDS.poig = await create("UX-R3-s11 Stop Golf");
fs.writeFileSync("ux-audit/round-3/audit/s11-editors/ids.json", JSON.stringify(IDS,null,1));
for (const k of ["poia","poib","poic","poid","poie","poif"]) {
  await go(page, url("pois", IDS[k])); await settle(page,1200);
  const sel = page.locator("select").filter({has: page.locator("option",{hasText:"UX-R3-s11 Category"})}).first();
  if (!(await sel.count())) { console.log("no cat select", k); continue; }
  await sel.selectOption({label:"UX-R3-s11 Category"});
  await page.getByRole("button",{name:"Save",exact:true}).click(); await settle(page,1500);
  console.log(k, "saved", await page.evaluate(()=>document.body.innerText.includes("Saved")));
}
await browser.close();
