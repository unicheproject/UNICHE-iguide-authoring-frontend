import { open, go, shot, POP } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" }); page.setDefaultTimeout(8000);
for (const k of ["places","pois","routes","guides","events","categories"]) {
  await go(page, `/projects/${POP}/${k}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(1500);
  const m = await page.evaluate(() => { const rows = [...document.querySelectorAll("tbody tr")].map((r) => r.getBoundingClientRect().height); const med = rows.slice().sort((a, b) => a - b)[Math.floor(rows.length / 2)]; return { rows: rows.length, min: Math.round(Math.min(...rows)), med: Math.round(med), max: Math.round(Math.max(...rows)), mainH: document.querySelector("main").scrollHeight, title: document.title, thead: Math.round(document.querySelector("thead")?.getBoundingClientRect().height ?? 0) }; });
  console.log(k, JSON.stringify(m));
}
await browser.close();
