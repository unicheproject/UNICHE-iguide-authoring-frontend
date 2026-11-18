import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
export * from "../s7-chrome/lib.mjs";
const here = dirname(fileURLToPath(import.meta.url));
export async function shot(page, name, vp, full = false) {
  await page.screenshot({ path: join(here, "shots", `${name}__${vp}.png`), fullPage: full });
}
