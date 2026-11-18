import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois/40cab7b2-a7f7-4057-b56e-5605a589156f"); await p.waitForTimeout(1500);
console.log("summary kept:", await p.getByLabel("Summary").inputValue(), "| lat", await p.locator("#f-lat").inputValue(), "| cat", await p.getByLabel("Category").inputValue());
await p.getByRole("button",{name:/\+ QR code/}).click();
await p.getByRole("button",{name:/\+ Geo-proximity/}).click(); await p.waitForTimeout(300);
// sticky check
await p.evaluate(()=>document.querySelector("main")?.scrollTo?.(0,900)); await p.mouse.wheel(0,1200); await p.waitForTimeout(400);
await s.shot("poi-editor__scrolled-unsaved-no-save-visible");
console.log("save button visible in viewport:", await p.getByRole("button",{name:/^save$/i}).isVisible(), await p.getByRole("button",{name:/^save$/i}).evaluate(e=>{const r=e.getBoundingClientRect();return r.top}));
await p.keyboard.press("Control+s"); await p.waitForTimeout(1500);
console.log("ctrl+s saved?", await p.getByText(/unsaved changes/i).count());
await p.getByRole("button",{name:/^save$/i}).click().catch(()=>{});
await p.waitForTimeout(1500);
await p.evaluate(()=>window.scrollTo(0,0));
await s.shot("poi-editor__after-save-triggers");
console.log("toast:", await p.locator("[role=status],[role=alert]").allInnerTexts());
// Activate
await p.getByRole("button",{name:/^activate$/i}).first().click(); await p.waitForTimeout(1000);
await s.shot("poi-activate__dialog");
console.log("DLG:", await p.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(()=>"(none)"));
await s.browser.close();
