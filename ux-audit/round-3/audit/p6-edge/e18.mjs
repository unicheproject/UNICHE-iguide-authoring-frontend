import * as H from "./h.mjs";
const log = H.LOG("e18");
const { browser, context, page: A } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
const url = H.P("/pois/" + H.ids.poi2);
const B = await context.newPage();
await H.go(A, url); await H.go(B, url); await H.sleep(1800);
async function type(p, sel, txt) { await p.locator(sel).click(); await p.keyboard.press("End"); await p.keyboard.type(txt); }
// B saves draft + applies
await type(B, "#f-summary", " fromB"); await B.getByRole("button", { name: /^Save draft/ }).first().click(); await H.sleep(1500);
await B.getByRole("button", { name: /^Apply changes/ }).first().click(); await H.sleep(700);
await B.getByRole("dialog").getByRole("button", { name: /^Apply/ }).last().click(); await H.sleep(2000);
log("B applied", await H.msgs(B));
// A (stale) edits summary + saves draft
await type(A, "#f-summary", " fromA"); await A.getByRole("button", { name: /^Save draft/ }).first().click(); await H.sleep(2000);
log("A save draft (stale)", { msgs: await H.msgs(A), focus: await H.AE(A) });
await H.shot(A, "poi-editor__real-wc-conflict__1440");
await browser.close();
