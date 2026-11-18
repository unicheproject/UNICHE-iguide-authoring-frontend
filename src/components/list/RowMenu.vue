<script setup lang="ts" generic="T extends Orderable">
/**
 * The one kebab menu of a list row (D-076): the view's lifecycle actions first (Activate / Deactivate, Archive /
 * Restore, ...), then the keyboard reorder path when a `reorder` is given: Move up, Move down, Move to position...,
 * Move to top, Move to bottom. Arrow keys, type-ahead and Esc with focus back on the button come from the menu
 * primitive. When reordering is blocked, the move items are replaced by one item that says why and, when chosen,
 * emits `select` with key `restore-order` (the view calls `query.restoreManualOrder()`).
 *
 * "Move to position..." opens `SetPositionDialog`; the dialog lives here, outside the menu, so closing the menu does
 * not remove it, and focus returns to this button afterwards.
 */
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, EllipsisVertical, ListOrdered, ListRestart } from "lucide-vue-next";
import { nextTick, ref, type Component, type ComponentPublicInstance } from "vue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Orderable, Reorder } from "@/workspace/useReorder";
import SetPositionDialog from "./SetPositionDialog.vue";

/** One view action in the menu. */
export interface RowAction {
  key: string;
  label: string;
  icon?: Component;
  danger?: boolean;
  disabled?: boolean;
}

const props = defineProps<{
  /** The row's name, for "Actions for <name>". */
  title: string;
  actions?: RowAction[];
  reorder?: Reorder<T>;
  item?: T;
  /** Why reordering is blocked now (`query.reorderReason`); null or absent when it is allowed. */
  reorderReason?: string | null;
}>();
const emit = defineEmits<{ select: [key: string] }>();

const trigger = ref<ComponentPublicInstance | null>(null);
const positioning = ref(false);

const place = () => (props.reorder && props.item ? props.reorder.position(props.item) : { index: 0, count: 0 });
const canUp = () => !!props.reorder && !!props.item && props.reorder.canMove(props.item, -1);
const canDown = () => !!props.reorder && !!props.item && props.reorder.canMove(props.item, 1);

/**
 * The menu opens on its first non-destructive item (a Move item, marked `data-open-focus`), never on a lifecycle action
 * such as Deactivate (R2-V-05). Radix focuses the first item as the menu mounts, so focus moves after that; arrow keys
 * and type-ahead keep working from there. Without a safe item the first item keeps focus.
 */
function focusMenu(event: Event) {
  event.preventDefault();
  const take = () => {
    const safe = document.querySelector<HTMLElement>("[role='menu'][data-state='open'] [data-open-focus]:not([data-disabled])");
    safe?.focus();
  };
  requestAnimationFrame(() => requestAnimationFrame(take));
}
function focusTrigger() {
  void nextTick(() => (trigger.value?.$el as HTMLElement | undefined)?.focus());
}
function choose(key: string) {
  emit("select", key);
}
/** Opens after the menu has closed and given focus back to the button, so the dialog's opener is that button. */
function openPosition() {
  window.setTimeout(() => (positioning.value = true), 80);
}
function movePosition(position: number) {
  positioning.value = false;
  if (props.reorder && props.item) props.reorder.moveToPosition(props.item, position);
  focusTrigger();
}
function closePosition() {
  positioning.value = false;
  focusTrigger();
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button ref="trigger" variant="ghost" size="icon" :label="`Actions for ${title}`">
        <EllipsisVertical aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent @open-auto-focus="focusMenu">
      <DropdownMenuItem v-for="a in actions" :key="a.key" :danger="a.danger" :disabled="a.disabled" @select="choose(a.key)">
        <component :is="a.icon" v-if="a.icon" aria-hidden="true" />
        {{ a.label }}
      </DropdownMenuItem>
      <template v-if="reorder && item">
        <DropdownMenuSeparator v-if="actions?.length" />
        <template v-if="reorderReason">
          <DropdownMenuItem @select="choose('restore-order')">
            <ListRestart aria-hidden="true" />
            {{ reorderReason }}
          </DropdownMenuItem>
        </template>
        <template v-else>
          <DropdownMenuItem data-open-focus :disabled="!canUp()" @select="reorder.moveBy(item, -1)">
            <ArrowUp aria-hidden="true" />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem data-open-focus :disabled="!canDown()" @select="reorder.moveBy(item, 1)">
            <ArrowDown aria-hidden="true" />
            Move down
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="place().count < 2" @select="openPosition">
            <ListOrdered aria-hidden="true" />
            Move to position...
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="!canUp()" @select="reorder.moveToPosition(item, 1)">
            <ArrowUpToLine aria-hidden="true" />
            Move to top
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="!canDown()" @select="reorder.moveToPosition(item, place().count)">
            <ArrowDownToLine aria-hidden="true" />
            Move to bottom
          </DropdownMenuItem>
        </template>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
  <SetPositionDialog
    v-if="positioning && reorder && item"
    :title="title"
    :current="place().index"
    :count="place().count"
    @confirm="movePosition"
    @close="closePosition"
  />
</template>
