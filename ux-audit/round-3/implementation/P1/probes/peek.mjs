import { open, go } from "../../../../tools/session.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log("console", m.type(), m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("pageerror", e.message));
await go(page, process.argv[2]); await page.waitForTimeout(3000);
console.log(await page.evaluate(() => document.querySelector("main")?.innerText.slice(0, 400)));
await page.screenshot({ path: "ux-audit/round-3/implementation/P1/after/peek.png" });
await browser.close();
