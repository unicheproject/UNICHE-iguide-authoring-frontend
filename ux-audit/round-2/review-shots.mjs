import { open, go } from "../tools/session.mjs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin");
for (const [path, name] of [[P, "dashboard"], [P + "/pois", "pois"], [P + "/pois/546c5177-effd-49c8-acae-85d751f89bbe", "poi-editor"], [P + "/media", "media"], [P + "/preview", "preview"]]) {
  await go(page, path); await page.waitForTimeout(6000);
  await page.screenshot({ path: `ux-audit/round-2/review/${name}__1440.png` });
}
await browser.close();
