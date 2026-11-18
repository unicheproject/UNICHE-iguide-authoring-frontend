import { watch, type Ref } from "vue";

/**
 * Moves focus to the first field marked invalid in the open dialog, so a screen reader announces its error
 * (`14` §4, DECISIONS.md D-042).
 */
export function focusFirstInvalid(): void {
  const field =
    document.querySelector<HTMLElement>('[role="dialog"] [aria-invalid="true"]') ??
    document.querySelector<HTMLElement>('[aria-invalid="true"]');
  // A group, such as a row of choice buttons, takes focus through its first control.
  const target = field?.matches("input, select, textarea, button") ? field : field?.querySelector<HTMLElement>("input, select, textarea, button");
  target?.focus();
}

/** Focuses the first invalid field whenever a dialog's field errors become non-empty, after the DOM shows them. */
export function useFocusOnErrors(errors: Ref<Record<string, string | undefined>>): void {
  watch(
    errors,
    (found) => {
      if (Object.values(found).some(Boolean)) focusFirstInvalid();
    },
    { deep: true, flush: "post" },
  );
}

/** What can take focus inside a container (visible, enabled controls and links). */
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/** Whether an element can be focused now: in the page, laid out, not `inert`/hidden. */
function isFocusable(element: HTMLElement | null | undefined): element is HTMLElement {
  return !!element && element.isConnected && element.getClientRects().length > 0 && !element.closest("[inert], [hidden]");
}

/** Gives a programmatic target (`tabindex="-1"`) focus without a visible ring. */
function focusProgrammatic(target: HTMLElement): void {
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

/**
 * Where focus falls when the control that opened something has gone (D-086): the opener when it is still in the page,
 * then each fallback selector in order (the default chain is `[data-focus-fallback]`, `main h1`), then `main`. Focus
 * never ends on `<body>`. `fallbacks` may be one selector or a list; a caller names the neighbour it wants, for
 * example `#row-12 a`.
 */
export function restoreFocus(element: HTMLElement | null | undefined, fallbacks: string | string[] = []): void {
  if (isFocusable(element)) {
    element.focus();
    return;
  }
  const chain = [...(Array.isArray(fallbacks) ? fallbacks : [fallbacks]), "[data-focus-fallback]", "main h1", "main"].filter(Boolean);
  for (const selector of chain) {
    const target = [...document.querySelectorAll<HTMLElement>(selector)].find((candidate) => isFocusable(candidate));
    if (target) {
      if (target.matches(FOCUSABLE_SELECTOR)) target.focus();
      else focusProgrammatic(target);
      return;
    }
  }
  document.body.focus();
}

/**
 * Focus has a successor (D-103). Call it just before `removed` leaves the page (or is replaced) and focus is inside it:
 * focus moves to the next sibling action of `removed`, else the previous one, else the first usable `candidates`
 * entry (elements or selectors), else the nearest labelled region around it, else the page `h1`, else `<main>`; never
 * `<body>`. Does nothing, and returns `false`, when focus is not inside `removed` (a pointer user dismissing
 * something keeps their place). Add `data-focus-skip` to a wrapper that disappears with its last child (the toast
 * stack) so it is not chosen as the region.
 *
 * @param removed the element about to go (a toast, a retry card, a row)
 * @param candidates extra targets tried after the siblings
 * @returns whether focus was moved
 */
export function focusSuccessor(removed: HTMLElement | null | undefined, candidates: Array<HTMLElement | string | null | undefined> = []): boolean {
  if (!removed || !removed.contains(document.activeElement) || document.activeElement === document.body) return false;
  const actionable = (el: Element | null): HTMLElement | null => {
    if (!el) return null;
    const own = el.matches(FOCUSABLE_SELECTOR) ? (el as HTMLElement) : el.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    return isFocusable(own) ? own : null;
  };
  let target: HTMLElement | null = null;
  for (let el = removed.nextElementSibling; el && !target; el = el.nextElementSibling) target = actionable(el);
  for (let el = removed.previousElementSibling; el && !target; el = el.previousElementSibling) target = actionable(el);
  for (const candidate of candidates) {
    if (target) break;
    const list = typeof candidate === "string" ? [...document.querySelectorAll<HTMLElement>(candidate)] : candidate ? [candidate] : [];
    target = list.find((el) => !removed.contains(el) && (actionable(el) || isFocusable(el))) ?? null;
    if (target && !target.matches(FOCUSABLE_SELECTOR)) {
      focusProgrammatic(target);
      return true;
    }
    target = actionable(target);
  }
  if (!target) {
    let region = removed.parentElement?.closest<HTMLElement>("[role=region], [role=group], section[aria-label], section[aria-labelledby], [aria-label], [aria-labelledby]") ?? null;
    while (region && (region.hasAttribute("data-focus-skip") || !isFocusable(region))) region = region.parentElement?.closest<HTMLElement>("[aria-label], [aria-labelledby]") ?? null;
    if (region) {
      focusProgrammatic(region);
      return true;
    }
    if (focusHeading()) return true;
    const main = document.querySelector<HTMLElement>("main");
    if (main) focusProgrammatic(main);
    else document.body.focus();
    return true;
  }
  target.focus();
  return true;
}

/**
 * After a row, card or block was removed from `container`, focuses the item now at `index` (the one that took its
 * place, or the last one), preferring a control inside it; with nothing left it falls back as {@link restoreFocus}
 * does, starting at the container itself. Call it after the DOM updated (`await nextTick()`).
 *
 * @param container the list or table body that held the removed item
 * @param index the position the removed item had
 * @param itemSelector what counts as an item (default: the container's children)
 */
export function focusAfterRemoval(container: HTMLElement | null | undefined, index: number, itemSelector = ":scope > *"): void {
  const items = container ? [...container.querySelectorAll<HTMLElement>(itemSelector)] : [];
  const item = items[Math.min(Math.max(index, 0), items.length - 1)];
  const control = item?.matches(FOCUSABLE_SELECTOR) ? item : item?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  if (isFocusable(control)) {
    control.focus();
    return;
  }
  if (isFocusable(item)) {
    focusProgrammatic(item);
    return;
  }
  if (container?.isConnected) {
    focusProgrammatic(container);
    return;
  }
  restoreFocus(null);
}

/**
 * The first control of `root` a person can use right now: visible, enabled, and not a visually hidden input (a file
 * input behind a "Choose files" button has no visible box). By default only fields a person types or chooses into count,
 * not a checkbox or radio that happens to come first. Used for the initial focus of a dialog (C2-76).
 */
export function firstVisibleField(
  root: ParentNode,
  selector = "input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([disabled]), select:not([disabled]), textarea:not([disabled])",
): HTMLElement | null {
  for (const candidate of root.querySelectorAll<HTMLElement>(selector)) {
    const box = candidate.getBoundingClientRect();
    if (isFocusable(candidate) && box.width > 2 && box.height > 2 && getComputedStyle(candidate).visibility !== "hidden") return candidate;
  }
  return null;
}

/**
 * Moves focus to the page heading (`h1`) of the current `<main>`, programmatically (`tabindex="-1"`), so a screen
 * reader reads the new page. Returns the heading, or `null` when the page has none yet.
 */
export function focusHeading(): HTMLElement | null {
  const heading = document.querySelector<HTMLElement>("main h1");
  if (!heading) return null;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  return heading;
}
