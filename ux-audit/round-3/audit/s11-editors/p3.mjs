import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await settle(page);
await page.getByRole("searchbox").or(page.locator("input[type=search]")).first().fill("UX-R3-s11"); await settle(page,1500);
console.log(await page.evaluate(()=>[...document.querySelectorAll("main a, main tr")].filter(e=>/R3-s11/.test(e.textContent)).map(e=>e.tagName+" "+(e.href||"")+" "+e.textContent.slice(0,50))));
await shot(page,"poi-list-search");
await browser.close();
