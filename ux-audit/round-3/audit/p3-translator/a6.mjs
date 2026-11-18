import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of ["pois","routes","guides","events","categories"]) {
await go(page, base + "/"+k+"?create=1");
await page.waitForTimeout(1500);
console.log("==",k);
console.log(await page.evaluate(()=>{const d=document.querySelector("[role=dialog]"); if(!d) return "no dialog"; return [...d.querySelectorAll("input,textarea,select,button")].filter(e=>e.offsetParent).map(e=>`${e.tagName} ${e.type||""} ${e.id} | ${(e.getAttribute("aria-label")||e.labels?.[0]?.innerText||e.innerText||"").trim().slice(0,50)}`).join("\n")}));
await shot(page, `${k}-create-dialog__1440`);
}
await browser.close();
