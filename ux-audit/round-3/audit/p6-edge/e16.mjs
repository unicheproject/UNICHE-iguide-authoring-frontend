import * as H from "./h.mjs";
const log = H.LOG("e16");
const { browser, context, page: A } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
const url = H.P("/pois/" + H.ids.poi2);
const calls = []; A.on("request", (r) => { if (api(new URL(r.url())) && r.method() !== "GET") calls.push(r.method() + " " + new URL(r.url()).pathname.replace(H.PID, "PID").replace(H.ids.poi2,"ID")); });
await H.go(A, url); await H.sleep(1800);
async function type(p, sel, txt) { await p.locator(sel).click(); await p.keyboard.press("End"); await p.keyboard.type(txt); }
await type(A, "#f-summary", " w1");
await A.getByRole("button", { name: /^Save draft/ }).first().click(); await H.sleep(1800);
log("save draft", { calls, msgs: await H.msgs(A) });
// forced 409 on apply
await A.route(api, (r) => r.request().method() === "POST" && /apply/i.test(r.request().url()) ? r.fulfill(H.problem(409, "VERSION_CONFLICT", {currentVersion: 99})) : r.continue());
await A.getByRole("button", { name: /^Apply changes/ }).first().click(); await H.sleep(1200);
log("apply dialog", { text: (await A.getByRole("dialog").innerText().catch(()=>"NO")).replace(/\s+/g," "), focus: await H.AE(A) });
await H.shot(A, "poi-editor__apply-dialog__1440");
const conf = A.getByRole("dialog").getByRole("button", { name: /^Apply/ }).last(); await conf.click(); await H.sleep(1500);
log("apply forced 409", { calls: calls.slice(-3), msgs: await H.msgs(A), focus: await H.AE(A) });
await H.shot(A, "poi-editor__apply-409-forced__1440");
for (const st of [503, 422]) {
  await A.unrouteAll({behavior:"ignoreErrors"});
  await A.route(api, (r) => r.request().method() === "POST" && /apply/i.test(r.request().url()) ? r.fulfill(st===422 ? H.problem(422,"VALIDATION_ERROR",{errors:[{path:"translations.en.title",code:"X",message:"Title is required."}]}) : H.problem(st, "SERVICE_UNAVAILABLE")) : r.continue());
  if (!(await A.getByRole("dialog").count())) await A.getByRole("button", { name: /^Apply changes/ }).first().click();
  await H.sleep(700);
  const c2 = A.getByRole("dialog").getByRole("button", { name: /^Apply/ }).last(); await c2.click({force:true}).catch(()=>{}); await H.sleep(1500);
  log(`apply ${st}`, { msgs: await H.msgs(A), focus: await H.AE(A), canary: (await H.body(A)).includes(H.CANARY) });
  await H.shot(A, `poi-editor__apply-${st}__1440`);
}
await browser.close();
