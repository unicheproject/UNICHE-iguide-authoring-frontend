import { start, goP, log, API, PID, save } from "./lib.mjs";
import { bearer } from "../../../tools/session.mjs";
const s = await start("1440"); const { page } = s;
const auth = await bearer(page);
const site = "615cf675-15a6-42cc-9ce8-24ec217f44ce";
const names = [["UX-s11-editors Stop Alpha",37.9715,23.7257],["UX-s11-editors Stop Bravo",37.9717,23.7247],["UX-s11-editors Stop Charlie",37.9703,23.7285],["UX-s11-editors Stop Delta",37.9720,23.7270],["UX-s11-editors Stop Echo, a deliberately long point of interest title to test truncation in the stop rows of the route editor",37.9710,23.7240],["UX-s11-editors Stop Foxtrot (no coordinates)",null,null]];
const out = [];
for (const [t, lat, lon] of names) {
  const r = await page.evaluate(async ([API, auth, PID, site, t, lat, lon]) => {
    const h = { "content-type": "application/json", authorization: auth };
    const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60).replace(/-$/, "");
    let res = await fetch(`${API}/projects/${PID}/pois`, { method: "POST", headers: h, body: JSON.stringify({ title: t, slug, placeId: site, code: null }) });
    const created = await res.json();
    if (lat == null) return { s: res.status, id: created.id };
    const body = { ...created, latitude: lat, longitude: lon, version: created.version };
    res = await fetch(`${API}/projects/${PID}/pois/${created.id}`, { method: "PUT", headers: h, body: JSON.stringify(body) });
    return { s: res.status, id: created.id, put: res.status, text: res.ok ? "" : await res.text() };
  }, [API, auth, PID, site, t, lat, lon]);
  log(t.slice(0,30), JSON.stringify(r)); out.push({ t, id: r.id });
}
save({ pois: out });
await s.browser.close();
