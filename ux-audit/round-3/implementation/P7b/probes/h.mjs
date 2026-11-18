import { open, go } from "../../../../tools/session.mjs";
export { open, go };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
import { readFileSync } from "node:fs";
export const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
export const shot = (page, name) => page.screenshot({ path: `ux-audit/round-3/implementation/P7b/after/${name}.png` });
