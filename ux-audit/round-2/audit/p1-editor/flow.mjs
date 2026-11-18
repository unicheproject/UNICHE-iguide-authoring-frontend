// full POI fill: usage: flow.mjs <ID> <audioName> <imageName> <dx> <dy> <title-suffix-for-log>
import { open, go, shot, P, settle } from "./lib.mjs";
export async function fill(page, ID, audio, image, fx, fy, tag, doShots=false) {
  await go(page, `/projects/${P}/pois/${ID}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor(); await settle(page,1000);
  await page.getByLabel("Summary").fill("Audit summary for "+tag);
  await page.getByRole("button",{name:/choose audio narration/i}).first().click(); await settle(page,1000);
  let d=page.getByRole("dialog"); await d.getByText(audio,{exact:true}).first().click(); await d.getByRole("button",{name:/use this/i}).click(); await settle(page,500);
  await page.getByRole("button",{name:/add primary image/i}).click(); await settle(page,1000);
  d=page.getByRole("dialog"); await d.getByText(image,{exact:true}).first().click(); await d.getByRole("button",{name:/use this/i}).click(); await settle(page,500);
  const map=page.locator(".leaflet-container").first(); await map.scrollIntoViewIfNeeded();
  const bb=await map.boundingBox(); await page.mouse.click(bb.x+bb.width*fx,bb.y+bb.height*fy); await settle(page,400);
  await page.getByRole("button",{name:/QR code/}).first().click(); await settle(page,400);
  await page.getByRole("button",{name:/Geo-proximity/}).first().click(); await settle(page,400);
}
