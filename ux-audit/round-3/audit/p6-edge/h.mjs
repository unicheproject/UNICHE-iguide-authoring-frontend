import { open, go, CMS, API } from "../../../tools/session.mjs";
import { appendFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export { open, go, CMS, API };
export const here = dirname(fileURLToPath(import.meta.url));
export const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const P = (p) => `/projects/${PID}${p}`;
export const ids = JSON.parse(readFileSync(join(here, "ids.json"), "utf8"));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const LOG = (name) => (...a) => { const s = a.map((x) => typeof x === "string" ? x : JSON.stringify(x)).join(" "); console.log(s); appendFileSync(join(here, "logs-" + name + ".txt"), s + "\n"); };
export const shot = (page, name) => page.screenshot({ path: join(here, "shots", name + ".png") }).catch((e) => console.log("shot fail", name, e.message));
export async function session(opts = {}) {
  const s = await open("admin", opts);
  await s.context.addInitScript(() => {
    window.__live = [];
    const rec = (n, why) => { try { const el = n.nodeType === 3 ? n.parentElement : n; if (!el || !el.closest) return; const lr = el.closest("[aria-live],[role=status],[role=alert],[role=log]"); if (lr) { const t = (lr.textContent || "").trim(); if (t) window.__live.push({ role: lr.getAttribute("role") || lr.getAttribute("aria-live"), text: t.slice(0, 220), why }); } } catch {} };
    const start = () => new MutationObserver((ms) => { for (const m of ms) { if (m.type === "childList") m.addedNodes.forEach((n) => rec(n, "add")); else rec(m.target, "chars"); } }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    if (document.documentElement) start(); else document.addEventListener("DOMContentLoaded", start);
  });
  return s;
}
export const live = (page) => page.evaluate(() => window.__live.splice(0));
export const AE = (page) => page.evaluate(() => { const a = document.activeElement; if (!a) return null; return (a.tagName.toLowerCase() + (a.id ? "#" + a.id : "") + (a.getAttribute("role") ? "[" + a.getAttribute("role") + "]" : "") + ' "' + (a.getAttribute("aria-label") || a.textContent || a.value || "").trim().slice(0, 50) + '"'); });
/** Visible text of alert/status/dialog/toast regions + canary check */
export const msgs = (page) => page.evaluate(() => {
  const sel = '[role=alert],[role=status],[role=dialog],[role=alertdialog],[aria-live],[data-sonner-toast],[class*=toast],[aria-invalid=true]';
  const out = new Set(); document.querySelectorAll(sel).forEach((e) => { const t = (e.innerText || "").trim().replace(/\s+/g, " "); if (t) out.add(t.slice(0, 400)); });
  return [...out];
});
export const body = (page) => page.evaluate(() => document.body.innerText);
export const problem = (status, code, extra = {}) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:" + code, title: "SECRET-SERVER-DETAIL title", status, detail: "SECRET-SERVER-DETAIL detail", code, requestId: "req-p6-" + status + "-" + code.toLowerCase().slice(0, 6), ...extra }) });
export const CANARY = "SECRET-SERVER-DETAIL";
