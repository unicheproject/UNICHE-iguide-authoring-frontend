import * as H from "./h.mjs";
const log = H.LOG("e11");
const { browser, context, page } = await H.session();
const id = H.ids.poi;
const dl = []; page.on("dialog", async (d) => { dl.push(d.type()); await d.accept(); });
await H.go(page, H.P("/pois/" + id)); await H.sleep(1500);
await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(" reloadme");
await H.sleep(1200);
await page.reload({ waitUntil: "domcontentloaded" }).catch(()=>{}); await H.sleep(3000);
log("## reload", { dl, msgs: (await H.msgs(page)).filter(x=>/nsaved|Restore/.test(x)), title: await page.locator("#f-title").inputValue(), focus: await H.AE(page) });
await H.shot(page, "poi-editor__restore-row__1440");
const row = await page.evaluate(() => { const b=[...document.querySelectorAll("button")].find(x=>/^Restore/.test(x.textContent.trim())); if(!b) return null; const r=b.closest("div").getBoundingClientRect(); const f=document.querySelector("#f-title").getBoundingClientRect(); return {row:[r.x,r.y,r.width,r.height].map(Math.round), titleTop: Math.round(f.y)}; });
log("restore row rect", row);
await page.getByRole("button", { name: /^Restore/ }).click(); await H.sleep(800);
log("after restore", { focus: await H.AE(page), title: await page.locator("#f-title").inputValue(), msgs: await H.msgs(page), live: (await H.live(page)).map(x=>x.text) });
await H.shot(page, "poi-editor__after-restore__1440");
// Save then confirm row clears
await page.getByRole("button", { name: /^Save/ }).first().click(); await H.sleep(2000);
log("after save", { msgs: await H.msgs(page) });
// project switcher
await page.getByRole("button", { name: /Switch project/ }).click(); await H.sleep(800);
await H.shot(page, "poi-editor__switcher__1440");
log("switcher", await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=listbox],[data-state=open]")].map(e=>e.getAttribute("role")+": "+e.innerText.replace(/\s+/g," ").slice(0,200))));
await browser.close();
