import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
for (const vp of ["1280","1024","768","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${P}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
  await shot(page,`pois-list__default__${vp}`);
  const l=await page.evaluate(()=>({tb:Math.round(document.querySelector("[role=search]")?.getBoundingClientRect().height), firstRowTop:Math.round(document.querySelector("tbody tr, .list-card")?.getBoundingClientRect().top), sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, cards:document.querySelectorAll(".list-card").length}));
  console.log(vp,"list",JSON.stringify(l));
  await go(page, `/projects/${P}/pois/${ID}`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
  await page.getByLabel("Summary").fill("viewport check dirty"); await settle(page,300);
  await shot(page,`poi-editor__active-dirty__${vp}`);
  const e=await page.evaluate(()=>{const hdr=[...document.querySelectorAll("header,[class*=sticky]")].map(e=>({c:e.className.toString().slice(0,25),h:Math.round(e.getBoundingClientRect().height),t:Math.round(e.getBoundingClientRect().top)})); const aside=document.querySelector("aside").getBoundingClientRect(); const form=document.querySelector("#f-summary").getBoundingClientRect(); return {hdr:hdr.slice(0,5),asideTop:Math.round(aside.top),asideLeft:Math.round(aside.left),formW:Math.round(form.width),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
  console.log(vp,"editor",JSON.stringify(e));
  // discard unsaved: reload leaves guard? navigate away
  await browser.close();
}
