import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois/40cab7b2-a7f7-4057-b56e-5605a589156f"); await p.waitForTimeout(1500);
console.log("restore banner?", await p.getByText(/restore|unsaved/i).allInnerTexts());
await p.getByLabel("Summary").fill("A marble kouros used for the editor audit. Short and plain.");
await p.getByRole("button",{name:/choose asset/i}).first().click();
await p.locator("[role=dialog]").waitFor(); await p.waitForTimeout(800);
// type to search
await p.getByPlaceholder(/Search by name/).fill("klep"); await p.waitForTimeout(600);
await s.shot("asset-picker__image-search");
await p.locator("[role=dialog]").getByText("klepsydra",{exact:true}).click();
await s.shot("asset-picker__image-selected");
console.log((await p.locator("[role=dialog]").innerText()).slice(-200));
await p.getByRole("button",{name:/use this image/i}).click(); await p.waitForTimeout(600);
// audio
await p.getByRole("button",{name:/^choose$/i}).first().click();
await p.locator("[role=dialog]").waitFor(); await p.waitForTimeout(800);
await s.shot("asset-picker__audio-open");
console.log("AUDIO DLG:", (await p.locator("[role=dialog]").innerText()).slice(0,900));
await s.browser.close();
