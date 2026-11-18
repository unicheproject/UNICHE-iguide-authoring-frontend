import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
for (const mode of [{reducedMotion:"no-preference"},{reducedMotion:"reduce"}]) {
const { browser, page } = await open("admin", { viewport: "1440", ...mode });
await go(page, R.pois); await page.waitForSelector("h1"); await page.waitForTimeout(2000);
const r = await page.evaluate(async ()=>{
  document.querySelector("#tab-el").click();
  await new Promise(r=>setTimeout(r,30));
  const anims=document.getAnimations().map(a=>`${a.constructor.name} ${a.transitionProperty||a.animationName||""} ${Math.round(a.effect.getComputedTiming().duration)}ms on ${a.effect.target?.tagName}.${(a.effect.target?.className||"").toString().slice(0,30)}`);
  const tr=getComputedStyle(document.querySelector("#tab-el")).transitionDuration;
  return {anims,tr};
});
console.log(mode.reducedMotion, JSON.stringify(r));
await browser.close();
}
// forced colors
const { browser, page } = await open("admin", { viewport: "1440", forcedColors:"active" });
await go(page, R.pois+"?lang=el"); await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await shot(page,"poi-editor__el-tab-forced-colors__1440");
await go(page, base+"/pois?lang=it&missing=it"); await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await shot(page,"pois-list__italian-worklist-forced-colors__1440");
await browser.close();
