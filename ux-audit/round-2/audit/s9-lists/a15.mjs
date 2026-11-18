import { open, go, shot, POP, focusDesc, AP } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const reqs = []; page.on("request", (r) => { if (AP.test(r.url()) && r.method() !== "GET") reqs.push(r.method() + " " + r.url()); if (/references/.test(r.url())) reqs.push("GET " + r.url().replace(/.*v1\//, "")); });
const cases = [["pois", "Parthenon Frieze"], ["places", "Acropolis Museum"], ["categories", "Sculpture"], ["pois", "Peplos Kore"]];
for (const [k, q] of cases) {
  await go(page, `/projects/${POP}/${k}?q=${encodeURIComponent(q)}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900);
  for (const action of ["Deactivate", "Archive"]) {
    const row = page.locator("tbody tr").first();
    await row.locator("button[aria-label^='Actions for']").click();
    const it = page.getByRole("menuitem", { name: action, exact: true });
    if (!(await it.count())) { console.log(k, q, action, "not offered"); await page.keyboard.press("Escape"); continue; }
    await it.click(); await page.waitForTimeout(1500);
    const d = page.getByRole("dialog");
    console.log(k, q, action, "=>", (await d.innerText()).replace(/\s+/g, " "), "| btns:", await d.getByRole("button").evaluateAll((b) => b.map((x) => x.textContent.trim() + (x.disabled || x.getAttribute("aria-disabled") === "true" ? "[disabled]" : ""))));
    await shot(page, `${k}-list__${action.toLowerCase()}-referenced`, "1440");
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  }
}
console.log("non-GET/refs:", reqs);
await browser.close();
