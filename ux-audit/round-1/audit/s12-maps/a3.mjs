import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/maps"); await page.waitForTimeout(1200);
await page.getByRole("button", { name: "New map" }).first().click();
await page.locator("#nm-q").fill("Ancient Agora Athens");
await page.keyboard.press("Enter"); await page.waitForTimeout(3000);
await page.locator("ul[aria-label^=Results] li button").nth(1).click();
await page.waitForTimeout(2500);
await s.shot("newmap__picked");
console.log("name:", await page.locator("#nm-name").inputValue());
// keyboard: tab order after pick
const order=[]; await page.locator("#nm-name").focus();
for (let i=0;i<8;i++){ await page.keyboard.press("Tab"); order.push(await page.evaluate(()=>{const e=document.activeElement;return (e?.getAttribute("aria-label")||e?.getAttribute("title")||e?.textContent||e?.tagName).trim().slice(0,40)})); }
console.log("tab order:", order);
// handles keyboard focusable?
console.log("leaflet marker tabindex:", await page.locator(".leaflet-marker-icon").evaluateAll(e=>e.map(x=>[x.getAttribute("tabindex"),x.getAttribute("title"),x.getBoundingClientRect().width])));
await page.locator("#nm-name").fill("UX-s12-maps Map");
await page.getByRole("button", { name: "Create map" }).click();
await page.waitForTimeout(3500);
console.log("url:", page.url());
await s.shot("mapeditor__fresh-draft", true);
await s.browser.close();
