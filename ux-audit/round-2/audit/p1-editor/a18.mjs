import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}`); await settle(page,2500);
const sec=page.locator("section").filter({hasText:"Waiting for you to apply"}).last();
console.log(await sec.evaluate(e=>[...e.querySelectorAll("a,button")].map(a=>a.tagName+":"+a.textContent.trim()+":"+(a.getAttribute("href")||"")).join("\n")));
console.log((await sec.innerText()).slice(-300));
await browser.close();
