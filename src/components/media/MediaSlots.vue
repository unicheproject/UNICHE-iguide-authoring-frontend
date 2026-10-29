<script setup lang="ts">
/**
 * The media slots of a Resource, as in the CMS mockup: one card per slot. A single slot holds one Asset; a
 * `multiple` slot is an ordered list; a `perLanguage` slot holds one Asset per Project language, such as an
 * audio narration, plus an "All languages" one without a language that visitors get when their language has
 * none (iGuide spec 03 section 4, 11 lines 169-171). A slot that `requires` another, such as a 3D model and its
 * poster image (03 lines 521-531), warns while the other is empty. Edits the given `media` list in place, so they count as
 * unsaved changes of the Resource and are saved with it.
 */
import { computed, ref } from "vue";
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

const props = defineProps<{
  projectId: string;
  slots: MediaSlot[];
  media: MediaBinding[];
  assets: Asset[];
  languages: ProjectLanguage[];
  defaultLanguage: string | null;
  readonly: boolean;
  fieldError: (path: string) => string | undefined;
}>();
const emit = defineEmits<{ uploaded: [asset: Asset] }>();

const assetById = computed(() => new Map(props.assets.map((a) => [a.id, a])));

/** The rows of a per-language slot: "All languages" first, then each Project language. */
const languageRows = computed(() => [
  { languageCode: null as string | null, displayName: "All languages" },
  ...props.languages.map((l) => ({ languageCode: l.languageCode as string | null, displayName: l.displayName })),
]);

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

function onPick(asset: Asset) {
  const target = picking.value;
  picking.value = null;
  if (!target) return;
  const { slot, languageCode } = target;
  if (!slot.multiple) {
    const existing = bindingsOf(slot, languageCode)[0];
    if (existing) {
      existing.binding.assetId = asset.id;
      return;
    }
  }
  props.media.push({ assetId: asset.id, usage: slot.usage, languageCode });
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

const pickerTitle = computed(() => (picking.value ? `Choose an asset for ${picking.value.slot.label.toLowerCase()}` : ""));
const excluded = computed(() =>
  picking.value?.slot.multiple ? bindingsOf(picking.value.slot).map(({ binding }) => binding.assetId) : [],
);

function requirement(slot: MediaSlot): string {
  return `${slot.recommended ? "Recommended" : "Optional"} · ${slot.accept.map(assetTypeLabel).join(" or ")}`;
}
</script>

<template>
  <section class="rounded-lg border bg-card px-[22px] py-5">
    <h2 class="mb-4 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Media</h2>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
      <div v-for="slot in slots" :key="slot.usage" class="overflow-hidden rounded-lg border">
        <div class="border-b bg-muted px-3 py-[9px] text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          {{ slot.label }}
        </div>
        <p v-if="slot.hint" class="border-b border-gray-100 px-3 py-2 text-[11px] text-muted-foreground">{{ slot.hint }}</p>
        <p v-if="missingRequired(slot)" class="border-b border-gray-100 px-3 py-2 text-[11px] font-semibold text-[#9a6200]">⚠ {{ missingRequired(slot) }}</p>

        <!-- One asset per language -->
        <ul v-if="slot.perLanguage" class="flex flex-col">
          <li v-for="l in languageRows" :key="l.languageCode ?? 'all'" class="border-b border-gray-100 px-3 py-2.5 last:border-b-0">
            <template v-for="{ binding, index } in bindingsOf(slot, l.languageCode)" :key="index">
              <div class="flex items-center gap-2 text-xs">
                <span class="w-16 flex-none text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{{ l.displayName }}</span>
                <span class="min-w-0 flex-1 truncate font-bold">{{ assetById.get(binding.assetId)?.internalName ?? "Unavailable asset" }}</span>
                <button v-if="!readonly" type="button" class="text-[11px] font-bold text-destructive" :aria-label="`Clear ${slot.label} in ${l.displayName}`" @click="clear(index)">Clear</button>
              </div>
              <p v-if="errorAt(index)" class="mt-1 text-[11px] font-semibold text-destructive">⚠ {{ errorAt(index) }}</p>
            </template>
            <div v-if="!bindingsOf(slot, l.languageCode).length" class="flex items-center gap-2 text-xs">
              <span class="w-16 flex-none text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{{ l.displayName }}</span>
              <span class="flex-1 text-muted-foreground">—</span>
              <button v-if="!readonly" type="button" class="text-[11px] font-bold text-primary" @click="choose(slot, l.languageCode)">Choose</button>
            </div>
          </li>
          <li class="px-3 py-2 text-[11px] text-muted-foreground">"All languages" plays when a language has none of its own.</li>
        </ul>

        <!-- Ordered list -->
        <div v-else-if="slot.multiple" class="px-3 py-3">
          <ul v-if="bindingsOf(slot).length" class="mb-2.5 flex flex-col gap-2">
            <li v-for="({ binding, index }, position) in bindingsOf(slot)" :key="index" class="flex items-center gap-2">
              <AssetThumb v-if="assetById.get(binding.assetId)" :asset="assetById.get(binding.assetId)!" height="36px" class="w-12 flex-none" />
              <span class="min-w-0 flex-1 truncate text-xs font-bold">{{ assetById.get(binding.assetId)?.internalName ?? "Unavailable asset" }}</span>
              <template v-if="!readonly">
                <button type="button" class="px-0.5 text-xs text-muted-foreground disabled:opacity-30" :disabled="position === 0" :aria-label="`Move ${slot.label} ${position + 1} up`" @click="move(slot, position, -1)">↑</button>
                <button type="button" class="px-0.5 text-xs text-muted-foreground disabled:opacity-30" :disabled="position === bindingsOf(slot).length - 1" :aria-label="`Move ${slot.label} ${position + 1} down`" @click="move(slot, position, 1)">↓</button>
                <button type="button" class="px-0.5 text-xs text-destructive" :aria-label="`Remove ${slot.label} ${position + 1}`" @click="clear(index)">✕</button>
              </template>
              <span v-if="errorAt(index)" class="sr-only">{{ errorAt(index) }}</span>
            </li>
          </ul>
          <p v-for="{ index } in bindingsOf(slot).filter((e) => errorAt(e.index))" :key="`e${index}`" class="mb-1.5 text-[11px] font-semibold text-destructive">
            ⚠ {{ errorAt(index) }}
          </p>
          <span v-if="!bindingsOf(slot).length" class="mb-2 block text-[11px] text-muted-foreground">{{ requirement(slot) }}</span>
          <button v-if="!readonly" type="button" class="w-full rounded-full border bg-muted px-3.5 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700" @click="choose(slot)">
            Add {{ slot.accept.map(assetTypeLabel).join(" or ").toLowerCase() }}
          </button>
        </div>

        <!-- Single asset -->
        <template v-else>
          <div v-for="{ binding, index } in bindingsOf(slot)" :key="index" class="p-3">
            <template v-if="assetById.get(binding.assetId)">
              <AssetThumb :asset="assetById.get(binding.assetId)!" class="mb-[9px]" />
              <div class="break-words text-xs font-bold">{{ assetById.get(binding.assetId)!.internalName }}</div>
              <div class="text-[11px] text-muted-foreground">{{ assetMeta(assetById.get(binding.assetId)!) }}</div>
              <div v-if="missingAlternativeText(assetById.get(binding.assetId)!, defaultLanguage)" class="mt-[7px] text-[11px] font-semibold text-destructive">
                ⚠ No alternative text
              </div>
            </template>
            <div v-else class="text-xs text-muted-foreground">Unavailable asset</div>
            <p v-if="errorAt(index)" class="mt-1.5 text-[11px] font-semibold text-destructive">⚠ {{ errorAt(index) }}</p>
            <div class="mt-[9px] flex gap-2.5">
              <RouterLink
                :to="{ name: 'asset-editor', params: { projectId, assetId: binding.assetId } }"
                class="text-[11px] font-bold text-primary no-underline"
              >
                Edit asset
              </RouterLink>
              <button v-if="!readonly" type="button" class="text-[11px] font-bold text-primary" @click="choose(slot)">Replace</button>
              <button v-if="!readonly" type="button" class="text-[11px] font-bold text-destructive" @click="clear(index)">Clear</button>
            </div>
          </div>
          <div v-if="!bindingsOf(slot).length" class="p-3">
            <span class="mb-2 block text-[11px]" :class="slot.recommended ? 'text-[#9a6200]' : 'text-muted-foreground'">{{ requirement(slot) }}</span>
            <button
              v-if="!readonly"
              type="button"
              class="w-full rounded-full border bg-muted px-3.5 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700"
              @click="choose(slot)"
            >
              Choose asset
            </button>
          </div>
        </template>
      </div>
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
  </section>
</template>
