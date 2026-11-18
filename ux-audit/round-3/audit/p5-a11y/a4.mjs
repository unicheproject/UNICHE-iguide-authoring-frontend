import * as H from "./h.mjs";
const log = H.LOG("a4");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois"));
  // sort
  await page.getByRole("button", { name: "Title", exact: true }).focus();
  await H.press(page, "Enter", "sort Title", log, 900);
  log("aria-sort", await page.evaluate(() => [...document.querySelectorAll("th")].map(t => t.textContent.trim().slice(0,12) + "=" + t.getAttribute("aria-sort"))));
  await H.press(page, "Enter", "sort Title again", log, 900);
  log("aria-sort", await page.evaluate(() => [...document.querySelectorAll("th")].map(t => t.textContent.trim().slice(0,12) + "=" + t.getAttribute("aria-sort"))));
  await H.shot(page, "poi-list__sorted__1440");
  // Updated sort
  await page.getByRole("button", { name: "Updated", exact: true }).focus();
  await H.press(page, "Space", "sort Updated", log, 900);
  // pager
  const pager = page.getByRole("navigation", { name: /pag/i });
  log("pager count", await pager.count());
  log("pager html", (await pager.first().evaluate(e => e.outerHTML.slice(0, 700)).catch(() => "none")));
  await pager.getByRole("button", { name: /next/i }).first().focus().catch(()=>{});
  await H.shot(page, "poi-list__pager-focus__1440");
  log("pager focus", H.brief(await H.AE(page)), JSON.stringify(await H.ring(page)));
  await H.press(page, "Enter", "pager next", log, 1200);
  log("after pager", page.url(), JSON.stringify(await H.title(page)), H.brief(await H.AE(page)));
  await H.shot(page, "poi-list__page2__1440");
  await H.press(page, "Enter", "pager again?", log, 800);
  // row menu
  await page.goto(page.url().split("?")[0]); await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /^Actions for/ }).nth(1).focus();
  await H.press(page, "Enter", "kebab open", log, 500);
  await H.shot(page, "poi-list__row-menu__1440");
  await H.snap(page, "row-menu", "[role=menu]");
  log("menu items", await page.evaluate(() => [...document.querySelectorAll("[role=menu] [role^=menuitem]")].map(e => e.textContent.trim() + (e.getAttribute("aria-disabled") ? " (disabled)" : ""))));
  for (const k of ["ArrowDown", "ArrowDown", "ArrowUp", "End", "Home"]) await H.press(page, k, "menu", log, 200);
  await H.press(page, "Escape", "menu esc", log, 400);
  // Move to position
  await H.press(page, "Enter", "reopen", log, 400);
  const items = await page.locator("[role=menu] [role^=menuitem]").allTextContents();
  const idx = items.findIndex(t => /position/i.test(t)); log("move pos idx", idx, items);
  if (idx >= 0) { await H.press(page, "Home", "home", log, 150); for (let i = 0; i < idx; i++) await page.keyboard.press("ArrowDown"); log("on", H.brief(await H.AE(page))); await H.press(page, "Enter", "choose move pos", log, 600);
    log("dialog", await page.evaluate(() => { const d = document.querySelector("[role=dialog],[role=alertdialog]"); return d ? d.innerText.slice(0, 300) : null; }));
    await H.shot(page, "poi-list__move-position__1440"); await H.snap(page, "move-position", "[role=dialog],[role=alertdialog]");
    await page.keyboard.type("0"); await H.press(page, "Enter", "submit 0 (invalid?)", log, 600); await H.shot(page, "poi-list__move-position-invalid__1440");
    log("dialog2", await page.evaluate(() => { const d = document.querySelector("[role=dialog],[role=alertdialog]"); return d ? d.innerText.slice(0, 300) : null; }));
    await H.press(page, "Escape", "esc dialog", log, 500); }
  await H.axe(page, "row-menu-closed", log);
} finally { await browser.close(); }
