<script setup lang="ts">
/**
 * The "Filters" button of a Content list toolbar (iGuide spec 12 section 3, Content library). The filters sit in a
 * popover so the toolbar keeps only the search; every filter in force stays visible as a removable chip beside the
 * button, and the button counts them (`14` §4: state never hidden, never by colour alone; DECISIONS.md D-061).
 *
 * The popover is modal: focus moves into it, Tab stays inside, Escape or a click outside closes it and focus returns
 * to the button. The filters go in the default slot, one `FilterChoiceGroup` or labelled control each.
 */
import { nextTick, ref } from "vue";
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "radix-vue";
import { ChevronDown, SlidersHorizontal, X } from "lucide-vue-next";
import type { ActiveFilter } from "@/workspace/listFilters";

const props = defineProps<{ active: ActiveFilter[] }>();
const open = ref(false);
const trigger = ref<InstanceType<typeof PopoverTrigger> | null>(null);

function focusTrigger() {
  void nextTick(() => (trigger.value?.$el as HTMLElement | undefined)?.focus());
}

const body = ref<HTMLElement | null>(null);

/** Opening puts focus on the first filter's current choice, not on the close button. */
function focusFirstFilter(event: Event) {
  const first = body.value?.querySelector<HTMLElement>("input:checked, input:not([type=radio]), select, button");
  if (!first) return;
  event.preventDefault();
  first.focus();
}

function remove(filter: ActiveFilter) {
  filter.clear();
  focusTrigger();
}

function clearAll() {
  for (const f of props.active) f.clear();
}

function clearFromChips() {
  clearAll();
  focusTrigger();
}
</script>

<template>
  <PopoverRoot v-model:open="open" modal>
    <PopoverTrigger
      ref="trigger"
      class="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] bg-card px-3 py-[8px] text-[12px] font-bold text-foreground transition-colors hover:border-primary/60 hover:bg-accent data-[state=open]:border-primary"
      :class="active.length ? 'border-primary text-primary' : ''"
    >
      <SlidersHorizontal class="size-3.5" aria-hidden="true" />
      Filters
      <span
        v-if="active.length"
        class="inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-extrabold leading-[18px] text-white"
      >
        {{ active.length }}<span class="sr-only">&nbsp;active</span>
      </span>
      <ChevronDown class="size-3.5 transition-transform" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="6"
        :collision-padding="16"
        aria-label="Filters"
        @open-auto-focus="focusFirstFilter"
        class="z-50 flex max-h-[var(--radix-popover-content-available-height)] w-[min(340px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border bg-card shadow-[0_8px_28px_rgba(17,24,39,0.14)] outline-none"
      >
        <div class="flex items-center justify-between border-b px-4 py-3">
          <h2 class="text-[13px] font-bold">Filters</h2>
          <PopoverClose
            class="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close filters"
          >
            <X class="size-4" aria-hidden="true" />
          </PopoverClose>
        </div>
        <div ref="body" class="flex flex-col gap-4 overflow-y-auto px-4 py-4">
          <slot />
        </div>
        <div class="flex items-center justify-between gap-3 border-t bg-muted/60 px-4 py-2.5">
          <button
            type="button"
            class="text-[11px] font-bold uppercase tracking-[0.06em] text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            :disabled="!active.length"
            @click="clearAll"
          >
            Clear filters
          </button>
          <PopoverClose
            class="rounded-full bg-primary px-4 py-[7px] text-[11px] font-bold uppercase tracking-[0.06em] text-white hover:bg-primary/90"
          >
            Done
          </PopoverClose>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>

  <ul v-if="active.length" class="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
    <li v-for="f in active" :key="f.key" class="inline-flex">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-accent py-1 pl-2.5 pr-1.5 text-[11px] font-semibold text-primary hover:border-primary"
        :aria-label="`Remove filter ${f.label}`"
        @click="remove(f)"
      >
        {{ f.label }}
        <X class="size-3" aria-hidden="true" :stroke-width="2.5" />
      </button>
    </li>
    <li v-if="active.length > 1" class="inline-flex">
      <button type="button" class="px-1 text-[11px] font-bold text-muted-foreground underline-offset-2 hover:text-primary hover:underline" @click="clearFromChips">
        Clear all
      </button>
    </li>
  </ul>
</template>
