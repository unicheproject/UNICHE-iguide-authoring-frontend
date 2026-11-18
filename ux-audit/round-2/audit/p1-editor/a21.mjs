import { open, go, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
console.log(await page.evaluate(()=>{const m=document.querySelector("main"); return [...m.querySelectorAll("input,select,button,[role]")].slice(0,30).map(e=>e.tagName+"|"+(e.getAttribute("role")||e.type||"")+"|"+(e.id||"")+"|"+(e.getAttribute("aria-label")||e.textContent.trim().slice(0,30))).join("\n")}));
await browser.close();
