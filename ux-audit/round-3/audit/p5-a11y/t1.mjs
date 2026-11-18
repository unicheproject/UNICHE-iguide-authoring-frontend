import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("t1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const seed = JSON.parse(readFileSync(H.here + "/../../../tools/seed.json", "utf8"));
const { browser, page } = await H.session();
try {
  // A. forced 422 on editor save
  await H.go(page, H.P("/pois/" + ids.poi)); await H.sleep(900);
  await page.route(new RegExp("/pois/" + ids.poi + "$"), async (r) => { if (r.request().method() === "PUT") await r.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ code: "VALIDATION_ERROR", status: 422, requestId: "req-r3-p5-save422", errors: [{ path: "latitude", code: "OUT_OF_RANGE", message: "Latitude out of range (forced)" }, { path: "translations.en.title", code: "TOO_LONG", message: "Title too long (forced)" }] }) }); else await r.continue(); });
  await page.getByLabel("Title", { exact: false }).first().focus(); await page.keyboard.type("!"); await H.live(page);
  await H.press(page, "Control+s", "save 422", log, 1500);
  await H.shot(page, "poi-editor__save-422__1440");
  log("summary", await page.evaluate(() => { const s = document.querySelector("[data-error-summary]"); return s ? { text: s.innerText.slice(0, 300), links: [...s.querySelectorAll("a,button")].map(a => a.textContent.trim()) } : null; }));
  const lk = page.locator("[data-error-summary] a, [data-error-summary] button"); const n = await lk.count();
  for (let i = 0; i < n; i++) { await lk.nth(i).focus(); await page.keyboard.press("Enter"); await H.sleep(300); log("link", i, "->", H.brief(await H.AE(page)), H.flag(await H.chk(page))); }
  await H.axe(page, "poi-editor-422", log);
  await page.unroute(new RegExp("/pois/" + ids.poi + "$"));
  // B. 5xx on save
  await page.route(new RegExp("/pois/" + ids.poi + "$"), (r) => r.request().method() === "PUT" ? r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ code: "UNAVAILABLE", status: 503, requestId: "req-r3-503", detail: "SECRET" }) }) : r.continue());
  await page.getByLabel("Title", { exact: false }).first().focus(); await H.live(page);
  await H.press(page, "Control+s", "save 503", log, 1500);
  log("503 summary/alert", await page.evaluate(() => [...document.querySelectorAll("[role=alert]")].map(a => a.innerText.slice(0, 140))), "secret", await page.evaluate(() => /SECRET/.test(document.body.innerText)));
  await H.shot(page, "poi-editor__save-503__1440");
  await page.unroute(new RegExp("/pois/" + ids.poi + "$"));
  // C. offline
  await page.context().setOffline(true); await H.sleep(1500);
  log("offline live", JSON.stringify(await H.live(page)), "banner", await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert]")].map(e => e.innerText.slice(0, 120)).filter(Boolean)));
  await H.shot(page, "poi-editor__offline__1440"); await H.press(page, "Control+s", "save offline", log, 1500);
  await page.context().setOffline(false);
  // D. leave confirm from switcher (editor dirty -> switch project)
  await H.go(page, H.P("/pois/" + ids.poi)); await H.sleep(900);
  await page.getByLabel("Title", { exact: false }).first().focus(); await page.keyboard.type("?");
  await page.getByRole("button", { name: /Switch project/ }).focus(); await H.press(page, "Enter", "switcher", log, 600);
  await page.keyboard.type("UX Audit – Empty B"); await H.sleep(500); await page.keyboard.press("ArrowDown"); await H.press(page, "Enter", "choose other project", log, 900);
  log("leave confirm", await page.evaluate(() => { const d = document.querySelector("[role=alertdialog],[role=dialog]"); return d ? d.innerText.slice(0, 200) : "none"; }), H.brief(await H.AE(page)));
  await H.shot(page, "leave-confirm__from-switcher__1440");
  await H.press(page, "Escape", "esc leave confirm", log, 700);
  log("after esc", page.url().replace(H.PID, "PID"), JSON.stringify(await H.title(page)));
} finally { await browser.close(); }
