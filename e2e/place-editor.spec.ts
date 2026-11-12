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
  await dialog.getByRole("button", { name: /Top-level place/ }).click();
  await dialog.getByLabel(/title/i).fill("Kymi harbour");
  await dialog.getByRole("button", { name: /create place/i }).click();
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
  await page.getByRole("button", { name: /^Activate$/ }).click();
  await expect(page.getByRole("button", { name: /^Deactivate$/ })).toBeVisible();
  await page.getByLabel(/^summary$/i).fill("Fishing boats, a stone quay, and the evening market.");
  await page.getByRole("button", { name: /^Save draft$/ }).click();
  await expect(page.getByText("You are editing a working copy")).toBeVisible();
  await expectNoAxeViolations(page, "Place editor, ACTIVE with pending changes");
  const live = await api<{ translations: Record<string, { summary: string | null }> }>("GET", `/projects/${project.id}/places/${placeId}`);
  expect(live.translations.el.summary).toBe("Fishing boats and a stone quay.");

  await page.getByRole("button", { name: /^Apply changes$/ }).click();
  const confirm = page.getByRole("dialog", { name: /Apply the changes to Kymi harbour/ });
  await expectNoAxeViolations(page, "apply confirmation");
  await confirm.getByRole("button", { name: /^Apply changes$/ }).click();
  await expect(page.getByText("You are editing a working copy")).toBeHidden();
  const applied = await api<{ translations: Record<string, { summary: string | null }> }>("GET", `/projects/${project.id}/places/${placeId}`);
  expect(applied.translations.el.summary).toBe("Fishing boats, a stone quay, and the evening market.");
});
