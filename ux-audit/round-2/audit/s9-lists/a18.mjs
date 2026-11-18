import { open, go, POP } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${POP}/places`); await page.waitForTimeout(1200);
console.log(await page.evaluate(() => [...document.querySelectorAll("tbody tr p")].slice(0, 8).map((p) => { const c = getComputedStyle(p).color; const r = p.closest("tr"); return c + " | " + p.textContent.trim().slice(0, 40) + " | hover=" + r.matches(":hover") + " | cls=" + p.className; })));
await browser.close();
