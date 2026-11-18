import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const s = await start(vp); const { page } = s;
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
await page.getByRole("button",{name:/Filters/}).click(); await page.waitForTimeout(500);
await page.getByRole("radio",{name:"Audio"}).check({force:true}).catch(async e=>{console.log("radio fail"); await page.getByText("Audio",{exact:true}).first().click({force:true});});
await page.waitForTimeout(400);
await s.shot("library__filter-audio-popover");
await page.getByRole("button",{name:"Done"}).click(); await page.waitForTimeout(500);
await s.shot("library__filter-audio");
console.log("audio count", await page.locator("main ul li").count(), await page.evaluate(()=>document.querySelector("main nav[aria-label=Pages]")?.innerText), "focus:", await page.evaluate(()=>document.activeElement?.innerText));
console.log("chips", await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>b.innerText.trim()).filter(Boolean).join("|")));
// status filter combined with missing alt
await page.getByRole("button",{name:/Filters/}).click(); await page.waitForTimeout(500);
await page.getByRole("radio",{name:"Any status"}).check({force:true}); 
await page.getByRole("radio",{name:"Image"}).check({force:true});
await page.getByRole("radio",{name:"DRAFT"}).check({force:true});
await page.getByRole("button",{name:"Done"}).click(); await page.waitForTimeout(500);
await s.shot("library__filter-image-draft");
console.log("img draft", await page.locator("main ul li").count());
// filtered-empty
await page.getByRole("button",{name:/Filters/}).click(); await page.waitForTimeout(500);
await page.getByRole("radio",{name:"Document"}).check({force:true});
await page.getByRole("radio",{name:"ACTIVE"}).check({force:true});
await page.getByRole("radio",{name:"ARCHIVED"}).check({force:true});
await page.getByRole("radio",{name:"3D model"}).check({force:true});
await page.getByRole("button",{name:"Done"}).click(); await page.waitForTimeout(500);
await s.shot("library__filtered-empty");
console.log(await page.evaluate(()=>document.querySelector("main").innerText.slice(0,600)));
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
for (const q of ["frieze","Παρθ","alt","parthenon"]) { await page.fill("#media-search",q); await page.waitForTimeout(500); console.log(q, await page.locator("main ul li").count()); }
await page.fill("#media-search","zzzz"); await page.waitForTimeout(400); await s.shot("library__search-empty");
// keyboard: tab order
await page.fill("#media-search","");
await page.keyboard.press("Tab"); 
const order=[]; for(let i=0;i<8;i++){ order.push(await page.evaluate(()=>{const e=document.activeElement; return (e.tagName+":"+(e.getAttribute("aria-label")||e.innerText||e.id).slice(0,30)).replace(/\n/g," ")})); await page.keyboard.press("Tab"); }
console.log(order.join(" > "));
// page 2
await page.getByRole("button",{name:/Next/}).click(); await page.waitForTimeout(500);
await s.shot("library__page2");
console.log("p2", await page.locator("main ul li").count(), await page.evaluate(()=>document.querySelector("main").scrollTop), "focus", await page.evaluate(()=>document.activeElement?.innerText));
await s.browser.close();
