import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"pois/"+ids.poi);
 // fill English summary first
 await page.locator("#f-summary").fill("A short English summary of the Acropolis hill for visitors.");
 await page.locator("#f-description").fill("English description: the rock above Athens, home of the Parthenon, visited by millions.");
 await page.getByRole("tab",{name:/Ελληνικά/i}).click();
 await page.waitForTimeout(500);
 await shot(page,"poi-editor__greek-tab-empty");
 console.log("greek tab fields", await page.locator("[role=tabpanel] label").allInnerTexts());
 console.log("tab keyboard: focus tabs");
 await page.keyboard.press("Tab");
 // card clickable?
 const card=page.getByText("Translations",{exact:true}).first();
 await page.locator("text=Italiano").last().click().catch(e=>console.log("click it row err"));
 await page.waitForTimeout(500);
 await shot(page,"poi-editor__after-click-translations-row");
 console.log("active tab after clicking row:", await page.locator('[role=tab][aria-selected=true]').innerText());
 // computed text-transform & lang of tab
 console.log(await page.evaluate(()=>{const t=[...document.querySelectorAll("[role=tab]")];return t.map(x=>({txt:x.textContent.trim(),tt:getComputedStyle(x).textTransform,lang:x.lang||x.closest("[lang]")?.lang, tabindex:x.tabIndex}))}));
}finally{await browser.close();}
