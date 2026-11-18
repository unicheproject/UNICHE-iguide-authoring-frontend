import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const vp=process.argv[2]||"1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, url("guides", IDS.guide)); await settle(page,1500);
for (const k of ["Add paragraph","Add heading","Add paragraph"]) { await page.getByRole("button",{name:k}).click(); await settle(page,200); await page.keyboard.type(k+" text"); }
const rows = page.locator("li[data-element-row]");
console.log(await rows.first().locator("button,select").evaluateAll(bs=>bs.map(b=>(b.getAttribute("aria-label")||b.textContent.trim()).slice(0,26)+":"+Math.round(b.getBoundingClientRect().width)+"x"+Math.round(b.getBoundingClientRect().height))));
// insert menu
await page.getByRole("button",{name:/^Insert after paragraph 1/}).click(); await settle(page,300);
console.log("insert menu", await page.evaluate(()=>{const m=document.querySelector("[role=menu]"); return m? m.innerText.replace(/\n+/g," | "):"no menu; focus="+document.activeElement.outerHTML.slice(0,100)}));
await shot(page,`guide__insert-menu__${vp}`);
await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await settle(page,400);
console.log("rows", await rows.count(), "focus", await page.evaluate(()=>document.activeElement.id||document.activeElement.outerHTML.slice(0,100)));
// heading level
const h3 = page.getByRole("button",{name:/H3/}).first(); await h3.click(); await settle(page,200);
console.log("heading label", await page.locator("label").filter({hasText:/Heading/}).first().innerText());
// remove
await page.getByRole("button",{name:/^Remove paragraph 1$/}).click(); await settle(page,400);
console.log("focus after remove", await page.evaluate(()=>{const a=document.activeElement;return a.tagName+" | "+(a.getAttribute("aria-label")||a.textContent.trim().slice(0,80))}));
const bar = await page.evaluate(()=>{const b=[...document.querySelectorAll("div")].find(e=>/Undo/.test(e.textContent)&&e.querySelector("button")&&/removed/i.test(e.textContent)&&e.getBoundingClientRect().height<120&&e.getBoundingClientRect().height>20); if(!b) return null; const r=b.getBoundingClientRect(); return {t:b.textContent.trim().slice(0,100),top:r.top,bottom:r.bottom,vh:innerHeight}});
console.log("bar", JSON.stringify(bar)); await shot(page,`guide__undo-bar__${vp}`);
await page.keyboard.press("Control+z"); await settle(page,300);
console.log("rows after undo", await rows.count(), await rows.first().locator("textarea,input").first().inputValue());
// Meta+Z should work too? skip. Esc on undo bar dismiss
await page.getByRole("button",{name:/^Remove paragraph 1$/}).click(); await settle(page,300);
await page.getByRole("button",{name:/Dismiss|Close/}).first().click().catch(e=>console.log("no dismiss",e.message.slice(0,80)));
await settle(page,300);
console.log("focus after dismiss", await page.evaluate(()=>{const a=document.activeElement;return a.tagName+" | "+(a.getAttribute("aria-label")||a.textContent.trim().slice(0,80))}));
// remove all -> empty
while (await rows.count()) { await page.getByRole("button",{name:/^Remove /}).first().click(); await settle(page,120); }
console.log("empty story:", await page.locator("#story-body").innerText());
await shot(page,`guide__empty-after-remove__${vp}`);
await browser.close();
