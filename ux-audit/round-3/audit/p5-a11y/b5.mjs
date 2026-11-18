import * as H from "./h.mjs";
import { openPoi } from "./lib2.mjs";
const log = H.LOG("b5");
const { browser, page } = await H.session();
try {
  await openPoi(page);
  const lat = page.getByLabel("Latitude"), lng = page.getByLabel("Longitude");
  await lat.focus(); await page.keyboard.type("95", { delay: 8 }); await H.press(page, "Tab", "lat 95 blur", log, 600);
  log("lat err", await page.evaluate(() => { const i = document.querySelector("input[aria-invalid=true]"); return i ? { desc: i.getAttribute("aria-describedby") && document.getElementById(i.getAttribute("aria-describedby").split(" ")[0])?.textContent, id: i.id } : null; }));
  await H.shot(page, "poi-editor__lat-invalid__1440");
  await H.snap(page, "poi-placement", "#placement-heading, section[aria-labelledby=placement-heading]");
  await lat.focus(); await page.keyboard.press("Control+a"); await page.keyboard.type("37,9715", { delay: 8 }); await page.keyboard.press("Tab"); await H.sleep(500);
  await page.keyboard.type("23.7257", { delay: 8 }); await H.press(page, "Tab", "lng blur", log, 700);
  log("values", await lat.inputValue(), await lng.inputValue());
  await H.shot(page, "poi-editor__coords-set__1440");
  // map group
  log("map region", await page.evaluate(() => [...document.querySelectorAll(".leaflet-container")].map(m => ({ role: m.getAttribute("role"), label: m.getAttribute("aria-label"), tabindex: m.getAttribute("tabindex"), interactive: m.querySelectorAll(".leaflet-interactive").length, tabbable: [...m.querySelectorAll("[tabindex='0'],button,a")].length }))));
  const btn = page.getByRole("button", { name: /Set position on the map|Change position|position on the map/ }).first();
  await btn.focus(); await H.press(page, "Enter", "set pos open", log, 1200);
  await H.shot(page, "poi-editor__geopicker__1440");
  log("dlg", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return d ? { name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, text: d.innerText.slice(0, 400) } : "no dialog (inline map?)"; }));
  await H.snap(page, "geopicker", "main");
  log("tab order in map region:"); for (let i = 0; i < 14; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), H.flag(await H.chk(page))); }
} finally { await browser.close(); }
