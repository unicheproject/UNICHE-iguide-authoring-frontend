import { open, go, P, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: process.env.VP ?? "1280" });
for (const k of ["pois", "routes", "places"]) {
  await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 800);
  console.log(k, JSON.stringify(await page.evaluate(() => {
    const out = [];
    for (const row of document.querySelectorAll("[data-row-id]")) for (const [i, c] of [...row.querySelectorAll(":scope > td")].entries()) if (c.scrollWidth > c.clientWidth + 1) out.push({ i, sw: c.scrollWidth, cw: c.clientWidth, t: c.textContent.trim().slice(0, 50), kids: [...c.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().right > c.getBoundingClientRect().right + 1).map((e) => e.tagName + "." + String(e.className).slice(0, 30)).slice(0, 3) });
    return out.slice(0, 4);
  })));
}
await browser.close();
