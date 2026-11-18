import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois/40cab7b2-a7f7-4057-b56e-5605a589156f"); await p.waitForTimeout(1500);
await p.getByLabel("Category").selectOption({label:"Sculpture"});
console.log("cat set", await p.getByLabel("Category").inputValue());
const opts = await p.getByLabel("Place").locator("option").allInnerTexts();
await p.getByLabel("Place").selectOption({label:opts.find(o=>/Propylaea/.test(o))});
console.log("cat after place change", await p.getByLabel("Category").inputValue());
// Leave without saving: nav click to Routes
await p.getByRole("link",{name:"Routes"}).click(); await p.waitForTimeout(1000);
await s.shot("poi-editor__leave-unsaved");
console.log("url", p.url(), "dialog:", await p.locator("[role=dialog],[role=alertdialog]").allInnerTexts());
await p.goBack(); await p.waitForTimeout(1500);
await s.shot("poi-editor__back-after-leave");
console.log("restore:", await p.getByText(/restore|discard|unsaved/i).allInnerTexts(), "cat", await p.getByLabel("Category").inputValue());
await s.browser.close();
