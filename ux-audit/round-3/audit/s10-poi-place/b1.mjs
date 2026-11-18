import { open, go, P, shot, settle } from "./h.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1")));
const vp = process.argv[2] ?? "1440"; const key = process.argv[3] ?? "poiA";
const { browser, page } = await open("admin", { viewport: vp });
try {
  await go(page, ids[key].replace("http://localhost:5173","")); await settle(page,2000);
  await shot(page, `poi-${key}__empty-draft__${vp}`);
  const m = await page.evaluate(() => {
    const main = document.querySelector("main");
    const r = e => { const b = e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y+ (main?main.scrollTop:0)),w:Math.round(b.width),h:Math.round(b.height)} };
    const cards = [...document.querySelectorAll("main section, main [data-card], main form > *")].slice(0,0);
    const secs = [...document.querySelectorAll("main section")].map(s => { const cs=getComputedStyle(s); const h=s.querySelector("h2,h3"); const hc=h?getComputedStyle(h):null; return {id:s.id, rect:r(s), pad:cs.padding, gap:cs.rowGap, h:h?.textContent.trim(), hfs:hc?.fontSize, hfw:hc?.fontWeight, hmb:hc?.marginBottom}});
    const hdr = document.querySelector("header[data-editor-header], main header") ;
    const btns=[...document.querySelectorAll("main button, main a")].filter(b=>b.getBoundingClientRect().top<200).map(b=>({t:(b.getAttribute("aria-label")||b.textContent).trim().slice(0,30), ...r(b), pos:getComputedStyle(b).position}));
    return { vh:innerHeight, scrollH: main?.scrollHeight, mainClient:main?.clientHeight, secs, btns, h1: (()=>{const h=document.querySelector("h1"); const b=h.getBoundingClientRect(); return {t:h.textContent.trim(),fs:getComputedStyle(h).fontSize,lh:getComputedStyle(h).lineHeight,...r(h)}})() };
  });
  console.log(JSON.stringify(m,null,1));
} finally { await browser.close(); }
