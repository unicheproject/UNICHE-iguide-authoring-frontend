import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
p.on("response", r=>{ if(r.request().method()!=="GET") console.log("  ",r.request().method(), r.url().replace(/.*v1\/projects\/[^/]+/,""), r.status()); });
await go(p, P + "/pois"); await p.waitForTimeout(1500);
const order = async()=> (await p.locator("main a[href*='/pois/']").allInnerTexts()).filter(x=>/UX-p1-editor/.test(x));
console.log(await order());
const row = n=>p.locator("tbody tr").filter({hasText:n}).first();
await row("UX-p1-editor Delta").scrollIntoViewIfNeeded();
const h = row("UX-p1-editor Delta").locator("span[draggable=true]");
const t=Date.now();
await h.dragTo(row("UX-p1-editor Gamma"), {targetPosition:{x:200,y:5}});
await p.waitForTimeout(1200);
console.log("drag ms", Date.now()-t, await order());
// mid drag screenshot
const hb = await row("UX-p1-editor Alpha Kouros").locator("span[draggable=true]").boundingBox();
await p.mouse.move(hb.x+5,hb.y+5); await p.mouse.down(); const tb=await row("UX-p1-editor Beta").boundingBox(); await p.mouse.move(tb.x+300,tb.y+10,{steps:8});
await s.shot("pois-list__drag-in-progress"); await p.keyboard.press("Escape"); await p.mouse.up(); await p.waitForTimeout(1000);
console.log("after esc/cancel", await order());
// restore Delta down
await p.locator("button[aria-label='Move UX-p1-editor Delta down']").click().catch(()=>{}); await p.waitForTimeout(800);
await s.browser.close();
