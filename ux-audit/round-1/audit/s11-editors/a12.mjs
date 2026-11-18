import { start, goP, log, dump, state, focused, API, PID } from "./lib.mjs";
import { bearer } from "../../../tools/session.mjs";
const s = await start("1440"); const { page } = s;
const auth = await bearer(page);
const id = state().routeUrl.split("/").pop();
const r = await page.evaluate(async ([API, auth, PID, id]) => {
  const h = { authorization: auth };
  const st = await (await fetch(`${API}/projects/${PID}/routes/${id}/stops`, { headers: h })).json();
  return JSON.stringify(st).slice(0, 800);
}, [API, auth, PID, id]);
log(r);
await page.goto("http://localhost:5173" + state().routeUrl); await page.waitForTimeout(2500);
await s.tall("route-editor__active-tall");
const t = await dump(page); log(t.slice(t.indexOf("STOPS"), t.indexOf("STOPS")+900));
await s.browser.close();
