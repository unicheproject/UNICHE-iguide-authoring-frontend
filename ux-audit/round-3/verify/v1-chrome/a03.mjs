import { open, go, shot, text, axe, P, T, B, D, settle } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const urls = new Set();
page.on("request", r => { if (r.url().includes(":8080")) urls.add(r.method() + " " + r.url().replace(/^.*\/api\/v1/, "").replace(/[0-9a-f-]{36}/g, ":id")); });
for (const [n, id] of [["populated", P], ["trail", T], ["emptyB", B]]) {
  await go(page, `/projects/${id}`); await settle(page, 3000);
  await shot(page, `dashboard__${n}__1440`, true);
  console.log("=====", n); console.log(await text(page));
  console.log("axe", await axe(page));
}
console.log([...urls].join("\n"));
await browser.close();
