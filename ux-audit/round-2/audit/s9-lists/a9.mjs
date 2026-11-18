import { open, go, shot, POP, focusDesc, axe } from "./lib.mjs";
const kinds = [["places","New place"],["pois","New point of interest"],["routes","New route"],["guides","New guide"],["events","New event"],["categories","New category"]];
const { browser, page } = await open("curator", { viewport: "1440" });
for (const [k, btn] of kinds) {
  await go(page, `/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(600);
  await page.getByRole("button", { name: btn, exact: true }).first().click(); await page.waitForTimeout(700);
  const dlg = page.getByRole("dialog");
  const info = await dlg.evaluate((d) => {
    const lab = (e) => { const l = e.labels?.[0]?.textContent ?? e.getAttribute("aria-label") ?? (e.getAttribute("aria-labelledby") ? document.getElementById(e.getAttribute("aria-labelledby"))?.textContent : ""); return (l || "").replace(/\s+/g, " ").trim(); };
    const fields = [...d.querySelectorAll("input, select, textarea")].map((e) => `${e.tagName.toLowerCase()}[${e.type}] "${lab(e)}" req=${e.required || e.getAttribute("aria-required")} val=${e.type === "radio" ? e.checked : JSON.stringify(e.value)} ph=${e.placeholder || ""}`);
    const btns = [...d.querySelectorAll("button")].map((b) => b.textContent.trim() + (b.disabled ? " [disabled]" : "")).filter(Boolean);
    const h = d.querySelector("h2,h1,[role=heading]");
    return { heading: h?.textContent.trim(), name: d.getAttribute("aria-label") ?? document.getElementById(d.getAttribute("aria-labelledby") ?? "")?.textContent, text: d.innerText.replace(/\s+/g, " ").slice(0, 900), fields, btns, h: Math.round(d.getBoundingClientRect().height), w: Math.round(d.getBoundingClientRect().width) };
  });
  console.log("\n==", k, "focus:", await focusDesc(page));
  console.log(JSON.stringify(info, null, 1));
  await shot(page, `create-${k}__open`, "1440");
  // submit empty
  await dlg.getByRole("button", { name: /create/i }).click(); await page.waitForTimeout(600);
  console.log(" after empty submit focus:", await focusDesc(page), "| summary:", (await dlg.locator("[data-error-summary]").innerText().catch(() => "none")).replace(/\s+/g, " "), "| alerts:", await page.locator("[role=alert]").evaluateAll((e) => e.map((x) => x.textContent.trim().slice(0, 100))));
  await shot(page, `create-${k}__empty-submit`, "1440");
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  console.log(" esc -> dialog count", await page.getByRole("dialog").count(), "focus:", await focusDesc(page));
}
await browser.close();
