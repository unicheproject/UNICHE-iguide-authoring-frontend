import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"media"); await page.waitForTimeout(3000);
 await page.getByRole("button",{name:/^list$/i}).click(); await page.waitForTimeout(800);
 await shot(page,"media-list__list-view");
 console.log("list headers:",await page.locator("th").allInnerTexts());
 await page.getByRole("button",{name:/^upload$/i}).click(); await page.waitForTimeout(800);
 await shot(page,"media-upload__open");
 const fi=page.locator("input[type=file]");
 await fi.setInputFiles("ux-audit/round-1/audit/p3-translator/UX-p3-translator-image.png");
 await page.waitForTimeout(3000);
 await shot(page,"media-upload__after-select");
 console.log((await page.locator("[role=dialog]").innerText()).replace(/\n+/g," | "));
}finally{await browser.close();}
