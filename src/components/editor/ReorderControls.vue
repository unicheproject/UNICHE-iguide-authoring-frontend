<script setup lang="ts">
/**
 * The controls of one reorderable editor row (Route stop, Guide element; `14` §4, D-029): a labelled drag handle (also
 * movable with the Up and Down arrow keys), a "Position" choice, Move up, Move down, an optional extra slot (such as
 * "Insert after"), and Remove, set apart from the move buttons. Targets are at least 32 px (44 on a coarse pointer).
 * The row owner does the moving and the removing; element ids derive from `idBase` so it can return focus:
 * `<idBase>-handle`, `-move-up`, `-move-down`, `-position`.
 */
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import Select from "@/components/ui/select/Select.vue";

const props = defineProps<{
  idBase: string;
  /** Zero-based position and list length. */
  index: number;
  count: number;
  /** What the row is, for accessible names: "stop 3, Kouros". */
  name: string;
  /** Whether dragging is offered (more than one row). */
  draggable?: boolean;
}>();
const emit = defineEmits<{
  /** `via` says which control asked, so the owner can keep focus on it. */
  move: [delta: number, via: "up" | "down" | "handle"];
  position: [position: number];
  remove: [];
  dragstart: [event: DragEvent];
  dragend: [];
}>();

function onHandleKey(event: KeyboardEvent) {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  event.preventDefault();
  const delta = event.key === "ArrowUp" ? -1 : 1;
  const target = props.index + delta;
  if (target >= 0 && target < props.count) emit("move", delta, "handle");
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <template v-if="count > 1">
      <button
        :id="`${idBase}-handle`"
        type="button"
        :draggable="draggable !== false"
        :aria-label="`Drag handle for ${name}`"
        :aria-describedby="`${idBase}-handle-hint`"
        title="Drag to reorder, or press Up and Down arrow keys"
        class="inline-flex size-control cursor-grab items-center justify-center rounded-md text-muted-foreground transition-ui hover:bg-surface-hover hover:text-foreground active:cursor-grabbing"
        @keydown="onHandleKey"
        @dragstart="emit('dragstart', $event)"
        @dragend="emit('dragend')"
      >
        <GripVertical class="size-4" aria-hidden="true" />
      </button>
      <span :id="`${idBase}-handle-hint`" class="sr-only">Drag with the mouse, or press the Up and Down arrow keys to move it. Move up, Move down and Position do the same.</span>
      <label :for="`${idBase}-position`" class="sr-only">Position of {{ name }}</label>
      <span class="inline-block w-20">
        <Select
          :id="`${idBase}-position`"
          :model-value="index + 1"
          @update:model-value="emit('position', Number($event))"
        >
          <option v-for="n in count" :key="n" :value="n">{{ n }}</option>
        </Select>
      </span>
      <Button :id="`${idBase}-move-up`" variant="ghost" size="icon" :label="`Move ${name} up`" title="Move up" :disabled="index === 0" @click="emit('move', -1, 'up')">
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button :id="`${idBase}-move-down`" variant="ghost" size="icon" :label="`Move ${name} down`" title="Move down" :disabled="index === count - 1" @click="emit('move', 1, 'down')">
        <ArrowDown aria-hidden="true" />
      </Button>
    </template>
    <slot />
    <span class="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true"></span>
    <Button variant="ghost" size="icon" :label="`Remove ${name}`" title="Remove" class="text-destructive hover:text-destructive" @click="emit('remove')">
      <Trash2 aria-hidden="true" />
    </Button>
  </div>
</template>
