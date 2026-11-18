import { open, go, shot, POP, t, focusDesc, run, AxeBuilder } from "./lib.mjs";
const POI="546c5177-effd-49c8-acae-85d751f89bbe";
await run(async () => {
  for (const vp of ["1440","1280","1024","768"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    await go(page, `/projects/${POP}/pois/${POI}`); await page.waitForTimeout(1800);
    const btn = page.getByRole("button",{name:/Preview in app/}).first();
    const y0 = await btn.evaluate(e=>Math.round(e.getBoundingClientRect().top+scrollY));
    await btn.click(); await page.waitForTimeout(1200);
    const info = await page.evaluate(()=>{const f=document.querySelector("[data-preview-frame]");const r=f?.getBoundingClientRect();const sec=document.querySelector("section[role=region][aria-label^=Preview]");return {scale:f?.dataset.scale,w:Math.round(r?.width),h:Math.round(r?.height),top:Math.round(r?.top+scrollY),label:sec?.getAttribute("aria-label"),dialog:!!document.querySelector("[role=dialog]"),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
    console.log(vp,"opener y",y0,JSON.stringify(info),"focus",await focusDesc(page));
    await shot(page,"editor-preview__open",vp);
    const names = await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(e=>e.textContent.trim()+":"+e.getAttribute("aria-selected")));
    console.log("  tabs",names.join(","));
    for (const s of ["Web","Mobile","Kiosk"]) { const tb=page.getByRole("tab",{name:new RegExp("^"+s)}).last(); if(await tb.count()){ await tb.click(); await page.waitForTimeout(500); console.log("  ",s,await page.evaluate(()=>document.querySelector("[data-preview-frame]")?.dataset.scale), await page.locator("section[role=region][aria-label^=Preview] p").first().innerText().catch(()=>"?")); if(vp==="1024"||vp==="768") await shot(page,`editor-preview__${s.toLowerCase()}`,vp);} }
    // Esc
    await page.keyboard.press("Escape"); await page.waitForTimeout(500);
    console.log("  after Esc (focus in tab?) region present:", await page.locator("section[role=region][aria-label^=Preview]").count(), await focusDesc(page));
    if (await page.locator("section[role=region][aria-label^=Preview]").count()) { await page.getByRole("button",{name:/^Close/}).first().click(); await page.waitForTimeout(500); console.log("  after Close focus:", await focusDesc(page)); }
    if (vp==="1280") {
      await btn.click(); await page.waitForTimeout(800);
      console.log("  Expand btn:", await page.getByRole("button",{name:/Expand|full width|Open at real size/i}).allInnerTexts());
      console.log("  headings in page:", await page.evaluate(()=>[...document.querySelectorAll("h1,h2")].map(h=>h.tagName+":"+h.textContent.trim().slice(0,30))));
      const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log("  AXE", r.violations.map(v=>v.id+" x"+v.nodes.length).join(",")||"clean");
    }
    await browser.close();
  }
});
