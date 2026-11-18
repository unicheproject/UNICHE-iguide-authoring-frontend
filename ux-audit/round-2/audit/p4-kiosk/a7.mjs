import { open, go, P, seed, shot, settle, targets, report } from "./lib.mjs";
for (const vp of ["1024","768"]) {
const { browser, page } = await open("curator", { viewport: vp, touch: true });
const errs=[]; page.on("pageerror", e=>errs.push(e.message));
await go(page, `/projects/${P}/pois`); await settle(page, 2500);
console.log(vp, "scroll", await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth})));
await shot(page, `pois-list__top__${vp}`, false);
report(`pois list ${vp}`, await targets(page));
// drawer
const menu = page.getByRole("button", { name: /menu/i }).first();
console.log(vp, "menu btn", await menu.count(), JSON.stringify(await menu.boundingBox()));
await menu.tap(); await page.waitForTimeout(700);
await shot(page, `nav-drawer__open__${vp}`, false);
report(`drawer ${vp}`, await targets(page));
console.log(vp, "drawer dialog?", await page.evaluate(()=>({dlg:!!document.querySelector("[role=dialog]"), focus:document.activeElement?.tagName+":"+(document.activeElement?.textContent||"").trim().slice(0,20), bodyInert: !!document.querySelector("main[inert],#app > [inert]")})));
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log(vp, "after esc dialog?", await page.evaluate(()=>({dlg:!!document.querySelector("[role=dialog]"), focus:(document.activeElement?.getAttribute("aria-label")||document.activeElement?.textContent||"").trim().slice(0,20)})));
await menu.tap(); await page.waitForTimeout(500);
await page.getByRole("link", { name: "Routes" }).tap(); await page.waitForTimeout(1500);
console.log(vp, "after nav tap url", page.url().split("/").pop(), "drawer closed?", !(await page.evaluate(()=>!!document.querySelector("[role=dialog]"))));
// swipe/backdrop close test
await menu.tap(); await page.waitForTimeout(500);
await page.touchscreen.tap(vp==="1024"?950:740, 600); await page.waitForTimeout(500);
console.log(vp, "tap backdrop closes?", !(await page.evaluate(()=>!!document.querySelector("[role=dialog]"))));
// card view rows
await go(page, `/projects/${P}/pois`); await settle(page, 2000);
const row = page.getByRole("button", { name: /actions|more/i }).first();
console.log(vp, "row menu btn", await row.count(), JSON.stringify(await row.boundingBox()));
await row.tap(); await page.waitForTimeout(600);
await shot(page, `pois-list__row-menu__${vp}`, false);
console.log(vp, "menu items", await page.getByRole("menuitem").evaluateAll(m=>m.map(x=>{const r=x.getBoundingClientRect(); return x.textContent.trim()+" "+Math.round(r.width)+"x"+Math.round(r.height)})));
await page.keyboard.press("Escape");
await shot(page, `pois-list__full__${vp}`, true);
console.log(vp, "errs", errs);
await browser.close(); }
