import { open, go, CMS, API } from "../../../../tools/session.mjs";
import { appendFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export { open, go };
export const here = dirname(fileURLToPath(import.meta.url));
export const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const P = (p) => `/projects/${PID}${p}`;
export const ids = JSON.parse(readFileSync(join(here, "ids.json"), "utf8"));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const AFTER = join(here, "..", "after");
mkdirSync(AFTER, { recursive: true });
export const LOG = (name) => (...a) => { const s = a.map((x) => typeof x === "string" ? x : JSON.stringify(x)).join(" "); console.log(s); appendFileSync(join(here, "logs-" + name + ".txt"), s + "\n"); };
export const shot = (page, name, full) => page.screenshot({ path: join(AFTER, name + ".png"), fullPage: !!full }).catch((e) => console.log("shot fail", name, e.message));
export const session = (opts = {}) => open("admin", opts);
export async function ax(page) {
  const { AxeBuilder } = (await import("@axe-core/playwright"));
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(" ") }));
}
