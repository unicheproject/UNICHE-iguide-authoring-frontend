import * as L from "./lib.mjs";
for (const vp of ["1280", "1024"]) {
const { page, browser } = await L.open("curator", { viewport: vp });
const k = page.keyboard;
await L.nav(page, L.P("/pois/35d91cba-d64a-43ce-9773-1e472226d028"), 1800);
await page.evaluate(() => document.querySelector("h1")?.focus());
const bad = [];
for (let i = 0; i < 45; i++) {
  await k.press("Tab"); await page.waitForTimeout(80);
  const r = await page.evaluate(() => { const e = document.activeElement; const b = e.getBoundingClientRect(); const stick = [...document.querySelectorAll("header, .sticky")].filter((x) => { const p = getComputedStyle(x).position; return p === "sticky" || p === "fixed"; }).map((x) => x.getBoundingClientRect().bottom); const bottomStick = Math.max(0, ...stick.filter((v) => v < innerHeight * 0.6)); return { n: (e.getAttribute("aria-label") || e.textContent || e.id).trim().slice(0, 30), top: Math.round(b.top), bottomStick: Math.round(bottomStick), h: Math.round(b.height), vh: innerHeight, bottom: Math.round(b.bottom) }; });
  if (r.top < r.bottomStick - 2 || r.bottom > r.vh) bad.push(r);
}
L.log("t43", vp, "focused elements obscured by sticky/bottom:", JSON.stringify(bad));
await browser.close();
}
