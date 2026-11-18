import { open, go, P, OUT } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1280", forcedColors: "active" });
await go(page, `/projects/${P.trail}`); await page.waitForSelector("#guide-title"); await page.waitForTimeout(1200);
console.log(JSON.stringify(await page.evaluate(() => { const c = document.querySelector("[data-state=next] span[aria-hidden]"); const s = getComputedStyle(c); return { bg: s.backgroundColor, color: s.color, border: s.borderTopWidth, t: c.textContent.trim() }; })));
await page.screenshot({ path: `${OUT}trail-forced-1280.png` });
await browser.close();
{
 const s = await open("admin", { viewport: "1024" });
 await go(s.page, `/projects/${P.pop}`); await s.page.waitForSelector("[data-testid=app-status-line]"); await s.page.waitForTimeout(1000);
 console.log("pop1024 dash", JSON.stringify(await s.page.evaluate(() => ({ counts: document.querySelector("[aria-labelledby=counts-title]").getBoundingClientRect().height, pendingY: document.querySelector("[aria-labelledby=pending-title]").getBoundingClientRect().y }))));
 await s.browser.close();
}
