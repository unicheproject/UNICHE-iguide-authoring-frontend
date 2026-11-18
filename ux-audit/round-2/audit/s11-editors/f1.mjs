import { open, go, rec, P, ready, tall } from "./h.mjs";
const kinds = { route:`routes/${rec.route}`, guide:`guides/${rec.guide}`, event:`events/${rec.event}`, category:`categories/${rec.category}` };
for (const vp of ["1280","1024","768","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  for (const [k,p] of Object.entries(kinds)) {
    await go(page, `/projects/${P}/${p}`); await ready(page,1500);
    const m = await page.evaluate(()=>{
      const sticky=[...document.querySelectorAll("*")].filter(e=>getComputedStyle(e).position==="sticky"&&e.getBoundingClientRect().top<200&&e.getBoundingClientRect().height>20).map(e=>Math.round(e.getBoundingClientRect().height)+"@"+Math.round(e.getBoundingClientRect().top));
      const main=document.querySelector("main"); 
      const over=[...document.querySelectorAll("main *")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>window.innerWidth+1}).length;
      const small=[...document.querySelectorAll("main button,main a,main input,main select,main textarea,main [role=radio],main label")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<24||r.width<24)}).length;
      return {sticky, vh:innerHeight, over, small, nav:!!document.querySelector("nav")?.getBoundingClientRect().width};
    });
    console.log(vp,k,JSON.stringify(m));
    await page.screenshot({path:`ux-audit/round-2/audit/s11-editors/shots/${k}-editor__loaded__${vp}.png`});
    if (vp==="768"||vp==="zoom200") await tall(page,`${k}-editor__loaded-tall__${vp}`);
  }
  await browser.close();
}
