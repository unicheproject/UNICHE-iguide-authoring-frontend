import { open, go } from "../../../tools/session.mjs";
const D = "ux-audit/round-2/implementation/P3-core/after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
// sort by updated: first row newest?
await go(page, `/projects/${P}/pois?sort=updated`); await page.waitForTimeout(1200);
console.log("url", page.url().split("?")[1]);
const upd = await page.evaluate(() => [...document.querySelectorAll("tbody tr")].slice(0, 4).map((r) => r.textContent.match(/Updated ([^·]*?)(?:No trigger|QR|$)/)?.[1]?.trim()));
console.log("updated first rows", upd);
// toggle direction through the popover
await page.getByRole("button", { name: /^Filters/ }).click();
const dirBtn = page.getByRole("button", { name: /Newest first|Oldest first/ });
console.log("dir button", await dirBtn.getAttribute("aria-label"));
await page.screenshot({ path: `${D}/sort-popover-1440.png` });
await dirBtn.click(); await page.waitForTimeout(300);
console.log("after toggle url", page.url().split("?")[1]);
await page.keyboard.press("Escape");
// paging
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1200);
await page.getByRole("button", { name: /^Next/ }).click(); await page.waitForTimeout(400);
console.log("page2 url", page.url().split("?")[1], await page.evaluate(() => document.querySelectorAll("tbody tr").length), await page.locator("nav[aria-label^=Pages]").innerText());
await page.screenshot({ path: `${D}/pois-page2-1440.png` });
// scroll restore
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1200);
await page.evaluate(() => (document.getElementById("main").scrollTop = 3000)); await page.waitForTimeout(300);
const link = page.locator("tbody tr a[href]").nth(18); // somewhere around the scroll
const vis = await page.evaluate(() => { const main = document.getElementById("main"); const mr = main.getBoundingClientRect(); const a = [...document.querySelectorAll("tbody tr a[href]")].find((x) => { const r = x.getBoundingClientRect(); return r.top > mr.top + 200 && r.bottom < mr.bottom - 50; }); a.dataset.pick = "1"; return a.textContent.trim(); });
await page.locator('a[data-pick="1"]').click(); await page.waitForTimeout(1500);
console.log("opened", vis, page.url().split("/").slice(-2).join("/"));
await page.goBack(); await page.waitForTimeout(2000);
const back = await page.evaluate(() => ({ top: document.getElementById("main").scrollTop, active: document.activeElement?.textContent?.trim()?.slice(0, 40), tag: document.activeElement?.tagName }));
console.log("back", JSON.stringify(back));
await browser.close();
