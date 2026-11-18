import { onBeforeUnmount, onMounted, reactive, readonly, watch, type Ref } from "vue";

const heights = new Map<symbol, number>();

function publish(): void {
  const tallest = Math.max(0, ...heights.values());
  const root = document.documentElement;
  if (tallest) root.style.setProperty("--toast-offset-bottom", `${tallest + 8}px`);
  else root.style.removeProperty("--toast-offset-bottom");
}

/**
 * Keeps toasts above a bar that is stuck to the bottom of the viewport (the "removed, Undo" bars): while `el` is
 * mounted its height is published as `--toast-offset-bottom`, which `AppToast` adds to its own bottom margin, so a toast
 * never covers the bar. Several bars count as the tallest one.
 */
export function useToastOffset(el: Ref<HTMLElement | null>): void {
  const token = Symbol("toast-offset");
  let observer: ResizeObserver | null = null;
  watch(
    el,
    (node) => {
      observer?.disconnect();
      observer = null;
      heights.delete(token);
      if (node && typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          heights.set(token, node.getBoundingClientRect().height);
          publish();
        });
        observer.observe(node);
      }
      publish();
    },
    { immediate: true, flush: "post" },
  );
  onBeforeUnmount(() => {
    observer?.disconnect();
    heights.delete(token);
    publish();
  });
}

/** Where the toast stack sits (D-102): beside the editor's side column, full width, or the default bottom-right. */
export interface ToastDock {
  mode: "side" | "full" | "default";
  /** Distance from the viewport's right edge in px (`side` only). */
  right: number;
  /** Width in px (`side` only). */
  width: number;
}

/** The editor's side column is 21.5 rem wide from the `edit` breakpoint (1180 px, `tailwind.config.js`). */
const EDIT_MIN_WIDTH = 1180;
const dockState = reactive<ToastDock>({ mode: "default", right: 0, width: 0 });
export const toastDock = readonly(dockState);

/**
 * Measures `#editor-side-column` (the editor's side column, provided by the editor shell) and publishes where the
 * toast stack docks. Wide editor: anchored bottom-right, as wide as the side column with the same right edge, so
 * the stack never covers the form column. An editor below 1180 px: full width with a 16 px gutter. Anywhere else
 * (no `#editor-side-column`) the current behaviour stays: bottom-right, `--toast-inset-right` if a page set it.
 * Call `measure` after the route changed and when the stack changes; it also runs on resize.
 *
 * @returns `measure`, to call when the layout may have changed.
 */
export function useToastDock(): { measure: () => void } {
  function measure(): void {
    const side = document.getElementById("editor-side-column");
    if (!side) {
      dockState.mode = "default";
      return;
    }
    const box = side.getBoundingClientRect();
    if (window.innerWidth >= EDIT_MIN_WIDTH && box.width > 0) {
      dockState.mode = "side";
      dockState.right = Math.max(0, Math.round(window.innerWidth - box.right));
      dockState.width = Math.round(box.width);
    } else {
      dockState.mode = "full";
    }
  }
  onMounted(() => {
    window.addEventListener("resize", measure);
    measure();
  });
  onBeforeUnmount(() => window.removeEventListener("resize", measure));
  return { measure };
}
