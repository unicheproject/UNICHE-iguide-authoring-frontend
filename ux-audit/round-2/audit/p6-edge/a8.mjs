import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
import { call, raw, closeAll } from "../../../tools/lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
// 1. forced load errors
for (const [name, code] of [["403", "FORBIDDEN"], ["404", "RESOURCE_NOT_FOUND"], ["500", "INTERNAL_ERROR"], ["503", "SERVICE_UNAVAILABLE"]]) {
  await page.route(`**/iguide/api/v1/projects/${P}/pois/${I.poiA}`, (r) => r.request().method() === "GET" ? r.fulfill(problem(+name, code)) : r.continue());
  await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 800);
  console.log(`\n== load ${name}`, "TITLE", await page.title(), "\nBODY", (await page.locator("main").innerText()).replace(/\n+/g, " | ").slice(0, 500));
  console.log("ALERTS", JSON.stringify(await alerts(page)).slice(0, 300), "FOCUS", await focused(page));
  console.log("links", await page.evaluate(() => [...document.querySelectorAll("main a, main button")].map(e => e.textContent.trim()).join(" ; ")));
  await shot(page, `poi-editor__load-${name}`);
  await page.unroute(`**/iguide/api/v1/projects/${P}/pois/${I.poiA}`);
}
// 2. project-level 404 / 403 on project fetch
for (const [name, code] of [["404", "PROJECT_NOT_FOUND"], ["403", "FORBIDDEN"]]) {
  await page.route(new RegExp(`/iguide/api/v1/projects/${P}$`), (r) => r.fulfill(problem(+name, code)));
  await page.route(`**/iguide/api/v1/projects/${P}/**`, (r) => r.fulfill(problem(+name, code)));
  await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 800);
  console.log(`\n== project ${name}`, "TITLE", await page.title(), "\nBODY", (await page.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 600));
  console.log("FOCUS", await focused(page));
  await shot(page, `project__load-${name}`);
  await page.unroute(`**/iguide/api/v1/projects/${P}/**`); await page.unroute(new RegExp(`/iguide/api/v1/projects/${P}$`));
}
// 3. real: open D, delete via API, save
await go(page, `${PP}/pois/${I.poiD}`); await settle(page, 600);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/pois/${I.poiD}`); await settle(page, 600);
const del = await raw("curator", "DELETE", `${PP}/pois/${I.poiD}`); console.log("DELETE", del.status, JSON.stringify(del.json)?.slice(0, 200));
await page.locator("#f-summary").fill("typed after record deleted EDIT-KEPT");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(2500);
console.log("save after delete: ALERTS", JSON.stringify(await alerts(page)).slice(0, 600));
console.log("FOCUS", await focused(page));
await shot(page, "poi-editor__save-record-deleted-real");
await closeAll(); await browser.close();
