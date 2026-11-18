import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
import { readFileSync } from "node:fs";
const i2 = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids2.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
page.on("dialog", d=>d.accept());
const inv = async()=> (await page.getByRole("button").allTextContents()).map(s=>s.trim()).filter(Boolean).slice(3,14);
async function trial(label, url, mk, edit) {
  await page.unrouteAll({behavior:"ignoreErrors"});
  await go(page, url); await page.waitForTimeout(1800);
  const seen=[];
  await page.route("**/iguide/api/v1/**", (route) => { const r=route.request(); if (r.method()!=="GET") { seen.push(r.method()+" "+r.url().split("/v1")[1].replace(/[0-9a-f-]{36}/g,":id")); return route.fulfill(mk()); } return route.continue(); });
  await edit();
  await page.getByRole("button",{name:/^(save|apply changes|save changes)/i}).first().click({timeout:4000}).catch(e=>log(label,"no save button; buttons:", "")) ;
  await page.waitForTimeout(1500);
  log(`[${label}] req=${JSON.stringify(seen)} alerts=`, (await alerts(page)).filter(a=>a.startsWith("alert")), "focus", await focused(page), "invalid", await page.locator("[aria-invalid=true]").count());
  await shot(page, `${label}__1440`);
}
const assetUrl = `/projects/${P}/media/${i2.assets[0]}`;
await go(page, assetUrl); await page.waitForTimeout(1500); await shot(page, "asset-editor__default__1440", true);
log("asset inputs", await page.locator("input:visible,textarea:visible,select:visible").evaluateAll(e=>e.map(x=>`${x.id||x.name}:${x.type}`)));
const editAsset = async()=>{ const t = page.locator("input[type=text]:visible, textarea:visible").first(); await t.fill("UX-p6-edge edited"); };
await trial("asset-err-500", assetUrl, ()=>problem(500,"INTERNAL_ERROR"), editAsset);
await trial("asset-err-422", assetUrl, ()=>problem(422,"VALIDATION_ERROR",{details:["translations.en.title: Must be at most 200 characters."],errors:[{path:"translations.en.title",code:"TOO_LONG",message:"Must be at most 200 characters."}]}), editAsset);
await trial("asset-err-409", assetUrl, ()=>problem(409,"VERSION_CONFLICT",{currentVersion:5}), editAsset);
// map editor
const mapUrl = `/projects/${P}/maps/${i2.map}`;
await go(page, mapUrl); await page.waitForTimeout(2500); await shot(page, "map-editor__default__1440", true);
log("map inputs", await page.locator("input:visible,textarea:visible,select:visible").evaluateAll(e=>e.map(x=>`${x.id||x.name}:${x.type}`)).then(a=>a.slice(0,20)));
const editMap = async()=>{ const t = page.locator("input[type=text]:visible").first(); await t.fill((await t.inputValue())+" x"); };
await trial("map-err-500", mapUrl, ()=>problem(500,"INTERNAL_ERROR"), editMap);
await trial("map-err-422", mapUrl, ()=>problem(422,"VALIDATION_ERROR",{details:["initialLatitude: Latitude must be between -90 and 90."],errors:[{path:"initialLatitude",code:"OUT_OF_RANGE",message:"Latitude must be between -90 and 90."}]}), editMap);
await trial("map-err-409", mapUrl, ()=>problem(409,"VERSION_CONFLICT",{currentVersion:50}), editMap);
// floor plan
const fpUrl = `/projects/${P}/floor-plans/${i2.fp}`;
await go(page, fpUrl); await page.waitForTimeout(2500); await shot(page, "floorplan-editor__default__1440", true);
const editFp = async()=>{ const t = page.locator("input[type=text]:visible").first(); await t.fill((await t.inputValue())+" x"); };
await trial("fp-err-500", fpUrl, ()=>problem(500,"INTERNAL_ERROR"), editFp);
await trial("fp-err-422", fpUrl, ()=>problem(422,"VALIDATION_ERROR",{details:["name: Must be at most 120 characters."],errors:[{path:"name",code:"TOO_LONG",message:"Must be at most 120 characters."}]}), editFp);
await browser.close();
