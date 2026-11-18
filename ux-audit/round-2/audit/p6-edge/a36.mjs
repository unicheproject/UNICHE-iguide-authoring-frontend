import { open, go, P, ids, shot, alerts, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
await page.route(AP, async (r) => { if (r.request().method() === "GET" && /\/pois/.test(r.request().url())) await new Promise(s => setTimeout(s, 8000)); return r.continue(); });
await page.goto(`http://localhost:5173${PP}/pois/${I.poiA}`);
for (const t of [1000, 3000, 6000]) { await page.waitForTimeout(t === 1000 ? 1000 : t === 3000 ? 2000 : 3000); console.log(`t+${t}ms:`, (await page.locator("main").innerText().catch(()=> "")).replace(/\n+/g, " | ").slice(0, 160), "| alerts", JSON.stringify(await alerts(page)).slice(0, 160)); if (t === 3000) await shot(page, "poi-editor__loading-slow-3s"); }
await page.waitForTimeout(4000);
console.log("loaded:", (await page.locator("h1").first().innerText().catch(()=>"")));
await browser.close();
