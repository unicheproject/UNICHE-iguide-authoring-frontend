import { computed, onBeforeUnmount, reactive, ref, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { showErrorToast, showToast } from "@/stores/toast";

/**
 * Manual reordering of a content list (iGuide spec 12 section 3, Content library; DECISIONS.md D-017): drag and
 * drop by a handle, with "Move up" and "Move down" buttons as the keyboard path (AGENTS.md section 4 rule 7).
 * A row moves only among its siblings, the rows sharing its `siblingKey` (the same parent in a tree, the same
 * Place for floor plans); the siblings then take back the positions they held in the full order, so no other
 * row moves. The new order is shown at once and saved with the complete id list; a failed save restores it.
 *
 * Round 3 (D-111): a move is visible and undoable. After a saved move `lastMove` says what moved ("Moved to position
 * 3 of 40"), keeps the order from before so `undo()` puts it back (Ctrl/Cmd+Z in `ListTable`), and `flashId` marks the
 * row for 1.5 s. `moves` counts saved moves so `ListTable` can focus the kebab, scroll, and offer "Show it" once the
 * DOM has the new order. The live string uses at most {@link LIVE_TITLE_MAX} characters of the title.
 */

/** Longest title spoken in a move announcement (D-111); longer titles are cut with an ellipsis. */
export const LIVE_TITLE_MAX = 40;

/** A title cut for a live announcement. */
export function liveTitle(title: string): string {
  return title.length > LIVE_TITLE_MAX ? `${title.slice(0, LIVE_TITLE_MAX - 1).trimEnd()}…` : title;
}

/** The last saved move of a list, while it can still be undone. */
export interface LastMove {
  /** The row that moved. */
  id: string;
  /** Its name, cut for display (`liveTitle`). */
  title: string;
  /** 1-based place among its visible siblings now, the place before, and how many siblings there are. */
  position: number;
  from: number;
  count: number;
  /** Every id of the Project in the order before the move (what Undo saves). */
  before: string[];
  /** Counts up with every saved move or undo, so a watcher sees two identical moves. */
  seq: number;
}

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
  /**
   * Rows the list shows; absent means every row. A move then counts only visible siblings (ARCHIVED rows hidden by the
   * default status segment stay where they are), so "Move up" always passes a row the author can see.
   */
  visible?: (item: T) => boolean;
}

export type DropPosition = "before" | "after";

export function useReorder<T extends Orderable>(options: ReorderOptions<T>) {
  const saving = ref(false);
  const announcement = ref("");
  const dragging = ref<string | null>(null);
  const dropTarget = ref<{ id: string; position: DropPosition } | null>(null);
  const lastMove = ref<LastMove | null>(null);
  /** The row to flash after a move or undo (1.5 s). */
  const flashId = ref<string | null>(null);
  /** Counts saved moves and undos; `ListTable` reacts to it to place focus once the rows are in the new order. */
  const moves = ref(0);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  onBeforeUnmount(() => clearTimeout(flashTimer));

  function flash(id: string) {
    clearTimeout(flashTimer);
    flashId.value = id;
    flashTimer = setTimeout(() => (flashId.value = null), 1500);
  }

  /** Reports a failed save: restores the old numbers and says why in the one sentence of that failure. */
  async function failed(e: unknown, previous: Map<string, number>) {
    for (const t of options.items.value) t.sortOrder = previous.get(t.id) ?? t.sortOrder;
    if (!(e instanceof ApiError)) throw e;
    const errors = Array.isArray(e.body.errors) ? (e.body.errors as { code?: string }[]) : [];
    if (errors.some((err) => err.code === "INCOMPLETE_ORDER")) {
      showToast("The list changed", "Someone added or removed an item meanwhile. The list was reloaded; try again.", "warning", { persist: true });
      await options.reload();
    } else {
      showErrorToast(e, "save the order", "The order was not saved");
    }
  }

  const enabled = computed(() => options.canReorder.value && !saving.value);
  const keyOf = (item: T) => options.siblingKey?.(item) ?? null;
  const ordered = () => [...options.items.value].sort((a, b) => a.sortOrder - b.sortOrder);
  const isVisible = (item: T) => options.visible?.(item) ?? true;
  const siblingsOf = (item: T) => ordered().filter((t) => keyOf(t) === keyOf(item) && isVisible(t));

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
    const result = full.map((t) => (keyOf(t) === key && isVisible(t) ? siblings[next++] : t));
    if (result.every((t, i) => t.id === full[i].id)) return;

    const previous = new Map(options.items.value.map((t) => [t.id, t.sortOrder]));
    const before = full.map((t) => t.id);
    const from = siblingsOfBefore(item, full) + 1;
    result.forEach((t, i) => (t.sortOrder = i + 1));
    saving.value = true;
    try {
      await options.save(result.map((t) => t.id));
      const position = siblings.findIndex((t) => t.id === item.id) + 1;
      const name = liveTitle(options.title(item));
      announcement.value = `Moved ${name} to position ${position} of ${siblings.length}.`;
      lastMove.value = { id: item.id, title: name, position, from, count: siblings.length, before, seq: ++moves.value };
      flash(item.id);
    } catch (e) {
      await failed(e, previous);
    } finally {
      saving.value = false;
    }
  }

  /** The 0-based place of `item` among its visible siblings in `full` (the order before a move). */
  function siblingsOfBefore(item: T, full: T[]): number {
    return full.filter((t) => keyOf(t) === keyOf(item) && isVisible(t)).findIndex((t) => t.id === item.id);
  }

  /**
   * Puts the order from before the last move back (D-111) and saves it. A second call does nothing: one Undo per move.
   * Resolves once saved, so the caller can place focus.
   */
  async function undo(): Promise<void> {
    const move = lastMove.value;
    if (!move || saving.value) return;
    lastMove.value = null;
    const previous = new Map(options.items.value.map((t) => [t.id, t.sortOrder]));
    move.before.forEach((id, i) => {
      const t = options.items.value.find((x) => x.id === id);
      if (t) t.sortOrder = i + 1;
    });
    saving.value = true;
    try {
      await options.save(move.before);
      announcement.value = `Move undone. ${move.title} is back at position ${move.from}.`;
      ++moves.value;
      flash(move.id);
    } catch (e) {
      await failed(e, previous);
    } finally {
      saving.value = false;
    }
  }

  /** Forgets the move that could be undone (the bar was dismissed or timed out). */
  function clearLastMove() {
    lastMove.value = null;
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

  /** The row's 1-based place among its visible siblings and how many there are, for "Move to position". */
  function position(item: T): { index: number; count: number } {
    const siblings = siblingsOf(item);
    return { index: siblings.findIndex((t) => t.id === item.id) + 1, count: siblings.length };
  }

  /** Moves the row to a 1-based place among its visible siblings (clamped to 1 .. count). */
  function moveToPosition(item: T, place: number) {
    if (!enabled.value) return;
    const siblings = siblingsOf(item);
    const from = siblings.findIndex((t) => t.id === item.id);
    if (from < 0) return;
    const to = Math.min(Math.max(Math.round(place), 1), siblings.length) - 1;
    if (to === from) return;
    const [moved] = siblings.splice(from, 1);
    siblings.splice(to, 0, moved);
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
    lastMove,
    flashId,
    moves,
    undo,
    clearLastMove,
    highlight: flash,
    dragging,
    canMove,
    position,
    moveToPosition,
    moveBy,
    moveTo,
    dragStart,
    dragOver,
    drop,
    dragEnd,
    dropLine,
  });
}

export type Reorder<T extends Orderable> = ReturnType<typeof useReorder<T>>;
