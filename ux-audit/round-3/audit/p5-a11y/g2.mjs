import * as H from "./h.mjs";
const log = H.LOG("g2");
const ids = JSON.parse((await import("node:fs")).readFileSync(H.here + "/ids.json", "utf8"));
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/events/" + ids.event)); await H.sleep(800);
  const hour = page.getByLabel("Hour (0 to 23)").first();
  await hour.focus(); await page.keyboard.press("Control+a"); await page.keyboard.type("25"); await page.keyboard.press("Tab"); await H.sleep(500);
  for (const mode of ["after-invalid"]) {
    const r = await new H.AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    for (const v of r.violations) for (const n of v.nodes.slice(0, 6)) log(JSON.stringify(n.any[0]?.data), n.html.slice(0, 100), JSON.stringify(n.any[0]?.relatedNodes?.map(x => x.html.slice(0, 80)))); log("total", r.violations.reduce((a, v) => a + v.nodes.length, 0));
  }
  await H.shot(page, "event-editor__invalid-hour-only__1440");
  log("end after", await page.evaluate(() => [...document.querySelectorAll("section:has(h2) fieldset")].slice(0, 2).map(f => [...f.querySelectorAll("input,select")].map(i => i.value).join("/"))));
} finally { await browser.close(); }
