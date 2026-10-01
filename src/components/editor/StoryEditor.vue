<script setup lang="ts">
/**
 * The body of a Guide in one language, as an ordered list of blocks: paragraphs, headings (level 2 or 3),
 * and images from the media library. Edits the given `blocks` list in place, so the changes count as
 * unsaved changes of the Guide. Images are saved as INLINE media of the Guide by the backend.
 */
import { computed, nextTick, ref } from "vue";
import AssetPickerDialog from "@/components/media/AssetPickerDialog.vue";
import AssetThumb from "@/components/media/AssetThumb.vue";
import { missingAlternativeText, type Asset } from "@/platform/assets";
import type { ProjectLanguage } from "@/platform/languages";
import type { StoryBlock } from "@/platform/guides";
import { newBlockKey, type StoryBlockForm } from "./StoryEditor";

const props = defineProps<{
  projectId: string;
  blocks: StoryBlockForm[];
  language: ProjectLanguage;
  assets: Asset[];
  readonly: boolean;
  /** Error of the document at `path`, and of its blocks by their path. */
  fieldError: (path: string) => string | undefined;
  /** Where the document sits in the request; a Guide body unless given. */
  path?: string;
  /** Card heading; "Story · language" unless given. */
  heading?: string;
  /** Shown while there are no blocks. */
  emptyText?: string;
}>();
const emit = defineEmits<{ uploaded: [asset: Asset] }>();

const assetById = computed(() => new Map(props.assets.map((a) => [a.id, a])));
const basePath = computed(() => props.path ?? `translations.${props.language.languageCode}.body`);

function blockError(index: number): string | undefined {
  const at = `${basePath.value}.blocks[${index}]`;
  return ["", ".text", ".level", ".assetId"].map((s) => props.fieldError(at + s)).filter(Boolean).join(" ") || undefined;
}

async function add(type: StoryBlock["type"]) {
  if (type === "image") {
    picking.value = { index: null };
    return;
  }
  const key = newBlockKey();
  props.blocks.push(type === "heading" ? { key, type, level: 2, text: "" } : { key, type, text: "" });
  await nextTick();
  document.getElementById(`block-${key}`)?.focus();
}

/** Moves a block and keeps keyboard focus on the same button, so repeated presses keep moving it. */
function move(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= props.blocks.length) return;
  const [block] = props.blocks.splice(index, 1);
  props.blocks.splice(target, 0, block);
  void nextTick(() => document.getElementById(`block-move-${block.key}-${delta < 0 ? "up" : "down"}`)?.focus());
}

function remove(index: number) {
  props.blocks.splice(index, 1);
}

// Images ------------------------------------------------------------------------------------------------

/** Null index adds a new image block at the end; a number replaces that block's image. */
const picking = ref<{ index: number | null } | null>(null);

function onPick(asset: Asset) {
  const target = picking.value;
  picking.value = null;
  if (!target) return;
  const block = target.index === null ? undefined : props.blocks[target.index];
  if (block?.type === "image") block.assetId = asset.id;
  else props.blocks.push({ key: newBlockKey(), type: "image", assetId: asset.id });
}

const words = computed(() =>
  props.blocks.reduce((n, b) => n + (b.type === "image" ? 0 : b.text.trim().split(/\s+/).filter(Boolean).length), 0),
);
</script>

<template>
  <section class="overflow-hidden rounded-lg border bg-card">
    <div class="flex items-center gap-2.5 border-b px-5 py-3.5">
      <h2 class="flex-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
        {{ heading ?? `Story · ${language.displayName}` }}
      </h2>
      <span class="text-[11px] text-muted-foreground">{{ words === 1 ? "1 word" : `${words} words` }}</span>
    </div>

    <p v-if="fieldError(basePath)" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-destructive">
      ⚠ {{ fieldError(basePath) }}
    </p>

    <ol class="flex flex-col">
      <li v-for="(block, index) in blocks" :key="block.key" class="group border-b border-gray-100 px-5 py-3">
        <div class="mb-1.5 flex items-center gap-2">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
            {{ block.type === "paragraph" ? "Paragraph" : block.type === "heading" ? "Heading" : "Image" }}
          </span>
          <div v-if="block.type === 'heading'" class="flex gap-1" role="group" :aria-label="`Level of heading ${index + 1}`">
            <button
              v-for="level in ([2, 3] as const)"
              :key="level"
              type="button"
              :disabled="readonly"
              :aria-pressed="block.level === level"
              class="rounded-full border px-2 py-px text-[10px] font-bold disabled:cursor-default"
              :class="block.level === level ? 'border-primary bg-primary text-white' : 'bg-card text-gray-700'"
              @click="block.level = level"
            >
              H{{ level }}
            </button>
          </div>
          <span class="flex-1"></span>
          <template v-if="!readonly">
            <button
              :id="`block-move-${block.key}-up`"
              type="button"
              class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
              :disabled="index === 0"
              :aria-label="`Move block ${index + 1} up`"
              @click="move(index, -1)"
            >
              ↑
            </button>
            <button
              :id="`block-move-${block.key}-down`"
              type="button"
              class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
              :disabled="index === blocks.length - 1"
              :aria-label="`Move block ${index + 1} down`"
              @click="move(index, 1)"
            >
              ↓
            </button>
            <button type="button" class="px-1 text-[13px] text-destructive" :aria-label="`Remove block ${index + 1}`" @click="remove(index)">✕</button>
          </template>
        </div>

        <textarea
          v-if="block.type === 'paragraph'"
          :id="`block-${block.key}`"
          v-model="block.text"
          :readonly="readonly"
          :aria-label="`Paragraph ${index + 1}`"
          :lang="language.languageCode"
          :dir="language.direction.toLowerCase()"
          class="field-input min-h-[96px] resize-y leading-relaxed"
          :class="{ invalid: blockError(index) }"
        ></textarea>
        <input
          v-else-if="block.type === 'heading'"
          :id="`block-${block.key}`"
          v-model="block.text"
          :readonly="readonly"
          :aria-label="`Heading ${index + 1}`"
          :lang="language.languageCode"
          :dir="language.direction.toLowerCase()"
          class="field-input font-bold"
          :class="[block.level === 2 ? 'text-[17px]' : 'text-[15px]', { invalid: blockError(index) }]"
        />
        <div v-else class="flex items-center gap-3">
          <AssetThumb v-if="assetById.get(block.assetId)" :asset="assetById.get(block.assetId)!" height="72px" class="w-28 flex-none" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-xs font-bold">{{ assetById.get(block.assetId)?.internalName ?? "Unavailable asset" }}</div>
            <div
              v-if="assetById.get(block.assetId) && missingAlternativeText(assetById.get(block.assetId)!, language.languageCode)"
              class="mt-1 text-[11px] font-semibold text-destructive"
            >
              ⚠ No alternative text in {{ language.displayName }}
            </div>
            <div class="mt-1.5 flex gap-2.5">
              <RouterLink :to="{ name: 'asset-editor', params: { projectId, assetId: block.assetId } }" class="text-[11px] font-bold text-primary no-underline">
                Edit asset
              </RouterLink>
              <button v-if="!readonly" type="button" class="text-[11px] font-bold text-primary" @click="picking = { index }">Replace</button>
            </div>
          </div>
        </div>
        <p v-if="blockError(index)" class="mt-1.5 text-xs font-semibold text-destructive">⚠ {{ blockError(index) }}</p>
      </li>
    </ol>

    <p v-if="!blocks.length" class="px-5 py-4 text-[13px] text-muted-foreground">
      {{ emptyText ?? `No story in ${language.displayName} yet. Start with a paragraph; the default language needs one before the guide can be activated.` }}
    </p>

    <div v-if="!readonly" class="flex flex-wrap gap-2 px-5 py-3.5">
      <button type="button" class="add-block" @click="add('paragraph')">+ Paragraph</button>
      <button type="button" class="add-block" @click="add('heading')">+ Heading</button>
      <button type="button" class="add-block" @click="add('image')">+ Image</button>
    </div>

    <AssetPickerDialog
      v-if="picking"
      :project-id="projectId"
      title="Choose an image for the story"
      :assets="assets"
      :accept="['IMAGE']"
      :used-ids="blocks.flatMap((b) => (b.type === 'image' ? [b.assetId] : []))"
      :default-language="language.languageCode"
      @close="picking = null"
      @pick="onPick"
      @uploaded="emit('uploaded', $event)"
    />
  </section>
</template>

<style scoped>
.add-block {
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #f5f5f7;
  padding: 7px 14px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #374151;
}
</style>
