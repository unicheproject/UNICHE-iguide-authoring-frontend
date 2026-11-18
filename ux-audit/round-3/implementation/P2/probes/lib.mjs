import { open, go, VIEWPORTS } from "../../../../tools/session.mjs";
export const P = { pop: "6958c18f-60d2-4140-a524-5a43f8a2f6b5", emptyB: "1d6971ce-6391-4da8-848e-8d7466d25128", trail: "600c4311-3e81-4235-91b0-5b3e336918fc" };
export const OUT = "ux-audit/round-3/implementation/P2/after/";
export { open, go, VIEWPORTS };
export async function dash(vp, id, opts = {}) {
  const s = await open("admin", { viewport: vp, ...opts });
  return s;
}
