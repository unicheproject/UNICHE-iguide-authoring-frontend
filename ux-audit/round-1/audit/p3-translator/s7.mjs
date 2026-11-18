import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"pois");
 await page.locator("input[type=search],input[placeholder*=Search]").first().fill("UX-p3");
 await page.waitForTimeout(1500);
 await shot(page,"pois-list__search-own");
 await page.getByText("UX-p3-translator",{exact:false}).first().click();
 await page.waitForTimeout(3000);
 console.log("poi",page.url());
 ids.poi=page.url().split("/").pop(); fs.writeFileSync("ux-audit/round-1/audit/p3-translator/ids.json",JSON.stringify(ids));
 await shot(page,"poi-editor__top","1440");
 await shot(page,"poi-editor__full","1440",true);
 console.log((await page.locator("main").innerText()).slice(0,3500));
}finally{await browser.close();}
