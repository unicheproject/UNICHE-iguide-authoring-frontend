import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/media`); await settle(page);
const active = () => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName}#${a.id} "${(a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40)}"` : null; });
await page.getByRole("button", { name: "Upload files" }).first().click(); await page.waitForTimeout(700);
console.log("focus", await active());
console.log(await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const b = d.getBoundingClientRect(); return { box: [b.x, b.y, b.width, b.height].map(Math.round), text: d.innerText.replace(/\n+/g, " | ") }; }));
await shot(page, `upload__open__${vp}`);
// Tab order
const tabs = []; for (let i = 0; i < 8; i++) { await page.keyboard.press("Tab"); tabs.push(await active()); } console.log("tabs", tabs);
await shot(page, `upload__tabfocus__${vp}`);
await browser.close();
