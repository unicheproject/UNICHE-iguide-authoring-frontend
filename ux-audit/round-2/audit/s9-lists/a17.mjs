import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${POP}/pois`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900);
await page.locator("main h1").focus().catch(() => {}); 
await page.evaluate(() => document.querySelector("main h1")?.setAttribute("tabindex", "-1")); await page.locator("main h1").focus();
const seq = [];
for (let i = 0; i < 24; i++) { await page.keyboard.press("Tab"); seq.push(await page.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName.toLowerCase()}[${e.getAttribute("role") ?? e.type ?? ""}] "${(e.getAttribute("aria-label") || e.labels?.[0]?.textContent || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 36)}" y=${Math.round(r.top)} outline=${cs.outlineStyle}/${cs.outlineWidth}`; })); }
console.log(seq.map((s, i) => i + 1 + ". " + s).join("\n"));
await shot(page, "pois-list__keyboard-focus-row", "1440");
// segments arrow keys
await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(800);
const seg = page.getByRole("radio", { name: /Active/ }).or(page.getByRole("tab", { name: /^Active/ })).or(page.getByRole("button", { name: /^Active \d/ })).first();
console.log("segment role:", await seg.evaluate((e) => e.tagName + " " + e.getAttribute("role") + " pressed=" + e.getAttribute("aria-pressed") + " checked=" + e.getAttribute("aria-checked")), "| group:", await page.locator("[role=radiogroup],[role=group],[role=tablist]").evaluateAll((g) => g.map((x) => x.getAttribute("role") + ":" + x.getAttribute("aria-label"))));
await seg.focus(); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(500);
console.log("after ArrowRight focus:", await focusDesc(page), "url:", page.url().split("?")[1]);
await page.keyboard.press("Enter"); await page.waitForTimeout(500); console.log("after Enter url:", page.url().split("?")[1]);
// toggles
for (const lab of ["Pending changes", "Needs translation"]) { await page.getByLabel(lab).check(); await page.waitForTimeout(500); console.log(lab, "->", page.url().split("?")[1], "| rows:", await page.locator("tbody tr").count(), "| live:", await page.locator("[role=status]").allTextContents()); }
await shot(page, "pois-list__toggles-on", "1440");
console.log("lang select options:", await page.getByLabel("Search in").locator("option").allTextContents(), "| chips:", await page.locator("main").innerText().then((t) => t.match(/Showing[^\n]*/)?.[0]));
// whole-row click
await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(800);
const r = page.locator("tbody tr").nth(1); const box = await r.boundingBox();
await page.mouse.click(box.x + box.width * 0.55, box.y + 20); await page.waitForTimeout(800);
console.log("click in row middle ->", page.url().replace(POP, "P").slice(-60));
await page.goBack(); await page.waitForTimeout(1000);
console.log("back ->", page.url().replace(POP, "P").slice(-40), "scrollTop:", await page.evaluate(() => document.querySelector("main").scrollTop));
await browser.close();
