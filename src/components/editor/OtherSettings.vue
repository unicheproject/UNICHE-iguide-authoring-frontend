<script setup lang="ts">
/**
 * The language-independent cards of an editor (placement, media, how visitors reach it, details) while a language
 * other than the default is being translated (D-079, C2-55): they hold nothing a translator changes, so they fold into
 * one collapsed "Other settings (all languages)" disclosure under the texts instead of staying editable beside a
 * language tab. In the default language the cards are shown as they always were. The cards stay mounted while folded
 * (so the page rail, Save validation and "Used in" links still find them) and the disclosure opens by itself when
 * something asks for one of them: an error summary link, a hash link, or the rail.
 */
import { ChevronDown } from "lucide-vue-next";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { REVEAL_FIELD_EVENT } from "@/workspace/useResourceEditor";

const props = defineProps<{
  /** True while a non-default language is active: the cards fold. */
  folded: boolean;
  /** The ids of the sections inside, so a rail or hash link to one of them opens the disclosure. */
  sectionIds: string[];
  /** What is inside, in a line: "Placement, Media, How visitors reach it, Details". */
  summary: string;
}>();

const open = ref(false);
const route = useRoute();
const hidden = () => props.folded && !open.value;

function reveal() {
  if (props.folded) open.value = true;
}
/** A field inside a folded section was asked to take focus: show the cards first. */
function onReveal(event: Event) {
  const path = (event as CustomEvent<{ path: string }>).detail?.path ?? "";
  if (path.startsWith("translations.")) return;
  reveal();
}
/** A click on a rail or in-page link to one of the sections inside opens the disclosure before the link scrolls. */
function onClick(event: MouseEvent) {
  const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  const id = link?.getAttribute("href")?.slice(1);
  if (id && props.sectionIds.includes(id) && hidden()) {
    reveal();
    void nextTick(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }
}
onMounted(() => {
  window.addEventListener(REVEAL_FIELD_EVENT, onReveal);
  document.addEventListener("click", onClick, true);
});
onBeforeUnmount(() => {
  window.removeEventListener(REVEAL_FIELD_EVENT, onReveal);
  document.removeEventListener("click", onClick, true);
});
watch(
  () => route.hash,
  (hash) => {
    if (props.sectionIds.includes(hash.slice(1))) reveal();
  },
  { immediate: true },
);
// Back in the default language the cards are plain again.
watch(
  () => props.folded,
  (folded) => {
    if (!folded) open.value = false;
  },
);
</script>

<template>
  <div class="flex flex-col gap-4" :data-other-settings="folded ? '' : undefined">
    <h2 v-if="folded" class="m-0 text-base font-bold">
      <button
        type="button"
        class="flex min-h-control w-full items-center gap-3 rounded-lg border bg-card px-6 py-3 text-left shadow-1"
        :aria-expanded="open"
        aria-controls="other-settings-body"
        @click="open = !open"
      >
        Other settings (all languages)
        <span class="text-sm font-medium text-muted-foreground">{{ summary }}</span>
        <ChevronDown class="ml-auto size-5 shrink-0 text-muted-foreground transition-transform" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
      </button>
    </h2>
    <div v-show="!folded || open" id="other-settings-body" class="flex flex-col gap-4"><slot /></div>
  </div>
</template>
