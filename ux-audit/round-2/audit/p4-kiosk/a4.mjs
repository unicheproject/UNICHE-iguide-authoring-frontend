import { open, go, P, seed, shot, settle } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/preview`); await settle(page, 3000);
await page.getByRole("tab", { name: "Mobile", exact: true }).click(); await page.waitForTimeout(500);
const sel = page.locator("#fire-trigger");
const o = sel.locator("optgroup[label^='Bluetooth'] option").first(); console.log("beacon opt", await o.textContent());
await sel.selectOption(await o.getAttribute("value"));
await page.getByRole("button", { name: "Fire", exact: true }).click(); await page.waitForTimeout(900);
console.log("chip", await page.getByText(/^Fired:/).first().textContent().catch(()=>"NO CHIP"));
await shot(page, "preview__mobile-fired-beacon__1440");
await page.getByRole("tab", { name: "Web", exact: true }).click(); await page.waitForTimeout(500);
console.log("web groups", await sel.locator("optgroup").evaluateAll(g=>g.map(x=>x.label)), "chip after surface change", await page.getByText(/^Fired:/).count());
console.log("live announce:", await page.locator("[aria-live]").allTextContents());
// poi editor preview-in-app panel
await go(page, `/projects/${P}/pois/${seed.pois[0].id}`); await settle(page, 2500);
const btn = page.getByRole("button", { name: /Preview in app/ }); console.log("pia btn", await btn.count());
await btn.first().scrollIntoViewIfNeeded(); await btn.first().click(); await page.waitForTimeout(1500);
await shot(page, "poi-preview-panel__web__1440");
const region = page.locator('[role=region][aria-label^=Preview]').first();
for (const s of ["Web", "Mobile", "Kiosk"]) {
  const t = page.getByRole("tab", { name: s, exact: true }).first(); await t.click().catch(()=>console.log("no tab", s)); await page.waitForTimeout(700);
  console.log(s, await page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const r=f?.getBoundingClientRect(); return { scale: f?.getAttribute("data-scale"), w: r&&Math.round(r.width), h: r&&Math.round(r.height) }; }), "| panel text:", (await page.locator("[data-preview-frame]").locator("xpath=ancestor::*[@role='region'][1]").innerText().catch(()=>"")).slice(0,200).replace(/\n/g," | "));
  await region.scrollIntoViewIfNeeded().catch(()=>{}); await shot(page, `poi-preview-panel__${s.toLowerCase()}__1440`, false);
}
console.log("panel buttons", await page.getByRole("button", { name: /real size|Expand|Close preview/ }).allTextContents());
// new tab from panel
const [np] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: /Open at real size/ }).click()]);
await np.waitForLoadState("networkidle").catch(()=>{}); await np.waitForTimeout(2000);
console.log("panel newtab:", np.url(), await np.title());
await np.close();
// Esc
await page.getByRole("tab", { name: "Web", exact: true }).first().focus(); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("after Esc panel still", await page.locator("[data-preview-frame]").count());
console.log("focus on", await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0,40)));
await browser.close();
