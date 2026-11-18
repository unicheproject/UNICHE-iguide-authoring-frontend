import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1280" });
const foc = () => page.evaluate(() => document.activeElement.tagName + ":" + (document.activeElement.getAttribute("aria-label")||document.activeElement.innerText||"").slice(0,50).replace(/\n/g," "));
const mine = () => page.locator("main table tbody tr").filter({ hasText: "UX-R3-s9 Guide" }).first();
const vis = () => mine().evaluate(tr => { const r = tr.getBoundingClientRect(); const sc = document.querySelector("main"); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, mainScroll: sc.scrollTop, winScroll: scrollY }; });
await go(page, `/projects/${P}/guides`); await settle(page, 2000);
await mine().locator("button[aria-label^='Actions for']").scrollIntoViewIfNeeded();
console.log("before", JSON.stringify(await vis()));
await mine().locator("button[aria-label^='Actions for']").focus(); await page.keyboard.press("Enter"); await settle(page, 300);
await page.getByRole("menuitem", { name: /^Move to top/ }).click(); await settle(page, 1500);
console.log("after top", JSON.stringify(await vis()), "focus", await foc());
await shot(page, "guides__move-to-top-result__1280");
// drag test: drag my row handle to bottom
const handle = mine().locator("span[draggable=true]");
await mine().locator("button[aria-label^='Actions for']").focus(); await page.keyboard.press("Enter"); await settle(page, 300);
await page.getByRole("menuitem", { name: /^Move to bottom/ }).click(); await settle(page, 1500);
console.log("after bottom", JSON.stringify(await vis()), "focus", await foc());
// Drag up one row via handle
const h2 = mine().locator("span[draggable=true]");
const box = await h2.boundingBox();
const prev = page.locator("main table tbody tr").nth(20);
const pb = await prev.boundingBox();
await page.mouse.move(box.x + 12, box.y + 12); await page.mouse.down(); await page.mouse.move(box.x + 12, pb.y + 20, { steps: 8 }); await settle(page, 150);
await shot(page, "guides__drag-in-flight__1280");
console.log("drag line:", await page.evaluate(() => [...document.querySelectorAll("main table tbody tr")].filter(t => /shadow|drop|border/.test(t.className) || t.style.cssText).map(t => t.className.slice(0,120))));
await page.mouse.up(); await settle(page, 1200);
console.log("after drag: focus", await foc(), "live", await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map(e=>e.textContent.trim()).filter(Boolean)), "order idx", await page.evaluate(() => [...document.querySelectorAll("main table tbody tr")].findIndex(t => /UX-R3-s9 Guide/.test(t.innerText))));
// restore to bottom
await mine().locator("button[aria-label^='Actions for']").focus(); await page.keyboard.press("Enter"); await settle(page, 300);
const mb = page.getByRole("menuitem", { name: /^Move to bottom/ }); if (!(await mb.getAttribute("aria-disabled"))) { await mb.click(); await settle(page, 1200); } else await page.keyboard.press("Escape");
console.log("final idx", await page.evaluate(() => [...document.querySelectorAll("main table tbody tr")].findIndex(t => /UX-R3-s9 Guide/.test(t.innerText))));
await browser.close();
