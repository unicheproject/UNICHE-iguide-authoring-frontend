import { open, go, CMS } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const ID="600c4311-3e81-4235-91b0-5b3e336918fc";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/new?resume="+ID);
await page.waitForTimeout(1500);
const dis = await page.evaluate(()=>{const b=[...document.querySelectorAll("button")].find(b=>/Continue/.test(b.textContent)); const cs=getComputedStyle(b); const hint=b.parentElement.innerText; return {dis:b.disabled, aria:b.getAttribute("aria-disabled"), color:cs.color, bg:cs.backgroundColor, op:cs.opacity, hint, html:b.parentElement.outerHTML.slice(0,500)}});
console.log("DISABLED CONTINUE", JSON.stringify(dis));
// click disabled continue
await page.getByRole("button",{name:/Continue/}).click({force:true}).catch(e=>console.log("click err"));
await page.waitForTimeout(500);
await shot(page, "wizard-2__continue-without-template__1440");
console.log("AFTER", await page.evaluate(()=>document.querySelector("form").innerText.slice(0,400)));
await page.locator("label", {hasText:"Outdoor trail"}).click();
await page.waitForTimeout(1200);
await shot(page, "wizard-2__outdoor-selected__1440", true);
console.log("STEP2 TEXT\n", await page.evaluate(()=>document.querySelector("form").innerText));
const sel = await page.evaluate(()=>[...document.querySelectorAll("input[name=style]")].map(i=>[i.id,i.checked]));
console.log("styles", JSON.stringify(sel));
// hover hint
await page.getByRole("button",{name:"What is a style?"}).hover().catch(()=>{});
await page.getByRole("button",{name:"What is a style?"}).click().catch(()=>{});
await page.waitForTimeout(500);
await shot(page, "wizard-2__helphint-style__1440");
console.log("HINT", await page.evaluate(()=>{const p=document.querySelector("[role=tooltip],[data-radix-popper-content-wrapper]"); return p?.innerText + " | " + JSON.stringify(p?.getBoundingClientRect())}));
const hb = await page.evaluate(()=>[...document.querySelectorAll("button[aria-label^='What is']")].map(b=>{const r=b.getBoundingClientRect(); return [b.getAttribute("aria-label"), r.width, r.height]}));
console.log("hint sizes", JSON.stringify(hb));
await page.keyboard.press("Escape");
await browser.close();
