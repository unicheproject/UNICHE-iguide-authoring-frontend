import { open, go, PID, shot, listReady, log } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const kinds = ["places","pois","routes","guides","events","categories"];
for (const k of kinds) {
  const t = Date.now();
  await go(page, `/projects/${PID}/${k}`); await listReady(page);
  const text = (await page.locator("main").innerText()).replace(/\n+/g," | ");
  console.log(k, "load ms", Date.now()-t, text.slice(0,420));
  await shot(page, `${k}-list__default`);
}
await browser.close();
