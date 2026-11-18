import { start, go, P } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois"); await p.waitForTimeout(800);
await p.getByRole("button",{name:/New point of interest/i}).click(); await p.waitForTimeout(500);
await s.shot("poi-create__dialog-open");
console.log(await p.locator("[role=dialog]").innerText());
console.log("focus", await p.evaluate(()=>document.activeElement.outerHTML.slice(0,150)));
// submit empty
await p.locator("[role=dialog] button[type=submit]").click().catch(async()=>{ await p.getByRole("button",{name:/^create/i}).click();});
await p.waitForTimeout(500);
await s.shot("poi-create__empty-submit");
console.log("---after empty submit\n"+await p.locator("[role=dialog]").innerText());
await s.browser.close();
