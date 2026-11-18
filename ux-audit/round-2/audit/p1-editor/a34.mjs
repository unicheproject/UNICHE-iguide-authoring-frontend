import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, context, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${ID}`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
await page.getByLabel("Summary").fill("typed then reload"); await settle(page,1500);
await context.setOffline(true); await settle(page,1500);
await shot(page,"poi-editor__offline-dirty__1440");
console.log("offline banner:", (await page.locator("body").innerText()).split("\n").filter(l=>/offline|connection/i.test(l)).slice(0,4));
console.log("Ctrl+S offline:"); await page.keyboard.press("Control+s"); await settle(page,1000); console.log(await page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert]")].map(e=>e.textContent.trim().slice(0,150)).filter(Boolean)));
await context.setOffline(false); await settle(page,1000);
await page.reload(); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,2500);
await shot(page,"poi-editor__after-reload-dirty__1440");
console.log("RESTORE:", (await page.locator("main").innerText()).split("\n").filter(l=>/restore|unsaved|browser/i.test(l)).slice(0,5));
const rb=page.getByRole("button",{name:/Restore/}); if(await rb.count()){ await rb.click(); await settle(page,500); console.log("restored value:", await page.getByLabel("Summary").inputValue()); }
// discard local: reload again and Discard draft
await page.reload(); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,2000);
const db=page.getByRole("button",{name:/Discard (the )?(browser |local )?(draft|copy)|Discard/}).first(); console.log("discard btns:", await page.getByRole("button",{name:/Discard/}).allInnerTexts());
await browser.close();
