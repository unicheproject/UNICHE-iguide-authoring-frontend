import { open, go, P, shot, settle, KINDS } from "./h.mjs";
import fs from "node:fs";
const VPS = process.argv[2] ? process.argv[2].split(",") : ["1440","1280","1024","768","zoom200"];
const out = {};
for (const vp of VPS) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    await go(page, `/projects/${P}/${k}`); await settle(page, 2200);
    const m = await page.evaluate(() => {
      const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width*10)/10, h: Math.round(b.height*10)/10 }; };
      const lines = (e) => { const rg = document.createRange(); rg.selectNodeContents(e); const ys = new Set([...rg.getClientRects()].map(b => Math.round(b.top))); return ys.size; };
      const t = document.querySelector("main table");
      const o = { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
      if (!t) { o.noTable = true; o.main = document.querySelector("main").innerText.slice(0,300); return o; }
      const cs = getComputedStyle(t);
      o.tableDisplay = cs.display;
      o.ths = [...t.querySelectorAll("thead th")].map(th => ({ t: th.textContent.trim() || "(blank)", w: r(th).w, h: r(th).h, sort: th.getAttribute("aria-sort"), btn: !!th.querySelector("button") }));
      const rows = [...t.querySelectorAll("tbody tr")];
      o.nRows = rows.length;
      const hs = rows.map(x => r(x).h).sort((a,b)=>a-b);
      o.rowH = { median: hs[Math.floor(hs.length/2)], max: hs[hs.length-1], min: hs[0] };
      o.rowStats = rows.slice(0, 60).map(tr => {
        const tds = [...tr.children];
        const link = tr.querySelector("td:nth-child(2) a");
        const slug = tr.querySelector("td:nth-child(2) .mono:not(.ui-chip)");
        const upd = tr.querySelector("time");
        return {
          cellW: tds.map(td => r(td).w),
          titleW: link ? r(link).w : null, titleLines: link ? lines(link) : null,
          indentX: link ? Math.round(link.getBoundingClientRect().x - tr.getBoundingClientRect().x) : null,
          slugTrunc: slug ? slug.scrollWidth > slug.clientWidth + 1 : null, slugLines: slug ? lines(slug) : null, slugW: slug ? r(slug).w : null,
          updLines: upd ? lines(upd) : null,
          h: r(tr).h,
          overflow: [...tr.querySelectorAll("td")].map((td,i)=>[...td.querySelectorAll("*")].some(e=>e.getBoundingClientRect().right>td.getBoundingClientRect().right+1 && e.getBoundingClientRect().width>0)?i:-1).filter(i=>i>=0),
          wordBreak: link ? (link.scrollWidth>link.clientWidth+1) : null,
        };
      });
      const tb = document.querySelector("main [role=toolbar], main .sticky");
      o.sticky = tb ? { ...r(tb), pos: getComputedStyle(tb).position, top: getComputedStyle(tb).top } : null;
      return o;
    });
    out[`${k}@${vp}`] = m;
    await shot(page, `${k}__default__${vp}`);
    const tr = m.rowStats || [];
    console.log(k, vp, "rows", m.nRows, "rowH", JSON.stringify(m.rowH), "sw", m.scrollW, m.clientW, "ths", (m.ths||[]).map(t => `${t.t}:${t.w}${t.sort?"("+t.sort+")":""}`).join(" | "),
      "titleW min/med", tr.length ? Math.min(...tr.map(x=>x.titleW??999)) : "", "slugTrunc", tr.filter(x=>x.slugTrunc).length+"/"+tr.length, "overflowRows", tr.filter(x=>x.overflow.length).length, "slugWrap", tr.filter(x=>x.slugLines>1).length, "updWrap", tr.filter(x=>x.updLines>1).length, "sticky", JSON.stringify(m.sticky));
  }
  await browser.close();
}
fs.writeFileSync(new URL("./m1.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), JSON.stringify(out, null, 1));
