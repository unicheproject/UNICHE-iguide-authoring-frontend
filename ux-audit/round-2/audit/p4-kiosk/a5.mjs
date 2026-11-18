import { open, go, P, seed, shot, settle } from "./lib.mjs";
for (const vp of ["1440","1024"]) {
const { browser, page } = await open("curator", { viewport: vp, touch: vp==="1024" });
await go(page, `/projects/${P}/pois/${seed.pois[0].id}`); await settle(page, 2500);
const tap = (l) => vp==="1024" ? l.tap() : l.click();
await tap(page.getByRole("button", { name: /Preview in app/ }).first()); await page.waitForTimeout(1200);
await tap(page.getByRole("button", { name: "Expand" })); await page.waitForTimeout(1500);
console.log(vp, "after expand", await page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const r=f?.getBoundingClientRect(); return { scale:f?.getAttribute("data-scale"), w:r&&Math.round(r.width), h:r&&Math.round(r.height), top: r&&Math.round(r.top), dialog: !!document.querySelector("[role=dialog]"), btns:[...document.querySelectorAll("button")].map(b=>b.textContent.trim()).filter(t=>/Expand|Collapse|Close|real/.test(t)) }; }));
await shot(page, `poi-preview-expanded-web__${vp}`, false);
for (const s of ["Mobile","Kiosk"]) { await tap(page.getByRole("tab", { name: s, exact: true }).first()); await page.waitForTimeout(800);
  console.log(vp, s, await page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const r=f?.getBoundingClientRect(); return { scale:f?.getAttribute("data-scale"), w:r&&Math.round(r.width), h:r&&Math.round(r.height) }; }));
  await shot(page, `poi-preview-expanded-${s.toLowerCase()}__${vp}`, false); }
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log(vp, "esc ->", await page.evaluate(() => ({ frame: !!document.querySelector("[data-preview-frame]"), focus: document.activeElement?.textContent?.trim().slice(0,30) })));
await browser.close(); }
