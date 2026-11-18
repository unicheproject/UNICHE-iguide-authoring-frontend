import { open, CMS, API } from "../tools/session.mjs";
const { browser, page } = await open("admin");
page.on("request", (r) => { if (!r.url().includes("/src/") && !r.url().includes("node_modules")) console.log("REQ", r.url().slice(0, 100), !!r.headers()["authorization"]); });
await page.goto(CMS + "/"); await page.waitForTimeout(8000);
console.log("URL", page.url()); await page.screenshot({ path: "ux-audit/round-2/dbg.png" });
await browser.close();
