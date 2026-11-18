import * as H from "./h.mjs";
const log = H.LOG("l1");
const { browser, page } = await H.session({ viewport: "768" });
try {
  await H.go(page, H.P("/pois")); await H.sleep(1000);
  await H.shot(page, "poi-list__load__768");
  log("first tabs:"); await page.evaluate(() => document.activeElement.blur()); for (let i = 0; i < 6; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), H.flag(await H.chk(page))); }
  log("nav visible?", await page.evaluate(() => { const n = document.querySelector("nav[aria-label=Primary]"); const r = n?.getBoundingClientRect(); return n ? { rect: [r.x, r.y, r.width, r.height].map(Math.round), vis: getComputedStyle(n).visibility, inert: n.closest("[inert]") ? "inert" : "" } : "none"; }));
  const menu = page.getByRole("button", { name: /menu|navigation/i }).first(); log("menu btn", await menu.count() ? await menu.evaluate(e => e.getAttribute("aria-label") + "|" + e.getAttribute("aria-expanded") + "|" + e.getAttribute("aria-controls")) : "none");
  await menu.focus(); await H.press(page, "Enter", "open drawer", log, 600);
  await H.shot(page, "nav-drawer__open__768");
  await H.snap(page, "nav-drawer", "[role=dialog],nav[aria-label=Primary]");
  log("dlg", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return d ? { name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, modal: d.getAttribute("aria-modal") } : "no dialog role"; }));
  log("bg inert?", await page.evaluate(() => ({ mainInert: !!document.querySelector("main")?.closest("[inert]") || document.querySelector("main")?.getAttribute("aria-hidden"), ae: document.activeElement.tagName + ":" + document.activeElement.textContent.trim().slice(0, 30) })));
  log("tab in drawer:"); for (let i = 0; i < 22; i++) { const a = (await H.tab(page, 1))[0]; if (i < 3 || i > 17) log(i, H.brief(a), H.flag(await H.chk(page))); }
  await H.axe(page, "nav-drawer", log);
  await H.press(page, "Escape", "esc drawer", log, 500);
  log("after esc", JSON.stringify(await H.chk(page)));
  // open, choose item
  await menu.focus(); await page.keyboard.press("Enter"); await H.sleep(500);
  await page.getByRole("link", { name: "Routes" }).first().focus(); await H.press(page, "Enter", "choose Routes", log, 1500);
  log("after choose", JSON.stringify(await H.title(page)), H.brief(await H.AE(page)), "drawer open?", await page.locator("[role=dialog]").count());
  await H.axe(page, "routes-768", log);
} finally { await browser.close(); }
