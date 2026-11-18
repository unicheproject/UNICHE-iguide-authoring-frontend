import { open, go } from "../../../tools/session.mjs";
export { open, go };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const shot = (page, name) => page.screenshot({ path: `shots/${name}.png` });
export const settle = async (page, sel = "[data-media-count]") => { await page.waitForSelector(sel, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(1200); };
