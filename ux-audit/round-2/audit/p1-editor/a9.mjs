import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${ID}`);
await page.getByRole("heading", { level: 1 }).first().waitFor(); await settle(page,1200);
// readiness items: links?
const info = await page.evaluate(()=>{ const h=[...document.querySelectorAll("h2,h3")].find(e=>/Before you activate/.test(e.textContent)); const c=h.closest("section,div,aside"); return {links:[...c.querySelectorAll("a,button")].map(e=>e.tagName+":"+e.textContent.trim().slice(0,60)), html:c.outerHTML.slice(0,600)}});
console.log(JSON.stringify(info,null,1));
// header "3 warnings" button
await page.getByRole("button",{name:/warnings/}).click(); await settle(page,500);
await shot(page,"poi-editor__warnings-header-click__1440");
console.log("scrollY", await page.evaluate(()=>[...document.querySelectorAll("*")].filter(e=>e.scrollTop>0).map(e=>e.tagName+e.scrollTop)));
// Greek tab
await page.getByRole("tab",{name:/Ελληνικά/}).click(); await settle(page,500);
await shot(page,"poi-editor__greek-tab__1440");
console.log("TAB focus:", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
await page.keyboard.press("ArrowRight"); await settle(page,300);
console.log("after ArrowRight focus:", await page.evaluate(()=>document.activeElement?.textContent.slice(0,40)+" sel="+document.activeElement?.getAttribute("aria-selected")));
await browser.close();
