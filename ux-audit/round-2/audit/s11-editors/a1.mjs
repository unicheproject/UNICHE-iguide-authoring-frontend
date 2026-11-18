import { open, go, rec, P, shot, ready, axe, H } from "./h.mjs";
const kinds = { route:`routes/${rec.route}`, guide:`guides/${rec.guide}`, event:`events/${rec.event}`, category:`categories/${rec.category}` };
for (const vp of ["1440","1280","1024","768","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  const errs=[]; page.on("pageerror",e=>errs.push(e.message));
  for (const [k,p] of Object.entries(kinds)) {
    await go(page, `/projects/${P}/${p}`); await ready(page, 1500);
    await shot(page, `${k}-editor__draft__${vp}`);
    if (vp==="1440") {
      console.log("==",k, JSON.stringify(await H(page)));
      console.log(await page.evaluate(()=>[...document.querySelectorAll("h1,h2,h3")].map(e=>e.tagName+":"+(e.textContent||"").trim().slice(0,60)).join(" | ")));
      console.log("HEADER:", await page.evaluate(()=>{const h=document.querySelector("[data-editor-header]")||document.querySelector("main header"); return h?h.innerText.replace(/\n+/g," / "):"none"}));
      console.log("BTN:", await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>(b.getAttribute("aria-label")||b.textContent||"").trim().slice(0,30)).filter(Boolean).join(" | ")));
      await axe(page,k);
    }
    const sw = await page.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw>0) console.log("HSCROLL",k,vp,sw);
  }
  console.log(vp,"errs",errs);
  await browser.close();
}
