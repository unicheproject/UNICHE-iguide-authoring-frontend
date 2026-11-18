import { open, go } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const ID="600c4311-3e81-4235-91b0-5b3e336918fc";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/"+ID);
await page.waitForTimeout(1500);
await page.getByRole("link",{name:/Add a Place/}).or(page.getByRole("button",{name:/Add a Place/})).first().click();
await page.waitForTimeout(1500);
console.log("url", page.url());
await shot(page, "firstrun-place__create-dialog__1440");
console.log("DIALOG\n", await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText));
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,160)));
// empty submit
const dlg = page.getByRole("dialog");
await dlg.getByRole("button",{name:/^(Create|Add|Save)/}).last().click();
await page.waitForTimeout(600);
await shot(page, "firstrun-place__dialog-empty-error__1440");
console.log("ERR\n", await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText));
await browser.close();
