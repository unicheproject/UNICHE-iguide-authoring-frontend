import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of ["routes","guides","events","categories"]) {
  await go(page, `/projects/${P}/${k}`); await settle(page);
  console.log(k, page.url());
  console.log(await page.evaluate(()=>[...document.querySelectorAll("main button, main a")].slice(0,14).map(e=>e.textContent.trim().slice(0,40)).join(" | ")));
  await shot(page, `${k}-list__1440`);
}
await browser.close();
