import { open, go, PID } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("response", r => { if (!r.url().includes("localhost:5173")) console.log(r.status(), r.url().slice(0,140)); });
page.on("requestfailed", r => console.log("FAIL", r.url().slice(0,120), r.failure()?.errorText));
const t=Date.now();
await go(page, `/projects/${PID}/pois`); await page.waitForTimeout(8000);
console.log("ms", Date.now()-t);
console.log((await page.locator("main").innerText()).slice(0,400));
await browser.close();
