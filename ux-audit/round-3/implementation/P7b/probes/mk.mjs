import { call, raw, closeAll } from "../../../../tools/lib.mjs";
import { open } from "../../../../tools/session.mjs";
import { browserMedia } from "../../../../tools/media.mjs";
import { writeFileSync } from "node:fs";
const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, context } = await open("admin", {});
const media = await browserMedia(context);
const ids = {};
async function up(key, name, w, h, mime = "image/png") {
  const bytes = await media.image(w, h, name, mime, 200);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), name + ".png");
  form.append("internalName", name);
  const r = await raw("admin", "POST", `/projects/${PID}/assets`, undefined, form);
  if (!r.ok) throw new Error(name + " " + r.status + JSON.stringify(r.json).slice(0, 300));
  ids[key] = r.json.id; console.log(key, r.json.id, r.json.version, r.json.status);
}
await up("one", "UX-R3-P7b one", 900, 600);
await up("tiny", "UX-R3-P7b tiny", 1, 1);
await up("small", "UX-R3-P7b small", 120, 90);
await up("long", "UX-R3-P7b long name with a very long title to wrap onto two lines in a tile", 800, 800);
writeFileSync("ids.json", JSON.stringify(ids));
await media.close(); await browser.close(); await closeAll();
