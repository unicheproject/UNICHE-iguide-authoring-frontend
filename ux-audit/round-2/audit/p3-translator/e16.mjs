import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
const head = async () => (await page.locator("main").innerText()).split("\n").slice(0,12).join(" / ");
await go(page, `/projects/${PID}/pois/${ids.poi2}`);
await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(2000);
await page.getByRole("button", { name: "Apply changes" }).click(); await page.waitForTimeout(1200);
const dlg = page.locator("[role=dialog], [role=alertdialog]");
console.log("dialog count", await dlg.count());
if (await dlg.count()) { console.log((await dlg.first().innerText()).replace(/\n+/g," | ").slice(0,500)); await shot(page, "poi-active__apply-dialog"); await dlg.first().getByRole("button", { name: /Apply/ }).last().click(); }
await page.waitForTimeout(3000);
console.log("after apply:", await head());
await shot(page, "poi-active__after-apply");
await browser.close();
