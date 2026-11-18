import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const errs = []; page.on("pageerror", e => errs.push("PAGEERROR " + e.message.slice(0, 150))); page.on("console", m => { if (m.type() === "error") errs.push("CONSOLE " + m.text().slice(0, 150)); });
await go(page, `${PP}/maps/${I.map}`); await settle(page, 1500);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/maps/${I.map}`); await settle(page, 1500);
await page.locator("#f-internalName").fill("UX-R2-p6 Map");
const err = async (id) => page.evaluate((id) => { const e = document.getElementById(id); const d = (e?.getAttribute("aria-describedby") || "").split(" ").map(x => document.getElementById(x)?.textContent?.trim()).filter(Boolean); return `invalid=${e?.getAttribute("aria-invalid")} desc=${d.join(" / ").slice(0, 160)}`; }, id);
for (const [id, vals] of [["f-minLatitude", ["37,95", "abc", "999", "-91", "", "37.9"]], ["f-initialZoom", ["99", "0", "x"]], ["f-maxLongitude", ["181", "23.74"]]]) {
  for (const v of vals) {
    await page.locator("#" + id).fill(v); await page.locator("#" + id).blur(); await page.waitForTimeout(350);
    console.log(id, JSON.stringify(v), "->", "value now", JSON.stringify(await page.locator("#" + id).inputValue()), await err(id), "| alerts", JSON.stringify(await alerts(page)).slice(0, 160));
  }
}
await page.locator("#f-minLatitude").fill("abc");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(1500);
console.log("SAVE with abc: alerts", JSON.stringify(await alerts(page)).slice(0, 500), "| focus", await focused(page));
await shot(page, "map-editor__coordinates-invalid");
console.log("errors", errs);
await page.locator("#f-minLatitude").fill("37.962851");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(2000);
console.log("SAVE ok alerts", JSON.stringify(await alerts(page)).slice(0, 300));
await browser.close();
