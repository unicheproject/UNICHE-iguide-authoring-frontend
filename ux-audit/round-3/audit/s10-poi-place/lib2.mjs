import { open, go, P, shot, settle, SH } from "./h.mjs";
import { readFileSync } from "node:fs";
export { open, go, P, shot, settle, SH };
export const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1")));
export const path = k => ids[k].replace("http://localhost:5173","");
export const measure = (page) => page.evaluate(() => {
  const main = document.querySelector("main"); const st = main.scrollTop;
  const r = e => { const b = e.getBoundingClientRect(); return `x${Math.round(b.x)} y${Math.round(b.y+st)} w${Math.round(b.width)} h${Math.round(b.height)}` };
  const secs = [...document.querySelectorAll("main section")].filter(s=>s.querySelector("h2,h3")).map(s => { const cs=getComputedStyle(s); const h=s.querySelector("h2,h3"); const hc=getComputedStyle(h); return `${s.id||"-"} | ${r(s)} | pad ${cs.padding} | ${h.tagName} ${hc.fontSize}/${hc.fontWeight} "${h.textContent.trim().slice(0,40)}"`});
  return { vh: innerHeight, vw: innerWidth, scrollH: main.scrollHeight, secs };
});
