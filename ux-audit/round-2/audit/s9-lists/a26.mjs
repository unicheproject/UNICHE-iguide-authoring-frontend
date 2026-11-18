import { open, go, shot, POP, focusDesc } from "./lib.mjs";
for (const vp of ["zoom200", "768", "1024"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  for (const [k, btn] of [["categories", "New category"], ["pois", "New point of interest"]]) {
    await go(page, `/projects/${POP}/${k}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(700);
    await page.getByRole("button", { name: btn, exact: true }).first().click(); await page.waitForTimeout(600);
    const d = page.getByRole("dialog");
    const m = await d.evaluate((e) => { const r = e.getBoundingClientRect(); const f = [...e.querySelectorAll("button")].find((b) => /Create and open/.test(b.textContent)); const fr = f.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), vh: innerHeight, createBottom: Math.round(fr.bottom), createVisible: fr.bottom <= innerHeight && fr.top >= 0 }; });
    console.log(vp, k, JSON.stringify(m), "focus", await focusDesc(page));
    await shot(page, `create-${k}__open`, vp);
    await d.getByRole("button", { name: "Create and open" }).click(); await page.waitForTimeout(600);
    console.log("  after empty submit focus:", await focusDesc(page), "| summary in view:", await d.locator("[data-error-summary]").evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }).catch(() => "n/a"));
    await shot(page, `create-${k}__empty-submit`, vp);
    await page.keyboard.press("Escape");
  }
  // lists
  for (const k of ["places", "events"]) { await go(page, `/projects/${POP}/${k}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(700); await shot(page, `${k}-list__top`, vp); }
  await browser.close();
}
