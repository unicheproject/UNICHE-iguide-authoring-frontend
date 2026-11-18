import { open, go, P, shot, settle } from "./h.mjs";
for (const vp of ["1280","1024","768","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/media?q=klepsydra`); await settle(page);
await page.locator("ul[aria-label='Media files'] a").first().click(); await page.waitForTimeout(2500);
const m = await page.evaluate(() => { const f = (e) => e && (r => [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)])(e.getBoundingClientRect()); const hdr=[...document.querySelectorAll("header,div")].filter(e=>getComputedStyle(e).position==="sticky"||getComputedStyle(e).position==="fixed").map(e=>f(e)).filter(b=>b[1]<5&&b[3]>20&&b[2]>200); return { vh: innerHeight, alt: f(document.querySelector("textarea")), thumb: f(document.querySelector("main img")), sticky: hdr.slice(0,3), hscroll: document.documentElement.scrollWidth > innerWidth, usedIn: document.querySelector("main").innerText.match(/Used in[^\n]*/g)?.slice(0,3) }; });
console.log(vp, JSON.stringify(m));
await shot(page, `editor__klepsydra__${vp}`);
await browser.close(); }
