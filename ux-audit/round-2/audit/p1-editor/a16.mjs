import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}`); await settle(page,2000);
const txt=await page.locator("main").innerText(); 
console.log("has Amphora:", txt.includes("Amphora"), "Waiting header:", txt.match(/\d+ items? have saved[^\n]*/)?.[0]);
const rows=[...txt.matchAll(/(\d{2} Nov 2026, \d\d:\d\d)/g)].map(m=>m[1]); console.log(rows.join(" | "));
await shot(page,"dashboard__waiting-to-apply__1440", true);
await browser.close();
