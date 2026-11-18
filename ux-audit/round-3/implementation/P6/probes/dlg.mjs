import { go, shot, POP, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1440"; const touch = process.argv[3] === "touch";
const nom = (rows) => ({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
await run(async () => {
  const { browser, page } = await start(vp, { touch });
  log("=== dialogs + lists", vp, touch ? "touch" : "mouse");
  const top = () => page.evaluate(() => { const d = document.querySelector('[role=dialog]'); const b = d.getBoundingClientRect(); return { y: Math.round(b.y), h: Math.round(b.height) }; });
  // lists
  await go(page, `/projects/${POP}/maps`); await page.waitForTimeout(2000);
  log("maps list cell", await page.locator("td, [role=cell]").filter({ hasText: "placed" }).first().innerText().catch(() => "?"));
  await shot(page, `maps-list${touch ? "-touch" : ""}`, vp);
  await go(page, `/projects/${POP}/floor-plans`); await page.waitForTimeout(2000);
  log("plans list cell", await page.locator("td, [role=cell]").filter({ hasText: "placed" }).first().innerText().catch(() => "?"));
  await shot(page, `plans-list${touch ? "-touch" : ""}`, vp);
  // New floor plan focus
  await page.getByRole("button", { name: "New floor plan" }).first().click(); await page.waitForTimeout(900);
  log("new plan first focus", await focusDesc(page));
  await shot(page, `new-plan${touch ? "-touch" : ""}`, vp);
  await axe(page, `new plan dialog ${vp}`);
  await page.keyboard.press("Escape");
  // Maps with /maps aborted
  await page.route(/localhost:8080\/iguide\/api\/v1\/projects\/[^/]+\/maps(\?|$)/, r => r.request().method() === "GET" ? r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status: 503, code: "UNAVAILABLE", detail: "secret", requestId: "req-P6-0001" }) }) : r.continue());
  await go(page, `/projects/${POP}/maps`); await page.waitForTimeout(2500);
  await shot(page, "dbg-maps-error", vp);
  log("maps error", await page.locator("body").innerText().then(t => t.replace(/\n+/g, " | ").slice(0, 420)));
  log("tab counts", await page.evaluate(() => [...document.querySelectorAll('[role=tablist] a, nav a')].filter(a => /Maps|Floor plans/.test(a.textContent)).map(a => a.textContent.trim())));
  await shot(page, `maps-error${touch ? "-touch" : ""}`, vp);
  const retry = page.getByRole("button", { name: "Try again" }); await retry.focus(); await page.unroute(/localhost:8080\/iguide\/api\/v1\/projects\/[^/]+\/maps(\?|$)/);
  await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
  log("focus after maps retry", await focusDesc(page));
  // New map dialog
  await page.route(/nominatim\.openstreetmap\.org/, async r => { const q = new URL(r.request().url()).searchParams.get("q"); if (q === "busy") return r.fulfill({ status: 429, body: "" }); if (q === "none") return r.fulfill(nom([])); return r.fulfill(nom([
    { place_id: 1, display_name: "Kerameikos, Athens, Greece", addresstype: "suburb", type: "archaeological_site", osm_type: "way", osm_id: 1, boundingbox: ["37.976", "37.980", "23.708", "23.716"] },
    { place_id: 2, display_name: "London Heathrow Airport, England", addresstype: "aeroway", type: "aerodrome", osm_type: "way", osm_id: 2, boundingbox: ["51.45", "51.49", "-0.50", "-0.40"] },
    { place_id: 3, display_name: "Naxos, Greece", addresstype: "island", type: "administrative", osm_type: "relation", osm_id: 3, boundingbox: ["36.9", "37.2", "25.3", "25.6"] }])); });
  await page.getByRole("button", { name: "New map" }).first().click(); await page.waitForTimeout(900);
  const t0 = await top(); log("dialog before", t0);
  await page.locator("#nm-q").fill("busy"); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
  log("after 429", await top(), await page.locator("[data-message-slot]").innerText());
  await page.locator("#nm-q").fill("none"); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
  log("after none", await top(), await page.locator("[data-message-slot]").innerText());
  await page.locator("#nm-q").fill("kera"); await page.keyboard.press("Enter"); await page.waitForTimeout(900);
  log("after results", await top());
  log("kinds", await page.locator('[aria-label="Search results"] li').allInnerTexts().then(a => a.map(t => t.split("\n").pop())));
  await page.locator('[aria-label="Search results"] button').first().click(); await page.waitForTimeout(900);
  log("after pick", await top());
  log("reset visible before typing", await page.getByRole("button", { name: "Reset to search result" }).count());
  await page.locator("#nm-s").fill("abc"); await page.locator("#nm-s").blur(); await page.waitForTimeout(400);
  log("reset visible after invalid", await page.getByRole("button", { name: "Reset to search result" }).count(), "err", await page.locator("#nm-s-error, [id^=nm-s][id$=error]").allInnerTexts());
  await shot(page, `new-map-invalid${touch ? "-touch" : ""}`, vp);
  await page.getByRole("button", { name: "Reset to search result" }).click(); await page.waitForTimeout(400);
  log("s after reset", await page.locator("#nm-s").inputValue(), "reset now", await page.getByRole("button", { name: "Reset to search result" }).count());
  await page.locator("#nm-w").fill("23,7080000"); await page.locator("#nm-w").blur(); log("w tidy", await page.locator("#nm-w").inputValue());
  await axe(page, `new map dialog ${vp}`);
  await shot(page, `new-map${touch ? "-touch" : ""}`, vp);
  await browser.close();
});
