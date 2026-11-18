import { open, CMS, VIEWPORTS } from "../../../tools/session.mjs";
export const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const OUT="ux-audit/round-1/audit/p3-translator/shots/";
export { open, CMS, VIEWPORTS };
export async function shot(page,name,vp="1440",full=false){await page.screenshot({path:`${OUT}${name}__${vp}.png`,fullPage:full});}
export async function goto(page,path){await page.goto(`${CMS}/projects/${P}/${path}`);await page.waitForTimeout(2500);}
