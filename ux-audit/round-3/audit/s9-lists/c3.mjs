import { open, go, P, shot, settle } from "./h.mjs";
import fs from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
const created = {};
page.on("response", async r => { if (r.request().method() === "POST" && /\/(places|pois|routes|guides|events|categories)$/.test(r.url())) { try { const j = await r.json(); created[r.url().split("/").pop()] = { id: j.id, slug: j.slug ?? j.code, status: r.status() }; } catch {} } });
const spec = [["places","New place","UX-R3-s9 Place"],["pois","New point of interest","UX-R3-s9 POI"],["routes","New route","UX-R3-s9 Route"],["guides","New guide","UX-R3-s9 Guide"],["events","New event","UX-R3-s9 Event"],["categories","New category","UX-R3-s9 Category"]];
for (const [k, btn, name] of spec) {
  await go(page, `/projects/${P}/${k}`); await settle(page, 1500);
  await page.getByRole("button", { name: btn, exact: true }).click(); await settle(page, 500);
  await page.locator("[role=dialog] input[type=text]").first().fill(name);
  if (k === "routes") await page.locator("[role=dialog] select").selectOption({ label: "Outdoor: On a site or in a city. Drawn on a map" }).catch(async()=>{ await page.locator("[role=dialog] select").selectOption({ index: 2 }); });
  if (k === "categories") await page.getByRole("radio", { name: /^Points of Interest/ }).check({ force: true });
  await page.locator("[role=dialog] button", { hasText: /^Create/ }).click();
  const t0 = Date.now();
  await page.waitForURL(u => !/\/(places|pois|routes|guides|events|categories)$/.test(u.pathname), { timeout: 15000 }).catch(() => console.log(k, "no navigation"));
  await settle(page, 1000);
  const st = await page.evaluate(() => ({ url: location.pathname, h1: document.querySelector("h1")?.innerText, focus: document.activeElement.tagName + ":" + (document.activeElement.innerText || "").slice(0, 30), toasts: [...document.querySelectorAll("[role=status],[role=alert],[data-sonner-toast],[data-reka-toast-root],li[role=status]")].map(e => e.innerText.replace(/\n+/g, " | ").slice(0, 100)), dlg: !!document.querySelector("[role=dialog]"), title: document.title }));
  console.log(k, Date.now() - t0, "ms", JSON.stringify(st));
  await shot(page, `${k}__after-create__1440`);
}
console.log(JSON.stringify(created));
fs.writeFileSync(new URL("./created.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), JSON.stringify(created));
await browser.close();
