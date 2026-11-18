import { open, go } from "../../../tools/session.mjs";
export { open, go };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const shot = (page, name, full=false) => page.screenshot({ path: `ux-audit/round-1/audit/p4-kiosk/shots/${name}.png`, fullPage: full });
/** measure interactive elements smaller than 44px */
export async function small(page, scope = "body") {
  return page.evaluate((scope) => {
    const root = document.querySelector(scope) ?? document.body;
    const out = [];
    for (const el of root.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=checkbox],[role=switch],[role=menuitem],summary")) {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === "hidden") continue;
      if (r.bottom < 0 || r.top > 20000) continue;
      if (r.width < 44 || r.height < 44) out.push(`${Math.round(r.width)}x${Math.round(r.height)} ${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label")||el.textContent||el.getAttribute("placeholder")||el.id||"").trim().replace(/\s+/g," ").slice(0,40)}"`);
    }
    return out;
  }, scope);
}
