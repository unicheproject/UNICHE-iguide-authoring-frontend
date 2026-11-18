import { open, go, shot, POP, t, focusDesc, run, AxeBuilder } from "./lib.mjs";
await run(async () => {
  // forced colors
  let { browser, page } = await open("curator", { viewport: "1280", forcedColors: "active" });
  await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1200);
  await shot(page,"preview__forced-colors","1280");
  const sel = await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(e=>{const c=getComputedStyle(e);return e.textContent.trim()+":"+e.getAttribute("aria-selected")+" color="+c.color+" bb="+c.borderBottomWidth+"/"+c.borderBottomColor+" bg="+c.backgroundColor+" outline="+c.outlineStyle+" td="+c.textDecorationLine+" fw="+c.fontWeight}));
  console.log(sel.join("\n"));
  await page.getByRole("tab",{name:"Mobile",exact:true}).focus(); await shot(page,"preview__forced-colors-focus","1280");
  await browser.close();
  // arrow keys + axe in normal
  ({ browser, page } = await open("curator", { viewport: "1280" }));
  await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1200);
  await page.getByRole("tab",{name:"Web",exact:true}).focus();
  await page.keyboard.press("ArrowRight"); console.log("arrow ->", await focusDesc(page), "selected:", await page.locator("[role=tab][aria-selected=true]").evaluateAll(e=>e.map(x=>x.textContent.trim())));
  await page.keyboard.press("End"); console.log("End ->", await focusDesc(page));
  console.log("tablist labels", await page.locator("[role=tablist]").evaluateAll(e=>e.map(x=>x.getAttribute("aria-label")||x.getAttribute("aria-labelledby"))));
  console.log("tabpanels", await page.locator("[role=tabpanel]").count(), "aria-controls", await page.locator("[role=tab]").first().getAttribute("aria-controls"));
  await page.screenshot({path:"x.png"}).catch(()=>{});
  const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","best-practice"]).analyze();
  console.log("AXE", r.violations.map(v=>v.id+"("+v.impact+") x"+v.nodes.length+" "+v.nodes[0].target.join(" ")).join("\n") || "clean");
  // announce on change?
  console.log("status live", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,80))));
  // touch target sizes
  console.log("target sizes", await page.evaluate(()=>[...document.querySelectorAll("[role=tab],select,button")].filter(e=>!e.closest("[data-preview-frame]")&&!e.closest("aside,nav,header")).map(e=>{const r=e.getBoundingClientRect();return (e.textContent.trim().slice(0,14)||e.id)+":"+Math.round(r.width)+"x"+Math.round(r.height)})));
  await browser.close();
});
