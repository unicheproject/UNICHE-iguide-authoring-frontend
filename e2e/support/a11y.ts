import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * The automated half of `14` §1 and §4: axe-core on the page as it stands, WCAG 2.0 and 2.1 A and AA. A violation
 * fails the test with its rule, impact, and the first elements it names. Gradients and what axe cannot measure
 * stay manual checks (GAPS.md G-012).
 */
export async function expectNoAxeViolations(page: Page, state: string, options: { loading?: boolean } = {}): Promise<void> {
  // A state is checked once it has settled, nothing on the page still loading, unless the loading state is the one
  // under test.
  if (!options.loading) await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const found = result.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => `${n.target.join(" ")} ${n.html.slice(0, 160)}`).join(" | ")}`,
  );
  expect(found, `axe on ${state}`).toEqual([]);
}

/**
 * What axe cannot measure: text on a gradient. Every visible element whose background is a linear gradient is
 * sampled along it (each stop and halfway between neighbouring stops), and the text colour must reach 4.5:1 against
 * every sample (`14` §2; D-053).
 */
export async function expectGradientTextContrast(page: Page, state: string): Promise<void> {
  const failures = await page.evaluate(() => {
    const rgb = (text: string) => (text.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    const luminance = ([r, g, b]: number[]) => {
      const c = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const found: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const style = getComputedStyle(el);
      if (!style.backgroundImage.includes("linear-gradient") || !el.innerText.trim() || el.offsetParent === null) continue;
      const stops = (style.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []).map(rgb);
      const samples = stops.flatMap((stop, i) =>
        i === 0 ? [stop] : [stops[i - 1].map((v, k) => (v + stop[k]) / 2), stop],
      );
      const text = rgb(style.color);
      const worst = Math.min(...samples.map((s) => ratio(s, text)));
      if (worst < 4.5) found.push(`"${el.innerText.trim().slice(0, 40)}" ${worst.toFixed(2)}:1`);
    }
    return found;
  });
  expect(failures, `text on gradients in ${state}`).toEqual([]);
}

/**
 * Replaces the gradient check's job now that the primary action is a solid fill (D-072, superseding D-053): every
 * visible button or link with a solid background must reach 4.5:1 between its text colour and its fill, and a control
 * with a bordered outline (secondary buttons, fields) must reach 3:1 between border and the page behind it. At least
 * as strict as the gradient sampling, which still runs for any gradient left in the app.
 */
export async function expectSolidFillContrast(page: Page, state: string): Promise<void> {
  const failures = await page.evaluate(() => {
    const rgb = (text: string) => (text.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    const alpha = (text: string) => {
      const parts = text.match(/\d+(\.\d+)?/g) ?? [];
      return parts.length > 3 ? Number(parts[3]) : 1;
    };
    const luminance = ([r, g, b]: number[]) => {
      const c = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const found: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("button, a, input, select, textarea"))) {
      if (el.offsetParent === null) continue;
      const style = getComputedStyle(el);
      if (alpha(style.backgroundColor) === 1 && el.innerText?.trim() && !style.backgroundColor.startsWith("rgba")) {
        const r = ratio(rgb(style.backgroundColor), rgb(style.color));
        if (r < 4.5 && el.matches("button, a")) found.push(`"${el.innerText.trim().slice(0, 40)}" text on fill ${r.toFixed(2)}:1`);
      }
      if (el.matches("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea") && parseFloat(style.borderTopWidth) > 0) {
        const r = ratio(rgb(style.borderTopColor), [255, 255, 255]);
        if (r < 3) found.push(`${el.tagName.toLowerCase()} border ${r.toFixed(2)}:1`);
      }
    }
    return found;
  });
  expect(failures, `solid fills and control borders in ${state}`).toEqual([]);
}
