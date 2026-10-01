import { computed, shallowRef, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import type { ResourceStatus } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";

/**
 * Activate, deactivate, restore, and archive buttons of a list, as the other lists have them: activation
 * and restore run at once; deactivation and archival ask first and show what still uses the item.
 */
export function useStatusActions<T extends { id: string; status: ResourceStatus; version: number }>(options: {
  items: Ref<T[]>;
  kind: string;
  title: (item: T) => string;
  change: (item: T, target: ResourceStatus) => Promise<T>;
  reload: () => void;
}) {
  const pendingId = shallowRef<string | null>(null);
  const confirm = shallowRef<{ item: T; target: ResourceStatus; blockedBy?: ResourceReference[] } | null>(null);

  function toggleLabel(item: T): string {
    return item.status === "DRAFT" ? "Activate" : item.status === "ACTIVE" ? "Deactivate" : "Restore";
  }

  function onToggle(item: T) {
    if (item.status === "DRAFT") void transition(item, "ACTIVE");
    else if (item.status === "ACTIVE") confirm.value = { item, target: "DRAFT" };
    else void transition(item, "DRAFT");
  }

  async function transition(item: T, target: ResourceStatus) {
    pendingId.value = item.id;
    try {
      const updated = await options.change(item, target);
      options.items.value = options.items.value.map((i) => (i.id === updated.id ? updated : i));
      confirm.value = null;
      const name = options.title(updated);
      const messages: Record<ResourceStatus, [string, string]> = {
        ACTIVE: ["Activated", `${name} is complete and active.`],
        DRAFT: item.status === "ARCHIVED" ? ["Restored", `${name} is a draft again.`] : ["Deactivated", `${name} is a draft again.`],
        ARCHIVED: ["Archived", `${name} is archived.`],
      };
      const [heading, body] = messages[target];
      showToast(heading, body, target === "ACTIVE" ? "success" : "warning");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.code === "RESOURCE_IN_USE" && confirm.value) {
        confirm.value = { ...confirm.value, blockedBy: (e.body.references as ResourceReference[]) ?? [] };
        return;
      }
      confirm.value = null;
      if (e.code === "MISSING_REQUIRED_FIELDS") {
        showToast("Cannot activate yet", e.details.map((d) => d.slice(d.indexOf(": ") + 2)).join(" "), "error");
      } else if (e.code === "VERSION_CONFLICT") {
        showToast("It changed meanwhile", "The list was reloaded; check it and try again.", "warning");
        options.reload();
      } else {
        showToast("The change was not saved", e.platformUnavailable ? "The UNICHE platform is not reachable." : e.message, "error");
      }
    } finally {
      pendingId.value = null;
    }
  }

  const confirmCopy = computed(() => {
    const c = confirm.value;
    if (!c) return null;
    const name = options.title(c.item);
    return c.target === "ARCHIVED"
      ? { heading: `Archive ${name}?`, body: `An archived ${options.kind} leaves the visitor app and the default lists. Restoring it makes it a draft again.`, action: "Archive" }
      : { heading: `Deactivate ${name}?`, body: "Visitors stop seeing it on their next refresh. It becomes a draft.", action: "Deactivate" };
  });

  function ask(item: T, target: ResourceStatus) {
    confirm.value = { item, target };
  }

  function cancel() {
    confirm.value = null;
  }

  return { pendingId, confirm, confirmCopy, toggleLabel, onToggle, transition, ask, cancel };
}
