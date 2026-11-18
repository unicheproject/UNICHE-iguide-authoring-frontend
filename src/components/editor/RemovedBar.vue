<script setup lang="ts">
/**
 * The "Stop removed. Undo" bar of an editor list (C2-70): names the last removal, offers Undo (with how many more are
 * waiting, and the Ctrl or Cmd+Z shortcut) and Dismiss. It is a labelled group, not a live region: the removal is announced once, by
 * `useUndoRemove`. `anchor` says where it sits: "sticky" (default) keeps it at the bottom of the viewport for as long
 * as its list is on screen, so it is never off-screen after a removal from a long list; "inline" leaves it in the flow.
 * The bar sits below the sticky header (`z-raised` is under `z-sticky`), above the page.
 */
import { Undo2, X } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useToastOffset } from "@/lib/toastOffset";
import { Button } from "@/components/ui/button";

const props = withDefaults(
  defineProps<{
    /** The label of the last removal, such as "Stop 3, Kouros". */
    label: string;
    /** Singular noun, "stop". */
    noun: string;
    /** How many removals can still be undone. */
    count: number;
    /** "sticky": bottom of the viewport while the list is visible; "inline": in the flow where it is placed. */
    anchor?: "sticky" | "inline";
  }>(),
  { anchor: "sticky" },
);
const emit = defineEmits<{ undo: []; dismiss: [] }>();
/** " 1 more can be undone.", with its leading space (a space written in the template is trimmed by the compiler). */
const more = computed(() => (props.count > 1 ? ` ${props.count - 1} more can be undone.` : ""));
const bar = ref<HTMLElement | null>(null);
// A sticky bar sits at the viewport bottom: toasts stand above it.
useToastOffset(computed(() => (props.anchor === "sticky" ? bar.value : null)));
</script>

<template>
  <div
    ref="bar"
    class="flex flex-wrap items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm"
    :class="anchor === 'sticky' ? 'sticky bottom-2 z-raised shadow-2' : 'bg-muted'"
    role="group"
    :aria-label="`Removed ${noun}`"
    data-removed-bar
  >
    <span class="min-w-0 flex-1 break-words" data-removed-text><span class="font-semibold">{{ label }}</span>{{ " " }}removed.{{ more }}</span>
    <Button variant="secondary" size="sm" data-undo aria-keyshortcuts="Control+Z Meta+Z" @click="emit('undo')">
      <Undo2 aria-hidden="true" />Undo<span class="sr-only"> removing {{ label }}</span><kbd class="ml-1 text-xs font-medium text-muted-foreground max-sm:hidden" aria-hidden="true">Ctrl+Z</kbd>
    </Button>
    <Button variant="ghost" size="icon" label="Dismiss" @click="emit('dismiss')"><X aria-hidden="true" /></Button>
  </div>
</template>
