import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const NOM = /nominatim\.openstreetmap\.org/;
const rows = [{ place_id: 2, display_name: "Κεραμεικός, Αθήνα, Greece", name:"Κεραμεικός", type:"archaeological_site", osm_type:"way", osm_id: 12, boundingbox:["37.9738","37.9798","23.7103","23.7197"], addresstype:"suburb" }];
await run(async () => { try {
  const { browser, page } = await start("1440"); log("=== b2 create map");
  await go(page, `/projects/${POP}/maps`);
  await page.getByRole("button", { name: "New map" }).click();
  await page.route(NOM, (r) => r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify(rows) }));
  await page.getByLabel("Find area").fill("Kerameikos"); await page.getByRole("button", { name: /^Search/ }).click();
  await page.locator('ul[aria-label="Search results"] button').first().click(); await page.waitForTimeout(1500);
  await page.getByLabel("Map name").fill("UX-R3-s12 Map");
  await page.getByRole("button", { name: "Create map" }).click();
  await page.waitForURL(/\/maps\/[0-9a-f-]{36}/, { timeout: 15000 });
  log("MAPURL", page.url());
  writeFileSync(join(here,"ids.json"), JSON.stringify({ map: page.url().match(/maps\/([0-9a-f-]{36})/)[1] }));
  await page.waitForTimeout(2500); await shot(page, "map-editor__after-create", "1440");
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,400)); } });
