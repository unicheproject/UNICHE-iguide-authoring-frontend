import { open, go, VIEWPORTS, CMS } from "../../../tools/session.mjs";
export { open, go, VIEWPORTS, CMS };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const E = "1d6971ce-6391-4da8-848e-8d7466d25128";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = dirname(fileURLToPath(import.meta.url));
export const shot = (page, name, full = true) => page.screenshot({ path: join(here, "shots", name + ".png"), fullPage: full });
export const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export function problem(status, code) {
  return { status, contentType: "application/problem+json", headers: { "x-request-id": "req-s8-0001" }, body: JSON.stringify({ type: "urn:uniche:iguide:problem:" + code.toLowerCase(), title: code, status, code, detail: "Forced by s8 audit", requestId: "req-s8-0001" }) };
}
export async function text(page) { return page.locator("main").first().innerText(); }
