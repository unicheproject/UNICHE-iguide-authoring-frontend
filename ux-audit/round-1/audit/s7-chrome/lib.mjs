import { open, go, VIEWPORTS, CMS } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
export { open, go, VIEWPORTS, CMS };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const E = "1d6971ce-6391-4da8-848e-8d7466d25128";
const here = dirname(fileURLToPath(import.meta.url));
export const shot = (page, name, full = false) => page.screenshot({ path: join(here, "shots", name + ".png"), fullPage: full });
export const log = console.log;
export function problem(status, code, extra = {}) {
  return { status, contentType: "application/problem+json", headers: { "x-request-id": "req-s7-0001" }, body: JSON.stringify({ type: "urn:uniche:iguide:problem:" + code.toLowerCase(), title: code, status, code, detail: "Forced by s7 audit", requestId: "req-s7-0001", ...extra }) };
}
export async function focused(page) {
  return page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}#${a.id} label=${(a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60)}` : "none"; });
}
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export const { chromium } = require("@playwright/test");
export async function fresh(vp = "1440", extra = {}) {
  const v = VIEWPORTS[vp];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor ?? 1, ...extra });
  return { browser, context, page: await context.newPage() };
}
