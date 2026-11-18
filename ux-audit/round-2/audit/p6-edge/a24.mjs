import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `${PP}/maps/${I.map}`); await settle(page, 1500);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/maps/${I.map}`); await settle(page, 1500);
await page.locator("#f-internalName").fill("UX-R2-p6 Map");
const save = async (label) => { await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(1500); console.log(label, "alerts", JSON.stringify((await alerts(page)).filter(a => /alert|status\/polite: (Saved|Unsaved)/.test(a))).slice(0, 450), "| focus", await focused(page)); };
for (const [id, v] of [["f-minLatitude", "999"], ["f-maxLatitude", "-91"], ["f-minLongitude", "181"], ["f-initialLatitude", ""], ["f-maxLatitude", "37.0"]]) {
  const old = await page.locator("#" + id).inputValue();
  await page.locator("#" + id).fill(v); await save(`${id}=${JSON.stringify(v)}`);
  await shot(page, `map-editor__coord-${id}-${v || "empty"}`);
  if (v === "37.0") console.log("(max<min lat)");
  await page.locator("#" + id).fill(old);
}
// tile host blocked
await page.route(/tile|openfreemap|basemaps|osm/i, (r) => /localhost/.test(r.request().url()) ? r.continue() : r.abort("blockedbyclient"));
await go(page, `${PP}/maps/${I.map}`); await settle(page, 3500);
console.log("TILES BLOCKED body:", (await page.locator("main").innerText()).replace(/\n+/g, " | ").match(/.{0,100}(tile|Map tiles|Try again|could not|can't).{0,200}/i)?.[0]);
await shot(page, "map-editor__tiles-blocked", "1440", false);
const retry = page.getByRole("button", { name: /try again|retry/i }).first();
console.log("retry button", await retry.count());
await page.unroute(/tile|openfreemap|basemaps|osm/i);
if (await retry.count()) { await retry.click(); await page.waitForTimeout(3500); console.log("after retry:", (await page.locator("main").innerText()).replace(/\n+/g, " | ").match(/.{0,50}(tile|Try again).{0,100}/i)?.[0] ?? "(no tile notice)"); await shot(page, "map-editor__tiles-retry-ok"); }
await browser.close();
