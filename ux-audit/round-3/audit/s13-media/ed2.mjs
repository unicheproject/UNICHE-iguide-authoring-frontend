import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/media/c6cccb66-be81-4a35-93db-c06072a5bafc`); await page.waitForTimeout(2500);
const rd = () => page.evaluate(() => ({ head: document.querySelector("header, [data-editor-header]")?.innerText.replace(/\n+/g," | ").slice(0,160), tab: [...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\n+/g," ")), act: (b => b && { dis: b.disabled, aria: b.getAttribute("aria-disabled"), t: b.textContent.trim() })([...document.querySelectorAll("button")].find(b=>/^Activate/.test(b.textContent.trim()))) }));
console.log("0", JSON.stringify(await rd()));
// chip click shows list
const alt = page.locator("textarea").first();
await alt.click(); await page.keyboard.type("A one by one test pixel");
await page.waitForTimeout(300);
console.log("typed", JSON.stringify(await rd()));
await shot(page, `editor__typed-alt__${vp}`);
// Greek tab
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(400);
console.log("el tab", await page.evaluate(()=>({dec: [...document.querySelectorAll("input[type=checkbox]")].map(c=>c.closest("label")?.textContent.trim().slice(0,20)+":"+c.disabled), name: [...document.querySelectorAll("input")].map(i=>i.id+":"+i.disabled+":"+i.readOnly).slice(0,6), banner: document.querySelector("main")?.innerText.match(/Source[^\n]*|default language[^\n]*/g)})));
await shot(page, `editor__greek-tab__${vp}`);
await page.getByRole("tab", { name: /English/ }).click();
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(1500);
console.log("saved", JSON.stringify(await rd()));
console.log("toast", await page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert],[data-sonner-toast],li[role=status]")].map(e=>e.textContent.trim().slice(0,80))));
console.log("focus", await page.evaluate(()=>document.activeElement.tagName+" "+document.activeElement.textContent.trim().slice(0,30)));
await shot(page, `editor__saved__${vp}`);
// Replace on draft
console.log("replace btn", await page.getByRole("button", { name: /Replace file/ }).count());
// used in hint
await page.getByRole("button", { name: /Used in|Why/i }).first().click().catch(()=>{}); await page.waitForTimeout(400);
console.log("hint", await page.evaluate(()=>[...document.querySelectorAll("[role=tooltip],[role=dialog],[data-radix-popper-content-wrapper]")].map(e=>e.textContent.trim().slice(0,260))));
await shot(page, `editor__usedin-hint__${vp}`);
await page.keyboard.press("Escape");
// Activate
await page.getByRole("button", { name: /^Activate/ }).first().click(); await page.waitForTimeout(1200);
console.log("dlg", await page.evaluate(()=>document.querySelector("[role=dialog],[role=alertdialog]")?.innerText.replace(/\n+/g," | ")));
await shot(page, `editor__activate-dialog__${vp}`);
console.log("focus dlg", await page.evaluate(()=>document.activeElement.tagName+" "+document.activeElement.textContent.trim().slice(0,30)));
await browser.close();
