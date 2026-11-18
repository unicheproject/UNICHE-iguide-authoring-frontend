import * as H from "./h.mjs";
import { openRoute } from "./lib3.mjs";
const log = H.LOG("c3");
const { browser, page } = await H.session();
try {
  await openRoute(page);
  await page.getByRole("button", { name: "Add stops" }).first().focus();
  await page.keyboard.press("Enter"); await H.sleep(900);
  await page.keyboard.type("Parthenon", { delay: 8 }); await H.sleep(700);
  for (const k of ["ArrowDown", "Enter", "ArrowDown", "Enter", "ArrowDown", "Enter"]) { await page.keyboard.press(k); await H.sleep(300); }
  await page.getByRole("button", { name: /^Done/ }).focus(); await H.press(page, "Enter", "done", log, 800);
  await H.live(page);
  await H.shot(page, "route-editor__3-stops__1440");
  await H.snap(page, "route-stops", "#stops, [aria-labelledby=stops-heading], section:has(h2:has-text('Stops'))");
  log("stop list buttons", await page.evaluate(() => [...document.querySelectorAll("section:has(> div h2, > h2) ")].filter(s => /^Stops/.test(s.querySelector("h2")?.textContent.trim() || "")).flatMap(s => [...s.querySelectorAll("button,input,select,a")].map(b => b.tagName + ":" + (b.getAttribute("aria-label") || b.labels?.[0]?.textContent || b.textContent).trim().slice(0, 50)))));
  await H.press(page, "Control+s", "save", log, 1800);
  // reorder with move down
  const mv = page.getByRole("button", { name: /Move .* down/i }); log("move-down count", await mv.count());
  await mv.first().focus(); await H.press(page, "Enter", "move down stop1", log, 600);
  log("order now", await page.evaluate(() => [...document.querySelectorAll("li")].filter(l => l.querySelector("[aria-label*='Move']")).map(l => l.textContent.trim().slice(0, 40))));
  // remove stop
  const rm = page.getByRole("button", { name: /Remove/i }); log("remove count", await rm.count());
  await rm.first().focus(); await H.press(page, "Enter", "remove stop", log, 700);
  await H.shot(page, "route-editor__removed-undo__1440");
  log("undo bar", await page.evaluate(() => { const u = [...document.querySelectorAll("button")].find(b => /^Undo/.test(b.textContent.trim())); return u ? { text: u.textContent.trim(), focused: document.activeElement === u, chk: null } : null; }));
  log("chk", JSON.stringify(await H.chk(page)));
  await H.press(page, "Enter", "undo via Enter", log, 700);
  log("after undo", H.brief(await H.AE(page)), "stops:", await page.locator("li:has([aria-label*='Move'])").count());
  // remove again then Ctrl+Z
  await rm.first().focus(); await page.keyboard.press("Enter"); await H.sleep(600); await H.live(page);
  await H.press(page, "Control+z", "ctrl+z", log, 700);
  log("after ctrl+z stops:", await page.locator("li:has([aria-label*='Move'])").count());
  await H.axe(page, "route-editor-stops", log);
} finally { await browser.close(); }
