import {open,goto,shot} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"pois");
 await page.getByRole("button",{name:/new point of interest/i}).click();
 await page.waitForTimeout(500);
 await shot(page,"poi-create__open");
 await page.locator("#poi-title").fill("UX-p3-translator Ακρόπολη POI");
 console.log("place options",await page.locator("#poi-place option").allInnerTexts());
 await page.locator("#poi-place").selectOption({index:1});
 await page.waitForTimeout(300);
 await shot(page,"poi-create__filled");
 await page.getByRole("button",{name:/^create$/i}).click();
 await page.waitForTimeout(3000);
 console.log(page.url());
 await shot(page,"poi-editor__after-create","1440",true);
 console.log((await page.locator("main").innerText()).slice(0,2500));
}finally{await browser.close();}
