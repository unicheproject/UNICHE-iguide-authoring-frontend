import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  await page.locator("#f-minLatitude").fill("37,1619");
  const btns = page.getByRole("button", { name: /^Place .* on the map$/ });
  console.log("place buttons", await btns.count());
  const names = await btns.evaluateAll(els=>els.slice(0,5).map(e=>e.getAttribute("aria-label")));
  console.log(names);
  // place first, one without coords (Horsemen), and a 3rd
  await page.getByRole("button", { name: "Place The Horsemen of the Panathenaic Procession on the map" }).click();
  await page.getByRole("button", { name: "Place Antenor Kore on the map" }).click();
  await page.getByRole("button", { name: "Place Museum Shop on the map" }).click();
  await page.getByRole("button", { name: "Place Rampin Rider on the map" }).click();
  await page.getByRole("button", { name: "Place Parthenon Frieze – North Side on the map" }).click();
  await page.waitForTimeout(1200);
  console.log("placed text", (await t(page,"#placed")).slice(0,2200));
  await shot(page, "map-editor__placed-five", "1440", true);
  const pins = await page.evaluate(() => [...document.querySelectorAll(".leaflet-container [aria-label]")].map(e=>{const r=e.getBoundingClientRect();return `${e.getAttribute("aria-label").slice(0,70)} tab=${e.getAttribute("tabindex")} ${Math.round(r.width)}x${Math.round(r.height)}`}));
  console.log("PINS", pins);
  console.log("warn", await page.evaluate(()=>[...document.querySelectorAll("main")].map(m=>[...m.querySelectorAll("p,div")].filter(e=>/outside/i.test(e.textContent)&&e.children.length<3).map(e=>e.textContent.trim().slice(0,200)).slice(0,5))));
  await axe(page, "map-placed");
  await browser.close();
});
