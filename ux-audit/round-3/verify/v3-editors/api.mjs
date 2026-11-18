import { open, go, ids, P } from "./h.mjs";
import { API } from "../../../tools/session.mjs";
export async function apiSession() {
  const s = await open("admin", { viewport: "1440" });
  let auth; s.page.on("request", r => { const a = r.headers()["authorization"]; if (a && r.url().startsWith(API)) auth = a; });
  await go(s.page, `/projects/${P}/pois/${ids.poiDraft}`);
  for (let i=0;i<20 && !auth;i++) await s.page.waitForTimeout(500);
  const call = async (method, path, body) => { const r = await fetch(API + `/projects/${P}` + path, { method, headers: { authorization: auth, ...(body?{"content-type":"application/json"}:{}) }, body: body?JSON.stringify(body):undefined }); const t = await r.text(); let j; try { j = JSON.parse(t) } catch { j = t } return { status: r.status, json: j }; };
  return { ...s, call };
}
