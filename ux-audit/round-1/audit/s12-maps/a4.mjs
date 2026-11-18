import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
for (const vp of ["1440","1280"]) {
const s = await start(vp); const { page } = s;
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(6000);
await s.shot("mapeditor__draft-settled", true);
if (vp==="1440") {
 // measure controls
 const m = await page.evaluate(()=>{
  const r=(el)=>{const b=el.getBoundingClientRect();return [Math.round(b.width),Math.round(b.height)]};
  const q=(sel)=>[...document.querySelectorAll(sel)].map(e=>({t:(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,30),s:r(e),fs:getComputedStyle(e).fontSize,c:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));
  return {leaflet:q(".leaflet-control-zoom a"), tools:q(".map-tool"), chips:q("[aria-label='Visitor filter preview'] button").slice(0,3), place:q("ul button").slice(0,2), remove:q("ol button").slice(0,2)};
 });
 console.log(JSON.stringify(m,null,1));
}
await s.browser.close();
}
