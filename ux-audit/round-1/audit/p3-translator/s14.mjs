import {open,goto,shot} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"media");
 await page.waitForTimeout(4000); await shot(page,"media-list__default");
 console.log((await page.locator("body").innerText()).replace(/\n+/g," | ").slice(0,700));
 const btns=await page.locator("body button").allInnerTexts(); console.log(btns.slice(0,20));
}finally{await browser.close();}
