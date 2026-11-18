import { go, shot, POP, run, log, start, axe, box, focusDesc, nom, RES } from "./lib.mjs";
const vp = process.argv[2] || "1440"; const touch = process.argv[3] === "touch";
const create = process.argv[4] === "create";
await run(async () => {
  const { browser, page } = await start(vp, { touch });
  log("=== M1 maps list + new map", vp, touch ? "touch" : "mouse");
  await go(page, `/projects/${POP}/maps`); await page.waitForTimeout(2500);
  await shot(page, "maps-list__default", vp);
  log("list text", (await page.locator("main").innerText()).replace(/\n+/g, " | ").slice(0, 700));
  log("list landmarks main", await page.locator("main,[role=main]").count());
  await axe(page, `maps list ${vp}`);
  await page.route(/nominatim\.openstreetmap\.org/, async r => { const q = new URL(r.request().url()).searchParams.get("q"); if (q === "busy") return r.fulfill({ status: 429, body: "" }); if (q === "none") return r.fulfill(nom([])); return r.fulfill(nom(RES)); });
  await page.getByRole("button", { name: "New map" }).first().click(); await page.waitForTimeout(900);
  const top = () => page.evaluate(() => { const d = document.querySelector('[role=dialog]'); const b = d.getBoundingClientRect(); return { y: Math.round(b.y), h: Math.round(b.height), b: Math.round(b.bottom), vh: innerHeight }; });
  log("dialog open", await top(), "focus", await focusDesc(page));
  await shot(page, "new-map__open", vp);
  await page.locator("#nm-q").fill("busy"); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
  log("429", await top(), await page.locator("[data-message-slot]").innerText());
  await shot(page, "new-map__search-429", vp);
  await page.locator("#nm-q").fill("kera"); await page.keyboard.press("Enter"); await page.waitForTimeout(900);
  log("kinds", await page.locator('[aria-label="Search results"] li').allInnerTexts().then(a => a.map(t => t.replace(/\n/g," / "))));
  await page.locator('[aria-label="Search results"] button').first().click(); await page.waitForTimeout(900);
  await page.locator("#nm-s").fill("abc"); await page.locator("#nm-s").blur(); await page.waitForTimeout(400);
  log("reset visible after invalid", await page.getByRole("button", { name: /Reset/ }).count());
  await shot(page, "new-map__invalid", vp);
  await page.getByRole("button", { name: /Reset/ }).first().click(); await page.waitForTimeout(300);
  await page.locator("#nm-w").fill("23,7080000"); await page.locator("#nm-w").blur(); log("w tidy", await page.locator("#nm-w").inputValue());
  await page.locator("#nm-w").fill("23.708"); await page.locator("#nm-w").blur();
  log("nm fields", await page.evaluate(() => [...document.querySelectorAll('[role=dialog] input')].map(i => i.id + "=" + i.value)));
  await axe(page, `new map dialog ${vp}`);
  log("buttons", await page.locator('[role=dialog] button').allInnerTexts());
  // focus ring on primary
  const prim = page.locator('[role=dialog] [data-variant=primary], [role=dialog] button:has-text("Create")').last();
  await prim.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  log("primary ring", await prim.evaluate(e => { const s = getComputedStyle(e); return { outline: s.outlineColor, w: s.outlineWidth, off: s.outlineOffset, style: s.outlineStyle, shadow: s.boxShadow.slice(0,80), text: e.textContent.trim() }; }));
  await shot(page, "new-map__primary-focus", vp);
  if (create) {
    await page.locator("#nm-name").fill("UX-R3V-v4 Map").catch(async () => { log("name ids", await page.evaluate(() => [...document.querySelectorAll('[role=dialog] input')].map(i => i.id))); });
    await page.getByRole("button", { name: /^Create/ }).last().click(); await page.waitForTimeout(3500);
    log("after create url", page.url());
  }
  await browser.close();
});
