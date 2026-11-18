import * as H from "./h.mjs";
const log = H.LOG("k1");
const ids = JSON.parse((await import("node:fs")).readFileSync(H.here + "/ids.json", "utf8"));
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois/" + ids.poi)); await H.sleep(900);
  const pb = page.getByRole("button", { name: "Preview in app" }); await pb.focus();
  await H.press(page, "Enter", "open preview in app", log, 1500);
  await H.shot(page, "preview-in-app__open__1440");
  await H.snap(page, "preview-in-app", "main");
  log("state", await page.evaluate(() => ({ expanded: document.querySelector("button[aria-expanded]:focus")?.getAttribute("aria-expanded"), labels: [...document.querySelectorAll("[role=region][aria-label],section[aria-label]")].map(e => e.getAttribute("aria-label")) })));
  log("tab inside:"); for (let i = 0; i < 8; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), H.flag(await H.chk(page))); }
  await H.axe(page, "preview-in-app-open", log);
  // Esc order: focus interact if exists
  const inter = page.getByRole("button", { name: /Interact/ }).first();
  if (await inter.count()) { await inter.focus(); await H.press(page, "Enter", "interact", log, 600); await page.keyboard.press("Tab"); await H.press(page, "Escape", "esc1 (stop interacting)", log, 600); await H.press(page, "Escape", "esc2 (close panel)", log, 800); }
  else { await pb.focus(); await H.press(page, "Escape", "esc", log, 800); }
  log("after esc2", JSON.stringify(await H.chk(page)), await pb.getAttribute("aria-expanded"));
  await H.shot(page, "preview-in-app__closed__1440");
} finally { await browser.close(); }
