import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
// find ids via list search
await go(p, P + "/pois"); await p.waitForTimeout(800);
await p.getByPlaceholder(/Search titles/).fill("UX-p1-editor"); await p.waitForTimeout(800);
await s.shot("pois-list__search-own");
const links = await p.locator("main a[href*='/pois/']").evaluateAll(a=>a.map(x=>x.textContent.trim().slice(0,40)+" "+x.getAttribute("href").split("/").pop()));
console.log(links.join("\n"));
console.log("reorder hint:", await p.getByText(/reorder/i).allInnerTexts());
// activate Gamma from list
const row = p.locator("main li, main tr, [role=row]").filter({hasText:"UX-p1-editor Gamma"}).first();
await row.getByRole("button",{name:/activate/i}).click(); await p.waitForTimeout(1500);
await s.shot("poi-list__activate-gamma-result");
console.log("DLG:", await p.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(()=>"(none)"));
console.log("toasts:", await p.locator("[role=status],[role=alert]").allInnerTexts());
await s.browser.close();
