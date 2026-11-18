import { start, go, P } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois"); await p.waitForTimeout(800);
console.log("scrollH", await p.evaluate(()=>[document.documentElement.scrollHeight, document.querySelectorAll("main li, main tr, main [role=row]").length]));
// Tab order from page start
await p.keyboard.press("Tab");
const seq=[];
for (let i=0;i<22;i++){ seq.push(await p.evaluate(()=>{const e=document.activeElement;return (e.getAttribute("aria-label")||e.innerText||e.tagName).slice(0,40).replace(/\n/g," ")+" <"+e.tagName+">"}));await p.keyboard.press("Tab");}
console.log(seq.join("\n"));
await p.goto(p.url()); await p.waitForTimeout(800);
await p.getByRole("button",{name:/Filters/}).click(); await p.waitForTimeout(400);
await s.shot("pois-list__filters-open");
console.log((await p.locator("[role=dialog],[role=menu],[data-state=open]").first().innerText().catch(()=>"?")).slice(0,800));
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
console.log("after esc focus", await p.evaluate(()=>document.activeElement.innerText?.slice(0,30)));
await s.browser.close();
