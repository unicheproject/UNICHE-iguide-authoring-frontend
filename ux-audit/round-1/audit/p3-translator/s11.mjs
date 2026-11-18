import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,`guides/${ids.guide}`);
 await page.locator("#f-title").fill("UX-p3-translator guide");
 await page.getByRole("button",{name:/\+ paragraph/i}).click(); await page.waitForTimeout(600);
 await shot(page,"guide-editor__english-paragraph-added","1440",true);
 const story=()=>page.locator('textarea[placeholder^="Write"], input[placeholder^="Write"], textarea[id^="block"], textarea');
 await page.locator('textarea[placeholder^="Write the paragraph"]').fill("The Parthenon was built in the fifth century BC.");
 await page.getByRole("button",{name:/\+ heading/i}).click(); await page.waitForTimeout(500);
 console.log(await page.locator("[role=tabpanel], main").locator("textarea,input").evaluateAll(e=>e.map(x=>x.tagName+":"+(x.placeholder||x.id))));
 await page.locator('[placeholder^="Write the heading"], [placeholder*="eading"]').last().fill("Heading in English");
 await page.getByRole("button",{name:/^save$/i}).click(); await page.waitForTimeout(2500);
 await page.getByRole("tab",{name:/Ελληνικά/i}).click(); await page.waitForTimeout(800);
 await shot(page,"guide-editor__greek-tab-after-english-story","1440",true);
 console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,1200));
}finally{await browser.close();}
