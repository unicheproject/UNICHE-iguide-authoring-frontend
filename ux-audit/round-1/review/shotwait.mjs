import { open, go } from "../../tools/session.mjs";
const [path, out, vp = "1440"] = process.argv.slice(2);
const { browser, page } = await open("curator", { viewport: vp });
await go(page, path);
await page.waitForTimeout(6000);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
