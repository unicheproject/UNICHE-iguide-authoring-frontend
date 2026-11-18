import {open,goto,shot} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 await goto(page,"pois");
 await shot(page,"pois-list__default");
 await page.getByRole("button",{name:/filters/i}).click();
 await page.waitForTimeout(500);
 await shot(page,"pois-list__filter-menu-open");
 console.log(await page.locator("body").innerText().then(t=>t.slice(0,600)));
 const sel=page.locator("select");console.log("selects",await sel.count());
 console.log(await page.locator('[role=dialog],[role=menu],[role=listbox]').allInnerTexts());
}finally{await browser.close();}
