import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const live = () => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => `${e.getAttribute("role")||""}/${e.getAttribute("aria-live")||""}:${(e.textContent||"").trim().slice(0,140)}`).filter(s=>!/:$/.test(s)));
const foc = () => page.evaluate(() => document.activeElement.tagName + ":" + (document.activeElement.getAttribute("aria-label")||document.activeElement.innerText||"").slice(0,50));
const menu = async (tr, item) => { await tr.locator("button[aria-label^='Actions for']").focus(); await page.keyboard.press("Enter"); await settle(page, 300); await page.getByRole("menuitem", { name: item }).click(); await settle(page, 900); };
await go(page, `/projects/${P}/pois?q=UX-R3-s9`); await settle(page, 1800);
let tr = page.locator("main table tbody tr").first();
await menu(tr, /^Activate/);
await page.getByRole("button", { name: /^Activate$/ }).click(); await settle(page, 1500);
console.log("after activate: focus", await foc(), "live", JSON.stringify(await live()));
console.log("row:", await page.locator("main table tbody tr").first().innerText().then(t => t.replace(/\n+/g, " | ").slice(0, 200)));
await shot(page, "pois__after-activate__1440");
// Deactivate
await menu(page.locator("main table tbody tr").first(), /^Deactivate/);
console.log("deactivate dialog:", await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].map(d => d.innerText.replace(/\n+/g, " | "))));
await shot(page, "pois__deactivate-confirm__1440");
await page.getByRole("button", { name: /^Deactivate$/ }).last().click(); await settle(page, 1500);
console.log("after deactivate: focus", await foc(), "live", JSON.stringify(await live()));
// Archive
await menu(page.locator("main table tbody tr").first(), /^Archive/);
console.log("archive dialog:", await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].map(d => d.innerText.replace(/\n+/g, " | "))));
await shot(page, "pois__archive-confirm__1440");
await page.getByRole("button", { name: /^Archive$/ }).last().click(); await settle(page, 1200);
console.log("after archive: focus", await foc(), "live", JSON.stringify(await live()));
const bar = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^Undo/.test(x.innerText.trim())); if (!b) return null; let p = b; while (p && !(p.getBoundingClientRect().width > 300)) p = p.parentElement; const r = p.getBoundingClientRect(); return { text: p.innerText.replace(/\n+/g, " | "), r: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], pos: getComputedStyle(p).position, role: p.getAttribute("role"), live: p.getAttribute("aria-live"), vh: innerHeight }; });
console.log("undo bar:", JSON.stringify(bar));
await shot(page, "pois__archive-undo-bar__1440");
await page.waitForTimeout(8000);
console.log("undo bar after 9s still:", await page.evaluate(() => !![...document.querySelectorAll("button")].find(x => /^Undo/.test(x.innerText.trim()))));
// tab order: is the Undo reachable
await go(page, `/projects/${P}/pois?q=UX-R3-s9&status=archived`); await settle(page, 1500);
console.log("archived list rows:", await page.locator("main table tbody tr").count(), "url", await page.evaluate(() => location.search));
await menu(page.locator("main table tbody tr").first(), /^Restore/).catch(e => console.log("no restore", e.message.slice(0,60)));
console.log("archived menu / dialog:", await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=alertdialog],[role=menu]")].map(d => d.innerText.replace(/\n+/g, " | ")))); 
await shot(page, "pois__archived-restore__1440");
await browser.close();
