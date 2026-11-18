import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const F = "ux-audit/round-2/audit/s13-media/fixtures/";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
await go(page, `/projects/${POP}/media`);
await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2000);
await page.getByRole("button",{name:"Upload files"}).click();
await page.waitForTimeout(1200);
console.log("focus on open:", await focusDesc(page));
console.log((await t(page,"[role=dialog]")).replace(/\n+/g," | "));
await shot(page,"upload__open-empty","1440");
await axe(page,"upload-open");
// Tab order
const order=[]; for(let i=0;i<7;i++){ await page.keyboard.press("Tab"); order.push(await focusDesc(page)); } console.log("tab:", order);
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("after Esc focus:", await focusDesc(page), "dialog count", await page.locator("[role=dialog]").count());
await browser.close();
