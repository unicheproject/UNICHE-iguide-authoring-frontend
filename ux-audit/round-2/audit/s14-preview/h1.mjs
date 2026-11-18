import { open, go, shot, POP, t, focusDesc, run } from "./lib.mjs";
const POI="546c5177-effd-49c8-acae-85d751f89bbe", TR="0e570ab5-c25a-456f-8c1c-02e3b1a41cd7";
await run(async () => {
  for (const vp of ["1440","1024","768"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    await go(page, `/projects/${POP}/pois/${POI}`); await page.waitForTimeout(1800);
    await page.getByRole("button",{name:/Preview in app/}).first().click(); await page.waitForTimeout(1000);
    const ex = page.getByRole("button",{name:/^Expand/});
    console.log(vp,"Expand count",await ex.count(), "visible", await ex.first().isVisible().catch(()=>false));
    if (await ex.first().isVisible().catch(()=>false)) {
      await ex.first().click(); await page.waitForTimeout(1000);
      const i = await page.evaluate(()=>{const f=document.querySelector("[data-preview-frame]");const hd=document.querySelector("h1").getBoundingClientRect();const tl=document.querySelector("[role=tablist]");return {scale:f.dataset.scale,fw:Math.round(f.getBoundingClientRect().width),h1top:Math.round(hd.top),h1bottom:Math.round(hd.bottom),scrollY, tabsPos:tl?getComputedStyle(tl.closest("[class*=sticky]")||tl).position:null}});
      console.log("  expanded",JSON.stringify(i),"focus",await focusDesc(page));
      await shot(page,"editor-preview__expanded",vp);
      await page.mouse.wheel(0,500); await page.waitForTimeout(500); await shot(page,"editor-preview__expanded-scrolled",vp);
      // covering check: elementFromPoint at header buttons
      console.log("  header covered?", await page.evaluate(()=>{const b=[...document.querySelectorAll("button")].filter(e=>/Apply changes|Save draft/.test(e.textContent));return b.map(e=>{const r=e.getBoundingClientRect();const el=document.elementFromPoint(r.x+r.width/2,Math.max(1,r.y+r.height/2));return e.textContent.trim().slice(0,14)+":top="+Math.round(r.top)+" hit="+(e.contains(el)||el?.contains(e)?"self":(el?.tagName+"."+(el?.getAttribute("aria-label")||el?.textContent.trim().slice(0,20))))})}));
      await page.keyboard.press("Escape"); await page.waitForTimeout(500);
      console.log("  Esc from expanded -> region", await page.locator("section[role=region][aria-label^=Preview]").count(), await focusDesc(page));
    }
    await browser.close();
  }
  // Test in preview
  const { browser, page } = await open("admin", { viewport: "1280" });
  await go(page, `/projects/${POP}/pois/${POI}`); await page.waitForTimeout(1800);
  const link = page.getByRole("link",{name:/Test in preview/}).first();
  console.log("test link count", await page.getByRole("link",{name:/Test in preview/}).count(), await link.getAttribute("href"));
  await link.click(); await page.waitForTimeout(2000);
  console.log("url", page.url().replace(/.*\/preview/,"/preview"));
  const txt = (await t(page,"main")).split("\n").filter(l=>/Fired|Opened|trigger/i.test(l)).join(" | ");
  console.log("after test:", txt, "| select:", await page.inputValue("#fire-trigger").catch(()=>"n/a"));
  await shot(page,"preview__from-test-in-preview","1280");
  console.log("title", await page.title(), "| back works?"); await page.goBack(); await page.waitForTimeout(1500); console.log(page.url().replace(/.*5173/,""));
  await browser.close();
});
