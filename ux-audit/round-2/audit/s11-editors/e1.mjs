import { open, go, rec, P, shot, ready, axe, tall } from "./h.mjs";
const S="ux-audit/round-2/audit/s11-editors/shots/";
const { browser, page } = await open("curator", { viewport: "1440" });
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean));
await go(page, `/projects/${P}/categories/${rec.category}`); await ready(page,1200);
// icon keyboard
const radios=page.getByRole("radio"); console.log("radios", await radios.count());
await page.getByRole("radio",{name:"None"}).first().focus().catch(()=>{});
const grp = await page.evaluate(()=>[...document.querySelectorAll("fieldset legend")].map(l=>l.textContent.trim()));
console.log("fieldsets", grp);
await page.getByRole("radio",{name:/None/}).last().focus();
for (let i=0;i<3;i++) await page.keyboard.press("ArrowRight");
console.log("after 3 right:", await page.evaluate(()=>document.activeElement?.parentElement?.innerText.trim()+" checked="+document.activeElement?.checked), await page.locator("main").innerText().then(t=>t.match(/Chosen: [^\n]*/)?.[0]));
await page.keyboard.press("ArrowDown");
console.log("after down:", await page.evaluate(()=>document.activeElement?.parentElement?.innerText.trim()));
await page.screenshot({path:S+"category-icon__selected__1440.png"});
// scope -> Routes
await page.locator("main fieldset").first().getByText("Routes").click(); await page.waitForTimeout(300);
console.log("live", await live());

console.log("subcat disabled?", await page.getByRole("radio",{name:"Subcategory"}).isDisabled(), "reason:", await page.locator("main").innerText().then(t=>t.match(/Level[\s\S]{0,260}/)?.[0].replace(/\n+/g," / ")));
await page.screenshot({path:S+"category-setup__subcategory-state__1440.png"});

await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("saved", await live());
await page.getByRole("button",{name:/^Activate$|Save and activate/}).first().click(); await page.waitForTimeout(1000);
console.log("DLG", (await page.getByRole("dialog").innerText()).replace(/\n+/g," / "));
await page.getByRole("dialog").getByRole("button",{name:/Activate/}).last().click(); await page.waitForTimeout(3000);
await page.screenshot({path:S+"category-editor__active__1440.png"});
console.log("after activate", await live());
await browser.close();
