<script setup lang="ts">
/**
 * "Sort by" select with a direction button. Manual order (`manualValue`) has no direction, so the button hides
 * there. The direction button shows its current state in words ("Newest first", "A to Z") besides the arrow icon, and
 * a change of sort starts in that sort's own direction (`defaultDirFor`, in `useListQuery`).
 */
import { ArrowDown, ArrowUp } from "lucide-vue-next";
import { useId } from "vue";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MANUAL_SORT, sortDirectionLabel, type SortDirection } from "./useListQuery";

withDefaults(defineProps<{ options: { value: string; label: string }[]; manualValue?: string; disabled?: boolean }>(), { manualValue: MANUAL_SORT });
const sort = defineModel<string>("sort", { required: true });
const dir = defineModel<SortDirection>("dir", { default: "asc" });
const id = useId();
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1">
    <label :for="id" class="text-xs font-semibold text-ink-2">Sort by</label>
    <div class="flex items-center gap-1">
      <span class="min-w-0 flex-1">
        <Select :id="id" v-model="sort" :disabled="disabled" size="sm">
          <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
        </Select>
      </span>
      <Button
        v-if="sort !== manualValue"
        variant="secondary"
        size="sm"
        :disabled="disabled"
        :aria-label="`${sortDirectionLabel(sort, dir)}, switch to ${sortDirectionLabel(sort, dir === 'asc' ? 'desc' : 'asc').toLowerCase()}`"
        @click="dir = dir === 'asc' ? 'desc' : 'asc'"
      >
        <ArrowUp v-if="dir === 'asc'" aria-hidden="true" />
        <ArrowDown v-else aria-hidden="true" />
        <span aria-hidden="true">{{ sortDirectionLabel(sort, dir) }}</span>
      </Button>
    </div>
  </div>
</template>
