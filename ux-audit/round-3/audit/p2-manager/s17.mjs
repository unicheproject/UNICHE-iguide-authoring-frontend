import { open, go } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const ID="600c4311-3e81-4235-91b0-5b3e336918fc";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/"+ID+"/pois/3f50d83d-e205-4c40-81e3-ed27a07857cd"); await page.waitForTimeout(3000);
await shot(page,"poi-editor-draft-mine__top__1440"); await shot(page,"poi-editor-draft-mine__full__1440", true);
console.log(await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,3500)));
await browser.close();
