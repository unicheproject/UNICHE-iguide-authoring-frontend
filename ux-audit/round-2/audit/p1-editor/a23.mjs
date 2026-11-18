import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const log=[]; page.on("response", r=>{ if(r.url().includes("/api/v1") && r.request().method()!=="GET") log.push(r.request().method()+" "+r.url().split("/api/v1")[1].replace(/[0-9a-f-]{36}/g,"ID")+" "+r.status()) });
await go(page, `/projects/${P}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
const pos=async(name)=>page.evaluate((n)=>{const rows=[...document.querySelectorAll("tbody tr")]; return rows.findIndex(r=>r.innerText.includes(n))+1+"/"+rows.length},name);
console.log("Amphora pos", await pos("Amphora Room"));
const row=()=>page.locator("tbody tr").filter({hasText:"Amphora Room"}).first();
const kebab=()=>row().getByRole("button",{name:/Actions for/});
await row().scrollIntoViewIfNeeded(); await shot(page,"pois-list__bottom-rows__1440");
await kebab().click(); await settle(page,300);
console.log("MENU:", (await page.getByRole("menu").innerText()).replace(/\n/g," | "));
await shot(page,"pois-list__row-menu-active__1440");
await page.getByRole("menuitem",{name:/Move to top/}).click(); await settle(page,1200);
console.log("after top", await pos("Amphora Room"), log.join(" | ")); log.length=0;
console.log("announce:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)));
console.log("focus:", await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")||document.activeElement?.tagName));
console.log("scrollY of main", await page.evaluate(()=>[...document.querySelectorAll("*")].filter(e=>e.scrollTop>0).map(e=>e.tagName+e.scrollTop)));
await shot(page,"pois-list__after-move-to-top__1440");
// Move to position
await kebab().click(); await page.getByRole("menuitem",{name:/Move to position/}).click(); await settle(page,500);
await shot(page,"pois-list__move-to-position-dialog__1440");
console.log("POS DIALOG:", (await page.getByRole("dialog").innerText()).replace(/\n/g," | "));
await page.getByRole("dialog").getByRole("spinbutton").or(page.getByRole("dialog").locator("input")).first().fill("60");
await page.keyboard.press("Enter"); await settle(page,1500);
console.log("after pos60", await pos("Amphora Room"), log.join(" | ")); log.length=0;
console.log("focus:", await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")||document.activeElement?.tagName));
// move to bottom
await row().scrollIntoViewIfNeeded(); await kebab().click(); await page.getByRole("menuitem",{name:/Move to bottom/}).click(); await settle(page,1500);
console.log("after bottom", await pos("Amphora Room"), log.join(" | "));
// handle semantics
console.log("handle:", await page.evaluate(()=>{const h=document.querySelector("tbody tr td button, tbody tr [draggable], tbody tr .drag, tbody tr [class*=handle]"); return h?h.outerHTML.slice(0,300):"none"}));
await browser.close();
