import { open, go, P, settle, shot, focusDesc, save } from "./h.mjs";
const res = {};
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("[data-row-id]"); await settle(page, 800);
  await shot(page, `pois-populated__${vp}`);
  await go(page, `/projects/${P}/pois?q=zzzznomatch&status=DRAFT`); await settle(page, 1200);
  await shot(page, `pois-filtered-empty__${vp}`);
  res[`empty@${vp}`] = await page.evaluate(() => document.querySelector("main h2")?.parentElement?.innerText.replace(/\n+/g, " | "));
  // error state
  await page.route(/\/pois\?/, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status: 503, code: "UNAVAILABLE", requestId: "req-p3core" }) }));
  await go(page, `/projects/${P}/pois`); await settle(page, 1500);
  res[`error@${vp}`] = { focus: await focusDesc(page), card: await page.evaluate(() => document.querySelector("[role=alert]")?.innerText.replace(/\n+/g, " | ")) };
  await shot(page, `pois-error__${vp}`);
  await page.getByRole("button", { name: "Try again" }).click().catch(() => {});
  res[`errorRetryFocus@${vp}`] = await focusDesc(page);
  await browser.close();
}
{ // forced colours + reduced motion flash
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/pois?pending=1`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  await page.getByRole("button", { name: /^Filters/ }).click(); await settle(page, 400);
  await shot(page, "filters-popover-forced-colours__1440");
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440", reducedMotion: "reduce" });
  await go(page, `/projects/${P}/pois?page=3`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  await page.getByRole("button", { name: "Actions for UX-R3-P3core Move A" }).click();
  await page.getByRole("menuitem", { name: "Move up" }).click(); await settle(page, 700);
  res.flashReduced = await page.evaluate(() => { const td = document.querySelector(".list-flash > td"); return td ? { shadow: getComputedStyle(td).boxShadow, anim: getComputedStyle(td).animationName } : null; });
  await shot(page, "move-flash-reduced-motion__1440");
  // keyboard: undo via Tab to Undo and Enter, record focus
  const log = [];
  await page.getByRole("button", { name: /^Undo/ }).focus(); log.push(await focusDesc(page));
  await page.keyboard.press("Enter"); await settle(page, 1200); log.push(await focusDesc(page));
  res.keyboardUndo = log;
  await browser.close();
}
save("shots", res);
console.log(JSON.stringify(res, null, 1));
