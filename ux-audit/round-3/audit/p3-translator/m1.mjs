import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base + "/media");
await page.waitForSelector("h1"); await page.waitForTimeout(2500);
await shot(page,"media__grid-default__1440");
console.log((await dump(page)).filter(x=>!x.startsWith("a | ")||/media\//.test(x)).slice(0,45).join("\n"));
console.log(await page.evaluate(()=>document.querySelector("main").innerText.slice(0,900)));
await browser.close();
