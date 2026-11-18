import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const style = (sel) => page.locator(sel).first().evaluate(e=>{const c=getComputedStyle(e);return `outline ${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} off ${c.outlineOffset} | shadow ${c.boxShadow} | bg ${c.backgroundColor} | color ${c.color} | tr ${c.transitionDuration} ${c.transitionProperty.slice(0,40)}`});
try {
  await go(page, path("poiB")); await settle(page,2000);
  await page.locator("#f-summary").click(); await page.keyboard.type(" y"); await settle(page,300);
  // tab to Save draft via keyboard from the title
  await page.locator("#f-title").focus();
  // focus-visible styles via keyboard: shift-tab backwards to header buttons
  const names=[];
  for (let i=0;i<12;i++){ await page.keyboard.press("Shift+Tab"); const n=await page.evaluate(()=>{const a=document.activeElement;return (a.getAttribute("aria-label")||a.textContent||a.id).trim().slice(0,28)}); names.push(n); if(/Save draft$/.test(n)&&names.length>1) {} }
  console.log("shift-tab order from title:", names.join(" < "));
  // Focus header primary programmatically with keyboard modality
  await page.locator(".editor-header").getByRole("button",{name:/^Save draft$/}).focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  console.log("primary focus:", await page.evaluate(()=>{const a=document.activeElement;const c=getComputedStyle(a);return `${a.textContent.trim()} outline ${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} off ${c.outlineOffset} shadow ${c.boxShadow}`}));
  await shot(page,"poiB__focus-primary__1440");
  // pressed state
  const prim = page.locator(".editor-header").getByRole("button",{name:/^Save draft$/});
  const bb = await prim.boundingBox();
  const before = await prim.evaluate(e=>{const c=getComputedStyle(e);return c.backgroundColor+"|"+c.transform+"|"+c.boxShadow});
  await page.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2); await settle(page,300);
  const hover = await prim.evaluate(e=>{const c=getComputedStyle(e);return c.backgroundColor+"|"+c.transform+"|"+c.boxShadow});
  await page.mouse.down(); await settle(page,250);
  const down = await prim.evaluate(e=>{const c=getComputedStyle(e);return c.backgroundColor+"|"+c.transform+"|"+c.boxShadow});
  await shot(page,"poiB__primary-pressed__1440");
  await page.mouse.move(5,300); await page.mouse.up();
  console.log("primary idle/hover/active:", before, "//", hover, "//", down);
  const sec = page.locator(".editor-banner").getByRole("button",{name:/^Save draft$/}); const sb=await sec.boundingBox();
  const s0=await sec.evaluate(e=>getComputedStyle(e).backgroundColor); await page.mouse.move(sb.x+10,sb.y+10); await settle(page,300); const s1=await sec.evaluate(e=>getComputedStyle(e).backgroundColor); await page.mouse.down(); await settle(page,200); const s2=await sec.evaluate(e=>getComputedStyle(e).backgroundColor+"|"+getComputedStyle(e).transform); await page.mouse.move(5,300); await page.mouse.up();
  console.log("secondary idle/hover/active:", s0,s1,s2);
  // language tablist focus ring clipping
  await page.getByRole("tab",{name:/English/}).focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  const tl = await page.evaluate(()=>{const a=document.activeElement;const c=getComputedStyle(a);const tl=a.closest("[role=tablist]");const tr=tl.getBoundingClientRect(), ar=a.getBoundingClientRect();return `tab ${a.textContent.trim().slice(0,20)} outline ${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} off ${c.outlineOffset} shadow ${c.boxShadow} | tab rect y${Math.round(ar.y)} h${Math.round(ar.height)} x${Math.round(ar.x)} | tablist y${Math.round(tr.y)} h${Math.round(tr.height)} x${Math.round(tr.x)} w${Math.round(tr.width)} overflow ${getComputedStyle(tl).overflow}`});
  console.log(tl);
  await shot(page,"poiB__tab-focus__1440");
  await page.keyboard.press("ArrowRight"); console.log("arrow right selects:", await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,20)+" sel "+document.activeElement.getAttribute("aria-selected")));
  // reduced animations count
  console.log("animations:", await page.evaluate(()=>document.getAnimations().length));
} finally { await browser.close(); }
