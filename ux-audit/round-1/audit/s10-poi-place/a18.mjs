import { start, goEd, P, tall, poi, place, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
page.on("dialog", async d => { await d.accept(); });
await goEd(page, "/pois/"+poi("pediment").id);
// Italian tab (partially translated)
await page.getByRole("tab", { name: /italiano/i }).click(); await page.waitForTimeout(800);
await s.shot("lang-tab__italian-pediment");
const info = await page.evaluate(()=>{ const m=document.querySelector("main"); return [...m.querySelectorAll("label")].slice(0,8).map(l=>l.textContent.trim().slice(0,40)); });
console.log("labels:", info);
console.log("default-language text visible on IT tab?", await page.getByText("A closer look at East Pediment", {exact:false}).count());
// Tab semantics / arrow keys
await page.getByRole("tab", { name: /italiano/i }).focus(); await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(300);
console.log("after ArrowLeft active tab:", await page.evaluate(()=>document.activeElement.textContent.trim()), await page.getByRole("tab",{selected:true}).innerText());
// Practical details expand
await page.getByRole("tab", { name: /english/i }).click();
await page.getByRole("button", { name: /practical details/i }).click(); await page.waitForTimeout(500);
await s.shot("practical-details__open");
console.log("practical expanded:", await page.getByRole("button", { name: /practical details/i }).getAttribute("aria-expanded"));
// translations panel in side col
await page.getByRole("tab", { name: /ελληνικά/i }).click(); await page.waitForTimeout(500);
await s.shot("lang-tab__greek-pediment");
// click readiness item -> focus
await page.getByRole("tab", { name: /english/i }).click();
const item = page.locator("#attention-heading ~ ul button").first(); console.log("readiness item:", await item.innerText().then(t=>t.replace(/\n/g," ")));
await item.click(); await page.waitForTimeout(800);
console.log("after readiness click: active tab", await page.getByRole("tab",{selected:true}).innerText(), "focus", await page.evaluate(()=>document.activeElement.id||document.activeElement.tagName));
await s.shot("readiness-click__focus");
await s.browser.close();
