import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"events/"+ids.event);
 await page.getByRole("button",{name:/add occurrence/i}).click(); await page.waitForTimeout(800);
 await shot(page,"event-occurrence__dialog");
 const d=page.locator("[role=dialog]");
 console.log((await d.innerText()).replace(/\n+/g," | "));
 console.log(await d.locator("input,select,textarea").evaluateAll(e=>e.map(x=>x.id+":"+x.type+":"+x.value)));
}finally{await browser.close();}
