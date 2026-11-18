import { open, go, P, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1280" });
for (const k of ["pois", "routes", "places"]) {
  await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 800);
  console.log(k, JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[data-row-id]")].map((r) => ({ h: Math.round(r.getBoundingClientRect().height), t: r.querySelector("a").textContent.trim().slice(0, 40), cells: [...r.querySelectorAll(":scope > td")].map((c) => Math.round(c.getBoundingClientRect().height)) })).filter((x) => x.h > 100))));
}
await browser.close();
