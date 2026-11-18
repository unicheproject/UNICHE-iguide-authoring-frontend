import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const errs = []; page.on("pageerror", e => errs.push(e.message));
// Home / picker
await go(page, "/"); await settle(page);
await shot(page, "home__default__1440");
console.log("HOME h1", await page.evaluate(() => [...document.querySelectorAll("h1,h2")].map(h => h.tagName + ":" + h.textContent.trim())));
console.log("HOME text", (await page.locator("main").innerText()).slice(0, 1500));
// Page-head measurements
const routes = ["", "/places", "/pois", "/routes", "/guides", "/events", "/categories", "/maps", "/floor-plans", "/media", "/preview", "/overview", "/launch"];
const rows = [];
for (const r of routes) {
  await go(page, `/projects/${P}${r}`); await settle(page, 1800);
  const m = await page.evaluate(() => {
    const h = document.querySelector("main h1"); if (!h) return null;
    const b = h.getBoundingClientRect(), cs = getComputedStyle(h);
    const main = document.querySelector("main").getBoundingClientRect();
    return { text: h.textContent.trim(), top: Math.round(b.top*10)/10, left: Math.round(b.left*10)/10, h: b.height, fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, col: cs.color, mainLeft: main.left, mainTop: main.top, title: document.title };
  });
  rows.push([r || "/", JSON.stringify(m)]);
  await shot(page, `pagehead${r.replace("/", "_") || "_dash"}__default__1440`);
}
for (const r of rows) console.log(r.join("  "));
console.log("errs", errs);
await browser.close();
