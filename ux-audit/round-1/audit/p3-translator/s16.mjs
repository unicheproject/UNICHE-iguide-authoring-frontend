import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"media"); await page.waitForTimeout(3000);
 await page.locator("input[placeholder^=Search]").fill("UX-p3"); await page.waitForTimeout(1500);
 await page.getByText("UX-p3-translator-image.png").first().click(); await page.waitForTimeout(3000);
 console.log(page.url()); ids.asset=page.url().split("/").pop(); fs.writeFileSync("ux-audit/round-1/audit/p3-translator/ids.json",JSON.stringify(ids));
 await shot(page,"asset-editor__top","1440",true);
 console.log((await page.locator("body").innerText()).replace(/\n+/g," | ").slice(300,2200));
 console.log(await page.locator("[role=tab]").allInnerTexts());
}finally{await browser.close();}
