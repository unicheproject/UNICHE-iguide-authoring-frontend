// Creates and initializes an extra empty audit Project: node make-empty.mjs "<name>" <slug>
import { call, closeAll } from "./lib.mjs";
const ORG = "09e95c2c-5985-42f5-a9dd-6d06a8eb4a13";
const name = "UX Audit \u2013 Empty " + (process.env.SUFFIX ?? "B"), slug = "ux-audit-empty-" + (process.env.SUFFIX ?? "B").toLowerCase();
if (!name || !slug) throw new Error("usage: make-empty.mjs <name> <slug>");
let p = (await call("admin", "GET", `/organizations/${ORG}/projects`)).find((x) => x.name === name)
  ?? await call("admin", "POST", `/organizations/${ORG}/projects`, { name, slug });
if (!p.initialized) {
  const { templates } = await call("admin", "GET", "/templates");
  const t = templates.find((x) => x.key === "multi-region-network");
  p = await call("admin", "POST", `/projects/${p.id}/initialize`, {
    templateId: t.id, stylePreset: t.defaultStylePreset,
    languages: [{ languageCode: "en", displayName: "English", direction: "LTR" }, { languageCode: "el", displayName: "Ελληνικά", direction: "LTR" }],
    defaultLanguage: "en", surfaces: ["WEB", "MOBILE", "KIOSK"] });
}
console.log(name, p.id);
await closeAll();
