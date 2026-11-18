<script setup lang="ts">
/**
 * The "Media" section of a Resource (plan 2.3: compact slots, empty slots are one-line buttons). A single slot holds one
 * Asset; a `multiple` slot is an ordered list; a `perLanguage` slot, such as an audio narration, holds one Asset per
 * Project language plus an "All languages" one that visitors get when their language has none (iGuide spec 03
 * section 4, 11 lines 169-171). A slot that `requires` another, such as a 3D model and its poster image (03 lines
 * 521-531), warns while the other is empty. Edits the given `media` list in place, so they count as unsaved changes
 * of the Resource and are saved with it.
 *
 * Empty single and gallery slots are one row of "Add" buttons. A per-language slot is one visible group inside the card
 * ("Audio narration", C2-66): a row for each language that has a file (Replace, Clear) and one chip per language
 * that has none, so no language tab has to be opened to find it. After a file is chosen focus lands on its Replace
 * button (C2-57), because the "Add" button it came from is gone. `itemStatus` lets the card warn about a DRAFT Asset
 * attached to an ACTIVE item.
 */
import { ArrowDown, ArrowUp, Music, Pencil, Plus, Replace, TriangleAlert, X } from "lucide-vue-next";
import { computed, nextTick, ref } from "vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import { Button } from "@/components/ui/button";
import AssetPickerDialog from "@/components/media/AssetPickerDialog.vue";
import AssetThumb from "@/components/media/AssetThumb.vue";
import {
  assetMeta,
  assetTypeLabel,
  missingAlternativeText,
  type Asset,
  type AssetType,
  type AssetUsage,
  type MediaBinding,
} from "@/platform/assets";
import type { ProjectLanguage } from "@/platform/languages";
import type { ResourceStatus } from "@/platform/places";

export interface MediaSlot {
  usage: AssetUsage;
  label: string;
  accept: AssetType[];
  multiple?: boolean;
  perLanguage?: boolean;
  recommended?: boolean;
  /** Another slot that must hold an Asset whenever this one does. */
  requires?: AssetUsage;
  /** One line under the slot's title. */
  hint?: string;
}

const props = withDefaults(defineProps<{
  projectId: string;
  slots: MediaSlot[];
  media: MediaBinding[];
  assets: Asset[];
  languages: ProjectLanguage[];
  defaultLanguage: string | null;
  readonly: boolean;
  fieldError: (path: string) => string | undefined;
  /** The status of the item the media belongs to; a DRAFT Asset on an ACTIVE item is warned about. */
  itemStatus?: ResourceStatus;
}>(), { itemStatus: undefined });
const emit = defineEmits<{ uploaded: [asset: Asset] }>();

const assetById = computed(() => new Map(props.assets.map((a) => [a.id, a])));

/** The languages a per-language slot has a file for, as rows: each Project language, then "All languages". */
const languageRows = computed(() => [
  ...props.languages.map((l) => ({ languageCode: l.languageCode as string | null, displayName: l.displayName })),
  { languageCode: null as string | null, displayName: "All languages" },
]);
/** "Primary image" to "primary image" for a button sentence; "3D model" keeps its capital letters. */
const lower = (label: string) => label.replace(/^\p{Lu}(?=\p{Ll})/u, (c) => c.toLowerCase());

/** An empty single or gallery slot is one button in a shared row; a per-language slot is a group of its own. */
function isEmptyAdd(slot: MediaSlot): boolean {
  return !slot.perLanguage && !props.media.some((b) => b.usage === slot.usage);
}
const shownSlots = computed(() => props.slots.filter((s) => !s.perLanguage && !isEmptyAdd(s)));
const languageSlots = computed(() => props.slots.filter((s) => s.perLanguage));
/** The empty slots, offered as one wrapped row of add buttons; a poster waits for its 3D model (`requires`). */
const emptySlots = computed(() =>
  props.slots.filter((s) => isEmptyAdd(s) && !props.slots.some((o) => o.requires === s.usage && !props.media.some((b) => b.usage === o.usage))),
);

/** How many of the Project's languages (and "All languages") have a file in a per-language slot. */
function languagesFilled(slot: MediaSlot): number {
  return new Set(props.media.filter((b) => b.usage === slot.usage).map((b) => b.languageCode)).size;
}
/** The slots with at least one Asset, for the section's count. */
const filledCount = computed(() => props.slots.filter((s) => props.media.some((b) => b.usage === s.usage)).length);
/** "1 of 6 filled", and which slot is recommended while it is empty, so the "Add" button need not say it. */
const countText = computed(() => {
  const empty = props.slots.find((s) => s.recommended && !props.media.some((b) => b.usage === s.usage));
  return `${filledCount.value} of ${props.slots.length} filled${empty ? ` · ${lower(empty.label)} recommended` : ""}`;
});
/** "Primary image missing" for the section rail while a recommended slot is empty. */
const railState = computed(() => {
  const empty = props.slots.find((s) => s.recommended && !props.media.some((b) => b.usage === s.usage));
  return empty ? `${empty.label} missing` : undefined;
});

/** The warning for an Asset that is still a draft while the item it is attached to is live. */
function draftWarning(asset: Asset | undefined): string | null {
  return props.itemStatus === "ACTIVE" && asset?.status === "DRAFT" ? `“${asset.internalName}” is still a draft. Activate it so visitors can see it.` : null;
}

/** The warning of a slot that requires another one that is still empty. */
function missingRequired(slot: MediaSlot): string | null {
  if (!slot.requires || !bindingsOf(slot).length) return null;
  if (props.media.some((b) => b.usage === slot.requires)) return null;
  const other = props.slots.find((s) => s.usage === slot.requires);
  return `Add the ${other ? other.label.toLowerCase() : "required image"} too; visitors see it before the ${slot.label.toLowerCase()} loads.`;
}

function bindingsOf(slot: MediaSlot, languageCode: string | null = null) {
  return props.media
    .map((binding, index) => ({ binding, index }))
    .filter(({ binding }) => binding.usage === slot.usage && (slot.multiple || binding.languageCode === languageCode));
}

function errorAt(index: number): string | undefined {
  const messages = ["assetId", "usage", "languageCode"].map((f) => props.fieldError(`media[${index}].${f}`)).filter(Boolean);
  return messages.length ? messages.join(" ") : undefined;
}

// Picking -----------------------------------------------------------------------------------------------

const picking = ref<{ slot: MediaSlot; languageCode: string | null } | null>(null);

function choose(slot: MediaSlot, languageCode: string | null = null) {
  picking.value = { slot, languageCode };
}

/** Which Replace button just received a file, so it can carry the focus fallback until focus has landed on it. */
const attached = ref<string | null>(null);
const replaceKey = (slot: MediaSlot, languageCode: string | null) => `${slot.usage}:${languageCode ?? "all"}`;

/** Moves focus to the Replace button of a slot after a file was chosen: the Add button it came from is gone (C2-57). */
async function focusReplace(key: string) {
  attached.value = key;
  await nextTick();
  // The picker unmounts in the same tick and returns focus to its opener; this runs after it.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const button = document.querySelector<HTMLElement>(`[data-replace="${CSS.escape(key)}"]`);
  button?.focus();
  attached.value = null;
}

function onPick(asset: Asset) {
  const target = picking.value;
  picking.value = null;
  if (!target) return;
  const { slot, languageCode } = target;
  if (!slot.multiple) {
    const existing = bindingsOf(slot, languageCode)[0];
    if (existing) {
      existing.binding.assetId = asset.id;
      void focusReplace(replaceKey(slot, languageCode));
      return;
    }
  }
  props.media.push({ assetId: asset.id, usage: slot.usage, languageCode });
  // A gallery keeps its Add button, which is the opener and takes focus back by itself.
  if (!slot.multiple) void focusReplace(replaceKey(slot, languageCode));
}

function clear(index: number) {
  props.media.splice(index, 1);
}

/** Swaps a gallery entry with its neighbour of the same slot; other slots in between keep their places. */
function move(slot: MediaSlot, position: number, delta: number) {
  const entries = bindingsOf(slot);
  const target = position + delta;
  if (target < 0 || target >= entries.length) return;
  const a = entries[position].index;
  const b = entries[target].index;
  const moved = props.media[a];
  props.media[a] = props.media[b];
  props.media[b] = moved;
}

const pickerTitle = computed(() =>
  picking.value ? `Choose an asset for ${picking.value.slot.label.toLowerCase()}${picking.value.languageCode ? ` in ${props.languages.find((l) => l.languageCode === picking.value!.languageCode)?.displayName ?? picking.value.languageCode}` : picking.value.slot.perLanguage ? " in all languages" : ""}` : "",
);
const excluded = computed(() =>
  picking.value?.slot.multiple ? bindingsOf(picking.value.slot).map(({ binding }) => binding.assetId) : [],
);

function requirement(slot: MediaSlot): string {
  return `${slot.recommended ? "Recommended" : "Optional"} · ${slot.accept.map(assetTypeLabel).join(" or ")}`;
}
</script>

<template>
  <EditorSection id="media" title="Media" :count="countText" :state="railState">
    <ul v-if="shownSlots.length" class="flex flex-col divide-y divide-border">
      <li v-for="slot in shownSlots" :key="slot.usage" class="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0" :data-slot="slot.usage">
        <p v-if="slot.hint" class="text-xs text-muted-foreground">{{ slot.hint }}</p>
        <p v-if="missingRequired(slot)" class="flex items-start gap-1.5 text-xs font-medium text-warning">
          <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ missingRequired(slot) }}
        </p>

        <!-- Ordered list -->
        <template v-if="slot.multiple">
          <div class="flex items-baseline gap-2 text-sm"><span class="font-semibold">{{ slot.label }}</span><span class="text-xs text-muted-foreground">{{ bindingsOf(slot).length ? `${bindingsOf(slot).length} in order` : requirement(slot) }}</span></div>
          <ul v-if="bindingsOf(slot).length" class="flex flex-col gap-2">
            <li v-for="({ binding, index }, position) in bindingsOf(slot)" :key="index" class="flex flex-wrap items-center gap-2">
              <AssetThumb v-if="assetById.get(binding.assetId)" :asset="assetById.get(binding.assetId)!" height="40px" class="w-14 flex-none" />
              <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ assetById.get(binding.assetId)?.internalName ?? "Unavailable asset" }}</span>
              <template v-if="!readonly">
                <Button variant="ghost" size="icon" type="button" :disabled-reason="position === 0 ? 'Already first' : undefined" :label="`Move ${slot.label} ${position + 1} up`" @click="move(slot, position, -1)"><ArrowUp aria-hidden="true" /></Button>
                <Button variant="ghost" size="icon" type="button" :disabled-reason="position === bindingsOf(slot).length - 1 ? 'Already last' : undefined" :label="`Move ${slot.label} ${position + 1} down`" @click="move(slot, position, 1)"><ArrowDown aria-hidden="true" /></Button>
                <Button variant="ghost" size="icon" type="button" class="text-destructive" :label="`Remove ${slot.label} ${position + 1}`" @click="clear(index)"><X aria-hidden="true" /></Button>
              </template>
              <p v-if="draftWarning(assetById.get(binding.assetId))" class="w-full text-xs font-medium text-warning">{{ draftWarning(assetById.get(binding.assetId)) }}</p>
              <p v-if="errorAt(index)" class="w-full text-xs font-medium text-destructive">{{ errorAt(index) }}</p>
            </li>
          </ul>
          <div v-if="!readonly"><Button variant="secondary" size="sm" class="border-dashed" type="button" @click="choose(slot)"><Plus aria-hidden="true" />Add {{ slot.accept.map(assetTypeLabel).join(" or ").toLowerCase() }}<span class="sr-only"> to {{ slot.label }}</span></Button></div>
        </template>

        <!-- Single asset -->
        <template v-else>
          <div v-for="{ binding, index } in bindingsOf(slot)" :key="index" class="flex flex-wrap items-center gap-3">
            <template v-if="assetById.get(binding.assetId)">
              <AssetThumb :asset="assetById.get(binding.assetId)!" height="48px" class="w-16 flex-none" />
              <div class="min-w-0 flex-1">
                <div class="text-xs text-muted-foreground">{{ slot.label }}</div>
                <div class="truncate text-sm font-semibold">{{ assetById.get(binding.assetId)!.internalName }}</div>
                <div class="text-xs text-muted-foreground">{{ assetMeta(assetById.get(binding.assetId)!) }}</div>
              </div>
            </template>
            <div v-else class="flex-1 text-sm text-muted-foreground">{{ slot.label }}: unavailable asset</div>
            <div class="flex flex-wrap items-center gap-1">
              <Button variant="ghost" size="sm" as-child>
                <RouterLink :to="{ name: 'asset-editor', params: { projectId, assetId: binding.assetId } }"><Pencil aria-hidden="true" />Edit asset<span class="sr-only"> for {{ slot.label }}</span></RouterLink>
              </Button>
              <Button v-if="!readonly" variant="ghost" size="sm" type="button" :data-replace="replaceKey(slot, null)" :data-focus-fallback="attached === replaceKey(slot, null) ? '' : undefined" @click="choose(slot)"><Replace aria-hidden="true" />Replace<span class="sr-only"> {{ slot.label }}</span></Button>
              <Button v-if="!readonly" variant="ghost" size="sm" class="text-destructive" type="button" @click="clear(index)"><X aria-hidden="true" />Clear<span class="sr-only"> {{ slot.label }}</span></Button>
            </div>
            <p v-if="assetById.get(binding.assetId) && missingAlternativeText(assetById.get(binding.assetId)!, defaultLanguage)" class="flex w-full items-center gap-1.5 text-xs font-medium text-warning">
              <TriangleAlert class="size-4 shrink-0" aria-hidden="true" />No alternative text
            </p>
            <p v-if="draftWarning(assetById.get(binding.assetId))" class="flex w-full items-center gap-1.5 text-xs font-medium text-warning">
              <TriangleAlert class="size-4 shrink-0" aria-hidden="true" />{{ draftWarning(assetById.get(binding.assetId)) }}
            </p>
            <p v-if="errorAt(index)" class="w-full text-xs font-medium text-destructive">{{ errorAt(index) }}</p>
          </div>
        </template>
      </li>
    </ul>

    <div v-if="emptySlots.length && !readonly" class="flex flex-wrap items-center gap-2" role="group" aria-label="Add media">
      <span class="text-sm font-semibold text-ink-2" aria-hidden="true">Add</span>
      <Button v-for="slot in emptySlots" :key="slot.usage" variant="secondary" size="sm" class="border-dashed" type="button" :title="slot.hint" :data-slot="slot.usage" @click="choose(slot)">
        <Plus aria-hidden="true" /><span class="sr-only">Add </span>{{ slot.label }}<span v-if="slot.recommended" class="sr-only"> (recommended)</span>
      </Button>
    </div>
    <p v-else-if="emptySlots.length && !shownSlots.length && !languageSlots.length" class="text-sm text-muted-foreground">No media added.</p>

    <!-- One asset per language: one visible group, a file per language and one for all languages (C2-66) -->
    <div
      v-for="slot in languageSlots"
      :key="slot.usage"
      role="group"
      :aria-labelledby="`slot-${slot.usage}-label`"
      class="flex flex-col gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5"
      :data-slot="slot.usage"
    >
      <div class="flex flex-wrap items-baseline gap-x-2 text-sm">
        <Music class="size-4 self-center text-muted-foreground" aria-hidden="true" />
        <span :id="`slot-${slot.usage}-label`" class="font-semibold">{{ slot.label }}</span>
        <span class="text-xs text-muted-foreground">{{ languagesFilled(slot) ? `${languagesFilled(slot)} of ${languageRows.length} with a file` : "One file per language" }}</span>
      </div>
      <template v-for="l in languageRows" :key="l.languageCode ?? 'all'">
        <template v-for="{ binding, index } in bindingsOf(slot, l.languageCode)" :key="index">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" :data-language-row="l.languageCode ?? 'all'">
            <span class="w-28 flex-none text-xs text-muted-foreground">{{ l.displayName }}</span>
            <span class="min-w-0 flex-1 truncate font-semibold">{{ assetById.get(binding.assetId)?.internalName ?? "Unavailable asset" }}</span>
            <div v-if="!readonly" class="flex items-center gap-1">
              <Button variant="ghost" size="sm" type="button" :data-replace="replaceKey(slot, l.languageCode)" :data-focus-fallback="attached === replaceKey(slot, l.languageCode) ? '' : undefined" @click="choose(slot, l.languageCode)"><Replace aria-hidden="true" />Replace<span class="sr-only"> {{ slot.label }} in {{ l.displayName }}</span></Button>
              <Button variant="ghost" size="sm" class="text-destructive" type="button" @click="clear(index)"><X aria-hidden="true" />Clear<span class="sr-only"> {{ slot.label }} in {{ l.displayName }}</span></Button>
            </div>
            <p v-if="draftWarning(assetById.get(binding.assetId))" class="w-full text-xs font-medium text-warning">{{ draftWarning(assetById.get(binding.assetId)) }}</p>
            <p v-if="errorAt(index)" class="w-full text-xs font-medium text-destructive">{{ errorAt(index) }}</p>
          </div>
        </template>
      </template>
      <div v-if="!readonly && languageRows.some((l) => !bindingsOf(slot, l.languageCode).length)" class="flex flex-wrap items-center gap-2">
        <template v-for="l in languageRows" :key="l.languageCode ?? 'all'">
          <Button v-if="!bindingsOf(slot, l.languageCode).length" variant="secondary" size="sm" class="border-dashed" type="button" @click="choose(slot, l.languageCode)">
            <Plus aria-hidden="true" />{{ l.displayName }}<span class="sr-only">: choose {{ lower(slot.label) }}</span>
          </Button>
        </template>
      </div>
      <p v-else-if="readonly && !languagesFilled(slot)" class="text-sm text-muted-foreground">No file.</p>
      <p class="m-0 text-xs text-muted-foreground">“All languages” plays when a language has no file of its own.</p>
    </div>

    <AssetPickerDialog
      v-if="picking"
      :project-id="projectId"
      :title="pickerTitle"
      :assets="assets"
      :accept="picking.slot.accept"
      :exclude-ids="excluded"
      :used-ids="media.map((m) => m.assetId)"
      :default-language="defaultLanguage"
      @close="picking = null"
      @pick="onPick"
      @uploaded="emit('uploaded', $event)"
    />
  </EditorSection>
</template>
