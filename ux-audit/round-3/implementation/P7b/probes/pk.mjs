import { open, go, P, shot } from "./h.mjs";
const vp = process.argv[2] ?? "1440"; const tag = process.argv[3] ?? "after";
const { browser, page } = await open("admin", { viewport: vp, forcedColors: process.argv[4] === "fc" ? "active" : "none" });
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3000);
await page.locator("tbody a, ul a").filter({ hasText: /./ }).first().click(); await page.waitForTimeout(3000);
const btn = page.getByRole("button", { name: /Add Primary image/ }).first();
await btn.scrollIntoViewIfNeeded(); await btn.click(); await page.waitForTimeout(1500);
const dl = page.locator("[role=dialog]");
await dl.locator("#picker-search").fill("UX-R3-P7b"); await page.waitForTimeout(500);
await dl.getByRole("button", { name: "Any status" }).click().catch(async () => { await dl.locator("summary").click(); await dl.getByRole("button", { name: "Any status" }).click(); });
await page.waitForTimeout(600);
const d = await page.evaluate(() => {
  const dlg = document.querySelector("[role=dialog]");
  const tiles = [...dlg.querySelectorAll("button[data-asset-id]")];
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };
  const scroller = [...dlg.querySelectorAll("*")].find((e) => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight; });
  return {
    tiles: tiles.map((t) => { const chips = t.querySelector("span.flex"); const img = t.querySelector("img"); return { name: t.innerText.split("\n")[0].slice(0, 22), tile: R(t), chipsBottom: chips ? R(chips).b : null, chipsY: chips ? R(chips).y : null, img: img ? [img.clientWidth, img.clientHeight, img.naturalWidth, img.naturalHeight] : null, text: t.innerText.replace(/\n+/g, " | ") }; }),
    rowsVisible: (() => { if (!scroller) return tiles.filter((t) => { const r = t.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).length; const sb = scroller.getBoundingClientRect(); return tiles.filter((t) => { const r = t.getBoundingClientRect(); return r.top >= sb.top - 1 && r.bottom <= sb.bottom + 1; }).length; })(),
    scrollerH: scroller && Math.round(scroller.clientHeight), dlg: R(dlg), vh: innerHeight,
  };
});
console.log(JSON.stringify(d, null, 1));
await shot(page, `picker__${vp}${process.argv[4] ? "-" + process.argv[4] : ""}__${tag}`);
await browser.close();
