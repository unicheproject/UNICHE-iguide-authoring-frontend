import { open, go, P, OUT, shot, save, API } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const out = { vp };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const active = () => page.evaluate(() => { const e = document.activeElement; const dlg = e.closest("[role=dialog]"); return { tag: e.tagName, label: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 40), inDialog: !!dlg }; });
const dialogTop = () => page.evaluate(() => Math.round(document.querySelector("[role=dialog]").getBoundingClientRect().top));
let mode = "fail"; let puts = 0;
await page.route(`**/projects/${P}/assets`, async (route) => {
  if (route.request().method() !== "POST") return route.continue();
  if (mode === "hang") { await new Promise((r) => setTimeout(r, 6000)); return route.abort(); }
  if (mode === "fail") { await new Promise((r) => setTimeout(r, 700)); return route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:UNAVAILABLE", code: "UNAVAILABLE", title: "x", status: 503, requestId: "req-p7a" }) }); }
  return route.continue();
});
await page.route(`**/projects/${P}/assets/*`, async (route) => {
  if (route.request().method() !== "PUT") return route.continue();
  puts++;
  return route.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:VALIDATION_ERROR", code: "VALIDATION_ERROR", title: "Validation", status: 422, requestId: "req-422", errors: [{ path: "translations.en.alternativeText", code: "INVALID", message: "Alternative text must not begin with an image prefix." }] }) });
});
await go(page, `/projects/${P}/media`); await page.waitForTimeout(1500);
await page.getByRole("button", { name: /^Upload files$/ }).first().click(); await page.waitForTimeout(800);
const dlg = page.getByRole("dialog");
out.topEmpty = await dialogTop();
out.limits = await dlg.locator("table").innerText();
await shot(page, `upload-empty__${vp}`);
const input = dlg.locator("input[type=file][aria-label='Files to upload']");
// A: three files that fail with 503; Cancel the queued third
mode = "hang";
await input.setInputFiles([1, 2, 3].map((i) => ({ name: `UX-R3-P7a hold ${i}.png`, mimeType: "image/png", buffer: png })));
await page.waitForTimeout(600);
out.topRows = await dialogTop();
await dlg.getByRole("button", { name: /^Cancel, UX-R3-P7a hold 3/ }).focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(400);
out.afterCancelQueued = await active();
// Cancel remaining with keyboard
await dlg.getByRole("button", { name: "Cancel remaining" }).focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(500);
out.afterCancelRemaining = await active();
await page.keyboard.press("Tab"); out.tabAfter = await active();
await shot(page, `upload-cancelled__${vp}`);
// Retry (failing) then retry succeeding
mode = "ok";
await dlg.getByRole("button", { name: /^Retry, UX-R3-P7a hold 3/ }).focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(150);
out.afterRetryStart = await active();
await page.waitForTimeout(2500);
out.afterRetryDone = await active();
out.summary = await dlg.locator("span.tabular.mr-auto").innerText();
// held file: one-line "Needs your decision"
await input.setInputFiles({ name: "UX-R3-P7a tool.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
await page.waitForTimeout(600);
out.held = await page.evaluate(() => { const li = document.querySelector("li[data-state=held]"); const s = [...li.querySelectorAll("span")].find((x) => /Needs your decision/.test(x.textContent)); const b = s.getBoundingClientRect(); return { h: Math.round(b.height), w: Math.round(b.width) }; });
out.topHeld = await dialogTop();
await shot(page, `upload-held__${vp}`);
await dlg.getByRole("button", { name: "Skip, UX-R3-P7a tool.exe" }).click();
// Describe now with 422
await dlg.getByRole("button", { name: /^Describe now/ }).click(); await page.waitForTimeout(500);
const d2 = page.getByRole("dialog").last();
await d2.getByRole("textbox").fill("Image of a pixel"); 
await d2.getByRole("button", { name: /Save and/ }).click(); await page.waitForTimeout(700);
out.describe = await page.evaluate(() => { const d = [...document.querySelectorAll("[role=dialog]")].pop(); const ta = d.querySelector("textarea"); const msg = ta && document.getElementById(ta.getAttribute("aria-describedby")?.split(" ").pop() ?? ""); return { invalid: ta?.getAttribute("aria-invalid"), describedText: ta?.getAttribute("aria-describedby") && ta.getAttribute("aria-describedby").split(" ").map((i) => document.getElementById(i)?.textContent.trim()), tryAgain: [...d.querySelectorAll("button")].some((b) => /try again/i.test(b.textContent)), alerts: d.querySelectorAll("[role=alert]").length, hint: d.textContent.includes("“image of”") }; });
await shot(page, `describe-422__${vp}`);
save("upload-" + vp, out);
console.log(JSON.stringify(out, null, 1));
await browser.close();
