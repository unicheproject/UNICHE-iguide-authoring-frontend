import { open, go } from "../../../../tools/session.mjs";
const { browser, page } = await open("admin", { forcedColors: "active" });
await go(page, "/projects/600c4311-3e81-4235-91b0-5b3e336918fc");
await page.waitForTimeout(2500);
const r = await page.evaluate(() => [...document.querySelectorAll(".forced-step-current")].map((e) => ({ text: e.textContent.trim(), color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor, inAriaCurrent: !!e.closest("[aria-current]") })));
console.log(JSON.stringify(r));
await page.screenshot({ path: "ux-audit/round-3/implementation/W0-A/after/forced-colours-first-run__1440.png" });
await browser.close();
