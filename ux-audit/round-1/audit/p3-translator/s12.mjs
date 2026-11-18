import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const TXT={"Ελληνικά":"Δοκιμαστικό κείμενο στα ελληνικά","Italiano":"Testo di prova in italiano"};
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 for(const [k,path] of [["guide","guides"],["route","routes"],["event","events"],["category","categories"]]){
  await goto(page,`${path}/${ids[k]}`);
  if(k!=="guide"){ // fill English fields too
    await page.locator("[role=tabpanel] input[type=text], [role=tabpanel] textarea").evaluateAll(()=>{});
  }
  for(const name of ["English","Ελληνικά","Italiano"]){
    await page.getByRole("tab",{name:new RegExp(name,"i")}).first().click(); await page.waitForTimeout(300);
    // open collapsed groups
    for(const b of await page.locator("[role=tabpanel] button[aria-expanded=false]").all()) await b.click();
    const fields=page.locator("[role=tabpanel] input[type=text], [role=tabpanel] textarea, main textarea[placeholder^=Write], main input[placeholder^=Heading]");
    const n=await fields.count();
    for(let i=0;i<n;i++){const f=fields.nth(i); if(await f.isVisible()&&await f.isEditable()){ const id=await f.getAttribute("id"); if(id&&/slug|internal|reading/.test(id))continue; const cur=await f.inputValue(); if(name==="English"&&cur)continue; await f.fill(name==="English"?`English text ${i}`:`${TXT[name]} ${i}`);}}
  }
  await page.getByRole("button",{name:/^save$/i}).click(); await page.waitForTimeout(2500);
  console.log(k,"saved; translations card:", (await page.locator("main").innerText()).match(/TRANSLATIONS[\s\S]{0,160}/)?.[0].replace(/\n+/g," | "));
  await shot(page,`${k}-editor__translated`,"1440",true);
 }
}finally{await browser.close();}
