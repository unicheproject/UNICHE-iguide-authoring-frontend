import { open, go, shot, settle, path } from "./lib2.mjs";
const key = process.argv[2]; const tag=process.argv[3]??"tall";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1500});
  await go(page, path(key)); await settle(page,2000);
  await shot(page, `${key}__${tag}__1440x1500`);
} finally { await browser.close(); }
