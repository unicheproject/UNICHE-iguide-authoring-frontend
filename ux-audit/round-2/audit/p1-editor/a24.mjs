import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const log=[]; page.on("response", r=>{ if(r.url().includes("/api/v1") && r.request().method()!=="GET") log.push(r.request().method()+" "+r.url().split("/api/v1")[1].replace(/[0-9a-f-]{36}/g,"ID")+" "+r.status()) });
await go(page, `/projects/${P}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
const names=async()=>page.evaluate(()=>[...document.querySelectorAll("tbody tr")].slice(-5).map(r=>r.innerText.replace(/\s+/g," ").slice(0,45)));
console.log("before", await names());
const last=page.locator("tbody tr").last(); await last.scrollIntoViewIfNeeded();
const rows=page.locator("tbody tr"); const n=await rows.count();
const src=rows.nth(n-1).locator("[draggable=true]"); const dst=rows.nth(n-3);
await src.dragTo(dst,{targetPosition:{x:100,y:5}}); await settle(page,1500);
console.log("after drag", await names(), log.join(" | "));
await shot(page,"pois-list__after-drag__1440");
console.log("announce:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)));
// drag handle kbd focusable?
console.log("handle tabbable:", await page.evaluate(()=>{const h=document.querySelector("tbody tr [draggable=true]"); return {tab:h.getAttribute("tabindex"), role:h.getAttribute("role"), aria:h.getAttribute("aria-hidden")}}));
// restore: Amphora to bottom via menu
await browser.close();
