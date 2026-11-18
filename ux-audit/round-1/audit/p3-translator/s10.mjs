import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const TX={English:"English text",Ελληνικά:"Ελληνικό κείμενο δοκιμής",Italiano:"Testo italiano di prova"};
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 for(const [k,path] of [["route","routes"],["guide","guides"],["event","events"],["category","categories"]]){
  await goto(page,`${path}/${ids[k]}`);
  await shot(page,`${k}-editor__top`,"1440",true);
  const tabs=await page.locator("[role=tab]").allInnerTexts();
  console.log("=====",k,"tabs",tabs);
  for(const name of ["Ελληνικά","Italiano"]){
    await page.getByRole("tab",{name:new RegExp(name,"i")}).first().click();
    await page.waitForTimeout(300);
    const labels=await page.locator("[role=tabpanel] label").allInnerTexts();
    console.log(name,"labels",labels.join(" | "));
    if(name==="Ελληνικά") await shot(page,`${k}-editor__greek-tab`,"1440",true);
  }
  console.log("main text sample:",(await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,900));
 }
}finally{await browser.close();}
