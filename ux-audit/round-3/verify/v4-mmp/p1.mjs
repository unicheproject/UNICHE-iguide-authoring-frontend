import { go, shot, POP, PLAN, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1024"; const touch = process.argv[3] === "touch";
await run(async () => {
  const { page } = await start(vp, { touch });
  log("=== plan editor", vp, touch ? "touch" : "mouse");
  await go(page, `/projects/${POP}/floor-plans/${PLAN}`); await page.waitForTimeout(2500);
  await shot(page, `fp-editor__default${touch ? "-touch" : ""}`, vp);
  const unplaced = page.getByRole("button", { name: /^Place / });
  log("place buttons", await unplaced.count());
  await unplaced.first().click(); await page.waitForTimeout(700);
  const bar = await page.evaluate(box("[data-armed-bar]")); const plane = await page.evaluate(box(".plan-plane"));
  const hdr = await page.evaluate(() => [...document.querySelectorAll("header")].map(h => { const b = h.getBoundingClientRect(); return { y: Math.round(b.y), b: Math.round(b.bottom), pos: getComputedStyle(h).position }; }));
  log("ARMED bar", bar, "plane", plane, "intersect", bar && plane ? !(bar.b <= plane.y || bar.y >= plane.b) : "n/a", "viewport", await page.evaluate(() => [innerWidth, innerHeight]), "headers", hdr);
  await shot(page, `fp-editor__armed${touch ? "-touch" : ""}`, vp);
  const tap = (loc, position) => touch ? loc.tap({ position, timeout: 5000 }) : loc.click({ position, timeout: 5000 });
  await tap(page.locator(".plan-plane"), { x: 300, y: 200 }); await page.waitForTimeout(400);
  log("pins after plane click", await page.locator("[data-pin]").count());
  await unplaced.first().click(); await page.waitForTimeout(500);
  const pinLoc = page.locator("[data-pin]").last(); await pinLoc.scrollIntoViewIfNeeded();
  const pin = await pinLoc.boundingBox();
  await tap(pinLoc, { x: 16, y: 16 });
  await page.waitForTimeout(500);
  log("TAKEN note", await page.locator("[data-armed-bar]").innerText(), "live", await page.evaluate(() => [...document.querySelectorAll("[aria-live]")].map(l => l.textContent.trim().slice(0, 100))));
  await shot(page, `fp-editor__taken${touch ? "-touch" : ""}`, vp);
  const bar2 = await page.evaluate(box("[data-armed-bar]")); const plane2 = await page.evaluate(box(".plan-plane"));
  log("bar vs plane while taken", bar2, plane2, "intersect", !(bar2.b <= plane2.y || bar2.y >= plane2.b));
  await axe(page, `plan editor armed ${vp}`);
  await page.keyboard.press("Escape"); log("Place btn names", await page.getByRole("button", { name: /^Place / }).evaluateAll(a=>a.slice(0,3).map(x=>x.getAttribute("aria-label")||x.textContent.trim())), "focus", await focusDesc(page));
  // x / y copy and tidy
  await page.locator("#pos-0-x").fill("0,50000"); await page.locator("#pos-0-x").blur();
  log("x after blur", await page.locator("#pos-0-x").inputValue());
  await page.locator("#pos-0-x").fill("1,5"); await page.locator("#pos-0-x").blur(); await page.waitForTimeout(300);
  log("x error", await page.locator("#pos-0-x-error, [id^=pos-0-x][id$=error]").allInnerTexts());
  await page.locator("#pos-0-y").fill("0.0600"); await page.locator("#pos-0-y").blur();
  log("y after blur", await page.locator("#pos-0-y").inputValue());
  await shot(page, `fp-editor__errors${touch ? "-touch" : ""}`, vp);
  
});
