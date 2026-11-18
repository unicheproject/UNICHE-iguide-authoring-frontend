import * as H from "./h.mjs";
const log = H.LOG("e10");
const { browser, context, page } = await H.session();
const id = H.ids.poi;
async function edit(txt = " g") { await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(txt); }
async function fresh() { await H.go(page, H.P("/pois/" + id)); await H.sleep(1500); }
const dlgs = []; page.on("dialog", async (d) => { dlgs.push(d.type() + ": " + d.message()); await d.dismiss().catch(()=>{}); });
// link click
await fresh(); await edit(" guard1"); await page.getByRole("link", { name: "Places", exact: true }).first().click(); await H.sleep(900);
log("## guard link", { url: page.url().replace(H.PID,"PID"), msgs: await H.msgs(page), focus: await H.AE(page) });
await H.shot(page, "poi-editor__guard-link__1440");
const g = page.getByRole("dialog"); log("guard buttons", await g.getByRole("button").allInnerTexts().catch(()=>[]));
await page.keyboard.press("Escape"); await H.sleep(400);
log("guard esc", { url: page.url().replace(H.PID,"PID"), dialogs: await page.getByRole("dialog").count(), focus: await H.AE(page) });
// Back
await page.evaluate(() => history.back()); await H.sleep(900);
log("## guard back", { url: page.url().replace(H.PID,"PID"), dialogs: await page.getByRole("dialog").count(), msgs: (await H.msgs(page)).slice(0,3) });
await H.shot(page, "poi-editor__guard-back__1440");
const stay = page.getByRole("button", { name: /keep editing|stay/i }); if (await stay.count()) await stay.first().click();
await H.sleep(400);
// project switch
await page.getByRole("button", { name: /Switch/ }).first().click(); await H.sleep(700);
await H.shot(page, "poi-editor__switcher-open__1440");
const opts = await page.getByRole("dialog").or(page.locator("[role=listbox],[role=menu],[data-state=open]")).first().innerText().catch(()=> "");
log("switcher", opts.replace(/\s+/g," ").slice(0,300));
await page.keyboard.press("Escape");
// Brand link
await page.getByRole("link", { name: /all projects/i }).click(); await H.sleep(900);
log("## guard all-projects link", { url: page.url().replace(H.PID,"PID"), dialogs: await page.getByRole("dialog").count(), msgs: (await H.msgs(page)).slice(0,3) });
await H.shot(page, "poi-editor__guard-brand-link__1440");
const discard = page.getByRole("button", { name: /^Leave|^Discard/i }); log("guard btns2", await page.getByRole("dialog").getByRole("button").allInnerTexts().catch(()=>[]));
const keep = page.getByRole("button", { name: /keep editing|stay/i }); if (await keep.count()) await keep.first().click();
await H.sleep(400);
// reload with edit
await page.evaluate(() => 0);
const t0 = dlgs.length;
await page.reload({ waitUntil: "domcontentloaded" }).catch(()=>{}); await H.sleep(2500);
log("reload dialogs", dlgs.slice(t0), "url", page.url().replace(H.PID,"PID"));
await H.shot(page, "poi-editor__after-reload__1440");
log("restore row", { msgs: (await H.msgs(page)).filter(x=>/Unsaved|Restore/.test(x)), title: await page.locator("#f-title").inputValue() });
const rest = page.getByRole("button", { name: /^Restore/ }); if (await rest.count()) { await rest.click(); await H.sleep(800); log("after restore", { focus: await H.AE(page), title: await page.locator("#f-title").inputValue(), msgs: await H.msgs(page) }); await H.shot(page, "poi-editor__after-restore__1440"); }
await browser.close();
