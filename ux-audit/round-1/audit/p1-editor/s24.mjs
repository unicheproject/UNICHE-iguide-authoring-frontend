import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P+"/media"); await p.waitForTimeout(2500);
await p.getByRole("button",{name:/Filters/}).click(); await p.waitForTimeout(300);
await s.shot("media__filters-open");
const dlg=p.getByRole("dialog",{name:"Filters"}); console.log((await dlg.innerText()).replace(/\n+/g," | "));
await dlg.getByText("Audio",{exact:true}).first().click().catch(e=>console.log("no audio chip",e.message.slice(0,80)));
await p.waitForTimeout(500);
await s.shot("media__filter-audio");
console.log("chips", await p.locator("main button[aria-label^='Remove filter']").allInnerTexts());
await dlg.getByRole("button",{name:/done/i}).click().catch(()=>{});
await p.getByRole("button",{name:"List",exact:true}).click(); await p.waitForTimeout(600);
await s.shot("media__list-view-audio");
console.log((await p.locator("main").innerText()).replace(/\n+/g," | ").slice(0,900));
// search for "frieze"
await p.getByPlaceholder(/Search by name/).fill("frieze"); await p.waitForTimeout(700);
console.log("search 'frieze' rows:", await p.locator("main tbody tr").count());
console.log(page=>0);
await s.browser.close();
