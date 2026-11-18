import { open, go, shot, text, axe, settle, rect, problem, P, CMS } from "./lib.mjs";
const fr = (page)=>page.evaluate(()=>{const e=document.activeElement;return e?e.tagName+" "+(e.getAttribute("aria-label")||e.innerText||"").trim().slice(0,40):null});
for (const vp of ["1440","768"]) {
  const { browser, context, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois`); await settle(page, 2500);
  const before = { newBtn: await rect(page, "main >> text=/^New/"), main: await rect(page,"main") };
  const h0 = await page.evaluate(()=>document.querySelector("h1").getBoundingClientRect().y);
  await shot(page, `offline__poilist-before__${vp}`);
  await context.setOffline(true);
  // trigger failing requests
  await page.evaluate(()=>window.dispatchEvent(new Event("offline")));
  await settle(page, 1500);
  const ban = await rect(page, "[role=alert]");
  const h1 = await page.evaluate(()=>document.querySelector("h1").getBoundingClientRect().y);
  const info = await page.evaluate(()=>{ const bs=[...document.querySelectorAll("main button, main a")]; const nb = bs.find(b=>/^\s*New/.test(b.innerText)); const r=nb?.getBoundingClientRect(); return { newR: r&&{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, ariaDisabled: nb?.getAttribute("aria-disabled"), disabled: nb?.disabled, desc: nb?.getAttribute("aria-describedby") && document.getElementById(nb.getAttribute("aria-describedby"))?.innerText, title: nb?.title }; });
  console.log(vp, "banner", ban, "newBefore", before.newBtn, "new offline", info, "h1 y", h0, "->", h1);
  console.log("alerts", await page.locator("[role=alert]").count(), JSON.stringify((await page.locator("[role=alert]").allInnerTexts())));
  const bR = ban, nR = info.newR; console.log("overlap banner/new:", bR && nR && !(nR.y>=bR.y+bR.h || nR.y+nR.h<=bR.y));
  await shot(page, `offline__poilist__${vp}`);
  // click disabled New
  await page.locator("main >> text=/^New/").first().click({force:true}).catch(()=>{}); await settle(page, 600);
  console.log("after click New offline: dialogs", await page.getByRole("dialog").count(), "focus", await fr(page));
  console.log("axe", await axe(page));
  // editor offline
  await context.setOffline(false); await page.evaluate(()=>window.dispatchEvent(new Event("online"))); await settle(page, 1500);
  console.log("banner after online", await page.locator("[role=alert]").count());
  await browser.close();
}
