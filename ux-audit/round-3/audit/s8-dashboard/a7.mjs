import { open, go, settle, dash, P } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1024" });
await go(page, dash(P)); await settle(page, 2000);
await page.evaluate(() => { const h = document.querySelector("main h1"); h.setAttribute("tabindex", "-1"); h.focus(); });
const out = [];
for (let i = 0; i < 40; i++) { await page.keyboard.press("Tab"); const s = await page.evaluate(() => { const e = document.activeElement; const b = e.getBoundingClientRect(); const m = document.querySelector("main"); return [!!e.closest("main"), (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24), Math.round(b.y + m.scrollTop)].join(" | "); }); out.push(s); if (!s.startsWith("true")) break; }
console.log(out.join("\n"));
await browser.close();
