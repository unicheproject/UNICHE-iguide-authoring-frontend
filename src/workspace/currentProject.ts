import { inject, provide, type InjectionKey, type Ref } from "vue";
import type { Project } from "@/platform/catalogue";

/**
 * The Project the workspace has open, after the backend's Catalogue access check succeeded. Pages
 * inside the workspace read it instead of fetching the Project again.
 */
const key: InjectionKey<Readonly<Ref<Project>>> = Symbol("currentProject");

export function provideCurrentProject(project: Readonly<Ref<Project>>): void {
  provide(key, project);
}

export function useCurrentProject(): Readonly<Ref<Project>> {
  const project = inject(key);
  if (!project) {
    throw new Error("useCurrentProject() called outside the Project workspace");
  }
  return project;
}
