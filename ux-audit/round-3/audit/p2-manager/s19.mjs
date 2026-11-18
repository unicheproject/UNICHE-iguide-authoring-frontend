import { open, go, CMS, API } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const POP="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
for (const vp of ["1440","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, "/projects/"+POP); await page.waitForTimeout(1500);
await page.route(API+"/**", r => r.fulfill({status:401, contentType:"application/problem+json", body: JSON.stringify({type:"about:blank", title:"Unauthorized", status:401, code:"UNAUTHENTICATED", requestId:"req-r3-401"})}));
await page.getByRole("link",{name:/Points of Interest/}).first().click().catch(()=>page.locator("nav a",{hasText:"Points of Interest"}).click());
await page.waitForTimeout(2500);
console.log(vp,"url", page.url().slice(0,80));
const dlg = page.getByRole("dialog");
console.log("dialog count", await dlg.count());
await shot(page, `session-ended__dialog__${vp}`);
if (await dlg.count()) {
  console.log("TEXT", await dlg.innerText(), "| name", await dlg.getAttribute("aria-label"), await dlg.getAttribute("aria-labelledby"));
  console.log("focus", await page.evaluate(()=>document.activeElement?.innerText));
  if (vp==="1440") {
    await page.keyboard.press("Escape"); await page.waitForTimeout(600);
    console.log("after Esc dialogs", await dlg.count(), "focus", await page.evaluate(()=>document.activeElement?.tagName+":"+document.activeElement?.innerText?.slice(0,30)));
    await shot(page, `session-ended__dismissed__${vp}`);
    // trigger again
    await page.getByRole("link",{name:/Routes/}).first().click(); await page.waitForTimeout(2000);
    console.log("re-shown", await dlg.count());
    await page.unroute(API+"/**");
    await page.getByRole("button",{name:/Sign in again/}).click();
    await page.waitForURL(/realms|localhost:5173/,{timeout:20000}).catch(()=>{});
    await page.waitForTimeout(1500);
    console.log("after sign-in again url", page.url().replace(/(code|state|session_state)=[^&]+/g,"$1=…").slice(0,200));
    await page.waitForLoadState("networkidle").catch(()=>{});
    await page.waitForTimeout(3000);
    console.log("final url", page.url().replace(/(code|state|session_state)=[^&]+/g,"$1=…").slice(0,200), "title", await page.title());
    await shot(page, `session-ended__after-resignin__${vp}`);
  }
}
await browser.close();
}
