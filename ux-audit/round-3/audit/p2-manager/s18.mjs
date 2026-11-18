import { open, go, CMS } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const POP="6958c18f-60d2-4140-a524-5a43f8a2f6b5", EB="1d6971ce-6391-4da8-848e-8d7466d25128";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/"+POP); await page.waitForTimeout(1500);
await go(page, "/"); await page.waitForTimeout(2500);
console.log("after / url:", page.url());
await shot(page, "home__after-last-project__1440");
console.log("HOME TOP\n", await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,700)));
// SSO re-landing: reload at /  and project deep link
await page.goto(CMS+"/"); await page.waitForTimeout(3500);
console.log("reload / url:", page.url());
// switcher
await go(page, "/projects/"+POP); await page.waitForTimeout(2000);
const t0=Date.now();
const trig = page.getByRole("button",{name:/Switch project|UX Audit – Populated/}).first();
await trig.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
await shot(page,"switcher__open-on-project__1440");
console.log("sw search focused:", await page.evaluate(()=>document.activeElement?.getAttribute("placeholder")||document.activeElement?.tagName));
await page.keyboard.type("Empty B"); await page.waitForTimeout(700);
await shot(page,"switcher__search-empty-b__1440");
console.log("SW LIST\n", await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText));
await page.keyboard.press("ArrowDown"); await page.waitForTimeout(200);
console.log("active", await page.evaluate(()=>document.activeElement?.innerText?.slice(0,60)+" | aria-sel="+document.activeElement?.getAttribute("aria-selected")));
await shot(page,"switcher__arrow-focus__1440");
await page.keyboard.press("Enter"); await page.waitForTimeout(3000);
console.log("after pick url:", page.url(), "title", await page.title(), "ms", Date.now()-t0);
await shot(page,"switcher__after-pick__1440");
console.log("focus after pick", await page.evaluate(()=>document.activeElement?.tagName+":"+(document.activeElement?.innerText||"").slice(0,30)));
// no-match in switcher
await trig.click().catch(()=>{}); await page.keyboard.press("Escape");
await page.getByRole("button",{name:/Switch project|UX Audit/}).first().click(); await page.waitForTimeout(500);
await page.keyboard.type("zzqq"); await page.waitForTimeout(600);
await shot(page,"switcher__no-match__1440");
console.log("NOMATCH", await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText));
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
console.log("focus after esc", await page.evaluate(()=>document.activeElement?.innerText?.slice(0,40)));
await browser.close();
