import { open, go, shot, E, P, text } from "./lib.mjs";
// uninitialized simulation
{
  const { browser, page } = await open("curator", { viewport: "1440" });
  await page.route(new RegExp(`/api/v1/projects/${E}$`), async (r) => { const res = await r.fetch(); const j = await res.json(); j.initialized = false; j.template = null; j.initializedAt = null; r.fulfill({ response: res, json: j }); });
  await go(page, `/projects/${E}`); await page.waitForTimeout(3000);
  await shot(page, "emp__uninitialized-sim__1440", false); console.log(await text(page));
  await browser.close();
}
// keyboard run on populated with warnings open
{
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${P}`); await page.waitForTimeout(3000);
  await page.getByText(/^Warnings \(/).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  await shot(page, "pop__warnings-open__1440", true);
  const n = await page.locator("details li").count(); console.log("warning li", n);
  const h = await page.evaluate(() => document.querySelector("details").getBoundingClientRect().height); console.log("details height", h);
  const sample = await page.locator("details li").evaluateAll(l => l.slice(0, 6).map(e => e.innerText.replace(/\s+/g, " ")));
  console.log(sample);
  await page.keyboard.press("Tab"); await shot(page, "pop__focus-first-warning-link__1440", false);
  await page.mouse.wheel(0, 99999); await page.waitForTimeout(300);
  await shot(page, "pop__warnings-end__1440", false);
  await browser.close();
}
