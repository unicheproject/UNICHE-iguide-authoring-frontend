// Acceptance: mode per list per width, Title >= 240, row heights, slug truncation, Updated one line, Next date, Updated colour, "Used by" wrap.
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
      const lines = (e) => Math.round(box(e).height / parseFloat(getComputedStyle(e).lineHeight));
      const titleW = [], overlaps = [], overflow = [], heights = [];
      let slugMulti = 0, slugCut = 0, updMulti = 0, nextMulti = 0, usedMulti = 0;
      const updColors = new Set();
      for (const row of rows) {
        heights.push(Math.round(box(row).height));
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
        const slug = row.querySelector(".mono");
        if (slug) { if (lines(slug) > 1 && !slug.closest("p")?.querySelector(".mono")?.hasAttribute("title")) slugMulti++; else if (lines(slug) > 1) slugMulti++; if (slug.scrollWidth > slug.clientWidth + 1) slugCut++; }
        const t = row.querySelector("time");
        if (t) { if (lines(t) > 1) updMulti++; updColors.add(getComputedStyle(t).color); }
        const used = [...row.querySelectorAll("span,p")].find((e) => /^Used by/.test(e.textContent.trim()) && e.children.length === 0);
        if (used && lines(used) > 1) usedMulti++;
        const next = row.querySelector("[data-next]") ;
      }
      const sorted = [...heights].sort((a, b) => a - b);
      const ths = [...document.querySelectorAll("main thead th")];
      return {
        mode: table ? "table" : cards ? "cards" : "none", rows: rows.length,
        titleMin: Math.min(...titleW), titleMax: Math.max(...titleW),
        overlaps: overlaps.length, overflow: overflow.length,
        rowH: { median: sorted[Math.floor(sorted.length / 2)], max: sorted[sorted.length - 1], min: sorted[0] },
        slugMulti, slugCut, updMulti, usedMulti, updColors: [...updColors],
        theadH: ths.map((t) => Math.round(box(t).height)),
        docOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    if (["1440", "1280", "1024", "768"].includes(vp)) await shot(page, `layout-${k}__${vp}`);
  }
  await browser.close();
}
save("layout", res);
console.log(PHASE, JSON.stringify(res, null, 0).replace(/\},"/g, "},\n\""));
