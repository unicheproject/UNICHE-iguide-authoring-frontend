import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
const { browser, context, page } = await open("admin", { viewport: "1280" });
await go(page, "/projects/new"); await page.waitForSelector("#project-name"); 
const order=[]; await page.locator("#skip, body").first().focus().catch(()=>{});
await page.evaluate(()=>document.activeElement.blur());
for(let i=0;i<12;i++){ await page.keyboard.press("Tab"); order.push(await page.evaluate(()=>{const e=document.activeElement; return (e?.id||e?.getAttribute('aria-label')||e?.textContent||e?.tagName).trim().replace(/\s+/g," ").slice(0,26)})); }
console.log("tab order:", order.join(" > "));
await page.focus("#project-name"); await shot(page, "create__focus-ring-name", "1280");
// forced errors on POST create
for (const status of [503, 422, 403, 409]) {
  await page.route("**/organizations/*/projects", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({ status, contentType: "application/problem+json", body: JSON.stringify({ type:"about:blank", title: "Forced "+status, status, detail: "Forced detail "+status, code: status===409?"SLUG_TAKEN":status===422?"VALIDATION_FAILED":"X", requestId:"req-"+status, errors: status===422?[{path:"name",code:"TOO_LONG"}]:undefined }) });
  });
  await page.fill("#project-name", "UX-p2-manager Forced"+status);
  await page.getByRole("button",{name:"Create project"}).click(); await page.waitForTimeout(700);
  await shot(page, "create__forced-"+status, "1280");
  console.log(status, "=>", (await page.locator("[role=alert]").allInnerTexts()).join(" || ").replace(/\n+/g," | "), "| focus:", await page.evaluate(()=>document.activeElement?.id||document.activeElement?.tagName));
  await page.unroute("**/organizations/*/projects");
}
// offline
await context.setOffline(true); await page.waitForTimeout(800);
await shot(page, "create__offline", "1280");
console.log("OFFLINE banner:", await page.locator("[role=status],[role=alert]").allInnerTexts());
await page.fill("#project-name", "UX-p2-manager Offline");
await page.getByRole("button",{name:"Create project"}).click(); await page.waitForTimeout(1500);
await shot(page, "create__offline-submit", "1280");
console.log("OFFLINE submit:", (await page.locator("[role=alert]").allInnerTexts()).join(" || ").replace(/\n+/g," | "));
await browser.close();
