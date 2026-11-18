import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"pois/"+ids.poi);
 await page.getByRole("button",{name:/preview in app/i}).click(); await page.waitForTimeout(2000);
 await shot(page,"poi-editor__preview-panel-open","1440",true);
 console.log((await page.locator("body").innerText()).match(/PREVIEW IN APP[\s\S]{0,700}/)?.[0].replace(/\n+/g," | "));
 console.log(await page.locator("select").evaluateAll(s=>s.map(x=>x.id+":"+[...x.options].map(o=>o.text).join(","))));
 console.log(await page.locator("[role=dialog] ,aside").count());
 // Visitor app preview
 await goto(page,"preview"); await page.waitForTimeout(3000);
 await shot(page,"preview-view__default","1440");
 console.log(await page.locator("select").evaluateAll(s=>s.map(x=>x.id+":"+x.getAttribute("aria-label")+":"+[...x.options].map(o=>o.text).join(","))));
}finally{await browser.close();}
