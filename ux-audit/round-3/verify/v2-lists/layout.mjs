import { open, go, P, KINDS, ready, shot, save, loadList } from "./h.mjs";
const res = {};
for (const vp of ["1440", "1280", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    await loadList(page, `/projects/${P}/${k}`);
    res[`${k}@${vp}`] = await page.evaluate(() => {
      const box = (e) => e.getBoundingClientRect();
      const table = document.querySelector("main table");
      const rows = [...document.querySelectorAll("[data-row-id]")];
      const out = { mode: table && getComputedStyle(table).display !== "none" && box(table).width > 0 ? "table" : "cards", rows: rows.length, docOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
      const ths = [...document.querySelectorAll("main thead th")];
      if (out.mode === "table") {
        out.theadH = [...new Set(ths.map((t) => Math.round(box(t).height)))];
        out.orderW = ths[0] ? Math.round(box(ths[0]).width) : null;
      }
      const tw = [], rh = [], slugTrunc = [], slugLines = [], updLines = [], chipWrap = [], chipCount = [], overl = [], ovfl = [];
      for (const r of rows) {
        rh.push(Math.round(box(r).height));
        const t = r.querySelector(".list-tree-cell .min-w-0.flex-1") || r.querySelector("a");
        if (t) tw.push(Math.round(box(t).width));
        const slug = r.querySelector("p.mono");
        if (slug) { slugTrunc.push(slug.scrollWidth > slug.clientWidth + 1); slugLines.push(Math.round(box(slug).height / parseFloat(getComputedStyle(slug).lineHeight))); }
        const tc = r.querySelector("ul.list-none"); if (tc) chipCount.push(tc.querySelectorAll(":scope > li").length);
        const cells = [...r.querySelectorAll(":scope > td")];
        const upd = cells.length ? cells[cells.length - 2] : null;
        if (upd) { const tx = [...upd.querySelectorAll("*")].filter((e) => !e.children.length && e.textContent.trim()); const e = tx[0] || upd; updLines.push(Math.round(box(e).height / parseFloat(getComputedStyle(e).lineHeight))); }
        r.querySelectorAll(".ui-chip").forEach((c) => { const lh = parseFloat(getComputedStyle(c).lineHeight); const tn = c.querySelector("span.truncate"); if (!tn && box(c).height > lh * 1.9 + 4) chipWrap.push(c.textContent.trim().slice(0, 24)); });
        for (let i = 0; i < cells.length; i++) { if (cells[i].scrollWidth > cells[i].clientWidth + 1) ovfl.push(i); for (let j = i + 1; j < cells.length; j++) { const a = box(cells[i]), b = box(cells[j]); if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overl.push(`${i}x${j}`); } }
      }
      const mn = (a) => (a.length ? Math.min(...a) : null), mx = (a) => (a.length ? Math.max(...a) : null);
      const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
      Object.assign(out, { titleMin: mn(tw), titleMax: mx(tw), rowMed: med(rh), rowMax: mx(rh), rowMin: mn(rh), slugTruncatedRows: slugTrunc.filter(Boolean).length, slugRows: slugTrunc.length, slugMaxLines: mx(slugLines), updMaxLines: mx(updLines), chipWrapped: chipWrap.slice(0, 3), chipCountMax: mx(chipCount), overlaps: overl.length, overflowCells: ovfl.length });
      const m = document.querySelector("main"); out.footerTop = null;
      return out;
    });
    if (["1440", "1280", "1024", "768", "zoom200"].includes(vp)) await shot(page, `${k}__populated__${vp}`, { fullPage: false });
  }
  await browser.close();
}
save("layout", res);
const cols = ["1440", "1280", "1024", "768", "zoom200"];
for (const k of KINDS) for (const vp of cols) { const r = res[`${k}@${vp}`]; console.log(k, vp, JSON.stringify(r)); }
