import { open, go, P, OUT } from "./lib.mjs";
for (const [name, id] of Object.entries(P)) for (const vp of ["1440", "1024"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${id}`);
  await page.waitForSelector("h1");
  await page.waitForTimeout(1500);
  console.log(name, vp, page.url());
  await page.screenshot({ path: `${OUT}${name}-${vp}.png`, fullPage: true });
  await browser.close();
}
