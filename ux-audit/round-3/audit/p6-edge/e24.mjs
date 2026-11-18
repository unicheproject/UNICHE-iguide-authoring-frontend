import * as H from "./h.mjs";
const log = H.LOG("e24");
const { browser, page } = await H.session();
await H.go(page, H.P("/pois/" + H.ids.poi2)); await H.sleep(1800);
const lat = page.getByLabel(/^Latitude/); const lon = page.getByLabel(/^Longitude/);
const cases = [["37,9715","23,7257","commas"],["abc","xyz","letters"],["95","190","out-of-range"],["","","empty"],["37.9715","","one-axis-lat-only"],["","23.7257","one-axis-lon-only"],["37.9715 ","23.7257.1","trailing space + double dot"],["-0","0","zero"],["1e2","","exponent"]];
for (const [a,b,name] of cases) {
  await lat.fill(a); await lon.fill(b); await lon.blur(); await H.sleep(500);
  const inv = await page.evaluate(() => [...document.querySelectorAll("[aria-invalid=true]")].map(e => (e.id||e.getAttribute("aria-label")) + " -> " + [...(e.getAttribute("aria-describedby")||"").split(" ")].map(i=>document.getElementById(i)?.innerText).filter(Boolean).join(" / ")));
  const live = (await H.live(page)).map(x=>x.text);
  log(`## ${name} [${a}] [${b}] on blur`, { invalid: inv, live, vals: [await lat.inputValue(), await lon.inputValue()] });
  await page.getByRole("button", { name: /^Save draft/ }).first().click().catch(()=>{}); await H.sleep(900);
  log(`   save`, { msgs: (await H.msgs(page)).filter(m=>!/warnings/.test(m)).slice(0,3), focus: await H.AE(page) });
  if (["commas","letters","out-of-range","one-axis-lat-only"].includes(name)) await H.shot(page, `poi-editor__coords-${name}__1440`);
}
await H.shot(page, "poi-editor__coords-final__1440");
await browser.close();
