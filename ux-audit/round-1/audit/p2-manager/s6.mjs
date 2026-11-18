import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
const { browser, context, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/new");
await page.getByRole("button", { name: "Create project" }).click(); await page.waitForTimeout(500);
await shot(page, "create__step1-empty-submit", "1440");
console.log("empty submit text:", (await page.locator("main").innerText()).split("\n").slice(0,25).join(" | "));
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML?.slice(0,160)));
// tab order from the top
await page.goto(CMS+"/projects/new"); await page.waitForTimeout(800);
const order=[]; for(let i=0;i<9;i++){ await page.keyboard.press("Tab"); order.push(await page.evaluate(()=>{const e=document.activeElement; return (e?.getAttribute('aria-label')||e?.textContent||e?.id||e?.tagName).trim().slice(0,30)})); }
console.log("tab order:", order.join(" > "));
await page.fill("#project-name", "UX-p2-manager Trail");
console.log("slug:", await page.inputValue("#project-slug").catch(()=>"?"));
await shot(page, "create__step1-filled", "1440");
const t=Date.now();
await page.getByRole("button", { name: "Create project" }).click();
await page.waitForTimeout(300); await shot(page, "create__step1-submitting", "1440");
await page.waitForURL(/resume=/, {timeout:30000}).catch(()=>console.log("no resume url", page.url()));
await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(800);
console.log("create ms", Date.now()-t, page.url());
await shot(page, "create__step2-open", "1440");
await page.screenshot({ path: "ux-audit/round-1/audit/p2-manager/shots/create__step2-full__1440.png", fullPage: true });
console.log("focus after create:", await page.evaluate(()=>document.activeElement?.outerHTML?.slice(0,120)));
console.log((await page.locator("main").innerText()).slice(0,1800));
await browser.close();
