import { open, go, shot, settle, measure, dash, mock, emptyPage, problem, text, T, P } from "./h.mjs";
import { writeFileSync, appendFileSync } from "node:fs";
const LOG = new URL("./a2.log", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
writeFileSync(LOG, "");
const log = (...a) => { console.log(...a); appendFileSync(LOG, a.join(" ") + "\n"); };

// 1. pristine
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await mock(page, T, async (sub, q) => {
    if (/^\/(places|pois|routes|guides|events|categories|assets|maps|floor-plans)$/.test(sub)) return { json: emptyPage(Number(new URLSearchParams(q).get("size") ?? 1)) };
    if (sub === "/readiness") return { json: { activatable: true, blocking: [], warnings: [] } };
  });
  await page.evaluate(() => { try { localStorage.clear(); } catch {} }).catch(() => {});
  await go(page, dash(T)); await settle(page, 2500);
  await shot(page, `dashboard__pristine__${vp}`);
  if (vp === "1440") { log("PRISTINE text:\n" + await text(page)); log(JSON.stringify(await measure(page))); }
  await browser.close();
}
// 2. blocked
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  const long = "UX-R3-s8 " + "Very long title for a Point of Interest that keeps going ".repeat(4);
  const rid = (n) => "00000000-0000-4000-8000-00000000000" + n;
  await mock(page, P, async (sub) => {
    if (sub === "/readiness") return { json: { activatable: false, blocking: [
      { resourceType: "POI", resourceId: rid(1), title: long, languageCode: "en", path: "translations.en.title", code: "MISSING_DEFAULT_LANGUAGE_VALUE" },
      { resourceType: "PLACE", resourceId: rid(2), title: "Ακρόπολη – Ψηφιδωτό", languageCode: null, path: "translations.el.name", code: "MISSING_DEFAULT_LANGUAGE_VALUE" },
      { resourceType: "GUIDE", resourceId: rid(3), title: "مرشد المتحف", languageCode: null, path: "blocks", code: "MISSING_DEFAULT_LANGUAGE_VALUE" },
      { resourceType: "PROJECT", resourceId: null, title: null, languageCode: null, path: "surfaces", code: "NO_SURFACE_ENABLED" },
      { resourceType: "MAP", resourceId: null, title: null, languageCode: null, path: "bounds", code: "TEMPLATE_VALIDATION_FAILED" },
    ], warnings: [] } };
  });
  await go(page, dash(P)); await settle(page, 2500);
  await shot(page, "dashboard__blocked5__1440"); log("BLOCKED5 text:\n" + (await text(page)).slice(0, 1200));
  await page.getByRole("button", { name: /and 2 more/ }).click(); await settle(page, 400);
  await shot(page, "dashboard__blocked5-expanded__1440");
  log("link targets:", JSON.stringify(await page.$$eval("section[data-state=blocked] a", a => a.map(x => x.textContent.trim().slice(0,30) + " -> " + x.getAttribute("href")))));
  await page.setViewportSize({ width: 1024, height: 768 }); await settle(page, 500); await shot(page, "dashboard__blocked5__1024");
  await page.setViewportSize({ width: 640, height: 360 }); await settle(page, 500); await shot(page, "dashboard__blocked5__zoomlike640");
  await browser.close();
}
{ // blocked, 1 item unlinked
  const { browser, page } = await open("admin", { viewport: "1440" });
  await mock(page, P, async (sub) => sub === "/readiness" ? { json: { activatable: false, blocking: [{ resourceType: "MAP", resourceId: null, title: null, languageCode: null, path: "bounds", code: "TEMPLATE_VALIDATION_FAILED" }], warnings: [] } } : undefined);
  await go(page, dash(P)); await settle(page, 2500);
  await shot(page, "dashboard__blocked1-unlinked__1440"); log("BLOCKED1 text:\n" + (await text(page)).slice(0, 500));
  const b = page.getByRole("button", { name: "Fix the first issue" });
  log("fix btn disabled attrs:", await b.evaluate(e => JSON.stringify({ dis: e.disabled, aria: e.getAttribute("aria-disabled"), title: e.title, desc: e.getAttribute("aria-describedby") })));
  await b.hover(); await settle(page, 800); await shot(page, "dashboard__blocked1-hover__1440", false);
  await browser.close();
}
console.log("done");
