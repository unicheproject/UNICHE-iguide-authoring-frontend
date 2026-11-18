import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("1440"); const { page } = s;
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(5000);
const set = async (l,v)=>{ await page.getByLabel(l,{exact:true}).fill(v); };
await set("Min latitude","37.966"); await set("Max latitude","37.976"); await set("Min longitude","23.718"); await set("Max longitude","23.734");
await set("Latitude", "37.9712"); 
for (let i=0;i<3;i++){ await page.locator("section:has(h2:has-text('Unplaced')) ul button", {hasText:"Place"}).first().click(); await page.waitForTimeout(300);}
await page.getByRole("button",{name:/^Save/}).first().click(); await page.waitForTimeout(2500);
await s.shot("mapeditor__saved-draft", true);
console.log(await page.locator("h1").innerText(), page.url());
console.log(await page.getByText(/placed Resources/).first().innerText());
await s.browser.close();
