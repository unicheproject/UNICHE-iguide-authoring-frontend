import { onBeforeUnmount, watch, type Ref } from "vue";

/**
 * Keeps `document.title` at "<title> · iGuide CMS" while a full-page state is on screen (sign-in, a sign-in error, a
 * Project that cannot be opened). The route announcer sets the title again when the page heading appears, and would
 * leave "Projects" or "Dashboard" on a page that is neither; this puts the state's own title back, then lets go when
 * the state ends or the view unmounts. `title` null means no state, so the announcer's title stands.
 */
export function useHeldTitle(title: Ref<string | null>): void {
  let observer: MutationObserver | null = null;
  const stop = () => {
    observer?.disconnect();
    observer = null;
  };
  const apply = (text: string) => {
    const full = `${text} · iGuide CMS`;
    if (document.title !== full) document.title = full;
  };
  watch(
    title,
    (text) => {
      stop();
      if (!text) return;
      apply(text);
      const el = document.querySelector("title");
      if (!el) return;
      observer = new MutationObserver(() => apply(text));
      observer.observe(el, { childList: true, characterData: true, subtree: true });
    },
    { immediate: true },
  );
  onBeforeUnmount(stop);
}
