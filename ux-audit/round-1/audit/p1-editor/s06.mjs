import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois/40cab7b2-a7f7-4057-b56e-5605a589156f"); await p.waitForTimeout(1500);
// summary
await p.getByLabel("Summary").fill("A marble kouros used for the editor audit. Short and plain.");
// image picker
let t=Date.now();
await p.getByRole("button",{name:/choose asset/i}).first().click();
await p.locator("[role=dialog]").waitFor();
console.log("picker open ms", Date.now()-t);
await p.waitForTimeout(1200);
await s.shot("asset-picker__image-open");
console.log((await p.locator("[role=dialog]").innerText()).slice(0,1500));
console.log("focus in dialog:", await p.evaluate(()=>document.activeElement.outerHTML.slice(0,120)));
await s.browser.close();
