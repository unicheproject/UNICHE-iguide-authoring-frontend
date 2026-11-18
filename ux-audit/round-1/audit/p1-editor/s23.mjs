import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
let t=Date.now();
await go(p, P+"/media"); await p.waitForTimeout(1500);
console.log("media load", Date.now()-t);
await s.shot("media__default");
console.log((await p.locator("main").innerText()).replace(/\n+/g," | ").slice(0,1500));
console.log("scrollable height", await p.evaluate(()=>{const e=[...document.querySelectorAll("*")].find(e=>e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY!="visible");return e?e.scrollHeight:0}));
await s.browser.close();
