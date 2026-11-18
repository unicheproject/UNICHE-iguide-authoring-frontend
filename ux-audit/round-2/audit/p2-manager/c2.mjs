import { fresh, uiSignIn, shot, text, CMS, VIEWPORTS } from "./lib.mjs";
const { browser, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
await page.waitForTimeout(1500);
// does the abandoned project show as needing setup in the header switcher?
await page.getByRole("button", { name: /Choose a project/ }).click(); await page.waitForTimeout(600);
await page.keyboard.type("R2-p2"); await page.waitForTimeout(600);
await shot(page, "switcher__abandoned-project-search", "1440", false);
console.log("SWITCH:", (await text(page, "[role=dialog], [data-reka-popper-content-wrapper]").catch(()=>"?")).slice(0,500));
await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2500);
console.log("opened ->", page.url(), await page.title());
await shot(page, "project__abandoned-opened", "1440");
console.log((await text(page, "main")).slice(0,900));
await browser.close();
