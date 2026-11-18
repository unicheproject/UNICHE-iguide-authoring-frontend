import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: process.argv[3] ?? "1440" });
await go(page, `/projects/${P}${process.argv[2]}`);
await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2500);
await page.evaluate(() => (document.getElementById("main").scrollTop = 500)); await page.waitForTimeout(400);
console.log(JSON.stringify(await page.evaluate(() => { const a = document.querySelector("aside[aria-label]"); const r = a.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, vh: innerHeight, sh: a.scrollHeight, ch: a.clientHeight, mainBottom: document.getElementById("main").getBoundingClientRect().bottom, readiness: !!document.querySelector("[data-issue-sentence]"), sentence: document.querySelector("[data-issue-sentence]")?.textContent, badge: document.querySelector("[data-issue-badge]")?.textContent.slice(0,40) }; })));
await page.screenshot({ path: `after/side-${process.argv[3] ?? "1440"}.png` });
await browser.close();
