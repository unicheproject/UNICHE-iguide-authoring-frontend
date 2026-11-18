import { fresh, uiSignIn, shot, CMS } from "./lib.mjs";
const { browser, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
await page.goto(`${CMS}/projects/1d6971ce-6391-4da8-848e-8d7466d25128`); await page.waitForSelector("text=Warnings (1)"); await page.waitForTimeout(800);
await page.mouse.click(330, 492); await page.waitForTimeout(600);
await shot(page, "dashboard__emptyB-project-warning-open2", "1440", false);
console.log((await page.locator("main").innerText()).split("Warnings")[1].slice(0,400).replace(/\n+/g," | "));
console.log("tag at click:", await page.evaluate(()=>document.elementFromPoint(330,492)?.outerHTML.slice(0,200)));
await browser.close();
