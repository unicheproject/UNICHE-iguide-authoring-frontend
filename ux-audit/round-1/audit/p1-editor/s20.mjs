import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois"); await p.waitForTimeout(1500);
const li = p.locator("main li, main [role=row]").filter({hasText:"UX-p1-editor Beta"}).first();
console.log((await li.evaluate(e=>e.outerHTML)).slice(0,1800));
await s.browser.close();
