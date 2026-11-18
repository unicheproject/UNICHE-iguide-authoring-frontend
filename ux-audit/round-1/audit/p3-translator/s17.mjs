import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"media/"+ids.asset);
 const lab=await page.locator("[role=tabpanel] label").allInnerTexts(); console.log(lab);
 const T={English:["A purple gradient test image","Test","Caption in English"],"Ελληνικά":["Μωβ διαβάθμιση δοκιμαστικής εικόνας","Δοκιμή","Λεζάντα στα ελληνικά"],Italiano:["Immagine di prova con sfumatura viola","Prova","Didascalia in italiano"]};
 for(const [n,v] of Object.entries(T)){
  await page.getByRole("tab",{name:new RegExp(n,"i")}).click(); await page.waitForTimeout(300);
  const f=page.locator("[role=tabpanel] input[type=text], [role=tabpanel] textarea");
  const c=await f.count(); console.log(n,"fields",c);
  for(let i=0;i<Math.min(c,3);i++) await f.nth(i).fill(v[i]);
  if(n==="Ελληνικά") await shot(page,"asset-editor__greek-tab-alt-text","1440");
 }
 await page.getByRole("button",{name:/^save$/i}).click(); await page.waitForTimeout(2500);
 await shot(page,"asset-editor__saved","1440");
 console.log((await page.locator("body").innerText()).match(/TRANSLATIONS[\s\S]{0,200}/)?.[0].replace(/\n+/g," | "));
}finally{await browser.close();}
