import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ID = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
await run(async () => { try {
  // forced colours: map editor with edit bounds + plan with pins
  { const { browser, page } = await start("1280", { forcedColors: "active" }); log("=== g1 forced colours");
    await go(page, `/projects/${POP}/maps/${ID.map}`); await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Edit bounds" }).click(); await page.waitForTimeout(1200);
    await page.locator("div.leaflet-container").scrollIntoViewIfNeeded(); await shot(page, "map-editor__forced-colors-bounds", "1280");
    await page.locator('.leaflet-marker-icon[aria-label^="North-west"]').focus(); await page.waitForTimeout(200);
    log("forced handle", await page.evaluate(()=>{const h=document.querySelector('.leaflet-marker-icon[aria-label^="North-west"]');const i=h.firstElementChild;const c=getComputedStyle(i);return {border:c.borderTopWidth+" "+c.borderTopColor, bg:c.backgroundColor, outline:getComputedStyle(h).outlineStyle+" "+getComputedStyle(h).outlineColor, innerOutline:c.outlineStyle+" "+c.outlineColor};}));
    await go(page, `/projects/${POP}/floor-plans/${ID.plan}`); await page.waitForTimeout(2000);
    await page.locator('ul button:has-text("Place")').first().click(); await page.getByRole("button",{name:"Place near the centre"}).click(); await page.waitForTimeout(400);
    await page.locator(".plan-pin").first().focus(); await shot(page, "plan-editor__forced-colors-pin", "1280");
    log("forced pin", await page.evaluate(()=>{const d=document.querySelector(".plan-pin-dot");const c=getComputedStyle(d);return {bg:c.backgroundColor,border:c.borderTopWidth+" "+c.borderTopColor,color:c.color,focusOutline:getComputedStyle(document.querySelector(".plan-pin")).outlineStyle};}));
    await browser.close(); }
  // zoom200
  { const { browser, page } = await start("zoom200"); log("=== g1 zoom200");
    await go(page, `/projects/${POP}/maps/${ID.map}`); await page.waitForTimeout(3000);
    await shot(page, "map-editor__default", "zoom200", true);
    log("zoom200 map", await page.evaluate(()=>{const r=document.querySelector("div.leaflet-container").getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),document.documentElement.scrollWidth>innerWidth]}));
    await go(page, `/projects/${POP}/floor-plans/${ID.plan}`); await page.waitForTimeout(2000);
    await page.locator('ul button:has-text("Place")').first().click(); await page.waitForTimeout(600); await shot(page, "plan-editor__armed", "zoom200");
    log("zoom200 armed bar", await page.evaluate(()=>{const b=document.querySelector("[data-armed-bar]").getBoundingClientRect();return [Math.round(b.height),innerHeight,getComputedStyle(document.querySelector("[data-armed-bar]")).position]}));
    await browser.close(); }
  // plan editor 1440 fields blur
  { const { browser, page } = await start("1440"); log("=== g1 plan fields 1440");
    await go(page, `/projects/${POP}/floor-plans/${ID.plan}`); await page.waitForTimeout(2000);
    for (let i=0;i<2;i++){ await page.locator('ul button:has-text("Place")').first().click(); await page.getByRole("button",{name:"Place near the centre"}).click(); await page.waitForTimeout(250); }
    const fx = page.locator('ol:has(input) li').first().locator("input");
    const names = await fx.evaluateAll(i=>i.map(x=>x.getAttribute("aria-label")));
    for (const [idx, v] of [[0,"abc"],[0,"1,5"],[0,"0,25"],[1,"-0.2"],[2,"400"],[2,"abc"],[2,"90"]]) { const f = fx.nth(idx); await f.fill(v); await f.press("Tab"); await page.waitForTimeout(250);
      log("PLANBLUR", names[idx].slice(0,20), v, "inv", await f.getAttribute("aria-invalid"), "msg", await f.evaluate(e=>(e.getAttribute("aria-describedby")||"").split(" ").map(i=>document.getElementById(i)?.textContent.trim()).filter(Boolean).join(" / ")), "val", await f.inputValue()); }
    await page.locator("ol:has(input)").first().scrollIntoViewIfNeeded(); await shot(page, "plan-editor__field-errors", "1440");
    const s = page.locator("#unplaced-search, input[type=search]").last(); log("search count", await s.count());
    await s.fill("zzzq"); await page.waitForTimeout(300); log("plan empty search", await page.locator("main").innerText().then(t=>t.match(/Nothing matches[^\n]*/)?.[0]));
    await s.fill("");
    // keyboard: pin arrows
    await page.locator(".plan-pin").first().focus(); const before = await fx.nth(1).inputValue(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Shift+ArrowDown"); log("pin arrows y", before, "->", await fx.nth(1).inputValue(), "focus ring", await page.locator(".plan-pin").first().evaluate(e=>{const d=e.firstElementChild;return getComputedStyle(e).outlineStyle+" "+getComputedStyle(e).outlineWidth+" | dot "+getComputedStyle(d).boxShadow+" "+getComputedStyle(d).outlineStyle;}));
    await shot(page, "plan-editor__pin-focus", "1440");
    await page.getByRole("button",{name:"Save",exact:true}).click(); await page.waitForTimeout(1200); await page.evaluate(()=>scrollTo(0,0)); await shot(page,"plan-editor__save-invalid","1440");
    log("plan save alerts", await page.locator("[role=alert]").allInnerTexts());
    await browser.close(); }
  // GeoPicker in POI editor + route map
  { const { browser, page } = await start("1440"); log("=== g1 geopicker");
    await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(1500);
    const href = await page.locator('main a[href*="/pois/"]').first().getAttribute("href"); log("poi", href);
    await go(page, href); await page.waitForTimeout(3000);
    log("skip map", await page.getByRole("button",{name:/skip map/i}).count() + await page.getByRole("link",{name:/skip map/i}).count());
    const reg = page.locator("div.leaflet-container").first(); await reg.scrollIntoViewIfNeeded(); await shot(page, "poi-geopicker__default", "1440");
    await reg.focus(); const st=[]; for (let i=0;i<12;i++){ await page.keyboard.press("Tab"); st.push(await focusDesc(page)); } log("geopicker tabs", st);
    log("nearby", await page.locator("details, [data-nearby], h3:has-text('Nearby')").allInnerTexts().then(a=>a.map(x=>x.slice(0,80))));
    await page.goto(`http://localhost:5173/projects/${POP}/routes`); await page.waitForTimeout(1500);
    const rh = await page.locator('main a[href*="/routes/"]').first().getAttribute("href"); await go(page, rh); await page.waitForTimeout(3000);
    const rl = page.locator("[data-route-legend], :text('overlap')").first(); await page.locator("div.leaflet-container").first().scrollIntoViewIfNeeded(); await shot(page, "route-map__default", "1440");
    log("route map notes", await page.locator(".geo-map ~ p, .geo-map + p, [data-route-legend]").allInnerTexts());
    await axe(page, "route map");
    await browser.close(); }
} catch(e){ log("FAIL", e.message.slice(0,600)); } });
