import { open, go, CMS, API, VIEWPORTS } from "../../../tools/session.mjs";
export { open, go, CMS, API, VIEWPORTS };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const SH = "ux-audit/round-2/audit/p1-editor/shots/";
export const shot = (page, name, full = false) => page.screenshot({ path: SH + name + ".png", fullPage: full });
export const settle = (page, ms = 800) => page.waitForTimeout(ms);
