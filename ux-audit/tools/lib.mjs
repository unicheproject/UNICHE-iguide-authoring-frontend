import { open, bearer, API } from "./session.mjs";
export { API };
const sessions = {};
async function fresh(account) {
  if (!sessions[account]) sessions[account] = { ...(await open(account)) };
  sessions[account].auth = await bearer(sessions[account].page);
  sessions[account].at = Date.now();
  return sessions[account];
}
async function auth(account, force) {
  const s = sessions[account];
  if (!s || force || Date.now() - s.at > 180_000) return (await fresh(account)).auth;
  return s.auth;
}
export async function closeAll() { for (const s of Object.values(sessions)) await s.browser.close(); }
export async function raw(account, method, path, body, form) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const headers = { authorization: await auth(account, attempt > 0) };
    let b;
    if (form) b = form; else if (body !== undefined) { headers["content-type"] = "application/json"; b = JSON.stringify(body); }
    const r = await fetch(API + path, { method, headers, body: b });
    if (r.status === 401 && attempt === 0) continue;
    const text = await r.text();
    let json; try { json = text ? JSON.parse(text) : undefined; } catch { json = text; }
    return { status: r.status, ok: r.ok, json };
  }
}
export async function call(account, method, path, body, expected) {
  const r = await raw(account, method, path, body);
  if (expected ? r.status !== expected : !r.ok) {
    const e = new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(r.json)?.slice(0, 600)}`);
    e.status = r.status; e.body = r.json; throw e;
  }
  return r.json;
}
export function page(account) { return sessions[account].page; }
export async function ensure(account) { await auth(account); return sessions[account]; }
