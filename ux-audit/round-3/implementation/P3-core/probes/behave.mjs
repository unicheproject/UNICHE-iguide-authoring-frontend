import AxeBuilder from "@axe-core/playwright";
import { open, go, P, settle, shot, save, focusDesc, PHASE } from "./h.mjs";
const res = {};
// zoom200: Filters popover
{
  const { browser, page } = await open("admin", { viewport: "zoom200" });
  await go(page, `/projects/${P}/pois?pending=1`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  const btn = page.getByRole("button", { name: /^Filters/ });
  res.buttonName = await btn.evaluate((b) => b.textContent.replace(/\s+/g, " ").trim());
  await btn.click(); await settle(page, 500);
  res.popover = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const r = d.getBoundingClientRect(); const sc = d.querySelector(".overflow-y-auto"); return { name: d.getAttribute("aria-label"), top: Math.round(r.top), bottom: Math.round(r.bottom), innerHeight, scrollable: sc.scrollHeight > sc.clientHeight, done: !!([...d.querySelectorAll("button")].find((b) => b.textContent.trim() === "Done")) }; });
  await shot(page, "filters-popover__zoom200");
  await page.keyboard.press("Escape");
  await browser.close();
}
// 1440: popover, axe, status chip at 1024/768
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/pois?pending=1`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  res.axe = axe.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
  await page.getByRole("button", { name: /^Filters/ }).click(); await settle(page, 400);
  const axe2 = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  res.axeOpen = axe2.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
  await shot(page, "filters-popover__1440");
  await page.getByRole("button", { name: "Done" }).click(); await settle(page, 300);
  res.afterDone = await focusDesc(page);
  // radio Home/End
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("[data-row-id]");
  await page.locator("main").evaluate((m) => (m.scrollTop = 0));
  await page.getByRole("radio", { name: /^Not archived/ }).focus();
  const y0 = await page.evaluate(() => (document.getElementById("main")?.scrollTop ?? 0) + scrollY);
  await page.keyboard.press("End");
  const y1 = await page.evaluate(() => (document.getElementById("main")?.scrollTop ?? 0) + scrollY);
  res.radioEnd = { scrollDelta: y1 - y0, checked: await page.evaluate(() => document.querySelector("input[type=radio]:checked").parentElement.textContent.trim().slice(0, 10)) };
  await page.keyboard.press("Home");
  res.radioHome = await page.evaluate(() => document.querySelector("input[type=radio]:checked").parentElement.textContent.trim().slice(0, 14));
  await browser.close();
}
for (const vp of ["1024", "768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois?status=DRAFT&missing=it&lang=it`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  res[`chips@${vp}`] = await page.evaluate(() => [...document.querySelectorAll("[role=search] button[aria-label^='Remove filter']")].map((b) => b.getAttribute("aria-label")));
  await shot(page, `toolbar-chips__${vp}`, { clip: { x: 0, y: 0, width: Number(vp), height: 300 } });
  await browser.close();
}
// paging + sort cycle + move/undo
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  await page.getByRole("button", { name: "Next" }).click(); await settle(page, 500);
  res.page2 = { focus: await focusDesc(page), headTop: await page.evaluate(() => Math.round(document.querySelector("thead th").getBoundingClientRect().top)), toolbarBottom: await page.evaluate(() => Math.round(document.querySelector("[role=search]").getBoundingClientRect().bottom)), firstRowTop: await page.evaluate(() => Math.round(document.querySelector("[data-row-id]").getBoundingClientRect().top)) };
  await shot(page, "page2__1440");
  // sort cycle
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("[data-row-id]");
  const seq = [];
  for (let i = 0; i < 3; i++) { await page.getByRole("button", { name: "Title" }).first().click(); await settle(page, 300); seq.push(new URL(page.url()).search); }
  res.sortCycle = seq;
  // move: find own record via search, move to position
  await go(page, `/projects/${P}/pois?q=UX-R3-P3core%20Move%20A`); await page.waitForSelector("[data-row-id]"); await settle(page, 400);
  // search hides rows -> reorder blocked; use manual order list, go to last page
  await go(page, `/projects/${P}/pois?page=3`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  const kebab = page.getByRole("button", { name: "Actions for UX-R3-P3core Move A" });
  await kebab.click(); await page.getByRole("menuitem", { name: "Move to position..." }).click(); await settle(page, 400);
  const dlgInput = page.getByLabel("New position");
  await dlgInput.fill("60"); await page.getByRole("button", { name: "Move", exact: true }).click(); await settle(page, 1500);
  res.move60 = { bar: await page.locator("[aria-label='Last move']").innerText().catch(() => null), focus: await focusDesc(page) };
  // now it is on page 2; go to page 2 and move to 3
  await page.getByRole("button", { name: "Previous" }).click().catch(() => {}); await settle(page, 300);
  await go(page, `/projects/${P}/pois?page=2`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  await page.getByRole("button", { name: "Actions for UX-R3-P3core Move A" }).click();
  await page.getByRole("menuitem", { name: "Move to position..." }).click(); await settle(page, 400);
  await page.getByLabel("New position").fill("3"); await page.getByRole("button", { name: "Move", exact: true }).click(); await settle(page, 1500);
  res.move3 = { bar: await page.locator("[aria-label='Last move']").innerText().catch(() => null), focus: await focusDesc(page), live: await page.evaluate(() => document.querySelector("[role=status].sr-only")?.textContent) };
  await shot(page, "move-bar__1440");
  await page.keyboard.press("Control+z"); await settle(page, 1500);
  res.undoCtrlZ = { barGone: (await page.locator("[aria-label='Last move']").count()) === 0, focus: await focusDesc(page), rowOnPage2: await page.getByRole("link", { name: "UX-R3-P3core Move A" }).count() };
  // restore to the end: move back to position 60 undone already -> state: undo of the 3 restores 60; undo of 60 is gone. Move it to bottom.
  await page.getByRole("button", { name: "Actions for UX-R3-P3core Move A" }).click();
  await page.getByRole("menuitem", { name: "Move to bottom" }).click(); await settle(page, 1500);
  res.moveBottom = { bar: await page.locator("[aria-label='Last move']").innerText().catch(() => null), focus: await focusDesc(page) };
  await browser.close();
}
// CLS
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  const out = [];
  for (let i = 0; i < 3; i++) { await go(page, `/projects/${P}/pois`); await page.waitForSelector("[data-row-id]"); await settle(page, 1500); out.push(+(await page.evaluate(() => window.__cls)).toFixed(4)); }
  res.cls = out;
  await browser.close();
}
save("behave", res);
console.log(PHASE, JSON.stringify(res, null, 1));
