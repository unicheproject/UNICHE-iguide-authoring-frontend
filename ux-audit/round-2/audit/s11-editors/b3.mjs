import { open, go, rec, P, shot, ready, axe, tall } from "./h.mjs";
const S="ux-audit/round-2/audit/s11-editors/shots/";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/routes/${rec.route}`); await ready(page,1200);
await page.getByRole("button",{name:"Add stops"}).click(); await page.waitForTimeout(600);
const dlg=page.getByRole("dialog"); await dlg.locator("#pick-search").fill("UX-R2-s11");await page.waitForTimeout(400);
for (const n of ["Alpha","Bravo","Charlie","Delta","Echo"]) await dlg.getByRole("button",{name:new RegExp("POI "+n)}).click();
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
const names=()=>page.evaluate(()=>[...document.querySelectorAll("main li, main [data-stop]")].map(e=>e.textContent.trim().slice(0,28)).filter(t=>/POI/.test(t)).slice(0,8));
const order=async()=>page.evaluate(()=>[...document.querySelectorAll("main a")].map(a=>a.textContent.trim()).filter(t=>/POI/.test(t)));
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean));
console.log("start",await order());
const mv = (label)=>page.getByRole("button",{name:new RegExp(label)});
console.log("buttons names:", await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>b.getAttribute("aria-label")).filter(a=>a&&/stop|Move|Remove|Drag/i.test(a)).slice(0,8)));
await page.getByRole("button",{name:/Move .*Alpha.* down|Move stop 1 down/i}).first().click().catch(e=>console.log("move btn miss"));
console.log("after down",await order(), await live());
console.log("focus", await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")));
// position select
const sel=page.getByRole("combobox",{name:/position/i}).first(); console.log("posselects", await page.getByRole("combobox",{name:/position/i}).count());
await sel.selectOption({index:3}).catch(e=>console.log("sel miss",e.message.slice(0,80)));
console.log("after pos",await order(), await live());
// handle keyboard
const handle=page.getByRole("button",{name:/Drag|Reorder|handle/i}).nth(1); console.log("handle", await handle.evaluate(e=>e.getAttribute("aria-label")+" | "+e.getAttribute("aria-describedby")));
await handle.focus(); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(300);
console.log("after handle down",await order(), await live());
await page.screenshot({path:S+"route-stops__reordered__1440.png"});
// remove
const rm=page.getByRole("button",{name:/Remove/i}); console.log("rm count",await rm.count(), await rm.first().getAttribute("aria-label"));
await rm.nth(1).click(); await page.waitForTimeout(500);
console.log("after remove",await order(),await live());
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,200)));
await page.screenshot({path:S+"route-stops__removed-undo__1440.png"});
await page.getByRole("button",{name:/Undo/}).click(); await page.waitForTimeout(400);
console.log("after undo",await order(),"focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,200)));
// remove last and wait for undo bar timing
await rm.nth(4).click(); await page.waitForTimeout(8000);
console.log("undo bar after 8s:", await page.getByRole("button",{name:/Undo/}).count());
await page.waitForTimeout(8000);
console.log("undo bar after 16s:", await page.getByRole("button",{name:/Undo/}).count(), await order());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
await page.screenshot({path:S+"route-editor__saved-stops__1440.png"});
console.log("saved live", await live());
await axe(page,"route stops");
await browser.close();
