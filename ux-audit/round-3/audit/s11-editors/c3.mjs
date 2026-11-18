import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const vp=process.argv[2]||"1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, url("categories", IDS.category)); await settle(page,1500);
const used = page.locator("section,div").filter({has: page.getByRole("heading",{name:/^Used in/})}).last();
console.log("USED:", await txt(page).then(s=>s.slice(s.indexOf("Used in"))));
await page.getByRole("heading",{name:/^Used in/}).scrollIntoViewIfNeeded(); await settle(page,300);
await shot(page,`category__used-in__${vp}`);
console.log("used html:", (await page.getByRole("heading",{name:/^Used in/}).evaluate(h=>h.closest("section,div.rounded-lg")?.outerHTML.replace(/<svg.*?<\/svg>/g,"<svg/>").replace(/class="[^"]*"/g,"").slice(0,2500))));
// scope radio lock
console.log("scope radios:", await page.locator("input[type=radio]").evaluateAll(es=>es.slice(0,4).map(e=>e.name+":"+e.value+":dis="+e.disabled+":chk="+e.checked)));
const setupTxt = await page.locator("#setup").innerText(); console.log("SETUP:", setupTxt.replace(/\n+/g," | ").slice(0,700));
await shot(page,`category__setup-used__${vp}`);
await browser.close();
