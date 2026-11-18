import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois/40cab7b2-a7f7-4057-b56e-5605a589156f"); await p.waitForTimeout(1500);
await p.getByLabel("Summary").fill("A marble kouros used for the editor audit. Short and plain.");
await p.getByRole("button",{name:/choose asset/i}).first().click();
await p.locator("[role=dialog]").getByText("klepsydra",{exact:true}).click();
await p.getByRole("button",{name:/use this image/i}).click(); await p.waitForTimeout(500);
await p.getByRole("button",{name:/^choose$/i}).first().click();
await p.locator("[role=dialog]").getByText("ambient-agora",{exact:true}).click();
await p.getByRole("button",{name:/use this file/i}).click(); await p.waitForTimeout(500);
// category & place
await p.getByLabel("Category").selectOption({label:"Monuments and Temples"});
const placeOpts = await p.getByLabel("Place").locator("option").allInnerTexts();
const gal = placeOpts.find(o=>/Parthenon Gallery/.test(o)); await p.getByLabel("Place").selectOption({label:gal});
// map click
const map = p.locator(".leaflet-container").first(); await map.scrollIntoViewIfNeeded();
const b = await map.boundingBox(); await p.mouse.click(b.x+b.width*0.5,b.y+b.height*0.45); await p.waitForTimeout(500);
console.log("lat/lon", await p.locator("#f-lat").inputValue(), await p.locator("#f-lon, #f-lng").first().inputValue());
await s.shot("poi-editor__alpha-placement-filled");
// save
let t=Date.now(); await p.getByRole("button",{name:/^save$/i}).click();
await p.waitForTimeout(100);
await s.shot("poi-editor__alpha-saving");
await p.getByText(/saved/i).first().waitFor({timeout:8000}).catch(()=>console.log("no saved text"));
console.log("save ms", Date.now()-t);
await p.waitForTimeout(500);
await s.shot("poi-editor__alpha-saved");
console.log("toasts:", await p.locator("[role=status],[role=alert]").allInnerTexts());
await s.browser.close();
