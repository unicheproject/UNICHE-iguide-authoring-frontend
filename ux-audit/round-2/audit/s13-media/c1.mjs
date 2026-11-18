import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const F = "ux-audit/round-2/audit/s13-media/fixtures/";
const vp = "1440";
const { browser, page } = await open("admin", { viewport: vp });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
// Show more
await go(page, `/projects/${POP}/media`); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2500);
const sm = page.getByRole("button",{name:/Show more/});
console.log("show more btn", await sm.count(), await sm.first().innerText().catch(()=>""));
if (await sm.count()) { await sm.first().scrollIntoViewIfNeeded(); await shot(page,"library__show-more-before",vp); await sm.first().click(); await page.waitForTimeout(800);
  console.log("after show more focus", await focusDesc(page), "tiles", await page.locator("ul[aria-label='Media files'] > li").count());
  console.log("count line", (await t(page,"main")).match(/Showing[^\n]*/)?.[0]); await shot(page,"library__show-more-after",vp); }
// editor of zeta (mine, DRAFT, no alt)
await page.getByPlaceholder(/Name, file name/).fill("s13 zeta"); await page.waitForTimeout(800);
await page.locator("ul[aria-label='Media files'] a").first().click(); await page.waitForTimeout(2000);
console.log("editor", page.url().split("/").pop());
console.log((await t(page,"main")).replace(/\n+/g," | ").slice(0,1800));
await shot(page,"asset-editor__draft-noalt",vp);
// Activate refusal
const act = page.getByRole("button",{name:/^Activate/}).first();
console.log("activate disabled?", await act.isDisabled(), await act.getAttribute("aria-disabled"), await act.getAttribute("title"));
await act.click().catch(e=>console.log("click err", e.message.slice(0,100))); await page.waitForTimeout(1500);
console.log("DIALOG", await page.locator("[role=dialog],[role=alertdialog]").count(), (await page.locator("[role=dialog],[role=alertdialog]").allInnerTexts()).join("||").replace(/\n+/g," | ").slice(0,700));
await shot(page,"asset-editor__activate-refused",vp);
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("focus after esc", await focusDesc(page));
// Italian tab
await page.getByRole("tab",{name:/Italiano/}).click(); await page.waitForTimeout(600);
console.log("IT", (await t(page,"main")).replace(/\n+/g," | ").slice(0,900));
await shot(page,"asset-editor__italian-tab",vp);
await page.getByRole("tab",{name:/English/}).click();
// decorative effect
await page.getByRole("checkbox",{name:/Decorative/}).check(); await page.waitForTimeout(600);
console.log("DECOR", (await t(page,"main")).replace(/\n+/g," | ").slice(0,700));
await shot(page,"asset-editor__decorative-on",vp);
await page.getByRole("checkbox",{name:/Decorative/}).uncheck();
// Replace on DRAFT
const rep = page.getByRole("button",{name:/Replace file/}); console.log("replace", await rep.count(), await rep.first().isDisabled());
await page.locator("input[type=file]").setInputFiles(F+"UX-R2-s13 theta.jpg"); await page.waitForTimeout(3000);
console.log("after replace", (await t(page,"main")).replace(/\n+/g," | ").slice(0,500));
await shot(page,"asset-editor__after-replace",vp);
console.log("live", await page.locator("[aria-live], [role=status], [role=log]").allInnerTexts());
await browser.close();
