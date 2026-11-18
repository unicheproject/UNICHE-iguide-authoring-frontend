import { computed, ref, type Ref } from "vue";

/**
 * Whether this viewer dismissed the first-run guide of a Project (D-092, D-112). Only that: a step is ticked by data,
 * never because the viewer opened a screen (C3-56). Kept in browser storage per Project and per viewer; storage can be
 * blocked or empty, so every read and write is wrapped and the guide then simply behaves as new. An older `visited`
 * list stored by an earlier build is ignored.
 */
export interface GuideMemory {
  dismissed: boolean;
}

const KEY = (projectId: string) => `iguide.dashboard-guide.${projectId}`;

function read(projectId: string): GuideMemory {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY(projectId)) ?? "null");
    if (typeof parsed === "object" && parsed !== null) {
      return { dismissed: (parsed as Partial<GuideMemory>).dismissed === true };
    }
  } catch {
    // Storage unavailable or corrupt: behave as if nothing was stored.
  }
  return { dismissed: false };
}

function write(projectId: string, memory: GuideMemory): void {
  try {
    window.localStorage.setItem(KEY(projectId), JSON.stringify(memory));
  } catch {
    // The choice then lasts until the page is closed.
  }
}

/** One memory per Project, shared by every caller so the Dashboard and the guide always agree. */
const memories = new Map<string, Ref<GuideMemory>>();
function memoryOf(projectId: string): Ref<GuideMemory> {
  let found = memories.get(projectId);
  if (!found) {
    found = ref<GuideMemory>(read(projectId));
    memories.set(projectId, found);
  }
  return found;
}

/**
 * The guide memory of the current Project: reactive, saved on every change, switching with the Project. `dismissed` hides
 * the guide; `restore` shows it again ("Show the guide again" in Project details).
 */
export function useGuideMemory(projectId: Ref<string>) {
  const dismissed = computed(() => memoryOf(projectId.value).value.dismissed);
  function update(next: GuideMemory): void {
    memoryOf(projectId.value).value = next;
    write(projectId.value, next);
  }
  function dismiss(): void {
    update({ dismissed: true });
  }
  function restore(): void {
    update({ dismissed: false });
  }
  return { dismissed, dismiss, restore };
}
