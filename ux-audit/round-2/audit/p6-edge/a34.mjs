import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const targets = [["places", I.place, "place"], ["guides", I.guide, "guide"], ["events", I.event, "event"], ["categories", I.cat, "category"], ["media", I.asset, "asset"], ["maps", I.map, "map"]];
const cases = [["403", () => problem(403, "FORBIDDEN")], ["404", () => problem(404, "RESOURCE_NOT_FOUND")], ["409", () => problem(409, "VERSION_CONFLICT", { currentVersion: 99 })], ["503", () => problem(503, "SERVICE_UNAVAILABLE")]];
for (const [seg, id, name] of targets) for (const [cn, mk] of cases) {
  await go(page, `${PP}/${seg}/${id}`); await settle(page, 700);
  await page.evaluate(() => localStorage.clear());
  const field = page.locator("main input[type=text], main textarea").first();
  await field.fill((await field.inputValue()) + " x").catch(() => {});
  await page.route(AP, (r) => ["PUT", "POST", "PATCH"].includes(r.request().method()) ? r.fulfill(mk()) : r.continue());
  const btn = page.getByRole("button", { name: /^Save( draft)?\b/ }).first();
  await btn.click({ timeout: 4000 }).catch(e => console.log("no save btn", seg));
  await page.waitForTimeout(1800);
  const a = (await alerts(page)).filter(s => /^alert|dialog/.test(s));
  const dlg = await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(() => "");
  console.log(`${seg} ${cn}: ${JSON.stringify(a).slice(0, 260)} ${dlg ? "| DIALOG " + dlg.replace(/\n+/g, " | ").slice(0, 200) : ""} | focus ${(await focused(page)).slice(0, 80)}`);
  if (cn === "404" || cn === "409") await shot(page, `${seg}-editor__save-${cn}`);
  await page.unroute(AP);
  await page.evaluate(() => localStorage.clear());
}
await browser.close();
