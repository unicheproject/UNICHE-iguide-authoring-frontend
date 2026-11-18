import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

/*
 * A Place from creation to pending changes (`12` §3 Resource editors, `03` §1): created as a DRAFT and saved in
 * place; once ACTIVE an edit goes into pending changes that visitors do not see, and Apply makes them live. Each
 * state of the editor passes axe.
 */
test("a Place is created, saved, activated, and changed through pending changes", async ({ page }) => {
  const project = await newProject("place");
  await page.goto(`/projects/${project.id}/places`);
  await page.getByRole("button", { name: /^New place$/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: /Top-level place/ }).check();
  await dialog.getByLabel(/title/i).fill("Kymi harbour");
  await dialog.getByRole("button", { name: /^Create and open$/ }).click();
  await expect(page).toHaveURL(/\/places\/[0-9a-f-]{36}$/);
  const placeId = page.url().split("/").pop()!;
  await expect(page.getByRole("heading", { level: 1, name: "Kymi harbour" })).toBeVisible();
  await expectNoAxeViolations(page, "Place editor, new DRAFT");

  // DRAFT: the save writes the Place itself.
  await page.getByLabel(/^summary$/i).fill("Fishing boats and a stone quay.");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Unsaved changes")).toBeHidden();
  await page.reload();
  await expect(page.getByLabel(/^summary$/i)).toHaveValue("Fishing boats and a stone quay.");

  // ACTIVE: an edit waits in pending changes until it is applied.
  // Activation always asks first (D-074): the dialog names the item and lists what is known to be missing.
  await page.getByRole("button", { name: /^Activate$/ }).first().click();
  await page.getByRole("dialog", { name: /Activate Kymi harbour/ }).getByRole("button", { name: /^Activate$/ }).click();
  await expect(page.getByRole("button", { name: /^Deactivate$/ }).first()).toBeVisible();
  await page.getByLabel(/^summary$/i).fill("Fishing boats, a stone quay, and the evening market.");
  // Dirty: the header's primary action is Save draft (and the banner offers it too, D-095); "Apply changes" returns when saved.
  await expect(page.getByRole("button", { name: /^Apply changes$/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^Save draft$/ }).first().click();
  // The header state line and the banner say it is saved; there is no success toast (C2-12).
  await expect(page.getByText(/Pending changes saved/).first()).toBeVisible();
  await expectNoAxeViolations(page, "Place editor, ACTIVE with pending changes");
  const live = await api<{ translations: Record<string, { summary: string | null }> }>("GET", `/projects/${project.id}/places/${placeId}`);
  expect(live.translations.el.summary).toBe("Fishing boats and a stone quay.");

  await page.getByRole("button", { name: /^Apply changes$/ }).click();
  const confirm = page.getByRole("dialog", { name: /Apply the changes to Kymi harbour/ });
  await expect(confirm).toContainText(/Changes: /);
  await expectNoAxeViolations(page, "apply confirmation");
  await confirm.getByRole("button", { name: /^Apply changes$/ }).click();
  await expect(page.getByText("No pending changes.")).toBeVisible();
  const applied = await api<{ translations: Record<string, { summary: string | null }> }>("GET", `/projects/${project.id}/places/${placeId}`);
  expect(applied.translations.el.summary).toBe("Fishing boats, a stone quay, and the evening market.");
});

/*
 * An empty beacon or area row never reaches the platform: Save names each empty field in the summary ("Beacon 1,
 * UUID") and marks it, and a coordinate is checked when the author leaves the field (C2-60, C2-69).
 */
test("empty trigger rows are checked in the browser before saving", async ({ page }) => {
  const project = await newProject("place-triggers");
  await page.goto(`/projects/${project.id}/places`);
  await page.getByRole("button", { name: /^New place$/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: /Top-level place/ }).check();
  await dialog.getByLabel(/title/i).fill("Kymi quay");
  await dialog.getByRole("button", { name: /^Create and open$/ }).click();
  await expect(page).toHaveURL(/\/places\/[0-9a-f-]{36}$/);

  const writes: string[] = [];
  page.on("request", (request) => {
    if (/\/triggers/.test(request.url()) && request.method() !== "GET") writes.push(request.method());
  });
  await page.getByRole("button", { name: /^Add Beacon/ }).click();
  await page.getByRole("button", { name: /^Add Geo-proximity/ }).click();
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByRole("link", { name: /Beacon 1, UUID/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Geo-proximity 1, Latitude/ })).toBeVisible();
  expect(writes).toEqual([]);

  const latitude = page.locator("[data-trigger-row]").nth(1).getByLabel("Latitude");
  await latitude.fill("95");
  await latitude.blur();
  await expect(latitude).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("A latitude is between -90 and 90.")).toBeVisible();
});

/*
 * One of two trigger writes fails (C3-20): the saved row collapses to a one-line summary, the failed row stays open and
 * says why, and the retry sends only the failed row (never the own-record duplicate sentence).
 */
test("a partly saved trigger list keeps the saved row and retries only the failed one", async ({ page }) => {
  const project = await newProject("place-partial");
  await page.goto(`/projects/${project.id}/places`);
  await page.getByRole("button", { name: /^New place$/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: /Top-level place/ }).check();
  await dialog.getByLabel(/title/i).fill("Kymi lighthouse");
  await dialog.getByRole("button", { name: /^Create and open$/ }).click();
  await expect(page).toHaveURL(/\/places\/[0-9a-f-]{36}$/);

  let failGeo = true;
  const creations: string[] = [];
  await page.route(/\/triggers$/, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();
    const body = request.postData() ?? "";
    creations.push(/GEO_PROXIMITY/.test(body) ? "GEO" : "QR");
    if (failGeo && /GEO_PROXIMITY/.test(body)) {
      failGeo = false;
      return route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ status: 503, title: "Service Unavailable", code: "SERVICE_UNAVAILABLE" }) });
    }
    return route.continue();
  });
  await page.getByRole("button", { name: /^Add QR code/ }).click();
  await page.getByRole("button", { name: /^Add Geo-proximity/ }).click();
  const rows = page.locator("[data-trigger-row]");
  await rows.nth(1).getByLabel("Latitude").fill("37.9715");
  await rows.nth(1).getByLabel("Longitude").fill("23.7257");
  await page.getByRole("button", { name: /^Save$/ }).click();

  await expect(page.locator("[data-trigger-problem]")).toContainText("busy or down for maintenance");
  await expect(page.getByText(/Another .* already uses this/)).toHaveCount(0);
  await expect(rows.nth(0)).not.toHaveAttribute("data-open", /.*/);
  expect(await rows.nth(0).boundingBox().then((b) => b?.height ?? 999)).toBeLessThanOrEqual(56);

  creations.length = 0;
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.locator("[data-trigger-problem]")).toHaveCount(0);
  expect(creations).toEqual(["GEO"]);
});
