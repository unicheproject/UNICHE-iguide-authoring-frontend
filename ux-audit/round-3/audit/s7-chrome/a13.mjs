import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const ae = () => page.evaluate(() => { const a = document.activeElement; return a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40); });
await go(page, `/projects/${P}/pois`); await settle(page, 1500);
await page.getByRole("link", { name: /Parthenon Frieze – North Side/ }).first().click(); await settle(page, 2500);
// dirty an input (no save)
const inp = page.locator("main input[type=text], main textarea").first();
await inp.click(); await page.keyboard.type(" x"); await settle(page, 400);
console.log("dirty header", await page.evaluate(() => document.querySelector("main h1")?.parentElement?.parentElement?.innerText.replace(/\n/g, " | ").slice(0, 200)));
await page.getByRole("button", { name: /UX Audit – Populated/ }).first().click(); await settle(page, 500);
await page.getByRole("link", { name: /UX Audit – Empty D/ }).first().click(); await settle(page, 800);
console.log("dialogs", await page.locator("[role=dialog]").allInnerTexts(), "focus", await ae(), "url", page.url().slice(-30));
await shot(page, "switch-unsaved__confirm__1440");
const d = await page.evaluate(() => { const ds = [...document.querySelectorAll("[role=dialog]")]; return ds.map(d => { const b = d.getBoundingClientRect(); return [d.getAttribute("aria-label") || d.querySelector("h2")?.textContent, Math.round(b.width), Math.round(b.height)]; }); });
console.log("dlg sizes", JSON.stringify(d));
await page.keyboard.press("Escape"); await settle(page, 500);
console.log("after Esc: dialogs", await page.locator("[role=dialog]").count(), "focus", await ae(), "url", page.url().slice(-30));
// try again and choose Stay/cancel
await page.getByRole("button", { name: /UX Audit – Populated/ }).first().click(); await settle(page, 500);
await page.getByRole("link", { name: /UX Audit – Empty D/ }).first().click(); await settle(page, 800);
console.log("buttons", await page.locator("[role=dialog]").last().getByRole("button").allInnerTexts());
// Also try browser nav links: nav link click with dirty state
await page.getByRole("button", { name: /^(Stay|Keep editing|Cancel)/ }).first().click().catch(()=>{}); await settle(page, 400);
await page.getByRole("link", { name: "Places", exact: true }).click(); await settle(page, 800);
console.log("nav click dirty: dialogs", await page.locator("[role=dialog]").allInnerTexts(), "url", page.url().slice(-12));
await shot(page, "nav-unsaved__confirm__1440");
await browser.close();
