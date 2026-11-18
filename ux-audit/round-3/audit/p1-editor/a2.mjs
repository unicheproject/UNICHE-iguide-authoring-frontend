import {open,go,P,shot,btns} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
await go(page, P+"/pois?create=1");
await page.waitForTimeout(1500);
await shot(page,"poi-create-dialog__empty__1440");
console.log(await btns(page,"[role=dialog]"));
console.log(await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText));
await browser.close();
