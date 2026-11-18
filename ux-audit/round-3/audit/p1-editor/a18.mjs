import {open,go,P,shot} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
await go(page,P+"/pois?q=UX-R3&sort=updated"); await page.waitForSelector("tbody tr");
console.log(await page.evaluate(()=>{const s=[...document.querySelectorAll("*")].filter(b=>b.children.length<3&&/^Active\s*3/.test(b.innerText?.trim()||"")&&b.getBoundingClientRect().top<250);return s.map(b=>b.tagName+" "+b.outerHTML.slice(0,200))}));
await browser.close();
