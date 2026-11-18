import { open, go, CMS, API, VIEWPORTS } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
export const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url)));
export const PID = seed.projects.populated.id;
export const P = `/projects/${PID}`;
export const shotDir = new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
export async function start(viewport = "1440", opts = {}) {
  const s = await open("curator", { viewport, ...opts });
  s.page.on("pageerror", e => console.log("PAGEERROR", e.message));
  s.page.on("console", m => { if (m.type()==="error") console.log("CONSOLE", m.text().slice(0,200)); });
  s.shot = (name, full=false) => s.page.screenshot({ path: shotDir + name + `__${viewport}.png`, fullPage: full });
  return s;
}
export { go, CMS, API };
