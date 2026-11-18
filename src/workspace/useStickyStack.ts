import { onBeforeUnmount, watch, type Ref } from "vue";

/** The custom property on `<html>` that holds how much of the top of `<main>` is covered while scrolling (D-089). */
export const STICKY_STACK_PROPERTY = "--sticky-stack-h";

/**
 * Publishes the height of the bars that are stuck to the top of `<main>` as `--sticky-stack-h` on `<html>` (D-089), so
 * `scroll-padding-top`, the editor's side column and the table head can offset by what is really there. Only elements
 * whose computed `position` is `sticky` right now count: the Working Copy banner is sticky on tall viewports only, and
 * the property follows when the viewport changes. The property is removed when the component unmounts.
 *
 * @param targets refs to the bars, topmost first; a null ref (not rendered) counts as zero
 */
export function useStickyStack(targets: Ref<HTMLElement | null>[]): void {
  let observer: ResizeObserver | null = null;
  const root = document.documentElement;

  function measure() {
    let total = 0;
    for (const target of targets) {
      const el = target.value;
      if (el && getComputedStyle(el).position === "sticky") total += el.getBoundingClientRect().height;
    }
    root.style.setProperty(STICKY_STACK_PROPERTY, `${Math.ceil(total)}px`);
    // A focused field or an anchor scrolls to just under the bars. Set here as well as in `style.css` so the page
    // never depends on which of the two lands first; both say the same.
    const main = document.getElementById("main");
    if (main) main.style.scrollPaddingTop = `var(${STICKY_STACK_PROPERTY})`;
  }

  watch(
    targets,
    (elements) => {
      observer?.disconnect();
      observer = new ResizeObserver(measure);
      for (const el of elements) if (el) observer.observe(el);
      measure();
    },
    { flush: "post", immediate: true },
  );
  // A media query can switch a bar between sticky and static without changing its height.
  window.addEventListener("resize", measure);
  onBeforeUnmount(() => {
    observer?.disconnect();
    window.removeEventListener("resize", measure);
    root.style.removeProperty(STICKY_STACK_PROPERTY);
    document.getElementById("main")?.style.removeProperty("scroll-padding-top");
  });
}
