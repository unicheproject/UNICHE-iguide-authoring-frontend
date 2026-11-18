import * as H from "./h.mjs";
const log = H.LOG("a1");
const { browser, page } = await H.session();
try {
  await H.go(page, "/");
  await page.evaluate(() => document.activeElement.blur());
  for (const a of await H.tab(page, 6)) log("home tab:", H.brief(a));
  // back to start, go to switcher
  await page.reload(); await page.waitForLoadState("networkidle");
  await H.tab(page, 2); // skip, logo
  await H.tab(page, 1); log("switcher focus", H.brief(await H.AE(page)));
  await H.shot(page, "switcher__focus__1440");
  await H.press(page, "Enter", "switcher open", log);
  await H.shot(page, "switcher__open__1440");
  log("dialog", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return d ? { name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, modal: d.getAttribute("aria-modal"), rect: d.getBoundingClientRect().toJSON() } : null; }));
  await H.snap(page, "switcher", "[role=dialog]");
  await page.keyboard.type("UX Audit – Pop", { delay: 20 }); await H.sleep(500);
  log("typed", H.brief(await H.AE(page)), await H.live(page));
  await H.press(page, "ArrowDown", "arrow", log);
  await H.press(page, "ArrowDown", "arrow2", log);
  await H.press(page, "ArrowUp", "arrowup", log);
  log("aria-activedescendant etc", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] [role=option],[role=dialog] a,[role=dialog] [role=listbox]")].slice(0,8).map(e=>e.tagName+" "+e.getAttribute("role")+" "+e.getAttribute("aria-selected")+" "+e.textContent.trim().slice(0,50))));
  await H.shot(page, "switcher__typed__1440");
  // Esc returns focus
  await H.press(page, "Escape", "esc", log);
  await H.press(page, "Enter", "reopen", log);
  await page.keyboard.type("UX Audit – Populated", { delay: 10 }); await H.sleep(500);
  await H.press(page, "ArrowDown", "arrow", log);
  await H.press(page, "Enter", "choose", log, 1500);
  log("after switch", page.url(), await H.title(page), await H.AE(page));
  await H.shot(page, "dashboard__afterswitch__1440");
  await H.snap(page, "dashboard");
  log("live all", JSON.stringify(await H.live(page)));
} finally { await browser.close(); }
