<script setup lang="ts" generic="K extends string">
/**
 * Picks Resources of the Project (`12` §3: Guide references, Navigation items, Route stops): the kind first, then a
 * search over the non-archived Resources of that kind (title, code and Place), a status filter and, when candidates
 * carry a Place, a Place filter. A kind that is off for the Project stays listed, disabled, with the reason (D-049).
 * The caller gives the candidates; the dialog only chooses. By default a pick closes it through the caller. With
 * `multiple` the dialog stays open: each pick is announced and marked "Added", `usedIds` rows are listed disabled with
 * a reason, and "Done" closes it, so six stops take one visit (plan 5 P5a).
 */
import { Check } from "lucide-vue-next";
import { computed, ref, watch, type Ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import StatusChip from "@/components/StatusChip.vue";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";
import Select from "@/components/ui/select/Select.vue";
import { say } from "@/lib/announcer";
import { type Pickable, type PickerKind } from "@/components/resourcePicker";
import { fold } from "@/lib/utils";

const props = defineProps<{
  title: string;
  kinds: PickerKind<K>[];
  candidates: Record<K, Pickable[]>;
  initialKind?: K;
  note?: string;
  /** Stay open after a pick so several can be added; the dialog ends with "Done". */
  multiple?: boolean;
  /** With `multiple`: Resources already in the list, shown disabled. */
  usedIds?: Set<string>;
  /** With `multiple`: what a used row says. */
  usedLabel?: string;
}>();
const emit = defineEmits<{ pick: [kind: K, item: Pickable]; close: [] }>();

const firstOpen = () => props.kinds.find((k) => !k.off)?.type ?? props.kinds[0]?.type;
const kind = ref(
  props.initialKind && !props.kinds.find((k) => k.type === props.initialKind)?.off ? props.initialKind : firstOpen(),
) as Ref<K | undefined>;
const query = ref("");
const statusFilter = ref<"ANY" | "ACTIVE" | "DRAFT">("ANY");
const placeFilter = ref("");
watch(kind, () => {
  query.value = "";
  placeFilter.value = "";
});

const kindList = computed<Pickable[]>(() => (kind.value ? (props.candidates[kind.value] ?? []) : []).filter((r) => r.status !== "ARCHIVED"));
const places = computed(() => {
  const byId = new Map<string, string>();
  for (const r of kindList.value) if (r.placeId && r.placeName) byId.set(r.placeId, r.placeName);
  return [...byId.entries()].sort(([, a], [, b]) => a.localeCompare(b)).map(([id, name]) => ({ id, name }));
});
const pickable = computed(() => {
  const q = fold(query.value.trim());
  return kindList.value
    .filter((r) => statusFilter.value === "ANY" || r.status === statusFilter.value)
    .filter((r) => !placeFilter.value || r.placeId === placeFilter.value)
    .filter((r) => !q || fold(r.title).includes(q) || fold(r.code ?? "").includes(q) || fold(r.placeName ?? "").includes(q))
    .sort((a, b) => a.title.localeCompare(b.title));
});
const filtered = computed(() => !!query.value.trim() || statusFilter.value !== "ANY" || !!placeFilter.value);
const offKinds = computed(() => props.kinds.filter((k) => k.off));

// Picks of this visit (multiple mode).
const added = ref<string[]>([]);
function choose(r: Pickable) {
  if (!kind.value) return;
  if (props.multiple) {
    if (added.value.includes(r.id) || props.usedIds?.has(r.id)) return;
    added.value.push(r.id);
    say(`${r.title} added. ${added.value.length} added in total.`);
  }
  emit("pick", kind.value, r);
}
const isAdded = (r: Pickable) => added.value.includes(r.id);
const isUsed = (r: Pickable) => !!props.usedIds?.has(r.id) && !isAdded(r);

// Keyboard: ArrowDown in the search moves into the results, Enter picks the first one that can be chosen (C2-72); in the
// list, ArrowUp and ArrowDown move between rows and ArrowUp from the first goes back to the search.
const resultsEl = ref<HTMLElement | null>(null);
const resultButtons = () => [...(resultsEl.value?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
function onSearchKey(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    resultButtons()[0]?.focus();
  } else if (event.key === "Enter") {
    event.preventDefault();
    const first = pickable.value.find((r) => !(props.multiple && (isAdded(r) || isUsed(r))));
    if (first) choose(first);
  }
}
function onResultKey(event: KeyboardEvent) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const buttons = resultButtons();
  const at = buttons.indexOf(event.target as HTMLButtonElement);
  if (event.key === "ArrowDown") buttons[Math.min(at + 1, buttons.length - 1)]?.focus();
  else if (at > 0) buttons[at - 1].focus();
  else document.getElementById("pick-search")?.focus();
}

function resetFilters() {
  query.value = "";
  statusFilter.value = "ANY";
  placeFilter.value = "";
}
</script>

<template>
  <AppDialog :title="title" :size="multiple ? 'lg' : 'md'" @close="emit('close')">
    <div v-if="kinds.length > 1" role="group" aria-labelledby="pick-kind-label" class="mb-4">
      <span id="pick-kind-label" class="mb-1.5 block text-sm font-semibold text-ink-2">Kind</span>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="t in kinds"
          :key="t.type"
          :variant="kind === t.type ? 'primary' : 'secondary'"
          size="sm"
          :aria-pressed="kind === t.type"
          :disabled="!!t.off"
          :aria-describedby="t.off ? 'pick-off-note' : undefined"
          @click="kind = t.type"
        >
          {{ t.plural }}
        </Button>
      </div>
    </div>
    <p v-if="offKinds.length" id="pick-off-note" class="-mt-2 mb-4 text-xs text-warning">
      <template v-for="(t, i) in offKinds" :key="t.type">{{ i ? " " : "" }}{{ t.plural }}: {{ t.off }}.</template>
    </p>

    <div class="mb-3 grid gap-3" :class="multiple ? 'sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]' : ''">
      <FormField label="Search" id="pick-search" v-slot="f">
        <Input :id="f.id" v-model="query" type="search" :placeholder="multiple ? 'Title, exhibit code or place' : 'Title'" aria-keyshortcuts="ArrowDown Enter" @keydown="onSearchKey" />
      </FormField>
      <template v-if="multiple">
        <FormField label="Status" id="pick-status" v-slot="f">
          <Select :id="f.id" v-model="statusFilter">
            <option value="ANY">Active and draft</option>
            <option value="ACTIVE">Active only</option>
            <option value="DRAFT">Draft only</option>
          </Select>
        </FormField>
        <FormField v-if="places.length" label="Place" id="pick-place" v-slot="f">
          <Select :id="f.id" v-model="placeFilter">
            <option value="">All places</option>
            <option v-for="p in places" :key="p.id" :value="p.id">{{ p.name }}</option>
          </Select>
        </FormField>
      </template>
    </div>

    <!-- Live only for the count of matches, which a search changes; a pick is announced once, by `choose`. -->
    <p class="mb-1.5 text-xs text-muted-foreground">
      <span aria-live="polite">{{ pickable.length === 1 ? "1 item" : `${pickable.length} items` }}<template v-if="filtered"> match</template></span><template v-if="multiple && added.length">{{ ", " }}{{ added.length }} added</template>
    </p>
    <ul v-if="pickable.length" ref="resultsEl" @keydown="onResultKey" class="max-h-[min(26rem,50dvh)] overflow-y-auto rounded-md border border-border">
      <li v-for="r in pickable" :key="r.id" class="border-b border-border last:border-b-0">
        <button
          type="button"
          class="flex min-h-row w-full items-center gap-3 px-3 py-2 text-left text-sm transition-ui hover:bg-surface-hover aria-disabled:cursor-default aria-disabled:text-muted-foreground aria-disabled:hover:bg-transparent"
          :aria-disabled="multiple && (isAdded(r) || isUsed(r)) ? 'true' : undefined"
          @click="choose(r)"
        >
          <span class="min-w-0 flex-1">
            <span class="block break-words font-medium">{{ r.title }}</span>
            <span v-if="r.code || r.placeName" class="block text-xs text-muted-foreground">
              <template v-if="r.code">Code <span class="mono">{{ r.code }}</span></template><template v-if="r.code && r.placeName"> · </template><template v-if="r.placeName">{{ r.placeName }}</template>
            </span>
          </span>
          <span v-if="multiple && isAdded(r)" class="inline-flex items-center gap-1 text-xs font-semibold text-success"><Check class="size-4" aria-hidden="true" />Added</span>
          <span v-else-if="multiple && isUsed(r)" class="text-xs text-muted-foreground">{{ usedLabel ?? "Already in the list" }}</span>
          <StatusChip :status="r.status" />
        </button>
      </li>
    </ul>
    <div v-else class="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      <template v-if="filtered">Nothing matches. <Button variant="link" @click="resetFilters">Clear the search and filters</Button></template>
      <template v-else>Nothing to add here: archived items cannot be chosen.</template>
    </div>
    <p v-if="note" class="mt-2 text-xs text-muted-foreground">{{ note }}</p>
    <template #actions>
      <Button v-if="multiple" @click="emit('close')">Done<template v-if="added.length"> ({{ added.length }} added)</template></Button>
      <Button v-else variant="secondary" @click="emit('close')">Cancel</Button>
    </template>
  </AppDialog>
</template>
