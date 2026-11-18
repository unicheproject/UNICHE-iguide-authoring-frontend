import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("1440"); const { page } = s;
await go(page, `${P}/floor-plans/${ids.plan}`); await page.waitForTimeout(2500);
for (let i=0;i<3;i++){ await page.locator("section:has(h2:has-text('Unplaced')) ul button", {hasText:"Place"}).first().click(); await page.waitForTimeout(300);}
await page.waitForTimeout(1500);
await s.shot("fpeditor__3-placed-stacked", true);
const mk = page.locator("button[aria-label*='arrow keys']");
console.log("markers", await mk.count(), await mk.evaluateAll(e=>e.map(x=>{const b=x.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),b.width,x.getAttribute("aria-label")]})));
const vals = ()=> page.locator("section:has(h2:has-text('Placed')) ol li input").evaluateAll(e=>e.map(x=>x.value));
console.log("vals", await vals());
// keyboard nudge 
await mk.nth(2).focus(); for (let i=0;i<5;i++) await page.keyboard.press("ArrowRight"); await page.keyboard.press("Shift+ArrowDown");
console.log("after kb", await vals());
await s.shot("fpeditor__marker-focus-nudged");
// mouse drag marker 0
await page.evaluate(()=>window.scrollTo(0,0)); await page.locator("img[draggable=false]").scrollIntoViewIfNeeded();
const b = await mk.nth(0).boundingBox(); console.log(b);
await page.mouse.move(b.x+13,b.y+13); await page.mouse.down(); await page.mouse.move(b.x-150,b.y+90,{steps:10}); await page.mouse.up();
console.log("after drag", await vals());
// rotation
await page.locator("section:has(h2:has-text('Placed')) ol li input").nth(2).fill("45"); 
await page.waitForTimeout(300);
await s.shot("fpeditor__rotation-45");
await page.getByRole("button",{name:/^Save/}).first().click(); await page.waitForTimeout(2500);
console.log(await page.getByText(/version \d/).first().innerText());
// invalid
await page.locator("section:has(h2:has-text('Placed')) ol li input").nth(0).fill("1.5");
await page.locator("section:has(h2:has-text('Placed')) ol li input").nth(2).fill("400");
await page.getByRole("button",{name:/^Save/}).first().click(); await page.waitForTimeout(1500);
await s.shot("fpeditor__invalid", true);
console.log(await page.locator("[role=alert]").allInnerTexts());
console.log("focus after failed save:", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,100)));
await s.browser.close();
