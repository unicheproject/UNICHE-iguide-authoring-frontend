import * as H from "./h.mjs";
const log = H.LOG("i1");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/media")); await H.sleep(800);
  await page.getByRole("button", { name: "Upload files" }).first().focus();
  await H.press(page, "Enter", "open upload", log, 900);
  await H.shot(page, "upload__open__1440");
  await H.snap(page, "upload", "[role=dialog]");
  log("dlg", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return { name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, text: d.innerText.slice(0, 300) }; }));
  log("tab:"); for (let i = 0; i < 5; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), H.flag(await H.chk(page))); }
  await H.axe(page, "upload-empty", log);
  const input = page.locator("[role=dialog] input[type=file]");
  await input.setInputFiles([H.here + "/files/UX-R3-p5 upload a.png", H.here + "/files/UX-R3-p5 upload b.png"]);
  await H.sleep(600); log("after choose", H.brief(await H.AE(page)), JSON.stringify(await H.live(page)));
  await H.shot(page, "upload__held__1440");
  await H.snap(page, "upload-held", "[role=dialog]");
  log("dlg text", await page.evaluate(() => document.querySelector("[role=dialog]").innerText.slice(0, 700)));
  log("live regions", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] [role=log],[role=dialog] [role=status],[role=dialog] [aria-live]")].map(e => e.getAttribute("role") + "/" + e.getAttribute("aria-live") + ":" + e.textContent.trim().slice(0, 80))));
  await H.axe(page, "upload-held", log);
  log("buttons", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].map(b => b.textContent.trim().slice(0, 50))));
} finally { await browser.close(); }
