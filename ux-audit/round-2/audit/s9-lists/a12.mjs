import { open, go, POP } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(1500);
const b = page.locator("button[aria-label^='Actions for']").first();
console.log(await b.evaluate((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const p = e.parentElement.getBoundingClientRect(); const af = getComputedStyle(e, "::after"); return { r: [r.width, r.height], cls: e.className, pad: cs.padding, parent: [p.width, p.height], after: [af.content, af.width, af.height, af.position], minw: cs.minWidth, cell: e.closest("td")?.getBoundingClientRect().width }; }));
const r = await b.boundingBox();
for (const [dx, dy] of [[-12, 0], [12, 0], [0, -12], [0, 12], [22, 22]]) {
  const hit = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); return el ? el.tagName + ":" + (el.closest("button")?.getAttribute("aria-label") ?? el.className.toString().slice(0, 30)) : null; }, [r.x + 9 + dx, r.y + 9 + dy]);
  console.log(dx, dy, hit);
}
await browser.close();
