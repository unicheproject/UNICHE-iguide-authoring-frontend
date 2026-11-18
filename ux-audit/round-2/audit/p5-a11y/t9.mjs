import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const POI = "35d91cba-d64a-43ce-9773-1e472226d028";
await L.nav(page, L.P("/pois/" + POI), 2000);
await page.getByRole("textbox", { name: "Longitude" }).focus();
await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
L.log("t9", await page.evaluate(() => { const e = document.activeElement; return { html: e.outerHTML.slice(0, 300), parent: e.parentElement?.outerHTML.slice(0, 200), tab: e.getAttribute("tabindex"), cls: e.getAttribute("class") }; }));
await L.shot(page, "poi-editor__map-path-focus__1440");
await browser.close();
