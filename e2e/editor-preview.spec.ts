import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

/*
 * "Preview in app" of a Resource editor (`12` §3; D-014, D-075, D-082): the inline panel below the action, a labelled
 * region drawing the live form, unsaved changes included, on Web, Mobile, or Kiosk; Escape or Close shuts it and focus
 * returns to the button. Not run in this environment (needs the local Keycloak).
 */
test("Preview in app opens as an inline panel with the unsaved form", async ({ page }) => {
  const project = await newProject("editorpreview");
  const place = await api<{ id: string }>("POST", `/projects/${project.id}/places`, { title: "Kymi", type: "SITE" });
  await page.goto(`/projects/${project.id}/places/${place.id}`);
  await page.getByLabel(/^summary$/i).fill("A harbour town on the east coast.");

  const button = page.getByRole("button", { name: "Preview in app" }).first();
  await button.click();
  // A labelled region naming surface, language and state; the stand-in inside is inert until the author interacts.
  const region = page.getByRole("region", { name: /^Preview: .*unsaved form$/ });
  await expect(region).toBeVisible();
  await expect(region.getByText("A harbour town on the east coast.")).toBeVisible();
  await expect(region.getByText("Shows unsaved changes").or(page.getByText("Shows unsaved changes"))).toBeVisible();
  await expect(region.locator("h1")).toHaveCount(0);
  await expect(region.getByText(/Shown at \d+\s%|Shown at real size/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Skip preview" })).toBeAttached();

  // Expand and Close are in the panel header, next to the Surface tabs and above the picture (D-113).
  const panel = page.locator("#editor-preview");
  const closeBox = await panel.getByRole("button", { name: "Close the preview" }).boundingBox();
  const frameBox = await panel.locator("[data-preview-frame]").boundingBox();
  expect(frameBox!.y - (closeBox!.y + closeBox!.height)).toBeLessThanOrEqual(80);

  // The surface tabs move with the arrow keys and rename the region.
  await page.getByRole("tab", { name: "Mobile" }).click();
  await page.getByRole("tab", { name: "Mobile" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Kiosk" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("region", { name: /^Preview: Kiosk/ })).toBeVisible();
  await page.getByRole("button", { name: "Interact with the preview" }).click();
  await expect(page.getByRole("button", { name: "Stop interacting" })).toBeVisible();
  await expectNoAxeViolations(page, "editor preview panel");

  // The first Esc stops interacting and returns focus to Interact; the panel stays open until the second.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Interact with the preview" })).toBeFocused();
  await expect(region).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(region).toBeHidden();
  await expect(button).toBeFocused();

  await button.click();
  await panel.getByRole("button", { name: "Close the preview" }).click();
  await expect(region).toBeHidden();
  await expect(button).toBeFocused();

  await button.click();
  await page.getByRole("button", { name: "Close preview" }).click();
  await expect(region).toBeHidden();
  await expect(button).toBeFocused();
});

test("the new tab honours orientation and real size", async ({ page }) => {
  const project = await newProject("apppreview");
  await page.goto(`/projects/${project.id}/app-preview?surface=kiosk&orientation=landscape&real=1`);
  const frame = page.locator("[data-preview-frame]");
  await expect(frame).toHaveAttribute("data-scale", "1.000");
  await expect.poll(async () => (await frame.locator("> div").boundingBox())?.width).toBe(1920);
  // A rejected value is never echoed.
  await page.goto(`/projects/${project.id}/app-preview?lang=%3Cscript%3E&surface=zz`);
  await expect(page.getByText("The surface in the link is not known")).toBeVisible();
  await expect(page.getByText("<script>")).toHaveCount(0);
});
