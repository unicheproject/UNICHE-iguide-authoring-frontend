import { open, go } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const ID="600c4311-3e81-4235-91b0-5b3e336918fc";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/new?resume="+ID);
await page.waitForTimeout(1500);
await page.locator("label", {hasText:"Outdoor trail"}).click();
await page.waitForTimeout(600);
await page.getByRole("button",{name:/^Continue$/}).click();
await page.waitForTimeout(800);
// helphints in step 3
for (const n of ["What are languages","What is a surface","What are surfaces"]) { const b=page.locator(`button[aria-label^='${n}']`); console.log(n, await b.count()); }
console.log("labels", await page.evaluate(()=>[...document.querySelectorAll("button[aria-label]")].map(b=>b.getAttribute("aria-label"))));
await page.locator("button[aria-label^='What']").nth(1).click().catch(()=>{});
await page.waitForTimeout(400);
console.log("HINTS3", await page.evaluate(()=>[...document.querySelectorAll("[data-radix-popper-content-wrapper]")].map(p=>p.innerText)));
await shot(page,"wizard-3__helphint__1440");
await page.keyboard.press("Escape");
await page.getByRole("button",{name:/Continue to review/}).click();
await page.waitForTimeout(1200);
await shot(page, "wizard-4__review__1440", true);
console.log("STEP4 TEXT\n", await page.evaluate(()=>document.querySelector("form").innerText));
for (const vp of []) {}
await shot(page, "wizard-4__review-viewport__1440");
const t0 = Date.now();
await page.getByRole("button",{name:/Initialize Project/}).click();
await page.waitForTimeout(200);
await shot(page, "wizard-4__initializing__1440");
await page.waitForURL(/\/projects\/[0-9a-f-]{36}\/?$/, {timeout:60000}).catch(()=>console.log("no redirect", page.url()));
console.log("init ms", Date.now()-t0, page.url());
await page.waitForTimeout(2500);
await shot(page, "dashboard-new__pristine__1440", true);
console.log("DASH TEXT\n", await page.evaluate(()=>document.body.innerText));
await browser.close();
