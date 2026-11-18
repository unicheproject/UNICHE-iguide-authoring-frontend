import {open,go,P,shot,btns} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
await go(page, P+"/pois/d2e48820-a468-4539-9f62-545eed5b06a6");
await page.waitForTimeout(1500);
// image
await page.getByRole("button",{name:/Add\s*Primary image/}).click();
await page.getByRole("button",{name:/^klepsydra/}).click();
await shot(page,"asset-picker__selected__1440");
await page.getByRole("button",{name:/Use this image/}).click();
await page.waitForTimeout(800);
console.log("after image focus:",await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
// audio
await page.getByRole("button",{name:/English : choose audio/}).click();
await page.waitForTimeout(1200);
console.log((await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText||"")).slice(0,700));
await shot(page,"asset-picker__audio__1440");
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
await page.getByRole("button",{name:/Add QR code/}).click();
await page.getByRole("button",{name:/Add Geo-proximity/}).click();
await page.waitForTimeout(800);
await shot(page,"poi-editor__triggers-added__1440");
console.log(await btns(page,"main"));
await browser.close();
