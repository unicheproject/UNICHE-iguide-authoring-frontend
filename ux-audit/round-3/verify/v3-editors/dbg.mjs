import { open, go } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
page.on("request", r => { if (!/\.(js|css|ts|vue|svg|png|woff2?)(\?|$)/.test(r.url())) console.log("REQ", r.method(), r.url().slice(0,110), !!r.headers()["authorization"]); });
await go(page, "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/0de4063f-c264-4eb7-be0a-ecf822439521");
await page.waitForTimeout(3000);
console.log(page.url(), (await page.locator("body").innerText()).slice(0,300));
await browser.close();
