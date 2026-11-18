import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log} from "./lib.mjs";
for (const vp of ["1440","1024","768"]) {
 const { browser, page } = await open("admin",{viewport:vp});
 await go(page,`/projects/${P}/pois/a12564e2-1d45-4441-b421-ef3497979ef6`); await page.waitForSelector("text=How visitors reach it"); await page.waitForTimeout(800);
 const q=()=>page.evaluate(()=>{const p=document.querySelector(".preview-panel");const b=p.getBoundingClientRect();const ex=[...document.querySelectorAll("button")].filter(b=>/Expand|Collapse/.test(b.textContent)&&b.offsetParent);const eb=ex[0]?.getBoundingClientRect();const cl=[...document.querySelectorAll("button")].filter(b=>/Close preview/.test(b.textContent)&&b.offsetParent)[0]?.getBoundingClientRect();return {panelY:Math.round(b.y),panelH:Math.round(b.height),sh:p.scrollHeight,ch:p.clientHeight,vh:innerHeight,expandY:eb&&Math.round(eb.y),closeY:cl&&Math.round(cl.y),mainTop:Math.round(document.querySelector("main").scrollTop)}});
 await page.getByRole("button",{name:/Preview in app/}).first().click(); await page.waitForTimeout(2000);
 log(vp,"open",await q());
 const ex=page.getByRole("button",{name:/Expand/}).filter({visible:true}).first(); await ex.click(); await page.waitForTimeout(900);
 log(vp,"expanded",await q()); await page.screenshot({path:shotp(`poi-preview-panel__expanded-after-click__${vp}`)});
 await page.getByRole("button",{name:/Collapse/}).filter({visible:true}).first().click(); await page.waitForTimeout(500); log(vp,"collapsed",await q());
 await browser.close();
}
