import { open, go } from "../../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default;
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5", POI="1e3e76c9-d9c2-48eb-8419-e54b7143180c", PLACE="93abfa5d-4113-48d6-b718-1f58dd246b79";
const out="C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/implementation/P4/after/";
async function axe(page,tag){ const r=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log("axe",tag,r.violations.map(v=>v.impact+" "+v.id+" x"+v.nodes.length)); }
// keyboard run POI
{ const {browser,page}=await open("admin",{viewport:"1440"});
  await go(page,`/projects/${PID}/pois/${POI}`); await page.waitForSelector("[data-trigger-row]"); await page.waitForTimeout(800);
  await axe(page,"poi collapsed");
  // Tab from Save to end of Placement
  await page.locator("button:has-text(\"Save\")").first().focus();
  const seq=[]; for(let i=0;i<14;i++){ await page.keyboard.press("Tab"); seq.push(await page.evaluate(()=>{const a=document.activeElement;return (a.getAttribute("aria-label")||a.id||a.textContent||a.tagName).trim().slice(0,30)})); }
  console.log("tabs from Save",seq);
  // keyboard: Edit a row
  const edit=page.locator("[data-trigger-row] button[aria-controls]").first(); await edit.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(200);
  console.log("expanded",await edit.getAttribute("aria-expanded"), await page.evaluate(()=>document.activeElement.textContent.trim()));
  await axe(page,"poi one row open");
  await page.locator("#triggers").scrollIntoViewIfNeeded(); await page.screenshot({path:out+"poi-row-open__1440.png"});
  await browser.close(); }
for (const vp of ["1024","768","zoom200"]) { const {browser,page}=await open("admin",{viewport:vp});
  await go(page,`/projects/${PID}/pois/${POI}`); await page.waitForSelector("[data-trigger-row]"); await page.waitForTimeout(600);
  await page.getByRole("button",{name:/^Edit Geo/}).click(); await page.locator("#triggers").scrollIntoViewIfNeeded(); await page.screenshot({path:out+`poi-row-open__${vp}.png`});
  const m=await page.evaluate(()=>[...document.querySelectorAll("[data-trigger-row]")].map(r=>{const h=r.firstElementChild;return {h:Math.round(r.getBoundingClientRect().height),head:Math.round(h.getBoundingClientRect().height)}})); console.log(vp,JSON.stringify(m)); await browser.close(); }
{ const {browser,page}=await open("admin",{viewport:"1440",forcedColors:"active"});
  await go(page,`/projects/${PID}/pois/${POI}`); await page.waitForSelector("[data-trigger-row]"); await page.getByRole("button",{name:/^Edit Bluetooth/}).click(); await page.locator("#triggers").scrollIntoViewIfNeeded(); await page.screenshot({path:out+"poi-triggers__forced__1440.png"}); await browser.close(); }
{ const {browser,page}=await open("admin",{viewport:"1440"});
  await go(page,`/projects/${PID}/places/${PLACE}`); await page.waitForSelector("text=Place setup"); await page.waitForTimeout(800);
  await axe(page,"place");
  await page.locator("button:has-text(\"Save\")").first().focus();
  const seq=[]; for(let i=0;i<14;i++){ await page.keyboard.press("Tab"); seq.push(await page.evaluate(()=>{const a=document.activeElement;return (a.getAttribute("aria-label")||a.id||a.textContent||a.tagName).trim().slice(0,30)})); }
  console.log("place tabs from Save",seq);
  await browser.close(); }
