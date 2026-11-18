import { open, go, shot, POP, EMPTY_D, EMPTY_B, AP, problem } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const { browser, context, page } = await open("curator", { viewport: "1440" });
const reqs = []; page.on("request", (r) => { if (AP.test(r.url())) reqs.push(r.method() + " " + r.url().replace(/.*v1\//, "").replace(POP, "P")); });
await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(1000);
console.log([...new Set(reqs)].join("\n"));
// loading: hold list requests for each kind
for (const k of kinds) {
  await go(page, `/projects/${POP}/`);
  let release; const held = new Promise((r) => (release = r));
  await page.route(new RegExp(`:8080/iguide/api/v1/projects/[^/]+/${k}\\?`), async (route) => { await held; await route.continue(); });
  await page.goto(`http://localhost:5173/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => ({ busy: [...document.querySelectorAll("[aria-busy=true]")].length, skel: [...document.querySelectorAll("[class*=skeleton],[class*=animate-pulse]")].length, text: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(0, 400), live: [...document.querySelectorAll("[role=status]")].map((e) => e.textContent.trim()) }));
  console.log(k, "LOADING", JSON.stringify(info));
  await shot(page, `${k}-list__loading`, "1440");
  release(); await page.waitForTimeout(500);
  await page.unroute(new RegExp(`:8080/iguide/api/v1/projects/[^/]+/${k}\\?`));
}
await browser.close();
