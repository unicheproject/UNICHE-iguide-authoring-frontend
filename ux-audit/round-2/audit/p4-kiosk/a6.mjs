import { open, go, P, seed, shot, settle, targets, report } from "./lib.mjs";
for (const vp of ["1024","768"]) {
const { browser, page } = await open("curator", { viewport: vp, touch: true });
await go(page, `/projects/${P}/pois/${seed.pois[0].id}`); await settle(page, 2500);
console.log(vp, "layout", await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, h:document.documentElement.scrollHeight})));
await shot(page, `poi-editor__top__${vp}`, false);
report(`poi editor ${vp}`, await targets(page));
await page.getByRole("button", { name: /Preview in app/ }).first().tap(); await page.waitForTimeout(1500);
console.log(vp, "panel btns", await page.getByRole("button", { name: /real size|Expand|Collapse|Close preview/ }).allTextContents());
console.log(vp, "frame", await page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const r=f?.getBoundingClientRect(); return { scale:f?.getAttribute("data-scale"), w:r&&Math.round(r.width), h:r&&Math.round(r.height) }; }));
await shot(page, `poi-preview-panel__web__${vp}`, false);
for (const s of ["Kiosk"]) { await page.getByRole("tab", { name: s, exact: true }).first().tap(); await page.waitForTimeout(800);
  console.log(vp, s, await page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const r=f?.getBoundingClientRect(); return { scale:f?.getAttribute("data-scale"), w:r&&Math.round(r.width), h:r&&Math.round(r.height) }; }));
  await shot(page, `poi-preview-panel__kiosk__${vp}`, false); }
await browser.close(); }
