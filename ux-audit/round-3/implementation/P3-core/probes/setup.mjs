// Creates the own records used by the P3-core probes (idempotent by slug).
import { open, go, bearer, API, P } from "./h.mjs";
const { browser, page } = await open("admin");
const auth = await bearer(page);
const H = { authorization: auth, "content-type": "application/json" };
const mk = async (kind, body) => {
  const r = await fetch(`${API}/projects/${P}/${kind}`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const j = await r.json();
  console.log(kind, body.slug, r.status, j.id ?? j.detail);
};
await mk("pois", { title: "UX-R3-P3core Move A", slug: "ux-r3-p3core-move-a", placeId: null, code: null });
await mk("pois", { title: "UX-R3-P3core Move B", slug: "ux-r3-p3core-move-b", placeId: null, code: null });
await mk("pois", { title: "UX-R3-P3core Αρχαιολογικός Περίπατος Ακροπόλεως Θεάτρου Διονύσου Ωδείου", slug: "ux-r3-p3core-greek", placeId: null, code: null });
await mk("events", { title: "UX-R3-P3core Αρχαιολογικός Περίπατος Ακροπόλεως Θεάτρου Διονύσου Ωδείου", slug: "ux-r3-p3core-event-greek" });
await mk("guides", { title: "UX-R3-P3core Αρχαιολογικός Περίπατος Ακροπόλεως Θεάτρου Διονύσου Ωδείου", slug: "ux-r3-p3core-guide-greek" });
await browser.close();
