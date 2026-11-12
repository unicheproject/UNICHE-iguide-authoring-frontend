import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

interface MapRow {
  id: string;
  version: number;
  placeId: string | null;
  hasWorkingCopy: boolean;
}

/*
 * The Place editor links an ACTIVE map through the map's pending changes and applies them at once (D-050, backend
 * D-044); a map with pending changes of someone else's is refused, naming it, and stays as it was.
 */
test("an ACTIVE map is linked and unlinked from the Place editor", async ({ page }) => {
  const project = await newProject("maplink");
  const base = `/projects/${project.id}`;
  const place = await api<{ id: string }>("POST", `${base}/places`, { title: "Kymi", type: "SITE" });
  const draft = await api<MapRow>("POST", `${base}/maps`, {
    internalName: "Kymi coast",
    initialLatitude: 38.63,
    initialLongitude: 24.1,
    initialZoom: 13,
  });
  await api("POST", `${base}/maps/${draft.id}/status`, { targetStatus: "ACTIVE", version: draft.version });
  const map = () => api<MapRow>("GET", `${base}/maps/${draft.id}`);

  await page.goto(`${base}/places/${place.id}`);
  const field = page.locator("#f-link");
  await field.selectOption(draft.id);
  await expect(page.getByText(/^Linked$/)).toBeVisible();
  await expect.poll(async () => (await map()).placeId).toBe(place.id);
  expect((await map()).hasWorkingCopy).toBe(false);
  await expectNoAxeViolations(page, "Place editor with an ACTIVE linked map");

  // A placement written on the ACTIVE map waits in its pending changes; unlinking would make it live, so it is refused.
  await api("POST", `${base}/maps/${draft.id}/resources`, { resourceType: "PLACE", resourceId: place.id, latitude: 38.63, longitude: 24.1 }, 201);
  expect((await api<unknown[]>("GET", `${base}/maps/${draft.id}/resources`)).length).toBe(0);
  await page.reload();
  await field.selectOption("");
  await expect(page.getByText(/“Kymi coast” has pending changes/)).toBeVisible();
  expect((await map()).placeId).toBe(place.id);

  // Once the pending changes are discarded, the map unlinks.
  await api("DELETE", `${base}/maps/${draft.id}/working-copy`, undefined, 204);
  await page.reload();
  await field.selectOption("");
  await expect(page.getByText(/^Unlinked$/)).toBeVisible();
  await expect.poll(async () => (await map()).placeId).toBeNull();
});
