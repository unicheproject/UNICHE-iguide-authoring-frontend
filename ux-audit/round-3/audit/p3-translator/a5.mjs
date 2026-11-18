import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base + "/pois/546c5177-effd-49c8-acae-85d751f89bbe?lang=el");
await page.waitForSelector("h1"); await page.waitForTimeout(2500);
await shot(page, "poi-editor__greek-tab__1440", true);
console.log(await page.evaluate(()=>[...document.querySelectorAll("input,textarea")].filter(e=>e.offsetParent).map(e=>`${e.tagName} ${e.name||e.id} dir=${e.dir} lang=${e.lang} val=${e.value.slice(0,80)}`).join("\n")));
console.log(await page.evaluate(()=>document.querySelector("main").innerText.slice(0,2500)));
await browser.close();
