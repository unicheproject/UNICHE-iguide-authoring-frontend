import { open, go, PID, shot, listReady } from "./lib.mjs";
const T = "883b205a-15cb-4068-b1bc-b031bf5d857b";
for (const vp of ["1024", "zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${PID}/pois/${T}`);
  await page.waitForFunction(() => document.querySelector("h1")?.innerText.length > 3, null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(2500);
  await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(800);
  await shot(page, "poi-editor__long-greek-tab", vp, false);
  const m = await page.evaluate(() => { const h = document.querySelector("h1"); const r = h.getBoundingClientRect(); const cs = getComputedStyle(h); return { h1: h.innerText.slice(0,50), w: Math.round(r.width), h: Math.round(r.height), ov: cs.overflow, to: cs.textOverflow, ws: cs.whiteSpace, scrollW: h.scrollWidth, clientW: h.clientWidth, docOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth, tabs: [...document.querySelectorAll("[role=tab]")].map(t => Math.round(t.getBoundingClientRect().width)) }; });
  console.log(vp, JSON.stringify(m));
  await shot(page, "poi-editor__long-greek-full", vp, true);
  await go(page, `/projects/${PID}/pois?q=${encodeURIComponent("Προσωρινών")}`); await listReady(page); await page.waitForTimeout(600);
  await shot(page, "pois-list__long-greek", vp, false);
  console.log(vp, "list overflow x:", await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
  await browser.close();
}
