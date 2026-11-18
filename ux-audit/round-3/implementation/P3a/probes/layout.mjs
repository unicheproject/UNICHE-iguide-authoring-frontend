// Acceptance: Title cell >= 240 at 1280 and 1024, no overprint; row anatomy numbers (Order width, header height, slug lines).
import { open, go, P, KINDS, settle, shot, save, PHASE } from "./h.mjs";
const res = {};
for (const vp of ["1440", "1280", "1024", "768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    await go(page, `/projects/${P}/${k}`);
    await page.waitForSelector("[data-row-id]", { timeout: 20000 }).catch(() => {});
    await settle(page, 800);
    res[`${k}@${vp}`] = await page.evaluate(() => {
      const table = document.querySelector("main table");
      const cards = document.querySelector("main ul.list-none");
      const rows = [...document.querySelectorAll("[data-row-id]")];
      const box = (e) => e.getBoundingClientRect();
      const titleW = [], overlaps = [], overflow = [];
      for (const row of rows) {
        const cells = [...row.querySelectorAll(":scope > td")];
        if (cells.length) {
          const idx = cells.findIndex((c) => c.classList.contains("list-tree-cell"));
          titleW.push(Math.round(box(cells[idx]).width));
          for (let i = 0; i < cells.length; i++) {
            if (cells[i].scrollWidth > cells[i].clientWidth + 1) overflow.push(`${row.dataset.rowId.slice(0, 4)}:${i}`);
            for (let j = i + 1; j < cells.length; j++) { const a = box(cells[i]), b = box(cells[j]); if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlaps.push(`${i}x${j}`); }
          }
        } else {
          const t = row.querySelector(":scope > div > .min-w-0, :scope .flex-1");
          titleW.push(Math.round(box(t ?? row).width));
        }
      }
      const ths = [...document.querySelectorAll("main thead th")];
      return {
        mode: table ? "table" : cards ? "cards" : "none", rows: rows.length,
        titleMin: Math.min(...titleW), titleMax: Math.max(...titleW),
        overlaps: overlaps.length, overflow: overflow.length,
        theadH: ths.map((t) => Math.round(box(t).height)),
        orderW: ths[0] && ths[0].textContent.trim() === "Order" ? Math.round(box(ths[0]).width) : null,
        docOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    if (["1440","1280", "1024"].includes(vp)) await shot(page, `layout-${k}__${vp}`);
  }
  await browser.close();
}
// Greek 60-char title rows
const { browser, page } = await open("admin", { viewport: "1024" });
for (const [k, q] of [["pois", "UX-R3-P3core"]]) {
  await go(page, `/projects/${P}/${k}?q=${q}`); await settle(page, 1500);
  res[`greek-${k}@1024`] = await page.evaluate(() => { const rows = [...document.querySelectorAll("[data-row-id]")]; return rows.map((r) => { const cells = [...r.querySelectorAll(":scope > td")]; let ov = 0; for (let i = 0; i < cells.length; i++) { if (cells[i].scrollWidth > cells[i].clientWidth + 1) ov++; for (let j = i + 1; j < cells.length; j++) { const a = cells[i].getBoundingClientRect(), b = cells[j].getBoundingClientRect(); if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) ov++; } } const link = r.querySelector("a"); return { text: link?.textContent.trim().length, lines: link ? Math.round(link.getBoundingClientRect().height / parseFloat(getComputedStyle(link).lineHeight)) : 0, bad: ov }; }); });
  await shot(page, `greek-${k}__1024`);
}
await browser.close();
save("layout", res);
console.log(PHASE, JSON.stringify(res, null, 0).replace(/\},"/g, "},\n\""));
