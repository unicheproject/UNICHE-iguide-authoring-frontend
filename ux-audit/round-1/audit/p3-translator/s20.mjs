import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
{
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"pois/"+ids.poi);
 // keyboard on tabs
 await page.getByRole("tab",{name:/English/i}).focus();
 await page.keyboard.press("ArrowRight"); 
 console.log("after ArrowRight selected:", await page.locator("[role=tab][aria-selected=true]").innerText(), "focused:", await page.evaluate(()=>document.activeElement.textContent.trim()));
 await page.keyboard.press("Tab");
 console.log("after Tab focus:", await page.evaluate(()=>document.activeElement.tagName+" "+(document.activeElement.textContent||document.activeElement.id).trim().slice(0,30)));
 await page.getByRole("tab",{name:/Ελληνικά/i}).click();
 await page.getByRole("button",{name:/preview in app/i}).click(); await page.waitForTimeout(1500);
 await shot(page,"poi-editor__preview-greek-tab");
 console.log("preview select-lang options:", await page.locator("button:has-text('EL'), button:has-text('EN')").allInnerTexts());
 await page.keyboard.press("Escape"); await page.waitForTimeout(400);
 console.log("preview open after Esc:", await page.getByText("IN THE APP").count());
}finally{await browser.close();}
}
for (const vp of ["1024","zoom200"]){
 const {browser,page}=await open("curator",{viewport:vp});
 try{
  await goto(page,"pois/"+ids.poi); await page.waitForTimeout(1500);
  await page.getByRole("tab",{name:/Ελληνικά/i}).click(); await page.waitForTimeout(300);
  await shot(page,"poi-editor__greek-tab",vp);
  await shot(page,"poi-editor__greek-tab-full",vp,true);
  await goto(page,"pois"); await page.waitForTimeout(2500);
  await page.locator("input[placeholder^=Search]").fill("Temporary"); await page.waitForTimeout(1500);
  await shot(page,"pois-list__long-title-search",vp);
 }finally{await browser.close();}
}
