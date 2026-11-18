import { open, go, P, settle, shot, save, PHASE } from "./h.mjs";
const res = {};
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of ["guides", "events", "categories"]) {
  await go(page, `/projects/${P}/${k}?create=1`);
  await page.waitForSelector("[role=dialog]", { timeout: 15000 });
  await settle(page, 600);
  const m = (slugOpen) => page.evaluate(() => {
    const d = document.querySelector("[role=dialog]");
    const r = (e) => e.getBoundingClientRect();
    const body = d.querySelector("[data-dialog-body]");
    const h = d.querySelector("h2");
    const close = [...d.querySelectorAll("button")].find((b) => /close/i.test(b.getAttribute("aria-label") || ""));
    const form = d.querySelector("form");
    const cs = body ? getComputedStyle(body) : null;
    const alerts = [...d.querySelectorAll("[role=alert]")].length;
    return {
      dialogTop: Math.round(r(d).top), dialogH: Math.round(r(d).height),
      bodyPadB: cs ? parseFloat(cs.paddingBottom) : null, bodyPadT: cs ? parseFloat(cs.paddingTop) : null,
      gapFormToBodyBottom: body && form ? Math.round(r(body).bottom - r(form).bottom) : null,
      bodyScrolls: body ? body.scrollHeight > body.clientHeight + 1 : null,
      closeCenterY: close ? Math.round(r(close).top + r(close).height / 2) : null, titleCenterY: h ? Math.round(r(h).top + r(h).height / 2) : null,
      closeRight: close ? Math.round(r(d).right - r(close).right) : null, alerts,
    };
  });
  const entry = { empty: await m() };
  await page.getByRole("button", { name: /^Edit (slug|code)/ }).click();
  await settle(page, 300);
  entry.slugOpen = await m();
  await shot(page, `dialog-${k}-slug-open__1440`);
  if (k === "categories") {
    entry.scopeDescribedBy = await page.evaluate(() => { const fs = document.querySelector("[role=dialog] fieldset[id]"); const ids = (fs.getAttribute("aria-describedby") || "").split(" "); return { ids, resolves: ids.every((i) => document.getElementById(i)) , text: ids.map((i) => document.getElementById(i)?.textContent) }; });
  }
  // empty submit: summary appears; measure jump of the Title field
  const before = await page.evaluate(() => Math.round(document.querySelector("[role=dialog] input").getBoundingClientRect().top));
  await page.getByRole("button", { name: /Create and open/ }).click();
  await settle(page, 500);
  entry.submitEmpty = { ...(await m()), titleInputJump: (await page.evaluate(() => Math.round(document.querySelector("[role=dialog] input").getBoundingClientRect().top))) - before, focus: await page.evaluate(() => document.activeElement.getAttribute("data-error-summary") !== null ? "summary" : document.activeElement.tagName) };
  if (k === "categories") entry.scopeErrDescribedBy = await page.evaluate(() => { const fs = document.querySelector("[role=dialog] fieldset[id]"); const ids = (fs.getAttribute("aria-describedby") || "").split(" "); return { ids, invalid: fs.getAttribute("aria-invalid"), resolves: ids.every((i) => document.getElementById(i)) }; });
  await shot(page, `dialog-${k}-empty-submit__1440`);
  // 503 on create
  await page.route("**/" + k, async (route) => { if (route.request().method() === "POST") await route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:SERVICE_UNAVAILABLE", title: "x", status: 503, code: "SERVICE_UNAVAILABLE", requestId: "req-p3b-503" }) }); else await route.fallback(); });
  await page.getByLabel(/^(Title|Name)/).first().fill("UX-R3-P3b offline probe");
  if (k === "categories") await page.getByRole("radio", { name: /Points of Interest/ }).check({ force: true });
  await page.getByRole("button", { name: /Create and open/ }).click();
  await settle(page, 800);
  entry.err503 = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const s = d.querySelector("[data-error-summary]"); return { text: s?.textContent.replace(/\s+/g, " ").trim(), alerts: d.querySelectorAll("[role=alert]").length, submit: [...d.querySelectorAll("button")].find((b) => /Create/.test(b.textContent))?.textContent.trim() }; });
  await shot(page, `dialog-${k}-503__1440`);
  await page.unroute("**/" + k);
  res[k] = entry;
}
await browser.close();
save("dialogs", res);
console.log(PHASE, JSON.stringify(res, null, 1));
