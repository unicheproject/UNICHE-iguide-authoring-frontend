import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/pois/${ids.poi}`);
await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(2000);
await page.getByRole("tab", { name: /Italiano/ }).click(); await page.waitForTimeout(500);
await page.getByLabel("Title in Italiano").fill("متحف الأغورا القديمة (قاعة 2026) – Stoa");
await page.getByLabel("Summary in Italiano").fill("מוזיאון האגורה העתיקה, אולם 2026 – תיאור קצר.");
const info = await page.evaluate(() => ["Title in Italiano","Summary in Italiano"].map(l => { const lab=[...document.querySelectorAll("label")].find(x=>x.innerText.trim().startsWith(l)); const f=lab.control; const cs=getComputedStyle(f); return `${l}: dir=${f.dir} lang=${f.lang} text-align=${cs.textAlign} direction=${cs.direction} unicode-bidi=${cs.unicodeBidi}`; }));
console.log(info.join("\n"));
await shot(page, "rtl__arabic-hebrew-typed-in-ltr-field", "1440", false);
// header + tab + readiness language names
console.log("tab label html:", await page.locator("[role=tab]").nth(2).evaluate(e => e.innerHTML.replace(/\s+/g," ").slice(0,300)));
// list search input dir
await go(page, `/projects/${PID}/pois`); await page.waitForTimeout(3000);
const s = page.getByLabel("Search", { exact: true }); await s.fill("متحف");
console.log("search input dir:", await s.evaluate(e => `${e.dir || "(none)"} lang=${e.lang||"(none)"} align=${getComputedStyle(e).textAlign}`));

console.log("html lang/dir:", await page.evaluate(() => document.documentElement.lang + "/" + document.documentElement.dir));
await browser.close();
