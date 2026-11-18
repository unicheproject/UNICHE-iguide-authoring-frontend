import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const A = "07927651-be7a-44e9-85eb-843d8ed219f7";
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois/${A}`);
  await page.waitForSelector("[data-sticky-bar]", { timeout: 40000 }); await page.waitForTimeout(1500);
  const opener = page.getByRole("button",{name:"Preview in app"}).first();
  await opener.click(); await page.waitForTimeout(1200);
  const res = {};
  for (const s of ["Web","Mobile","Kiosk"]) {
    await page.getByRole("tab",{name:s,exact:true}).click(); await page.waitForTimeout(600);
    res[s] = await page.evaluate(() => { const f=document.querySelector("#editor-preview [data-preview-frame]"); const p=document.getElementById("editor-preview").getBoundingClientRect(); return { scale: f.dataset.scale, panelW: Math.round(p.width), hscroll: document.documentElement.scrollWidth>innerWidth }; });
    if (s==="Kiosk") await page.screenshot({ path: `after/editor-kiosk-${vp}.png` });
    if (s==="Web") await page.screenshot({ path: `after/editor-web-${vp}.png` });
  }
  console.log(vp, JSON.stringify(res));
  if (vp==="1440") {
    await page.getByRole("button",{name:"Interact with the preview"}).click();
    await page.locator("#editor-preview [data-preview-frame] button, #editor-preview [data-preview-frame] [role=group]").first().focus().catch(()=>{});
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    console.log("esc1: panel open:", await page.locator("#editor-preview").count(), "focus:", await page.evaluate(()=>document.activeElement?.textContent.trim()));
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    console.log("esc2: panel open:", await page.locator("#editor-preview").count(), "focus:", await page.evaluate(()=>document.activeElement?.textContent.trim()));
    await opener.click(); await page.waitForTimeout(800);
    const exp = page.getByRole("button",{name:/Expand/}).first();
    if (await exp.count()) { await exp.click(); await page.waitForTimeout(600);
      const apply = page.getByRole("button",{name:/Apply changes/}).first();
      if (await apply.count()) { const b = await apply.boundingBox(); console.log("apply hit:", b && await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.closest("button")?.textContent.trim(), [b.x+b.width/2,b.y+b.height/2])); }
      await page.screenshot({ path: `after/editor-expanded-${vp}.png` }); }
  }
  await browser.close();
}
