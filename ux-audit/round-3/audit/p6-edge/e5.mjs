import * as H from "./h.mjs";
const log = H.LOG("e5");
const { browser, context, page: A } = await H.session();
const id = H.ids.poi2; const url = H.P("/pois/" + id);
const B = await context.newPage();
async function type(p, sel, txt) { await p.locator(sel).click(); await p.keyboard.press("End"); await p.keyboard.type(txt); }
const save = (p) => p.getByRole("button", { name: /^Save/ }).first().click();
for (const mode of ["disjoint", "same"]) {
  await H.go(A, url); await H.go(B, url); await H.sleep(1500);
  // B saves a Summary (disjoint) or Title (same)
  await type(B, mode === "same" ? "#f-title" : "#f-summary", " B-" + mode); await save(B); await H.sleep(1800);
  await type(A, "#f-title", " A-" + mode); await H.live(A); await save(A); await H.sleep(2000);
  log(`## real 409 ${mode}`, { msgs: await H.msgs(A), focus: await H.AE(A) });
  await H.shot(A, `poi-editor__real-409-${mode}__1440`);
  const dlg = A.getByRole("dialog"); log("dialog text", (await dlg.innerText().catch(() => "none")).replace(/\s+/g, " "));
  if (mode === "same") { log("dialog buttons", await dlg.getByRole("button").allInnerTexts()); }
  // Keep mine
  const keep = dlg.getByRole("button", { name: /keep my/i });
  if (await keep.count()) { await keep.click(); await H.sleep(2000); log("after keep", { msgs: await H.msgs(A), focus: await H.AE(A), title: await A.locator("#f-title").inputValue(), summary: await A.locator("#f-summary").inputValue() }); await H.shot(A, `poi-editor__real-409-${mode}-after-keep__1440`); }
}
await browser.close();
