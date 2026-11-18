import { start, goEd, P, tall, poi, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
page.on("dialog", async d => { await d.accept(); });
const txt = async (sel) => (await page.locator(sel).allInnerTexts()).join(" || ").replace(/\n+/g," ").slice(0,500);
await goEd(page, "/pois/"+MINE.poi2);
// discard stored draft if any
await page.getByRole("button", { name: /^discard$/i }).click().catch(()=>{});
// real client-side validation: bad slug + empty title
await page.getByLabel("Slug",{exact:false}).first().fill("Bad Slug!");
await page.getByLabel("Title",{exact:false}).first().fill("");
await page.getByRole("button", { name: /^save$/i }).click(); await page.waitForTimeout(1200);
await s.shot("validation__client-422"); console.log("summary:", await txt("[data-error-summary]"));
console.log("focus after save:", await page.evaluate(()=>document.activeElement?.id||document.activeElement?.tagName));
console.log("field errors:", await txt("[id$='-error'], .field-error, [role=alert]"));
// Fix title; force server 422/409/503
await page.getByLabel("Title",{exact:false}).first().fill("UX-s10-poi-place Garden Bench");
await page.getByLabel("Slug",{exact:false}).first().fill("ux-s10-poi-place-garden-bench");
const mock = async (status, body) => { await page.unroute("**/pois/**").catch(()=>{}); await page.route("**/iguide/api/v1/projects/*/pois/*", async (route) => { if (route.request().method()==="PUT") return route.fulfill({ status, contentType: "application/problem+json", body: JSON.stringify(body) }); return route.continue(); }); };
await page.getByLabel("Summary",{exact:false}).first().fill("dirty so Save is enabled");
await mock(422, { type:"urn:uniche:problem:VALIDATION_ERROR", code:"VALIDATION_ERROR", title:"Validation failed", status:422, detail:"The request is invalid.", requestId:"req-422-demo", errors:[{path:"latitude", code:"OUT_OF_RANGE", message:"Latitude must be between -90 and 90."},{path:"slug",code:"SLUG_TAKEN",message:"This slug is already used in the Project."}] });
await page.getByRole("button", { name: /^save$/i }).click(); await page.waitForTimeout(1200);
await s.shot("validation__server-422"); console.log("422 summary:", await txt("[data-error-summary]"));
await tall(s, "validation-server-422");
await mock(409, { type:"urn:uniche:problem:VERSION_CONFLICT", code:"VERSION_CONFLICT", title:"Conflict", status:409, detail:"The point of interest changed.", requestId:"req-409-demo", currentVersion: 9, conflictingFields:["translations.en.title"] });
await page.getByRole("button", { name: /^save$/i }).click(); await page.waitForTimeout(1500);
await s.shot("validation__server-409"); console.log("409 dialogs:", (await page.getByRole("dialog").allInnerTexts()).join("||").replace(/\n+/g," | ").slice(0,500));
await page.keyboard.press("Escape");
await mock(503, { type:"about:blank", code:"PLATFORM_UNAVAILABLE", title:"Unavailable", status:503, detail:"Platform down", requestId:"req-503" });
await page.getByRole("button", { name: /^save$/i }).click(); await page.waitForTimeout(1500);
await s.shot("validation__server-503"); console.log("503:", await txt("[role=alert],[data-error-summary]"));
await s.browser.close();
