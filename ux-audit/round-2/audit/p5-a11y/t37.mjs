import * as L from "./lib.mjs";
for (const rm of ["no-preference", "reduce"]) {
  const { page, browser } = await L.open("curator", { viewport: "1440", reducedMotion: rm });
  await L.nav(page, L.P(""), 800);
  await page.route(/\/api\/v1\/projects\/[^/]+\/(pois|places|routes).*/, async (r) => { await new Promise((x) => setTimeout(x, 6000)); r.continue(); });
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Points of Interest", exact: true }).click();
  await page.waitForTimeout(1200);
  const anims = await page.evaluate(() => document.getAnimations().map((a) => ({ type: a.constructor.name, name: a.animationName ?? a.transitionProperty, target: a.effect?.target?.className?.toString().slice(0, 60), dur: a.effect?.getTiming().duration, iter: a.effect?.getTiming().iterations })));
  L.log("t37", rm, "animations with skeleton:", JSON.stringify(anims.slice(0, 8)), "count", anims.length, "skeleton present", await page.locator("[class*=skeleton], [aria-busy=true], .animate-pulse").count());
  await L.shot(page, `poi-list__skeleton-${rm}__1440`);
  // spinner / loading in buttons
  // transitions: sample computed transition-duration across buttons
  L.log("t37", rm, "button transition-duration", await page.evaluate(() => { const b = document.querySelector("button"); return getComputedStyle(b).transitionDuration + " / scroll-behavior " + getComputedStyle(document.documentElement).scrollBehavior; }));
  // dialog open animation
  await page.waitForTimeout(6000);
  await page.getByRole("button", { name: /new point of interest/i }).click(); await page.waitForTimeout(60);
  const a2 = await page.evaluate(() => document.getAnimations().map((a) => (a.animationName ?? a.transitionProperty) + ":" + a.effect?.getTiming().duration));
  L.log("t37", rm, "dialog animations at +60ms:", JSON.stringify(a2.slice(0, 6)));
  await browser.close();
}
