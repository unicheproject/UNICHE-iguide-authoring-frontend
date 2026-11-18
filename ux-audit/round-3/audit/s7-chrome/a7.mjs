import { open, go, P, shot, settle, SH } from "./h.mjs";
const vp = process.argv[2] || "1440";
const { browser, context, page } = await open("admin", { viewport: vp });
const ae = () => page.evaluate(() => { const a = document.activeElement; return a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40) + (a.id ? "#" + a.id : ""); });
await go(page, `/projects/${P}/pois`); await settle(page, 1800);
// SWITCHER
const sw = page.getByRole("button", { name: /UX Audit – Populated/ }).first();
console.log("switcher aria", await sw.evaluate(e => ({ label: e.getAttribute("aria-label"), exp: e.getAttribute("aria-expanded"), haspopup: e.getAttribute("aria-haspopup"), controls: e.getAttribute("aria-controls"), text: e.innerText.replace(/\n/g, " | ") })));
await sw.hover(); await shot(page, `switcher__hover__${vp}`);
await sw.click(); await settle(page, 700);
const sd = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); if (!d) return null; const b = d.getBoundingClientRect(), cs = getComputedStyle(d); return { name: d.getAttribute("aria-label") || d.getAttribute("aria-labelledby"), box: [b.left, b.top, b.width, b.height].map(Math.round), rad: cs.borderRadius, sh: cs.boxShadow.slice(-70), pad: cs.padding, text: d.innerText.replace(/\n+/g, " | ").slice(0, 700), rows: d.querySelectorAll("[role=option],li,a,button").length, scrolls: [...d.querySelectorAll("*")].some(e => e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflowY !== "visible") }; });
console.log("SWITCHER dialog", JSON.stringify(sd));
console.log("focus in switcher:", await ae());
await shot(page, `switcher__open__${vp}`);
await page.keyboard.type("empty"); await settle(page, 400); await shot(page, `switcher__search-empty__${vp}`);
console.log("after typing focus:", await ae(), "rows", await page.locator("[role=dialog] [role=option], [role=dialog] li").count());
await page.keyboard.press("ArrowDown"); console.log("arrow down focus:", await ae());
await page.keyboard.press("Escape"); await settle(page, 300); console.log("after Esc focus:", await ae(), "dialogs", await page.locator("[role=dialog]").count());
// no results
await sw.click(); await settle(page, 400); await page.keyboard.type("zzzzqq"); await settle(page, 300);
console.log("no result text:", await page.evaluate(() => document.querySelector("[role=dialog]")?.innerText.replace(/\n+/g, " | ").slice(0, 300)));
await shot(page, `switcher__no-results__${vp}`);
await page.keyboard.press("Escape");
// USER MENU
const um = page.getByRole("button", { name: /account menu/ });
await um.hover(); await shot(page, `usermenu__hover__${vp}`);
await um.click(); await settle(page, 400);
const ud = await page.evaluate(() => { const m = document.querySelector("[role=menu]"); const b = m?.getBoundingClientRect(); const cs = m && getComputedStyle(m); return m && { text: m.innerText.replace(/\n+/g, " | "), box: [b.left, b.top, b.width, b.height].map(Math.round), rad: cs.borderRadius, sh: cs.boxShadow.slice(-60), items: [...m.querySelectorAll("[role=menuitem]")].map(i => i.textContent.trim()) }; });
console.log("USERMENU", JSON.stringify(ud), "focus", await ae()); await shot(page, `usermenu__open__${vp}`);
await page.keyboard.press("Escape"); console.log("um esc focus", await ae());
await browser.close();
