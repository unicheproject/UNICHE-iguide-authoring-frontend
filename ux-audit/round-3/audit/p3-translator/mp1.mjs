import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base+"/maps"); await page.waitForSelector("h1"); await page.waitForTimeout(2200);
await shot(page,"maps__list__1440");
console.log(await page.evaluate(()=>document.querySelector("main").innerText.slice(0,700)));
const links = await page.evaluate(()=>[...document.querySelectorAll("main a")].map(a=>a.getAttribute("href")+" | "+a.innerText.replace(/\s+/g," ").slice(0,40)).filter(x=>/maps\/|floor/.test(x)).slice(0,6));
console.log(links.join("\n"));
await browser.close();
