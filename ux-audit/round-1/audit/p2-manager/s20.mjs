import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
const E="/projects/65f8958a-144a-46fe-851b-f1176b2a597e";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page,E+"/pois/c02f8d29-cc51-41aa-8358-7250167e08fd"); await page.waitForTimeout(1500);
await page.locator("textarea").first().fill("A short test summary by p2-manager."); await page.waitForTimeout(500);
await shot(page,"poi-active__edit-dirty","1440");
console.log("BUTTONS:", await page.locator("main button").allInnerTexts().then(a=>a.filter(Boolean).slice(0,14).join(" | ")));
console.log("HEAD:", (await page.locator("main").innerText()).slice(0,400).replace(/\n+/g," | "));
const aside = await page.locator("main").innerText(); console.log(aside.split("STATUS AND VISIBILITY")[1]?.slice(0,700).replace(/\n+/g," | "));
// try discard / Apply flow
const apply=page.getByRole("button",{name:/apply changes|save draft/i}); console.log("apply buttons:", await apply.allInnerTexts());
await apply.first().click(); await page.waitForTimeout(1000); await shot(page,"poi-active__after-save","1440");
console.log("DIALOG/TOAST:", (await page.locator("[role=dialog],[role=status],[role=alert]").allInnerTexts()).join(" || ").replace(/\n+/g," | "));
console.log("HEAD2:", (await page.locator("main").innerText()).slice(0,300).replace(/\n+/g," | "));
await browser.close();
