import { open, go, rec, P, shot, ready, axe, tall } from "./h.mjs";
const S="ux-audit/round-2/audit/s11-editors/shots/";
const { browser, page } = await open("curator", { viewport: "1440" });
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean));
await go(page, `/projects/${P}/guides/${rec.guide}`); await ready(page,1200);
await page.getByRole("button",{name:/^Activate$/}).first().click(); await page.waitForTimeout(1200);
console.log("EMPTY ACTIVATE DLG:", (await page.getByRole("dialog").innerText()).replace(/\n+/g," / "));
await page.screenshot({path:S+"guide-activate__empty-story-confirm__1440.png"});
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("focus after esc", await page.evaluate(()=>document.activeElement?.textContent.trim()));
await page.getByRole("button",{name:"Add heading"}).click(); await page.waitForTimeout(300);
console.log("focus after add heading", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,150)), await live());
await page.keyboard.type("First heading");
await page.getByRole("button",{name:"Add paragraph"}).click(); await page.keyboard.type("Paragraph one text.");
await page.getByRole("button",{name:"Add paragraph"}).click(); await page.keyboard.type("Paragraph two text.");
await page.getByRole("button",{name:"Add reference"}).click(); await page.waitForTimeout(800);
console.log("ref dlg:", (await page.getByRole("dialog").innerText()).slice(0,300).replace(/\n+/g," / "));
await page.screenshot({path:S+"guide-reference__picker__1440.png"});
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
await page.getByRole("button",{name:"Add image"}).click(); await page.waitForTimeout(1200);
console.log("img dlg:", (await page.getByRole("dialog").innerText()).slice(0,200).replace(/\n+/g," / "));
await page.screenshot({path:S+"guide-image__picker__1440.png"});
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
await page.screenshot({path:S+"guide-story__blocks__1440.png"});
await tall(page,"guide-story__blocks-tall__1440");
console.log("btn names:", await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>b.getAttribute("aria-label")||b.textContent.trim()).filter(t=>/H\d|level|Move|Remove|Drag|position/i.test(t)).slice(0,24)));
// heading level
await page.getByRole("button",{name:/H3/}).first().click(); await page.waitForTimeout(300);
console.log("H3 pressed", await page.getByRole("button",{name:/H3/}).first().getAttribute("aria-pressed"), await live());
// move
await page.getByRole("button",{name:/Move .*down/i}).first().click(); await page.waitForTimeout(300);
console.log("moved", await live(), "focus", await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")));
// remove
await page.getByRole("button",{name:/Remove/}).nth(1).click(); await page.waitForTimeout(400);
console.log("removed", await live(), "focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,140)));
await page.screenshot({path:S+"guide-story__removed-undo__1440.png"});
await axe(page,"guide blocks");
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("saved", await live());
// complete?
console.log("tabs:", await page.getByRole("tab").allInnerTexts());
await page.getByRole("tab",{name:/Ελληνικά/}).click(); await page.waitForTimeout(600);
await tall(page,"guide-editor__greek-tab__1440");
console.log("greek tab text:", (await page.locator("main").innerText()).slice(0,700).replace(/\n+/g," / "));
await axe(page,"guide greek");
await browser.close();
