import { computed, nextTick, onBeforeUnmount, shallowRef } from "vue";
import { say } from "@/lib/announcer";

/** One removed row, kept until it is restored or dismissed. */
export interface RemovedEntry<T> {
  item: T;
  index: number;
  /** What the author sees and hears: "Stop 3, Kouros". */
  label: string;
}

export interface UndoRemoveOptions<T> {
  /** The live list the rows belong to (edited in place, so the removal counts as an unsaved change). */
  list: () => T[];
  /** Names the row for the message, from its position before the removal. */
  describe: (item: T, index: number) => string;
  /** Singular noun for the messages: "stop", "block". */
  noun: string;
  /** Moves focus to the row now at `index` (the next one), or to the previous one or the add control when none is left. */
  focusAt: (index: number, remaining: number) => void;
  /** Moves focus to the restored row. */
  focusRestored: (item: T) => void;
}

/**
 * Remove-with-undo for a list of editor rows (plan 5 P5a): the row leaves the list at once, the removal is
 * announced, keyboard focus moves to the next row, and `undo()` puts the most recent removal back at its old position.
 * Several removals stack. `clear()` forgets them (after a reload or an Apply, when the old positions mean nothing).
 */
export function useUndoRemove<T>(options: UndoRemoveOptions<T>) {
  const removed = shallowRef<RemovedEntry<T>[]>([]);
  const last = computed(() => removed.value[removed.value.length - 1] ?? null);

  // Ctrl or Cmd+Z undoes the last removal (C2-70) while nothing has been typed since it: typing hands Ctrl+Z back to the
  // text field's own undo. The listener exists only while a removal can be undone.
  let typedSince = false;
  let listening = false;
  const onInput = () => (typedSince = true);
  function onKey(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey || event.key.toLowerCase() !== "z") return;
    if (typedSince || !removed.value.length || event.defaultPrevented) return;
    event.preventDefault();
    undo();
  }
  function listen(on: boolean) {
    if (on === listening || typeof window === "undefined") return;
    listening = on;
    if (on) {
      window.addEventListener("keydown", onKey);
      window.addEventListener("input", onInput, true);
    } else {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("input", onInput, true);
    }
  }
  onBeforeUnmount(() => listen(false));

  /** Removes the row at `index`; fails early on an index outside the list. */
  function remove(index: number): void {
    const list = options.list();
    if (index < 0 || index >= list.length) throw new RangeError(`No ${options.noun} at position ${index + 1}`);
    const label = options.describe(list[index], index);
    const [item] = list.splice(index, 1);
    removed.value = [...removed.value, { item, index, label }];
    typedSince = false;
    listen(true);
    say(`${label} removed. Press Ctrl+Z or use Undo next to the list to bring it back.`);
    void nextTick(() => options.focusAt(index, list.length));
  }

  /** Puts the most recent removal back and moves focus to it. */
  function undo(): void {
    const entry = removed.value[removed.value.length - 1];
    if (!entry) return;
    removed.value = removed.value.slice(0, -1);
    if (!removed.value.length) listen(false);
    const list = options.list();
    const at = Math.min(entry.index, list.length);
    list.splice(at, 0, entry.item);
    say(`${entry.label} restored at position ${at + 1} of ${list.length}.`);
    void nextTick(() => options.focusRestored(entry.item));
  }

  /** Drops the undo history; the removals stay removed. */
  function clear(): void {
    removed.value = [];
    listen(false);
  }

  return { removed, last, remove, undo, clear };
}
