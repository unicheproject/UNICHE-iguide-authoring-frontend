import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
await go(page, `/projects/${POP}/guides`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900);
const myrow = () => page.locator("tbody tr", { hasText: "UX-R2-s9 Guide" }).first();
const order = async () => (await page.locator("tbody tr").evaluateAll((r) => r.map((x) => x.querySelector("a")?.textContent.trim().slice(0, 18)))).join(" / ");
console.log("order before:", await order());
await myrow().locator("button[aria-label^='Actions for']").click();
await page.getByRole("menuitem", { name: "Move to position..." }).click(); await page.waitForTimeout(600);
const d = page.getByRole("dialog");
console.log("POSITION dialog:", (await d.innerText()).replace(/\s+/g, " "), "| focus:", await focusDesc(page), "| fields:", await d.locator("input,select").evaluateAll((e) => e.map((x) => `${x.type} val=${x.value} min=${x.min} max=${x.max} label=${x.labels?.[0]?.textContent}`)));
await shot(page, "guides-list__move-to-position", "1440");
const inp = d.locator("input").first();
for (const v of ["0", "999", "abc", "2.5", ""]) { await inp.fill(v); await d.getByRole("button", { name: /^Move/ }).click().catch(() => {}); await page.waitForTimeout(400); console.log(" input", JSON.stringify(v), "-> dialog open", await page.getByRole("dialog").count(), "| text tail:", (await d.innerText().catch(() => "")).replace(/\s+/g, " ").slice(-140), "| alerts", await page.locator("[role=alert]").allTextContents()); }
await shot(page, "guides-list__move-to-position-invalid", "1440");
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("focus after esc:", await focusDesc(page));
// move up via menu then down
await myrow().locator("button[aria-label^='Actions for']").click(); await page.getByRole("menuitem", { name: "Move up", exact: true }).click(); await page.waitForTimeout(1500);
console.log("after Move up:", await order(), "| live:", await page.locator("[role=status]").allTextContents(), "| focus:", await focusDesc(page));
await myrow().locator("button[aria-label^='Actions for']").click(); await page.getByRole("menuitem", { name: "Move down", exact: true }).click(); await page.waitForTimeout(1500);
console.log("after Move down:", await order(), "| live:", await page.locator("[role=status]").allTextContents(), "| focus:", await focusDesc(page));
// keyboard on handle
const h = myrow().locator("button").first();
console.log("handle label:", await h.getAttribute("aria-label"), "| desc:", await h.getAttribute("aria-describedby"), "| tag", await h.evaluate((e) => e.outerHTML.slice(0, 250)));
// sort != manual: what is menu/handle state
await go(page, `/projects/${POP}/guides?sort=title`); await page.waitForTimeout(900);
await page.locator("tbody tr").first().locator("button[aria-label^='Actions for']").click();
console.log("menu when sorted by title:", await page.getByRole("menuitem").allTextContents());
const hd = page.locator("tbody tr").first().locator("td").first();
console.log("handle cell when sorted:", (await hd.innerHTML()).slice(0, 300), "| tooltip/title:", await hd.locator("[title],[aria-label]").evaluateAll((e) => e.map((x) => x.getAttribute("title") || x.getAttribute("aria-label"))));
await shot(page, "guides-list__sorted-title-menu", "1440");
await browser.close();
