import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const openDlg = async (k, btn) => { await go(page, `/projects/${POP}/${k}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(500); await page.getByRole("button", { name: btn, exact: true }).first().click(); await page.waitForTimeout(500); return page.getByRole("dialog"); };
// Sub-place
let d = await openDlg("places", "New place");
await d.getByText("Sub-place", { exact: true }).click(); await page.waitForTimeout(400);
console.log("Sub-place dialog:", (await d.innerText()).replace(/\s+/g, " ").slice(0, 600), "| selects:", await d.locator("select").evaluateAll((s) => s.map((x) => x.labels?.[0]?.textContent + ": " + [...x.options].slice(0, 6).map((o) => o.text).join(" | "))));
await shot(page, "create-places__sub-place", "1440");
await d.getByRole("button", { name: "Create and open" }).click(); await page.waitForTimeout(500);
await d.getByRole("textbox").first().fill("UX-R2-s9 temp"); await d.getByRole("button", { name: "Create and open" }).click(); await page.waitForTimeout(600);
console.log(" sub-place without parent:", (await d.locator("[data-error-summary]").innerText().catch(() => "none")).replace(/\s+/g, " "));
await shot(page, "create-places__sub-place-no-parent", "1440");
await page.keyboard.press("Escape");
// Category subcategory
d = await openDlg("categories", "New category");
await d.getByText("Subcategory", { exact: true }).click(); await page.waitForTimeout(300);
console.log("Subcategory dialog:", (await d.innerText()).replace(/\s+/g, " ").slice(-380), "| selects:", await d.locator("select").evaluateAll((s) => s.map((x) => x.labels?.[0]?.textContent + ": " + [...x.options].slice(0, 5).map((o) => o.text).join(" | "))));
await shot(page, "create-categories__subcategory", "1440");
await page.keyboard.press("Escape");
// POI dialog: place select / Category select options
d = await openDlg("pois", "New point of interest");
console.log("POI place options:", await d.getByLabel("Place").locator("option").evaluateAll((o) => o.slice(0, 8).map((x) => JSON.stringify(x.text))), "cat options:", await d.getByLabel("Category").locator("option").evaluateAll((o) => o.slice(0, 8).map((x) => JSON.stringify(x.text))));
await shot(page, "create-pois__open-full", "1440");
// click backdrop
await page.mouse.click(40, 450); await page.waitForTimeout(400);
console.log("backdrop click closes:", (await page.getByRole("dialog").count()) === 0);
// dirty close: type then Esc
d = await openDlg("pois", "New point of interest");
await d.getByRole("textbox").first().fill("typed text"); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("Esc with typed text closes without warning:", (await page.getByRole("dialog").count()) === 0);
await browser.close();
