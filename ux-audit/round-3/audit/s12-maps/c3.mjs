import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const MAP = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url))).map;
const vp = process.argv[2] || "1440";
const SH = "ux-audit/round-3/audit/s12-maps/shots/";
await run(async () => { try {
  const { browser, page } = await start(vp); log("=== c3 cards", vp);
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(2500);
  // Filter disclosure
  const disc = page.getByRole("button", { name: /Try the visitor filter/ });
  log("disclosure", await disc.evaluate(e => { const b=e.getBoundingClientRect(); return {w:Math.round(b.width),h:Math.round(b.height),exp:e.getAttribute("aria-expanded")}; }));
  await disc.click(); await page.waitForTimeout(400);
  await disc.scrollIntoViewIfNeeded(); await shot(page, "map-editor__filter-open", vp);
  log("filter radios", await page.evaluate(() => [...document.querySelectorAll('input[name^="visitor-filter"]')].map(r => { const l = r.closest("label").getBoundingClientRect(); const b = r.getBoundingClientRect(); return `${r.value||"all"}:${Math.round(l.height)}h/${Math.round(b.width)}box`; })));
  // Tab through the filter
  await page.getByRole("radio").first().focus();
  const st=[]; for (let i=0;i<6;i++){ await page.keyboard.press("Tab"); st.push(await focusDesc(page)); } log("tab after type radio", st);
  await page.keyboard.press("Escape");
  // pick a category in filter
  const cats = page.locator('input[name="visitor-filter-category"]'); log("filter cat count", await cats.count());
  await cats.nth(1).check(); await page.waitForTimeout(500); log("summary", await disc.innerText(), "|", await page.locator('[aria-live=polite]:has-text("shown")').allInnerTexts());
  await shot(page, "map-editor__filter-category", vp);
  await cats.nth(0).check();
  // Visibility
  const vis = page.locator("#visibility"); await vis.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await shot(page, "map-editor__visibility", vp);
  log("visibility boxes", await page.evaluate(() => [...document.querySelectorAll('#visibility [role=checkbox], #visibility input[type=checkbox]')].slice(0,6).map(c => { const b=c.getBoundingClientRect(); const row=c.closest("label")?.getBoundingClientRect(); return `${c.tagName} ${Math.round(b.width)}x${Math.round(b.height)} row ${row?Math.round(row.width)+"x"+Math.round(row.height):"-"}`; })));
  log("visibility text", (await vis.innerText()).slice(0,900));
  // Visitor filter card
  const fc = page.locator("#filter"); await fc.scrollIntoViewIfNeeded();
  log("filter card", (await fc.innerText()).slice(0,500));
  const fcb = fc.locator("button").first(); await fcb.click(); await page.waitForTimeout(300); await shot(page, "map-editor__visitor-filter-card", vp);
  log("filter card open", (await fc.innerText()).slice(0,500));
  // Linked place
  const pl = page.locator("#place"); await pl.scrollIntoViewIfNeeded();
  log("linked place options", await page.locator("#f-placeId option").allInnerTexts().then(a=>a.slice(0,8)), "note:", await page.locator("#place p").allInnerTexts());
  await page.locator("#f-placeId").selectOption({ index: 1 }); await page.waitForTimeout(300);
  log("linked note", await page.locator("#place p").allInnerTexts());
  await shot(page, "map-editor__linked-place", vp);
  await page.locator("#f-placeId").selectOption({ index: 0 });
  // Unplaced search empty
  await page.locator("#unplaced-search").scrollIntoViewIfNeeded(); await page.locator("#unplaced-search").fill("zzzzq"); await page.waitForTimeout(300);
  log("unplaced empty", await page.locator("#placed").innerText().then(t=>t.match(/Nothing matches[^\n]*/)?.[0]));
  await shot(page, "map-editor__unplaced-empty-search", vp);
  await page.locator("#unplaced-search").fill("");
  // Bounds field blur probes
  const probes = [["#f-minLatitude","abc"],["#f-maxLatitude","91"],["#f-minLongitude","12,5"],["#f-maxLongitude","999"],["#f-initialLatitude","x"],["#f-initialZoom","30"],["#f-initialZoom","abc"],["#f-minLatitude","38,0"]];
  await page.locator("#f-minLatitude").scrollIntoViewIfNeeded();
  for (const [sel,v] of probes) { const f = page.locator(sel); await f.fill(v); await f.press("Tab"); await page.waitForTimeout(250);
    log("BLUR", sel, v, "inv", await f.getAttribute("aria-invalid"), "msg", await page.locator(`${sel}`).evaluate(e => { const d=e.getAttribute("aria-describedby"); return d? d.split(" ").map(i=>document.getElementById(i)?.textContent.trim()).join(" / "):""; }), "live", await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(l=>l.textContent).filter(Boolean).slice(-1)[0]?.slice(0,100))); }
  await shot(page, "map-editor__blur-errors", vp);
  // Save with invalid
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1200);
  await page.evaluate(()=>window.scrollTo(0,0)); await shot(page, "map-editor__save-invalid", vp);
  log("save alerts", await page.locator('[role=alert]').allInnerTexts());
  log("summary links", await page.locator('[role=alert] a').allInnerTexts());
  await axe(page, "map editor invalid");
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,500)); } });
