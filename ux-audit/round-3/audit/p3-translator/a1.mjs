import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const errs=[]; page.on("pageerror", e=>errs.push(String(e)));
await go(page, base + "/pois");
await page.waitForTimeout(2500);
console.log((await dump(page)).slice(0,70).join("\n"));
await shot(page, "pois-list__default__1440");
console.log("errs", errs);
await browser.close();
