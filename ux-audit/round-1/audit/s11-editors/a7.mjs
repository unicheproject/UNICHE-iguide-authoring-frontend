import { start, goP, log, API, PID, state } from "./lib.mjs";
import { bearer } from "../../../tools/session.mjs";
const s = await start("1440"); const { page } = s;
const auth = await bearer(page);
for (const p of state().pois.slice(0,4)) {
  const r = await page.evaluate(async ([API, auth, PID, id]) => {
    const h = { "content-type": "application/json", authorization: auth };
    const g = await (await fetch(`${API}/projects/${PID}/pois/${id}`, { headers: h })).json();
    const res = await fetch(`${API}/projects/${PID}/pois/${id}/status`, { method: "POST", headers: h, body: JSON.stringify({ targetStatus: "ACTIVE", version: g.version }) });
    return res.status + " " + (await res.text()).slice(0, 300);
  }, [API, auth, PID, p.id]);
  log(p.t.slice(-8), r);
}
await s.browser.close();
