import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("1440"); const { page } = s;
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(5000);
await page.getByRole("button",{name:"Edit bounds"}).click(); await page.waitForTimeout(1500);
await page.locator(".leaflet-container").scrollIntoViewIfNeeded();
await s.shot("mapeditor__edit-bounds");
const bnd = async()=> page.evaluate(()=>[...document.querySelectorAll("label")].filter(l=>/(Min|Max) (lat|long)/i.test(l.textContent)).map(l=>l.textContent.trim().slice(0,14)+"="+l.querySelector("input").value));
console.log("start", await bnd());
const handles = page.locator(".leaflet-marker-icon[title='Drag to resize bounds']");
console.log("n handles", await handles.count());
const hb = await handles.first().boundingBox(); console.log("handle box", hb);
await page.mouse.move(hb.x+7,hb.y+7); await page.mouse.down(); await page.mouse.move(hb.x+80,hb.y-40,{steps:10}); await page.mouse.up(); await page.waitForTimeout(800);
console.log("after corner drag", await bnd());
// handle focusable?
console.log("handle focusable:", await handles.first().evaluate(e=>e.tabIndex));
console.log("moveicon title attr:", await page.locator(".leaflet-marker-icon span[title]").first().getAttribute("title"));
// tab order inside toolbar
await s.shot("mapeditor__edit-bounds-after-drag");
// type bounds invalid: min > max
await page.getByLabel("Min latitude",{exact:true}).fill("38.5"); await page.waitForTimeout(500);
await s.shot("mapeditor__bounds-min-gt-max");
console.log("Done label:", await page.getByRole("button",{name:/Done|Edit bounds/}).innerText());
await page.getByRole("button",{name:/Done/}).click(); await page.waitForTimeout(800);
await page.getByRole("button",{name:/^Save/}).first().click(); await page.waitForTimeout(1500);
await s.shot("mapeditor__422-bounds", true);
console.log(await page.locator("[role=alert]").allInnerTexts());
await s.browser.close();
