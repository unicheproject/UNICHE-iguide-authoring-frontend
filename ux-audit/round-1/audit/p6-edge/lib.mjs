import { open, go } from "../../../tools/session.mjs";
export { open, go };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const shot = (page, name, full=false) => page.screenshot({ path: `ux-audit/round-1/audit/p6-edge/shots/${name}.png`, fullPage: full });
export const log = console.log;
/** visible alerts/live regions/toasts text */
export async function alerts(page) {
  return page.evaluate(() => [...document.querySelectorAll('[role=alert],[role=status],[aria-live],[data-sonner-toast],.toast')].map(e => `${e.getAttribute('role')||''}/${e.getAttribute('aria-live')||''}: ${(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,300)}`).filter(s=>!s.endsWith(': ')));
}
export async function focused(page) {
  return page.evaluate(() => { const a=document.activeElement; return a ? `${a.tagName.toLowerCase()}#${a.id} name=${a.getAttribute('name')||''} label=${(a.getAttribute('aria-label')||a.textContent||'').trim().replace(/\s+/g,' ').slice(0,60)}` : 'none'; });
}
export function problem(status, code, extra = {}) {
  return { status, contentType: "application/problem+json", headers: {"x-request-id":"req-p6-0001"}, body: JSON.stringify({ type: "urn:uniche:iguide:problem:" + code.toLowerCase(), title: code, status, code, detail: "Forced by p6-edge audit", requestId: "req-p6-0001", ...extra }) };
}
export const API = "**/iguide/api/v1/**";
