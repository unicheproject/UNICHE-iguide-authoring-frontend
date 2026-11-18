import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
const first=()=>page.evaluate(()=>[...document.querySelectorAll("tbody tr")].slice(0,3).map(r=>r.innerText.split("\n").filter(x=>x.trim())[0].trim().slice(0,35)));
await go(page,P+"/pois"); await page.waitForSelector("tbody tr");
console.log("p1 first:",await first());
await page.getByRole("button",{name:/Actions for UX-R3-p1-editor Beta/}).click();
await page.getByRole("menuitem",{name:/Move to bottom/}).click();
await page.waitForTimeout(300);
await shot(page,"pois-list__after-move-to-bottom-300ms__1440");
console.log("toast visible?",await page.evaluate(()=>[...document.querySelectorAll("*")].filter(e=>/Moved/.test(e.innerText||"")&&e.children.length==0).map(e=>e.className.slice(0,50)+"|"+e.innerText)));
console.log("focus:",await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.getAttribute("aria-label")||document.activeElement.innerText||"").slice(0,40)));
await page.waitForTimeout(1000);
console.log("p1 first now:",await first());
// Undo present?
console.log("undo buttons:",await page.getByRole("button",{name:/Undo/}).count());
// Gamma to top from page 2
await page.getByRole("button",{name:/^Next/}).click(); await page.waitForTimeout(700);
await page.getByRole("button",{name:/Actions for UX-R3-p1-editor Γάμμα/}).click();
await page.getByRole("menuitem",{name:/Move to top/}).click(); await page.waitForTimeout(600);
await go(page,P+"/pois"); await page.waitForSelector("tbody tr");
console.log("p1 after gamma top:",await first());
// drag gamma (row1) down one row
const h=page.locator("tbody tr").first().locator("[aria-label*='rag'],[draggable=true],button").first();
console.log("handle:",await h.evaluate(e=>e.outerHTML.slice(0,200)));
const b=await h.boundingBox(); const rows=await page.locator("tbody tr").evaluateAll(r=>r.slice(0,3).map(x=>x.getBoundingClientRect().y+x.getBoundingClientRect().height/2));
await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.mouse.down();
await page.mouse.move(b.x+b.width/2,b.y+b.height/2+20,{steps:5});
await page.mouse.move(b.x+b.width/2,rows[1]+10,{steps:10});
await shot(page,"pois-list__dragging__1440");
await page.mouse.up(); await page.waitForTimeout(900);
console.log("after drag:",await first());
await shot(page,"pois-list__after-drag__1440");
console.log("live:",await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.innerText.trim()).filter(Boolean)));
console.log("undo?",await page.getByRole("button",{name:/Undo/}).count());
// keyboard reorder via handle: focus handle, Space, ArrowDown
await go(page,P+"/pois"); await page.waitForSelector("tbody tr");
const h2=page.locator("tbody tr").first().locator("[aria-label*='rag'],[draggable=true],button").first();
await h2.focus(); await page.keyboard.press("Space"); await page.keyboard.press("ArrowUp"); await page.keyboard.press("Space"); await page.waitForTimeout(600);
console.log("kbd drag live:",await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.innerText.trim()).filter(Boolean)),await first());
// restore: Gamma to bottom
await page.locator("tbody tr").filter({hasText:/Γάμμα/}).first().getByRole("button",{name:/Actions for/}).click();
await page.getByRole("menuitem",{name:/Move to bottom/}).click(); await page.waitForTimeout(800);
await go(page,P+"/pois"); await page.waitForSelector("tbody tr");
console.log("p1 final:",await first());
await browser.close();
