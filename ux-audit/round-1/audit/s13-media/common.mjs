import { open, go, CMS, API } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
export const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url)));
export const PID = seed.projects.populated.id;
export const P = `/projects/${PID}`;
export const shotDir = new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
export async function start(viewport = "1440") {
  const s = await open("curator", { viewport });
  s.page.on("pageerror", e => console.log("PAGEERROR", e.message));
  s.page.on("console", m => { if (m.type()==="error") console.log("CONSOLE", m.text().slice(0,200)); });
  s.shot = (name) => s.page.screenshot({ path: shotDir + name + `__${viewport}.png`, fullPage: false });
  return s;
}
export { go, CMS, API };
export const shotPath = (n, vp) => shotDir + n + `__${vp}.png`;
