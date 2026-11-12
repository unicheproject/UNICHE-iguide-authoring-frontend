<script setup lang="ts">
/**
 * The detail screen of one Resource in the stand-in visitor app (DECISIONS.md D-014): hero, title, and the
 * model's blocks in order, in the Project's theme (`workspace/projectTheme.ts`). Texts missing in the previewed
 * language are outlined in red. List items with a
 * target emit `open`, so the preview app can navigate.
 */
import { computed } from "vue";
import GeoMapCanvas from "@/components/map/GeoMapCanvas.vue";
import type { PreviewModel, PreviewTarget, PreviewText } from "@/workspace/preview";
import { previewStrings } from "./strings";

const props = defineProps<{ model: PreviewModel; wide: boolean; navigable?: boolean }>();
const emit = defineEmits<{ open: [target: PreviewTarget] }>();

const languageName = computed(() => props.model.language?.displayName ?? "this language");
/** Visitor-facing words in the previewed language; the "Missing in" notes are for the author and stay in English. */
const t = computed(() => previewStrings(props.model.language?.languageCode));
const missingNote = (value: PreviewText) =>
  value?.missing ? `Missing in ${languageName.value}${props.model.fallbackName ? `; shows ${props.model.fallbackName}` : ""}` : "";
const hero = computed(() => props.model.blocks.find((b) => b.type === "hero"));
</script>

<template>
  <div
    :class="wide ? 'mx-auto w-full max-w-[48em] px-[calc(2em*var(--t-space))] py-[calc(1.6em*var(--t-space))]' : 'p-[calc(1.1em*var(--t-space))]'"
    class="flex flex-col gap-[calc(1em*var(--t-space))]"
  >
    <img
      v-if="hero && hero.type === 'hero'"
      :src="hero.image.url"
      alt=""
      class="w-full rounded-[var(--t-radius)] object-cover"
      :class="wide ? 'max-h-[26em]' : 'max-h-[15em]'"
    />

    <div>
      <h1 v-if="model.title" class="text-[1.7em] font-extrabold leading-tight [font-family:var(--t-heading)]" :class="{ missing: model.title.missing }">
        {{ model.title.text }}
      </h1>
      <h1 v-else class="missing text-[1.7em] font-extrabold leading-tight text-[#b91c1c]">No title</h1>
      <span v-if="model.title?.missing" class="missing-label">{{ missingNote(model.title) }}</span>
    </div>

    <template v-for="(block, i) in model.blocks" :key="i">
      <div v-if="block.type === 'text'">
        <h2 v-if="block.heading" class="mb-[0.3em] text-[0.8em] font-extrabold uppercase tracking-[0.08em] text-[var(--t-accent)]">
          {{ block.heading }}
        </h2>
        <p class="whitespace-pre-line leading-relaxed" :class="{ missing: block.value?.missing, 'text-[1.1em]': block.label === 'Summary' }">
          {{ block.value?.text }}
        </p>
        <span v-if="block.value?.missing" class="missing-label">{{ block.label }} · {{ missingNote(block.value) }}</span>
      </div>

      <dl v-else-if="block.type === 'facts' && block.items.length" class="flex flex-wrap gap-[0.5em]">
        <div v-for="f in block.items" :key="f.label + f.value" class="rounded-full bg-[var(--t-tint)] px-[0.8em] py-[0.25em] text-[0.8em]">
          <dt v-if="f.label" class="inline font-semibold text-[var(--t-accent)]">{{ f.label }}&nbsp;</dt>
          <dd class="inline">{{ f.value }}</dd>
        </div>
      </dl>

      <div v-else-if="block.type === 'list' && block.items.length">
        <h2 class="mb-[0.4em] text-[0.8em] font-extrabold uppercase tracking-[0.08em] text-[var(--t-accent)]">{{ block.heading }}</h2>
        <ol class="flex flex-col gap-[0.4em]">
          <li v-for="(item, n) in block.items" :key="n">
            <component
              :is="navigable && item.target ? 'button' : 'div'"
              :type="navigable && item.target ? 'button' : undefined"
              class="flex w-full gap-[0.7em] rounded-[var(--t-radius)] border border-[var(--t-border)] px-[0.8em] py-[0.6em] text-start"
              :class="[{ 'opacity-50': item.muted }, navigable && item.target ? 'hover:border-[var(--t-primary)]' : '']"
              @click="navigable && item.target && emit('open', item.target)"
            >
              <span class="font-bold text-[var(--t-accent)]">{{ n + 1 }}</span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold">{{ item.title }}</span>
                <span v-if="item.subtitle" class="block text-[0.85em] text-[var(--t-muted)]">{{ item.subtitle }}</span>
              </span>
              <span v-if="navigable && item.target" class="text-[var(--t-accent)]" aria-hidden="true">›</span>
            </component>
          </li>
        </ol>
      </div>

      <div v-else-if="block.type === 'story'" class="flex flex-col gap-[0.8em]" :class="{ missing: block.missing }">
        <span v-if="block.missing" class="missing-label">Story · Missing in {{ languageName }}{{ model.fallbackName ? `; shows ${model.fallbackName}` : "" }}</span>
        <template v-for="(node, n) in block.nodes" :key="n">
          <h3 v-if="node.type === 'heading' && node.level === 3" class="text-[1.05em] font-bold">{{ node.text }}</h3>
          <h2 v-else-if="node.type === 'heading'" class="text-[1.2em] font-bold">{{ node.text }}</h2>
          <p v-else-if="node.type === 'paragraph'" class="whitespace-pre-line leading-relaxed">{{ node.text }}</p>
          <img v-else-if="node.image" :src="node.image.url" :alt="node.image.alt" class="w-full rounded-[var(--t-radius)]" />
          <div v-else class="missing rounded-[var(--t-radius)] p-[1em] text-[0.8em] text-[#b91c1c]">Unavailable image</div>
        </template>
      </div>

      <div v-else-if="block.type === 'reference'">
        <component
          :is="navigable && block.item.target ? 'button' : 'div'"
          :type="navigable && block.item.target ? 'button' : undefined"
          class="flex w-full gap-[0.7em] rounded-[var(--t-radius)] border border-[var(--t-border)] px-[0.8em] py-[0.6em] text-start"
          :class="[{ 'opacity-50': block.item.muted }, navigable && block.item.target ? 'hover:border-[var(--t-primary)]' : '']"
          @click="navigable && block.item.target && emit('open', block.item.target)"
        >
          <span class="min-w-0 flex-1">
            <span class="block font-semibold">{{ block.item.title }}</span>
            <span v-if="block.item.subtitle" class="block text-[0.85em] text-[var(--t-muted)]" :class="{ missing: block.captionMissing }">{{ block.item.subtitle }}</span>
          </span>
          <span v-if="navigable && block.item.target" class="text-[var(--t-accent)]" aria-hidden="true">›</span>
        </component>
        <span v-if="block.captionMissing" class="missing-label">Caption · Missing in {{ languageName }}{{ model.fallbackName ? `; shows ${model.fallbackName}` : "" }}</span>
      </div>

      <div v-else-if="block.type === 'gallery'" class="grid gap-[0.4em]" :class="wide ? 'grid-cols-4' : 'grid-cols-3'">
        <img v-for="(img, n) in block.images" :key="n" :src="img.url" :alt="img.alt" class="aspect-square w-full rounded-[calc(var(--t-radius)*0.7)] object-cover" />
      </div>

      <div v-else-if="block.type === 'audio' || block.type === 'video'">
        <h2 class="mb-[0.3em] text-[0.8em] font-extrabold uppercase tracking-[0.08em] text-[var(--t-accent)]">{{ block.heading }}</h2>
        <div class="flex items-center gap-[0.6em] rounded-[var(--t-radius)] bg-[var(--t-tint)] px-[0.8em] py-[0.6em] text-[0.9em]">
          <span class="text-[var(--t-accent)]">▶</span> {{ block.type === "audio" ? t.play : t.playVideo }}
        </div>
      </div>

      <div v-else-if="block.type === 'link'">
        <span class="inline-block rounded-[var(--t-radius)] bg-[var(--t-primary)] px-[1.1em] py-[0.5em] text-[0.85em] font-bold uppercase tracking-[0.06em] text-[var(--t-on-primary)]">
          {{ block.label }}
        </span>
      </div>

      <div v-else-if="block.type === 'map'" class="pointer-events-none overflow-hidden rounded-[var(--t-radius)]">
        <GeoMapCanvas :view="block.view" :bounds="block.bounds" :markers="block.markers" limit-to-bounds fit-to-bounds :height="wide ? '22em' : '14em'" label="Map" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.missing {
  outline: 2px dashed #dc2626;
  outline-offset: 2px;
}
.missing-label {
  display: inline-block;
  margin-top: 0.3em;
  font-size: 0.7em;
  font-weight: 700;
  color: #b91c1c;
}
</style>
