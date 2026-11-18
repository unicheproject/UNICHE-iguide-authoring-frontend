import { open, go, shot, P, E, text } from "./lib.mjs";
for (const [nm, id] of [["populated", P], ["emptyB", E]]) {
  const { browser, page } = await open("curator", { viewport: "1440" });
  const reqs = [];
  page.on("response", async (r) => { if (r.url().includes("/api/v1/") && r.request().method() === "GET") reqs.push(r.status() + " " + r.url().replace(/.*\/api\/v1/, "")); });
  let ready;
  page.on("response", async (r) => { if (r.url().endsWith("/readiness")) { try { ready = await r.json(); } catch {} } });
  await go(page, `/projects/${id}`);
  await page.waitForTimeout(2500);
  console.log("==", nm, page.url());
  console.log(await text(page));
  console.log(reqs.join("\n"));
  if (ready) console.log("READY", ready.activatable, ready.blocking.length, ready.warnings.length, JSON.stringify(ready.warnings.slice(0, 2)), JSON.stringify(ready.blocking.slice(0,3)));
  const codes = {}; (ready?.warnings ?? []).forEach(w => codes[w.code + "/" + w.resourceType] = (codes[w.code + "/" + w.resourceType] || 0) + 1); console.log(codes);
  await browser.close();
}
