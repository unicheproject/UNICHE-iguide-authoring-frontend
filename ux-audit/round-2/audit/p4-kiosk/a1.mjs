import { open, go, P, shot, settle, targets, report } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/preview`); await settle(page, 4000);
await shot(page, "preview__kiosk-default__1440");
console.log("url", page.url(), "title", await page.title());
console.log("tabs", await page.getByRole("tab").allTextContents());
console.log(await page.evaluate(() => ({ scale: document.querySelector("[data-preview-frame]")?.getAttribute("data-scale"), region: document.querySelector('[role=region][aria-label^=Preview]')?.getAttribute("aria-label"), h1: [...document.querySelectorAll("h1")].map(h=>h.textContent) })));
console.log("main text:", (await page.locator("main").innerText()).slice(0, 1800));
await browser.close();
