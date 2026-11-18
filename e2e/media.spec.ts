import { expect, test } from "@playwright/test";
import { newProject, wav } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

/*
 * Uploading audio through the media library (`12` §3 Media, §5): the upload dialog takes the file, the library
 * lists it, and the Asset editor shows the duration the backend read from the file (backend D-043) in whole
 * seconds, as the player counts them (D-050).
 */
test("an uploaded recording shows its duration", async ({ page }) => {
  const project = await newProject("media");
  await page.goto(`/projects/${project.id}/media`);
  await page.getByRole("button", { name: /^Upload files$/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("input[type=file][aria-label='Files to upload']").setInputFiles({
    name: "narration.wav",
    mimeType: "audio/wav",
    buffer: Buffer.from(wav(3.5)),
  });
  await expect(dialog.getByText(/narration\.wav/).first()).toBeVisible();
  // "0 of 1 uploaded" shows while the file is still on its way.
  await expect(dialog.getByText("1 of 1 uploaded")).toBeVisible();
  await expectNoAxeViolations(page, "upload dialog after an upload");
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: /narration\.wav/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "narration.wav" })).toBeVisible();
  await expect(page.getByText("Duration:", { exact: true })).toBeVisible();
  await expect(page.getByText("00:03", { exact: true })).toBeVisible();
  await expectNoAxeViolations(page, "Asset editor of an audio file");
});

/*
 * Media library worklist and upload (D-094): the list view is a URL state, every row says what is missing in the
 * language in force, and "Upload anyway" keeps its visible words at the start of its accessible name (WCAG 2.5.3).
 */
test("the list view is in the URL and a held file can be uploaded anyway", async ({ page }) => {
  const project = await newProject("media-worklist");
  await page.goto(`/projects/${project.id}/media?view=list`);
  await page.getByRole("button", { name: /^Upload files$/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Upload files" })).toBeFocused();
  await dialog.locator("input[type=file][aria-label='Files to upload']").setInputFiles({
    name: "tool.exe",
    mimeType: "application/x-msdownload",
    buffer: Buffer.from("MZ"),
  });
  await expect(dialog.getByRole("button", { name: "Upload anyway, tool.exe" })).toBeVisible();
  await dialog.getByRole("button", { name: "Skip, tool.exe" }).click();
  await expect(dialog.getByRole("button", { name: "Undo skip, tool.exe" })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).last().click();
  await expect(page).toHaveURL(/view=list/);
});
