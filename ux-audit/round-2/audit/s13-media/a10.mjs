import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const F = "ux-audit/round-2/audit/s13-media/fixtures/";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${POP}/media`);
await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2000);
await page.getByRole("button",{name:"Upload files"}).click(); await page.waitForTimeout(800);
await page.locator("input[type=file]").setInputFiles([F+"UX-R2-s13 notes.txt", F+"UX-R2-s13 tool.exe", F+"UX-R2-s13 beta.png"]);
await page.waitForTimeout(2500);
const rows = async()=> (await page.locator("ul[aria-label=Files] > li").allInnerTexts()).map(x=>x.replace(/\n+/g," | ").slice(0,90));
console.log(await rows(), "dialogs", await page.locator("[role=dialog]").count());
await page.getByRole("button",{name:/^Skip/}).first().focus();
console.log("skip btn name:", await page.getByRole("button",{name:/^Skip/}).first().getAttribute("aria-label"));
await page.keyboard.press("Enter"); await page.waitForTimeout(600);
console.log("after skip", await rows(), "focus", await focusDesc(page), "dialogs", await page.locator("[role=dialog]").count());
console.log("log tail", (await page.locator("[role=log]").innerText()).split("\n").slice(-2));
// upload anyway on the exe
const ua = page.getByRole("button",{name:/Upload UX-R2-s13 (tool|beta)/}).first();
console.log("UA label", await ua.getAttribute("aria-label"));
await ua.click(); await page.waitForTimeout(3000);
console.log("after upload anyway", await rows(), "focus", await focusDesc(page));
console.log("log tail", (await page.locator("[role=log]").innerText()).split("\n").slice(-3));
await shot(page,"upload__after-decisions","1440");
// close dialog and look at library
await page.getByRole("button",{name:"Done"}).click(); await page.waitForTimeout(800);
console.log("focus after Done", await focusDesc(page));
await browser.close();
