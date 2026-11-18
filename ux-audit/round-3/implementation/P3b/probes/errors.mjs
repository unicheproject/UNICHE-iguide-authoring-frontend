import { open, go, P, KINDS, settle, shot, save } from "./h.mjs";
const out = {};
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    const rx = new RegExp(`/api/v1/projects/${P}/${k}(\\?|$)`);
    await page.route((u) => rx.test(u.toString()), (route) => route.request().method() === "GET" ? route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:SERVICE_UNAVAILABLE", title: "x", status: 503, code: "SERVICE_UNAVAILABLE", requestId: "req-p3b-list" }) }) : route.fallback());
    await go(page, `/projects/${P}/${k}`); await settle(page, 1500);
    out[`${k}@${vp}`] = await page.evaluate(() => ({ active: document.activeElement.tagName + ":" + document.activeElement.textContent.slice(0, 40), body: document.querySelector("main")?.innerText.replace(/\s+/g, " ").slice(0, 200), reqIdRows: (document.querySelector("main")?.innerText.match(/Request id/g) ?? []).length }));
    await shot(page, `${k}-error__${vp}`);
    await page.unrouteAll();
  }
  // optional read failure notice (triggers) for Guides/Events
  if (vp === "1440") for (const k of ["guides", "events"]) {
    await page.route((u) => /\/triggers/.test(u.toString()) && /\/api\//.test(u.toString()), (route) => route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:SERVICE_UNAVAILABLE", title: "x", status: 503, code: "SERVICE_UNAVAILABLE", requestId: "req-p3b-trg" }) }));
    await go(page, `/projects/${P}/${k}`); await settle(page, 1800);
    out[`${k}-triggers-503`] = await page.evaluate(() => ({ rows: document.querySelectorAll("[data-row-id]").length, notice: [...document.querySelectorAll("main [role=alert], main h2")].map((e) => e.textContent.replace(/\s+/g, " ").slice(0, 160)), chipsText: document.querySelector("[data-row-id]")?.innerText.includes("Triggers not loaded") }));
    await shot(page, `${k}-triggers-503__1440`);
    await page.unrouteAll();
  }
  await browser.close();
}
save("errors", out);
console.log(JSON.stringify(out, null, 1));
