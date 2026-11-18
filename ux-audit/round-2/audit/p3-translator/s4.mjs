import { open, go, PID, shot, listReady } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
for (const k of ["places","routes","guides","events","categories"]) {
  await go(page, `/projects/${PID}/${k}`); await listReady(page);
  const t0 = Date.now(); let clicks = 0;
  await page.getByLabel("Needs translation").check(); clicks++;

  // the 'in' select is the second language select
  const sels = await page.locator("main select").all();
  let info = [];
  for (const s of sels) info.push(await s.evaluate(e => (e.id||"")+":"+[...e.options].map(o=>o.text).join("/")+" ="+e.value));
  await page.locator("main select").nth(["pois","routes","categories"].includes(k)&&k!=="categories"?2:(k==="categories"?2:(k==="places"?2:2))).selectOption({ label: "Italiano" }).catch(e => console.log("sel err", e.message.slice(0,100))); clicks++;
  await page.waitForTimeout(1800);
  const txt = await page.locator("main").innerText();
  const m = txt.match(/Showing \d+ of \d+[^\n]*/);
  console.log(k, "clicks", clicks, "ms", Date.now()-t0, page.url().split("?")[1], "|", m?.[0], "| selects:", info.join(" ;; "));
  await shot(page, `${k}-list__missing-it`);
}
// direct link check: pois?missing=it&lang=it
await go(page, `/projects/${PID}/pois?missing=it`); await listReady(page);
console.log("deeplink", (await page.locator("main").innerText()).match(/Showing[^\n]*/)?.[0], await page.getByLabel("Needs translation").isChecked());
await browser.close();
