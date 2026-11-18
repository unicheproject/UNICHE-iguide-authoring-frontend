import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const vp=process.argv[2]||"1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, url("categories", IDS.category)); await settle(page,1500);
console.log(await txt(page));
await shot(page,`category__fresh__${vp}`);
await page.screenshot({path:`ux-audit/round-3/audit/s11-editors/shots/category__fresh-full__${vp}.png`, fullPage:true});
console.log(await page.evaluate(()=>[...document.querySelectorAll("main input, main select, main [role=radio], main [role=radiogroup]")].map(b=>b.tagName+"#"+b.id+":"+b.type+":"+(b.getAttribute("aria-label")||b.getAttribute("name")||"")).slice(0,30).join(" | ")));
// Greek tab
await page.getByRole("tab",{name:/Ελληνικά/}).click(); await settle(page,500);
console.log("GREEK:", await txt(page).then(s=>s.slice(s.indexOf("Texts"), s.indexOf("Texts")+900)));
await shot(page,`category__greek-tab__${vp}`);
await browser.close();
