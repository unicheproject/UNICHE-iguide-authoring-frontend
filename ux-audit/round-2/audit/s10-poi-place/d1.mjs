import { readFileSync } from "node:fs";
import { open, go, rec, P, ready, SH, tall, axe } from "./h.mjs";
const p4 = JSON.parse(readFileSync(new URL("../../../round-1/implementation/P4/records.json", import.meta.url)));
const log=(...a)=>console.log(...a);
const targets = {"mine-indoor":rec.place,"outdoor":p4.outdoor,"sub":p4.sub};
for (const vp of ["1440","1024"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  const errs=[]; page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,150))});
  for (const [k,id] of Object.entries(targets)) {
    await go(page, `/projects/${P}/places/${id}`); await ready(page,2500);
    const h = vp==="1440" ? await tall(page,`place-editor__${k}-tall__${vp}`) : (await page.screenshot({path:SH+`place-editor__${k}__${vp}.png`}), await page.evaluate(()=>document.querySelector("main").scrollHeight));
    log(vp,k,"height",h,"| h2:",await page.locator("main h2").allInnerTexts().then(a=>a.map(x=>x.replace(/\n/g," ")).join(" ; ")));
    if(vp==="1440") await axe(page,"place "+k);
  }
  log(errs); await browser.close();
}
