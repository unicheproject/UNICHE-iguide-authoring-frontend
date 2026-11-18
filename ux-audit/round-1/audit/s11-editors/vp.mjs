import { start, log, state } from "./lib.mjs";
// usage: node vp.mjs <stateKey> <prefix> ; scroll screenshots at each viewport
const [key, prefix, sel] = process.argv.slice(2);
for (const vp of ["1280","1024","768","zoom200"]) {
  const s = await start(vp); const { page } = s;
  await page.goto("http://localhost:5173" + state()[key]); await page.locator("main h1").first().waitFor({timeout:40000}).catch(()=>{}); await page.waitForTimeout(2500);
  await s.shot(prefix + "__top");
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, mainSW: document.querySelector("main")?.scrollWidth, mainCW: document.querySelector("main")?.clientWidth }));
  log(vp, JSON.stringify(ov));
  if (sel) { const el = page.locator(sel).first(); if (await el.count()) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await s.shot(prefix + "__section"); } else log("no sel"); }
  await s.browser.close();
}
