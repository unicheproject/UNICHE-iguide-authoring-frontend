import { open, go, shot, POP } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
for (const vp of ["1440","1280","1024","768","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  for (const k of kinds) {
    await go(page, `/projects/${POP}/${k}`);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await page.waitForTimeout(800);
    const scroller = await page.evaluate(() => { let e = document.querySelector("main"); while (e && !(e.scrollHeight > e.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e ? (e.tagName + "." + (e.className+"").slice(0,30)) : "window"; });
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const vh = innerHeight;
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const st = [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).position === "sticky" && vis(e));
      let bottom = 0; for (const e of st) { const r = e.getBoundingClientRect(); if (r.top < vh/2 && r.top >= -1) bottom = Math.max(bottom, r.bottom); }
      const hdr = document.querySelector("header"); const hb = hdr ? hdr.getBoundingClientRect().bottom : 0;
      const rows = [...document.querySelectorAll("tbody tr, [role=row]")].filter(vis).map((e) => e.getBoundingClientRect());
      const under = rows.find((r) => r.bottom > bottom && r.top < bottom);
      const first = rows.find((r) => r.top >= bottom);
      const layout = document.querySelector("tbody tr") ? getComputedStyle(document.querySelector("tbody tr")).display : "?";
      return { vh, hb, stickyBottom: Math.round(bottom), pct: Math.round(bottom / vh * 100), cutRowPx: under ? Math.round(bottom - under.top) : 0, firstRowTop: first ? Math.round(first.top) : null, layout, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth };
    });
    console.log(vp, k, scroller, JSON.stringify(m));
    await shot(page, `${k}-list__scrolled`, vp);
    if (vp === "768" || vp === "zoom200") await shot(page, `${k}-list__top`, vp);
  }
  await browser.close();
}
