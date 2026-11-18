import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const reqs = []; page.on("request", r => { if (r.method() !== "GET" && !r.url().includes("keycloak") ) reqs.push(r.method() + " " + r.url().replace(/^.*(api\/v1|localhost:9000)/, "$1").slice(0, 110)); });
await go(page, `/projects/${P}/media`); await settle(page);
const active = () => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName} "${(a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40)}"` : null; });
await page.getByRole("button", { name: "Upload files" }).first().click(); await page.waitForTimeout(500);
// delay PUTs to see progress
await page.route(/localhost:9000/, async (route) => { if (route.request().method() === "PUT") await new Promise(r => setTimeout(r, 3000)); route.continue(); });
await page.locator("input[type=file]").setInputFiles([
  { name: "UX-R3-s13 one.png", mimeType: "image/png", buffer: png },
  { name: "UX-R3-s13 big.png", mimeType: "image/png", buffer: Buffer.alloc(21 * 1024 * 1024, 1) },
  { name: "UX-R3-s13 tool.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ1") },
  { name: "UX-R3-s13 notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 x") },
]);
await page.waitForTimeout(900);
await shot(page, `upload__mixed-inprogress__${vp}`);
console.log("t900", await page.evaluate(() => document.querySelector("[role=dialog]").innerText.replace(/\n+/g, " | ")));
console.log("anims", await page.evaluate(() => document.getAnimations().map(a => a.animationName || a.constructor.name + ":" + (a.effect?.target?.className || "").toString().slice(0, 40))));
await page.waitForTimeout(4500);
await shot(page, `upload__mixed-done__${vp}`);
console.log("t5400", await page.evaluate(() => document.querySelector("[role=dialog]").innerText.replace(/\n+/g, " | ")));
console.log("log", await page.evaluate(() => { const l = document.querySelector("[role=log]"); return l && { text: l.textContent, live: l.getAttribute("aria-live"), pos: getComputedStyle(l).position }; }));
console.log("focus", await active());
console.log(reqs.join("\n"));
await browser.close();
