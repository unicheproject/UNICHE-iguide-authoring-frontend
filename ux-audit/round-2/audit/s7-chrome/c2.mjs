import { open, go, shot, axe, t, run, CMS, POP, AP, focusDesc } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1024","768","zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/places`); await page.waitForTimeout(2500);
    const hb = await page.locator("header").evaluate(h=>({h:h.getBoundingClientRect().height, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}));
    console.log(vp, "header", JSON.stringify(hb));
    await page.locator("#nav-toggle").click(); await page.waitForTimeout(500); await shot(page, "chrome__drawer-open", vp);
    console.log(vp, "drawer focus", await focusDesc(page), "| aria-modal", await page.locator("#workspace-nav").getAttribute("aria-modal"), "| toggle expanded", await page.locator("#nav-toggle").getAttribute("aria-expanded"));
    if (vp==="768") { await axe(page,"drawer-open");
      const seq=[]; for(let i=0;i<32;i++){ await page.keyboard.press("Tab"); seq.push(await page.evaluate(()=>{const e=document.activeElement; return (e.closest("#workspace-nav")?"nav":e.tagName)+":"+(e.textContent||"").trim().slice(0,12)})); } console.log("tab sequence:", seq.join(" | "));
      for (let i=0;i<3;i++) { await page.keyboard.press("ArrowDown"); } console.log("arrow focus", await focusDesc(page));
    }
    await page.keyboard.press("Escape"); await page.waitForTimeout(400); console.log(vp, "after Esc focus", await focusDesc(page), "drawer visible", await page.locator("#workspace-nav").isVisible());
    // select an item: navigates & closes
    await page.locator("#nav-toggle").click(); await page.waitForTimeout(300);
    await page.locator("#workspace-nav").getByRole("link", { name: "Routes" }).click(); await page.waitForTimeout(1500);
    console.log(vp, "after link: visible", await page.locator("#workspace-nav").isVisible(), "focus", await focusDesc(page), "title", await page.title());
    await browser.close();
  }
});
