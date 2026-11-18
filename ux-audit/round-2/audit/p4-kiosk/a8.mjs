import { open, go, P, shot, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "768", touch: true });
await go(page, `/projects/${P}/pois`); await settle(page, 2500);
const b = page.getByRole("button", { name: /^Actions for/ }).first();
const bb = await b.boundingBox(); console.log(bb);
console.log(await page.evaluate(({x,y}) => { const out={}; for (const d of [0,6,9,12,16,22]) { const e=document.elementFromPoint(x+d, y); out[d]=(e?.closest("button")?.getAttribute("aria-label")||e?.tagName||"").slice(0,30); } const btn=document.querySelector('button[aria-label^="Actions for"]'); const cs=getComputedStyle(btn); const af=getComputedStyle(btn,"::after"); return {out, pad:cs.padding, minH:cs.minHeight, afterW:af.width, afterH:af.height, pointer: matchMedia("(pointer: coarse)").matches, hover: matchMedia("(hover: none)").matches}; }, {x:bb.x+bb.width/2, y:bb.y+bb.height/2}));
await browser.close();
