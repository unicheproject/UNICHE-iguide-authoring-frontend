import { start, go, P, API } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
for (const code of [503, 404, 409]) {
const s = await start("1440"); const p = s.page;
await p.route(u=>u.pathname.includes("/api/") && u.pathname.endsWith(`/maps/${ids.map}`), r => r.request().method()==="GET" ? r.fulfill({status:code, contentType:"application/problem+json", body: JSON.stringify({type:"about:blank",status:code,title:"Boom",detail:"d",code: code===503?"UNAVAILABLE":code===404?"NOT_FOUND":"VERSION_CONFLICT",requestId:"req-"+code})}) : r.continue());
await go(p, `${P}/maps/${ids.map}`); await p.waitForTimeout(3500);
await s.shot("mapeditor__load-"+code);
console.log(code, (await p.locator("main").innerText()).slice(0,300).replace(/\n/g," | "));
await s.browser.close();
}
// list load error
const s = await start("1440"); const p = s.page;
await p.route(u=>u.pathname.endsWith("/maps") && u.pathname.includes("/api/"), r => r.fulfill({status:503, contentType:"application/problem+json", body: JSON.stringify({status:503,title:"Unavailable",code:"UNAVAILABLE",requestId:"req-l"})}));
await go(p, `${P}/maps`); await p.waitForTimeout(3000);
await s.shot("maps-list__503");
console.log("list", (await p.locator("main").innerText()).slice(0,300).replace(/\n/g," | "));
await s.browser.close();
