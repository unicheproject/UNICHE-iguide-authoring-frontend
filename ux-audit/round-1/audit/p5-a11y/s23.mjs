import { start, go, P, focusInfo, tabWalk, tabTo, live, axe } from "./common.mjs";
const POI = "/pois/22ba8181-7028-4c14-9cb2-ee091893190b";
// 1) input border contrast
{ const s = await start("1440"); const { page } = s;
  await go(page, P + POI); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2000);
  const b = await page.evaluate(()=>{const f=(e)=>e?{bc:getComputedStyle(e).borderTopColor,bw:getComputedStyle(e).borderTopWidth,bg:getComputedStyle(e).backgroundColor}:null; const t=[...document.querySelectorAll("input")].find(i=>i.labels?.[0]?.textContent.trim()==="Title"); const cb=document.querySelector("input[type=checkbox]"); const sel=document.querySelector("select"); return {title:f(t), select:f(sel), checkbox:f(cb), ph: getComputedStyle(document.querySelector("input[placeholder]")||t,"::placeholder").color}});
  console.log("borders", JSON.stringify(b));
  await page.getByRole("tab",{name:/Ελληνικά/}).focus(); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(400);
  console.log("tab arrow -> focus", JSON.stringify(await focusInfo(page)), await page.getByRole("tab",{selected:true}).textContent());
  await page.keyboard.press("Enter"); await page.waitForTimeout(400);
  console.log("tab Enter -> selected", await page.getByRole("tab",{selected:true}).textContent(), JSON.stringify(await live(page)));
  const tabs = await page.getByRole("tab").evaluateAll(t=>t.map(x=>x.tabIndex+":"+x.getAttribute("aria-selected")+":"+(x.getAttribute("aria-controls")||"")));
  console.log("tabs tabindex", tabs);
  await s.browser.close(); }
// 2) reduced motion
{ const s = await start("1440", { reducedMotion: "reduce" }); const { page } = s;
  await go(page, P + "/pois"); await page.waitForTimeout(2500);
  console.log("reduced-motion anims on list", await page.evaluate(()=>document.getAnimations().map(a=>a.constructor.name+":"+(a.effect?.target?.className||"").toString().slice(0,40)+":"+a.playState).slice(0,8)));
  await page.getByRole("button",{name:"New point of interest"}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
  console.log("dialog anims", await page.evaluate(()=>document.getAnimations().map(a=>(a.transitionProperty||a.animationName||"anim")+":"+a.effect?.getComputedTiming().duration).slice(0,8)));
  await page.keyboard.press("Escape");
  await go(page, P); await page.waitForTimeout(500);
  console.log("dashboard anims (skeleton pulse etc)", await page.evaluate(()=>document.getAnimations().map(a=>(a.animationName||a.transitionProperty)+":"+a.effect?.getComputedTiming().duration+":"+a.effect?.getComputedTiming().iterations).slice(0,8)));
  await s.browser.close(); }
{ const s = await start("1440"); const { page } = s;
  await go(page, P); await page.waitForTimeout(300);
  console.log("NORMAL motion anims", await page.evaluate(()=>document.getAnimations().map(a=>(a.animationName||a.transitionProperty)+":"+a.effect?.getComputedTiming().duration+":"+a.effect?.getComputedTiming().iterations).slice(0,8)));
  await s.browser.close(); }
