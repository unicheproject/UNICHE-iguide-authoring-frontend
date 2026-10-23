import { computed, reactive, ref, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { showToast } from "@/stores/toast";

/**
 * Manual reordering of a content list (iGuide spec 12 section 3, Content library; DECISIONS.md D-017): drag and
 * drop by a handle, with "Move up" and "Move down" buttons as the keyboard path (AGENTS.md section 4 rule 7).
 * A row moves only among its siblings, the rows sharing its `siblingKey` (the same parent in a tree, the same
 * Place for floor plans); the siblings then take back the positions they held in the full order, so no other
 * row moves. The new order is shown at once and saved with the complete id list; a failed save restores it.
 */

export interface Orderable {
  id: string;
  sortOrder: number;
}

export interface ReorderOptions<T extends Orderable> {
  /** The whole loaded list, every status: the order endpoint needs every id of the Project. */
  items: Ref<T[]>;
  /** Rows with the same key reorder among themselves; absent for a flat list. */
  siblingKey?: (item: T) => string | null;
  save: (ids: string[]) => Promise<void>;
  /** The row's name in announcements, such as its title in the default language. */
  title: (item: T) => string;
  /** False while a search or filter hides rows, since a move among visible rows would be ambiguous. */
  canReorder: Ref<boolean>;
  /** Reloads the list after someone else added or removed a row meanwhile. */
  reload: () => unknown;
}

export type DropPosition = "before" | "after";

export function useReorder<T extends Orderable>(options: ReorderOptions<T>) {
  const saving = ref(false);
  const announcement = ref("");
  const dragging = ref<string | null>(null);
  const dropTarget = ref<{ id: string; position: DropPosition } | null>(null);

  const enabled = computed(() => options.canReorder.value && !saving.value);
  const keyOf = (item: T) => options.siblingKey?.(item) ?? null;
  const ordered = () => [...options.items.value].sort((a, b) => a.sortOrder - b.sortOrder);
  const siblingsOf = (item: T) => ordered().filter((t) => keyOf(t) === keyOf(item));

  function canMove(item: T, delta: number): boolean {
    if (!enabled.value) return false;
    const siblings = siblingsOf(item);
    const target = siblings.findIndex((t) => t.id === item.id) + delta;
    return target >= 0 && target < siblings.length;
  }

  async function commit(item: T, siblings: T[]) {
    const full = ordered();
    const key = keyOf(item);
    let next = 0;
    const result = full.map((t) => (keyOf(t) === key ? siblings[next++] : t));
    if (result.every((t, i) => t.id === full[i].id)) return;

    const previous = new Map(options.items.value.map((t) => [t.id, t.sortOrder]));
    result.forEach((t, i) => (t.sortOrder = i + 1));
    saving.value = true;
    try {
      await options.save(result.map((t) => t.id));
      const position = siblings.findIndex((t) => t.id === item.id) + 1;
      announcement.value = `Moved ${options.title(item)} to position ${position} of ${siblings.length}.`;
    } catch (e) {
      for (const t of options.items.value) t.sortOrder = previous.get(t.id) ?? t.sortOrder;
      if (!(e instanceof ApiError)) throw e;
      const errors = Array.isArray(e.body.errors) ? (e.body.errors as { code?: string }[]) : [];
      if (errors.some((err) => err.code === "INCOMPLETE_ORDER")) {
        showToast("The list changed", "Someone added or removed an item meanwhile. The list was reloaded; try again.", "warning");
        await options.reload();
      } else {
        showToast(
          "The order was not saved",
          e.platformUnavailable ? "The UNICHE platform is not reachable." : `${e.message}${e.requestId ? ` (request id ${e.requestId})` : ""}`,
          "error",
        );
      }
    } finally {
      saving.value = false;
    }
  }

  /** One step up (-1) or down (+1) among the row's siblings. */
  function moveBy(item: T, delta: number) {
    if (!canMove(item, delta)) return;
    const siblings = siblingsOf(item);
    const from = siblings.findIndex((t) => t.id === item.id);
    const [moved] = siblings.splice(from, 1);
    siblings.splice(from + delta, 0, moved);
    void commit(item, siblings);
  }

  function moveTo(item: T, target: T, position: DropPosition) {
    if (!enabled.value || item.id === target.id || keyOf(item) !== keyOf(target)) return;
    const siblings = siblingsOf(item).filter((t) => t.id !== item.id);
    const at = siblings.findIndex((t) => t.id === target.id);
    siblings.splice(position === "before" ? at : at + 1, 0, item);
    void commit(item, siblings);
  }

  // Drag and drop --------------------------------------------------------------------------------------------

  const draggedItem = () => options.items.value.find((t) => t.id === dragging.value);

  function dragStart(item: T, event: DragEvent) {
    if (!enabled.value || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    dragging.value = item.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
    const row = (event.target as HTMLElement).closest("tr, li");
    if (row) event.dataTransfer.setDragImage(row, 16, 16);
  }

  /** Accepts only a sibling; the pointer's half of the row says whether the drop goes above or below it. */
  function dragOver(target: T, event: DragEvent) {
    const source = draggedItem();
    if (!source || source.id === target.id || keyOf(source) !== keyOf(target)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dropTarget.value = { id: target.id, position: event.clientY < rect.top + rect.height / 2 ? "before" : "after" };
  }

  function drop(target: T, event: DragEvent) {
    event.preventDefault();
    const source = draggedItem();
    const where = dropTarget.value;
    dragEnd();
    if (source && where && where.id === target.id) moveTo(source, target, where.position);
  }

  function dragEnd() {
    dragging.value = null;
    dropTarget.value = null;
  }

  /** Where the drop line shows on this row while dragging, if anywhere. */
  function dropLine(item: T): DropPosition | null {
    return dropTarget.value?.id === item.id ? dropTarget.value.position : null;
  }

  return reactive({
    enabled,
    saving,
    announcement,
    dragging,
    canMove,
    moveBy,
    moveTo,
    dragStart,
    dragOver,
    drop,
    dragEnd,
    dropLine,
  });
}

/**
 * The drop line on a row while dragging: a purple rule above or below it. On a table row it is drawn on the cells,
 * since not every browser paints a shadow on a `<tr>`.
 */
export function dropLineClass(position: DropPosition | null): string {
  if (position === "before") return "shadow-[inset_0_2px_0_0_#4c1d8b] [&>td]:shadow-[inset_0_2px_0_0_#4c1d8b]";
  if (position === "after") return "shadow-[inset_0_-2px_0_0_#4c1d8b] [&>td]:shadow-[inset_0_-2px_0_0_#4c1d8b]";
  return "";
}

export type Reorder<T extends Orderable> = ReturnType<typeof useReorder<T>>;
