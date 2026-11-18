// Seeds the two UX-audit Projects through the authoring API. Idempotent-ish: reuses what exists by name/title.
// Run with WINDOWS Node:  node ux-audit\tools\seed.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { raw, call, closeAll, ensure } from "./lib.mjs";
import { browserMedia, wav, pdf } from "./media.mjs";
import * as D from "./data.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "seed.json");
const ORG = "09e95c2c-5985-42f5-a9dd-6d06a8eb4a13";
const state0 = { projects: {}, places: [], pois: [], routes: [], guides: [], events: [], categories: [], maps: [], floorPlans: [], assets: [], triggers: [], languages: [], accountUsed: {}, failures: [], notes: [] };
const state = (() => { try { return { ...state0, ...JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "seed.json"), "utf8")), failures: [] }; } catch { return state0; } })();
const save = () => writeFileSync(OUT, JSON.stringify(state, null, 1));
const fail = (what, e) => { const m = `${what}: ${e.message ?? e}`; console.log("FAIL", m.slice(0, 400)); state.failures.push(m.slice(0, 500)); };
const log = (...a) => console.log(...a);

let CONTENT = "curator";
let PID = null;
const W = (m, p, b, exp) => call(CONTENT, m, p, b, exp);
const P = (p) => `/projects/${PID}${p}`;
const items = (r) => (Array.isArray(r) ? r : r?.content ?? r?.items ?? []);
async function listAll(path) {
  const out = [];
  for (let page = 0; page < 20; page++) {
    const r = await W("GET", `${path}${path.includes("?") ? "&" : "?"}size=200&page=${page}`);
    out.push(...items(r));
    if (Array.isArray(r) || !r.totalPages || page + 1 >= r.totalPages) break;
  }
  return out;
}
const cap = (kind, n = 0) => { state.accountUsed[kind] = CONTENT; };

// ---------- text helpers ----------
const { SENT } = D;
const para = (lang, seed, n) => D.paras(lang, seed, n).join("\n\n");
function poiText(lang, title, seed, full = true) {
  return { title, summary: lang === "en" ? `A closer look at ${title.length > 70 ? "this exhibit" : title}.` : `Μια πιο προσεκτική ματιά σε αυτό το έκθεμα.`,
    description: para(lang, seed, 3), instructions: full ? (lang === "en" ? "Follow the signs from the previous stop; the object is on your left." : "Ακολουθήστε τις πινακίδες από την προηγούμενη στάση· το έκθεμα βρίσκεται στα αριστερά σας.") : null,
    accessibilityInformation: full ? (lang === "en" ? "Step-free access; a seat is available nearby. A tactile model can be requested at the desk." : "Πρόσβαση χωρίς σκαλιά· υπάρχει κάθισμα κοντά. Αφής μοντέλο διατίθεται κατόπιν αιτήματος.") : null };
}
const FIELDS = {
  place: ["slug", "type", "environment", "parentPlaceId", "internalName", "latitude", "longitude", "featured"],
  poi: ["slug", "placeId", "code", "internalName", "latitude", "longitude", "estimatedVisitMinutes", "featured"],
  category: ["code", "scope", "parentCategoryId", "icon"],
  route: ["slug", "type", "travelMode", "difficulty", "estimatedDurationMinutes", "distanceMeters", "loop", "internalName", "featured"],
  guide: ["slug", "internalName", "estimatedReadingMinutes", "featured"],
  event: ["slug", "placeId", "poiId", "routeId", "bookingUrl", "internalName", "featured"],
  map: ["internalName", "placeId", "initialLatitude", "initialLongitude", "initialZoom", "minLatitude", "minLongitude", "maxLatitude", "maxLongitude", "visibility", "visitorFilterEnabled"],
  floorplan: ["internalName", "placeId", "assetId", "width", "height"],
  asset: ["internalName", "decorative"],
};
async function upd(path, kind, obj, changes) {
  const body = { version: obj.version };
  for (const f of FIELDS[kind]) body[f] = f in changes ? changes[f] : obj[f];
  if (changes.translations) body.translations = changes.translations;
  return W("PUT", `${path}/${obj.id}`, body);
}
async function setStatus(path, obj, target) {
  return W("POST", `${path}/${obj.id}/status`, { targetStatus: target, version: obj.version });
}
const titleOf = (o, lang = "en") => o.translations?.[lang]?.title ?? o.translations?.[lang]?.name ?? o.internalName;

// ---------- projects ----------
async function initOnce(p, body) {
  const cur = await call("admin", "GET", `/projects/${p.id}`);
  if (cur.initialized) return cur;
  return call("admin", "POST", `/projects/${p.id}/initialize`, body);
}
async function ensureProject(name, slug) {
  const existing = (await call("admin", "GET", `/organizations/${ORG}/projects`)).find((p) => p.name === name);
  let p = existing;
  if (!p) { p = await call("admin", "POST", `/organizations/${ORG}/projects`, { name, slug }); log("created project", name); state.notes.push(`Project ${name} created by admin`); }
  if (!p.initialized) {
    const { templates } = await call("admin", "GET", "/templates");
    const t = templates.find((x) => x.key === "multi-region-network");
    p = await initOnce(p, {
      templateId: t.id, stylePreset: t.defaultStylePreset,
      languages: [{ languageCode: "en", displayName: "English", direction: "LTR" }, { languageCode: "el", displayName: "Ελληνικά", direction: "LTR" }, { languageCode: "it", displayName: "Italiano", direction: "LTR" }],
      defaultLanguage: "en", surfaces: ["WEB", "MOBILE", "KIOSK"],
    });
    log("initialized", name);
    state.accountUsed.createAndInitializeProject = "admin";
    if (name === D.NAMES.empty) {
      // The Empty Project has English and Greek only.
    }
  }
  return p;
}
async function ensureEmpty() {
  const name = D.NAMES.empty;
  const existing = (await call("admin", "GET", `/organizations/${ORG}/projects`)).find((p) => p.name === name);
  let p = existing ?? await call("admin", "POST", `/organizations/${ORG}/projects`, { name, slug: "ux-audit-empty" });
  if (!p.initialized) {
    const { templates } = await call("admin", "GET", "/templates");
    const t = templates.find((x) => x.key === "multi-region-network");
    p = await initOnce(p, {
      templateId: t.id, stylePreset: t.defaultStylePreset,
      languages: [{ languageCode: "en", displayName: "English", direction: "LTR" }, { languageCode: "el", displayName: "Ελληνικά", direction: "LTR" }],
      defaultLanguage: "en", surfaces: ["WEB", "MOBILE", "KIOSK"],
    });
  }
  return p;
}

// ---------- assets ----------
const A = {}; // key -> asset response
async function seedAssets(media) {
  const existing = new Map((await listAll(P("/assets"))).map((a) => [a.internalName, a]));
  for (const row of D.ASSETS) {
    const [key, kind, name, w, h, mime, hue, enT, elT, enAlt, elAlt, itAlt, status, extra = {}] = row;
    try {
      let a = existing.get(name);
      if (!a) {
        let bytes, fname, type;
        if (kind === "image") { bytes = await media.image(w, h, enT, mime, hue); fname = name + (mime === "image/png" ? ".png" : ".jpg"); }
        else if (kind === "plan") { bytes = await media.image(w, h, enT, mime, 0, "plan"); fname = name + ".png"; type = "FLOOR_PLAN"; }
        else if (kind === "audio") { bytes = wav(w, h); fname = name + ".wav"; }
        else if (kind === "video") { bytes = await media.video(w, enT, h); fname = name + ".webm"; }
        else if (kind === "pdf") { bytes = pdf(enT, ["UX audit sample document.", "This file is generated test data.", "It has one page of placeholder text."]); fname = name; }
        else { bytes = Buffer.from(`Curatorial notes\n================\n\nUX audit sample text file.\nΣημειώσεις με ελληνικούς χαρακτήρες.\n`, "utf8"); fname = name; }
        const form = new FormData();
        form.append("file", new Blob([bytes], { type: mime }), fname);
        form.append("internalName", name);
        if (type) form.append("type", type);
        const r = await raw(CONTENT, "POST", P("/assets"), undefined, form);
        if (!r.ok) throw new Error(`upload ${name} -> ${r.status} ${JSON.stringify(r.json).slice(0, 300)}`);
        a = r.json;
        const tr = { en: { title: enT, caption: null, alternativeText: enAlt, credits: "\u00a9 UX Audit sample content", transcript: extra.transcript ?? null } };
        if (elT) tr.el = { title: elT, caption: null, alternativeText: elAlt, credits: "\u00a9 Δείγμα περιεχομένου", transcript: null };
        if (itAlt) tr.it = { title: enT, caption: null, alternativeText: itAlt, credits: null, transcript: null };
        a = await upd(P("/assets"), "asset", a, { internalName: name, decorative: !!extra.decorative, translations: tr });
      }
      if (a.status !== status && status !== "DRAFT") {
        try { a = await setStatus(P("/assets"), a, status); } catch (e) { fail(`asset ${name} -> ${status}`, e); }
      }
      A[key] = a;
    } catch (e) { fail(`asset ${name}`, e); }
  }
  state.assets = Object.entries(A).map(([key, a]) => ({ key, id: a.id, kind: a.type, name: a.internalName, status: a.status, mime: a.mimeType }));
  save();
}

// ---------- categories ----------
const CAT = {};
async function seedCategories() {
  const existing = await listAll(P("/categories"));
  for (const c of existing) CAT[`__id_${c.id}`] = c;
  for (const [key, parent, scope, icon, en, el, it] of D.CATEGORIES) {
    try {
      let c = existing.find((x) => titleOf(x) === en && x.scope === scope);
      if (!c) {
        c = await W("POST", P("/categories"), { name: en, scope, parentCategoryId: parent ? CAT[parent].id : null });
        const tr = { en: { name: en, description: `${en} in the iGuide sample content.` }, el: { name: el, description: `${el} στο δείγμα περιεχομένου του iGuide.` } };
        if (it) tr.it = { name: it, description: null };
        c = await upd(P("/categories"), "category", c, { icon, translations: tr });
        try { c = await setStatus(P("/categories"), c, "ACTIVE"); } catch (e) { fail(`category ${en} activate`, e); }
      }
      CAT[key] = c;
    } catch (e) { fail(`category ${key}`, e); }
  }
  state.categories = D.CATEGORIES.filter((r) => CAT[r[0]]).map((r) => ({ key: r[0], id: CAT[r[0]].id, scope: r[2], parent: r[1], name: r[4], status: CAT[r[0]].status, icon: r[3] }));
  save();
}

// ---------- places ----------
const PL = {};
async function seedPlaces() {
  const existing = await listAll(P("/places"));
  for (const [key, parent, type, env, en, el, it, lat, lon] of D.PLACES) {
    try {
      let p = existing.find((x) => titleOf(x) === en);
      if (!p) {
        p = await W("POST", P("/places"), { title: en, type, environment: env, parentPlaceId: parent ? PL[parent].id : null });
        const tr = {
          en: { title: en, summary: `${en}: what to see and how to get there.`, description: para("en", PL_SEED(key), 2), visitorInformation: "Open daily 08:00\u201320:00. Tickets are sold at the entrance.", accessibilityInformation: "Step-free route available; ask staff for the lift key." },
          el: { title: el, summary: `${el}: τι να δείτε και πώς να φτάσετε.`, description: para("el", PL_SEED(key), 2), visitorInformation: "Ανοιχτά καθημερινά 08:00\u201320:00. Τα εισιτήρια πωλούνται στην είσοδο.", accessibilityInformation: "Διαθέσιμη διαδρομή χωρίς σκαλιά· ζητήστε το κλειδί του ανελκυστήρα." },
        };
        if (it) tr.it = { title: it, summary: null, description: null, visitorInformation: null, accessibilityInformation: null };
        p = await upd(P("/places"), "place", p, { latitude: lat, longitude: lon, featured: ["site", "museum", "agora"].includes(key), internalName: en, translations: tr });
        if (!["gf", "slopes", "korai"].includes(key)) {
          try { p = await setStatus(P("/places"), p, "ACTIVE"); } catch (e) { fail(`place ${en} activate`, e); }
        }
      }
      PL[key] = p;
    } catch (e) { fail(`place ${key}`, e); }
  }
  state.places = D.PLACES.filter((r) => PL[r[0]]).map((r) => ({ key: r[0], id: PL[r[0]].id, title: r[4], type: r[2], environment: r[3], parent: r[1], status: PL[r[0]].status }));
  save();
}
const PL_SEED = (k) => [...k].reduce((a, c) => a + c.charCodeAt(0), 0);

// ---------- POIs ----------
const PO = {};
const heroImgs = ["a_parthenon_dawn", "a_frieze", "a_peplos", "a_erechtheion", "a_agora", "a_theatre", "a_nike", "a_rampin", "a_slopes", "a_ostrakon", "a_klepsydra", "a_shop", "a_panorama"];
const bindAsset = async (kind, id, key, usage) => {
  if (!A[key]) return;
  try { await W("POST", P(`/${kind}/${id}/resource-assets`), { assetId: A[key].id, usage, languageCode: null }); }
  catch (e) { if (!/ALREADY|DUPLICATE|409/.test(e.message)) fail(`bind ${key} to ${kind}/${id} as ${usage}`, e); }
};
async function seedTriggers(existingTriggers, poi, key, kind, idx) {
  if (existingTriggers.some((t) => t.targetResourceId === poi.id)) return null;
  const lat = Number(poi.latitude ?? 37.97), lon = Number(poi.longitude ?? 23.72);
  const body = { targetResourceType: "POI", targetResourceId: poi.id, triggerType: kind === "qr" ? "QR_CODE" : kind === "geo" ? "GEO_PROXIMITY" : "BEACON", supportedSurfaces: null, configuration: {} };
  if (kind === "qr") body.code = `${key.replace(/_/g, "-")}-${100 + idx}`;
  if (kind === "geo") body.configuration = { latitude: lat, longitude: lon, radiusMeters: 25 + idx * 3, cooldownSeconds: 300 };
  if (kind === "beacon") { body.configuration = { uuid: `e2c56db5-dffb-48d2-b060-d0f5a71096${String(10 + idx).padStart(2, "0")}`, major: 100 + idx, minor: idx, proximityMeters: 3, cooldownSeconds: 600 }; body.supportedSurfaces = ["MOBILE"]; }
  return W("POST", P("/triggers"), body);
}
async function seedPois() {
  const existing = await listAll(P("/pois"));
  const triggers = await listAll(P("/triggers"));
  const newTriggers = [];
  let i = 0, audioN = 0;
  const audios = ["au_frieze", "au_peplos", "au_parthenon", "au_erechtheion", "au_moschophoros", "au_ambient"];
  const videos = ["v_dionysos", "v_slopes", "v_clip"];
  for (const [key, placeKey, catKey, en, el, it, status, flags] of D.POIS) {
    i++;
    try {
      let p = existing.find((x) => titleOf(x) === en);
      const fresh = !p;
      if (!p) {
        const place = D.PLACES.find((r) => r[0] === placeKey);
        p = await W("POST", P("/pois"), { title: en, placeId: PL[placeKey]?.id ?? null, code: i % 3 === 0 ? String(100 + i) : null });
        const lat = flags.noGeo ? null : +(place[7] + ((i * 7) % 11 - 5) * 0.00012).toFixed(6);
        const lon = flags.noGeo ? null : +(place[8] + ((i * 5) % 13 - 6) * 0.00014).toFixed(6);
        const tr = { en: poiText("en", en, i), el: poiText("el", el, i) };
        if (it) tr.it = { title: it, summary: `Uno sguardo ravvicinato: ${it}.`, description: null, instructions: null, accessibilityInformation: null };
        p = await upd(P("/pois"), "poi", p, { latitude: lat, longitude: lon, internalName: key, estimatedVisitMinutes: 3 + (i % 9) * 2, featured: i % 7 === 0, translations: tr });
        if (CAT[catKey]) { try { await W("POST", P(`/pois/${p.id}/categories`), { categoryId: CAT[catKey].id }); } catch (e) { fail(`poi ${key} category`, e); } }
        for (const m of flags.media ?? []) {
          if (m === "hero") await bindAsset("pois", p.id, heroImgs[i % heroImgs.length], "HERO_IMAGE");
          if (m === "gallery") await bindAsset("pois", p.id, heroImgs[(i + 4) % heroImgs.length], "GALLERY_IMAGE");
          if (m === "audio") await bindAsset("pois", p.id, audios[audioN++ % audios.length], "AUDIO_NARRATION");
          if (m === "video") await bindAsset("pois", p.id, videos[i % 2], "VIDEO");
          if (m === "attachment") await bindAsset("pois", p.id, "d_access", "ATTACHMENT");
        }
        if (flags.t) {
          try { const t = await seedTriggers(triggers, p, key, flags.t, i); if (t) newTriggers.push(t); } catch (e) { fail(`trigger ${key}`, e); }
        }
        if (status !== "DRAFT") {
          try { p = await setStatus(P("/pois"), p, "ACTIVE"); } catch (e) { fail(`poi ${key} activate`, e); }
        }
        if (status === "ARCHIVED") { try { p = await setStatus(P("/pois"), p, "ARCHIVED"); } catch (e) { fail(`poi ${key} archive`, e); } }
      }
      if (flags.wc && p.status === "ACTIVE" && !p.hasWorkingCopy) {
        try {
          const cur = await W("GET", P(`/pois/${p.id}`));
          const tr = JSON.parse(JSON.stringify(cur.translations));
          tr.en.title = `${en.slice(0, 80)} (revised wording)`;
          tr.en.description = `${tr.en.description}\n\nNew paragraph added in the pending edit: recent conservation has revealed further surface detail.`;
          if (tr.el) tr.el.summary = "Αναθεωρημένη περίληψη σε εκκρεμή αλλαγή.";
          await W("PUT", P(`/pois/${p.id}/working-copy`), { baseVersion: cur.version, workingCopyVersion: null,
            payload: { slug: cur.slug, placeId: cur.placeId, code: cur.code, internalName: cur.internalName, latitude: cur.latitude, longitude: cur.longitude, estimatedVisitMinutes: (cur.estimatedVisitMinutes ?? 5) + 2, featured: cur.featured, translations: tr } });
        } catch (e) { fail(`poi ${key} working copy`, e); }
      }
      p = await W("GET", P(`/pois/${p.id}`));
      PO[key] = p;
    } catch (e) { fail(`poi ${key}`, e); }
  }
  const all = await listAll(P("/triggers"));
  state.triggers = all.map((t) => ({ id: t.id, type: t.triggerType, target: t.targetResourceId, code: t.code }));
  state.pois = D.POIS.filter((r) => PO[r[0]]).map((r) => { const p = PO[r[0]]; return { key: r[0], id: p.id, title: p.translations?.en?.title, status: p.status, hasWorkingCopy: !!p.hasWorkingCopy, hasTrigger: all.some((t) => t.targetResourceId === p.id), hasGeo: p.latitude != null, longTitle: (r[3] ?? "").length >= 100 || (r[4] ?? "").length >= 100 }; });
  save();
}

// ---------- routes ----------
const RT = {};
async function seedRoutes() {
  const existing = await listAll(P("/routes"));
  let i = 0;
  for (const [key, en, el, it, type, mode, diff, mins, meters, loop, status, catKey, stops] of D.ROUTES) {
    i++;
    try {
      let r = existing.find((x) => titleOf(x) === en);
      if (!r) {
        r = await W("POST", P("/routes"), { title: en, type });
        const tr = {
          en: { title: en, summary: `A ${mins}-minute route: ${en}.`, description: para("en", i, 3), instructions: "Wear comfortable shoes. Stops are numbered on the map; follow the signs." },
          el: { title: el, summary: `Διαδρομή ${mins} λεπτών: ${el}.`, description: para("el", i, 3), instructions: "Φορέστε άνετα παπούτσια. Οι στάσεις είναι αριθμημένες στον χάρτη." },
        };
        if (it) tr.it = { title: it, summary: null, description: null, instructions: null };
        r = await upd(P("/routes"), "route", r, { type, travelMode: mode, difficulty: diff, estimatedDurationMinutes: mins, distanceMeters: meters, loop, internalName: key, featured: i === 1, translations: tr });
        let n = 0;
        for (const pk of stops) {
          if (!PO[pk]) continue; n++;
          try {
            await W("POST", P(`/routes/${r.id}/stops`), { poiId: PO[pk].id, translations: { en: { titleOverride: null, description: `Stop ${n}: ${poiTitle(pk)}.`, navigationInstructions: n > 1 ? "Continue along the marked path." : "Start here.", narrative: para("en", n, 1) }, el: { titleOverride: null, description: `Στάση ${n}.`, navigationInstructions: n > 1 ? "Συνεχίστε στο σηματοδοτημένο μονοπάτι." : "Ξεκινήστε εδώ.", narrative: null } } });
          } catch (e) { fail(`route ${key} stop ${pk}`, e); }
        }
        if (CAT[catKey]) { try { await W("POST", P(`/routes/${r.id}/categories`), { categoryId: CAT[catKey].id }); } catch (e) { fail(`route ${key} category`, e); } }
        if (key === "acro") await bindAsset("routes", r.id, "a_panorama", "HERO_IMAGE");
        if (key === "museum") await bindAsset("routes", r.id, "a_slopes", "HERO_IMAGE");
        r = await W("GET", P(`/routes/${r.id}`));
        if (status !== "DRAFT") { try { r = await setStatus(P("/routes"), r, "ACTIVE"); } catch (e) { fail(`route ${key} activate`, e); } }
        if (status === "ARCHIVED") { try { r = await setStatus(P("/routes"), r, "ARCHIVED"); } catch (e) { fail(`route ${key} archive`, e); } }
      }
      if (key === "family" && r.status === "ACTIVE" && !r.hasWorkingCopy) {
        try {
          const cur = await W("GET", P(`/routes/${r.id}`));
          const tr = JSON.parse(JSON.stringify(cur.translations)); tr.en.summary = "Pending edit: a new, shorter summary for the family trail.";
          await W("PUT", P(`/routes/${r.id}/working-copy`), { baseVersion: cur.version, workingCopyVersion: null, payload: { slug: cur.slug, type: cur.type, travelMode: cur.travelMode, difficulty: cur.difficulty, estimatedDurationMinutes: 50, distanceMeters: cur.distanceMeters, loop: cur.loop, internalName: cur.internalName, featured: cur.featured, translations: tr, stops: cur.stops.map((s) => ({ poiId: s.poiId, translations: s.translations })) } });
        } catch (e) { fail("route family working copy", e); }
      }
      r = await W("GET", P(`/routes/${r.id}`));
      RT[key] = r;
    } catch (e) { fail(`route ${key}`, e); }
  }
  state.routes = D.ROUTES.filter((r) => RT[r[0]]).map((r) => ({ key: r[0], id: RT[r[0]].id, title: r[1], status: RT[r[0]].status, stops: RT[r[0]].stops?.length ?? 0, hasWorkingCopy: !!RT[r[0]].hasWorkingCopy }));
  save();
}
const poiTitle = (k) => D.POIS.find((r) => r[0] === k)?.[3].slice(0, 80);

// ---------- guides ----------
const GD = {};
async function seedGuides() {
  const existing = await listAll(P("/guides"));
  const inlineImgs = ["a_frieze", "a_erechtheion", "a_peplos", "a_agora", "a_nike"];
  let gi = 0;
  for (const [key, en, el, it, status, nBlocks, mins] of D.GUIDES) {
    gi++;
    try {
      let g = existing.find((x) => titleOf(x) === en);
      if (!g) {
        g = await W("POST", P("/guides"), { title: en });
        const tr = { en: { title: en, summary: `A long-form companion story: ${en}.` }, el: { title: el, summary: `Μια εκτενής αφήγηση: ${el}.` } };
        if (it) tr.it = { title: it, summary: null };
        g = await upd(P("/guides"), "guide", g, { internalName: key, estimatedReadingMinutes: mins, featured: gi === 1, translations: tr });
        const refPoi = Object.values(PO).filter((p) => p.status !== "ARCHIVED");
        for (let b = 0; b < nBlocks; b++) {
          try {
            if (b % 6 === 5) {
              const kinds = [["POI", refPoi[(b * 3 + gi) % refPoi.length]?.id], ["ROUTE", RT.acro?.id], ["EVENT", GE?.fullmoon?.id], ["PLACE", PL.site?.id]];
              const [rt, rid] = kinds[(b / 6 | 0) % 4 === 1 && RT.acro ? 1 : (b / 6 | 0) % 4 === 2 && GE?.fullmoon ? 2 : 0];
              await W("POST", P(`/guides/${g.id}/blocks`), { blockType: "REFERENCE", resourceType: rt, resourceId: rid, translations: { en: { caption: "Related: see this in the visitor app." }, el: { caption: "Σχετικό: δείτε το στην εφαρμογή." } } });
            } else {
              const nodes = (lang) => {
                const out = [];
                if (b % 3 === 0) out.push({ type: "heading", level: 2, text: lang === "en" ? `Chapter ${b + 1}: ${["Origins", "Construction", "Daily life", "Conflict and change", "Rediscovery", "Conservation today"][b % 6]}` : `Κεφάλαιο ${b + 1}: ${["Αρχές", "Κατασκευή", "Καθημερινή ζωή", "Σύγκρουση και αλλαγή", "Επανανακάλυψη", "Συντήρηση σήμερα"][b % 6]}` });
                D.paras(lang, b + gi, 2 + (b % 2)).forEach((t) => out.push({ type: "paragraph", text: t }));
                if (b % 4 === 1 && A[inlineImgs[(b + gi) % inlineImgs.length]]) out.push({ type: "asset", assetId: A[inlineImgs[(b + gi) % inlineImgs.length]].id });
                return out;
              };
              const tr2 = { en: { text: { blocks: nodes("en") } }, el: { text: { blocks: nodes("el") } } };
              if (it && b < 3) tr2.it = { text: { blocks: [{ type: "paragraph", text: "Testo in italiano disponibile solo per i primi blocchi." }] } };
              await W("POST", P(`/guides/${g.id}/blocks`), { blockType: "TEXT", translations: tr2 });
            }
          } catch (e) { fail(`guide ${key} block ${b}`, e); }
        }
        await bindAsset("guides", g.id, heroImgs[gi % heroImgs.length], "HERO_IMAGE");
        g = await W("GET", P(`/guides/${g.id}`));
        if (status !== "DRAFT") { try { g = await setStatus(P("/guides"), g, "ACTIVE"); } catch (e) { fail(`guide ${key} activate`, e); } }
        if (status === "ARCHIVED") { try { g = await setStatus(P("/guides"), g, "ARCHIVED"); } catch (e) { fail(`guide ${key} archive`, e); } }
      }
      if (key === "parthenon" && g.status === "ACTIVE" && !g.hasWorkingCopy) {
        try {
          const cur = await W("GET", P(`/guides/${g.id}`));
          const tr = JSON.parse(JSON.stringify(cur.translations)); tr.en.summary = "Pending edit: updated summary of the Parthenon story.";
          await W("PUT", P(`/guides/${g.id}/working-copy`), { baseVersion: cur.version, workingCopyVersion: null, payload: { slug: cur.slug, internalName: cur.internalName, estimatedReadingMinutes: cur.estimatedReadingMinutes, featured: cur.featured, translations: tr, blocks: cur.blocks.map((b) => ({ blockType: b.blockType, resourceType: b.resourceType, resourceId: b.resourceId, translations: b.translations })) } });
        } catch (e) { fail("guide parthenon working copy", e); }
      }
      g = await W("GET", P(`/guides/${g.id}`));
      GD[key] = g;
    } catch (e) { fail(`guide ${key}`, e); }
  }
  state.guides = D.GUIDES.filter((r) => GD[r[0]]).map((r) => ({ key: r[0], id: GD[r[0]].id, title: r[1], status: GD[r[0]].status, blocks: GD[r[0]].blocks?.length ?? 0, hasWorkingCopy: !!GD[r[0]].hasWorkingCopy }));
  save();
}

// ---------- events ----------
const GE = {};
async function seedEvents() {
  const existing = await listAll(P("/events"));
  let i = 0;
  for (const [key, en, el, it, status, placeKey, poiKey, routeKey, occ] of D.EVENTS) {
    i++;
    try {
      let e = existing.find((x) => titleOf(x) === en);
      if (!e) {
        e = await W("POST", P("/events"), { title: en });
        const tr = { en: { title: en, summary: `Join us: ${en}.`, description: para("en", i, 2), locationText: "Meet at the main entrance." }, el: { title: el, summary: `Ελάτε και εσείς: ${el}.`, description: para("el", i, 2), locationText: "Συνάντηση στην κύρια είσοδο." } };
        if (it) tr.it = { title: it, summary: null, description: null, locationText: null };
        e = await upd(P("/events"), "event", e, { placeId: PL[placeKey]?.id ?? null, poiId: poiKey ? PO[poiKey]?.id ?? null : null, routeId: routeKey ? RT[routeKey]?.id ?? null : null, bookingUrl: i % 2 ? "https://tickets.example.org/ux-audit/" + key : null, internalName: key, featured: i === 1, translations: tr });
        for (const [s, en2, st] of occ) { try { await W("POST", P(`/events/${e.id}/occurrences`), { startsAt: s, endsAt: en2, status: st ?? "SCHEDULED" }); } catch (x) { fail(`event ${key} occurrence`, x); } }
        if (i % 2) await bindAsset("events", e.id, heroImgs[(i * 2) % heroImgs.length], "HERO_IMAGE");
        e = await W("GET", P(`/events/${e.id}`));
        if (status !== "DRAFT") { try { e = await setStatus(P("/events"), e, "ACTIVE"); } catch (x) { fail(`event ${key} activate`, x); } }
        if (status === "ARCHIVED") { try { e = await setStatus(P("/events"), e, "ARCHIVED"); } catch (x) { fail(`event ${key} archive`, x); } }
      }
      e = await W("GET", P(`/events/${e.id}`));
      GE[key] = e;
    } catch (e) { fail(`event ${key}`, e); }
  }
  state.events = D.EVENTS.filter((r) => GE[r[0]]).map((r) => ({ key: r[0], id: GE[r[0]].id, title: r[1], status: GE[r[0]].status }));
  save();
}

// ---------- maps and floor plans ----------
async function seedMaps() {
  const existing = await listAll(P("/maps"));
  const out = [];
  for (const [name, placeKey, [clat, clon], zoom, [a, b, c, d], placements] of D.MAPS) {
    try {
      let m = existing.find((x) => x.internalName === name);
      if (!m) {
        m = await W("POST", P("/maps"), { internalName: name, placeId: PL[placeKey]?.id ?? null, initialLatitude: clat, initialLongitude: clon, initialZoom: zoom, minLatitude: a, minLongitude: b, maxLatitude: c, maxLongitude: d, area: name.split(" \u2013")[0], osmId: null });
        for (const pk of placements) {
          if (pk === placeKey) continue;
          try {
            const poi = PO[pk]; const pl = PL[pk];
            if (poi) { if (poi.latitude == null || poi.status === "ARCHIVED") continue; await W("POST", P(`/maps/${m.id}/resources`), { resourceType: "POI", resourceId: poi.id, latitude: poi.latitude, longitude: poi.longitude }); }
            else if (pl) { const row = D.PLACES.find((r) => r[0] === pk); await W("POST", P(`/maps/${m.id}/resources`), { resourceType: "PLACE", resourceId: pl.id, latitude: row[7], longitude: row[8] }); }
          } catch (e) { fail(`map ${name} placement ${pk}`, e); }
        }
        m = await W("GET", P(`/maps/${m.id}`));
        if (name.startsWith("Acropolis") && CAT.shops) {
          try { m = await upd(P("/maps"), "map", m, { visibility: { POI: { visible: true, hiddenCategoryIds: [CAT.shops.id] }, ROUTE: { visible: true, hiddenCategoryIds: [] } }, visitorFilterEnabled: true }); } catch (e) { fail("map visibility", e); }
        }
        try { m = await setStatus(P("/maps"), m, "ACTIVE"); } catch (e) { fail(`map ${name} activate`, e); }
      }
      out.push({ id: m.id, name, status: m.status, placeId: m.placeId });
    } catch (e) { fail(`map ${name}`, e); }
  }
  state.maps = out; save();
}
async function seedFloorPlans() {
  const existing = await listAll(P("/floor-plans"));
  const out = [];
  const keys = ["fp_parthenon", "fp_archaic"];
  let n = 0;
  for (const [name, placeKey, w, h, items2] of D.FLOORPLANS) {
    const ak = keys[n++];
    try {
      let f = existing.find((x) => x.internalName === name);
      if (!f) {
        f = await W("POST", P("/floor-plans"), { internalName: name, placeId: PL[placeKey]?.id ?? null, assetId: A[ak]?.id ?? null, width: w, height: h });
        let j = 0;
        for (const k of items2) {
          if (k === placeKey) continue; j++;
          try {
            const poi = PO[k], pl = PL[k];
            if (poi && poi.status === "ARCHIVED") continue;
            await W("POST", P(`/floor-plans/${f.id}/positions`), { resourceType: poi ? "POI" : "PLACE", resourceId: (poi ?? pl).id, x: +(0.12 + ((j * 0.17) % 0.75)).toFixed(3), y: +(0.2 + ((j * 0.23) % 0.6)).toFixed(3), rotation: (j * 45) % 360 });
          } catch (e) { fail(`floor plan ${name} position ${k}`, e); }
        }
        f = await W("GET", P(`/floor-plans/${f.id}`));
        try { f = await setStatus(P("/floor-plans"), f, "ACTIVE"); } catch (e) { fail(`floor plan ${name} activate`, e); }
      }
      out.push({ id: f.id, name, status: f.status, placeId: f.placeId });
    } catch (e) { fail(`floor plan ${name}`, e); }
  }
  state.floorPlans = out; save();
}

// ---------- main ----------
async function main() {
  const sess = await ensure("admin");
  const populated = await ensureProject(D.NAMES.populated, "ux-audit-populated");
  const empty = await ensureEmpty();
  PID = populated.id;
  state.projects = { populated: { id: populated.id, name: populated.name, slug: "ux-audit-populated", template: "multi-region-network", stylePreset: "aegean-network", defaultLanguage: "en" }, empty: { id: empty.id, name: empty.name } };
  state.languages = ["en (default)", "el", "it (partial)"];
  save();
  // Who can write content?
  await ensure("curator");
  for (const acct of ["curator", "admin"]) {
    const r = await raw(acct, "GET", `/projects/${PID}`);
    log("project access", acct, r.status);
    state.accountUsed[`openPopulated_${acct}`] = r.status;
    if (acct === "curator" && r.ok) { const w = await raw("curator", "GET", P("/pois?size=1")); if (w.ok) { CONTENT = "curator"; break; } }
    if (acct === "admin") CONTENT = "admin";
  }
  state.accountUsed.content = CONTENT; log("content account", CONTENT);
  const media = await browserMedia((await ensure("admin")).context);
  await seedAssets(media);
  await media.close();
  await seedCategories();
  await seedPlaces();
  await seedPois();
  await seedRoutes();
  await seedEvents();
  await seedGuides();
  await seedMaps();
  await seedFloorPlans();
  // Curator access to both Projects
  for (const [k, p] of Object.entries(state.projects)) {
    const r = await raw("curator", "GET", `/projects/${p.id}`);
    state.accountUsed[`curatorCanOpen_${k}`] = r.status;
    const rr = await raw("curator", "GET", `/projects/${p.id}/readiness`);
    state.accountUsed[`curatorReadiness_${k}`] = rr.status;
  }
  // Readiness summary of the populated Project (for the auditor).
  const rd = await raw(CONTENT, "GET", P("/readiness"));
  state.readiness = rd.json;
  save();
  log("DONE failures:", state.failures.length);
  await closeAll();
}
main().catch(async (e) => { console.error("FATAL", e); state.failures.push("FATAL " + e.message); save(); await closeAll().catch(() => {}); process.exit(1); });
