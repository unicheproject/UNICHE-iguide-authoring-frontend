import { open, go, P, shot, settle, alerts, focused, problem, AP } from "./lib.mjs";
const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const errs = []; page.on("pageerror", e => errs.push(e.message.slice(0,150)));
await page.route(AP, (r) => r.request().method() !== "GET" ? r.fulfill(problem(500, "INTERNAL_ERROR")) : r.continue());
await go(page, `${PP}/floor-plans/d40864d1-684a-466f-819d-68fa651b7146`); await settle(page, 2500);
const errOf = (id) => page.evaluate((id) => { const e = document.getElementById(id); const d = (e?.getAttribute("aria-describedby") || "").split(" ").map(x => document.getElementById(x)?.textContent?.trim()).filter(Boolean); return `invalid=${e?.getAttribute("aria-invalid")} desc=${d.join("/").slice(0,120)}`; }, id);
for (const [id, vals] of [["pos-0-x", ["abc", "1,5", "2", "-1", "", "0,5"]], ["pos-0-r", ["400", "-10", "x"]]]) for (const v of vals) {
  await page.locator("#" + id).fill(v); await page.locator("#" + id).blur(); await page.waitForTimeout(300);
  console.log(id, JSON.stringify(v), await errOf(id), "| value", JSON.stringify(await page.locator("#" + id).inputValue()));
}
await page.locator("#pos-0-x").fill("abc");
await page.getByRole("button", { name: /Save draft/ }).first().click(); await page.waitForTimeout(1500);
console.log("SAVE invalid: alerts", JSON.stringify(await alerts(page)).slice(0, 500), "| focus", await focused(page), "| invalid", await errOf("pos-0-x"));
await shot(page, "floorplan-editor__coordinates-invalid", "1440", false);
console.log("pageerrors", errs);
await browser.close();
