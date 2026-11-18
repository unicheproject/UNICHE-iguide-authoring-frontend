import { start, go, P, seed, axe, focusInfo } from "./common.mjs";
const poi = seed.pois[0]; const out = {};
for (const vp of ["1440","1280","1024","768"]) {
  const s = await start(vp); const page = s.page;
  await go(page, `${P}/pois/${poi.id}`); await page.waitForTimeout(2500);
  const btn = page.getByRole("button",{name:"Preview in app"});
  await s.shot("editor__before-preview");
  const r = {}; r.btnBox = await btn.boundingBox();
  await btn.click(); await page.waitForTimeout(600);
  const dlg = page.getByRole("dialog");
  r.dlg = await dlg.boundingBox(); r.viewport = page.viewportSize();
  r.focus = await focusInfo(page);
  await s.shot("editor__preview-open-mobile");
  r.cardCoversEditorPct = r.dlg ? Math.round(100*r.dlg.width*r.dlg.height/(r.viewport.width*r.viewport.height)) : null;
  // Escape with focus on tab
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  r.escFromTab = await dlg.count()===0 ? "closed" : "STILL OPEN";
  r.focusAfterEsc = (await focusInfo(page)).name;
  // Esc with focus inside frame (tabpanel and a button inside)
  await btn.click(); await page.waitForTimeout(400);
  await page.getByRole("tab",{name:/web/i}).click(); await page.waitForTimeout(300);
  await s.shot("editor__preview-open-web");
  await page.getByRole("tab",{name:/kiosk/i}).click(); await page.waitForTimeout(300);
  await s.shot("editor__preview-open-kiosk");
  r.kioskDlg = await dlg.boundingBox();
  await page.locator("[data-preview-frame]").focus(); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  r.escFromPanel = await dlg.count()===0 ? "closed" : "STILL OPEN";
  if (await dlg.count()) { // focus a thing inside the content, if any link/button
    const inner = page.locator("[data-preview-frame]").locator("a,button,[tabindex]").first();
    r.innerFocusables = await page.locator("[data-preview-frame]").locator("a,button,input,[tabindex]").count();
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  }
  // click on text inside card then Esc
  await btn.click(); await page.waitForTimeout(400);
  await page.locator("[data-preview-frame]").click({position:{x:40,y:80}}); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  r.escAfterClickInside = await dlg.count()===0 ? "closed" : "STILL OPEN";
  if (await dlg.count()) await page.getByRole("button",{name:"Close preview"}).click();
  // tab walk inside
  await btn.click(); await page.waitForTimeout(400);
  const walk=[]; for(let i=0;i<8;i++){ await page.keyboard.press("Tab"); const f=await focusInfo(page); walk.push(`${f.tag}/${f.role} "${f.name}" ${f.dialog?"[dlg]":"[OUTSIDE]"}`);} r.walk=walk;
  await page.keyboard.press("Escape");
  // background operable? try clicking an editor control under backdrop
  await btn.click(); await page.waitForTimeout(400);
  r.statusBannerVisible = await page.getByRole("button",{name:/save draft/i}).count();
  r.axe = await axe(page,"editor-preview-open");
  r.headingsInCard = await page.evaluate(()=>[...document.querySelectorAll("[role=dialog] h1,[role=dialog] h2")].map(h=>h.tagName+":"+h.textContent.trim().slice(0,30)));
  r.h1Total = await page.evaluate(()=>document.querySelectorAll("h1").length);
  await page.keyboard.press("Escape");
  out[vp]=r; console.log(vp, JSON.stringify(r)); await s.browser.close();
}
import("node:fs").then(f=>f.writeFileSync("ux-audit/round-1/audit/s14-preview/out/c1.json",JSON.stringify(out,null,1)));
