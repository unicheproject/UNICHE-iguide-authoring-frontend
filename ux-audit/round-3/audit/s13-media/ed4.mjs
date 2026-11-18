import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/media?q=${encodeURIComponent("UX-R3-s13 one")}`); await settle(page);
await page.locator("ul[aria-label='Media files'] a").first().click(); await page.waitForTimeout(2500);
await go(page, `/projects/${P}/media?q=${encodeURIComponent("UX-R3-s13 one")}`); await settle(page);
await page.locator("ul[aria-label='Media files'] a").first().click(); await page.waitForTimeout(2500);
await page.getByRole("button", { name: /^Activate/ }).first().click({force:true}); await page.waitForTimeout(800);
console.log("forced click", await page.evaluate(()=>({dlg: document.querySelector("[role=dialog]")?.innerText.replace(/\n+/g," | ").slice(0,200), toast:[...document.querySelectorAll("[role=status],[role=alert]")].map(e=>e.textContent.trim().slice(0,160)).filter(Boolean), cap: document.querySelector("[id^=v-]")?.textContent})));
await shot(page, `editor__activate-blocked__${vp}`);
// Decorative tick -> clears
await page.keyboard.press("Escape");
await page.getByLabel("Decorative image").check(); await page.waitForTimeout(400);
console.log("decorative", await page.evaluate(()=>({alt: (t=>t&&[t.disabled,t.readOnly])(document.querySelector("textarea")), banner: document.querySelector("main").innerText.match(/Decorative[^\n]*\n[^\n]*/g)?.slice(0,3), tab:[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\n+/g," "))})));
await shot(page, `editor__decorative__${vp}`);
await page.getByLabel("Decorative image").uncheck();
// Discard: navigate away with dirty?
await go(page, `/projects/${P}/media`);
console.log("leave dirty url", page.url().replace(/.*projects\/[^/]+/,""), await page.evaluate(()=>document.querySelector("[role=dialog],[role=alertdialog]")?.innerText.replace(/\n+/g," | ")));
await browser.close();
