import { start, go, P, shotDir, axe } from "./common.mjs";
const out = {};
for (const vp of ["1440","1280","1024","768"]) {
  const s = await start(vp); const page = s.page;
  await go(page, P + "/preview"); await page.waitForTimeout(1500);
  for (const surf of ["Web","Mobile","Kiosk"]) {
    await page.getByRole("button",{name:surf,exact:true}).click(); await page.waitForTimeout(500);
    await s.shot(`preview__${surf.toLowerCase()}`);
    out[`${vp}-${surf}`] = await page.evaluate(() => {
      const f = document.querySelector("[data-preview-frame]"); const inner = f.querySelector("div.relative > div");
      const m = /scale\(([\d.]+)\)/.exec(inner?.style.transform||"");
      const fr = f.getBoundingClientRect(); const cs = inner && getComputedStyle(inner);
      const caption = document.querySelector("main p.text-center")?.textContent;
      const smalls = [...inner.querySelectorAll("*")].filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>parseFloat(getComputedStyle(e).fontSize)*(m?+m[1]:1));
      return { caption, scale: m&&+m[1], frameW: Math.round(fr.width), frameH: Math.round(fr.height), innerW: cs?.width, minEffectivePx: Math.min(...smalls).toFixed(1), medianPx: smalls.sort((a,b)=>a-b)[smalls.length>>1].toFixed(1), docScrollW: document.documentElement.scrollWidth, innerWidth, label: f.getAttribute("aria-label"), role: f.getAttribute("role"), h1: document.querySelectorAll("h1").length, tabbables: f.querySelectorAll("a,button,input,select,textarea,[tabindex]").length, mainOverflowX: document.querySelector("main").scrollWidth - document.querySelector("main").clientWidth };
    });
  }
  if (vp==="1440") { out.axe = await axe(page,"preview"); }
  await s.browser.close();
}
s_save: { const fs = await import("node:fs"); fs.writeFileSync("ux-audit/round-1/audit/s14-preview/out/a1.json", JSON.stringify(out,null,1)); }
console.log(JSON.stringify(out,null,1));
