import { open, go, P, settle, shot, save } from "./h.mjs";
const out = {};
const fd = (page) => page.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { tag: e.tagName, label: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30), outline: cs.outlineStyle + " " + cs.outlineWidth, inView: r.top >= 0 && r.bottom <= innerHeight }; });
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/categories`); await page.waitForSelector("[data-row-id]"); await settle(page, 500);
// Tab flow into the first rows
const stops = [];
await page.locator("main h1").focus();
for (let i = 0; i < 16; i++) { await page.keyboard.press("Tab"); stops.push(await fd(page)); }
out.tabStops = stops.map((s) => `${s.tag}:${s.label}:${s.outline}:${s.inView}`);
await shot(page, "categories-keyboard-focus__1440");
// New category with keyboard, scope radios, Esc returns focus
await go(page, `/projects/${P}/categories`); await page.waitForSelector("[data-row-id]");
await page.getByRole("button", { name: "New category" }).focus(); await page.keyboard.press("Enter"); await settle(page, 500);
out.dialogOpenFocus = await fd(page);
await page.keyboard.press("Escape"); await settle(page, 400);
out.afterEscFocus = await fd(page);
// Home/End in category editor radio chips
const firstCat = await page.locator("[data-row-id] a").first().getAttribute("href");
await go(page, firstCat); await page.waitForSelector("fieldset"); await settle(page, 800);
const radios = page.locator("fieldset input[type=radio]");
if (await radios.count()) {
  const y0 = await page.evaluate(() => scrollY);
  await radios.first().focus(); await page.keyboard.press("End");
  out.radioEnd = { focus: await fd(page), checked: await page.evaluate(() => document.activeElement.checked), scrollDelta: (await page.evaluate(() => scrollY)) - y0 };
  await page.keyboard.press("Home");
  out.radioHome = { focus: await fd(page), checked: await page.evaluate(() => document.activeElement.checked), scrollDelta: (await page.evaluate(() => scrollY)) - y0 };
}
await browser.close();
save("keyboard", out);
console.log(JSON.stringify(out, null, 1));
