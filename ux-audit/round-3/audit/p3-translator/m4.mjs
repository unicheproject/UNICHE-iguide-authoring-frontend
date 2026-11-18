import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const p of ["/media?lang=it&missing=it","/pois?lang=it&missing=it","/places?lang=it&missing=it","/routes?lang=it&missing=it","/guides?lang=it&missing=it","/events?lang=it&missing=it","/categories?lang=it&missing=it"]) {
await go(page, base + p);
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
const r = await page.evaluate(()=>{
 const m=document.querySelector("main");
 const links=[...m.querySelectorAll("a[href*='/']")].filter(a=>/\/(media|pois|places|routes|guides|events|categories)\/[0-9a-f-]{36}/.test(a.getAttribute("href")));
 const first=links.slice(0,4).map(a=>a.getAttribute("href").replace(/^.*\/([a-z]+\/[0-9a-f]{8})[0-9a-f-]*/,"$1…")+" | "+a.innerText.replace(/\s+/g," ").slice(0,40));
 const count=[...m.querySelectorAll("p,div,span")].filter(e=>e.children.length===0 && /^(Showing|\d+ (of|results))/.test(e.innerText||"")).map(e=>e.innerText).slice(0,2);
 const matchHints=[...m.querySelectorAll("*")].filter(e=>e.children.length===0&&/Matches /.test(e.innerText||"")).length;
 return {first,count,matchHints,lang:document.documentElement.lang};
});
console.log(p, JSON.stringify(r));
}
await browser.close();
