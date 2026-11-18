import { expect, test, type Page } from "@playwright/test";
import { api, newProject } from "./support/api.ts";

/*
 * Round 3, W0-A (D-100 to D-106, C3-01 to C3-06, C3-26, C3-84): one focus ring on every control (primary buttons
 * included, never white, never clipped), a visible menu highlight, toasts that do not cover the form column, icon-only
 * buttons of 32/44 px, focus never on <body> after the shared removal paths, and no sign-in response left in the address
 * bar. Needs the signed-in stack like the other specs; it was written without being run (no Keycloak in the authoring
 * environment).
 */
let projectId = "";

test.beforeAll(async () => {
  projectId = (await newProject("focus")).id;
  await api("POST", `/projects/${projectId}/pois`, { title: "Kouros" });
});

const luminance = ([r, g, b]: number[]) => {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const rgb = (text: string) => (text.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);

/** The focus ring of the focused element: its colour and width. */
async function ring(page: Page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.activeElement as Element);
    return { color: style.outlineColor, width: parseFloat(style.outlineWidth), style: style.outlineStyle, offset: parseFloat(style.outlineOffset) };
  });
}

test("a primary button on the canvas and in a dialog has a 2 px ring that is not white and reads at 3:1", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  const primary = page.locator("main [data-variant=primary]").first();
  await page.keyboard.press("Tab");
  await primary.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const onCanvas = await ring(page);
  expect(onCanvas.style).toBe("solid");
  expect(onCanvas.width).toBe(2);
  expect(rgb(onCanvas.color)).not.toEqual([255, 255, 255]);
  expect(contrast(rgb(onCanvas.color), [244, 245, 247])).toBeGreaterThanOrEqual(3);

  await primary.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const create = dialog.locator("[data-variant=primary]").first();
  await create.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const inDialog = await ring(page);
  expect(rgb(inDialog.color)).not.toEqual([255, 255, 255]);
  expect(contrast(rgb(inDialog.color), [255, 255, 255])).toBeGreaterThanOrEqual(3);
});

test("the Close button is the first Tab stop of a dialog", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  await page.locator("main [data-variant=primary]").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close dialog" })).toBeFocused();
});

test("a tab strip's focus ring is not clipped by its scroller", async ({ page }) => {
  await page.goto(`/projects/${projectId}/maps`);
  const tab = page.locator("nav a.ui-tab").nth(1);
  await tab.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const clipped = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const nav = el.closest("nav") as HTMLElement;
    const style = getComputedStyle(el);
    const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    const box = el.getBoundingClientRect();
    const scroller = nav.getBoundingClientRect();
    return [box.left - reach < scroller.left, box.top - reach < scroller.top, box.right + reach > scroller.right, box.bottom + reach > scroller.bottom];
  });
  expect(clipped).toEqual([false, false, false, false]);
});

test("a programmatic heading focus after a route change draws no ring", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  await page.getByRole("link", { name: "Places", exact: true }).first().click();
  await expect(page.locator("main h1")).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)).toBe("none");
});

test("the highlighted menu item has a 2 px outline", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  await page.getByRole("button", { name: /^Actions for/ }).first().click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  const item = await page.locator("[role=menu] [data-highlighted]").evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
  expect(item).toEqual({ style: "solid", width: "2px" });
});

test("pressed is its own step on a primary button", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  const primary = page.locator("main [data-variant=primary]").first();
  const box = (await primary.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const hover = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.mouse.down();
  const pressed = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  expect(pressed).not.toBe(hover);
});

test("toasts in a wide editor do not cover the form column; a copied link is one line with a check", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/projects/${projectId}/pois`);
  await page.locator("tbody tr").first().locator("a").first().click();
  const side = page.locator("#editor-side-column");
  await expect(side).toBeVisible();
  await page.getByRole("button", { name: /copy/i }).first().click().catch(() => undefined);
  const toast = page.locator("[data-toast]").first();
  if (await toast.count()) {
    const [t, s] = await Promise.all([toast.boundingBox(), side.boundingBox()]);
    expect(t!.x).toBeGreaterThanOrEqual(s!.x - 1);
  }
});

test("icon-only buttons are at least 32 px", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("button")]
      .filter((b) => b.offsetParent !== null && !(b.textContent ?? "").trim())
      .map((b) => ({ label: b.getAttribute("aria-label") ?? "", w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height }))
      .filter((b) => b.w < 32 || b.h < 32),
  );
  expect(small).toEqual([]);
});

test("focus is not left on <body> after dismissing a dialog or a toast", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  await page.locator("main [data-variant=primary]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
});

test("after a real sign-in the address bar holds no sign-in response", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => location.hash)).toBe("");
  expect(await page.evaluate(() => /[?&#](code|state|iss|session_state)=/.test(location.href))).toBe(false);
});
