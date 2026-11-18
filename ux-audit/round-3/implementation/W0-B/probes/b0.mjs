import { session, go, P, ids, LOG, stickyStack, names, shot } from "./h.mjs";
const log = LOG(process.argv[2] ?? "b0");
for (const vp of ["1440", "1280", "zoom200", "1024"]) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P(`/pois/${ids.poi2}`));
  await page.waitForSelector("[data-editor-primary]", { timeout: 20000 });
  // make it dirty so both Save buttons show
  await page.locator("#f-summary").fill("x").catch(() => {});
  await new Promise((r) => setTimeout(r, 400));
  const top = await page.evaluate(() => 0);
  log(vp, JSON.stringify(await stickyStack(page)));
  const n = await names(page);
  log(vp, "Save draft count:", n.filter((x) => /^Save draft$/.test(x)).length, n.filter((x) => /Save draft/.test(x)));
  await shot(page, `before-chrome-${vp}`);
  await browser.close();
}
