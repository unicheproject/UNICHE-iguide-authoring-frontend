import {open,goto,shot} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 for(const [k,btn] of [["routes",/new route/i],["guides",/new guide/i],["events",/new event/i],["categories",/new category/i]]){
  await goto(page,k);
  await page.getByRole("button",{name:btn}).click();
  await page.waitForTimeout(500);
  const d=page.locator('[role=dialog]');
  console.log("=====",k, (await d.innerText()).replace(/\n+/g," | "));
  console.log(await d.locator("input,select,textarea").evaluateAll(els=>els.map(e=>e.id+":"+e.type+":"+(e.required||"")))); 
  await shot(page,`${k}-create__open`);
 }
}finally{await browser.close();}
