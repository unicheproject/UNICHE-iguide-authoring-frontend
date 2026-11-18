import { start, goEd, P, poi, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await goEd(page, "/pois/"+poi("frieze").id);
await page.keyboard.press("Tab"); // skip link?
const seq=[]; for (let i=0;i<14;i++){ await page.keyboard.press("Tab"); seq.push(await page.evaluate(()=>{const e=document.activeElement; return (e.getAttribute("aria-label")||e.innerText||e.id||e.tagName).toString().trim().slice(0,26).replace(/\n/g," ")})); }
console.log(seq.join(" > "));
// focus Save draft and screenshot
await page.getByRole("button",{name:/save draft/i}).focus(); await s.shot("focus__save-draft-disabled");
console.log("save draft disabled:", await page.getByRole("button",{name:/save draft/i}).isDisabled());
await page.getByRole("button",{name:/discard changes/i}).focus(); await page.screenshot({path: new URL("./shots/focus__discard-changes__1440.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1"), clip:{x:240,y:230,width:1200,height:90}});
await page.getByRole("tab",{name:/ελληνικά/i}).focus(); await page.screenshot({path: new URL("./shots/focus__lang-tab__1440.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1"), clip:{x:240,y:320,width:800,height:70}});
// computed contrast of disabled Save draft
console.log(await page.evaluate(()=>{const b=[...document.querySelectorAll("button")].find(x=>/save draft/i.test(x.textContent)); const c=getComputedStyle(b); return {color:c.color, opacity:c.opacity, fs:c.fontSize}}));
await s.browser.close();
