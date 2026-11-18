import { open, go, shot, log, P, focused, VIEWPORTS } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1280" });
async function scroll(){ return page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, h:document.querySelector("header")?.getBoundingClientRect().height})); }
await go(page, `/projects/${P}`); await page.waitForSelector("nav#workspace-nav",{timeout:60000}); await page.waitForTimeout(2000);
for (const vp of ["1280","1024","768","zoom200"]) {
  await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height});
  await page.waitForTimeout(500);
  await shot(page, `workspace__dashboard__${vp}`);
  log(vp, JSON.stringify(await scroll()));
  // picker open
  await page.locator("header button[aria-controls=project-switcher-menu]").click(); await page.waitForTimeout(300);
  await shot(page, `picker__open__${vp}`);
  const box = await page.locator("#project-switcher-menu").boundingBox(); log(vp,"picker box", JSON.stringify(box));
  await page.keyboard.press("Escape");
  // menu disclosure on small
  const menuBtn = page.getByRole("button",{name:/Menu/});
  if (await menuBtn.isVisible().catch(()=>false)) { await menuBtn.click(); await page.waitForTimeout(300); await shot(page, `nav__disclosure-open__${vp}`); await menuBtn.click(); }
  // user menu
  await page.locator("header button[aria-haspopup=menu]").click(); await page.waitForTimeout(300);
  await shot(page, `header__user-menu__${vp}`);
  await page.keyboard.press("Escape"); await page.mouse.click(5,5);
}
await browser.close();
