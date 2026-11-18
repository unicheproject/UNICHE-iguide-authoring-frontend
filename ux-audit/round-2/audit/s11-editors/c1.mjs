import { open, go, rec, P, shot, ready, axe, tall } from "./h.mjs";
const S="ux-audit/round-2/audit/s11-editors/shots/";
const { browser, page } = await open("curator", { viewport: "1440" });
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean));
await go(page, `/projects/${P}/events/${rec.event}`); await ready(page,1200);
// end before start
const card=page.locator("main").getByRole("heading",{name:/Date 1/}).locator("xpath=ancestor::*[self::li or self::div][.//label][1]");
await page.getByLabel("End date").first().fill("2027-02-08"); await page.waitForTimeout(500);
console.log("err text:", await page.locator("main [role=alert], main .text-destructive, main [id*=error]").allInnerTexts());
await page.getByLabel("End date").first().focus();
console.log("describedby:", await page.getByLabel("End date").first().getAttribute("aria-describedby"), await page.getByLabel("End date").first().getAttribute("aria-invalid"));
await page.screenshot({path:S+"event-dates__end-before-start__1440.png"});
await page.getByLabel("End date").first().fill("2027-02-09");
// Repeat weekly
await page.getByRole("button",{name:"Repeat weekly"}).click(); await page.waitForTimeout(500);
await page.screenshot({path:S+"event-dates__repeat-open__1440.png"});
console.log("repeat panel:", (await page.locator("main").innerText()).split("Repeat weekly")[1].slice(0,400).replace(/\n+/g," / "));
// invalid count
const cnt=page.locator("main input[type=number]").first(); console.log("count field", await cnt.count());
if (await cnt.count()) { await cnt.fill("99"); await page.waitForTimeout(400); await page.screenshot({path:S+"event-dates__repeat-invalid__1440.png"}); console.log("invalid:", (await page.locator("main").innerText()).split("Repeat weekly")[1].slice(0,300).replace(/\n+/g," / ")); await cnt.fill("3"); }
await page.getByRole("button",{name:/^Add \d+ dates?$/}).click().catch(()=>console.log("no add btn"));
await page.waitForTimeout(600);
console.log("cards", await page.getByRole("heading",{name:/^Date \d/}).count(), await live());
// remove + undo
await page.getByRole("button",{name:/Remove date 2/}).click(); await page.waitForTimeout(500);
console.log("removed live", await live(), "focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,140)));
await page.screenshot({path:S+"event-dates__removed-undo__1440.png"});
await page.getByRole("button",{name:/Undo/}).click(); await page.waitForTimeout(400);
console.log("after undo cards", await page.getByRole("heading",{name:/^Date \d/}).count(), "focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,140)));
// combobox
const place=page.getByRole("combobox",{name:/^Place/}); console.log("place combobox", await place.count(), await place.getAttribute("role"));
await place.click(); await page.waitForTimeout(400);
await page.screenshot({path:S+"event-place__combobox-open__1440.png"});
await page.keyboard.type("acro"); await page.waitForTimeout(400); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
console.log("place value", await place.inputValue().catch(()=>place.innerText()));
await page.screenshot({path:S+"event-place__combobox-chosen__1440.png"});
await page.keyboard.press("Tab"); console.log("tab to", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
// Greek tab
await page.getByRole("tab",{name:/Ελληνικά/}).click(); await page.waitForTimeout(600);
await tall(page,"event-editor__greek-tab__1440");
console.log("greek h2:", await page.evaluate(()=>[...document.querySelectorAll("main h2,main h3")].map(e=>e.textContent.trim().slice(0,40)).join(" | ")));
await axe(page,"event greek");
await browser.close();
