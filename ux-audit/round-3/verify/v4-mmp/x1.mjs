import { go, shot, POP, run, log, start } from "./lib.mjs";
const MAP = "9fda753d-4d8e-4fba-9760-f300253e2060";
await run(async () => {
  const { page } = await start("1024", { touch: true });
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(4000);
  log("url", page.url());
  log("classes", await page.evaluate(() => [...new Set([...document.querySelectorAll("[class*=leaflet],[class*=maplibre],[class*=geo-map]")].map(e=>e.className.toString().split(" ")[0]))]));
  log("text", (await page.locator("main").innerText()).slice(0,300));
  await shot(page,"x1","1024");
});
