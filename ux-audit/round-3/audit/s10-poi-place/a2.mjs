import { open, go, P, shot, settle } from "./h.mjs";
import { writeFileSync } from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
const out = {};
try {
  await go(page, `/projects/${P}/places?create=1`); await settle(page,1200);
  const dlg = page.getByRole("dialog");
  console.log(await dlg.locator("input,select,button,textarea").evaluateAll(els=>els.map(e=>e.tagName+":"+(e.getAttribute("aria-label")||e.id||e.textContent.trim().slice(0,30)))));
  await shot(page, "place-create-dialog__default__1440");
  await dlg.locator("input").first().fill("UX-R3-s10 Place");
  await dlg.getByRole("button",{name:/create and open/i}).click();
  await page.waitForURL(/places\/[0-9a-f-]{36}/); await settle(page,1500);
  out.place = page.url(); console.log(out.place);
  for (const [k,t] of [["poiA","UX-R3-s10 POI Draft"],["poiB","UX-R3-s10 POI Active"]]) {
    await go(page, `/projects/${P}/pois?create=1`); await settle(page,1200);
    const d = page.getByRole("dialog");
    await d.locator("input").first().fill(t);
    await d.getByRole("button",{name:/create and open/i}).click();
    await page.waitForURL(/pois\/[0-9a-f-]{36}/); await settle(page,1500);
    out[k]=page.url(); console.log(k,out[k]);
  }
  writeFileSync(new URL("./ids.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1"), JSON.stringify(out));
} finally { await browser.close(); }
