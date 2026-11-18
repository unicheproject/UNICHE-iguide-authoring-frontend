import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const dlg = () => page.locator("[role=dialog],[role=alertdialog]").first();
await go(page, `${PP}/maps`); await settle(page, 1500);
console.log("MAPS:", (await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,500));
await page.getByRole("button", { name: /New map/ }).first().click(); await page.waitForTimeout(800);
console.log("NEW MAP dialog:", (await dlg().innerText()).replace(/\n+/g," | ").slice(0,500));
console.log("fields", await dlg().evaluate(d => [...d.querySelectorAll("input,select,textarea,button")].map(e => `${e.tagName.toLowerCase()}:${e.type||""}:${(e.getAttribute("aria-label")||e.labels?.[0]?.textContent||e.textContent||e.name||e.id).trim().replace(/\s+/g," ").slice(0,30)}`).join(" ; ")));
await shot(page, "maps__new-map-dialog");
// geocoder failures
for (const st of [429, 500]) {
  await page.route(/nominatim/, (r) => r.fulfill({ status: st, body: "x" }));
  const s = dlg().locator("input[type=search],input[type=text]").first();
  await s.fill("Athens " + st); await page.keyboard.press("Enter"); await page.waitForTimeout(2000);
  console.log(`geocoder ${st}:`, JSON.stringify(await alerts(page)).slice(0,300), "|", (await dlg().innerText()).replace(/\n+/g," | ").slice(0,400));
  await shot(page, `maps__geocoder-${st}`);
  await page.unroute(/nominatim/);
}
await page.route(/nominatim/, (r) => r.abort("failed"));
await dlg().locator("input[type=search],input[type=text]").first().fill("Athens offline"); await page.keyboard.press("Enter"); await page.waitForTimeout(2000);
console.log("geocoder abort:", (await dlg().innerText()).replace(/\n+/g," | ").slice(0,400));
await browser.close();
