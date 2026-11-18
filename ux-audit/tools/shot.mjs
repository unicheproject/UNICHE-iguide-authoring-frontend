// Full-page screenshots of one CMS route at named viewports. Run with WINDOWS Node:
//   cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\tools\shot.mjs <account> <path> <outPrefix> [viewport...]"
// e.g. node ux-audit\tools\shot.mjs curator /projects/<id>/places ux-audit/round-0/shots/places__populated 1440 1024
// Writes <outPrefix>__<viewport>.png. Viewports: 1440 1280 1024 768 zoom200 (default: 1440).
import { open, go } from "./session.mjs";

const [account = "curator", path = "/", prefix = "shot", ...vps] = process.argv.slice(2);
for (const viewport of vps.length ? vps : ["1440"]) {
  const { browser, page } = await open(account, { viewport });
  await go(page, path);
  await page.waitForTimeout(800);
  const file = `${prefix}__${viewport}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
  await browser.close();
}
