import { fresh, uiSignIn, shot, CMS } from "./lib.mjs";
const { browser, context, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", API = "http://localhost:8080/iguide/api/v1";
const prob = (status, code, detail) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status, code, detail, requestId: "req-R2-p2-" + status }) });
// safety: no write ever reaches the server
await page.route((u)=>u.href.startsWith(API), (r)=> r.request().method()==="GET" ? r.continue() : r.fulfill(prob(403,"FORBIDDEN","Not allowed for secret-user-123")));
await page.goto(`${CMS}/projects/${P}/pois`); await page.waitForTimeout(4000);
await page.locator("main a", { hasText: "Parthenon Frieze" }).first().click(); await page.waitForTimeout(5000);
const title = page.getByLabel(/^Title/).first();
await title.click(); await page.keyboard.press("End"); await page.keyboard.type(" X"); await page.waitForTimeout(500);
await shot(page, "editor__dirty-before-switch", "1440", false);
// switch project with unsaved work
await page.getByRole("button", { name: /Switch project/ }).click(); await page.waitForTimeout(500);
await page.keyboard.type("Empty B"); await page.waitForTimeout(500); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
await shot(page, "switcher__leave-dialog-unsaved", "1440", false);
console.log("dialogs:", await page.locator("[role=dialog],[role=alertdialog]").count(), "popover list visible:", await page.getByPlaceholder("Search projects").count());
console.log("dialog:", (await page.locator("[role=alertdialog],[role=dialog]").first().innerText().catch(()=>"none")).replace(/\n+/g," | "));
await page.getByRole("button", { name: /stay|cancel|keep/i }).first().click().catch(()=>{}); await page.waitForTimeout(800);
console.log("after stay url:", page.url().slice(-40));
// Save draft with 403
const save = page.getByRole("button", { name: /Save draft/ }).first();
await save.click(); await page.waitForTimeout(2500);
await shot(page, "editor__save-403", "1440", false);
console.log("SAVE403:", (await page.evaluate(()=>document.body.innerText)).split("\n").filter(l=>/not saved|permission|access|Request id|secret|could not/i.test(l)).join(" | "));
// offline controls
await context.setOffline(true); await page.waitForTimeout(1500);
console.log("offline disabled:", await page.evaluate(()=>[...document.querySelectorAll("button")].filter(b=>/Save draft|Apply changes|Discard/.test(b.textContent)).map(b=>b.textContent.trim().slice(0,20)+":"+(b.disabled||b.getAttribute("aria-disabled")))));
await shot(page, "editor__offline", "1440", false);
await context.setOffline(false);
// discard dirty: reload with Leave
await browser.close();
