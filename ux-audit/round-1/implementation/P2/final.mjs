import { open, go, bearer, API } from "../../../tools/session.mjs";
const EMPTY_C = "ceee1b24-e7c4-474e-93ba-f77067ed8a72";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${EMPTY_C}`); await page.waitForTimeout(1500);
const token = await bearer(page);
const r = await fetch(`${API}/projects/${EMPTY_C}/places`, { method: "POST", headers: { Authorization: token, "Content-Type": "application/json" },
  body: JSON.stringify({ slug: "ux-p2-place", type: "SITE", environment: "OUTDOOR", title: "UX-P2 Place", parentPlaceId: null }) });
console.log(r.status, (await r.text()).slice(0, 200));
await go(page, `/projects/${EMPTY_C}`); await page.waitForTimeout(2500);
await page.screenshot({ path: "ux-audit/round-1/implementation/P2/after/empty-c-after-place__1440.png", fullPage: true });
console.log(await page.locator("[data-step]").evaluateAll((l) => l.map((e) => e.dataset.step + ":" + e.dataset.state)));
await browser.close();
