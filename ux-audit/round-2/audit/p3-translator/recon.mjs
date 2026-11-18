import { open, go, PID, shot } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/pois`);
await page.waitForTimeout(1000);
console.log(page.url());
const links = await page.$$eval("nav a", a => a.map(x => x.textContent.trim().replace(/\s+/g," ") + " -> " + x.getAttribute("href")));
console.log(links.join("\n"));
await shot(page, "recon-pois");
await browser.close();
