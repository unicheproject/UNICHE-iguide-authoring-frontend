import {open,goto,shot} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 for(const [k,btn,id,sub] of [["routes",/new route/i,"#route-title",/create route/i],["guides",/new guide/i,"#guide-title",/create guide/i],["events",/new event/i,"#event-title",/create event/i],["categories",/new category/i,"#category-name",/create category/i]]){
  await goto(page,k);
  await page.getByRole("button",{name:btn}).click();
  await page.waitForTimeout(400);
  if(k==="routes") await page.locator("[role=dialog]").getByRole("button",{name:/^Outdoor/}).click();
  await page.locator(id).fill(`UX-p3-translator ${k.slice(0,-1)}`);
  if(k==="categories") await page.locator("#category-code").fill("ux-p3-translator-category");
  await page.getByRole("button",{name:sub}).click();
  await page.waitForTimeout(2500);
  console.log(k,page.url(), await page.locator('[role=status],[role=alert],.toast').allInnerTexts());
 }
}finally{await browser.close();}
