import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
page.on("dialog", d=>d.accept());
const eds = [["routes",ids.route,"route","title"],["guides",ids.guide,"guide","title"],["events",ids.event,"event","title"],["categories",ids.cat,"category","name"],["places",ids.place,"place","title"]];
for (const [seg,id,k,f] of eds) {
  const url = `/projects/${P}/${seg}/${id}`;
  for (const [name, mk] of [["500",()=>problem(500,"INTERNAL_ERROR")],["422",()=>problem(422,"VALIDATION_ERROR",{details:[`translations.en.${f==="name"?"name":"title"}: Must be at most 200 characters.`,`slug: Use lowercase Latin letters.`],errors:[{path:`translations.en.${f==="name"?"name":"title"}`,code:"TOO_LONG",message:"Must be at most 200 characters."},{path:"slug",code:"INVALID_FORMAT",message:"Use lowercase Latin letters."}]})],["409",()=>problem(409,"VERSION_CONFLICT",{currentVersion:7})],["403",()=>problem(403,"PROJECT_ACCESS_DENIED")],["503",()=>problem(503,"PLATFORM_UNAVAILABLE")]]) {
    await page.unrouteAll({behavior:"ignoreErrors"});
    await go(page, url); await page.waitForTimeout(1200);
    await page.route("**/iguide/api/v1/**", (route) => route.request().method()!=="GET" ? route.fulfill(mk()) : route.continue());
    const ti = page.locator("#f-title, #f-name, input[type=text]:visible").first();
    const before = await ti.inputValue().catch(()=>"?");
    await ti.fill(before + " x").catch(e=>log("fill fail", seg, e.message.slice(0,60)));
    const sv = page.getByRole("button",{name:/^(save|apply changes)/i}).first();
    await sv.click().catch(e=>log("save click fail", seg, e.message.slice(0,60)));
    await page.waitForTimeout(1500);
    if (name==="409") { const d = (await page.locator("[role=dialog]").first().innerText().catch(()=>"(none)")).replace(/\n+/g," | ").slice(0,350); log(`[${seg}] 409 dialog:`, d); }
    else log(`[${seg}] ${name}: alerts=`, (await alerts(page)).filter(a=>a.startsWith("alert")), "focus", await focused(page), "fieldErr", await page.locator("[aria-invalid=true]").count());
    await shot(page, `${k}-editor__err-${name}__1440`);
  }
}
await browser.close();
