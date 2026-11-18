import * as H from "./h.mjs";
const { browser, page } = await H.session();
await H.go(page, H.P("/pois/" + H.ids.poi)); await H.sleep(1800);
await page.getByRole("button", { name: "Restore as draft" }).first().click(); await H.sleep(1500);
console.log(await H.msgs(page));
await browser.close();
