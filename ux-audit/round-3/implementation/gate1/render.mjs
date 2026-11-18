import { open, go } from "../../../tools/session.mjs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin");
const errs = []; page.on("pageerror", e => errs.push(String(e)));
const routes = ["overview","languages","surfaces","translations","navigation","pages","launch","audit-log","app-settings","features",""
 ,"places","pois","routes","guides","events","categories","maps","media","preview"];
for (const r of routes) {
  await go(page, P + (r ? "/" + r : "")); await page.waitForTimeout(3500);
  const h1 = await page.locator("h1").first().innerText().catch(() => "NONE");
  const overlay = await page.locator("vite-error-overlay").count();
  console.log((r||"dashboard").padEnd(14), "|", h1, "| overlay", overlay);
  await page.screenshot({ path: `ux-audit/round-3/implementation/gate1/${r||"dashboard"}__1440.png` });
}
console.log("pageerrors", errs.length, errs.slice(0,3));
await browser.close();
