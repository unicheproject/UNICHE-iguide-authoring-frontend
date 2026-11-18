import { fresh, uiSignIn, shot, text, CMS, VIEWPORTS } from "./lib.mjs";
const { browser, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
await page.getByRole("link", { name: "Create Project" }).first().click();
await page.waitForTimeout(1500);
console.log(page.url(), await page.title(), "focus:", await page.evaluate(()=>document.activeElement?.tagName+" "+(document.activeElement?.id||"")));
for (const vp of ["1280","1440"]) { const v=VIEWPORTS[vp]; await page.setViewportSize({width:v.width,height:v.height}); await page.waitForTimeout(300); await shot(page, "create__step1-empty", vp); }
console.log("STEP1\n" + await text(page, "main"));
console.log("buttons:", JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("main button, main a")].map(b=>b.textContent.trim()+"|"+(b.getAttribute("aria-disabled")||"")+"|"+(b.title||"")))));
// submit empty
const next = page.getByRole("button", { name: /create project|continue|next/i }).last();
console.log("primary button:", await next.textContent());
await next.click(); await page.waitForTimeout(800);
console.log("after empty submit focus:", await page.evaluate(()=>document.activeElement?.tagName+" "+(document.activeElement?.getAttribute("role")||"")+" "+(document.activeElement?.textContent||"").slice(0,60)));
await shot(page, "create__step1-errors", "1440");
console.log("ERRS\n" + (await text(page, "main")).slice(0,700));
// hint
await page.getByRole("button", { name: /What is a slug/ }).click(); await page.waitForTimeout(400);
await shot(page, "create__step1-slug-hint", "1440", false);
await page.keyboard.press("Escape");
await page.getByLabel(/Project name/).fill("UX-R2-p2 Trail");
await page.waitForTimeout(300);
console.log("slug value:", await page.getByLabel(/^Slug/).inputValue());
await shot(page, "create__step1-filled", "1440");
await next.click();
await page.waitForTimeout(4000);
console.log("after create:", page.url());
await shot(page, "create__step2-after-step1", "1440");
console.log("STEP2\n" + (await text(page, "main")).slice(0,1800));
// abandon: go to Home
await page.goto(CMS + "/"); await page.waitForTimeout(3000);
await shot(page, "home__after-abandon", "1440");
await page.getByText("Needs setup").first().click().catch(()=>{});
await page.waitForTimeout(500);
await shot(page, "home__needs-setup-open", "1440");
console.log("HOME\n" + (await text(page, "main")).slice(-1200));
await browser.close();
