import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/");
await page.getByRole("link", { name: /create project/i }).or(page.getByRole("button",{name:/create project/i})).first().click();
await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(800);
console.log(page.url());
await shot(page, "create__step1", "1440");
console.log(await page.locator("body").innerText());
// submit empty
const btns = await page.getByRole("button").allInnerTexts(); console.log(btns);
await page.getByRole("button", { name: /create|continue|next/i }).last().click(); await page.waitForTimeout(500);
await shot(page, "create__step1-empty-submit", "1440");
console.log("--after empty submit\n", await page.locator("main, body").first().innerText());
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML?.slice(0,160)));
await browser.close();
