import { open, go, base, shot } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base+"/places/e5932358-078d-4872-a903-8b726793b9d5?lang=it"); await page.waitForSelector("h1"); await page.waitForTimeout(2200);
await shot(page,"place-editor__it-tab__1440",true);
console.log(await page.evaluate(()=>[...document.querySelectorAll("main input,main textarea,main select,main button,main [role=tab]")].filter(e=>e.offsetParent).map(e=>`${e.tagName.toLowerCase()} ${e.id}|${(e.getAttribute("aria-label")||e.labels?.[0]?.innerText||e.innerText||"").trim().replace(/\s+/g," ").slice(0,55)}`).join("\n")));
await browser.close();
