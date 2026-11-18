import { open, go, CMS } from "../../../tools/session.mjs";
export { open, go, CMS };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const D = "f56e8c75-94af-4c87-88c8-06cba46240a1";
export const SH = new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
export const shot = (page, n) => page.screenshot({ path: SH + n + ".png" }).catch(e => console.log("shotfail", n, e.message));
export const settle = (page, ms = 1200) => page.waitForTimeout(ms);
