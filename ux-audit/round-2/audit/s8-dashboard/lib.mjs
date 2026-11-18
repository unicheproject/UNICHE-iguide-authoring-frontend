import { open, go, API } from "../../../tools/session.mjs";
export { open, go, API };
export const P = { pop: "6958c18f-60d2-4140-a524-5a43f8a2f6b5", D: "f56e8c75-94af-4c87-88c8-06cba46240a1", B: "1d6971ce-6391-4da8-848e-8d7466d25128", C: "ceee1b24-e7c4-474e-93ba-f77067ed8a72" };
export const OUT = "ux-audit/round-2/audit/s8-dashboard/shots/";
export const emptyPage = { content: [], page: 0, number: 0, size: 1, totalElements: 0, totalPages: 0, first: true, last: true, empty: true };
export const json = (route, status, body) => route.fulfill({ status, contentType: status >= 400 ? "application/problem+json" : "application/json", body: JSON.stringify(body) });
export const problem = (status, code, title, detail) => ({ type: "urn:uniche:iguide:problem:" + code.toLowerCase(), title, status, detail, code, requestId: "req-s8-" + status + "-demo" });
export async function tall(page, w = 1440, h = 2400) { await page.setViewportSize({ width: w, height: h }); }
export async function shot(page, name) { await page.waitForTimeout(700); await page.screenshot({ path: OUT + name + ".png", fullPage: true }); console.log("shot", name); }
