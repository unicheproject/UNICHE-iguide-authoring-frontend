import { fresh, shot, CMS } from "./h.mjs";
import { open } from "../../../tools/session.mjs";
const { browser, context, page } = await open("admin", { viewport: "1440" });
await page.goto(CMS + "/"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1000);
// scroll home bottom
await page.screenshot({ path: "ux-audit/round-1/audit/p2-manager/shots/home__full__1440.png", fullPage: true });
const sw = page.getByRole("button", { name: /select a project/i });
console.log("switcher count", await sw.count());
await sw.first().click(); await page.waitForTimeout(700);
await shot(page, "switcher__open", "1440");
console.log(await page.locator("[role=dialog],[data-state=open],[role=listbox],[role=menu]").first().innerText().catch(e=>"no popover role"));
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
console.log("after esc open?", await page.locator("[data-state=open]").count(), "focus:", await page.evaluate(()=>document.activeElement?.textContent?.slice(0,40)));
await shot(page, "switcher__after-esc", "1440");
await browser.close();
