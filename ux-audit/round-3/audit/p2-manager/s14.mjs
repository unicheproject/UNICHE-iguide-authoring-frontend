import { open, go, CMS } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const P = { populated:"6958c18f-60d2-4140-a524-5a43f8a2f6b5", emptyb:"1d6971ce-6391-4da8-848e-8d7466d25128", mine:"600c4311-3e81-4235-91b0-5b3e336918fc" };
for (const vp of ["1440","1280","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const [k,id] of Object.entries(P)) {
    if (k==="mine" && vp!=="1440") continue;
    await go(page, "/projects/"+id);
    await page.waitForTimeout(2500);
    await shot(page, `dashboard-${k}__loaded__${vp}`, vp==="1440"||vp==="zoom200");
    const g = await page.evaluate(()=>{
      const main=document.querySelector("main"); const out=[];
      for (const e of main.querySelectorAll(":scope > div > *, :scope > * > * > *")) { const b=e.getBoundingClientRect(); if (b.width>200 && b.height>40) out.push([e.tagName, (e.querySelector("h2,h3")?.innerText||e.innerText.slice(0,25)).replace(/\n/g," "), Math.round(b.x), Math.round(b.y+scrollY), Math.round(b.right), Math.round(b.height)]); }
      return {sw:document.documentElement.scrollWidth, iw:innerWidth, out:out.slice(0,12)};
    });
    console.log(vp,k,JSON.stringify(g));
    if (vp==="1440" && k!=="mine") console.log("TEXT",k,"\n",await page.evaluate(()=>document.querySelector("main")?.innerText));
  }
  await browser.close();
}
