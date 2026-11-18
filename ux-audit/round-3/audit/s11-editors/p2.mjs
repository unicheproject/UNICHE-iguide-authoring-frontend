import { open, go, P, shot, settle } from "./h.mjs";
import fs from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
const ids = {};
async function create(kind, newBtn, title, extra) {
  await go(page, `/projects/${P}/${kind}`); await settle(page);
  await page.getByRole("button",{name:newBtn}).first().click(); await settle(page,400);
  const d = page.getByRole("dialog");
  await d.locator("input[type=text]").first().fill(title);
  if (extra) await extra(d);
  await d.getByRole("button",{name:/Create/}).click();
  await page.waitForURL(new RegExp(`/${kind}/[0-9a-f-]{36}`), {timeout:15000}).catch(e=>console.log("nourl",title));
  await settle(page,1200);
  console.log(title, page.url()); return page.url();
}
await go(page, `/projects/${P}/pois`); await settle(page);
for (const [n,t] of [["a","UX-R3-s11 Éclair Stop Alpha"],["b","UX-R3-s11 Άγιος Stop Beta"],["c","UX-R3-s11 Stop Gamma"],["d","UX-R3-s11 Stop Delta"]]) { ids["poi"+n] = await page.evaluate(t=>[...document.querySelectorAll("a")].find(a=>a.textContent.includes(t))?.href, t); console.log(n, ids["poi"+n]); }
ids.route = await create("routes", /^New route/, "UX-R3-s11 Route", async d=>{ await d.locator("select").selectOption("OUTDOOR"); });
ids.guide = await create("guides", /^New guide/, "UX-R3-s11 Guide");
ids.event = await create("events", /^New event/, "UX-R3-s11 Event");
ids.category = await create("categories", /^New category/, "UX-R3-s11 Category", async d=>{ await d.getByText(/^Points of Interest/).first().click(); await d.getByText(/^Top-level/).click(); });
fs.writeFileSync(new URL("./ids.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), JSON.stringify(ids,null,1));
await browser.close();
