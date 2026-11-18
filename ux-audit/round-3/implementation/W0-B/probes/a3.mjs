import { session, go, P, ids, sleep } from "./h.mjs";
const { browser, page } = await session({ viewport: "1440" });
const count = (re) => page.locator("#editor-side-column").innerText().then((t) => (t.match(re) || []).length);
await go(page, P(`/routes/${ids.r2}`)); await page.waitForSelector("#status-card-heading"); await sleep(800);
console.log("Route 'no stops' lines:", await count(/no stops/g));
console.log("Route slug dd html:", await page.locator("#editor-side-column dd.mono").innerHTML().then((h) => h.replace(/<!--.*?-->/g, "").slice(0, 160)));
await go(page, P(`/guides/${ids.g1}`)); await page.waitForSelector("#status-card-heading"); await sleep(800);
console.log("Guide 'empty story' lines:", await count(/empty story/g));
// RemovedBar text via Guide: add two blocks then remove
const add = page.getByRole("button", { name: /Add (a )?(paragraph|text|block)/i }).first();
console.log("add button count:", await add.count());
if (await add.count()) { await add.click(); await sleep(300); await add.click(); await sleep(300);
  const rm = () => page.getByRole("button", { name: /^Remove /i }).first();
  await rm().click(); await sleep(300); await rm().click(); await sleep(400);
  console.log("bar text:", JSON.stringify(await page.locator("[data-removed-text]").innerText()));
  console.log("status roles in bar:", await page.locator("[data-removed-bar] [role=status]").count());
  const r = await page.locator("[data-removed-bar]").boundingBox(); console.log("bar box", r && [Math.round(r.y), Math.round(r.y + r.height)], "vh 900"); }
await browser.close();
