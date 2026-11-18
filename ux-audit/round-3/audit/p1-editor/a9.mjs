import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
const U=P+"/pois/d2e48820-a468-4539-9f62-545eed5b06a6";
await go(page, U);
await page.waitForTimeout(1500);
const t=Date.now();
for(let i=0;i<14;i++){
  const nm=page.getByRole("button",{name:/Next missing/}).first();
  if(!(await nm.count()))break;
  const label=await nm.innerText();
  await nm.click(); await page.waitForTimeout(350);
  const f=await page.evaluate(()=>{const a=document.activeElement;return a.tagName+"#"+a.id+" lbl="+(a.labels?.[0]?.innerText||a.getAttribute("aria-label")||"")+" lang="+(a.closest("[lang]")?.getAttribute("lang")||"")});
  console.log(i,label.replace(/\s+/g," "),"->",f);
  const el=await page.evaluate(()=>/INPUT|TEXTAREA/.test(document.activeElement.tagName));
  if(!el){await shot(page,"nextmissing__stuck__"+i);break;}
  await page.keyboard.type("UX-R3 text "+i);
}
console.log("ms",Date.now()-t);
await shot(page,"poi-editor__alpha-texts-filled__1440");
console.log(await hdr(page));
await page.keyboard.press("Control+s");
await page.waitForTimeout(3000);
console.log(await hdr(page));
await page.getByRole("button",{name:/^Activate/}).first().click();
await page.waitForSelector("[role=dialog]");
await page.waitForTimeout(400);
await shot(page,"poi-activate-confirm__alpha-resolved__1440");
console.log((await page.evaluate(()=>document.querySelector("[role=dialog]").innerText)));
await browser.close();
