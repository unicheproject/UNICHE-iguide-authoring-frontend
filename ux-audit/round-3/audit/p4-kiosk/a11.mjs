import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log} from "./lib.mjs"; import {coarse,small} from "./tlib.mjs";
for (const vp of ["1024","768"]) { const { browser, page } = await open("admin",{viewport:vp,touch:true}); await coarse(page);
 await go(page,`/projects/${P}/app-preview?surface=WEB&lang=en&mode=WORKING`); await page.waitForTimeout(3000);
 const r=await small(page,"body"); log(vp,"app-preview",r.total,JSON.stringify(r.small.slice(0,8))); await page.screenshot({path:shotp(`newtab__web-touch__${vp}`)});
 const rows=await page.evaluate(()=>[...document.querySelectorAll("select,input[type=checkbox],label")].slice(0,6).map(e=>{const b=e.getBoundingClientRect();return e.tagName+":"+Math.round(b.width)+"x"+Math.round(b.height)}));log(rows);
 await browser.close(); }
