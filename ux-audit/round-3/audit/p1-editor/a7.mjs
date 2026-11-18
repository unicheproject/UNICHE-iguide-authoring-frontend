import {open,go,P,shot,btns} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
const U=P+"/pois/d2e48820-a468-4539-9f62-545eed5b06a6";
await go(page, U);
await page.waitForTimeout(1500);
// Restore draft notice?
console.log("restore notice:", await page.getByText(/Restore/).count());
const sel=await page.evaluate(()=>{const s=[...document.querySelectorAll("select")].map(s=>({v:s.value,pl:getComputedStyle(s).paddingLeft,bw:getComputedStyle(s).borderWidth,bc:getComputedStyle(s).borderColor,txt:s.selectedOptions[0]?.text.slice(0,30), x:s.getBoundingClientRect().x}));return s});
console.log(JSON.stringify(sel));
await page.getByRole("button",{name:/Set position on the map/}).click();
await page.waitForTimeout(1500);
const m=page.locator(".leaflet-container").first();
const b=await m.boundingBox();
await page.mouse.click(b.x+b.width*0.45,b.y+b.height*0.5);
await page.waitForTimeout(600);
console.log("lat/lon:",await page.locator("input[placeholder^='e.g. 37']").first().inputValue(),await page.locator("input[placeholder^='e.g. 23']").first().inputValue());
await shot(page,"poi-editor__map-placed__1440");
// QR + geo
await page.getByRole("button",{name:/Add QR code/}).click();
await page.getByRole("button",{name:/Add Geo-proximity/}).click();
const geoLat=page.locator("input[placeholder^='e.g. 37']").nth(1), geoLon=page.locator("input[placeholder^='e.g. 23']").nth(1);
await geoLat.fill("37,9715"); await geoLon.fill("23.7257"); await geoLon.blur();
await page.waitForTimeout(400);
// Ctrl+S timing
const t=Date.now();
await page.locator("#f-title").click();
await page.keyboard.press("Control+s");
await page.waitForFunction(()=>/Saved|saved/.test(document.body.innerText),null,{timeout:20000}).catch(()=>console.log("no 'saved' text"));
console.log("ctrl+s ms",Date.now()-t);
await page.waitForTimeout(800);
const live=await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.getAttribute("aria-live")+":"+e.innerText.trim().slice(0,100)));
console.log("live:",live);
console.log("toasts:",await page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert],li[data-sonner-toast],[data-toast]")].map(e=>e.innerText.trim().slice(0,100))));
await shot(page,"poi-editor__after-ctrl-s__1440");
console.log(await page.evaluate(()=>document.querySelector("header, [data-editor-header]")?.innerText));
await browser.close();
