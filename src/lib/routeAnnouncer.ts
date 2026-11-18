import { watch } from "vue";
import type { RouteLocationNormalized, Router } from "vue-router";
import { focusHeading } from "@/lib/focus";
import { say } from "@/lib/announcer";
import { findProject } from "@/stores/projects";
import { findSection } from "@/workspace/sections";

const APP_NAME = "iGuide CMS";

/** The name of the page a route shows, before its own heading is known ("Places", "Dashboard"). */
function pageName(to: RouteLocationNormalized): string {
  if (to.meta.title) return to.meta.title;
  const slug = (to.meta.section ?? to.params.section) as string | undefined;
  const section = slug ? findSection(slug) : undefined;
  if (section) return String(to.name ?? "").endsWith("-editor") ? `Edit ${section.title}` : section.title;
  return "Page";
}

/** "<page> · <Project> · iGuide CMS", leaving out the Project when the route has none or it is not loaded yet. */
export function documentTitleFor(to: RouteLocationNormalized, page = pageName(to)): string {
  const projectId = typeof to.params.projectId === "string" ? to.params.projectId : null;
  const project = projectId ? findProject(projectId)?.name : null;
  return [page, project, APP_NAME].filter(Boolean).join(" · ");
}

let stop: (() => void) | null = null;
/** Follows the editor heading so a saved rename updates `document.title` without a reload (D-103, C3-11). */
let followTitle: MutationObserver | null = null;
/** The page name the title was last built with, so a late Project name can complete it without losing the page. */
let currentPage: string | null = null;

/**
 * On every route change (D-073, `14` §4): sets `document.title`, scrolls the page's `<main>` to its top, moves focus to
 * the page heading once it exists (programmatic focus, so a screen reader reads it) and announces "<page> loaded" in the
 * polite live region. A change of query only (a list filter) keeps focus and scroll; the very first navigation sets the
 * title only, so the skip link stays the first tab stop. Editors take their page name from their heading and keep
 * following it: the title changes when the saved record's name does. Everything here runs in `afterEach`, which only
 * fires for a committed navigation, so a cancelled leave guard announces nothing and leaves title and focus alone.
 */
export function installRouteAnnouncer(router: Router): void {
  // The Project's name can arrive after the first title is set (reload, deep link): rebuild the title with it, keeping
  // the page name, so the title never loses the Project (C2-07).
  watch(
    () => {
      const id = router.currentRoute.value.params.projectId;
      return typeof id === "string" ? findProject(id)?.name : undefined;
    },
    (name) => {
      if (!name || currentPage === null) return;
      const title = documentTitleFor(router.currentRoute.value, currentPage);
      if (document.title.endsWith(` · ${APP_NAME}`) && !document.title.includes(name) && document.title.startsWith(currentPage)) document.title = title;
    },
  );
  router.afterEach((to, from, failure) => {
    // `afterEach` also runs for a navigation that was cancelled or aborted (a leave guard answered "no"): that route
    // was not committed, so it sets no title, announces nothing and moves no focus (D-103, C3-11).
    if (failure) return;
    stop?.();
    stop = null;
    followTitle?.disconnect();
    followTitle = null;
    currentPage = pageName(to);
    document.title = documentTitleFor(to);
    if (to.meta.bare || to.path === from.path) return;
    const first = from.matched.length === 0 && !from.name;
    stop = whenHeadingExists((heading) => {
      const own = heading?.textContent?.trim() ?? "";
      const editor = String(to.name ?? "").endsWith("-editor");
      const page = (editor || pageName(to) === "Page") && own ? own : pageName(to);
      currentPage = page;
      document.title = documentTitleFor(to, page);
      const main = document.querySelector<HTMLElement>("main");
      main?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
      const typing = document.activeElement instanceof HTMLElement && document.activeElement.matches("input, textarea, select");
      if (!first && !typing) {
        if (heading) focusHeading();
        else if (main) {
          if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
          main.focus({ preventScroll: true });
        }
      }
      if (!first) say(`${page} loaded`);
      if (editor && main) {
        followTitle = new MutationObserver(() => {
          const name = document.querySelector("main h1")?.textContent?.trim();
          if (!name || name === currentPage) return;
          currentPage = name;
          document.title = documentTitleFor(to, name);
        });
        followTitle.observe(main, { childList: true, subtree: true, characterData: true });
      }
    });
  });
}

/** Calls `done` with the page's `h1` as soon as one exists, or with `null` after 4 s; returns a canceller. */
function whenHeadingExists(done: (heading: HTMLElement | null) => void): () => void {
  let finished = false;
  const finish = (heading: HTMLElement | null) => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    clearTimeout(timer);
    done(heading);
  };
  const check = () => {
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading) finish(heading);
  };
  const observer = new MutationObserver(check);
  observer.observe(document.body, { childList: true, subtree: true });
  const timer = setTimeout(() => finish(null), 4000);
  queueMicrotask(() => requestAnimationFrame(check));
  return () => {
    finished = true;
    observer.disconnect();
    clearTimeout(timer);
  };
}
