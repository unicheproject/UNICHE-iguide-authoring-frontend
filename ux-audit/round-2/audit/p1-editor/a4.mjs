import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, page } = await open("curator", { viewport: "1440" });
const reqs=[]; page.on("response", r=>{ if(r.url().includes("/api/v1") && r.request().method()!=="GET") reqs.push(r.request().method()+" "+r.url().split("/api/v1")[1]+" "+r.status()+" "+Math.round(r.request().timing().responseEnd)) });
await go(page, `/projects/${P}/pois/${ID}`);
await page.getByRole("heading", { level: 1 }).first().waitFor(); await settle(page,1000);
// audio picker
await page.getByRole("button",{name:/choose audio narration/i}).first().click(); await settle(page,1500);
await shot(page,"asset-picker__audio-from-poi__1440");
const d=page.getByRole("dialog");
console.log("PICKER:", (await d.innerText()).slice(0,1500));
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,160)));
await browser.close();
