import { API } from "../../../../tools/session.mjs";
export const problem = (status, code, extra = {}) => ({ status, contentType: "application/problem+json", headers: { "access-control-allow-origin": "http://localhost:5173" }, body: JSON.stringify({ status, code, title: "x", detail: "SECRET-DETAIL", requestId: "req-p2-test-0001", ...extra }) });
const cors = { "access-control-allow-origin": "http://localhost:5173", "access-control-allow-headers": "*", "access-control-expose-headers": "*" };
/** Replaces the JSON of one dashboard request: fn(real json) -> json, or a problem response. */
export async function mock(page, id, rules) {
  for (const [suffix, fn] of Object.entries(rules)) {
    await page.route((u) => u.toString().startsWith(`${API}/projects/${id}/${suffix}`), async (route) => {
      const url = route.request().url();
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-methods": "GET,OPTIONS" } });
      const real = await route.fetch();
      let json = null; try { json = await real.json(); } catch {}
      const out = fn(json, url);
      if (out && out.status) return route.fulfill(out);
      return route.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify(out) });
    });
  }
}
export const blocking = (issues) => (j) => ({ ...j, activatable: issues.length === 0, blocking: issues });
