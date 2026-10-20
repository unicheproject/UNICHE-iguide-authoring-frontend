<script setup lang="ts">
/*
 * The stand-in visitor app of Visitor app → Preview (`12` §3 Preview; DECISIONS.md D-015): a shell with a
 * default menu, Home, a list per kind, search, and the detail screens of `ResourceContent`, navigated on a
 * stack with Back. Triggers arrive through `fire`: a QR code opens its target, a beacon or geo-proximity
 * area only suggests it (`03` §14, `13` §7). Drawn in the default theme until the runtime exists.
 */
import { computed, ref, watch } from "vue";
import type { Trigger } from "@/platform/triggers";
import type { PreviewData } from "@/workspace/previewData";
import { cardImage, modelFor, summaryOf, titleMissing, titleOf, type PreviewContext } from "@/workspace/previewModels";
import type { PreviewTarget } from "@/workspace/preview";
import ResourceContent from "./ResourceContent.vue";
import type { Surface } from "./surfaces";

const props = defineProps<{
  data: PreviewData;
  language: string | null;
  defaultLanguage: string | null;
  surface: Surface;
  appName: string;
}>();

type Kind = PreviewTarget["type"];
type Screen =
  | { kind: "home" }
  | { kind: "list"; type: Kind }
  | { kind: "detail"; target: PreviewTarget; note?: string }
  | { kind: "search" };

const KINDS: { type: Kind; label: string }[] = [
  { type: "PLACE", label: "Places" },
  { type: "POI", label: "Points of interest" },
  { type: "ROUTE", label: "Routes" },
  { type: "GUIDE", label: "Guides" },
  { type: "EVENT", label: "Events" },
];

const stack = ref<Screen[]>([{ kind: "home" }]);
const screen = computed(() => stack.value[stack.value.length - 1]);
const suggestion = ref<{ target: PreviewTarget; text: string } | null>(null);
const query = ref("");
const scroller = ref<HTMLElement | null>(null);

const ctx = computed<PreviewContext>(() => ({ data: props.data, language: props.language, defaultLanguage: props.defaultLanguage }));
const wide = computed(() => props.surface !== "MOBILE");
const mobile = computed(() => props.surface === "MOBILE");

function go(next: Screen, replace = false) {
  stack.value = replace ? [{ kind: "home" }, ...(next.kind === "home" ? [] : [next])] : [...stack.value, next];
  scroller.value?.scrollTo({ top: 0 });
}
function back() {
  if (stack.value.length > 1) stack.value = stack.value.slice(0, -1);
}
const open = (target: PreviewTarget, note?: string) => go({ kind: "detail", target, note });

/** Resources of one kind in their order, featured ones first on Home. */
function idsOf(type: Kind): string[] {
  const d = props.data;
  const list: { id: string; featured: boolean; sortOrder: number }[] =
    type === "PLACE" ? d.places : type === "POI" ? d.pois : type === "ROUTE" ? d.routes : type === "GUIDE" ? d.guides : d.events;
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder).map((r) => r.id);
}
const featured = computed(() => {
  const d = props.data;
  const pick = (type: Kind, list: { id: string; featured: boolean }[]) => list.filter((r) => r.featured).map((r) => ({ type, id: r.id }));
  return [...pick("POI", d.pois), ...pick("ROUTE", d.routes), ...pick("GUIDE", d.guides), ...pick("EVENT", d.events), ...pick("PLACE", d.places)];
});

const card = (target: PreviewTarget) => ({
  target,
  title: titleOf(ctx.value, target),
  titleMissing: titleMissing(ctx.value, target),
  summary: summaryOf(ctx.value, target),
  image: cardImage(ctx.value, target),
});

const detail = computed(() => (screen.value.kind === "detail" ? modelFor(ctx.value, screen.value.target) : null));

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return KINDS.flatMap(({ type }) => idsOf(type).map((id) => ({ type, id })))
    .filter((t) => {
      const poi = t.type === "POI" ? props.data.pois.find((p) => p.id === t.id) : undefined;
      return [titleOf(ctx.value, t), summaryOf(ctx.value, t)?.text ?? "", poi?.code ?? ""].some((s) => s.toLowerCase().includes(q));
    })
    .map(card);
});

const screenTitle = computed(() => {
  const s = screen.value;
  if (s.kind === "list") return KINDS.find((k) => k.type === s.type)!.label;
  if (s.kind === "search") return "Search";
  if (s.kind === "detail") return detail.value?.kindLabel ?? "";
  return props.appName;
});

/** A trigger reaching the app, as the runtime's trigger handler would receive it (`12` §3 Preview). */
function fire(trigger: Trigger) {
  const target: PreviewTarget = { type: "POI", id: trigger.targetResourceId };
  if (!props.data.pois.some((p) => p.id === target.id)) {
    suggestion.value = { target, text: "The trigger's point of interest is not shown in this mode." };
    return;
  }
  if (trigger.triggerType === "QR_CODE") {
    suggestion.value = null;
    open(target, `Opened by QR code ${trigger.code}`);
  } else {
    suggestion.value = { target, text: `Nearby: ${titleOf(ctx.value, target)}` };
  }
}
defineExpose({ fire, home: () => go({ kind: "home" }, true) });

// A detail whose Resource left the mode (Live hides drafts) falls back to Home.
watch(
  () => props.data,
  () => {
    if (screen.value.kind === "detail" && !detail.value) go({ kind: "home" }, true);
  },
);
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Shell: a default menu stands in for the PRIMARY Navigation, which does not exist yet. -->
    <header class="flex items-center gap-[1em] bg-[#4c1d8b] px-[1.4em] py-[0.9em] text-white">
      <button v-if="stack.length > 1" type="button" class="text-[1.2em]" aria-label="Back" @click="back">←</button>
      <button type="button" class="truncate font-serif text-[1.15em] font-bold" @click="go({ kind: 'home' }, true)">
        {{ mobile ? screenTitle : appName }}
      </button>
      <nav v-if="!mobile" class="ml-auto flex items-center gap-[1.2em] text-[0.9em]">
        <button
          type="button"
          :class="screen.kind === 'home' ? 'underline underline-offset-4 font-bold' : 'opacity-85'"
          @click="go({ kind: 'home' }, true)"
        >
          Home
        </button>
        <button
          v-for="k in KINDS"
          :key="k.type"
          type="button"
          :class="screen.kind === 'list' && screen.type === k.type ? 'underline underline-offset-4 font-bold' : 'opacity-85'"
          @click="go({ kind: 'list', type: k.type }, true)"
        >
          {{ k.label }}
        </button>
      </nav>
      <button
        type="button"
        class="rounded-full border border-white/60 px-[0.9em] py-[0.2em] text-[0.7em] font-bold uppercase tracking-[0.06em]"
        :class="{ 'ml-auto': mobile }"
        @click="go({ kind: 'search' })"
      >
        Search
      </button>
      <span class="rounded-full border border-white/60 px-[0.7em] py-[0.15em] text-[0.7em] font-bold uppercase">{{ language ?? "—" }}</span>
    </header>

    <div v-if="suggestion" class="flex items-center gap-[0.8em] bg-[#f3eefa] px-[1.4em] py-[0.6em] text-[0.9em]">
      <span class="text-[#4c1d8b]">◎</span>
      <span class="flex-1">{{ suggestion.text }}</span>
      <button
        v-if="data.pois.some((p) => p.id === suggestion!.target.id)"
        type="button"
        class="font-bold text-[#4c1d8b]"
        @click="open(suggestion.target); suggestion = null"
      >
        Open
      </button>
      <button type="button" aria-label="Dismiss" class="text-[#6b7280]" @click="suggestion = null">×</button>
    </div>

    <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto">
      <!-- Home -->
      <div v-if="screen.kind === 'home'" :class="wide ? 'mx-auto max-w-[60em] px-[2em] py-[1.6em]' : 'px-[1.1em] py-[1.1em]'" class="flex flex-col gap-[1.6em]">
        <h1 class="font-serif text-[1.9em] font-bold">{{ appName }}</h1>
        <p v-if="!KINDS.some((k) => idsOf(k.type).length)" class="text-[#6b7280]">Nothing to show yet in this mode.</p>
        <section v-if="featured.length">
          <h2 class="mb-[0.6em] text-[0.8em] font-extrabold uppercase tracking-[0.08em] text-[#4c1d8b]">Highlights</h2>
          <div class="grid gap-[0.8em]" :class="wide ? 'grid-cols-3' : 'grid-cols-1'">
            <button v-for="c in featured.map(card)" :key="c.target.id" type="button" class="card" @click="open(c.target)">
              <img v-if="c.image" :src="c.image" alt="" class="mb-[0.5em] aspect-[16/9] w-full rounded-[0.4em] object-cover" />
              <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
              <span v-if="c.summary" class="block text-[0.85em] text-[#6b7280]" :class="{ missing: c.summary.missing }">{{ c.summary.text }}</span>
            </button>
          </div>
        </section>
        <template v-for="k in KINDS" :key="k.type">
          <section v-if="idsOf(k.type).length">
            <div class="mb-[0.6em] flex items-baseline">
              <h2 class="text-[0.8em] font-extrabold uppercase tracking-[0.08em] text-[#4c1d8b]">{{ k.label }}</h2>
              <button type="button" class="ml-auto text-[0.8em] font-bold text-[#4c1d8b]" @click="go({ kind: 'list', type: k.type })">See all</button>
            </div>
            <div class="grid gap-[0.8em]" :class="wide ? 'grid-cols-4' : 'grid-cols-2'">
              <button
                v-for="c in idsOf(k.type).slice(0, wide ? 4 : 2).map((id) => card({ type: k.type, id }))"
                :key="c.target.id"
                type="button"
                class="card"
                @click="open(c.target)"
              >
                <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
                <span v-if="c.summary" class="line-clamp-3 block text-[0.85em] text-[#6b7280]" :class="{ missing: c.summary.missing }">{{ c.summary.text }}</span>
              </button>
            </div>
          </section>
        </template>
      </div>

      <!-- A list per kind -->
      <div v-else-if="screen.kind === 'list'" :class="wide ? 'mx-auto max-w-[60em] px-[2em] py-[1.6em]' : 'px-[1.1em] py-[1.1em]'" class="flex flex-col gap-[1em]">
        <h1 v-if="!mobile" class="text-[1.7em] font-extrabold">{{ screenTitle }}</h1>
        <p v-if="!idsOf(screen.type).length" class="text-[#6b7280]">Nothing here yet.</p>
        <div class="grid gap-[0.8em]" :class="wide ? 'grid-cols-3' : 'grid-cols-1'">
          <button
            v-for="c in idsOf(screen.type).map((id) => card({ type: (screen as { type: Kind }).type, id }))"
            :key="c.target.id"
            type="button"
            class="card"
            @click="open(c.target)"
          >
            <img v-if="c.image" :src="c.image" alt="" class="mb-[0.5em] aspect-[16/9] w-full rounded-[0.4em] object-cover" />
            <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
            <span v-if="c.summary" class="line-clamp-3 block text-[0.85em] text-[#6b7280]" :class="{ missing: c.summary.missing }">{{ c.summary.text }}</span>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div v-else-if="screen.kind === 'search'" :class="wide ? 'mx-auto max-w-[48em] px-[2em] py-[1.6em]' : 'px-[1.1em] py-[1.1em]'" class="flex flex-col gap-[1em]">
        <input v-model="query" type="search" placeholder="Search titles, summaries, and exhibit numbers" class="w-full rounded-full border border-[#d1d5db] px-[1em] py-[0.6em]" />
        <p v-if="query.trim() && !results.length" class="text-[#6b7280]">No results.</p>
        <button v-for="c in results" :key="c.target.type + c.target.id" type="button" class="card" @click="open(c.target)">
          <span class="block text-[0.7em] font-bold uppercase tracking-[0.06em] text-[#6b7280]">{{ KINDS.find((k) => k.type === c.target.type)!.label }}</span>
          <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
        </button>
      </div>

      <!-- Detail -->
      <template v-else-if="screen.kind === 'detail'">
        <div v-if="screen.note" class="bg-[#e1f3ea] px-[1.4em] py-[0.5em] text-[0.8em] font-semibold text-[#17643f]">{{ screen.note }}</div>
        <ResourceContent v-if="detail" :model="detail" :wide="wide" navigable @open="open($event)" />
      </template>
    </div>

    <!-- On mobile the menu is a bottom bar. -->
    <nav v-if="mobile" class="grid grid-cols-6 border-t border-[#e5e7eb] bg-white text-[0.62em] font-semibold">
      <button type="button" class="py-[0.9em]" :class="screen.kind === 'home' ? 'text-[#4c1d8b]' : 'text-[#6b7280]'" @click="go({ kind: 'home' }, true)">Home</button>
      <button
        v-for="k in KINDS"
        :key="k.type"
        type="button"
        class="truncate px-[0.2em] py-[0.9em]"
        :class="screen.kind === 'list' && screen.type === k.type ? 'text-[#4c1d8b]' : 'text-[#6b7280]'"
        @click="go({ kind: 'list', type: k.type }, true)"
      >
        {{ k.label }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
.card {
  display: block;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.6em;
  padding: 0.8em 0.9em;
  text-align: start;
  background: #fff;
}
.card:hover {
  border-color: #4c1d8b;
}
.missing {
  outline: 2px dashed #dc2626;
  outline-offset: 2px;
}
</style>
