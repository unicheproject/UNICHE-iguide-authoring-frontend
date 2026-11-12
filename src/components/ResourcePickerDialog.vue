<script setup lang="ts" generic="K extends string">
/**
 * Picks one Resource of the Project (`12` §3: Guide references, Navigation items): the kind first, then a title
 * search over the non-archived Resources of that kind. A kind that is off for the Project stays listed, disabled,
 * with the reason (D-049). The caller gives the candidates; the dialog only chooses.
 */
import { computed, ref, watch, type Ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import StatusChip from "@/components/StatusChip.vue";
import type { Pickable, PickerKind } from "@/components/resourcePicker";

const props = defineProps<{
  title: string;
  kinds: PickerKind<K>[];
  candidates: Record<K, Pickable[]>;
  initialKind?: K;
  note?: string;
}>();
const emit = defineEmits<{ pick: [kind: K, item: Pickable]; close: [] }>();

const firstOpen = () => props.kinds.find((k) => !k.off)?.type ?? props.kinds[0]?.type;
const kind = ref(
  props.initialKind && !props.kinds.find((k) => k.type === props.initialKind)?.off ? props.initialKind : firstOpen(),
) as Ref<K | undefined>;
const query = ref("");
watch(kind, () => (query.value = ""));

const pickable = computed(() => {
  const q = query.value.trim().toLowerCase();
  const list: Pickable[] = kind.value ? (props.candidates[kind.value] ?? []) : [];
  return list
    .filter((r) => r.status !== "ARCHIVED")
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title));
});
const offKinds = computed(() => props.kinds.filter((k) => k.off));
</script>

<template>
  <AppDialog :title="title" @close="emit('close')">
    <span id="pick-kind-label" class="field-label mb-1.5 block">Kind</span>
    <div class="mb-3 flex flex-wrap gap-1.5" role="group" aria-labelledby="pick-kind-label">
      <button
        v-for="t in kinds"
        :key="t.type"
        type="button"
        class="rounded-full border px-[13px] py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
        :class="kind === t.type ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700'"
        :aria-pressed="kind === t.type"
        :disabled="!!t.off"
        :aria-describedby="t.off ? 'pick-off-note' : undefined"
        @click="kind = t.type"
      >
        {{ t.plural }}
      </button>
    </div>
    <p v-if="offKinds.length" id="pick-off-note" class="-mt-1.5 mb-3 text-[11px] text-[#855400]">
      <template v-for="(t, i) in offKinds" :key="t.type">{{ i ? " " : "" }}{{ t.plural }}: {{ t.off }}.</template>
    </p>
    <label for="pick-search" class="field-label mb-1.5 block">Search by title</label>
    <input
      id="pick-search"
      v-model="query"
      type="search"
      class="mb-3 w-full rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
    />
    <ul v-if="pickable.length" class="max-h-[280px] overflow-y-auto rounded-lg border">
      <li v-for="r in pickable" :key="r.id" class="border-b border-gray-100 last:border-b-0">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3.5 py-[11px] text-left text-[13px] text-gray-700 hover:bg-muted"
          @click="kind && emit('pick', kind, r)"
        >
          <span class="flex-1">{{ r.title }}</span>
          <StatusChip :status="r.status" />
        </button>
      </li>
    </ul>
    <p v-else class="text-[13px] text-muted-foreground">Nothing to add here: archived items cannot be chosen.</p>
    <p v-if="note" class="mt-2 text-[11px] text-muted-foreground">{{ note }}</p>
    <template #actions>
      <button type="button" class="dialog-secondary" @click="emit('close')">Cancel</button>
    </template>
  </AppDialog>
</template>
