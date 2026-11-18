import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
for (const k of ["places","pois","routes","guides","events","categories"]) {
  await go(page, `/projects/${P}/${k}`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1200);
  await page.locator("tbody tr").first().locator("a").first().click();
  const t0=Date.now();
  await page.waitForURL(new RegExp(k+"/[0-9a-f-]{36}")); await page.locator("main h1").first().waitFor(); 
  await page.waitForFunction(()=>!/Loading/.test(document.querySelector("main")?.innerText||""),null,{timeout:20000}).catch(()=>{});
  const ms=Date.now()-t0; await settle(page,1000);
  await shot(page,`${k}-editor__active__1440`);
  const info=await page.evaluate(()=>{
    const sc=[...document.querySelectorAll("*")].filter(e=>e.scrollHeight>e.clientHeight+50 && ["auto","scroll"].includes(getComputedStyle(e).overflowY)).map(e=>e.tagName+"."+e.className.toString().slice(0,30)+":"+e.scrollHeight);
    const h2=[...document.querySelectorAll("main h2")].map(e=>e.textContent.trim().slice(0,30));
    const aside=document.querySelector("aside"); const ah=aside?[...aside.querySelectorAll("h2")].map(e=>e.textContent.trim()):[];
    const btns=[...document.querySelectorAll("main button")].filter(b=>b.getBoundingClientRect().top<200&&b.getBoundingClientRect().top>50).map(b=>b.textContent.trim().slice(0,22)).filter(Boolean);
    return {sc,h2,aside:ah,top:btns,bc:document.querySelector("nav[aria-label=Breadcrumb],nav[aria-label=breadcrumb]")?.innerText.replace(/\n/g," > ")};
  });
  console.log(k,"load ms",ms,JSON.stringify(info));
  await go(page, page.url()); // noop reload
}
await browser.close();
